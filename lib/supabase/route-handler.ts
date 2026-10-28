// lib/supabase/route-handler.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from './config';
import { createOfflineClient } from './offline';

export async function createRouteHandlerSupabaseClient(): Promise<SupabaseClient> {
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
          // Server Component context - cookies are immutable
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // Server Component context - cookies are immutable
        }
      },
    },
  });
}

/**
 * Get authenticated user by verifying token with Supabase Auth server.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser() {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('getAuthenticatedUser error:', error);
    return null;
  }
}
