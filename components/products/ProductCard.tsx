'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, Loader2, ShoppingBag, Star, Truck } from 'lucide-react';
import { useState } from 'react';
import { formatCedis, metaNumber, metaString } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(
          ((product.compare_at_price - product.price) /
            product.compare_at_price) *
            100
        )
      : null;

  const categoryName =
    typeof product.category === 'string'
      ? product.category
      : product.category?.name ?? '';

  const rating = metaNumber(product.metadata, 'rating', 4.8);
  const reviews = metaNumber(product.metadata, 'reviews', 0);
  const sold = metaNumber(product.metadata, 'sold', 0);
  const badge = metaString(product.metadata, 'badge');

  const isOutOfStock = product.stock_quantity <= 0;

  const handleAddToCart = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (isOutOfStock || status !== 'idle') return;

    // pick the first option automatically so quick-add needs no picker
    const firstOption = product.sizes?.[0] ?? null;

    setStatus('loading');
    try {
      await addToCart(product.id, 1, firstOption, null);
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
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <ShoppingBag className="h-10 w-10" strokeWidth={1.2} />
          </div>
        )}

        {/* discount */}
        {discount ? (
          <span className="absolute left-0 top-0 rounded-br-lg bg-brand px-2 py-1 text-[11px] font-extrabold text-white">
            -{discount}%
          </span>
        ) : badge ? (
          <span className="absolute left-0 top-0 rounded-br-lg bg-ink px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white">
            {badge}
          </span>
        ) : null}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-ink">
              Sold out
            </span>
          </div>
        )}

        {/* quick add */}
        {!isOutOfStock && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={status !== 'idle'}
            className={`absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-all duration-200 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 ${
              status === 'done'
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-ink hover:bg-brand hover:text-white'
            }`}
            aria-label={`Add ${product.name} to cart`}
          >
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === 'done' ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        {categoryName && (
          <p className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {categoryName}
          </p>
        )}

        <h3 className="line-clamp-2 min-h-[34px] text-[12.5px] font-semibold leading-[1.35] text-gray-800 transition-colors group-hover:text-brand">
          {product.name}
        </h3>

        <div className="mt-1 flex items-center gap-1 text-[10.5px] text-gray-500">
          <span className="flex items-center gap-0.5 text-amber-500">
            <Star className="h-3 w-3 fill-current" />
            <span className="font-bold text-gray-700">{rating.toFixed(1)}</span>
          </span>
          {reviews > 0 && <span>({reviews})</span>}
          {sold > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span>{sold >= 1000 ? `${(sold / 1000).toFixed(1)}k` : sold} sold</span>
            </>
          )}
        </div>

        {!compact && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
            <Truck className="h-3 w-3" />
            Express delivery
          </div>
        )}

        <div className="mt-auto flex items-baseline gap-1.5 pt-2">
          <span className="text-[15px] font-extrabold tracking-tight text-ink">
            {formatCedis(product.price)}
          </span>
          {product.compare_at_price &&
            product.compare_at_price > product.price && (
              <span className="text-[11.5px] text-gray-400 line-through">
                {formatCedis(product.compare_at_price)}
              </span>
            )}
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
