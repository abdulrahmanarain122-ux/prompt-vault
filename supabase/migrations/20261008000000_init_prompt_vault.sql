-- ============================================================================
-- Prompt Vault: Database Schema & Row Level Security (RLS) Migration
-- File: supabase/migrations/20261008000000_init_prompt_vault.sql
-- ============================================================================

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (Public user profiles with author attribution)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(40) UNIQUE NOT NULL,
  display_name VARCHAR(80),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger function to automatically create profile record when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'creator_' || substr(NEW.id::text, 1, 8)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. PROMPTS TABLE (Main cloud vault and public community prompts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(50) NOT NULL,
  body TEXT NOT NULL,
  visibility VARCHAR(10) NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  engine VARCHAR(80) DEFAULT NULL,
  aspect_ratio VARCHAR(20) DEFAULT NULL,
  tags TEXT[] DEFAULT '{}',
  negative_prompt TEXT DEFAULT NULL,
  copy_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. PROMPT REPORTS TABLE (Abuse prevention and community moderation)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prompt_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. PERFORMANCE & FULL-TEXT SEARCH INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_prompts_visibility ON public.prompts(visibility);
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON public.prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_copy_count ON public.prompts(copy_count DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_fts ON public.prompts USING GIN (to_tsvector('english', title || ' ' || body));

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_reports ENABLE ROW LEVEL SECURITY;

-- --- Profiles RLS ---
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owner update profile" ON public.profiles;
CREATE POLICY "Owner update profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- --- Prompts RLS ---
-- 1. SELECT: Public prompts are readable by anyone (anon + auth).
--             Private prompts are readable ONLY by their creator.
DROP POLICY IF EXISTS "Prompts read access" ON public.prompts;
CREATE POLICY "Prompts read access"
  ON public.prompts FOR SELECT
  USING (
    visibility = 'public'
    OR (auth.role() = 'authenticated' AND auth.uid() = user_id)
  );

-- 2. INSERT: Authenticated users can insert prompts for themselves.
DROP POLICY IF EXISTS "Authenticated users insert prompts" ON public.prompts;
CREATE POLICY "Authenticated users insert prompts"
  ON public.prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: Only the prompt owner can modify title, body, visibility, or metadata.
DROP POLICY IF EXISTS "Owners update prompts" ON public.prompts;
CREATE POLICY "Owners update prompts"
  ON public.prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. DELETE: Only the prompt owner can delete.
DROP POLICY IF EXISTS "Owners delete prompts" ON public.prompts;
CREATE POLICY "Owners delete prompts"
  ON public.prompts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- --- Prompt Reports RLS ---
DROP POLICY IF EXISTS "Anyone report public prompt" ON public.prompt_reports;
CREATE POLICY "Anyone report public prompt"
  ON public.prompt_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prompts
      WHERE prompts.id = prompt_reports.prompt_id
      AND prompts.visibility = 'public'
    )
  );

-- ----------------------------------------------------------------------------
-- 6. SECURITY DEFINER RPC: Public Safe Copy Increment
-- ----------------------------------------------------------------------------
-- Allows anonymous or authenticated visitors to increment the copy_count
-- of a public prompt without granting UPDATE permissions on the table.
CREATE OR REPLACE FUNCTION public.increment_prompt_copy_count(target_prompt_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.prompts
  SET copy_count = copy_count + 1
  WHERE id = target_prompt_id AND visibility = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
