import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { DemoCategory } from '@/lib/demo/catalog';

interface CategoryStripProps {
  categories: DemoCategory[];
}

export function CategoryStrip({ categories }: CategoryStripProps) {
  if (categories.length === 0) return null;

  return (
    <section className="container-page pt-6 sm:pt-8" aria-label="Shop by category">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="section-title">Shop by category</h2>
          <p className="section-subtitle">Everything your skin needs, in one place</p>
        </div>
        <Link href="/products" className="section-link">
          All products <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="hide-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:gap-5">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group flex w-[72px] shrink-0 flex-col items-center sm:w-[92px]"
          >
            <span className="relative flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full border border-line bg-surface-soft transition-all duration-200 group-hover:border-brand group-hover:shadow-md sm:h-[88px] sm:w-[88px]">
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  sizes="88px"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <span className="text-2xl">{category.icon ?? '🧴'}</span>
              )}
            </span>
            <span className="mt-2 line-clamp-2 text-center text-[10.5px] font-semibold leading-tight text-gray-700 transition-colors group-hover:text-brand sm:text-[12px]">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
