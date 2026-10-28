'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Pencil, Search } from 'lucide-react';
import { formatCedis } from '@/lib/utils';
import ArchiveButton from './ArchiveButton';

export interface AdminProductRow {
  id: string;
  name: string;
  brand: string | null;
  thumbnail: string | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number | null;
  skin_types: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  archived: boolean;
  created_at: string;
  category: { id: string; name: string } | null;
}

interface ProductsClientProps {
  products: AdminProductRow[];
  categories: { id: string; name: string }[];
  skinTypes: { slug: string; label: string; emoji: string | null }[];
  demoMode: boolean;
}

export default function ProductsClient({
  products,
  categories,
  skinTypes,
  demoMode,
}: ProductsClientProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [skin, setSkin] = useState('all');
  const [stock, setStock] = useState('all');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        (product.brand ?? '').toLowerCase().includes(term);

      const matchesCategory =
        category === 'all' || (product.category?.name ?? '') === category;

      const matchesSkin =
        skin === 'all' || (product.skin_types ?? []).includes(skin);

      const threshold = product.low_stock_threshold ?? 10;
      const matchesStock =
        stock === 'all' ||
        (stock === 'in' && product.stock_quantity > threshold) ||
        (stock === 'low' && product.stock_quantity > 0 && product.stock_quantity <= threshold) ||
        (stock === 'out' && product.stock_quantity === 0);

      const matchesStatus =
        status === 'all' ||
        (status === 'active' && product.is_active && !product.archived) ||
        (status === 'draft' && !product.is_active && !product.archived) ||
        (status === 'archived' && product.archived);

      return matchesSearch && matchesCategory && matchesSkin && matchesStock && matchesStatus;
    });
  }, [products, search, category, skin, stock, status]);

  const reset = () => {
    setSearch('');
    setCategory('all');
    setSkin('all');
    setStock('all');
    setStatus('all');
  };

  const hasFilters =
    search || category !== 'all' || skin !== 'all' || stock !== 'all' || status !== 'all';

  const skinLabel = (slug: string) => skinTypes.find((type) => type.slug === slug);

  return (
    <div>
      {demoMode ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
          <strong className="font-bold">Demo catalogue.</strong> Connect Supabase in{' '}
          <code>.env.local</code> to upload real products — this list is bundled sample data.
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or brand…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-[13.5px] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </div>

        {[
          {
            value: category,
            onChange: setCategory,
            options: [
              { value: 'all', label: 'All categories' },
              ...categories.map((item) => ({ value: item.name, label: item.name })),
            ],
          },
          {
            value: skin,
            onChange: setSkin,
            options: [
              { value: 'all', label: 'All skin types' },
              ...skinTypes.map((item) => ({
                value: item.slug,
                label: `${item.emoji ?? ''} ${item.label}`.trim(),
              })),
            ],
          },
          {
            value: stock,
            onChange: setStock,
            options: [
              { value: 'all', label: 'Any stock' },
              { value: 'in', label: 'In stock' },
              { value: 'low', label: 'Low stock' },
              { value: 'out', label: 'Out of stock' },
            ],
          },
          {
            value: status,
            onChange: setStatus,
            options: [
              { value: 'all', label: 'All status' },
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Hidden' },
              { value: 'archived', label: 'Archived' },
            ],
          },
        ].map((filter, index) => (
          <select
            key={index}
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}

        {hasFilters ? (
          <button
            onClick={reset}
            className="rounded-lg bg-gray-100 px-3 py-2.5 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-200"
          >
            Reset
          </button>
        ) : null}
      </div>

      <p className="mb-3 text-[12px] text-gray-500">
        Showing {filtered.length} of {products.length} products
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-gray-100 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-5 py-3 font-bold">Product</th>
              <th className="px-5 py-3 font-bold">Skin types</th>
              <th className="px-5 py-3 font-bold">Price</th>
              <th className="px-5 py-3 font-bold">Stock</th>
              <th className="px-5 py-3 font-bold">Category</th>
              <th className="px-5 py-3 font-bold">Status</th>
              <th className="px-5 py-3 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((product) => {
              const threshold = product.low_stock_threshold ?? 10;
              const isOut = product.stock_quantity === 0;
              const isLow = !isOut && product.stock_quantity <= threshold;

              return (
                <tr key={product.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                        {product.thumbnail ? (
                          <Image
                            src={product.thumbnail}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{product.name}</p>
                        <p className="text-[11.5px] text-gray-500">
                          {product.brand ?? 'No brand'}
                          {product.is_featured ? ' · Featured' : ''}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    {(product.skin_types ?? []).length === 0 ? (
                      <span className="text-[11.5px] text-gray-400">All skin types</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(product.skin_types ?? []).map((slug) => {
                          const type = skinLabel(slug);
                          return (
                            <span
                              key={slug}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-[10.5px] font-semibold text-gray-700"
                            >
                              {type?.emoji ?? '✨'} {type?.label ?? slug}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <p className="font-bold text-gray-900">{formatCedis(product.price)}</p>
                    {product.compare_at_price && product.compare_at_price > product.price ? (
                      <p className="text-[11px] text-gray-400 line-through">
                        {formatCedis(product.compare_at_price)}
                      </p>
                    ) : null}
                  </td>

                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isOut
                          ? 'bg-red-50 text-red-700'
                          : isLow
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {isOut ? 'Out of stock' : `${product.stock_quantity} in stock`}
                    </span>
                    {isLow ? (
                      <p className="mt-0.5 text-[10.5px] text-gray-400">
                        alert at {threshold}
                      </p>
                    ) : null}
                  </td>

                  <td className="px-5 py-3.5 text-gray-600">
                    {product.category?.name ?? '—'}
                  </td>

                  <td className="px-5 py-3.5">
                    {product.archived ? (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">
                        Archived
                      </span>
                    ) : product.is_active ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        Hidden
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <ArchiveButton productId={product.id} isActive={product.is_active} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[13px] text-gray-500">No products match these filters.</p>
            {hasFilters ? (
              <button onClick={reset} className="mt-2 text-[13px] font-bold text-red-600">
                Reset filters →
              </button>
            ) : (
              <Link href="/admin/products/new" className="mt-2 inline-block text-[13px] font-bold text-red-600">
                Add your first product →
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
