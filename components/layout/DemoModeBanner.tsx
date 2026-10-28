'use client';

import { useState } from 'react';
import { Database, X } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * Small banner shown only when the app runs without a Supabase project.
 * It explains that demo data is in use so testers aren't confused by
 * client-only sign-in and the bundled skincare catalogue.
 */
export function DemoModeBanner() {
  const [dismissed, setDismissed] = useState(false);

  // Evaluated at build time, so server and client markup always match.
  if (isSupabaseConfigured || dismissed) return null;

  return (
    <div className="bg-ink text-white">
      <div className="container-page flex items-center gap-2 py-1.5 text-[11px]">
        <Database className="h-3.5 w-3.5 shrink-0 text-amber-300" />
        <p className="flex-1 leading-snug">
          <span className="font-bold">Demo mode:</span> no Supabase keys found, so the
          store is running on the bundled skincare catalogue. Add your{' '}
          <code className="rounded bg-white/10 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_*</code>{' '}
          keys in <code className="rounded bg-white/10 px-1 py-0.5">.env.local</code> to go
          live.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss demo notice"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
