// components/layout/WhatsAppFab.tsx
// Floating "Chat / order on WhatsApp" button, visible on every storefront page.

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';

import { generalWhatsAppMessage, whatsappLink } from '@/lib/whatsapp';
import { site } from '@/lib/site';

export function WhatsAppFab() {
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  // Appear after a short delay so it never competes with the hero on first paint.
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  // Hide inside admin and on the cart/checkout flow where it would cover CTAs.
  const hidden =
    pathname.startsWith('/admin') || pathname.startsWith('/checkout') || pathname.startsWith('/cart');
  if (hidden) return null;

  const href = whatsappLink(generalWhatsAppMessage());

  return (
    <div
      className={`fixed bottom-20 right-4 z-[60] flex flex-col items-end gap-2 transition-opacity duration-300 md:bottom-6 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {open ? (
        <div className="w-[248px] rounded-xl border border-line bg-white p-3.5 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[12.5px] font-extrabold text-ink">Chat with {site.name}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                Order, ask for stock or get directions. We reply within minutes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-gray-400 hover:bg-surface-soft"
              aria-label="Close WhatsApp panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#25D366] text-[12px] font-extrabold text-white hover:bg-[#1da851]"
          >
            <MessageCircle className="h-4 w-4" /> Start chat · {site.whatsappDisplay}
          </a>
          <a
            href={`tel:${site.phone}`}
            className="mt-1.5 flex h-9 items-center justify-center rounded-md border border-line text-[12px] font-bold text-gray-700 hover:bg-surface-soft"
          >
            Call the shop instead
          </a>
          <p className="mt-2 text-center text-[10px] text-muted">{site.hoursSummary}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Hide WhatsApp options' : 'Order or chat on WhatsApp'}
        aria-expanded={open}
        className="flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-600/30 transition-transform hover:scale-105"
        style={{ height: 52, width: 52 }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}

export default WhatsAppFab;
