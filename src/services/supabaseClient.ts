import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = 'https://jkyqvvdirtdxwcnzhcki.supabase.co';
const defaultKey = 'sb_publishable_s3-rLrxxGY-8jBgN9K4s2A_sdaPSHV7';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || defaultUrl;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || defaultKey;

const sanitizedUrl = supabaseUrl
  ? supabaseUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : defaultUrl;

/**
 * Returns true if real Supabase environment variables are provided.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    sanitizedUrl &&
    supabaseAnonKey &&
    sanitizedUrl !== '' &&
    supabaseAnonKey.trim() !== '' &&
    !sanitizedUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-key')
  );
}

// Fallback credentials if not yet configured, preventing constructor crash
const fallbackUrl = defaultUrl;
const fallbackKey = defaultKey;

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? sanitizedUrl! : fallbackUrl,
  isSupabaseConfigured() ? supabaseAnonKey!.trim() : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
