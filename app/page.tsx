// app/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { ProductSection } from '@/components/home/ProductSection';
import { ProductRail } from '@/components/home/ProductRail';
import { DealBanner, PromoBands, ValueStrip } from '@/components/home/PromoBands';
import { ReviewFeed } from '@/components/reviews/ReviewFeed';
import { getHomeData } from '@/lib/data/store';
import { getPublishedReviews } from '@/lib/data/reviews';
import { StoreSetupNotice } from '@/components/layout/StoreSetupNotice';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { checkDatabaseHealth } from '@/lib/supabase/health';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, itemListSchema } from '@/lib/seo/jsonld';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: `Skincare, body care and mother care — ${site.nameFull}`,
  description:
    'A small shop for genuine skincare, body care, haircare and mother-and-baby essentials. Pick it up in person or have it sent anywhere in Ghana.',
  alternates: { canonical: '/' },
  openGraph: {
    title: `${site.nameFull}`,
    description: site.description,
    url: '/',
    type: 'website',
  },
};

export const revalidate = 60;

export default async function HomePage() {
  const { banners, categories, hotArrivals, topPicks, hotSellers, showrooms } = await getHomeData();

  const deals = showrooms[0]?.products ?? [];
  const reviews = await getPublishedReviews(8);

  // Options for the "leave a note" form — whatever the shop actually stocks.
  const reviewProducts = [...hotArrivals, ...topPicks, ...hotSellers]
    .filter(
      (product, index, list) => list.findIndex((item) => item.id === product.id) === index
    )
    .slice(0, 30)
    .map((product) => ({ id: product.id, name: product.name, slug: product.slug }));

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

      <h1 className="sr-only">
        {site.nameFull} — skincare, body care and mother-and-baby essentials
      </h1>

      <HeroBanner banners={banners} />

      {/* Standfirst — plain speech, set like a shop notice rather than a hero */}
      <section className="container-page pt-8 sm:pt-12">
        <div className="grid gap-6 border-b border-line pb-8 sm:grid-cols-12 sm:gap-10 sm:pb-10">
          <div className="sm:col-span-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-sage-deep">
              Skincare · Body care · Mother &amp; baby
            </p>
            <p className="mt-3 font-serif text-[25px] leading-[1.25] text-ink sm:text-[33px] sm:leading-[1.2]">
              We stock the things people come back for: thick body lotion that survives
              harmattan, baby wash that does not sting, and the serum that actually fades
              spots.
            </p>
            <p className="mt-3 max-w-[54ch] text-[13px] leading-relaxed text-muted">
              No copies, no short-dated stock pushed to the front of the shelf. If something is
              not worth your money, we will say so before you buy it.
            </p>
          </div>

          <div className="sm:col-span-5 sm:pl-8 sm:border-l sm:border-line">
            <dl className="space-y-4">
              {[
                {
                  term: 'Pick it up',
                  detail: 'Collect at the counter during opening hours, or have it brought to you.',
                },
                {
                  term: 'Pay how you like',
                  detail: 'MTN MoMo, or cash when the rider hands it over.',
                },
                {
                  term: 'Ask a person',
                  detail: 'One WhatsApp line, answered by somebody who works in the shop.',
                },
              ].map(({ term, detail }) => (
                <div key={term}>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-sage-deep">
                    {term}
                  </dt>
                  <dd className="mt-1 text-[12.5px] leading-relaxed text-gray-700">{detail}</dd>
                </div>
              ))}
            </dl>
            <Link href="/about" className="section-link mt-5 inline-flex">
              How we choose stock
            </Link>
          </div>
        </div>
      </section>

      <CategoryStrip categories={categories} />
      <ValueStrip />

      <ProductSection
        kicker="Fresh in"
        title="Just off the delivery"
        subtitle="What came in this week, before it settles on the shelf"
        href="/products?sort=newest"
        hrefLabel="See everything new"
        products={hotArrivals.slice(0, 10)}
        columns="five"
      />

      <PromoBands />

      <ProductSection
        kicker="Reduced"
        title="Marked down"
        subtitle="Lines we bought deep, so the price is lower than usual"
        href="/products?deals=1"
        hrefLabel="All reductions"
        products={deals.slice(0, 8)}
      />

      <DealBanner />

      <ProductSection
        kicker="Most loved"
        title="What people keep re-buying"
        subtitle="Ranked by what actually leaves the shop"
        href="/products?sort=popular"
        hrefLabel="See the bestsellers"
        products={topPicks.slice(0, 8)}
      />

      <ProductRail
        kicker="Also moving"
        title="Worth a look"
        subtitle="Less obvious, equally good"
        href="/products?sort=popular"
        products={hotSellers.slice(0, 10)}
      />

      <ReviewFeed initialReviews={reviews} products={reviewProducts} />
    </>
  );
}
