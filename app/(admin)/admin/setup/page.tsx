import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { checkDatabaseHealth } from '@/lib/supabase/health';
import { getR2Status } from '@/lib/r2/client';
import { isDemoMode } from '@/lib/supabase/config';
import SetupClient from './SetupClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Setup — Glow-Up admin',
};

export default async function SetupPage() {
  const [database, storage] = await Promise.all([
    checkDatabaseHealth(true),
    Promise.resolve(getR2Status()),
  ]);

  return (
    <div>
      <Link
        href="/admin/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-gray-500 hover:text-red-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>

      <SetupClient
        initialDatabase={database}
        initialStorage={storage}
        demoMode={isDemoMode}
      />
    </div>
  );
}
