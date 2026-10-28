import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import type { Product } from '@/types';

interface ProductSectionProps {
  title: string;
  kicker?: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  products: Product[];
  columns?: 'grid' | 'five';
  tone?: 'default' | 'soft';
}

export function ProductSection({
  title,
  kicker,
  subtitle,
  href = '/products',
  hrefLabel = 'View more',
  products,
  columns = 'grid',
  tone = 'default',
}: ProductSectionProps) {
  if (products.length === 0) return null;

  const gridClass =
    columns === 'five'
      ? 'grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4 xl:grid-cols-5'
      : 'grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4';

  return (
    <section
      className={`container-page pt-10 sm:pt-14 ${tone === 'soft' ? '' : ''}`}
      aria-label={title}
    >
      <div className="section-head">
        <div>
          {kicker && <span className="section-kicker">{kicker}</span>}
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        <Link href={href} className="section-link">
          {hrefLabel} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className={gridClass}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
