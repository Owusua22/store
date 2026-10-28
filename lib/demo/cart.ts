// lib/demo/cart.ts
// Local cart used in demo mode so add/remove/update/checkout work with no backend.

import type { CartItem, CartProduct } from '@/hooks/useCart';
import { demoProducts } from '@/lib/demo/catalog';

const STORAGE_KEY = 'sally-demo-cart';

interface StoredLine {
  product_id: string;
  quantity: number;
  selected_size: string | null;
  selected_color: string | null;
}

function readLines(): StoredLine[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredLine[]) : [];
  } catch {
    return [];
  }
}

function writeLines(lines: StoredLine[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* storage unavailable */
  }
}

export function toCartProduct(productId: string): CartProduct | null {
  const product = demoProducts.find((p) => p.id === productId);
  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compare_at_price: product.compare_at_price,
    stock_quantity: product.stock_quantity,
    thumbnail: product.thumbnail,
    is_active: product.is_active,
  };
}

export function buildDemoCart() {
  const lines = readLines();

  const items: CartItem[] = lines
    .map((line, index) => {
      const product = toCartProduct(line.product_id);
      if (!product) return null;

      return {
        id: `demo-item-${line.product_id}-${index}`,
        product_id: line.product_id,
        quantity: line.quantity,
        selected_size: line.selected_size,
        selected_color: line.selected_color,
        product,
      } satisfies CartItem;
    })
    .filter((item): item is CartItem => item !== null);

  return {
    id: 'demo-cart',
    user_id: 'demo-user',
    items,
  };
}

export function addDemoLine(
  productId: string,
  quantity: number,
  size: string | null,
  color: string | null
) {
  const lines = readLines();
  const existing = lines.find(
    (line) =>
      line.product_id === productId &&
      line.selected_size === size &&
      line.selected_color === color
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    lines.push({
      product_id: productId,
      quantity,
      selected_size: size,
      selected_color: color,
    });
  }

  writeLines(lines);
}

export function removeDemoLine(itemId: string) {
  const lines = readLines();
  const index = Number(itemId.split('-').pop());
  if (Number.isNaN(index) || index < 0 || index >= lines.length) return;

  const next = [...lines];
  next.splice(index, 1);
  writeLines(next);
}

export function updateDemoLine(itemId: string, quantity: number) {
  const lines = readLines();
  const index = Number(itemId.split('-').pop());
  if (Number.isNaN(index) || index < 0 || index >= lines.length) return;

  const next = [...lines];
  if (quantity <= 0) {
    next.splice(index, 1);
  } else {
    next[index] = { ...next[index], quantity };
  }
  writeLines(next);
}

export function clearDemoLines() {
  writeLines([]);
}
