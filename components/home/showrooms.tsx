'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface ShowroomProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  thumbnail: string | null;
  stock_quantity: number;
  is_active: boolean;
  sizes?: string[];
  colors?: string[];
}

interface Showroom {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  type: string;
  products: ShowroomProduct[];
}

interface ShowroomsProps {
  showrooms: Showroom[];
}

const TYPE_GRADIENTS: Record<string, string> = {
  manual: 'from-indigo-600 via-purple-600 to-pink-600',
  auto_new: 'from-emerald-500 via-teal-500 to-cyan-500',
  auto_deals: 'from-red-500 via-orange-500 to-amber-500',
  auto_bestselling: 'from-violet-500 via-purple-500 to-fuchsia-500',
};

const TYPE_LABELS: Record<string, string> = {
  manual: '',
  auto_new: 'New',
  auto_deals: 'Sale',
  auto_bestselling: 'Popular',
};

export function Showrooms({ showrooms }: ShowroomsProps) {
  if (!showrooms || showrooms.length === 0) return null;

  return (
    <div className="space-y-0">
      {showrooms
        .filter((s) => s.products.length > 0)
        .map((showroom, index) => (
          <ShowroomSection
            key={showroom.id}
            showroom={showroom}
            isAlternate={index % 2 !== 0}
          />
        ))}
    </div>
  );
}

function ShowroomSection({
  showroom,
  isAlternate,
}: {
  showroom: Showroom;
  isAlternate: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gradient = TYPE_GRADIENTS[showroom.type] || TYPE_GRADIENTS.manual;
  const badge = TYPE_LABELS[showroom.type];

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section className={isAlternate ? 'bg-gradient-to-b from-gray-50 to-white' : 'bg-white'}>
      <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-2 sm:mb-8">
          {/* Left: icon + name + badge */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            {showroom.icon && (
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg sm:h-11 sm:w-11 sm:text-2xl">
                {showroom.icon}
              </span>
            )}
            <h2 className="truncate text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
              <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {showroom.name}
              </span>
            </h2>
            {badge && (
              <span
                className={`hidden sm:inline-flex flex-shrink-0 items-center rounded-full bg-gradient-to-r ${gradient} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm`}
              >
                {badge}
              </span>
            )}
          </div>

          {/* Right: arrows + view all */}
          <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={scrollLeft}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 sm:h-9 sm:w-9 lg:h-10 lg:w-10"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5" />
            </button>
            <button
              onClick={scrollRight}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 sm:h-9 sm:w-9 lg:h-10 lg:w-10"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" />
            </button>
            <Link
              href={`/showrooms/${showroom.slug}`}
              className="group ml-1 inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 active:bg-indigo-200 sm:ml-2 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
            >
              <span className="hidden sm:inline">View All</span>
              <span className="sm:hidden">All</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
            </Link>
          </div>
        </div>

        {/* Products Scroll */}
        <div
          ref={scrollRef}
          className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:-mx-0 sm:gap-4 sm:px-0 lg:gap-6"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {showroom.products.map((product) => (
            <ShowroomProductCard
              key={product.id}
              product={product}
              showroomType={showroom.type}
              gradient={gradient}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}

function ShowroomProductCard({
  product,
  showroomType,
  gradient,
}: {
  product: ShowroomProduct;
  showroomType: string;
  gradient: string;
}) {
  const discount = product.compare_at_price
    ? Math.round(
        ((product.compare_at_price - product.price) / product.compare_at_price) * 100
      )
    : null;

  const isOutOfStock = product.stock_quantity === 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group w-[140px] flex-shrink-0 sm:w-[180px] lg:w-[220px]"
    >
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-300 hover:border-gray-200 hover:shadow-md hover:shadow-gray-900/5 sm:rounded-2xl">
        {/* Image */}
        <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: '3/4' }}>
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 140px, (max-width: 1024px) 180px, 220px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-2xl sm:text-4xl">📦</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-1.5 top-1.5 flex flex-col gap-1 sm:left-3 sm:top-3">
            {discount && showroomType === 'auto_deals' && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow sm:px-2 sm:text-[10px]">
                -{discount}%
              </span>
            )}
            {showroomType === 'auto_new' && (
              <span
                className={`rounded-full bg-gradient-to-r ${gradient} px-1.5 py-0.5 text-[9px] font-bold text-white shadow sm:px-2 sm:text-[10px]`}
              >
                New
              </span>
            )}
            {showroomType === 'auto_bestselling' && (
              <span className="flex items-center gap-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow sm:gap-1 sm:px-2 sm:text-[10px]">
                <Star className="h-2.5 w-2.5 fill-white" />
                Popular
              </span>
            )}
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-gray-900 sm:px-2.5 sm:py-1 sm:text-[10px]">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2 sm:p-3 lg:p-4">
          <h3 className="line-clamp-1 text-[11px] font-semibold text-gray-900 transition-colors group-hover:text-indigo-600 sm:text-sm">
            {product.name}
          </h3>

          <div className="mt-1 flex items-baseline gap-1 sm:mt-1.5 sm:gap-2">
            <span className="text-xs font-bold text-gray-900 sm:text-base">
              {formatPrice(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-[9px] text-gray-400 line-through sm:text-xs">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-0.5 sm:mt-1.5">
              {product.sizes.slice(0, 3).map((size) => (
                <span
                  key={size}
                  className="rounded bg-gray-100 px-1 py-0.5 text-[8px] text-gray-600 sm:text-[10px]"
                >
                  {size}
                </span>
              ))}
              {product.sizes.length > 3 && (
                <span className="flex items-center text-[8px] text-gray-400 sm:text-[10px]">
                  +{product.sizes.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Color swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-1 flex items-center gap-0.5 sm:mt-1.5">
              {product.colors.slice(0, 4).map((color) => (
                <span
                  key={color}
                  className="h-2 w-2 rounded-full border border-gray-200 sm:h-2.5 sm:w-2.5"
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="ml-0.5 text-[8px] text-gray-400 sm:text-[10px]">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default Showrooms;