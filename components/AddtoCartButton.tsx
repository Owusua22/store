// src/components/cart/AddToCartButton.tsx
'use client';

import { useState } from 'react';
import { ShoppingCart, Loader2, Check } from 'lucide-react';
import { useCart, type CartItem } from '@/hooks/useCart';

interface AddToCartButtonProps {
  product: CartItem['product'];
  quantity?: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
  className?: string;
}

export function AddToCartButton({
  product,
  quantity = 1,
  selectedSize = null,
  selectedColor = null,
  className = '',
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleClick = async () => {
    if (status !== 'idle') return;
    setStatus('loading');

    // ✅ Pass size and color (matches new addToCart signature)
    await addToCart(product.id, quantity, selectedSize, selectedColor);

    setStatus('done');
    setTimeout(() => setStatus('idle'), 1500);
  };

  const isOutOfStock = product.stock_quantity < 1;

  return (
    <button
      onClick={handleClick}
      disabled={isOutOfStock || status === 'loading'}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
        ${isOutOfStock
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : status === 'done'
          ? 'bg-green-600 text-white'
          : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
        } ${className}`}
    >
      {status === 'loading' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : status === 'done' ? (
        <Check className="w-4 h-4" />
      ) : (
        <ShoppingCart className="w-4 h-4" />
      )}
      {isOutOfStock
        ? 'Out of Stock'
        : status === 'loading'
        ? 'Adding…'
        : status === 'done'
        ? 'Added!'
        : 'Add to Cart'}
    </button>
  );
}