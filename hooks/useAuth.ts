// src/hooks/useAuth.ts
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Profile } from '@/types';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

// ✅ Singleton supabase client - created once outside the hook
const supabase = createClient();

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
    // ✅ Only initialize once
    if (initialized.current) return;
    initialized.current = true;

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (data) setProfile(data as Profile);
    };

    // Initialize auth state
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // ✅ Listen for auth changes - properly typed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    reset();
    router.push('/');
    router.refresh();
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
  };
}