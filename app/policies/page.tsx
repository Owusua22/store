// app/policies/page.tsx
// Payment, delivery, returns/refunds and privacy — the plain-language version
// a customer at the counter would get.

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Banknote,
  CalendarClock,
  Lock,
  MessageCircle,
  PackageX,
  RefreshCcw,
  Smartphone,
  Truck,
} from 'lucide-react';

import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { formatCedis } from '@/lib/utils';
import { site } from '@/lib/site';
import { whatsappLink } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Payment, Delivery, Returns & Privacy Policies',
  description: `How to pay (MTN MoMo ${site.momo.number}, cash on pickup), our ${site.policy.exchangeWindowHours}-hour exchange policy, the hygiene rule for opened cosmetics, and how we handle your data under Ghana's Data Protection Act 843.`,
  alternates: { canonical: '/policies' },
};

const SECTIONS = [
  { id: 'payment', label: 'Payment' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'returns', label: 'Returns & refunds' },
  { id: 'privacy', label: 'Privacy' },
];

export default function PoliciesPage() {
  return (
    <div className="container-page py-6 sm:py-8">
      <JsonLd
        id="policies"
        data={breadcrumbSchema([
          { name: 'Home', href: '/' },
          { name: 'Policies', href: '/policies' },
        ])}
      />

      <header className="max-w-3xl">
        <h1 className="font-serif text-[38px] text-ink">
          Payment, delivery, returns &amp; privacy
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
          Short, honest rules — the same ones we say at the counter in {site.town}. Last
          updated {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.
        </p>
      </header>

      <nav aria-label="Policy sections" className="mt-4 flex flex-wrap gap-1.5">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-[11.5px] font-bold text-gray-700 hover:border-brand/60 hover:text-brand"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px] lg:items-start">
        <div className="space-y-5">
          {/* ── Payment ───────────────────────────────────────────────── */}
          <section id="payment" className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[18px] font-extrabold text-ink">
              <Smartphone className="h-4.5 w-4.5 text-brand" /> How to pay
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald-800">
                  MTN MoMo Pay
                </p>
                <p className="mt-1 font-mono text-[20px] font-black text-emerald-900">
                  {site.momo.payTill}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-emerald-900/80">
                  Account name: <strong>{site.momo.name}</strong>. Send the exact amount, then
                  WhatsApp the screenshot to {site.whatsappDisplay} with your order number.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-surface-soft p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-600">
                  <Banknote className="h-3.5 w-3.5" /> Cash on pickup
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-gray-700">
                  Reserve on WhatsApp, collect from the shop beside {site.landmark} and pay at the
                  counter. No deposit needed for everyday items.
                </p>
                <p className="mt-2 text-[11px] text-muted">
                  Cash on delivery is available for Nsawam, Doboro and Adoagyiri only.
                </p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-[12.5px] leading-relaxed text-gray-700">
              <li>
                • We <strong>confirm stock first</strong>, then ask you to pay — so you are never
                charged for something that has sold out.
              </li>
              <li>
                • Every payment gets a WhatsApp receipt with the item, size and amount.
              </li>
              <li>
                • Automated card/MoMo checkout (Paystack or Hubtel) will be added once daily stock
                sync is routine; until then we verify each MoMo payment by hand within minutes.
              </li>
              <li>
                • Bank transfer for wholesale orders over {formatCedis(1000)} — ask for the
                account details on WhatsApp.
              </li>
            </ul>
          </section>

          {/* ── Delivery ─────────────────────────────────────────────── */}
          <section id="delivery" className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[18px] font-extrabold text-ink">
              <Truck className="h-4.5 w-4.5 text-brand" /> Delivery
            </h2>
            <ul className="mt-3 space-y-1.5 text-[12.5px] leading-relaxed text-gray-700">
              <li>
                • <strong>Nsawam, Doboro, Adoagyiri:</strong> GH₵10–15, same day if ordered before{' '}
                {site.policy.sameDayCutoff}.
              </li>
              <li>
                • <strong>Accra, Tema, Kasoa, Koforidua:</strong> GH₵25–40, 1–2 working days.
              </li>
              <li>
                • <strong>Kumasi, Takoradi, Cape Coast, Tamale:</strong> GH₵35–50, 2–4 working
                days by VIP or OA bus station.
              </li>
              <li>
                • <strong>Free delivery</strong> on orders over{' '}
                {formatCedis(site.freeDeliveryThreshold)}.
              </li>
              <li>
                • Delivery is charged on top of the product price and is shown before you pay.
                Bulky items may add GH₵10–20; we always tell you first.
              </li>
            </ul>
            <Link
              href="/location#delivery"
              className="mt-3 inline-block text-[12.5px] font-bold text-brand hover:underline"
            >
              See the full delivery fee table →
            </Link>
          </section>

          {/* ── Returns ──────────────────────────────────────────────── */}
          <section id="returns" className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[18px] font-extrabold text-ink">
              <RefreshCcw className="h-4.5 w-4.5 text-brand" /> Returns, exchanges &amp; refunds
            </h2>
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-[12.5px] leading-relaxed text-amber-900">
              <p className="flex items-center gap-1.5 font-extrabold">
                <CalendarClock className="h-4 w-4" />
                {site.policy.exchangeWindowHours}-hour exchange window
              </p>
              <p className="mt-1">
                Bring it back within {site.policy.exchangeWindowHours} hours of receiving it, in
                the original packaging, with the receipt or WhatsApp order number.
              </p>
            </div>

            <h3 className="mt-4 text-[13.5px] font-extrabold text-ink">We accept</h3>
            <ul className="mt-1.5 space-y-1.5 text-[12.5px] leading-relaxed text-gray-700">
              <li>
                • <strong>Wrong item or wrong size</strong> sent by us — free exchange or full
                refund, including delivery.
              </li>
              <li>
                • <strong>Damaged in transit</strong> — send a photo on WhatsApp the same day and
                we replace it.
              </li>
              <li>
                • <strong>Factory-sealed, unopened items</strong> in resale condition — exchange
                or shop credit within {site.policy.exchangeWindowHours} hours.
              </li>
              <li>
                • <strong>Expired or counterfeit product</strong> — always refunded in full, no
                time limit. It should never happen; if it does we report the supplier.
              </li>
            </ul>

            <h3 className="mt-4 flex items-center gap-1.5 text-[13.5px] font-extrabold text-ink">
              <PackageX className="h-4 w-4 text-brand" /> We cannot accept
            </h3>
            <ul className="mt-1.5 space-y-1.5 text-[12.5px] leading-relaxed text-gray-700">
              <li>
                • <strong>Opened cosmetics or baby creams</strong> — for hygiene and safety
                reasons we cannot resell a cream, lotion, serum or wash once the seal is broken.
                This is the same rule pharmacies follow.
              </li>
              <li>
                • Opened diapers, wipes, maternity pads or any intimate item.
              </li>
              <li>
                • Products without the original packaging or with the batch/expiry label removed.
              </li>
              <li>
                • Items bought on clearance in the <em>Bundles &amp; Offers</em> section, unless
                they were defective when delivered.
              </li>
            </ul>

            <p className="mt-3 rounded-lg bg-surface-soft px-3 py-2.5 text-[12px] leading-relaxed text-gray-600">
              <strong>The exception:</strong> an opened product is still covered if it is{' '}
              <strong>defective</strong> — separated, discoloured, leaking or causing a reaction.
              Send us a photo and, where possible, the batch number, and we will refund or
              replace it. Refunds go back to the MoMo number that paid, within 3 working days.
            </p>
          </section>

          {/* ── Privacy ──────────────────────────────────────────────── */}
          <section id="privacy" className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[18px] font-extrabold text-ink">
              <Lock className="h-4.5 w-4.5 text-brand" /> Privacy &amp; your data
            </h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-gray-700">
              {site.nameFull} processes personal data in line with the{' '}
              <strong>Data Protection Act, 2012 (Act 843)</strong> of Ghana. We collect only what
              we need to deliver your order:
            </p>
            <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-gray-700">
              <li>• Name, phone number and email — to confirm and deliver your order.</li>
              <li>• Delivery address or the landmark you give us in WhatsApp.</li>
              <li>• Your order history, so we can handle exchanges and refunds.</li>
              <li>
                • Payment reference only — we never see or store your MoMo PIN, and we do not
                keep card numbers.
              </li>
            </ul>
            <p className="mt-2 text-[12.5px] leading-relaxed text-gray-700">
              We <strong>never sell or rent</strong> your data. We share the minimum needed with
              delivery riders and bus stations, and with MTN only to confirm a payment. Data is
              kept for as long as tax and warranty records require (up to 6 years), then deleted
              or anonymised.
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-gray-700">
              <strong>Your rights under Act 843:</strong> you may request a copy of your data,
              ask us to correct or delete it, object to marketing messages, or withdraw consent at
              any time. Email{' '}
              <a href={`mailto:${site.email}`} className="font-bold text-brand hover:underline">
                {site.email}
              </a>{' '}
              or WhatsApp {site.whatsappDisplay} and we will respond within 21 days. If you are
              not satisfied, you can complain to the{' '}
              <strong>Data Protection Commission of Ghana</strong>.
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Cookies: we use a session cookie to keep you signed in and to remember your cart.
              We only load Google Analytics 4 if you accept analytics cookies, and we never load
              advertising trackers.
            </p>
            <Link
              href="/privacy"
              className="mt-3 inline-block text-[12.5px] font-bold text-brand hover:underline"
            >
              Read the full privacy notice →
            </Link>
          </section>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className="space-y-3 lg:sticky lg:top-4">
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">
              Questions about an order?
            </p>
            <a
              href={whatsappLink(
                'Hello! I have a question about your payment, delivery or returns policy.'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex h-10 items-center justify-center gap-2 rounded-lg bg-[#25D366] text-[12.5px] font-extrabold text-white hover:bg-[#1da851]"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp {site.whatsappDisplay}
            </a>
            <a
              href={`tel:${site.phone}`}
              className="mt-1.5 flex h-10 items-center justify-center rounded-lg border border-line text-[12.5px] font-bold text-ink hover:bg-surface-soft"
            >
              Call {site.phoneDisplay}
            </a>
            <p className="mt-2 text-center text-[10.5px] text-muted">{site.hoursSummary}</p>
          </div>

          <div className="rounded-xl border border-line bg-surface-soft p-4 text-[11.5px] leading-relaxed text-gray-600">
            <p className="font-extrabold text-ink">Registered details</p>
            <p className="mt-1">{site.nameFull}</p>
            <p>{site.address}</p>
            <p className="mt-1">
              MoMo Pay: {site.momo.payTill} · {site.email}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
