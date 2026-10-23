'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import ArchiveButton from './ArchiveButton';

interface Variant {
  id: string;
  size: string;
  color: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  category: { name: string } | null;
  variants: Variant[];
}

interface Category {
  id: string;
  name: string;
}

interface ProductsClientProps {
  products: Product[];
  categories: Category[];
}

export default function ProductsClient({ products, categories }: ProductsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ✅ Filter and search logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const variants = (product.variants ?? []) as Variant[];
      const totalStock = variants.length > 0
        ? variants.reduce((sum, v) => sum + v.stock_quantity, 0)
        : product.stock_quantity;

      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower);

      // Category filter
      const categoryName = typeof product.category === 'object' && product.category
        ? product.category.name
        : product.category;
      const matchesCategory =
        selectedCategory === 'all' || categoryName === selectedCategory;

      // Stock filter
      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = totalStock > 0 && totalStock <= 10;
      if (stockFilter === 'out') matchesStock = totalStock === 0;
      if (stockFilter === 'in') matchesStock = totalStock > 10;

      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.is_active) ||
        (statusFilter === 'archived' && !product.is_active);

      return matchesSearch && matchesCategory && matchesStock && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, stockFilter, statusFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setStockFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters =
    searchTerm || selectedCategory !== 'all' || stockFilter !== 'all' || statusFilter !== 'all';

  return (
    <>
      {/* 🔍 Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by product name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-3 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* 🎯 Filters */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Level
            </label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            >
              <option value="all">All Stock Levels</option>
              <option value="in">In Stock (10)</option>
              <option value="low">Low Stock (1-10)</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        {hasActiveFilters && (
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        )}
      </div>

      {/* 📊 Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Variants
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.map((product) => {
              const variants = (product.variants ?? []) as Variant[];
              const hasVariants = variants.length > 0;
              const uniqueSizes = [...new Set(variants.map((v: Variant) => v.size))];
              const uniqueColors = [...new Set(variants.map((v: Variant) => v.color))];
              const totalVariantStock = variants.reduce((sum: number, v: Variant) => sum + v.stock_quantity, 0);
              const priceRange = hasVariants
                ? { min: Math.min(...variants.map((v: Variant) => v.price)), max: Math.max(...variants.map((v: Variant) => v.price)) }
                : null;
              const displayStock = hasVariants ? totalVariantStock : product.stock_quantity;

              return (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  {/* Product */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.thumbnail ? (
                        <Image
                          src={product.thumbnail}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                          📷
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{product.description || ''}</p>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4">
                    {hasVariants && priceRange ? (
                      <div>
                        <p className="font-medium text-gray-900">
                          {priceRange.min === priceRange.max
                            ? formatPrice(priceRange.min)
                            : `${formatPrice(priceRange.min)} – ${formatPrice(priceRange.max)}`}
                        </p>
                        <p className="text-xs text-gray-400">from variants</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-gray-900">{formatPrice(product.price)}</p>
                        {product.compare_at_price && (
                          <p className="text-sm text-gray-400 line-through">{formatPrice(product.compare_at_price)}</p>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Variants */}
                  <td className="px-6 py-4">
                    {hasVariants ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{variants.length} variant{variants.length !== 1 ? 's' : ''}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {uniqueSizes.map((size: string) => (
                            <span key={size} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-700 rounded font-medium">
                              {size}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {uniqueColors.slice(0, 5).map((color: string) => (
                            <span
                              key={color}
                              className="w-3.5 h-3.5 rounded-full border border-gray-200"
                              style={{ backgroundColor: color.toLowerCase() }}
                              title={color}
                            />
                          ))}
                          {uniqueColors.length > 5 && (
                            <span className="text-[10px] text-gray-400">+{uniqueColors.length - 5}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No variants</span>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      displayStock > 10 ? 'bg-green-100 text-green-800' :
                      displayStock > 0 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {displayStock} in stock
                    </span>
                    {hasVariants && (
                      <p className="text-[10px] text-gray-400 mt-0.5">across {variants.length} variants</p>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {typeof product.category === 'object' && product.category !== null
                      ? (product.category as { name: string }).name
                      : product.category || '—'}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.is_active ? 'Active' : 'Archived'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                      <ArchiveButton productId={product.id} isActive={product.is_active} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(!filteredProducts || filteredProducts.length === 0) && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📦</div>
            {hasActiveFilters ? (
              <>
                <p className="text-gray-500 mb-4">No products match your filters</p>
                <button
                  onClick={resetFilters}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Reset filters →
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-4">No products found</p>
                <Link href="/admin/products/new" className="text-red-600 hover:text-red-700 font-medium">
                  Add your first product →
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}