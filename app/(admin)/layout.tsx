// src/app/admin/dashboard/layout.tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { checkDatabaseHealth } from '@/lib/supabase/health';
import AdminDashboardShell from './AdminDashboardShell';

export const dynamic = 'force-dynamic';

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

export default async function AdminDashboardLayout({
  children,
}: AdminDashboardLayoutProps) {
  // Demo mode: show the admin shell so the dashboard can be previewed.
  if (!isSupabaseConfigured) {
    return (
      <AdminDashboardShell
        fullName="Store Admin"
        email="admin@sallyskincare.com"
      >
        {children}
      </AdminDashboardShell>
    );
  }

  // Connected project but no tables yet: still render the shell so /admin/setup
  // is reachable, and show what is missing instead of crashing on redirects.
  const database = await checkDatabaseHealth();
  const setupRequired = !database.initialized;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (setupRequired) {
      return (
        <AdminDashboardShell
          fullName="Setup required"
          email=""
          setupRequired
          missingTables={database.missingTables}
        >
          {children}
        </AdminDashboardShell>
      );
    }
    redirect('/login?redirect=/admin/setup');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError && !setupRequired) {
    console.error('[admin] profile lookup failed:', profileError.message);
    redirect('/login?redirect=/admin/setup');
  }

  if (!profile) {
    // Signed in but the profiles row/table is missing (schema not seeded, or the
    // auth trigger has not run). Send the admin to setup rather than the home page.
    return (
      <AdminDashboardShell
        fullName="Setup required"
        email={user.email ?? ''}
        setupRequired
        missingTables={database.missingTables}
      >
        {children}
      </AdminDashboardShell>
    );
  }

  if (profile.role !== 'admin') {
    redirect('/');
  }

  return (
    <AdminDashboardShell
      fullName={profile.full_name || 'Administrator'}
      email={profile.email || user.email || ''}
      setupRequired={setupRequired}
      missingTables={database.missingTables}
    >
      {children}
    </AdminDashboardShell>
  );
}