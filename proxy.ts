// proxy.ts  (at project root, alongside app/)
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from './lib/supabase/config';

const PROTECTED_ROUTES = ['/orders', '/checkout', '/profile'];
const ADMIN_ROUTES = ['/admin'];
// Auth lives in the global dialog, so there are no auth pages to bounce signed-in
// users away from — /login and /register are redirect stubs only.
const AUTH_ROUTE_STUBS = ['/login', '/register'];

/**
 * The storefront has no /login page: send the shopper home with the sign-in
 * dialog open, remembering where they were headed.
 */
function authDialogUrl(request: NextRequest, redirectTo: string) {
  const url = new URL('/', request.url);
  url.searchParams.set('auth', 'login');
  if (redirectTo && redirectTo !== '/') url.searchParams.set('redirect', redirectTo);
  return url;
}

// ✅ Renamed from `middleware` → `proxy`
export async function proxy(request: NextRequest) {
  // Demo mode (no Supabase credentials): never block navigation.
  if (!isSupabaseConfigured) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  if (session && AUTH_ROUTE_STUBS.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!session && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(authDialogUrl(request, pathname));
  }

  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!session) {
      return NextResponse.redirect(authDialogUrl(request, pathname));
    }

    // The setup screen must stay reachable even when the database has not been
    // initialised — otherwise nobody can get in to fix it.
    if (pathname === '/admin/setup' || pathname.startsWith('/admin/setup/')) {
      return response;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    // Profiles table missing (schema not run) or no row for this user: send the
    // admin to setup instead of bouncing silently to the homepage.
    if (error || !profile) {
      return NextResponse.redirect(new URL('/admin/setup', request.url));
    }

    if (profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // /api/auth/signout is excluded on purpose: the proxy refreshes the session
    // on every request, which would write the auth cookies straight back after
    // the sign-out route cleared them.
    '/((?!_next/static|_next/image|favicon.ico|api/auth/signout|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};