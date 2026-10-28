// app/(pages)/sitemap/page.tsx
// A human sitemap: every department, every product, every policy in one index.
import type { Metadata } from 'next';
import Link from 'next/link';

import { getCategories, getProducts } from '@/lib/data/store';
import { getBlogPosts } from '@/lib/data/blog';
import { site } from '@/lib/site';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/lib/seo/jsonld';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Sitemap',
  description:
    'Every page on the Glow-Up site in one place: departments, products, the journal, delivery and policy pages.',
  alternates: { canonical: '/sitemap' },
};

const INFO_PAGES = [
  { href: '/about', label: 'About the shop' },
  { href: '/contact', label: 'Contact & WhatsApp' },
  { href: '/location', label: 'Visit & delivery rates' },
  { href: '/policies', label: 'Payment, delivery & returns' },
  { href: '/privacy', label: 'Privacy (Act 843)' },
  { href: '/terms', label: 'Terms of sale' },
  { href: '/blog', label: 'The journal' },
] as const;

const ACCOUNT_PAGES = [
  { href: '/account', label: 'My account' },
  { href: '/orders', label: 'Track an order' },
  { href: '/cart', label: 'Bag' },
  { href: '/checkout', label: 'Checkout' },
  { href: '/profile', label: 'Saved items' },
] as const;

export default async function SitemapPage() {
  const [categories, products, posts] = await Promise.all([
    getCategories(),
    getProducts(),
    getBlogPosts(),
  ]);

  const grouped = categories.map((category) => ({
    category,
    items: products.filter((product) => {
      const id = typeof product.category === 'object' ? product.category?.id : undefined;
      return id === category.id || product.category_id === category.id;
    }),
  }));

  return (
    <>
      <JsonLd id="sitemap" data={[breadcrumbSchema([{ name: 'Home', href: '/' }, { name: 'Sitemap', href: '/sitemap' }])]} />

      <div className="container-page pt-10 sm:pt-14">
        <span className="section-kicker">Index</span>
        <h1 className="mt-1 font-serif text-[34px] leading-tight text-ink sm:text-[46px]">
          Everything on this site
        </h1>
        <p className="mt-3 max-w-[60ch] text-[13px] leading-relaxed text-muted">
          One page, no menus to hunt through. {products.length} products across{' '}
          {categories.length} departments, plus the journal and the small print.
        </p>
      </div>

      <div className="container-page grid gap-10 py-10 sm:py-14 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
        {/* Catalogue index */}
        <div>
          {grouped.length === 0 ? (
            <p className="text-[13px] text-muted">The catalogue is empty right now.</p>
          ) : (
            grouped.map(({ category, items }) => (
              <section key={category.id} className="mb-8">
                <div className="flex items-baseline justify-between gap-4 border-b border-line pb-1.5">
                  <h2 className="font-serif text-[21px] text-ink">{category.name}</h2>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="text-[10px] font-bold uppercase tracking-[0.14em] text-sage-deep hover:underline"
                  >
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </Link>
                </div>
                <ul className="mt-2 grid gap-x-6 sm:grid-cols-2">
                  {items.map((product) => (
                    <li key={product.id} className="border-b border-line-soft py-1.5">
                      <Link
                        href={`/products/${product.slug}`}
                        className="text-[12.5px] leading-snug text-gray-700 hover:text-sage-deep"
                      >
                        {product.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}

          {posts.length > 0 && (
            <section className="mb-8">
              <div className="border-b border-line pb-1.5">
                <h2 className="font-serif text-[21px] text-ink">From the journal</h2>
              </div>
              <ul className="mt-2">
                {posts.map((post) => (
                  <li key={post.id} className="border-b border-line-soft py-1.5">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-[12.5px] text-gray-700 hover:text-sage-deep"
                    >
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Fixed pages */}
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="border-b border-line pb-1.5 font-serif text-[19px] text-ink">
              The shop
            </h2>
            <ul className="mt-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/products', label: 'All products' },
                { href: '/products?sort=newest', label: 'New in' },
                { href: '/products?sort=popular', label: 'Bestsellers' },
                { href: '/products?deals=1', label: 'Reduced' },
                ...categories.map((category) => ({
                  href: `/categories/${category.slug}`,
                  label: category.name,
                })),
              ].map((link) => (
                <li key={link.href} className="border-b border-line-soft py-1.5">
                  <Link
                    href={link.href}
                    className="text-[12.5px] text-gray-700 hover:text-sage-deep"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="border-b border-line pb-1.5 font-serif text-[19px] text-ink">
              Information
            </h2>
            <ul className="mt-2">
              {INFO_PAGES.map((link) => (
                <li key={link.href} className="border-b border-line-soft py-1.5">
                  <Link
                    href={link.href}
                    className="text-[12.5px] text-gray-700 hover:text-sage-deep"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="border-b border-line pb-1.5 font-serif text-[19px] text-ink">
              Your account
            </h2>
            <ul className="mt-2">
              {ACCOUNT_PAGES.map((link) => (
                <li key={link.href} className="border-b border-line-soft py-1.5">
                  <Link
                    href={link.href}
                    className="text-[12.5px] text-gray-700 hover:text-sage-deep"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-[11px] leading-relaxed text-muted">
            Looking for the machine-readable version?{' '}
            <a href="/sitemap.xml" className="text-sage-deep underline underline-offset-2">
              sitemap.xml
            </a>{' '}
            is what search engines read.
          </p>
        </div>
      </div>
    </>
  );
}
