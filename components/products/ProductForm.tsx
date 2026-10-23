// src/components/products/ProductForm.tsx
'use client';

import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ImageUpload } from './ImageUpload';
import type { ApiResponse, Product } from '@/types';

// ✅ Helper: convert empty strings & null to undefined so .optional() works
const emptyToUndefined = (val: unknown) =>
  val === '' || val === null ? undefined : val;

// ✅ Helper: preprocess "string from input" → number, while letting Zod validate
const numberFromInput = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'string') {
    const n = Number(val);
    return Number.isNaN(n) ? val : n;
  }
  return val;
}, z.number());

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),

  price: numberFromInput.pipe(z.number().positive('Price must be positive')),

  compare_at_price: z.preprocess(
    emptyToUndefined,
    z.number().positive().optional()
  ),

  stock_quantity: numberFromInput.pipe(
    z.number().int('Must be a whole number').min(0)
  ),

  category_id: z.preprocess(emptyToUndefined, z.string().uuid().optional()),

  images: z.array(z.string()).optional().default([]),

  is_active: z.boolean().optional().default(true),
});

// ✅ KEY FIX: Separate input vs output types
// `Input` = what the form fields produce (HTML inputs are strings)
// `Output` = what we get after Zod parses & coerces
type ProductFormInput = z.input<typeof productSchema>;
type ProductFormOutput = z.output<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormOutput>({
    // ✅ KEY FIX: Cast resolver to align input/output generics
    resolver: zodResolver(productSchema) as Resolver<
      ProductFormInput,
      unknown,
      ProductFormOutput
    >,
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price ?? 0,
      compare_at_price: product?.compare_at_price ?? undefined,
      stock_quantity: product?.stock_quantity ?? 0,
      category_id: product?.category_id ?? undefined,
      images: product?.images ?? [],
      is_active: product?.is_active ?? true,
    },
  });

  // ✅ `data` is now the parsed output (numbers, not strings)
  const onSubmit = async (data: ProductFormOutput) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        ...data,
        thumbnail: data.images?.[0] ?? null,
        compare_at_price: data.compare_at_price ?? null,
      };

      const response = await fetch(
        isEditing ? `/api/products/${product.id}` : '/api/products',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const body = (await response.json()) as ApiResponse;
        throw new Error(body.error ?? 'Failed to save product');
      }

      onSuccess?.();
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Images
        </label>
        <Controller
          name="images"
          control={control}
          render={({ field }) => (
            <ImageUpload
              value={field.value ?? []}
              onChange={field.onChange}
              maxFiles={5}
              folder="products"
            />
          )}
        />
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Name *
        </label>
        <input
          {...register('name')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          placeholder="Enter product name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
          placeholder="Describe your product..."
        />
      </div>

      {/* Price Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (USD) *
          </label>
          <input
            // ✅ valueAsNumber: RHF converts the string to number on change
            {...register('price', { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Compare at Price
          </label>
          <input
            {...register('compare_at_price', { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          {errors.compare_at_price && (
            <p className="mt-1 text-sm text-red-600">
              {errors.compare_at_price.message}
            </p>
          )}
        </div>
      </div>

      {/* Stock */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Stock Quantity *
        </label>
        <input
          {...register('stock_quantity', { valueAsNumber: true })}
          type="number"
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        {errors.stock_quantity && (
          <p className="mt-1 text-sm text-red-600">
            {errors.stock_quantity.message}
          </p>
        )}
      </div>

      {/* Active Status */}
      <div className="flex items-center gap-3">
        <input
          {...register('is_active')}
          type="checkbox"
          id="is_active"
          className="w-4 h-4 text-indigo-600 rounded"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
          Active (visible to customers)
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isLoading
            ? 'Saving...'
            : isEditing
              ? 'Update Product'
              : 'Create Product'}
        </button>
      </div>
    </form>
  );
}