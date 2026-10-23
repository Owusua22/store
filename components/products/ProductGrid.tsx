// src/components/products/ProductGrid.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ProductCard } from './ProductCard';
import type { Product, Category } from '@/types';

interface ProductGridProps {
  products: Product[];
  categories: Pick<Category, 'id' | 'name' | 'slug'>[];
  total: number;
  page: number;
  pageSize: number;
  currentSearch?: string;
  currentCategory?: string;
  currentSort?: string;
}

export function ProductGrid({
  products,
  categories,
  total,
  page,
  pageSize,
  currentSearch,
  currentCategory,
  currentSort,
}: ProductGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const totalPages = Math.ceil(total / pageSize);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (currentSearch) params.set('search', currentSearch);
    if (currentCategory) params.set('category', currentCategory);
    if (currentSort) params.set('sort', currentSort);
    params.set('page', '1');

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="search"
          placeholder="Search products..."
          defaultValue={currentSearch}
          onChange={(e) => updateParams({ search: e.target.value || undefined })}
          className="flex-1 min-w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />

        <select
          value={currentCategory || ''}
          onChange={(e) => updateParams({ category: e.target.value || undefined })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={currentSort || 'newest'}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          <button
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateParams({ page: String(p) })}
              className={`px-4 py-2 border rounded-lg transition-colors ${
                p === page ? 'bg-red-600 text-white border-red-600' : 'hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: String(page + 1) })}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}