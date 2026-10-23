'use client';

import { useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useCart } from '@/hooks/useCart';
import { formatCedis } from '@/lib/utils';
import { site } from '@/lib/site';
import { CartItem } from './CartItem';

export function CartSidebar() {
  const {
    items,
    isOpen,
    totalItems,
    totalPrice,
    isLoading,
    isSyncing,
    canCheckout,
    checkoutIssues,
    clearCart,
    fetchCart,
    toggleCart,
  } = useCart();

  const router = useRouter();

  const hasCheckoutIssues = checkoutIssues.length > 0;
  const checkoutDisabled = isLoading || isSyncing || items.length === 0;
  const qualifiesForFreeDelivery = totalPrice >= site.freeDeliveryThreshold;
  const remainingForFreeDelivery = Math.max(
    0,
    site.freeDeliveryThreshold - totalPrice
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) toggleCart();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, toggleCart]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCheckout = async () => {
    if (isLoading || isSyncing) return;

    if (!canCheckout) {
      toast.error(
        checkoutIssues[0]?.reason || 'Remove unavailable items before checkout.'
      );
      return;
    }

    await fetchCart();

    const latestCart = useCart.getState();
    if (!latestCart.canCheckout) {
      toast.error(
        latestCart.checkoutIssues[0]?.reason ||
          'Remove unavailable items before checkout.'
      );
      return;
    }

    if (latestCart.isOpen) latestCart.toggleCart();
    router.push('/checkout');
  };

  const showSpinner = isLoading && items.length === 0;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/50"
          onClick={toggleCart}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-[60] flex h-full w-full flex-col bg-white shadow-2xl transition-transform duration-300 sm:w-[400px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-brand" />
            <h2 className="text-[15px] font-extrabold text-ink">
              Your cart
              <span className="ml-1.5 text-[12px] font-semibold text-muted">
                ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </span>
            </h2>
            {isSyncing && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
          </div>

          <button
            type="button"
            onClick={toggleCart}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-soft"
            aria-label="Close cart"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Free delivery progress */}
        {items.length > 0 && (
          <div className="border-b border-line bg-brand-soft/60 px-4 py-2.5">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#8a1015]">
              <Truck className="h-3.5 w-3.5" />
              {qualifiesForFreeDelivery
                ? 'You qualify for free delivery!'
                : `Add ${formatCedis(remainingForFreeDelivery)} more for free delivery`}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (totalPrice / site.freeDeliveryThreshold) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 space-y-2 overflow-y-auto p-3.5">
          {showSpinner ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
              <p className="text-[12.5px]">Loading cart…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft text-gray-300">
                <ShoppingBag className="h-8 w-8" />
              </span>
              <div>
                <p className="text-[13.5px] font-bold text-ink">Your cart is empty</p>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  Add some skin care favourites to get started.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleCart}
                className="btn-brand h-9 px-4 text-[12px]"
              >
                Start shopping
              </button>
            </div>
          ) : (
            items.map((item) => <CartItem key={item.id} item={item} />)
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="space-y-3 border-t border-line p-4">
            {hasCheckoutIssues && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-[11.5px] leading-snug text-amber-800">
                  {checkoutIssues[0]?.reason}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between text-[12.5px] text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-ink">{formatCedis(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-[12.5px] text-gray-600">
                <span>Delivery</span>
                <span className="font-semibold text-emerald-600">
                  {qualifiesForFreeDelivery ? 'Free' : 'Calculated at checkout'}
                </span>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <span className="text-[13px] font-bold text-ink">Total</span>
                <span className="text-[15px] font-extrabold text-brand">
                  {formatCedis(totalPrice)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleCheckout()}
              disabled={checkoutDisabled}
              className="btn-brand h-11 w-full text-[13px] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
            >
              {isSyncing ? (
                <>
                  Checking cart <Loader2 className="h-4 w-4 animate-spin" />
                </>
              ) : hasCheckoutIssues ? (
                <>
                  Fix items to checkout <AlertTriangle className="h-4 w-4" />
                </>
              ) : (
                <>
                  Proceed to checkout <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void clearCart()}
              disabled={isLoading || isSyncing}
              className="w-full text-[11.5px] font-semibold text-gray-500 hover:text-red-500 disabled:opacity-50"
            >
              Clear cart
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
