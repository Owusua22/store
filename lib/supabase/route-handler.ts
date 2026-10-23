// src/lib/supabase/route-handler.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createRouteHandlerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Server Component context - cookies are immutable
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Server Component context - cookies are immutable
          }
        },
      },
    }
  );
}

/**
 * Get authenticated user by verifying token with Supabase Auth server.
 * Returns null if not authenticated.
 * No parameters needed - creates its own supabase client.
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('getAuthenticatedUser error:', error);
    return null;
  }
}