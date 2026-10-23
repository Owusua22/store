import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';

import ProductsClient from './ProductsClient';

interface Variant {
  id: string;
  size: string;
  color: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  category: { name: string } | null;
  variants: Variant[];
}

export default async function ProductsPage() {
  const supabase = await createServerSupabaseClient();

  // ✅ Fetch products with category AND variants
  const { data: products } = await supabase
    .from('products')
    .select('*, category:categories(name), variants:product_variants(*)')
    .order('created_at', { ascending: false });

  // ✅ Fetch categories for filter
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product inventory</p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          + Add Product
        </Link>
      </div>

      <ProductsClient products={products || []} categories={categories || []} />
    </div>
  );
}