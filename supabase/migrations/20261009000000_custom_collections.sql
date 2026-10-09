-- ============================================================================
-- Prompt Vault: Custom Collections & Collection Memberships Migration
-- File: supabase/migrations/20261009000000_custom_collections.sql
-- ============================================================================

-- 1. COLLECTIONS TABLE
-- Represents user-created collections that group prompts.
-- Collections are private by default; public collections are viewable according to RLS.
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  visibility VARCHAR(10) NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT collections_name_not_blank CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 100)
);

-- 2. COLLECTION MEMBERSHIPS TABLE
-- Multi-membership relational join table: prompts can belong to multiple collections.
-- Membership changes never delete the underlying prompt.
CREATE TABLE IF NOT EXISTS public.collection_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_collection_prompt UNIQUE (collection_id, prompt_id)
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_visibility ON public.collections(visibility);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON public.collections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collection_memberships_col ON public.collection_memberships(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_memberships_prompt ON public.collection_memberships(prompt_id);

-- 4. ROW LEVEL SECURITY: COLLECTIONS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- SELECT: Public collections are readable by anyone; private collections ONLY by owner.
DROP POLICY IF EXISTS "Collections read access" ON public.collections;
CREATE POLICY "Collections read access"
  ON public.collections FOR SELECT
  USING (
    visibility = 'public'
    OR (auth.role() = 'authenticated' AND auth.uid() = user_id)
  );

-- INSERT: Authenticated users can only create collections for themselves.
DROP POLICY IF EXISTS "Authenticated users create collections" ON public.collections;
CREATE POLICY "Authenticated users create collections"
  ON public.collections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only collection owner can update collection metadata.
DROP POLICY IF EXISTS "Owners update collections" ON public.collections;
CREATE POLICY "Owners update collections"
  ON public.collections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Only collection owner can delete collection.
DROP POLICY IF EXISTS "Owners delete collections" ON public.collections;
CREATE POLICY "Owners delete collections"
  ON public.collections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. ROW LEVEL SECURITY: COLLECTION MEMBERSHIPS
ALTER TABLE public.collection_memberships ENABLE ROW LEVEL SECURITY;

-- SELECT: Owner can view all memberships in their collections.
-- Public collections ONLY reveal members whose prompts are ALSO public!
-- Never leak private member prompt text, IDs, or metadata to unauthorized viewers.
DROP POLICY IF EXISTS "Memberships read access" ON public.collection_memberships;
CREATE POLICY "Memberships read access"
  ON public.collection_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_memberships.collection_id
      AND c.user_id = auth.uid()
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.collections c
        WHERE c.id = collection_memberships.collection_id
        AND c.visibility = 'public'
      )
      AND EXISTS (
        SELECT 1 FROM public.prompts p
        WHERE p.id = collection_memberships.prompt_id
        AND p.visibility = 'public'
      )
    )
  );

-- INSERT: Only the collection owner may add prompts, and only prompts they are authorized to access.
DROP POLICY IF EXISTS "Owners insert memberships" ON public.collection_memberships;
CREATE POLICY "Owners insert memberships"
  ON public.collection_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_memberships.collection_id
      AND c.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.prompts p
      WHERE p.id = collection_memberships.prompt_id
      AND (p.visibility = 'public' OR p.user_id = auth.uid())
    )
  );

-- DELETE: Only the collection owner may remove prompt memberships.
DROP POLICY IF EXISTS "Owners delete memberships" ON public.collection_memberships;
CREATE POLICY "Owners delete memberships"
  ON public.collection_memberships FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_memberships.collection_id
      AND c.user_id = auth.uid()
    )
  );
