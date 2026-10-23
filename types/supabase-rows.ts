// src/types/supabase-rows.ts
import type { Product } from './database';

// ─── Cart-related row shapes ──────────────────────────────────────────────────
export interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  // Supabase joins one-to-one as either object or array depending on FK setup
  product: Product | Product[] | null;
}

export interface CartWithItemsRow {
  id: string;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
  items: CartItemRow[] | null;
}

// ─── Order-related row shapes ─────────────────────────────────────────────────
export interface RecentOrderRow {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}

// ─── Helper to normalize Supabase joins ───────────────────────────────────────
/**
 * Supabase returns joined relations as either an object or an array
 * depending on whether the relationship is one-to-one or one-to-many.
 * This helper normalizes to a single value or null.
 */
export function singleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}