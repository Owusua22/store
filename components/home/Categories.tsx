'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCedis } from '@/lib/utils';
import type { Category, Product } from '@/types';

interface CategoriesProps {
  categories: Category[];
  categoryProducts?: Record<string, Product[]>;
}

interface CategoryWithProducts extends Category {
  products: Product[];
}

export function Categories({ categories, categoryProducts = {} }: CategoriesProps) {
  if (!categories?.length) return null;

  const displayed = categories.slice(0, 3);

  const categoriesWithProducts = displayed
    .map((cat) => ({
      ...cat,
      products: categoryProducts[cat.id] || [],
    }))
    .filter((c) => c.products.length > 0) as CategoryWithProducts[];

  if (categoriesWithProducts.length === 0) return null;

  return (
    <div className="space-y-0">
      {categoriesWithProducts.map((category, index) => (
        <CategorySection
          key={category.id}
          category={category}
          isAlternate={index % 2 !== 0}
        />
      ))}
    </div>
  );
}

function CategorySection({
  category,
  isAlternate,
}: {
  category: CategoryWithProducts;
  isAlternate: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  const gradient = 'from-red-600 via-red-700 to-rose-600';

  return (
    <section className={isAlternate ? 'bg-gradient-to-b from-gray-50 to-white' : 'bg-white'}>
      <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-2 sm:mb-8">
          {/* Left: icon + title */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            {category.icon && (
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg sm:h-11 sm:w-11 sm:text-2xl">
                {category.icon}
              </span>
            )}
            <h2 className="truncate text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
              <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {category.name}
              </span>
            </h2>
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
              href={`/categories/${category.slug}`}
              className="group ml-1 inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 active:bg-red-100 sm:ml-2 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
            >
              <span className="hidden sm:inline">View All</span>
              <span className="sm:hidden">All</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
            </Link>
          </div>
        </div>

        {/* Optional description */}
        {category.description && (
          <p className="mb-4 hidden text-sm text-gray-500 sm:block sm:mb-6 sm:line-clamp-2">
            {category.description}
          </p>
        )}

        {/* Products Scroll */}
        <div
          ref={scrollRef}
          className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:-mx-0 sm:gap-4 sm:px-0 lg:gap-6"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {category.products.slice(0, 10).map((product) => (
            <CategoryProductCard
              key={product.id}
              product={product}
              categorySlug={category.slug}
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

function CategoryProductCard({
  product,
}: {
  product: Product;
  categorySlug: string;
  gradient: string;
}) {
  const discount = product.compare_at_price
    ? Math.round(
        ((product.compare_at_price - product.price) / product.compare_at_price) * 100
      )
    : null;

  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  const image = product.thumbnail || product.images?.[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group w-[140px] flex-shrink-0 sm:w-[180px] lg:w-[220px]"
    >
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-300 hover:border-gray-200 hover:shadow-md hover:shadow-gray-900/5 sm:rounded-2xl">
        {/* Image */}
        <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: '3/4' }}>
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 140px, (max-width: 1024px) 180px, 220px"
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-2xl sm:text-4xl">📦</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-1.5 top-1.5 flex flex-col gap-1 sm:left-3 sm:top-3">
            {discount && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow sm:px-2 sm:text-[10px]">
                -{discount}%
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow sm:px-2 sm:text-[10px]">
                {product.stock_quantity} left
              </span>
            )}
          </div>

          {/* Out of Stock */}
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
          <h3 className="line-clamp-1 text-[11px] font-semibold text-gray-900 transition-colors group-hover:text-red-600 sm:text-sm">
            {product.name}
          </h3>

          <div className="mt-1 flex items-baseline gap-1 sm:mt-1.5 sm:gap-2">
            <span className="text-xs font-bold text-gray-900 sm:text-base">
              {formatCedis(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-[9px] text-gray-400 line-through sm:text-xs">
                {formatCedis(product.compare_at_price)}
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

          {/* Colors */}
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

export default Categories;