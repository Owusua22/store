import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { demoProducts, demoCategories } from '@/lib/demo/catalog';
import { getSkinTypes } from '@/lib/data/skin-types';
import ProductsClient, { type AdminProductRow } from './ProductsClient';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const skinTypes = await getSkinTypes();
  let products: AdminProductRow[] = [];
  let categories: { id: string; name: string }[] = [];

  if (isSupabaseConfigured) {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('products')
      .select('id, name, brand, thumbnail, price, compare_at_price, stock_quantity, low_stock_threshold, skin_types, is_active, is_featured, archived, created_at, category:categories(id, name)')
      .order('created_at', { ascending: false })
      .limit(500);

    products = (data ?? []) as unknown as AdminProductRow[];

    const { data: categoryRows } = await supabase
      .from('categories')
      .select('id, name')
      .eq('archived', false)
      .order('name');

    categories = categoryRows ?? [];
  }

  // Demo mode (or an empty live store) shows the bundled catalogue so the
  // screen is never blank while you are setting things up.
  if (products.length === 0) {
    products = demoProducts.map((product) => ({
      id: product.id,
      name: product.name,
      brand: product.brand ?? 'Sally Skin',
      thumbnail: product.thumbnail,
      price: product.price,
      compare_at_price: product.compare_at_price,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold ?? 10,
      skin_types: product.skin_types ?? [],
      is_active: product.is_active,
      is_featured: product.is_featured ?? false,
      archived: product.archived,
      created_at: product.created_at,
      category: { id: product.category_id ?? '', name: 'Demo catalogue' },
    }));
  }

  if (categories.length === 0) {
    categories = demoCategories.map((category) => ({ id: category.id, name: category.name }));
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-gray-900">Products</h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Upload products, set skin types, prices and stock alerts.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-red-600/20 hover:bg-red-700"
        >
          + Add product
        </Link>
      </div>

      <ProductsClient
        products={products}
        categories={categories}
        skinTypes={skinTypes.map((type) => ({ slug: type.slug, label: type.label, emoji: type.emoji }))}
        demoMode={!isSupabaseConfigured}
      />
    </div>
  );
}
