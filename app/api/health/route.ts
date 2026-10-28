// app/api/health/route.ts
// Public readiness probe (no secrets): is Supabase configured, are the tables
// in place, is image storage wired. Handy for uptime monitors and for checking
// a fresh deployment.
import { NextResponse } from 'next/server';

import { checkDatabaseHealth } from '@/lib/supabase/health';
import { getR2Status } from '@/lib/r2/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [database, storage] = await Promise.all([
    checkDatabaseHealth(),
    Promise.resolve(getR2Status()),
  ]);

  const ready = database.initialized && storage.configured;

  return NextResponse.json(
    {
      success: true,
      ready,
      status: ready ? 'ready' : database.configured ? 'setup-required' : 'demo',
      checks: {
        database: {
          configured: database.configured,
          reachable: database.reachable,
          initialized: database.initialized,
          missingTables: database.missingTables,
        },
        storage: {
          configured: storage.configured,
          bucket: storage.bucket,
          publicUrlSet: Boolean(storage.publicUrl),
          missing: storage.missing,
        },
      },
      nextStep: ready
        ? null
        : !database.configured
          ? 'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.'
          : !database.initialized
            ? 'Run supabase/schema.sql then supabase/seed.sql in the Supabase SQL editor.'
            : 'Set the CLOUDFLARE_R2_* variables and enable public access on the bucket.',
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
