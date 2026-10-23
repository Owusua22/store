// app/api/products/batch/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { cookies } from 'next/headers';
import type { Product, ProductVariant } from '@/types'; // adjust path if needed

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { success: false, error: 'Missing "ids" query parameter (comma-separated product IDs)' },
        { status: 400 }
      );
    }

    // Split and sanitize IDs
    const ids = idsParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!ids.length) {
      return NextResponse.json(
        { success: false, error: 'No valid product IDs provided' },
        { status: 400 }
      );
    }

    // Create Supabase client (server-side, uses cookies for auth if needed)
    const supabase = await createRouteHandlerSupabaseClient();

    // Fetch products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id, name, slug, description, price, compare_at_price,
        stock_quantity, category_id, images, thumbnail,
        sizes, colors, is_active, archived, metadata,
        created_at, updated_at
      `)
      .in('id', ids);

    if (productsError) {
      console.error('[api/products/batch] products error:', productsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    // Fetch variants for those products
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select(`
        id, product_id, size, color, price, compare_at_price,
        stock_quantity, sku, is_active, created_at, updated_at
      `)
      .in('product_id', ids)
      .eq('is_active', true); // only active variants

    if (variantsError) {
      console.error('[api/products/batch] variants error:', variantsError);
      // Continue without variants rather than failing the whole request (cart can still reconcile parent)
    }

    // Group variants by product_id
    const variantMap: Record<string, ProductVariant[]> = {};
    (variants ?? []).forEach((v) => {
      if (!variantMap[v.product_id]) variantMap[v.product_id] = [];
      variantMap[v.product_id].push(v as ProductVariant);
    });

    // Shape the response to match what `reconcileCartItems` expects
    const data: (Product & { variants?: ProductVariant[] })[] = (products as Product[]).map((p) => ({
      ...p,
      variants: variantMap[p.id] ?? [],
    }));

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error('[api/products/batch] unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}