// src/components/cart/CartSidebar.tsx
'use client';

import { useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';
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
  const checkoutDisabled = isLoading || isSyncing || !canCheckout;

  const shippingFee = totalPrice > 50 ? 0 : 9.99;
  const orderTotal = totalPrice + shippingFee;

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        toggleCart();
      }
    };

    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, toggleCart]);

  // Lock scroll while open
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
        checkoutIssues[0]?.reason ||
          'Remove unavailable items before checkout.'
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

    if (latestCart.isOpen) {
      latestCart.toggleCart();
    }

    router.push('/checkout');
  };

  const handleClearCart = () => {
    if (isLoading || isSyncing) return;
    void clearCart();
  };

  const showSpinner = isLoading && items.length === 0;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={toggleCart}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl transition-transform duration-300 sm:w-96 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-indigo-600" />

            <h2 className="text-lg font-semibold">
              Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </h2>

            {isSyncing && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
            )}
          </div>

          <button
            type="button"
            onClick={toggleCart}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {showSpinner ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
              <p>Loading cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
              <ShoppingBag className="h-16 w-16" />

              <p className="font-medium">Your cart is empty</p>

              <button
                type="button"
                onClick={toggleCart}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Continue shopping →
              </button>
            </div>
          ) : (
            items.map((item) => <CartItem key={item.id} item={item} />)
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="space-y-4 border-t p-4">
            {/* Checkout issues */}
      

            {/* Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>

          

              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>

                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {formatPrice(orderTotal)}
                </span>
              </div>
            </div>

            {/* Checkout button */}
            <button
              type="button"
              onClick={() => void handleCheckout()}
              disabled={checkoutDisabled}
              className="
                flex w-full items-center justify-center gap-2 rounded-xl py-3
                font-medium text-white transition-all
                enabled:bg-gradient-to-r enabled:from-indigo-600 enabled:via-purple-600 enabled:to-pink-600
                enabled:hover:shadow-lg enabled:hover:shadow-indigo-500/25
                disabled:cursor-not-allowed disabled:bg-gray-300 disabled:bg-none disabled:text-gray-500
              "
            >
              {isSyncing ? (
                <>
                  Checking cart
                  <Loader2 className="h-4 w-4 animate-spin" />
                </>
              ) : hasCheckoutIssues ? (
                <>
                 Checkout
                  <AlertTriangle className="h-4 w-4" />
                </>
              ) : (
                <>
                  Checkout
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Clear cart */}
            <button
              type="button"
              onClick={handleClearCart}
              disabled={isLoading || isSyncing}
              className="w-full text-sm text-gray-500 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}