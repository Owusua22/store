'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Database,
  ExternalLink,
  HardDrive,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';

import { AdminButton, AdminCard, AdminPageHeader, Badge } from '@/components/admin/ui';
import type { DatabaseHealth } from '@/lib/supabase/health';
import type { R2Status } from '@/lib/r2/client';

interface CountRow {
  table: string;
  count: number;
}

const TABLE_LABELS: Record<string, string> = {
  profiles: 'profiles (accounts + admin roles)',
  categories: 'categories',
  skin_types: 'skin_types',
  brands: 'brands (managed brand list)',
  products: 'products',
  product_variants: 'product_variants',
  inventory_movements: 'inventory_movements',
  banners: 'banners',
  showrooms: 'showrooms',
  carts: 'carts',
  cart_items: 'cart_items',
  orders: 'orders',
  order_items: 'order_items',
  shipping_zones: 'shipping_zones',
  blog_posts: 'blog_posts',
};

const BOOKKEEPING_LABELS: Record<string, string> = {
  suppliers: 'suppliers (who you buy from)',
  stock_purchases: 'stock_purchases (cost price, restocks)',
  expenses: 'expenses (rent, transport, data)',
};

export default function SetupClient({
  initialDatabase,
  initialStorage,
  demoMode,
}: {
  initialDatabase: DatabaseHealth;
  initialStorage: R2Status;
  demoMode: boolean;
}) {
  const [database, setDatabase] = useState(initialDatabase);
  const [storage, setStorage] = useState(initialStorage);
  const [counts, setCounts] = useState<CountRow[]>([]);
  const [checking, setChecking] = useState(false);
  const [copying, setCopying] = useState<string | null>(null);

  const recheck = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/admin/setup/health', { cache: 'no-store' });
      const payload = await response.json();

      if (payload.database) setDatabase(payload.database as DatabaseHealth);
      if (payload.storage) setStorage(payload.storage as R2Status);
      if (payload.counts) setCounts(payload.counts as CountRow[]);

      if (payload.ready) toast.success('Everything is connected — your store is live.');
      else if (!payload.database?.initialized) toast.error('Tables are still missing. Run schema.sql.');
      else toast.info('Database ready. Storage still needs attention.');
    } catch {
      toast.error('Could not run the check. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const copySql = async (file: 'schema' | 'seed') => {
    setCopying(file);
    try {
      const response = await fetch(`/api/admin/setup/sql?file=${file}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Could not load the SQL — open supabase/' + file + '.sql from the repo.');
      }
      const sql = await response.text();
      await navigator.clipboard.writeText(sql);
      toast.success(`supabase/${file}.sql copied — paste it into the Supabase SQL editor.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Copy failed');
    } finally {
      setCopying(null);
    }
  };

  const missingCount = database.missingTables.length;
  const sqlEditorUrl = 'https://supabase.com/dashboard/project/_/sql/new';
  const r2Url = 'https://dash.cloudflare.com/?to=/:account/r2/api-tokens';

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="Setup"
        description="Connect the database, storage and first admin account. This page tells you exactly what is missing."
        action={
          <AdminButton onClick={recheck} disabled={checking} variant="secondary">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Re-check
          </AdminButton>
        }
      />

      {/* Status summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <AdminCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                Database
              </p>
              <p className="mt-1.5 text-[15px] font-black text-gray-900">
                {demoMode
                  ? 'Not connected'
                  : !database.reachable
                    ? 'Unreachable'
                    : database.initialized
                      ? 'Ready'
                      : `${missingCount} table${missingCount === 1 ? '' : 's'} missing`}
              </p>
            </div>
            {demoMode || !database.initialized ? (
              <XCircle className="h-5 w-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                Image storage
              </p>
              <p className="mt-1.5 text-[15px] font-black text-gray-900">
                {storage.configured ? `Bucket “${storage.bucket}” ready` : 'Needs config'}
              </p>
            </div>
            {storage.configured ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-amber-500" />
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                Storefront
              </p>
              <p className="mt-1.5 text-[15px] font-black text-gray-900">
                {database.initialized ? 'Reading live data' : demoMode ? 'Demo catalogue' : 'Waiting for tables'}
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-red-600 hover:underline"
            >
              Open <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </AdminCard>
      </div>

      {/* Step 1 — database */}
      <AdminCard className="mb-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg bg-red-50 p-2 text-red-600">
            <Database className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <h2 className="text-[15px] font-extrabold text-gray-900">
              1. Create the database tables
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-gray-600">
              Open your Supabase project → <strong>SQL Editor</strong> → <strong>New query</strong>,
              then paste and run the two files below in order. Both are idempotent, so re-running
              them is safe.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <AdminButton onClick={() => copySql('schema')} disabled={copying === 'schema'}>
                {copying === 'schema' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ClipboardCopy className="h-4 w-4" />
                )}
                Copy schema.sql
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() => copySql('seed')}
                disabled={copying === 'seed'}
              >
                {copying === 'seed' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ClipboardCopy className="h-4 w-4" />
                )}
                Copy seed.sql
              </AdminButton>
              <a
                href={sqlEditorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                Open SQL editor <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-[11.5px] leading-relaxed text-gray-600">
              <p className="font-bold text-gray-800">Order matters</p>
              <p>
                1. <code>supabase/schema.sql</code> — tables, RLS policies, triggers.
                <br />
                2. <code>supabase/seed.sql</code> — categories, skin types, sample products,
                Ghana delivery zones, starter articles.
              </p>
              <p className="mt-2">
                Then make yourself an admin:
                <code className="mt-1 block break-all rounded bg-white px-2 py-1 font-mono text-[11px]">
                  update public.profiles set role = &apos;admin&apos; where email =
                  &apos;you@example.com&apos;;
                </code>
              </p>
            </div>

            {!database.initialized ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="flex items-center gap-1.5 text-[12px] font-bold text-amber-900">
                  <AlertTriangle className="h-3.5 w-3.5" /> Missing tables
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {database.missingTables.map((table) => (
                    <span
                      key={table}
                      className="rounded bg-white px-1.5 py-0.5 font-mono text-[10.5px] text-amber-800"
                    >
                      {table}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {Object.keys(TABLE_LABELS).map((table) => (
                  <span
                    key={table}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700"
                  >
                    <Check className="h-2.5 w-2.5" /> {table}
                  </span>
                ))}
              </div>
            )}

            <details className="mt-4 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
              <summary className="cursor-pointer text-[12px] font-bold text-gray-700">
                Accounting tables (cost prices, suppliers, expenses)
              </summary>
              <p className="mt-2 text-[11.5px] leading-relaxed text-gray-500">
                Re-run <code className="font-mono">supabase/schema.sql</code> to add these. The shop
                works without them; only <em>Accounting</em>, <em>Purchases</em>, <em>Expenses</em>{' '}
                and <em>Suppliers</em> need them.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.keys(BOOKKEEPING_LABELS).map((table) => (
                  <span
                    key={table}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-gray-600 ring-1 ring-gray-200"
                  >
                    {table}
                  </span>
                ))}
              </div>
            </details>

            {counts.length > 0 ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-5">
                {counts.map((row) => (
                  <div key={row.table} className="rounded-lg border border-gray-100 bg-white p-2.5">
                    <p className="text-[10.5px] uppercase tracking-wide text-gray-500">
                      {row.table.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[16px] font-black text-gray-900">{row.count}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </AdminCard>

      {/* Step 2 — storage */}
      <AdminCard className="mb-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg bg-red-50 p-2 text-red-600">
            <HardDrive className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <h2 className="text-[15px] font-extrabold text-gray-900">
              2. Cloudflare R2 image storage
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-gray-600">
              Product photos upload to your <strong>{storage.bucket}</strong> bucket. The Access Key
              ID and Secret Access Key are an <strong>R2 API token</strong> (not your Cloudflare
              login): dashboard → R2 → <em>Manage R2 API Tokens</em> → Create API token →
              permissions <em>Object Read &amp; Write</em> → scope to {storage.bucket}.
            </p>

            <ul className="mt-3 space-y-1.5 text-[12px]">
              {[
                ['CLOUDFLARE_R2_ACCOUNT_ID', storage.accountIdSet],
                ['CLOUDFLARE_R2_ACCESS_KEY_ID', storage.accessKeySet],
                ['CLOUDFLARE_R2_SECRET_ACCESS_KEY', storage.secretKeySet],
                ['CLOUDFLARE_R2_PUBLIC_URL', Boolean(storage.publicUrl)],
              ].map(([label, ok]) => (
                <li key={String(label)} className="flex items-center gap-2">
                  {ok ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <code className="text-[11.5px] text-gray-700">{label}</code>
                  {ok ? null : <Badge tone="red">missing</Badge>}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={r2Url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-red-700"
              >
                Create R2 API token <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href="/api/test-r2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                Test bucket connection
              </a>
            </div>

            {storage.publicUrl ? (
              <p className="mt-3 break-all text-[11.5px] text-gray-500">
                Public URL: <code>{storage.publicUrl}</code>
              </p>
            ) : (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">
                Enable public access on the bucket (R2 → {storage.bucket} → Settings → Public
                access) and set <code>CLOUDFLARE_R2_PUBLIC_URL</code>, otherwise uploads succeed but
                images will not display.
              </p>
            )}
          </div>
        </div>
      </AdminCard>

      {/* Step 3 — content */}
      <AdminCard>
        <h2 className="text-[15px] font-extrabold text-gray-900">3. Fill the store</h2>
        <p className="mt-1 text-[12.5px] text-gray-600">
          Once the tables exist, the storefront reads only from the database.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { href: '/admin/products/new', title: 'Add a product', detail: 'Price, stock, skin types, photos' },
            { href: '/admin/categories', title: 'Check categories', detail: 'Seeded automatically by seed.sql' },
            { href: '/admin/shipping', title: 'Delivery zones', detail: 'Fees per town and free-over amount' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-gray-200 p-3.5 transition-colors hover:border-red-200 hover:bg-red-50/40"
            >
              <p className="text-[13px] font-bold text-gray-900">{item.title}</p>
              <p className="mt-0.5 text-[11.5px] text-gray-500">{item.detail}</p>
            </Link>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
