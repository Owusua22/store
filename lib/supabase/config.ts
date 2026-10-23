// lib/supabase/config.ts
// Central place to detect whether Supabase credentials are available.
// When they are not, the app runs in "demo mode" with the bundled skincare
// catalogue so the storefront is fully browsable without a backend.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const supabaseUrl = url;
export const supabaseAnonKey = anonKey;

export const isSupabaseConfigured = isValidUrl(url) && anonKey.length > 20;

export const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const isSupabaseAdminConfigured =
  isSupabaseConfigured && serviceRoleKey.length > 20;

/** true when the app has no live backend and falls back to demo data */
export const isDemoMode = !isSupabaseConfigured;
