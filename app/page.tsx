// app/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Hero } from '@/components/home/Hero';
import { CategoriesComponent } from '@/components/home/CategoriesComponent';
import { Showrooms } from '@/components/home/showrooms'

import { Categories } from '@/components/home/Categories';

import type { Category, Product } from '@/types';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  // Fetch all data in parallel
  const [
    bannersResult,
    categoriesResult,
    productsResult,
    showroomsResult,
    categoryProductsResult,
  ] = await Promise.all([
    supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .eq('archived', false)
      .order('sort_order', { ascending: true }),
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .eq('archived', false)
      .order('sort_order', { ascending: true })
      .limit(8),
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8),
    fetchShowroomsWithProducts(supabase),
    fetchCategoryProducts(supabase),
  ]);

  const banners = bannersResult.data ?? [];
  const categories = (categoriesResult.data ?? []) as Category[];

  const showrooms = showroomsResult;
  const categoryProducts = categoryProductsResult;

  return (
    <>
      <Hero banners={banners} />
      {categories.length > 0 && <CategoriesComponent categories={categories} />}

      <Showrooms showrooms={showrooms} />
      <Categories categories={categories} categoryProducts={categoryProducts} />
    </>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface ShowroomProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  thumbnail: string | null;
  stock_quantity: number;
  is_active: boolean;
  sizes: string[];
  colors: string[];
}

interface ShowroomProductJoin {
  product: ShowroomProduct | null;
}

async function fetchShowroomsWithProducts(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
) {
  const { data: showrooms } = await supabase
    .from('showrooms')
    .select('*')
    .eq('is_active', true)
    .eq('archived', false)
    .eq('show_on_homepage', true)
    .order('sort_order', { ascending: true });

  if (!showrooms || showrooms.length === 0) return [];

  const results = await Promise.all(
    showrooms.map(async (showroom) => {
      let products: ShowroomProduct[] = [];
      const limit = showroom.max_products || 8;

      if (showroom.type === 'manual') {
        const { data } = await supabase
          .from('showroom_products')
          .select(
            'product:products(id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors)'
          )
          .eq('showroom_id', showroom.id)
          .order('sort_order', { ascending: true })
          .limit(limit);

        const joined = (data ?? []) as unknown as ShowroomProductJoin[];
        products = joined
          .map((sp) => sp.product)
          .filter((p): p is ShowroomProduct => p !== null && p.is_active);

      } else if (showroom.type === 'auto_new') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data } = await supabase
          .from('products')
          .select('id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors')
          .eq('is_active', true)
          .eq('archived', false)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(limit);

        products = (data ?? []) as ShowroomProduct[];

        if (products.length === 0) {
          const { data: fallback } = await supabase
            .from('products')
            .select('id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors')
            .eq('is_active', true)
            .eq('archived', false)
            .order('created_at', { ascending: false })
            .limit(limit);
          products = (fallback ?? []) as ShowroomProduct[];
        }

      } else if (showroom.type === 'auto_deals') {
        const { data } = await supabase
          .from('products')
          .select('id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors')
          .eq('is_active', true)
          .eq('archived', false)
          .not('compare_at_price', 'is', null)
          .gt('compare_at_price', 0)
          .order('created_at', { ascending: false })
          .limit(limit);

        products = ((data ?? []) as ShowroomProduct[]).filter(
          (p) => p.compare_at_price !== null && p.compare_at_price > p.price
        );

      } else if (showroom.type === 'auto_bestselling') {
        const { data: topProducts } = await supabase
          .from('order_items')
          .select('product_id, quantity');

        if (topProducts && topProducts.length > 0) {
          const salesCount: Record<string, number> = {};
          for (const item of topProducts) {
            if (item.product_id) {
              salesCount[item.product_id] = (salesCount[item.product_id] || 0) + item.quantity;
            }
          }

          const topIds = Object.entries(salesCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id]) => id);

          if (topIds.length > 0) {
            const { data: best } = await supabase
              .from('products')
              .select('id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors')
              .in('id', topIds)
              .eq('is_active', true)
              .eq('archived', false);

            const map = new Map(((best ?? []) as ShowroomProduct[]).map((p) => [p.id, p]));
            products = topIds
              .map((id) => map.get(id))
              .filter((p): p is ShowroomProduct => p !== undefined);
          }
        }

        if (products.length === 0) {
          const { data: fallback } = await supabase
            .from('products')
            .select('id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors')
            .eq('is_active', true)
            .eq('archived', false)
            .order('updated_at', { ascending: false })
            .limit(limit);
          products = (fallback ?? []) as ShowroomProduct[];
        }
      }

      return { ...showroom, products };
    })
  );

  return results;
}

// Fetch products for first 3 categories (first 10 products each)
async function fetchCategoryProducts(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<Record<string, Product[]>> {
  const result: Record<string, Product[]> = {};

  try {
    // Get first 3 categories
    const { data: categories } = await supabase
      .from('categories')
      .select('id')
      .eq('is_active', true)
      .eq('archived', false)
      .order('sort_order', { ascending: true })
      .limit(3);

    if (!categories || categories.length === 0) {
      console.log('No categories found for homepage');
      return result;
    }

    console.log(`Fetching products for ${categories.length} categories`);

    // Fetch products for each category in parallel
    const categoryRequests = categories.map((cat) =>
      supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('category_id', cat.id)
        .eq('is_active', true)
        .eq('archived', false)
        .order('created_at', { ascending: false })
        .limit(10)
    );

    const responses = await Promise.all(categoryRequests);

    // Process responses and map to category IDs
    responses.forEach((response, index) => {
      const categoryId = categories[index].id;
      const products = (response.data ?? []) as Product[];

      if (products.length > 0) {
        result[categoryId] = products;
        console.log(`Fetched ${products.length} products for category ${categoryId}`);
      } else {
        console.log(`No products found for category ${categoryId}`);
      }
    });

    return result;
  } catch (error) {
    console.error('Error fetching category products:', error);
    return result;
  }
}