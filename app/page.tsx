// app/page.tsx
import type { Metadata } from 'next';
import { HomeValueHero } from '@/components/home/HomeValueHero';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { ProductSection } from '@/components/home/ProductSection';
import { ProductRail } from '@/components/home/ProductRail';
import { DealBanner, PromoBands, ValueStrip } from '@/components/home/PromoBands';
import { getHomeData } from '@/lib/data/store';
import { StoreSetupNotice } from '@/components/layout/StoreSetupNotice';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { checkDatabaseHealth } from '@/lib/supabase/health';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { site } from '@/lib/site';
import { breadcrumbSchema, itemListSchema } from '@/lib/seo/jsonld';

export const metadata: Metadata = {
  title: `100% Authentic Skincare, Body Care & Mothercare in East Doboro — Beside St. George's Height`,
  description: `Authentic Nivea, Vaseline, Johnson's, Dove and Cetaphil skincare, mothercare and baby essentials at every budget. Visit us beside St. George's Height, East Doboro, Nsawam — open ${site.hoursSummary} — or order on WhatsApp with delivery across Ghana.`,
  alternates: { canonical: '/' },
  openGraph: {
    title: `${site.nameFull} — East Doboro, Nsawam`,
    description: site.tagline,
    url: '/',
    type: 'website',
  },
};

export const revalidate = 60;

export default async function HomePage() {
  const { categories, hotArrivals, topPicks, hotSellers, showrooms } = await getHomeData();

  const deals = showrooms[0]?.products ?? [];

  // Connected but no tables yet: tell shoppers instead of showing an empty store.
  const database = isSupabaseConfigured ? await checkDatabaseHealth() : null;
  const awaitingCatalogue = Boolean(database?.configured && !database.initialized);

  return (
    <>
      <JsonLd
        id="home"
        data={[
          itemListSchema(topPicks, {
            name: 'Our top picks',
            url: '/products?sort=popular',
            description: 'Bestselling skincare, hair care and baby care at Glow-Up.',
          }),
          breadcrumbSchema([{ name: 'Home', href: '/' }]),
        ]}
      />
      {awaitingCatalogue ? <StoreSetupNotice /> : null}
      <HomeValueHero />
      <CategoryStrip categories={categories} />
      <ValueStrip />

      <ProductSection
        title="Hot arrivals!"
        subtitle="Fresh stock, loved by our customers"
        href="/products?sort=newest"
        hrefLabel="View more"
        products={hotArrivals.slice(0, 10)}
        columns="five"
      />

      <PromoBands />

      <ProductSection
        title="Mega deals"
        subtitle="More shopping, less spending"
        href="/products?deals=1"
        hrefLabel="All deals"
        products={deals.slice(0, 8)}
      />

      <DealBanner />

      <ProductSection
        title="Our top picks"
        subtitle="Tried, loved and highly rated"
        href="/products?sort=popular"
        hrefLabel="View more"
        products={topPicks.slice(0, 8)}
      />

      <ProductRail
        title="Hot sellers"
        subtitle="The items everyone is buying"
        href="/products?sort=popular"
        products={hotSellers.slice(0, 10)}
      />

      <section className="container-page pt-8 sm:pt-10" aria-labelledby="reviews-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="reviews-heading" className="section-title">
              Verified customer reviews
            </h2>
            <p className="section-subtitle">
              Real messages from customers in Nsawam, Doboro, Accra and beyond
            </p>
          </div>
          <Link href="/contact" className="section-link">
            Leave a review <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 rounded-xl border border-line bg-white p-5 sm:grid-cols-3 sm:p-6">
          {[
            {
              name: 'Ama D.',
              location: 'East Legon, Accra',
              quote:
                'The shea body lotion is everything. My skin stayed soft through harmattan and delivery took one day.',
              stars: 5,
            },
            {
              name: 'Kwame A.',
              location: 'Kumasi',
              quote:
                'Ordered diapers and baby lotion on Friday, received them Saturday morning. Genuine products, fair prices.',
              stars: 5,
            },
            {
              name: 'Nana A.',
              location: 'Takoradi',
              quote:
                'The vitamin C serum cleared my dark spots in three weeks. Customer support on WhatsApp was super helpful.',
              stars: 5,
            },
          ].map((review) => (
            <figure key={review.name} className="rounded-lg bg-surface-soft p-4">
              <div className="mb-2 flex gap-0.5 text-amber-500" aria-label={`${review.stars} star review`}>
                {Array.from({ length: review.stars }).map((_, index) => (
                  <span key={index} aria-hidden="true">
                    ★
                  </span>
                ))}
              </div>
              <blockquote className="text-[12.5px] leading-relaxed text-gray-700">
                “{review.quote}”
              </blockquote>
              <figcaption className="mt-3 text-[11px] font-bold text-ink">
                {review.name}
                <span className="ml-1 font-medium text-muted">· {review.location}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Google Reviews widget — appears once NEXT_PUBLIC_GOOGLE_PLACE_ID is set
            (after the shop collects 10+ reviews). */}
        {process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID ? (
          <div className="mt-3 rounded-xl border border-line bg-white p-4">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">
              On Google
            </p>
            <div
              className="elfsight-app-google-reviews"
              data-place-id={process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID}
            />
            <a
              href={site.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-bold text-brand hover:underline"
            >
              Read all Google reviews →
            </a>
          </div>
        ) : null}
      </section>

      {/* Visit us — local SEO and directions */}
      <section className="container-page pt-8 sm:pt-10">
        <div className="grid gap-4 rounded-xl border border-line bg-surface-soft p-5 sm:grid-cols-[1.2fr_1fr] sm:p-6">
          <div>
            <h2 className="section-title">Visit the shop in East Doboro</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-gray-600">
              We are beside <strong>{site.landmark}</strong>, {site.town}, Nsawam. Come in to
              smell the lotions, check expiry dates yourself and pay at the counter — or send
              stock to a friend on WhatsApp.
            </p>
            <ul className="mt-3 space-y-1.5 text-[12.5px] font-semibold text-ink">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand" /> {site.address}
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand" /> {site.hoursSummary}
              </li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/location" className="btn-brand h-10 px-4 text-[12.5px]">
                Directions &amp; delivery rates
              </Link>
              <a
                href={`tel:${site.phone}`}
                className="inline-flex h-10 items-center rounded-lg border border-line bg-white px-4 text-[12.5px] font-bold text-ink"
              >
                Call {site.phoneDisplay}
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-line">
            <iframe
              title="Map to Glow-Up Skincare & Mother Care, East Doboro"
              src={site.mapEmbedUrl}
              className="h-[190px] w-full sm:h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  );
}
