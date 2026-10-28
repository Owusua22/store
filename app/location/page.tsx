// app/location/page.tsx
// Shop location, landmarks, opening hours and the transparent delivery table.

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Bus,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  ShoppingBag,
} from 'lucide-react';

import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { getDeliveryZones } from '@/lib/data/delivery';
import { formatCedis } from '@/lib/utils';
import { site } from '@/lib/site';
import { generalWhatsAppMessage, whatsappLink } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: `Skincare & Mothercare Shop in East Doboro, Nsawam — Beside St. George's Height`,
  description:
    `Visit ${site.nameFull} in East Doboro, Nsawam (beside St. George's Height). Open ${site.hoursSummary}. Delivery across Nsawam, Doboro, Accra, Kumasi and all Ghana — see the full delivery fee table.`,
  alternates: { canonical: '/location' },
  openGraph: {
    title: `${site.nameFull} — East Doboro, Nsawam`,
    description: `Shop location, opening hours and delivery rates. Beside St. George's Height, ${site.town}.`,
  },
};

export const dynamic = 'force-dynamic';

export default async function LocationPage() {
  const zones = await getDeliveryZones();

  const byRegion = zones.reduce<Record<string, typeof zones>>((groups, zone) => {
    groups[zone.region] = [...(groups[zone.region] ?? []), zone];
    return groups;
  }, {});

  // Today's line is highlighted in the hours table.
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long' });

  return (
    <div className="container-page py-6 sm:py-8">
      <JsonLd
        id="location"
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Store',
            '@id': `${site.url}/location#store`,
            name: site.nameFull,
            image: `${site.url}/images/banners/hero-teal.webp`,
            url: `${site.url}/location`,
            telephone: `+${site.whatsapp}`,
            priceRange: 'GH₵10 – GH₵400',
            currenciesAccepted: site.currency,
            paymentAccepted: 'Cash, MTN Mobile Money',
            address: {
              '@type': 'PostalAddress',
              streetAddress: `Beside ${site.landmark}, ${site.town}`,
              addressLocality: 'Nsawam',
              addressRegion: site.region,
              addressCountry: 'GH',
            },
            hasMap: site.mapLink,
            openingHoursSpecification: site.hours.map((day) => ({
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: day.day,
              opens: day.openTime,
              closes: day.closeTime,
            })),
          },
          breadcrumbSchema([
            { name: 'Home', href: '/' },
            { name: 'Shop location', href: '/location' },
          ]),
        ]}
      />

      {/* ── Address + map ─────────────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-brand">
            <MapPin className="h-3.5 w-3.5" /> Find us
          </p>
          <h1 className="mt-2 text-[26px] font-black leading-tight tracking-tight text-ink sm:text-[32px]">
            Skincare &amp; Mothercare Shop in East Doboro, Nsawam
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
            We are <strong>beside {site.landmark}</strong> in {site.town} — look for the red
            Glow-Up sign on the main road through Doboro. Come in, check expiry dates yourself,
            and pay at the counter by cash or MTN MoMo.
          </p>

          <ul className="mt-4 space-y-2.5 text-[13px]">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>
                <strong>{site.address}</strong>
                <br />
                <span className="text-muted">Landmark: {site.landmark} (next door)</span>
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <a href={`tel:${site.phone}`} className="font-semibold text-ink hover:text-brand">
                {site.phoneDisplay}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#25D366]" />
              <a
                href={whatsappLink(generalWhatsAppMessage())}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ink hover:text-brand"
              >
                WhatsApp {site.whatsappDisplay} (orders &amp; stock checks)
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Bus className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span className="text-gray-600">
                Trotro from Nsawam station towards Doboro — alight at St. George&apos;s Height.
                Tricycle from Doboro junction takes 4 minutes.
              </span>
            </li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={site.directionsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-brand inline-flex h-11 items-center gap-2 px-4 text-[12.5px]"
            >
              <Navigation className="h-4 w-4" /> Get directions
            </a>
            <Link
              href="/products"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-white px-4 text-[12.5px] font-bold text-ink hover:border-brand/50"
            >
              <ShoppingBag className="h-4 w-4 text-brand" /> Shop online
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <iframe
            title={`Map to ${site.nameFull}, ${site.town}`}
            src={site.mapEmbedUrl}
            className="h-[280px] w-full sm:h-[360px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <p className="text-[11.5px] font-semibold text-gray-600">
              Beside {site.landmark}, {site.town}
            </p>
            <a
              href={site.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11.5px] font-bold text-brand hover:underline"
            >
              Open in Google Maps →
            </a>
          </div>
        </div>
      </section>

      {/* ── Opening hours ─────────────────────────────────────────────── */}
      <section className="mt-8 grid gap-4 sm:grid-cols-[1fr_1fr]" id="hours">
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-ink">
            <Clock className="h-4 w-4 text-brand" /> Opening hours
          </h2>
          <p className="mt-1 text-[12px] text-muted">
            Same-day dispatch for orders placed before {site.policy.sameDayCutoff}.
          </p>
          <table className="mt-3 w-full text-[12.5px]">
            <tbody>
              {site.hours.map((day) => {
                const isToday = day.day === today;
                return (
                  <tr
                    key={day.day}
                    className={isToday ? 'bg-brand-soft/60 font-bold text-ink' : 'text-gray-700'}
                  >
                    <th scope="row" className="py-1.5 text-left font-semibold">
                      {day.day}
                      {isToday ? (
                        <span className="ml-1.5 rounded bg-brand px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white">
                          Today
                        </span>
                      ) : null}
                    </th>
                    <td className="py-1.5 text-right tabular-nums">
                      {day.open} – {day.close}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 rounded-lg bg-surface-soft px-3 py-2 text-[11.5px] leading-relaxed text-gray-600">
            Public holidays: 1:00 PM – 6:00 PM. On Christmas Day and Good Friday we are closed.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-white p-5" id="pickup">
          <h2 className="text-[16px] font-extrabold text-ink">Pickup &amp; payment</h2>
          <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-gray-700">
            <li>
              <strong className="text-ink">Cash on pickup</strong> — reserve on WhatsApp, pay at
              the counter when you collect. Bring the order name.
            </li>
            <li>
              <strong className="text-ink">MTN MoMo Pay</strong> — send to{' '}
              <span className="font-bold text-ink">{site.momo.number}</span> (
              {site.momo.name}) and send the screenshot on WhatsApp. We only dispatch after the
              payment shows.
            </li>
            <li>
              <strong className="text-ink">Delivery</strong> — paid by MoMo before dispatch, or
              cash on delivery for Nsawam, Doboro and Adoagyiri.
            </li>
            <li>
              <strong className="text-ink">Free delivery</strong> on orders over{' '}
              {formatCedis(site.freeDeliveryThreshold)}.
            </li>
          </ul>
          <Link
            href="/policies#payment"
            className="mt-3 inline-block text-[12px] font-bold text-brand hover:underline"
          >
            Full payment policy →
          </Link>
        </div>
      </section>

      {/* ── Delivery fee table ────────────────────────────────────────── */}
      <section className="mt-8" id="delivery">
        <h2 className="section-title">Delivery rates by zone</h2>
        <p className="section-subtitle">
          Transparent fees — no surprises at the door. Free above{' '}
          {formatCedis(site.freeDeliveryThreshold)}.
        </p>

        <div className="mt-3 space-y-4">
          {Object.entries(byRegion).map(([region, list]) => (
            <div key={region} className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="border-b border-line bg-surface-soft px-4 py-2">
                <h3 className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-ink">
                  {region} Region
                </h3>
              </div>
              <table className="w-full text-left text-[12.5px]">
                <thead className="text-[10.5px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-2 font-bold">Town / area</th>
                    <th className="px-2 py-2 font-bold">Fee</th>
                    <th className="px-2 py-2 font-bold">Delivery</th>
                    <th className="px-4 py-2 text-right font-bold">Free over</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {list.map((zone) => (
                    <tr key={zone.id}>
                      <td className="px-4 py-2 font-semibold text-ink">{zone.town}</td>
                      <td className="px-2 py-2 font-bold text-brand">
                        {zone.shipping_fee === 0 ? 'Free pickup' : formatCedis(zone.shipping_fee)}
                      </td>
                      <td className="px-2 py-2 text-gray-600">
                        {zone.estimated_days_min === 0 && zone.estimated_days_max === 0
                          ? 'Walk in'
                          : zone.estimated_days_min === 0
                            ? 'Same day'
                            : `${zone.estimated_days_min}–${zone.estimated_days_max} day${
                                zone.estimated_days_max > 1 ? 's' : ''
                              }`}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">
                        {formatCedis(site.freeDeliveryThreshold)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
          Not on the list? Send us a WhatsApp message with your town and we will quote you the
          exact fee before you pay. Bulky orders (diaper cartons, bundles) may attract an extra
          GH₵10–20 transport fee — we always confirm first.
        </p>
      </section>
    </div>
  );
}
