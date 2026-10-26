// components/admin/SetupChecklist.tsx
// Shown on the dashboard until the live store has a catalogue and storage.
import Link from 'next/link';
import { AlertTriangle, Check, Database, HardDrive, Package, Sparkles } from 'lucide-react';

import type { CatalogCounts } from '@/lib/data/store';
import type { R2Status } from '@/lib/r2/client';

export default function SetupChecklist({
  counts,
  storage,
}: {
  counts: CatalogCounts;
  storage: R2Status;
}) {
  const items = [
    {
      key: 'db',
      done: counts.categories > 0,
      icon: Database,
      title: 'Seed the database',
      detail:
        counts.categories > 0
          ? `${counts.categories} categories loaded`
          : 'Run supabase/schema.sql then supabase/seed.sql in the Supabase SQL editor.',
      href: '/admin/categories',
      action: 'View categories',
    },
    {
      key: 'products',
      done: counts.products > 0,
      icon: Package,
      title: 'Add your products',
      detail:
        counts.products > 0
          ? `${counts.products} products in the catalogue`
          : 'Upload your first product with price, stock, skin types and photos.',
      href: '/admin/products/new',
      action: 'Add product',
    },
    {
      key: 'storage',
      done: storage.configured,
      icon: HardDrive,
      title: `Connect Cloudflare R2 (“${storage.bucket}”)`,
      detail: storage.configured
        ? 'Image uploads are ready'
        : `Missing env vars: ${storage.missing.join(', ') || 'CLOUDFLARE_R2_PUBLIC_URL'}`,
      href: '/api/test-r2',
      action: 'Test storage',
    },
    {
      key: 'blog',
      done: counts.blogPosts > 0,
      icon: Sparkles,
      title: 'Publish your first article',
      detail:
        counts.blogPosts > 0
          ? `${counts.blogPosts} articles`
          : 'Skin care tips and routines bring organic traffic to /blog.',
      href: '/admin/blog/new',
      action: 'Write article',
    },
  ];

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-amber-100 p-1.5 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h2 className="text-[15px] font-extrabold text-amber-900">
            Finish connecting your store
          </h2>
          <p className="mt-0.5 text-[12.5px] text-amber-800">
            Supabase is connected — these steps fill your live catalogue and enable image
            uploads. Nothing is shown publicly until products are active.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="rounded-xl border border-amber-200/70 bg-white/80 p-3.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        item.done
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                    </span>
                    <p className="text-[13px] font-bold text-gray-900">{item.title}</p>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-gray-600">
                    {item.detail}
                  </p>
                  <Link
                    href={item.href}
                    className="mt-2 inline-block text-[11.5px] font-bold text-red-600 hover:underline"
                  >
                    {item.action} →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
