// components/layout/AppShell.tsx
'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import { DemoModeBanner } from '@/components/layout/DemoModeBanner';

interface AppShellProps {
  children: ReactNode;
}

function isAdminRoute(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? '';
  const adminRoute = isAdminRoute(pathname);

  if (adminRoute) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <AuthGuard>
        <CartProvider>
          <DemoModeBanner />
          <Navbar />

          <main className="min-h-[60vh] pb-16 md:pb-0">{children}</main>

          <Footer />
          <CartSidebar />
        </CartProvider>
      </AuthGuard>
    </ToastProvider>
  );
}
