import Image from 'next/image';
import Link from 'next/link';
import type { DemoCategory } from '@/lib/demo/catalog';

interface CategoryStripProps {
  categories: DemoCategory[];
}

/**
 * Six plates of product photography, hairline-divided, names in serif.
 * No circles, no drop shadows, no arrows — a shelf, not a carousel.
 */
export function CategoryStrip({ categories }: CategoryStripProps) {
  if (categories.length === 0) return null;

  return (
    <section className="container-page pt-9 sm:pt-12" aria-labelledby="shelf-heading">
      <div className="section-head">
        <div>
          <span className="section-kicker">The shelves</span>
          <h2 id="shelf-heading" className="section-title">
            Pick a shelf
          </h2>
        </div>
        <Link href="/products" className="section-link">
          Everything
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-px border border-line bg-line sm:grid-cols-6">
        {categories.slice(0, 6).map((category, position) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group flex flex-col bg-paper transition-colors hover:bg-white"
          >
            <span className="relative aspect-square w-full overflow-hidden bg-paper-deep">
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 33vw, 200px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center font-serif text-2xl text-sage">
                  {String(position + 1).padStart(2, '0')}
                </span>
              )}
            </span>
            <span className="flex flex-1 flex-col justify-between gap-1 px-2.5 py-2.5 sm:px-3">
              <span className="font-serif text-[13px] leading-tight text-ink group-hover:text-sage-deep sm:text-[15px]">
                {category.name}
              </span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-muted sm:block">
                Shop
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
