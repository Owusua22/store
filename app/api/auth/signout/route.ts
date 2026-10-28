// app/api/auth/signout/route.ts
// Server-side sign out. Clearing cookies here (and not only in the browser) is
// what makes "sign out" stick: the proxy/middleware reads the session cookie on
// the next navigation, so a cookie left behind would sign the user back in.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

const SUPABASE_COOKIE_PREFIXES = ['sb-', 'supabase-auth-token'];

async function clearAuthCookies() {
  const cookieStore = await cookies();
  const all = cookieStore.getAll();
  for (const cookie of all) {
    const isAuthCookie = SUPABASE_COOKIE_PREFIXES.some((prefix) =>
      cookie.name.toLowerCase().startsWith(prefix)
    );
    if (!isAuthCookie) continue;
    // Chunked tokens are separate cookie names (name.0, name.1 …) that this loop
    // also matches, and @supabase/ssr always uses the root path.
    cookieStore.set({ name: cookie.name, value: '', path: '/', maxAge: 0 });
  }
}

async function signOut(request: Request) {
  if (isSupabaseConfigured) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      });

      // Revoke the refresh token server-side, then make sure the cookies are gone
      // even if the call failed (expired token, offline, etc.).
      await supabase.auth.signOut().catch(() => null);
    } catch {
      // fall through to the cookie sweep
    }
  }

  await clearAuthCookies();

  const accept = request.headers.get('accept') ?? '';
  if (!accept.includes('application/json')) {
    // Plain browser navigation: send the user home. A relative Location keeps the
    // redirect on whatever host served the request (preview URLs, custom domains).
    return new NextResponse(null, { status: 303, headers: { Location: '/' } });
  }

  const response = NextResponse.json({ success: true });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function POST(request: Request) {
  return signOut(request);
}

// Lets <form action="/api/auth/signout" method="post"> and plain links work too.
export async function GET(request: Request) {
  return signOut(request);
}
