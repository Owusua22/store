// lib/admin/schemas.ts
// Shared zod schemas for the admin API routes.
import { z } from 'zod';

const variantSchema = z.object({
  id: z.string().uuid().optional(),
  size: z.string().min(1).default('default'),
  color: z.string().min(1).default('default'),
  price: z.number().nonnegative(),
  compare_at_price: z.number().nonnegative().nullable().optional(),
  stock_quantity: z.number().int().nonnegative().default(0),
  sku: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

const optionalText = z
  .string()
  .trim()
  .max(20000)
  .optional()
  .transform((value) => (value ? value : null));

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(160),
  slug: z.string().trim().max(120).optional(),
  description: optionalText,
  short_description: optionalText,
  price: z.coerce.number().nonnegative('Price must be zero or more'),
  compare_at_price: z.coerce.number().nonnegative().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  brand: optionalText,

  // Skin care attributes
  skin_types: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  ingredients: optionalText,
  how_to_use: optionalText,
  benefits: optionalText,

  sizes: z.array(z.string().trim().min(1)).default([]),
  colors: z.array(z.string().trim().min(1)).default([]),
  images: z.array(z.string()).default([]),
  thumbnail: z.string().nullable().optional(),

  sku: optionalText,
  stock_quantity: z.coerce.number().int().nonnegative('Stock must be zero or more').default(0),
  low_stock_threshold: z.coerce.number().int().nonnegative().default(10),
  weight_grams: z.coerce.number().int().nonnegative().nullable().optional(),

  rating: z.coerce.number().min(0).max(5).optional(),
  reviews_count: z.coerce.number().int().nonnegative().optional(),
  sold_count: z.coerce.number().int().nonnegative().optional(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),

  seo_title: optionalText,
  seo_description: optionalText,

  variants: z.array(variantSchema).optional().default([]),
});

export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  slug: z.string().trim().max(120).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  icon: z.string().trim().max(16).optional().nullable(),
  image_url: z.string().trim().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  sort_order: z.coerce.number().int().optional(),
  is_active: z.boolean().optional(),
});

export const skinTypeSchema = z.object({
  label: z.string().trim().min(2, 'Label is required').max(60),
  slug: z.string().trim().max(60).optional(),
  emoji: z.string().trim().max(8).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  sort_order: z.coerce.number().int().optional(),
  is_active: z.boolean().optional(),
});

export const blogPostSchema = z.object({
  title: z.string().trim().min(3, 'Title is required').max(200),
  slug: z.string().trim().max(180).optional(),
  excerpt: z.string().trim().max(400).optional().nullable(),
  content: z.string().default(''),
  cover_image: z.string().trim().optional().nullable(),
  category: z.string().trim().max(80).optional().nullable(),
  tags: z.array(z.string()).default([]),
  skin_types: z.array(z.string()).default([]),
  author_name: z.string().trim().max(120).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  is_featured: z.boolean().optional(),
  seo_title: z.string().trim().max(200).optional().nullable(),
  seo_description: z.string().trim().max(400).optional().nullable(),
});

export const stockAdjustmentSchema = z.object({
  product_id: z.string().uuid('Product is required'),
  quantity: z.coerce.number().int().refine((value) => value !== 0, 'Quantity cannot be zero'),
  mode: z.enum(['add', 'remove', 'set']).default('add'),
  reason: z.string().trim().max(80).default('manual-adjustment'),
  note: z.string().trim().max(500).optional().nullable(),
});
