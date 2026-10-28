'use client';

import { useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { fetchCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  // Demo mode keeps the cart in localStorage, so hydrate it on first paint.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      fetchCart();
    }
  }, [fetchCart]);

  return <>{children}</>;
}
