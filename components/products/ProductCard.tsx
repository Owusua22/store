'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { formatCedis, metaNumber, metaString } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

/**
 * A shelf label, not a dashboard tile: photograph, maker, name, price.
 * Quick-add is a word, not a floating button.
 */
export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(
          ((product.compare_at_price - product.price) / product.compare_at_price) * 100
        )
      : null;

  const categoryName =
    typeof product.category === 'string' ? product.category : product.category?.name ?? '';

  const rating = product.rating ?? metaNumber(product.metadata, 'rating', 0);
  const reviews = product.reviews_count ?? metaNumber(product.metadata, 'reviews', 0);
  const sold = product.sold_count ?? metaNumber(product.metadata, 'sold', 0);
  const badge = metaString(product.metadata, 'badge');
  const isOutOfStock = product.stock_quantity <= 0;

  const handleAddToCart = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (isOutOfStock || status !== 'idle') return;

    setStatus('loading');
    try {
      await addToCart(product.id, 1, product.sizes?.[0] ?? null, null);
      setStatus('done');
      setTimeout(() => setStatus('idle'), 1600);
    } catch {
      setStatus('idle');
    }
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="product-card group"
      aria-label={product.name}
    >
      <div className="product-card__media">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-2xl text-sage/50">Glow-Up</span>
          </div>
        )}

        {isOutOfStock ? (
          <span className="absolute inset-x-0 bottom-0 bg-paper/90 py-1 text-center text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted">
            Out of stock
          </span>
        ) : discount ? (
          <span className="absolute left-0 top-0 bg-sage-deep px-1.5 py-0.5 text-[9.5px] font-bold tabular-nums tracking-wide text-paper">
            −{discount}%
          </span>
        ) : badge ? (
          <span className="absolute left-0 top-0 bg-ink px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-paper">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2">
        <p className="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
          {product.brand ?? categoryName}
        </p>

        <h3 className="mt-1 line-clamp-2 min-h-[32px] text-[12px] font-medium leading-[1.35] text-ink group-hover:text-sage-deep sm:text-[12.5px]">
          {product.name}
        </h3>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[13.5px] font-bold tabular-nums text-ink sm:text-[14.5px]">
            {formatCedis(product.price)}
          </span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-[10.5px] text-gray-400 line-through tabular-nums">
              {formatCedis(product.compare_at_price)}
            </span>
          )}
        </div>

        {(rating > 0 || sold > 0) && (
          <p className="mt-0.5 text-[10px] text-muted">
            {rating > 0 && (
              <>
                <span className="font-semibold text-sage-deep tabular-nums">
                  {rating.toFixed(1)}
                </span>{' '}
                / 5
              </>
            )}
            {rating > 0 && reviews > 0 ? ` · ${reviews} ${reviews === 1 ? 'note' : 'notes'}` : ''}
            {sold > 99 ? ` · ${sold > 999 ? `${Math.round(sold / 100) / 10}k` : sold} sold` : ''}
          </p>
        )}

        {!isOutOfStock && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={status !== 'idle'}
            className={`mt-2 w-full border px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
              status === 'done'
                ? 'border-sage-deep bg-sage-deep text-paper'
                : 'border-line bg-transparent text-sage-deep hover:border-sage-deep hover:bg-sage-deep hover:text-paper'
            } ${compact ? '' : 'sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100'}`}
          >
            {status === 'loading' ? 'Adding' : status === 'done' ? 'In the bag' : 'Add to bag'}
          </button>
        )}
      </div>
    </Link>
  );
}

export default ProductCard;
