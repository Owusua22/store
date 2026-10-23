// app/api/products/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function cleanSearchTerm(value: string) {
  return value
    .trim()
    .replace(/[,%()]/g, ' ')
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
      return NextResponse.json({
        success: true,
        data: [] as ProductSearchRow[],
      });
    }

    const supabase = getSupabaseAdminClient();

    const likeQuery = `%${q}%`;

    const { data, error } = await supabase
      .from('products')
      .select(
        `
        id,
        name,
        slug,
        thumbnail,
        price,
        compare_at_price,
        category,
        stock_quantity
      `
      )
      .eq('is_active', true)
      .or(
        `name.ilike.${likeQuery},description.ilike.${likeQuery},category.ilike.${likeQuery}`
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data ?? [],
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
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