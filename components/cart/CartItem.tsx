// src/components/cart/CartItem.tsx
'use client';

import Image from 'next/image';
import { AlertTriangle, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart, type CartItem as CartItemType } from '@/hooks/useCart';
import { formatCedis } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { removeFromCart, updateQuantity, isLoading, checkoutIssues } = useCart();

  const stockValue = Number(item.product.stock_quantity ?? 0);
  const maxQty = Number.isFinite(stockValue)
    ? Math.max(0, Math.floor(stockValue))
    : 0;

  const quantityValue = Number(item.quantity ?? 1);
  const quantity = Number.isFinite(quantityValue)
    ? Math.max(1, Math.floor(quantityValue))
    : 1;

  const isInactive = item.product.is_active === false;
  const isOutOfStock = maxQty <= 0;
  const isOverStock = !isOutOfStock && quantity > maxQty;
  const isLowStock =
    !isInactive && !isOutOfStock && !isOverStock && maxQty > 0 && maxQty <= 5;

  const checkoutIssue = checkoutIssues.find((issue) => issue.itemId === item.id);

  const fallbackIssueMessage = isInactive
    ? 'This product is no longer available.'
    : isOutOfStock
      ? 'This item is out of stock.'
      : isOverStock
        ? `Only ${maxQty} item${maxQty === 1 ? '' : 's'} available.`
        : null;

  const issueMessage = checkoutIssue?.reason ?? fallbackIssueMessage;
  const hasCheckoutIssue = Boolean(issueMessage);

  const compareAtPrice =
    item.product.compare_at_price == null
      ? null
      : Number(item.product.compare_at_price);

  const hasCompareAtPrice =
    compareAtPrice != null &&
    Number.isFinite(compareAtPrice) &&
    compareAtPrice > item.product.price;

  const canDecrease =
    !isLoading &&
    (quantity <= 1 || (!isInactive && !isOutOfStock));

  const canIncrease =
    !isLoading &&
    !isInactive &&
    !isOutOfStock &&
    quantity < maxQty;

  const handleRemove = () => {
    if (isLoading) return;
    void removeFromCart(item.id);
  };

  const handleDecrease = () => {
    if (!canDecrease) return;

    if (quantity <= 1) {
      void removeFromCart(item.id);
      return;
    }

    void updateQuantity(item.id, quantity - 1);
  };

  const handleIncrease = () => {
    if (!canIncrease) return;
    void updateQuantity(item.id, quantity + 1);
  };

  return (
    <div
      className={[
        'flex gap-3 rounded-lg border p-2.5 transition-colors',
        hasCheckoutIssue
          ? 'border-red-200 bg-red-50/70'
          : 'border-gray-200 bg-gray-50',
      ].join(' ')}
    >
      {/* Image */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
        {item.product.thumbnail ? (
          <Image
            src={item.product.thumbnail}
            alt={item.product.name}
            fill
            className={[
              'object-cover transition-opacity',
              isInactive || isOutOfStock ? 'opacity-50 grayscale' : 'opacity-100',
            ].join(' ')}
            sizes="64px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"
              />
            </svg>
          </div>
        )}

        {(isInactive || isOutOfStock) && (
          <div className="absolute inset-0 bg-white/40" aria-hidden="true" />
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={[
                'line-clamp-1 text-sm font-medium',
                hasCheckoutIssue ? 'text-gray-700' : 'text-gray-900',
              ].join(' ')}
            >
              {item.product.name}
            </p>

            {/* Status badges */}
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              {isInactive && (
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                  Unavailable
                </span>
              )}

              {isOutOfStock && !isInactive && (
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                  Out of stock
                </span>
              )}

              {isOverStock && !isInactive && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                  Only {maxQty} available
                </span>
              )}

              {isLowStock && (
                <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-800">
                  Only {maxQty} left
                </span>
              )}

              {/* Size / Color */}
              {(item.selected_size || item.selected_color) && (
                <div className="flex items-center gap-2">
                  {item.selected_size && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                      {item.selected_size}
                    </span>
                  )}

                  {item.selected_color && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      <span
                        className="h-3 w-3 rounded-full border border-gray-200"
                        style={{
                          backgroundColor: item.selected_color.toLowerCase(),
                        }}
                      />
                      {item.selected_color}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Price row */}
            <div className="mt-0.5 flex items-baseline gap-2">
              <p className="text-sm font-medium text-red-600">
                {formatCedis(item.product.price)}
              </p>

              {hasCompareAtPrice && compareAtPrice != null && (
                <p className="text-xs text-gray-400 line-through">
                  {formatCedis(compareAtPrice)}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={isLoading}
            className="flex-shrink-0 p-1 text-gray-400 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Remove ${item.product.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Quantity controls */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={!canDecrease}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 bg-white transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={
                quantity === 1
                  ? `Remove ${item.product.name}`
                  : `Decrease quantity of ${item.product.name}`
              }
            >
              {quantity === 1 ? (
                <Trash2 className="h-3 w-3 text-red-500" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
            </button>

            <span
              className={[
                'w-8 text-center text-sm font-semibold tabular-nums',
                isOverStock ? 'text-red-700' : 'text-gray-900',
              ].join(' ')}
            >
              {quantity}
            </span>

            <button
              type="button"
              onClick={handleIncrease}
              disabled={!canIncrease}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 bg-white transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Increase quantity of ${item.product.name}`}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <span
            className={[
              'text-sm font-bold',
              hasCheckoutIssue ? 'text-gray-700' : 'text-gray-900',
            ].join(' ')}
          >
            {formatCedis(item.product.price * quantity)}
          </span>
        </div>

        {/* Checkout-blocking message */}
        {hasCheckoutIssue && issueMessage && (
          <div className="mt-2 flex gap-2 rounded-lg border border-red-200 bg-white/80 px-2 py-2 text-xs text-red-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />

            <div>
              <p className="font-semibold">{issueMessage}</p>

              <p className="mt-0.5 text-red-600">
                {isOverStock
                  ? `Reduce the quantity to ${maxQty} or remove this item to continue checkout.`
                  : 'Remove this item to continue checkout.'}
              </p>
            </div>
          </div>
        )}

        {/* Non-blocking max quantity message */}
        {!hasCheckoutIssue && !canIncrease && maxQty > 0 && (
          <p className="mt-1 text-xs text-amber-700">
            Maximum available: {maxQty}.
          </p>
        )}
      </div>
    </div>
  );
}