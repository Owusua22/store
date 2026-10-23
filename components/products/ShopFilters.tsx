'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { formatCedis } from '@/lib/utils';
import type { DemoCategory } from '@/lib/demo/catalog';

interface ShopFiltersProps {
  categories: DemoCategory[];
  activeCategory?: string;
  activeMin?: number;
  activeMax?: number;
  deals?: boolean;
  query?: string;
}

const PRICE_BUCKETS = [
  { label: 'Under GH₵80', min: 0, max: 80 },
  { label: 'GH₵80 – GH₵120', min: 80, max: 120 },
  { label: 'GH₵120 – GH₵200', min: 120, max: 200 },
  { label: 'Over GH₵200', min: 200, max: undefined },
];

export function ShopFilters({
  categories,
  activeCategory,
  activeMin,
  activeMax,
  deals,
  query,
}: ShopFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const update = (key: string, value?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined || value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/products?${params.toString()}`);
    setOpen(false);
  };

  const clearAll = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    router.push(`/products?${params.toString()}`);
    setOpen(false);
  };

  const hasFilters = Boolean(
    activeCategory || activeMin !== undefined || activeMax !== undefined || deals
  );

  const categoryLinks = (
    <ul className="space-y-1">
      <li>
        <button
          type="button"
          onClick={() => update('category', null)}
          className={`w-full rounded-md px-2.5 py-1.5 text-left text-[12.5px] font-semibold transition-colors ${
            !activeCategory
              ? 'bg-brand-soft text-brand'
              : 'text-gray-600 hover:bg-surface-soft hover:text-ink'
          }`}
        >
          All products
        </button>
      </li>
      {categories.map((category) => (
        <li key={category.id}>
          <button
            type="button"
            onClick={() => update('category', category.slug)}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[12.5px] font-semibold transition-colors ${
              activeCategory === category.slug
                ? 'bg-brand-soft text-brand'
                : 'text-gray-600 hover:bg-surface-soft hover:text-ink'
            }`}
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">{category.icon}</span>
              {category.name}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  const priceLinks = (
    <ul className="space-y-1">
      {PRICE_BUCKETS.map((bucket) => {
        const active = activeMin === bucket.min && activeMax === bucket.max;
        return (
          <li key={bucket.label}>
            <button
              type="button"
              onClick={() => {
                if (active) {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('min');
                  params.delete('max');
                  router.push(`/products?${params.toString()}`);
                } else {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('min', String(bucket.min));
                  if (bucket.max !== undefined) params.set('max', String(bucket.max));
                  else params.delete('max');
                  router.push(`/products?${params.toString()}`);
                }
                setOpen(false);
              }}
              className={`w-full rounded-md px-2.5 py-1.5 text-left text-[12.5px] font-semibold transition-colors ${
                active
                  ? 'bg-brand-soft text-brand'
                  : 'text-gray-600 hover:bg-surface-soft hover:text-ink'
              }`}
            >
              {bucket.label}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const dealToggle = (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold text-gray-600 hover:bg-surface-soft">
      <input
        type="checkbox"
        checked={Boolean(deals)}
        onChange={(event) => update('deals', event.target.checked ? '1' : null)}
        className="h-3.5 w-3.5 accent-[var(--brand)]"
      />
      On sale only
    </label>
  );

  const filterBody = (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink">
          Categories
        </h3>
        {categoryLinks}
      </div>

      <div>
        <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink">
          Price
        </h3>
        {priceLinks}
      </div>

      <div>
        <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink">
          Offers
        </h3>
        {dealToggle}
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 text-[11.5px] font-bold text-brand hover:underline"
        >
          <X className="h-3.5 w-3.5" /> Clear all filters
        </button>
      )}

      <p className="border-t border-line pt-3 text-[11px] text-muted">
        Prices from {formatCedis(55)} · Free delivery over {formatCedis(300)}
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="panel sticky top-[136px] p-4">{filterBody}</div>
      </aside>

      {/* Mobile trigger */}
      <div className="mb-3 flex items-center justify-between lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-[12.5px] font-bold text-ink"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11.5px] font-semibold text-brand"
          >
            Clear
          </button>
        )}
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-0 z-[65] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/45"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-soft"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {filterBody}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-brand mt-5 h-11 w-full text-[13px]"
            >
              Show results
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-[12px] text-muted">
      <span className="hidden sm:inline">Sort by</span>
      <select
        value={value}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('sort', event.target.value);
          router.push(`/products?${params.toString()}`);
        }}
        className="h-9 rounded-md border border-line bg-white px-2.5 text-[12.5px] font-semibold text-ink outline-none focus:border-brand"
      >
        <option value="newest">Newest</option>
        <option value="popular">Best selling</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
        <option value="name">Name A–Z</option>
      </select>
    </label>
  );
}
