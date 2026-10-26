// app/api/admin/setup/health/route.ts
// Admin-only readiness report: database schema, storage and demo state.
import { NextResponse } from 'next/server';

import { checkDatabaseHealth } from '@/lib/supabase/health';
import { getR2Status } from '@/lib/r2/client';
import { isDemoMode } from '@/lib/supabase/config';
import { requireAdmin } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await checkDatabaseHealth(true);
  const storage = getR2Status();

  if (isDemoMode) {
    return NextResponse.json({
      success: true,
      demo: true,
      database: health,
      storage,
      ready: false,
    });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const counts = await Promise.all(
    ['products', 'categories', 'blog_posts', 'orders', 'shipping_zones'].map(async (table) => {
      if (!health.initialized) return { table, count: 0 };
      const { count } = await guard.db.from(table).select('id', { count: 'exact', head: true });
      return { table, count: count ?? 0 };
    })
  );

  return NextResponse.json({
    success: true,
    ready: health.initialized && storage.configured,
    database: health,
    storage,
    counts,
  });
}
