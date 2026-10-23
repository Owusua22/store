// src/components/products/ProductCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock_quantity === 0 || status !== 'idle') return;

    setStatus('loading');

    // ✅ Quick add from card - no size/color selection (pass null)
    await addToCart(product.id, 1, null, null);

    setStatus('done');
    setTimeout(() => setStatus('idle'), 1500);
  };

  const discount = product.compare_at_price
    ? Math.round(
        ((product.compare_at_price - product.price) / product.compare_at_price) * 100
      )
    : null;

  const categoryName =
    typeof product.category === 'string'
      ? product.category
      : product.category?.name ?? '';

  const isOutOfStock = product.stock_quantity === 0;

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-900/5 transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {discount && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              -{discount}%
            </span>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-gray-900 text-sm font-semibold px-4 py-1.5 rounded-full">
                Sold Out
              </span>
            </div>
          )}

          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              disabled={status !== 'idle'}
              className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center
                opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0
                transition-all duration-300 disabled:cursor-not-allowed
                ${status === 'done'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-900 text-white hover:bg-indigo-600'
                }`}
              aria-label="Add to cart"
            >
              {status === 'loading' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : status === 'done' ? (
                <Check className="w-4 h-4" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {categoryName && (
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
              {categoryName}
            </p>
          )}
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;