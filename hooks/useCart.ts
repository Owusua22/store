'use client';

import { create } from 'zustand';
import { toast } from 'react-toastify';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import {
  addDemoLine,
  buildDemoCart,
  clearDemoLines,
  removeDemoLine,
  toCartProduct,
  updateDemoLine,
} from '@/lib/demo/cart';

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  stock_quantity: number;
  thumbnail?: string | null;
  is_active: boolean;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  selected_size: string | null;
  selected_color: string | null;
  product: CartProduct;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
}

export interface CheckoutIssue {
  itemId: string;
  productId: string;
  productName: string;
  reason: string;
}

interface CartState {
  cart: Cart | null;
  items: CartItem[];

  isLoading: boolean;
  isSyncing: boolean;
  isOpen: boolean;

  totalItems: number;
  totalPrice: number;

  checkoutIssues: CheckoutIssue[];
  hasCheckoutIssues: boolean;
  canCheckout: boolean;

  fetchCart: () => Promise<void>;
  addToCart: (
    productId: string,
    quantity: number,
    size?: string | null,
    color?: string | null
  ) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;

  toggleCart: () => void;
  setCart: (cart: Cart | null) => void;
}

type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type DerivedCartState = Pick<
  CartState,
  | 'items'
  | 'totalItems'
  | 'totalPrice'
  | 'checkoutIssues'
  | 'hasCheckoutIssues'
  | 'canCheckout'
>;

function toFiniteNumber(
  value: number | string | null | undefined,
  fallback = 0
) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function toNonNegativeInteger(
  value: number | string | null | undefined,
  fallback = 0
) {
  const numericValue = Math.floor(toFiniteNumber(value, fallback));
  return Math.max(0, numericValue);
}

function normalizeCartItem(item: CartItem): CartItem {
  const compareAtPrice =
    item.product.compare_at_price == null
      ? null
      : toFiniteNumber(item.product.compare_at_price, 0);

  return {
    ...item,
    quantity: Math.max(1, toNonNegativeInteger(item.quantity, 1)),
    selected_size: item.selected_size ?? null,
    selected_color: item.selected_color ?? null,
    product: {
      ...item.product,
      price: toFiniteNumber(item.product.price, 0),
      compare_at_price: compareAtPrice,
      stock_quantity: toNonNegativeInteger(item.product.stock_quantity, 0),
      thumbnail: item.product.thumbnail ?? null,
      is_active: item.product.is_active !== false,
    },
  };
}

function normalizeCart(cart: Cart | null): Cart | null {
  if (!cart) return null;

  return {
    ...cart,
    items: Array.isArray(cart.items) ? cart.items.map(normalizeCartItem) : [],
  };
}

function getCheckoutIssue(item: CartItem): CheckoutIssue | null {
  const stock = Number(item.product.stock_quantity ?? 0);

  if (item.product.is_active === false) {
    return {
      itemId: item.id,
      productId: item.product_id,
      productName: item.product.name,
      reason: 'This product is no longer available.',
    };
  }

  if (stock <= 0) {
    return {
      itemId: item.id,
      productId: item.product_id,
      productName: item.product.name,
      reason: 'This item is out of stock.',
    };
  }

  if (item.quantity > stock) {
    return {
      itemId: item.id,
      productId: item.product_id,
      productName: item.product.name,
      reason: `Only ${stock} item${stock === 1 ? '' : 's'} available.`,
    };
  }

  return null;
}

function applyItems(items: CartItem[]): DerivedCartState {
  const normalizedItems = items.map(normalizeCartItem);

  const totalItems = normalizedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPrice = normalizedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const checkoutIssues = normalizedItems
    .map(getCheckoutIssue)
    .filter((issue): issue is CheckoutIssue => issue !== null);

  return {
    items: normalizedItems,
    totalItems,
    totalPrice,
    checkoutIssues,
    hasCheckoutIssues: checkoutIssues.length > 0,
    canCheckout: totalItems > 0 && checkoutIssues.length === 0,
  };
}

