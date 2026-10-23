// src/types/database.ts
import type { ShippingAddress } from './api';

export type UserRole = 'customer' | 'admin';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cod' | 'card' | 'mpesa';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// Add this to src/types/database.ts

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  sku: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Update Product to include variants
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  category_id: string | null;
  images: string[];
  thumbnail: string | null;
  sizes: string[];
  colors: string[];
  is_active: boolean;
  archived: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  category?: Category;
  variants?: ProductVariant[];
}
export interface Cart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
  items?: CartItem[];
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  selected_size: string | null;
  selected_color: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
}



export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  shipping_address: ShippingAddress;
  payment_intent_id: string | null;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod; // ✅ Added
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  profile?: Profile;
}
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_size: string | null;
  selected_color: string | null;
  created_at: string;
}
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  is_active: boolean;
  archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}