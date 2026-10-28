'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight,
  ArrowRight,
  Grid3X3,
  LayoutGrid,
  Star,
  Package,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { formatCedis } from '@/lib/utils';
import { toast } from 'react-toastify';

interface ShowroomProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  thumbnail: string | null;
  stock_quantity: number;
  is_active: boolean;
  sizes: string[];
  colors: string[];
  description: string | null;
  category_id: string | null;
}

interface Showroom {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  type: string;
  max_products: number;
}

interface OtherShowroom {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  type: string;
}

interface ShowroomContentProps {
  showroom: Showroom;
  products: ShowroomProduct[];
  allShowrooms: OtherShowroom[];
}

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'name';
type ViewMode = 'grid' | 'large';

const TYPE_LABELS: Record<string, string> = {
  manual: 'Curated',
  auto_new: 'New Arrivals',
  auto_deals: 'On Sale',
  auto_bestselling: 'Best Sellers',
};

const TYPE_GRADIENTS: Record<string, string> = {
  manual: 'linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)',
  auto_new: 'linear-gradient(135deg, #059669, #0D9488, #0891B2)',
  auto_deals: 'linear-gradient(135deg, #DC2626, #EA580C, #D97706)',
  auto_bestselling: 'linear-gradient(135deg, #7C3AED, #9333EA, #C026D3)',
};

