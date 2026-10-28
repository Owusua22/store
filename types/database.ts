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

export type SkinType =
  | 'normal'
  | 'dry'
  | 'oily'
  | 'combination'
  | 'sensitive'
  | 'acne-prone';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description?: string | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  low_stock_threshold?: number;
  category_id: string | null;
  /** Who the product is for, e.g. "Oily / blemish-prone skin", "Newborns 0+ months" */
  who_for?: string | null;
  /** What you pay the supplier per unit — admin/accounting only */
  cost_price?: number;
  /** Brand name as typed / resolved from the brands table */
  brand?: string | null;
  /** FK to public.brands (null when the product has no brand) */
  brand_id?: string | null;
  /** Skin types this product is formulated for (empty = all skin types) */
  skin_types: string[];
  /** Concerns this product targets, e.g. dark-spots, dryness */
  concerns?: string[];
  ingredients?: string | null;
  how_to_use?: string | null;
  benefits?: string | null;
  sizes: string[];
  colors: string[];
  images: string[];
  thumbnail: string | null;
  sku?: string | null;
  weight_grams?: number | null;
  rating?: number;
  reviews_count?: number;
  sold_count?: number;
  is_featured?: boolean;
  is_active: boolean;
  archived: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  category?: Category;
  variants?: ProductVariant[];
}

export type BlogStatus = 'draft' | 'published' | 'archived';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category: string | null;
  tags: string[];
  skin_types: string[];
  author_name: string;
  status: BlogStatus;
  is_featured: boolean;
  read_minutes: number;
  published_at: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at: string;
  updated_at: string;
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
  image_url?: string | null;
  parent_id: string | null;
  is_active: boolean;
  archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

/** A product brand (Nivea, Vaseline, Johnson's Baby …) managed from /admin/brands. */
export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  country: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}
