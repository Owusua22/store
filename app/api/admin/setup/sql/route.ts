// app/api/admin/setup/sql/route.ts
// Serves supabase/schema.sql and supabase/seed.sql as plain text so the admin
// setup screen can offer a copy button instead of hunting in the repo.
import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { requireAdmin } from '@/lib/admin/guard';
import { isDemoMode } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

const FILES = new Set(['schema', 'seed']);

export async function GET(request: Request) {
  if (!isDemoMode) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;
  } else {
    // In demo mode only expose the schema text (it is public in the repo anyway).
    const { searchParams } = new URL(request.url);
    if (!FILES.has(searchParams.get('file') ?? 'schema')) {
      return NextResponse.json({ success: false, error: 'Unknown file' }, { status: 400 });
    }
  }

  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file') ?? 'schema';

  if (!FILES.has(file)) {
    return NextResponse.json({ success: false, error: 'Unknown file' }, { status: 400 });
  }

  try {
    const sqlPath = path.join(process.cwd(), 'supabase', `${file}.sql`);
    const sql = await readFile(sqlPath, 'utf8');

    return new NextResponse(sql, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? `Could not read supabase/${file}.sql: ${error.message}`
            : 'Could not read the SQL file',
      },
      { status: 404 }
    );
  }
}
