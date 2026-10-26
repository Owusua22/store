// app/api/products/search/route.ts
// Typeahead search for the navbar. Live mode queries Postgres (service role, so
// it works without a session); demo mode searches the bundled catalogue.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { isSupabaseConfigured, serviceRoleKey, supabaseUrl } from '@/lib/supabase/config';
import { searchDemoProducts } from '@/lib/demo/catalog';

export const dynamic = 'force-dynamic';

type ProductSearchRow = {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  price: number | null;
  compare_at_price: number | null;
  category: string | null;
  stock_quantity: number | null;
};

function getSupabaseAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Strip PostgREST syntax characters so a search term cannot break the filter. */
function cleanSearchTerm(value: string) {
  return value
    .trim()
    .replace(/[,%()*\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = cleanSearchTerm(searchParams.get('q') ?? '');
    const limitParam = Number(searchParams.get('limit') ?? 8);
    const limit = Math.min(Math.max(limitParam || 8, 1), 20);

    if (q.length < 2) {
      return NextResponse.json({ success: true, data: [] as ProductSearchRow[] }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    if (!isSupabaseConfigured || !serviceRoleKey) {
      const results = searchDemoProducts(q, limit).map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        thumbnail: product.thumbnail,
        price: product.price,
        compare_at_price: product.compare_at_price,
        category: product.category?.name ?? null,
        stock_quantity: product.stock_quantity,
      }));

      return NextResponse.json(
        { success: true, data: results },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const supabase = getSupabaseAdminClient();
    const term = `%${q}%`;

    const { data, error } = await supabase
      .from('products')
      .select(
        'id, name, slug, thumbnail, price, compare_at_price, stock_quantity, category:categories(name)'
      )
      .eq('is_active', true)
      .eq('archived', false)
      .or(`name.ilike.${term},brand.ilike.${term},description.ilike.${term}`)
      .order('sold_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('product search failed:', error.message);
      // Never break the navbar because of a backend hiccup.
      return NextResponse.json(
        { success: true, data: [] as ProductSearchRow[] },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const rows: ProductSearchRow[] = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      thumbnail: row.thumbnail,
      price: row.price,
      compare_at_price: row.compare_at_price,
      category: (row.category as { name?: string } | null)?.name ?? null,
      stock_quantity: row.stock_quantity,
    }));

    return NextResponse.json(
      { success: true, data: rows },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('product search failed:', error);
    return NextResponse.json(
      { success: true, data: [] as ProductSearchRow[] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
