// app/api/showrooms/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';

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
  created_at?: string;
}

interface ShowroomProductJoin {
  sort_order: number;
  product: ShowroomProduct | null;
}

export async function GET() {
  try {
    const supabase = await createRouteHandlerSupabaseClient();

    const { data: showrooms, error: showroomError } = await supabase
      .from('showrooms')
      .select('*')
      .eq('is_active', true)
      .eq('archived', false)
      .eq('show_on_homepage', true)
      .order('sort_order', { ascending: true });

    if (showroomError) {
      return NextResponse.json({ success: false, error: showroomError.message }, { status: 500 });
    }

    // ✅ Get all manual showroom product IDs to exclude from auto collections
    const manualShowroomIds = (showrooms ?? [])
      .filter((s) => s.type === 'manual')
      .map((s) => s.id);

    let manualProductIds: string[] = [];

    if (manualShowroomIds.length > 0) {
      const { data: manualProducts } = await supabase
        .from('showroom_products')
        .select('product_id')
        .in('showroom_id', manualShowroomIds);

      manualProductIds = (manualProducts ?? []).map((mp) => mp.product_id);
    }

    const showroomsWithProducts = await Promise.all(
      (showrooms ?? []).map(async (showroom) => {
        let products: ShowroomProduct[] = [];
        const limit = showroom.max_products || 8;

        if (showroom.type === 'manual') {
          // ✅ Manual: Only show hand-picked products
          const { data } = await supabase
            .from('showroom_products')
            .select(
              'sort_order, product:products(id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors)'
            )
            .eq('showroom_id', showroom.id)
            .order('sort_order', { ascending: true })
            .limit(limit);

          const joined = (data ?? []) as unknown as ShowroomProductJoin[];
          products = joined
            .map((sp) => sp.product)
            .filter((p): p is ShowroomProduct => p !== null && p.is_active);

        } else if (showroom.type === 'auto_new') {
          // ✅ New Arrivals: Products created in the last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data } = await supabase
            .from('products')
            .select(
              'id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors, created_at'
            )
            .eq('is_active', true)
            .eq('archived', false)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(limit);

          products = (data ?? []) as ShowroomProduct[];

          // ✅ Fallback: If no products in last 30 days, show newest
          if (products.length === 0) {
            const { data: fallback } = await supabase
              .from('products')
              .select(
                'id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors'
              )
              .eq('is_active', true)
              .eq('archived', false)
              .order('created_at', { ascending: false })
              .limit(limit);

            products = (fallback ?? []) as ShowroomProduct[];
          }

        } else if (showroom.type === 'auto_deals') {
          // ✅ Deals: ONLY products that have a compare_at_price (on sale)
          const { data } = await supabase
            .from('products')
            .select(
              'id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors'
            )
            .eq('is_active', true)
            .eq('archived', false)
            .not('compare_at_price', 'is', null)
            .gt('compare_at_price', 0)
            .order('created_at', { ascending: false })
            .limit(limit);

          // ✅ Filter to ensure compare_at_price > price (actual discount)
          products = ((data ?? []) as ShowroomProduct[]).filter(
            (p) => p.compare_at_price !== null && p.compare_at_price > p.price
          );

        } else if (showroom.type === 'auto_bestselling') {
          // ✅ Best Selling: Products that appear most in order_items
          const { data: topProducts } = await supabase
            .from('order_items')
            .select('product_id, quantity')
            .order('quantity', { ascending: false });

          if (topProducts && topProducts.length > 0) {
            // Count total quantity sold per product
            const salesCount: Record<string, number> = {};
            for (const item of topProducts) {
              if (item.product_id) {
                salesCount[item.product_id] = (salesCount[item.product_id] || 0) + item.quantity;
              }
            }

            // Sort by sales count and get top product IDs
            const topProductIds = Object.entries(salesCount)
              .sort((a, b) => b[1] - a[1])
              .slice(0, limit)
              .map(([id]) => id);

            if (topProductIds.length > 0) {
              const { data: bestProducts } = await supabase
                .from('products')
                .select(
                  'id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors'
                )
                .in('id', topProductIds)
                .eq('is_active', true)
                .eq('archived', false);

              // ✅ Maintain sales order
              const productMap = new Map(
                ((bestProducts ?? []) as ShowroomProduct[]).map((p) => [p.id, p])
              );

              products = topProductIds
                .map((id) => productMap.get(id))
                .filter((p): p is ShowroomProduct => p !== undefined && p.is_active);
            }
          }

          // ✅ Fallback: If no order data, show products with highest stock turnover
          if (products.length === 0) {
            const { data: fallback } = await supabase
              .from('products')
              .select(
                'id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active, sizes, colors'
              )
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

    return NextResponse.json({ success: true, data: showroomsWithProducts });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Server error',
      },
      { status: 500 }
    );
  }
}