import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const sanitizedUrl = supabaseUrl
  ? supabaseUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : undefined;

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

// Fallback placeholder credentials if not yet configured, preventing constructor crash
const fallbackUrl = 'https://placeholder-vault.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

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
