'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import type { Product } from '@/types';

interface ProductRailProps {
  title: string;
  subtitle?: string;
  href?: string;
  products: Product[];
}

export function ProductRail({
  title,
  subtitle,
  href = '/products',
  products,
}: ProductRailProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="container-page pt-7 sm:pt-9" aria-label={title}>
      <div className="section-head">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-gray-600 hover:border-brand hover:text-brand"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-gray-600 hover:border-brand hover:text-brand"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Link href={href} className="section-link">
            View more <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div
        ref={trackRef}
        className="hide-scrollbar -mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-1 sm:gap-3.5"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[152px] shrink-0 snap-start sm:w-[190px] lg:w-[212px]"
          >
            <ProductCard product={product} compact />
          </div>
        ))}
      </div>
    </section>
  );
}
