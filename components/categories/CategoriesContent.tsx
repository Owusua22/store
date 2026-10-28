'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, PackageSearch, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import type { Category, Product } from '@/types';

interface CategoryContentProps {
  category: Category;
  subcategories: Category[];
  products: Product[];
  allCategories: Category[];
}

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'name';

const PRICE_BUCKETS = [
  { label: 'Under GH₵80', min: 0, max: 80 },
  { label: 'GH₵80 – GH₵120', min: 80, max: 120 },
  { label: 'GH₵120 – GH₵200', min: 120, max: 200 },
  { label: 'Over GH₵200', min: 200, max: Number.POSITIVE_INFINITY },
];

export function CategoryContent({
  category,
  subcategories,
  products,
  allCategories,
}: CategoryContentProps) {
  const [sort, setSort] = useState<SortKey>('newest');
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [priceBucket, setPriceBucket] = useState<number | null>(null);
  const [offersOnly, setOffersOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = [...products];

    if (selectedSub) list = list.filter((p) => p.category_id === selectedSub);

    if (priceBucket !== null) {
      const bucket = PRICE_BUCKETS[priceBucket];
      list = list.filter((p) => p.price >= bucket.min && p.price < bucket.max);
    }

    if (offersOnly) {
      list = list.filter(
        (p) => p.compare_at_price !== null && p.compare_at_price > p.price
      );
    }

    switch (sort) {
      case 'price_asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return list.sort((a, b) => b.price - a.price);
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [products, selectedSub, priceBucket, offersOnly, sort]);

  const reset = () => {
    setSelectedSub(null);
    setPriceBucket(null);
    setOffersOnly(false);
    setSort('newest');
  };

  const hasFilters = Boolean(selectedSub || priceBucket !== null || offersOnly);

  const siblings = allCategories.filter(
    (c) => c.slug !== category.slug && !c.parent_id
  );

  return (
    <div className="pb-10">
      {/* Breadcrumb */}
      <div className="container-page">
        <nav className="hide-scrollbar flex items-center gap-1 overflow-x-auto py-2 text-[11.5px] text-muted">
          <Link href="/" className="hover:text-brand">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link href="/products" className="hover:text-brand">
            Shop
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate font-semibold text-ink">{category.name}</span>
        </nav>
      </div>

      {/* Category header */}
      <div className="container-page">
        <div className="relative overflow-hidden rounded-xl border border-line bg-brand-soft p-5 sm:p-6">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand">
              Category
            </span>
            <h1 className="font-serif mt-2 text-[36px] text-ink">
              {category.name}
            </h1>
            <p className="mt-1 max-w-lg text-[12.5px] leading-relaxed text-gray-600">
              {category.description ??
                `Shop authentic ${category.name.toLowerCase()} with fast delivery across Ghana.`}
            </p>
            <p className="mt-2 text-[11.5px] font-semibold text-brand">
              {products.length} product{products.length === 1 ? '' : 's'} · pay on delivery available
            </p>
          </div>
          {category.icon && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 text-[120px] opacity-20 sm:block"
            >
              {category.icon}
            </span>
          )}
        </div>
      </div>

      {/* Subcategory chips */}
      {subcategories.length > 0 && (
        <div className="container-page mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedSub(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold ${
              !selectedSub
                ? 'bg-brand text-white'
                : 'border border-line bg-white text-gray-600'
            }`}
          >
            All
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSelectedSub(sub.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold ${
                selectedSub === sub.id
                  ? 'bg-brand text-white'
                  : 'border border-line bg-white text-gray-600'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      <div className="container-page mt-4">
        {/* Toolbar */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-[12.5px] font-bold text-ink lg:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
          </button>

          <p className="hidden text-[11.5px] text-muted lg:block">
            Showing <span className="font-bold text-ink">{filtered.length}</span> items
          </p>

          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                type="button"
                onClick={reset}
                className="hidden items-center gap-1 text-[11.5px] font-bold text-brand hover:underline sm:flex"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              aria-label="Sort products"
              className="h-9 rounded-md border border-line bg-white px-2.5 text-[12.5px] font-semibold text-ink outline-none focus:border-brand"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        <div className="flex gap-5">
          {/* Sidebar */}
          <aside className="hidden w-52 shrink-0 lg:block">
            <div className="panel sticky top-[136px] p-4">
              <h2 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink">
                Price
              </h2>
              <ul className="space-y-1">
                {PRICE_BUCKETS.map((bucket, index) => (
                  <li key={bucket.label}>
                    <button
                      type="button"
                      onClick={() =>
                        setPriceBucket(priceBucket === index ? null : index)
                      }
                      className={`w-full rounded-md px-2.5 py-1.5 text-left text-[12.5px] font-semibold ${
                        priceBucket === index
                          ? 'bg-brand-soft text-brand'
                          : 'text-gray-600 hover:bg-surface-soft'
                      }`}
                    >
                      {bucket.label}
                    </button>
                  </li>
                ))}
              </ul>

              <h2 className="mb-2 mt-5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink">
                Offers
              </h2>
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold text-gray-600 hover:bg-surface-soft">
                <input
                  type="checkbox"
                  checked={offersOnly}
                  onChange={(event) => setOffersOnly(event.target.checked)}
                  className="h-3.5 w-3.5 accent-[var(--brand)]"
                />
                On sale only
              </label>

              <h2 className="mb-2 mt-5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink">
                Other categories
              </h2>
              <ul className="space-y-1">
                {siblings.slice(0, 7).map((sibling) => (
                  <li key={sibling.id}>
                    <Link
                      href={`/categories/${sibling.slug}`}
                      className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold text-gray-600 hover:bg-surface-soft hover:text-brand"
                    >
                      {sibling.name}
                      <ChevronRight className="h-3 w-3 text-gray-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Grid */}
          <div className="min-w-0 flex-1">
            {filtered.length === 0 ? (
              <div className="panel flex flex-col items-center justify-center px-6 py-16 text-center">
                <PackageSearch className="h-10 w-10 text-gray-300" />
                <h2 className="mt-3 text-[15px] font-bold text-ink">
                  Nothing matches those filters
                </h2>
                <p className="mt-1 text-[12.5px] text-muted">
                  Clear your filters to see the full {category.name.toLowerCase()} range.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="btn-brand mt-4 h-10 px-5 text-[12.5px]"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 xl:grid-cols-4">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[65] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/45"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-soft"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink">
              Price
            </h3>
            <div className="flex flex-wrap gap-2">
              {PRICE_BUCKETS.map((bucket, index) => (
                <button
                  key={bucket.label}
                  type="button"
                  onClick={() => setPriceBucket(priceBucket === index ? null : index)}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
                    priceBucket === index
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-line text-gray-600'
                  }`}
                >
                  {bucket.label}
                </button>
              ))}
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-[12.5px] font-semibold text-gray-600">
              <input
                type="checkbox"
                checked={offersOnly}
                onChange={(event) => setOffersOnly(event.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--brand)]"
              />
              On sale only
            </label>

            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="btn-brand mt-5 h-11 w-full text-[13px]"
            >
              Show {filtered.length} results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
