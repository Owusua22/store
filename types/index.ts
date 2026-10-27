// src/types/index.ts
// ✅ FIXED: Single source of truth - all exports come from here

export type {
  UserRole,
  OrderStatus,
  PaymentStatus,
  Profile,
  Category,
  Product,
  ProductVariant,
  Cart,
  CartItem,
  Order,
  OrderItem,
  SkinType,
  Brand,
  BlogPost,
  BlogStatus,
} from './database';

export type {
  ApiResponse,         // ✅ This is what was missing!
  PaginatedResponse,
  UploadResponse,
  CreateProductInput,
  UpdateProductInput,
  CreateOrderInput,
  ShippingAddress,
} from './api';

// ✅ Additional UI/Store types defined directly here
export interface CartItemWithProduct {
  id: string;
  product_id: string;
  quantity: number;
  product: import('./database').Product;
}

export interface CartState {
  items: CartItemWithProduct[];
  totalItems: number;
  totalPrice: number;
}