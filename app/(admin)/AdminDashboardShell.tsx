// src/app/(admin)/AdminDashboardShell.tsx
'use client';

import type { ReactNode, MouseEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, ShieldCheck, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';

interface AdminDashboardShellProps {
  children: ReactNode;
  fullName: string;
  email: string;
}

interface AdminMobileChromeProps {
  fullName: string;
  email: string;
}

function AdminMobileChrome({ fullName, email }: AdminMobileChromeProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => {
    setMobileSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  /**
   * Lock body scroll while the mobile menu is open.
   * This effect only syncs with the DOM and does not call setState directly.
   */
  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  /**
   * Close sidebar on Escape.
   * setState is called inside an event callback, not synchronously in the effect body.
   */
  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileSidebarOpen, closeSidebar]);

  /**
   * Close the mobile drawer when a sidebar link is clicked.
   */
  const handleSidebarClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) return;

    const link = target.closest('a[href]');

    if (link) {
      closeSidebar();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close admin menu"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 max-w-[86vw] overflow-hidden bg-white shadow-2xl transition-transform duration-300 lg:hidden',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!mobileSidebarOpen}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">
                Admin Menu
              </p>
              <p className="truncate text-xs text-slate-500">
                {email}
              </p>
            </div>

            <button
              type="button"
              onClick={closeSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto"
            onClickCapture={handleSidebarClickCapture}
          >
            <Sidebar fullName={fullName} email={email} />
          </div>
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={openSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 px-3">
          <p className="truncate text-sm font-black text-slate-950">
            Admin Dashboard
          </p>
          <p className="truncate text-xs text-slate-500">
            {fullName}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <ShieldCheck className="h-5 w-5" />
        </div>
      </header>
    </>
  );
}

export default function AdminDashboardShell({
  children,
  fullName,
  email,
}: AdminDashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      {/*
        Keying the mobile chrome by pathname resets its local sidebar state
        on navigation without using setState inside an effect.
      */}
      <AdminMobileChrome
        key={pathname}
        fullName={fullName}
        email={email}
      />

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-72 lg:overflow-y-auto lg:border-r lg:border-slate-200 lg:bg-white">
        <Sidebar fullName={fullName} email={email} />
      </aside>

      {/* Main area */}
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-72">
        {/* Desktop topbar */}
        <header className="hidden h-16 items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              Welcome back
            </p>
            <h1 className="text-lg font-black text-slate-950">
              Admin Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-sm font-black text-white">
              {fullName?.[0]?.toUpperCase() || 'A'}
            </div>

            <div className="min-w-0">
              <p className="max-w-48 truncate text-sm font-bold text-slate-950">
                {fullName}
              </p>
              <p className="max-w-48 truncate text-xs text-slate-500">
                {email}
              </p>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}