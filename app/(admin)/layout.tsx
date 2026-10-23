// src/app/admin/dashboard/layout.tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import AdminDashboardShell from './AdminDashboardShell';

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

export default async function AdminDashboardLayout({
  children,
}: AdminDashboardLayoutProps) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    redirect('/');
  }

  return (
    <AdminDashboardShell
      fullName={profile.full_name || 'Administrator'}
      email={profile.email || user.email || ''}
    >
      {children}
    </AdminDashboardShell>
  );
}