// src/hooks/useAuth.ts
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { Profile } from '@/types';
import type { Session, AuthChangeEvent, User } from '@supabase/supabase-js';

// ✅ Singleton supabase client - null when running in demo mode
const supabase = createClient();

const DEMO_USER_KEY = 'glowup-demo-user';
const DEMO_ACCOUNT_KEY = 'glowup-demo-account';
// Legacy key from the previous brand name — cleared on sign out.
const LEGACY_DEMO_KEYS = ['sally-demo-user'];

interface DemoUserRecord {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

function readDemoUser(): DemoUserRecord | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(DEMO_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoUserRecord;
  } catch {
    return null;
  }
}

function writeDemoUser(user: DemoUserRecord | null) {
  if (typeof window === 'undefined') return;

  try {
    if (user) {
      window.localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(DEMO_USER_KEY);
    }
  } catch {
    /* ignore storage errors */
  }
}

function writeDemoAccount(user: DemoUserRecord | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      window.localStorage.setItem(DEMO_ACCOUNT_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(DEMO_ACCOUNT_KEY);
    }
  } catch {
    /* ignore storage errors */
  }
}

/** Remove every trace of a signed-in demo session. */
function clearDemoAuth() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(DEMO_USER_KEY);
    for (const key of LEGACY_DEMO_KEYS) window.localStorage.removeItem(key);
  } catch {
    /* ignore storage errors */
  }
}

function toSupabaseUser(user: DemoUserRecord): User {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone ?? '',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: user.full_name },
    created_at: user.created_at,
    updated_at: user.created_at,
  } as unknown as User;
}

function toSupabaseSession(user: DemoUserRecord): Session {
  const now = Math.floor(Date.now() / 1000);

  return {
    access_token: `demo.${user.id}.${now}`,
    refresh_token: `demo-refresh.${user.id}`,
    token_type: 'bearer',
    expires_in: 60 * 60 * 24 * 30,
    expires_at: now + 60 * 60 * 24 * 30,
    user: toSupabaseUser(user),
  } as Session;
}

function toProfile(user: DemoUserRecord): Profile {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: null,
    role: 'customer',
    phone: user.phone,
    created_at: user.created_at,
    updated_at: user.created_at,
  };
}

function demoId(seed: string) {
  return `demo-${seed.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 24)}`;
}

export function useAuth() {
  const router = useRouter();
  const {
    user,
    session,
    profile,
    isLoading,
    setUser,
    setSession,
    setProfile,
    setLoading,
    reset,
  } = useAuthStore();

  // ✅ Use ref to prevent multiple initializations
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // ── Demo mode: authenticate against localStorage ──
    if (!isSupabaseConfigured || !supabase) {
      const demoUser = readDemoUser();

      if (demoUser) {
        setSession(toSupabaseSession(demoUser));
        setUser(toSupabaseUser(demoUser));
        setProfile(toProfile(demoUser));
      }

      setLoading(false);
      return;
    }

    const client = supabase;

    const fetchProfile = async (userId: string) => {
      const { data } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (data) setProfile(data as Profile);
    };

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await client.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      let account: DemoUserRecord | null = null;
      try {
        const raw = window.localStorage.getItem(DEMO_ACCOUNT_KEY);
        account = raw ? (JSON.parse(raw) as DemoUserRecord) : null;
      } catch {
        account = null;
      }

      const record: DemoUserRecord = {
        id: demoId(email),
        email,
        full_name:
          account && account.email === email
            ? account.full_name
            : email.split('@')[0].replace(/[._-]+/g, ' '),
        phone: account && account.email === email ? account.phone : null,
        created_at: new Date().toISOString(),
      };

      writeDemoUser(record);
      setSession(toSupabaseSession(record));
      setUser(toSupabaseUser(record));
      setProfile(toProfile(record));
      setLoading(false);

      return { user: toSupabaseUser(record), session: toSupabaseSession(record) };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  /**
   * Create an account. Registration never leaves the user signed in: the auth
   * dialog switches to its sign-in view afterwards, and we clear any session
   * Supabase created when email confirmation is disabled.
   */
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ): Promise<{ user: User | null; needsEmailConfirmation: boolean }> => {
    const contact = (phone ?? '').trim();

    if (!isSupabaseConfigured || !supabase) {
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }
      if (contact.replace(/\D/g, '').length < 9) {
        throw new Error('Please enter a valid contact number.');
      }

      // Demo mode has no backend to confirm emails, so store the account and let
      // the user sign in with it from /login.
      const record: DemoUserRecord = {
        id: demoId(email),
        email,
        full_name: fullName.trim() || email.split('@')[0],
        phone: contact,
        created_at: new Date().toISOString(),
      };

      writeDemoAccount(record);

      return { user: toSupabaseUser(record), needsEmailConfirmation: false };
    }

    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // `phone` is read by the handle_new_user() trigger in supabase/schema.sql,
        // so the contact number lands on the profile automatically.
        data: { full_name: fullName, phone: contact || null },
        // After confirming, land back on the storefront with the sign-in dialog
        // already open (there is no /login page any more).
        emailRedirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(
          '/?auth=login&registered=1'
        )}`,
      },
    });
    if (error) throw error;

    // Email confirmation disabled → Supabase signs the user in immediately.
    // Registration must still end on the sign-in screen, so drop that session.
    if (data.session) {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => null);
      reset();
    }

    return { user: data.user, needsEmailConfirmation: !data.session };
  };

  /** Re-send the "confirm your email" message from the sign-in dialog. */
  const resendConfirmation = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Demo mode: no confirmation email is needed — just sign in.');
    }

    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL ?? '';

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(
          '/?auth=login&registered=1'
        )}`,
      },
    });
    if (error) throw error;
  };

  /**
   * Sign out everywhere: revoke the session server-side (which clears the httpOnly
   * auth cookies the proxy reads), wipe the local session, then hard-navigate so
   * no cached server render can show the previous user.
   */
  const signOut = async () => {
    clearDemoAuth();

    try {
      await Promise.all([
        fetch('/api/auth/signout', { method: 'POST', credentials: 'same-origin' }).catch(
          () => null
        ),
        supabase
          ? supabase.auth.signOut({ scope: 'local' }).catch(() => null)
          : Promise.resolve(null),
      ]);
    } catch {
      // A failed network call must never keep the user signed in locally.
    } finally {
      reset();

      if (typeof window !== 'undefined') {
        window.location.assign('/');
      } else {
        router.push('/');
        router.refresh();
      }
    }
  };

  return {
    user,
    session,
    profile,
    isLoading,
    isAdmin: profile?.role === 'admin',
    isAuthenticated: !!session,
    signIn,
    signUp,
    signOut,
    resendConfirmation,
  };
}
