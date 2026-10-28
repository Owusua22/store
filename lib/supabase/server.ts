// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from './config';
import { createOfflineClient } from './offline';

/**
 * Server-side Supabase client bound to the request cookies.
 * Falls back to an offline stub when credentials are missing.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured) {
    return createOfflineClient() as SupabaseClient;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Component - middleware handles refresh
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // Server Component - middleware handles refresh
        }
      },
    },
  });
}

// ✅ Alias so `import { createClient } from '@/lib/supabase/server'` works too
export const createClient = createServerSupabaseClient;

export function createAdminSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    return createOfflineClient() as SupabaseClient;
  }

  return createSupabaseAdminClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
