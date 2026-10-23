// src/components/categories/CategoryContent.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight,

  ArrowRight,
  Grid3X3,
  LayoutGrid,
  SlidersHorizontal,
  X,
  Package,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils';
import { toast } from 'react-toastify';
import type { Product, Category } from '@/types';

interface CategoryContentProps {
  category: Category;
  subcategories: Category[];
  products: Product[];
  allCategories: Category[];
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'name';
type ViewMode = 'grid' | 'large';

const GRADIENT = 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)';

const PRICE_BUCKETS: { label: string; range: [number, number] }[] = [
  { label: 'Under $25', range: [0, 25] },
  { label: '$25 - $50', range: [25, 50] },
  { label: '$50 - $100', range: [50, 100] },
  { label: '$100 - $200', range: [100, 200] },
  { label: 'Over $200', range: [200, 99999] },
];

export function CategoryContent({
  category,
  subcategories,
  products,
  allCategories,
}: CategoryContentProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const parentCategories = useMemo(
    () => allCategories.filter((c) => !c.parent_id),
    [allCategories]
  );

  const getSubcats = (parentId: string) =>
    allCategories.filter((c) => c.parent_id === parentId);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedSubcategory) {
      result = result.filter((p) => p.category_id === selectedSubcategory);
    }
    if (priceRange) {
      result = result.filter(
        (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
      );
    }
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return result;
  }, [products, selectedSubcategory, priceRange, sortBy]);

  const clearFilters = () => {
    setSelectedSubcategory(null);
    setPriceRange(null);
    setSortBy('newest');
  };

  const hasActiveFilters = !!(selectedSubcategory || priceRange);
  const activeFilterCount =
    (selectedSubcategory ? 1 : 0) + (priceRange ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/50 to-white">
      {/* ==================== COMPACT HEADER ==================== */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/85 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Row 1 — Breadcrumb (tiny) */}
          <nav className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-400 pt-2 sm:pt-2.5 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link href="/" className="hover:text-indigo-600 transition">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Link href="/products" className="hover:text-indigo-600 transition">
              Shop
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-slate-700 font-medium truncate">
              {category.name}
            </span>
          </nav>

          {/* Row 2 — Title + count + view toggle */}
          <div className="flex items-center justify-between gap-3 py-2 sm:py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {category.icon && (
                <span className="text-2xl sm:text-[28px] leading-none shrink-0">
                  {category.icon}
                </span>
              )}
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 truncate">
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: GRADIENT }}
                  >
                    {category.name}
                  </span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate -mt-0.5">
                  <span className="font-semibold text-slate-700">
                    {filteredProducts.length}
                  </span>{' '}
                  {filteredProducts.length === 1 ? 'item' : 'items'}
                  {category.description && (
                    <span className="hidden sm:inline">
                      {' '}
                      • {category.description}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* View toggle — hidden on small mobile */}
            <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 border border-slate-200/60 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('large')}
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'large'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label="Large view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 3 — Sort + Mobile Filter */}
          <div className="flex items-center gap-2 pb-2 sm:pb-2.5">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden relative flex items-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-lg text-white shadow-sm"
              style={{ background: GRADIENT }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white/25 text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 flex-1 lg:flex-none lg:ml-auto px-3 text-xs sm:text-sm rounded-lg bg-slate-100/80 border border-slate-200/60 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition"
            >
              <option value="newest">✨ Newest</option>
              <option value="price_asc">↑ Price: Low to High</option>
              <option value="price_desc">↓ Price: High to Low</option>
              <option value="name">A-Z Name</option>
            </select>
          </div>

          {/* Row 4 — Subcategory pills */}
          {subcategories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-2.5 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
              <button
                onClick={() => setSelectedSubcategory(null)}
                className={`shrink-0 h-7 px-3 text-xs font-semibold rounded-full border transition ${
                  !selectedSubcategory
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
                style={!selectedSubcategory ? { background: GRADIENT } : undefined}
              >
                All
              </button>
              {subcategories.map((sub) => {
                const isActive = selectedSubcategory === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() =>
                      setSelectedSubcategory(isActive ? null : sub.id)
                    }
                    className={`shrink-0 h-7 px-3 text-xs font-semibold rounded-full border transition flex items-center gap-1.5 ${
                      isActive
                        ? 'text-white border-transparent shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                    }`}
                    style={isActive ? { background: GRADIENT } : undefined}
                  >
                    {sub.icon && <span>{sub.icon}</span>}
                    {sub.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ==================== MAIN ==================== */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex gap-6 lg:gap-8">
          {/* ---------- Sidebar (desktop) ---------- */}
          <aside className="hidden lg:block w-60 shrink-0 space-y-4">
            <div className="sticky top-44 space-y-4">
              {/* Categories */}
              <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm shadow-slate-900/[0.02]">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 px-2">
                  Categories
                </h3>
                <nav className="space-y-0.5">
                  {parentCategories.map((cat) => {
                    const isActive = cat.id === category.id;
                    const subs = getSubcats(cat.id);
                    return (
                      <div key={cat.id}>
                        <Link
                          href={`/categories/${cat.slug}`}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-700 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="text-base">{cat.icon || '📁'}</span>
                          <span className="truncate">{cat.name}</span>
                        </Link>
                        {isActive && subs.length > 0 && (
                          <div className="ml-7 mt-1 space-y-0.5 border-l border-slate-100 pl-2">
                            {subs.map((sub) => {
                              const subActive = selectedSubcategory === sub.id;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() =>
                                    setSelectedSubcategory(
                                      subActive ? null : sub.id
                                    )
                                  }
                                  className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-[13px] transition ${
                                    subActive
                                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                  }`}
                                >
                                  {sub.icon && <span>{sub.icon}</span>}
                                  <span className="truncate">{sub.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>

              {/* Price filter */}
              <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm shadow-slate-900/[0.02]">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 px-2">
                  Price Range
                </h3>
                <div className="space-y-0.5">
                  {PRICE_BUCKETS.map(({ label, range }) => {
                    const active =
                      priceRange &&
                      priceRange[0] === range[0] &&
                      priceRange[1] === range[1];
                    return (
                      <button
                        key={label}
                        onClick={() => setPriceRange(active ? null : range)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-sm transition ${
                          active
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition font-semibold flex items-center justify-center gap-2 border border-red-100"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              )}
            </div>
          </aside>

          {/* ---------- Products ---------- */}
          <div className="flex-1 min-w-0">
            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mr-1">
                  Active:
                </span>
                {selectedSubcategory && (
                  <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
                    {subcategories.find((s) => s.id === selectedSubcategory)?.icon}{' '}
                    {subcategories.find((s) => s.id === selectedSubcategory)?.name}
                    <button
                      onClick={() => setSelectedSubcategory(null)}
                      className="p-0.5 hover:bg-indigo-100 rounded-full transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {priceRange && (
                  <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-100">
                    {formatPrice(priceRange[0])} -{' '}
                    {priceRange[1] === 99999 ? '∞' : formatPrice(priceRange[1])}
                    <button
                      onClick={() => setPriceRange(null)}
                      className="p-0.5 hover:bg-purple-100 rounded-full transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-xs text-slate-500 hover:text-red-600 underline ml-1"
                >
                  Clear all
                </button>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <EmptyState
                hasActiveFilters={hasActiveFilters}
                onClear={clearFilters}
              />
            ) : (
              <div
                className={`grid gap-3 sm:gap-4 lg:gap-5 ${
                  viewMode === 'large'
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ==================== MOBILE FILTERS ==================== */}
      {showMobileFilters && (
        <MobileFilters
          subcategories={subcategories}
          selectedSubcategory={selectedSubcategory}
          setSelectedSubcategory={setSelectedSubcategory}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          onClose={() => setShowMobileFilters(false)}
          onClear={clearFilters}
        />
      )}
    </div>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */
function EmptyState({
  hasActiveFilters,
  onClear,
}: {
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center mb-4 border border-indigo-100">
        <Package className="w-7 h-7 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1.5">
        No products found
      </h3>
      <p className="text-sm text-slate-500 mb-5 max-w-sm">
        {hasActiveFilters
          ? "Try adjusting your filters to see more items."
          : "This category doesn't have any products yet."}
      </p>
      {hasActiveFilters ? (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm shadow-md"
          style={{ background: GRADIENT }}
        >
          Clear Filters
        </button>
      ) : (
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm shadow-md"
          style={{ background: GRADIENT }}
        >
          Browse All Products
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

/* ============================================================
   MOBILE FILTERS — bottom sheet
   ============================================================ */
function MobileFilters({
  subcategories,
  selectedSubcategory,
  setSelectedSubcategory,
  priceRange,
  setPriceRange,
  onClose,
  onClear,
}: {
  subcategories: Category[];
  selectedSubcategory: string | null;
  setSelectedSubcategory: (id: string | null) => void;
  priceRange: [number, number] | null;
  setPriceRange: (range: [number, number] | null) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Filters</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {subcategories.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Subcategories
              </h4>
              <div className="space-y-0.5">
                <button
                  onClick={() => setSelectedSubcategory(null)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition ${
                    !selectedSubcategory
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600'
                  }`}
                >
                  All
                </button>
                {subcategories.map((sub) => {
                  const active = selectedSubcategory === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() =>
                        setSelectedSubcategory(active ? null : sub.id)
                      }
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition ${
                        active
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600'
                      }`}
                    >
                      {sub.icon && <span>{sub.icon}</span>}
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Price Range
            </h4>
            <div className="space-y-0.5">
              {PRICE_BUCKETS.map(({ label, range }) => {
                const active =
                  priceRange &&
                  priceRange[0] === range[0] &&
                  priceRange[1] === range[1];
                return (
                  <button
                    key={label}
                    onClick={() => setPriceRange(active ? null : range)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-3 border-t border-slate-100 bg-white">
          <button
            onClick={onClear}
            className="flex-1 px-4 py-2.5 text-sm text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm text-white rounded-xl font-semibold shadow-md"
            style={{ background: GRADIENT }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PRODUCT CARD
   ============================================================ */
function ProductCard({
  product,
  viewMode,
}: {
  product: Product;
  viewMode: ViewMode;
}) {
  const { addToCart, isLoading } = useCart();
  const { isAuthenticated } = useAuth();

  const discount = product.compare_at_price
    ? Math.round(
        ((product.compare_at_price - product.price) /
          product.compare_at_price) *
          100
      )
    : null;

  const isOutOfStock = product.stock_quantity === 0;
  const isLarge = viewMode === 'large';

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign in');
      return;
    }
    if (isOutOfStock) return;
    await addToCart(product.id, 1);
  };

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-slate-200/70 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 overflow-hidden h-full flex flex-col">
        <div
          className={`relative overflow-hidden bg-slate-50 ${
            isLarge ? 'aspect-[4/3]' : 'aspect-[3/4]'
          }`}
        >
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes={isLarge ? '50vw' : '(max-width: 1024px) 50vw, 33vw'}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <span className="text-4xl">📦</span>
            </div>
          )}

          {discount && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-red-500 text-white text-[11px] font-bold rounded-md shadow-md">
              -{discount}%
            </span>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
              <span className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full">
                Sold Out
              </span>
            </div>
          )}

  
        </div>

        <div className={`flex-1 flex flex-col ${isLarge ? 'p-4 sm:p-5' : 'p-3 sm:p-4'}`}>
          {product.category && (
            <p className="text-[10px] sm:text-[11px] text-indigo-600 font-semibold uppercase tracking-wider mb-1 truncate">
              {product.category.icon} {product.category.name}
            </p>
          )}
          <h3
            className={`font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 ${
              isLarge ? 'text-base' : 'text-[13px] sm:text-sm'
            }`}
          >
            {product.name}
          </h3>
          {isLarge && product.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="flex items-baseline gap-2 mt-1.5">
            <span
              className={`font-bold text-slate-900 ${
                isLarge ? 'text-lg' : 'text-[15px] sm:text-base'
              }`}
            >
              {formatPrice(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-xs sm:text-sm text-slate-400 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>

          {product.sizes?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {product.sizes.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          {product.colors?.length > 0 && (
            <div className="mt-2 flex gap-1">
              {product.colors.slice(0, 5).map((c) => (
                <span
                  key={c}
                  className="w-3.5 h-3.5 rounded-full border border-slate-200 ring-1 ring-white"
                  style={{ backgroundColor: c.toLowerCase() }}
                  title={c}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}