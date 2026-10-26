// lib/supabase/health.ts
// Detects whether the connected Supabase project actually has this app's
// schema. A brand-new project has no tables, which used to surface as raw
// PGRST205 errors and HTTP 500s — now it becomes a clear "setup required" state.

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const SETUP_REQUIRED = 'SETUP_REQUIRED' as const;

export const CORE_TABLES = [
  'profiles',
  'categories',
  'skin_types',
  'products',
  'product_variants',
  'inventory_movements',
  'banners',
  'showrooms',
  'carts',
  'cart_items',
  'orders',
  'order_items',
  'shipping_zones',
  'blog_posts',
] as const;

export interface DatabaseHealth {
  configured: boolean;
  reachable: boolean;
  initialized: boolean;
  missingTables: string[];
  error: string | null;
  checkedAt: string;
}

let cache: { value: DatabaseHealth; at: number } | null = null;
const CACHE_MS = 20_000;

/** Postgres/PostgREST errors that mean "this table does not exist yet". */
export function isSchemaMissingError(error: unknown): boolean {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : JSON.stringify(error ?? '');

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    /schema cache/i.test(message) ||
    /does not exist/i.test(message) ||
    /could not find the table/i.test(message) ||
    /relation .* does not exist/i.test(message)
  );
}

/** True when Supabase itself is reachable but credentials/URL are wrong. */
function isConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /fetch failed|ENOTFOUND|ECONNREFUSED|Invalid API key|JWT|network/i.test(message);
}

async function tableExists(client: SupabaseClient, table: string): Promise<boolean> {
  // A real row request (not HEAD) so PostgREST returns the PGRST205 body that
  // tells us the table is missing. `limit(1)` keeps it cheap.
  const { error } = await client.from(table).select('id').limit(1);
  if (!error) return true;
  if (isSchemaMissingError(error)) return false;
  throw error;
}

export async function checkDatabaseHealth(force = false): Promise<DatabaseHealth> {
  if (!isSupabaseConfigured) {
    return {
      configured: false,
      reachable: false,
      initialized: false,
      missingTables: [...CORE_TABLES],
      error: null,
      checkedAt: new Date().toISOString(),
    };
  }

  if (!force && cache && Date.now() - cache.at < CACHE_MS) {
    return cache.value;
  }

  const base: DatabaseHealth = {
    configured: true,
    reachable: false,
    initialized: false,
    missingTables: [],
    error: null,
    checkedAt: new Date().toISOString(),
  };

  try {
    const client = await createServerSupabaseClient();

    // Fast path: two sentinel tables. A healthy project answers in 2 queries
    // instead of 14; only a broken/partial schema triggers the full scan so the
    // setup screen can list exactly what is missing.
    const [hasProducts, hasProfiles] = await Promise.all([
      tableExists(client, 'products'),
      tableExists(client, 'profiles'),
    ]);

    let missing: string[] = [];

    if (!hasProducts || !hasProfiles) {
      const results = await Promise.all(
        CORE_TABLES.map(async (table) => ({ table, exists: await tableExists(client, table) }))
      );
      missing = results.filter((result) => !result.exists).map((result) => result.table);
    }
    const health: DatabaseHealth = {
      ...base,
      reachable: true,
      initialized: missing.length === 0,
      missingTables: missing,
    };
    cache = { value: health, at: Date.now() };
    return health;
  } catch (error) {
    const health: DatabaseHealth = {
      ...base,
      reachable: false,
      missingTables: [...CORE_TABLES],
      error:
        isConnectionError(error) || isSchemaMissingError(error)
          ? error instanceof Error
            ? error.message
            : String(error)
          : error instanceof Error
            ? error.message
            : 'Unknown database error',
    };
    cache = { value: health, at: Date.now() };
    return health;
  }
}

/** Shared 503 payload so every route answers a missing schema the same way. */
export function setupRequiredResponse(error?: string) {
  return NextResponse.json(
    {
      success: false,
      setupRequired: true,
      error:
        error ??
        'The database has not been initialised. Run supabase/schema.sql in the Supabase SQL editor, then reload.',
      hint: 'Admin → Setup has the exact SQL to paste.',
    },
    { status: 503 }
  );
}

// Only warn once per process per context so a missing table cannot flood logs.
const logged = new Set<string>();

/**
 * Logs a Supabase error, collapsing "table missing" noise into one actionable
 * line per call site.
 */
export function logDatabaseError(context: string, error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error ?? 'Unknown error');

  if (isSchemaMissingError(error)) {
    if (!logged.has(context)) {
      logged.add(context);
      console.warn(
        `[db] ${context}: tables missing. Run supabase/schema.sql (and seed.sql) in the Supabase SQL editor — see /admin/setup.`
      );
    }
    return;
  }

  if (!logged.has(`${context}:${message}`)) {
    logged.add(`${context}:${message}`);
    console.error(`[db] ${context}: ${message}`);
  }
}

/** Quick boolean for pages that only need "should I show the setup notice?". */
export async function isDatabaseInitialized(): Promise<boolean> {
  const health = await checkDatabaseHealth();
  return health.initialized;
}
