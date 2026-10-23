// src/types/api.ts
// ✅ FIXED: Properly exported ApiResponse and all related types

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UploadResponse {
  url: string;
  key: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  stock_quantity: number;
  category_id?: string;
  images?: string[];
  thumbnail?: string;
  is_active?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

export interface CreateOrderInput {
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
  shipping_address: ShippingAddress;
  notes?: string;
}

// ✅ ShippingAddress must be defined HERE (not in database.ts)
// to avoid circular imports
export interface ShippingAddress {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}