export function ShowroomContent({ showroom, products, allShowrooms }: ShowroomContentProps) {
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const gradient = TYPE_GRADIENTS[showroom.type] || TYPE_GRADIENTS.manual;
  const typeLabel = TYPE_LABELS[showroom.type] || 'Collection';

  const sortedProducts = useMemo(() => {
    const list = [...products];
    switch (sortBy) {
      case 'price_asc':  return list.sort((a, b) => a.price - b.price);
      case 'price_desc': return list.sort((a, b) => b.price - a.price);
      case 'name':       return list.sort((a, b) => a.name.localeCompare(b.name));
      default:           return list;
    }
  }, [products, sortBy]);

  const otherShowrooms = allShowrooms.filter((s) => s.id !== showroom.id);

  return (
    <div className="min-h-screen bg-paper">

      {/* ── Compact sticky header ── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/85 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-400 pt-2 sm:pt-2.5 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link href="/" className="hover:text-brand transition">Home</Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Link href="/products" className="hover:text-brand transition">Shop</Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-slate-700 font-medium truncate">{showroom.name}</span>
          </nav>

          {/* Title + view toggle */}
          <div className="flex items-center justify-between gap-3 py-2 sm:py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {showroom.icon && (
                <span className="text-2xl sm:text-[28px] leading-none shrink-0">{showroom.icon}</span>
              )}
              <div className="min-w-0">
                <h1 className="font-serif flex items-center gap-2 text-base sm:text-xl text-slate-900 truncate">
                  <span className="" style={{ backgroundImage: gradient }}>
                    {showroom.name}
                  </span>
                  <span
                    className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ background: gradient }}
                  >
                    {typeLabel}
                  </span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate -mt-0.5">
                  <span className="font-semibold text-slate-700">{sortedProducts.length}</span>{' '}
                  {sortedProducts.length === 1 ? 'item' : 'items'}
                  {showroom.description && (
                    <span className="hidden sm:inline"> • {showroom.description}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 border border-slate-200/60 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('large')}
                className={`p-1.5 rounded-md transition ${viewMode === 'large' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 pb-2 sm:pb-2.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 flex-1 lg:flex-none lg:ml-auto px-3 text-xs sm:text-sm rounded-lg bg-slate-100/80 border border-slate-200/60 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="default">Featured</option>
              <option value="price_asc">↑ Price: Low to High</option>
              <option value="price_desc">↓ Price: High to Low</option>
              <option value="name">A-Z Name</option>
            </select>
          </div>

          {/* Other showroom pills */}
          {otherShowrooms.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-2.5 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
              <Link
                href={`/showrooms/${showroom.slug}`}
                className="shrink-0 h-7 px-3 text-xs font-semibold rounded-full border text-white border-transparent shadow-sm"
                style={{ background: gradient }}
              >
                {showroom.icon} {showroom.name}
              </Link>
              {otherShowrooms.slice(0, 8).map((s) => (
                <Link
                  key={s.id}
                  href={`/showrooms/${s.slug}`}
                  className="shrink-0 h-7 px-3 text-xs font-semibold rounded-full border bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 transition flex items-center gap-1.5"
                >
                  {s.icon && <span>{s.icon}</span>}{s.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex gap-6 lg:gap-8">
          <div className="flex-1 min-w-0">
            {sortedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-sage-wash flex items-center justify-center mb-4 border border-brand-soft">
                  <Package className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1.5">No products yet</h3>
                <p className="text-sm text-slate-500 mb-5 max-w-sm">
                  This collection is being curated. Check back soon!
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm shadow-md"
                  style={{ background: gradient }}
                >
                  Browse All Products <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div
                className={`grid gap-3 sm:gap-4 ${
                  viewMode === 'large'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }`}
              >
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showroomType={showroom.type}
                    gradient={gradient}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ProductCard({
  product,
  showroomType,
  gradient,
  viewMode,
}: {
  product: ShowroomProduct;
  showroomType: string;
  gradient: string;
  viewMode: ViewMode;
}) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : null;
  const isOutOfStock = product.stock_quantity === 0;
  const isLarge = viewMode === 'large';

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please sign in'); return; }
    if (isOutOfStock) return;
    await addToCart(product.id, 1);
  };

  if (isLarge) {
    /*
      ── Large / list-style card ─────────────────────────────────────────
      Horizontal layout: square thumbnail on the left, details on the right.
      Much more compact than the old full-bleed portrait image.
      ─────────────────────────────────────────────────────────────────── */
    return (
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="bg-white rounded-xl border border-slate-200/70 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/6 transition-all duration-200 overflow-hidden flex gap-0">

          {/* Square thumbnail — fixed size, no giant portrait */}
          <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 bg-slate-50 overflow-hidden rounded-l-xl">
            {product.thumbnail ? (
              <Image
                src={product.thumbnail}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="112px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
              {discount && (
                <span className="px-1.5 py-0.5 bg-brand text-white text-[10px] font-bold rounded shadow-sm leading-none">
                  -{discount}%
                </span>
              )}
              {showroomType === 'auto_new' && (
                <span className="px-1.5 py-0.5 text-white text-[10px] font-bold rounded shadow-sm leading-none" style={{ background: gradient }}>
                  New
                </span>
              )}
              {showroomType === 'auto_bestselling' && (
                <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded shadow-sm flex items-center gap-0.5 leading-none">
                  <Star className="w-2.5 h-2.5 fill-white" /> Hot
                </span>
              )}
              {showroomType === 'auto_deals' && (
                <span className="px-1.5 py-0.5 text-white text-[10px] font-bold rounded shadow-sm leading-none" style={{ background: gradient }}>
                  Deal
                </span>
              )}
            </div>

            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                <span className="bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded-full">Sold Out</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 p-3 sm:p-3.5 flex flex-col justify-between">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand transition-colors line-clamp-1 leading-snug">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-2 gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-slate-900">{formatCedis(product.price)}</span>
                {product.compare_at_price && (
                  <span className="text-xs text-slate-400 line-through">{formatCedis(product.compare_at_price)}</span>
                )}
              </div>

              {!isOutOfStock && (
                <button
                  onClick={handleAdd}
                  className="shrink-0 h-7 px-3 rounded-lg text-[11px] font-bold text-white transition-opacity hover:opacity-90 active:scale-95"
                  style={{ background: gradient }}
                >
                  Add
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  /*
    ── Grid card (default view) ─────────────────────────────────────────
    Portrait image with details below — unchanged from original.
    ─────────────────────────────────────────────────────────────────── */
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-slate-200/70 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 overflow-hidden h-full flex flex-col">
        <div className="relative overflow-hidden bg-slate-50 aspect-[3/4]">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              
            </div>
          )}

          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {discount && (
              <span className="px-2 py-0.5 bg-brand text-white text-[11px] font-bold rounded-md shadow-md">
                -{discount}%
              </span>
            )}
            {showroomType === 'auto_new' && (
              <span className="px-2 py-0.5 text-white text-[11px] font-bold rounded-md shadow-md" style={{ background: gradient }}>
                New
              </span>
            )}
            {showroomType === 'auto_bestselling' && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-[11px] font-bold rounded-md shadow-md flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" /> Hot
              </span>
            )}
            {showroomType === 'auto_deals' && (
              <span className="px-2 py-0.5 text-white text-[11px] font-bold rounded-md shadow-md" style={{ background: gradient }}>
                Deal
              </span>
            )}
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
              <span className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full">Sold Out</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col p-3 sm:p-4">
          <h3 className="font-semibold text-slate-900 group-hover:text-brand transition-colors line-clamp-1 text-[13px] sm:text-sm">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="font-bold text-slate-900 text-[15px] sm:text-base">{formatCedis(product.price)}</span>
            {product.compare_at_price && (
              <span className="text-xs sm:text-sm text-slate-400 line-through">{formatCedis(product.compare_at_price)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
