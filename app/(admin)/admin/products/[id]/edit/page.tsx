import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { demoProducts, demoCategories } from '@/lib/demo/catalog';
import { getCategories } from '@/lib/data/store';
import { getSkinTypes } from '@/lib/data/skin-types';
import { getBrands } from '@/lib/data/brands';
import ProductForm, { type ProductFormValues } from '@/components/admin/ProductForm';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

async function loadProduct(id: string): Promise<Product | null> {
  if (isSupabaseConfigured) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    return (data as Product | null) ?? null;
  }

  return demoProducts.find((product) => product.id === id) ?? null;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories, skinTypes, brands] = await Promise.all([
    loadProduct(id),
    getCategories(),
    getSkinTypes(),
    getBrands(),
  ]);

  if (!product) notFound();

  const values: Partial<ProductFormValues> = {
    name: product.name,
    brand: product.brand ?? '',
    category_id: product.category_id ?? '',
    short_description: product.short_description ?? '',
    description: product.description ?? '',
    price: product.price,
    compare_at_price: product.compare_at_price ?? '',
    sku: product.sku ?? '',
    stock_quantity: product.stock_quantity,
    low_stock_threshold: product.low_stock_threshold ?? 10,
    weight_grams: product.weight_grams ?? '',
    skin_types: product.skin_types ?? [],
    concerns: product.concerns ?? [],
    sizes: product.sizes ?? [],
    ingredients: product.ingredients ?? '',
    how_to_use: product.how_to_use ?? '',
    benefits: product.benefits ?? '',
    images: product.images ?? [],
    is_active: product.is_active,
    is_featured: product.is_featured ?? false,
    seo_title: product.seo_title ?? '',
    seo_description: product.seo_description ?? '',
  };

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-gray-500 hover:text-red-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to products
      </Link>

      <ProductForm
        mode="edit"
        productId={product.id}
        initialValues={values}
        categories={(categories.length > 0 ? categories : demoCategories).map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        brands={brands.map((brand) => ({ id: brand.id, name: brand.name }))}
        skinTypes={skinTypes}
        demoMode={!isSupabaseConfigured}
      />
    </div>
  );
}
