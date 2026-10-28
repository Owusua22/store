'use client';

import Link from 'next/link';
import { ArrowRight, MessageCircle, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '@/components/cart/CartItem';
import { formatCedis } from '@/lib/utils';
import { site } from '@/lib/site';
import { cartOrderMessage, whatsappLink } from '@/lib/whatsapp';

export default function CartPage() {
  const { items, totalItems, totalPrice, clearCart, canCheckout } = useCart();

  const deliveryFree = totalPrice >= site.freeDeliveryThreshold;

  const whatsappOrderHref = whatsappLink(
    cartOrderMessage(
      items.map((item) => ({
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        size: item.selected_size ?? null,
      }))
    )
  );

  return (
    <div className="container-page py-6">
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[26px]">
        Shopping cart
      </h1>
      <p className="mt-1 text-[12.5px] text-muted">
        {totalItems} item{totalItems === 1 ? '' : 's'} in your cart
      </p>

      {items.length === 0 ? (
        <div className="panel mt-4 flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft text-gray-300">
            <ShoppingBag className="h-8 w-8" />
          </span>
          <h2 className="text-[15px] font-bold text-ink">Your cart is empty</h2>
          <p className="max-w-sm text-[12.5px] text-muted">
            Browse body lotions, serums, hair care and baby essentials to get started.
          </p>
          <Link href="/products" className="btn-brand mt-2 h-10 px-5 text-[12.5px]">
            Start shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="space-y-2.5 lg:col-span-2">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}

            <div className="flex items-center justify-between pt-1">
              <Link href="/products" className="text-[12px] font-bold text-brand hover:underline">
                Continue shopping
              </Link>
              <button
                type="button"
                onClick={() => void clearCart()}
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-gray-500 hover:text-brand"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear cart
              </button>
            </div>
          </div>

          <aside className="panel h-fit p-4">
            <h2 className="text-[13px] font-extrabold text-ink">Order summary</h2>

            <div className="mt-3 space-y-2 text-[12.5px]">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-ink">{formatCedis(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className="font-semibold text-emerald-600">
                  {deliveryFree ? 'Free' : 'From GH₵25'}
                </span>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <span className="font-bold text-ink">Total</span>
                <span className="text-[15px] font-extrabold text-brand">
                  {formatCedis(totalPrice)}
                </span>
              </div>
            </div>

            <Link
              href={canCheckout ? '/checkout' : '#'}
              aria-disabled={!canCheckout}
              className={`btn-brand mt-4 h-11 w-full text-[13px] ${
                canCheckout ? '' : 'pointer-events-none opacity-50'
              }`}
            >
              Checkout <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href={whatsappOrderHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 text-[13px] font-bold text-[#128C4B] transition hover:bg-[#25D366]/20"
            >
              <MessageCircle className="h-4 w-4" /> Order on WhatsApp
            </a>

            <p className="mt-2 text-center text-[11px] text-muted">
              Pay by MTN MoMo Pay (till {site.momo.payTill}) · Cash on pickup
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
