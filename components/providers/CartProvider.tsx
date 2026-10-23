// src/components/providers/CartProvider.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/stores/authStore';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { fetchCart, setCart } = useCart();
  const { session, isLoading } = useAuthStore();
  const hasFetched = useRef(false);
  const prevSession = useRef<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    const currentUserId = session?.user?.id ?? null;
    const prevUserId = prevSession.current;
    prevSession.current = currentUserId;

    // ✅ User just logged in
    if (currentUserId && currentUserId !== prevUserId) {
      hasFetched.current = true;
      fetchCart();
    }

    // ✅ User just logged out
    if (!currentUserId && prevUserId) {
      hasFetched.current = false;
      setCart(null);
    }
  }, [session?.user?.id, isLoading, fetchCart, setCart]);

  return <>{children}</>;
}