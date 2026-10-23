// src/store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CartItemWithProduct } from '@/types';

interface CartStore {
  items: CartItemWithProduct[];
  isOpen: boolean;
  isLoading: boolean;
  addItem: (item: CartItemWithProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setItems: (items: CartItemWithProduct[]) => void;
  setLoading: (loading: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    immer((set, get) => ({
      items: [],
      isOpen: false,
      isLoading: false,

      addItem: (newItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.product_id === newItem.product_id
          );
          if (existingIndex >= 0) {
            state.items[existingIndex].quantity += newItem.quantity;
          } else {
            state.items.push(newItem);
          }
        });
      },

      removeItem: (productId) => {
        set((state) => {
          state.items = state.items.filter(
            (item) => item.product_id !== productId
          );
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          const item = state.items.find((i) => i.product_id === productId);
          if (item) {
            if (quantity <= 0) {
              state.items = state.items.filter((i) => i.product_id !== productId);
            } else {
              item.quantity = quantity;
            }
          }
        });
      },

      clearCart: () => set((state) => { state.items = []; }),
      toggleCart: () => set((state) => { state.isOpen = !state.isOpen; }),
      setItems: (items) => set((state) => { state.items = items; }),
      setLoading: (loading) => set((state) => { state.isLoading = loading; }),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
      },
    })),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);