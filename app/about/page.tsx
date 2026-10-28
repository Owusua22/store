// app/about/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';
import { JsonLd } from '@/components/seo/JsonLd';
import { aboutPageSchema, breadcrumbSchema } from '@/lib/seo/jsonld';

export const metadata: Metadata = {
  title: `About ${site.nameFull}`,
  description: `Who runs Glow-Up, how stock is chosen, and why the shelf looks the way it does.`,
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main>
      <JsonLd
        id="about"
        data={[
          aboutPageSchema(),
          breadcrumbSchema([
            { name: 'Home', href: '/' },
            { name: 'About', href: '/about' },
          ]),
        ]}
      />

      <article className="container-page py-10 sm:py-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-sage-deep">
          About the shop
        </p>
        <h1 className="mt-3 max-w-[20ch] font-serif text-[34px] leading-[1.1] text-ink sm:text-[52px]">
          A small shop with a short list of rules.
        </h1>

        <div className="mt-8 grid gap-10 border-t border-line pt-8 sm:grid-cols-12 sm:gap-12">
          <div className="sm:col-span-7">
            <div className="prose-soft max-w-[62ch] text-[13.5px] leading-[1.75] text-gray-700">
              <p>
                Glow-Up is a skincare and mother-care shop. We started because buying
                genuine products here was harder than it should be — the same bottle of
                lotion, three prices, and no way to tell which one had been sitting in a
                hot container for two years.
              </p>
              <p>
                So the shop works on a short list of rules. We buy from distributors we can
                name. We check dates when stock arrives, not when a customer complains. We
                keep the bestseller list honest by looking at what actually leaves the
                counter. And if a product is not worth its price, we say so — including
                when it is on our own shelf.
              </p>
              <p>
                The range is deliberately ordinary: body lotions that survive harmattan,
                bar soap, shower cream, shampoo and conditioner, face washes and serums for
                people dealing with spots or dark marks, nappies, baby wash, baby lotion,
                and the stretch-mark creams new mothers ask for by name.
              </p>
              <p>
                You can buy in person, or send a message and we will pack it. If you are
                not sure what suits your skin, tell us what is happening with it and we
                will point you at two things, not twelve.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn-brand h-10 px-5 text-[11px] uppercase tracking-[0.12em]">
                Browse the shelves
              </Link>
              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-quiet h-10 px-5 text-[11px] uppercase tracking-[0.12em]"
              >
                Ask a question
              </a>
            </div>
          </div>

          <aside className="sm:col-span-5">
            <h2 className="border-b border-line pb-2 font-serif text-[19px] text-ink">
              The particulars
            </h2>
            <dl className="mt-3 space-y-3 text-[12.5px]">
              {[
                { term: 'Where', detail: site.address },
                { term: 'When', detail: site.hoursSummary },
                { term: 'Phone', detail: site.phoneDisplay },
                { term: 'Email', detail: site.email },
                {
                  term: 'Payment',
                  detail: 'MTN MoMo Pay, or cash when the rider arrives.',
                },
                {
                  term: 'Exchange',
                  detail:
                    '48 hours on unopened, factory-sealed items. Opened cosmetics and baby creams cannot come back unless they are faulty.',
                },
                {
                  term: 'Delivery',
                  detail: `Countrywide. Free over GH₵${site.freeDeliveryThreshold}.`,
                },
              ].map(({ term, detail }) => (
                <div key={term} className="border-b border-line-soft pb-2.5">
                  <dt className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted">
                    {term}
                  </dt>
                  <dd className="mt-0.5 leading-relaxed text-gray-700">{detail}</dd>
                </div>
              ))}
            </dl>
            <Link href="/policies" className="section-link mt-4 inline-flex">
              The full policies
            </Link>
          </aside>
        </div>
      </article>
    </main>
  );
}
