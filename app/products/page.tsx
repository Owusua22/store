// app/products/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ChevronRight, PackageSearch, Search } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { ShopFilters, SortSelect } from '@/components/products/ShopFilters';
import { getCategories, getProducts, type SortKey } from '@/lib/data/store';
import { metaNumber } from '@/lib/utils';
import { getSkinTypes } from '@/lib/data/skin-types';
import { getBrands } from '@/lib/data/brands';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, collectionPageSchema } from '@/lib/seo/jsonld';

export const metadata: Metadata = {
  title: 'Shop skin care products',
  description:
    'Browse body lotions, face creams, serums, shampoos, shower gels, baby care and more at Glow-Up.',
};

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const SORT_VALUES: SortKey[] = ['newest', 'price_asc', 'price_desc', 'name'];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const query = first(params.q)?.trim() ?? '';
  const categorySlug = first(params.category) ?? undefined;
  const skinType = first(params.skin) ?? undefined;
  const brandFilter = first(params.brand) ?? undefined;
  const deals = first(params.deals) === '1';
  const rawSort = first(params.sort) ?? 'newest';
  const sort: SortKey = SORT_VALUES.includes(rawSort as SortKey)
    ? (rawSort as SortKey)
    : 'newest';

  const min = Number(first(params.min));
  const max = Number(first(params.max));
  const activeMin = Number.isFinite(min) ? min : undefined;
  const activeMax = Number.isFinite(max) ? max : undefined;

  const [categories, skinTypes, brands] = await Promise.all([
    getCategories(),
    getSkinTypes(),
    getBrands(),
  ]);
  const activeSkinType = skinTypes.find((type) => type.slug === skinType);
  const activeBrand = brands.find((brand) => brand.slug === brandFilter);

  const allProducts = await getProducts({
    categorySlug,
    search: query || undefined,
    dealsOnly: deals,
    skinType,
    brandSlug: brandFilter,
    sort: rawSort === 'popular' ? 'newest' : sort,
  });

  let products = allProducts;

  if (rawSort === 'popular') {
    products = [...products].sort(
      (a, b) => metaNumber(b.metadata, 'sold') - metaNumber(a.metadata, 'sold')
    );
  }

  if (activeMin !== undefined) {
    products = products.filter((p) => p.price >= activeMin);
  }
  if (activeMax !== undefined) {
    products = products.filter((p) => p.price <= activeMax);
  }

  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const heading =
    activeBrand?.name ?? activeCategory?.name ?? (deals ? 'Deals & offers' : 'All products');

  const listingUrl = `/products${categorySlug ? `?category=${categorySlug}` : ''}`;

  return (
    <div className="container-page pb-10 pt-3 sm:pt-4">
      <JsonLd
        id="products"
        data={[
          collectionPageSchema({
            name: heading,
            description: activeCategory?.description ?? `${heading} — delivered across Ghana.`,
            url: listingUrl,
            products,
          }),
          breadcrumbSchema([
            { name: 'Home', href: '/' },
            { name: 'Shop', href: '/products' },
            ...(activeCategory ? [{ name: activeCategory.name, href: `/categories/${activeCategory.slug}` }] : []),
          ]),
        ]}
      />

      {/* Breadcrumb */}
      <nav className="hide-scrollbar flex items-center gap-1 overflow-x-auto py-2 text-[11.5px] text-muted">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href="/products" className="hover:text-brand">
          Shop
        </Link>
        {activeCategory && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="truncate font-semibold text-ink">{activeCategory.name}</span>
          </>
        )}
      </nav>

      {/* Header */}
      <div className="rounded-xl border border-line bg-surface-soft p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[26px]">
              {query ? `Results for “${query}”` : heading}
            </h1>
            <p className="mt-1 text-[12px] text-muted">
              {products.length} product{products.length === 1 ? '' : 's'} available
              {activeCategory ? ` in ${activeCategory.name}` : ''}
              {activeSkinType ? ` for ${activeSkinType.label.toLowerCase()} skin` : ''}
              {activeBrand ? ` from ${activeBrand.name}` : ''} ·
              authentic products, nationwide delivery
            </p>

            {/* Skin type quick filters */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Link
                href={`/products${categorySlug ? `?category=${categorySlug}` : ''}`}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  !skinType
                    ? 'border-brand bg-brand text-white'
                    : 'border-line bg-white text-gray-600 hover:border-brand/60'
                }`}
              >
                All skin types
              </Link>
              {skinTypes.map((type) => {
                const search = new URLSearchParams();
                if (categorySlug) search.set('category', categorySlug);
                if (deals) search.set('deals', '1');
                search.set('skin', type.slug);
                return (
                  <Link
                    key={type.slug}
                    href={`/products?${search.toString()}`}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                      skinType === type.slug
                        ? 'border-brand bg-brand text-white'
                        : 'border-line bg-white text-gray-600 hover:border-brand/60'
                    }`}
                  >
                    <span aria-hidden="true">{type.emoji}</span>
                    {type.label}
                  </Link>
                );
              })}
            </div>

            {/* Brand quick filters */}
            {brands.length > 0 ? (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="mr-0.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">
                  Brand
                </span>
                {brands.slice(0, 10).map((brand) => {
                  const search = new URLSearchParams();
                  if (categorySlug) search.set('category', categorySlug);
                  if (deals) search.set('deals', '1');
                  if (skinType) search.set('skin', skinType);
                  search.set('brand', brand.slug);
                  return (
                    <Link
                      key={brand.id}
                      href={`/products?${search.toString()}`}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                        brandFilter === brand.slug
                          ? 'border-brand bg-brand text-white'
                          : 'border-line bg-white text-gray-600 hover:border-brand/60'
                      }`}
                    >
                      {brand.name}
                    </Link>
                  );
                })}
                {brandFilter ? (
                  <Link
                    href={`/products${categorySlug ? `?category=${categorySlug}` : ''}`}
                    className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-bold text-gray-600 hover:border-brand/60"
                  >
                    Clear brand
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>

          <form action="/products" className="flex h-10 w-full max-w-sm items-center rounded-lg border border-line bg-white pl-3">
            {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
            <Search className="h-4 w-4 text-gray-400" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search products…"
              className="h-full w-full bg-transparent px-2 text-[12.5px] outline-none placeholder:text-gray-400"
              aria-label="Search products"
            />
            <button
              type="submit"
              className="m-1 h-8 shrink-0 rounded-md bg-brand px-3.5 text-[12px] font-bold text-white hover:bg-brand-dark"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4 flex gap-5">
        <Suspense fallback={<div className="hidden w-56 lg:block" />}>
          <ShopFilters
            categories={categories}
            activeCategory={categorySlug}
            activeSkinType={skinType}
            skinTypes={skinTypes}
            activeMin={activeMin}
            activeMax={activeMax}
            deals={deals}
            query={query}
          />
        </Suspense>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[11.5px] text-muted">
              Showing <span className="font-bold text-ink">{products.length}</span> items
            </p>
            <Suspense fallback={null}>
              <SortSelect value={rawSort} />
            </Suspense>
          </div>

          {products.length === 0 ? (
            <div className="panel flex flex-col items-center justify-center px-6 py-16 text-center">
              <PackageSearch className="h-10 w-10 text-gray-300" />
              <h2 className="mt-3 text-[15px] font-bold text-ink">No products found</h2>
              <p className="mt-1 max-w-sm text-[12.5px] text-muted">
                Try a different search term or clear your filters to see everything we stock.
              </p>
              <Link href="/products" className="btn-brand mt-4 h-10 px-5 text-[12.5px]">
                Browse all products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
