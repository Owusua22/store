// lib/admin/guard.ts
// Shared server-side guard for every /api/admin/* route.
//
//   const guard = await requireAdmin();
//   if (!guard.ok) return guard.response;
//   guard.db  -> service-role Supabase client (bypasses RLS)

import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  createRouteHandlerSupabaseClient,
  getAuthenticatedUser,
} from '@/lib/supabase/route-handler';
import {
  isDemoMode,
  isSupabaseAdminConfigured,
  serviceRoleKey,
  supabaseUrl,
} from '@/lib/supabase/config';
import { isSchemaMissingError, setupRequiredResponse } from '@/lib/supabase/health';

export type AdminGuard =
  | { ok: true; db: SupabaseClient; userId: string; email: string | null }
  | { ok: false; response: NextResponse };

function fail(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

/** Service-role client — server only, never import from a client component. */
export function getAdminClient(): SupabaseClient {
  if (!isSupabaseAdminConfigured) {
    throw new Error(
      'Supabase admin client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function requireAdmin(): Promise<AdminGuard> {
  if (isDemoMode) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          demo: true,
          error:
            'Demo mode: add your Supabase keys to .env.local to manage the live catalogue.',
        },
        { status: 503 }
      ),
    };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return { ok: false, response: fail('Unauthorized', 401) };
  }

  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      // No profile row: either the schema is missing or the auth trigger has
      // not run for this user yet.
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            setupRequired: true,
            error:
              'No profile found for this account. Run supabase/schema.sql, then promote yourself: update public.profiles set role = \'admin\' where id = \'<user-uuid>\';',
          },
          { status: 503 }
        ),
      };
    }

    if (profile.role !== 'admin') {
      return { ok: false, response: fail('Forbidden — admin access required', 403) };
    }
  } catch (error) {
    if (isSchemaMissingError(error)) {
      return { ok: false, response: setupRequiredResponse() };
    }
    console.error('requireAdmin: profile lookup failed', error);
    return { ok: false, response: fail('Could not verify admin access', 500) };
  }

  try {
    return { ok: true, db: getAdminClient(), userId: user.id, email: user.email ?? null };
  } catch (error) {
    return {
      ok: false,
      response: fail(error instanceof Error ? error.message : 'Admin client unavailable', 500),
    };
  }
}

export async function readJson(request: Request): Promise<
  { ok: true; body: Record<string, unknown> } | { ok: false; response: NextResponse }
> {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { ok: false, response: fail('Request body must be a JSON object', 400) };
    }
    return { ok: true, body: body as Record<string, unknown> };
  } catch {
    return { ok: false, response: fail('Invalid JSON body', 400) };
  }
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Ensure a slug is unique in `table`, appending -2, -3 … when taken. */
export async function uniqueSlug(
  db: SupabaseClient,
  table: string,
  base: string,
  ignoreId?: string
): Promise<string> {
  const root = base || `item-${Date.now()}`;
  let candidate = root;
  let suffix = 2;

  for (let attempt = 0; attempt < 25; attempt += 1) {
    let query = db.from(table).select('id').eq('slug', candidate).limit(1);
    if (ignoreId) query = query.neq('id', ignoreId);
    const { data } = await query;
    if (!data || data.length === 0) return candidate;
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }

  return `${root}-${Date.now()}`;
}

/** Append an inventory movement (best-effort; never blocks the main write). */
export async function logInventoryChange(
  db: SupabaseClient,
  productId: string,
  change: number,
  reason: string,
  note: string | null,
  createdBy: string | null
) {
  try {
    await db.from('inventory_movements').insert({
      product_id: productId,
      change,
      reason,
      note,
      created_by: createdBy,
    });
  } catch (error) {
    console.error('logInventoryChange failed', error);
  }
}
