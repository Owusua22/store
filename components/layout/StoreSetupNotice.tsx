// components/layout/StoreSetupNotice.tsx
// Shown on the storefront when Supabase is connected but the tables have not
// been created yet — clearer than an empty catalogue.
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

import { site } from '@/lib/site';

export function StoreSetupNotice() {
  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-[12px] text-amber-900">
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <p className="flex-1 leading-snug">
          <span className="font-bold">We&apos;re stocking the shelves.</span> Our new catalogue is
          coming online — message us on WhatsApp{' '}
          <a
            href={`https://wa.me/${site.whatsapp}`}
            className="font-bold underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {site.phoneDisplay}
          </a>{' '}
          to order in the meantime.
        </p>
        <Link
          href="/admin/setup"
          className="rounded-md bg-amber-900 px-2 py-1 text-[11px] font-bold text-white hover:bg-amber-950"
        >
          Admin setup
        </Link>
      </div>
    </div>
  );
}
