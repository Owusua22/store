// app/page.tsx
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { ProductSection } from '@/components/home/ProductSection';
import { ProductRail } from '@/components/home/ProductRail';
import { DealBanner, PromoBands, ValueStrip } from '@/components/home/PromoBands';
import { getHomeData } from '@/lib/data/store';

export const revalidate = 60;

export default async function HomePage() {
  const { banners, categories, hotArrivals, topPicks, hotSellers, showrooms } =
    await getHomeData();

  const deals = showrooms[0]?.products ?? [];

  return (
    <>
      <HeroBanner banners={banners} />
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

      <section className="container-page pt-8 sm:pt-10">
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
      </section>
    </>
  );
}