function replaceCartItems(cart: Cart | null, items: CartItem[]): Cart | null {
  if (!cart) return null;

  return {
    ...cart,
    items,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export const useCart = create<CartState>((set, get) => ({
  cart: null,
  items: [],

  isLoading: false,
  isSyncing: false,
  isOpen: false,

  totalItems: 0,
  totalPrice: 0,

  checkoutIssues: [],
  hasCheckoutIssues: false,
  canCheckout: false,

  setCart: (cart) => {
    const normalizedCart = normalizeCart(cart);
    const derived = applyItems(normalizedCart?.items ?? []);

    set({
      cart: normalizedCart
        ? {
            ...normalizedCart,
            items: derived.items,
          }
        : null,
      ...derived,
      isLoading: false,
      isSyncing: false,
    });
  },

  toggleCart: () => {
    set((state) => ({
      isOpen: !state.isOpen,
    }));
  },

  fetchCart: async () => {
    if (get().isSyncing) return;

    if (!isSupabaseConfigured) {
      const demoCart = buildDemoCart();
      const derived = applyItems(demoCart.items);
      set({
        cart: { ...demoCart, items: derived.items },
        ...derived,
        isLoading: false,
        isSyncing: false,
      });
      return;
    }

    set({ isSyncing: true });

    try {
      const response = await fetch('/api/cart', {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.status === 401) {
        const derived = applyItems([]);

        set({
          cart: null,
          ...derived,
        });

        return;
      }

      const json = (await response.json()) as ApiResponse<Cart | null>;

      if (!response.ok || !json.success) {
        console.error(
          'Cart API error:',
          json.error || `Request failed with status ${response.status}`
        );
        return;
      }

      const normalizedCart = normalizeCart(json.data ?? null);
      const derived = applyItems(normalizedCart?.items ?? []);

      set({
        cart: normalizedCart
          ? {
              ...normalizedCart,
              items: derived.items,
            }
          : null,
        ...derived,
      });
    } catch (error) {
      console.error('fetchCart error:', error);
    } finally {
      set({ isSyncing: false });
    }
  },

  addToCart: async (
    productId,
    quantity,
    size = null,
    color = null
  ) => {
    const safeQuantity = Math.max(
      1,
      Number.isFinite(quantity) ? Math.floor(quantity) : 1
    );

    set({
      isLoading: true,
      isOpen: true,
    });

    if (!isSupabaseConfigured) {
      const product = toCartProduct(productId);
      if (!product) {
        toast.error('This product is unavailable.');
        set({ isLoading: false, isOpen: false });
        return;
      }

      addDemoLine(productId, safeQuantity, size, color);
      const demoCart = buildDemoCart();
      const derived = applyItems(demoCart.items);
      set({
        cart: { ...demoCart, items: derived.items },
        ...derived,
        isLoading: false,
      });
      toast.success('Added to cart!');
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: safeQuantity,
          selected_size: size,
          selected_color: color,
        }),
      });

      const json = (await response.json()) as ApiResponse<Cart | null>;

      if (!response.ok || !json.success) {
        toast.error(json.error || 'Failed to add to cart');
        return;
      }

      toast.success('Added to cart!');
      await get().fetchCart();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to add to cart'));
    } finally {
      set({ isLoading: false });
    }
  },

  removeFromCart: async (itemId) => {
    if (!isSupabaseConfigured) {
      removeDemoLine(itemId);
      const demoCart = buildDemoCart();
      const derived = applyItems(demoCart.items);
      set({ cart: { ...demoCart, items: derived.items }, ...derived });
      toast.success('Item removed');
      return;
    }

    const previousCart = get().cart;
    const previousItems = get().items;

    const nextItems = previousItems.filter((item) => item.id !== itemId);
    const nextDerived = applyItems(nextItems);

    set({
      cart: replaceCartItems(previousCart, nextDerived.items),
      ...nextDerived,
      isLoading: true,
    });

    try {
      const response = await fetch(
        `/api/cart?itemId=${encodeURIComponent(itemId)}`,
        {
          method: 'DELETE',
        }
      );

      const json = (await response.json()) as ApiResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to remove item');
      }

      toast.success('Item removed');
      await get().fetchCart();
    } catch (error) {
      const rollbackDerived = applyItems(previousItems);

      set({
        cart: replaceCartItems(previousCart, rollbackDerived.items),
        ...rollbackDerived,
      });

      toast.error(getErrorMessage(error, 'Failed to remove item'));
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (itemId, quantity) => {
    if (!isSupabaseConfigured) {
      updateDemoLine(itemId, Math.floor(quantity));
      const demoCart = buildDemoCart();
      const derived = applyItems(demoCart.items);
      set({ cart: { ...demoCart, items: derived.items }, ...derived });
      return;
    }

    const previousCart = get().cart;
    const previousItems = get().items;

    const targetItem = previousItems.find((item) => item.id === itemId);

    if (!targetItem) {
      await get().fetchCart();
      return;
    }

    const requestedQuantity = Number.isFinite(quantity)
      ? Math.floor(quantity)
      : 1;

    if (requestedQuantity <= 0) {
      await get().removeFromCart(itemId);
      return;
    }

    if (targetItem.product.is_active === false) {
      toast.error('This product is no longer available.');
      return;
    }

    const stock = toNonNegativeInteger(targetItem.product.stock_quantity, 0);

    if (stock <= 0) {
      toast.error('This item is out of stock. Remove it to continue checkout.');
      return;
    }

    const safeQuantity = Math.max(1, Math.min(requestedQuantity, stock));

    if (requestedQuantity > stock) {
      toast.info(`Only ${stock} item${stock === 1 ? '' : 's'} available.`);
    }

    const nextItems = previousItems.map((item) =>
      item.id === itemId
        ? {
            ...item,
            quantity: safeQuantity,
          }
        : item
    );

    const nextDerived = applyItems(nextItems);

    set({
      cart: replaceCartItems(previousCart, nextDerived.items),
      ...nextDerived,
      isLoading: true,
    });

    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          quantity: safeQuantity,
        }),
      });

      const json = (await response.json()) as ApiResponse<Cart | null>;

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to update quantity');
      }

      await get().fetchCart();
    } catch (error) {
      const rollbackDerived = applyItems(previousItems);

      set({
        cart: replaceCartItems(previousCart, rollbackDerived.items),
        ...rollbackDerived,
      });

      toast.error(getErrorMessage(error, 'Failed to update quantity'));
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    if (!isSupabaseConfigured) {
      clearDemoLines();
      const derived = applyItems([]);
      set({
        cart: { id: 'demo-cart', user_id: 'demo-user', items: [] },
        ...derived,
        isLoading: false,
      });
      toast.success('Cart cleared');
      return;
    }

    const previousCart = get().cart;
    const previousItems = get().items;

    const emptyDerived = applyItems([]);

    set({
      cart: replaceCartItems(previousCart, []),
      ...emptyDerived,
      isLoading: true,
    });

    try {
      const response = await fetch('/api/cart?clearAll=true', {
        method: 'DELETE',
      });

      const json = (await response.json()) as ApiResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to clear cart');
      }

      toast.success('Cart cleared');
      await get().fetchCart();
    } catch (error) {
      const rollbackDerived = applyItems(previousItems);

      set({
        cart: replaceCartItems(previousCart, rollbackDerived.items),
        ...rollbackDerived,
      });

      toast.error(getErrorMessage(error, 'Failed to clear cart'));
    } finally {
      set({ isLoading: false });
    }
  },
}));