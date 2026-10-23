import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';

async function requireAdmin() {
  const supabase = await createRouteHandlerSupabaseClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return { supabase, error: 'Unauthorized', status: 401 as const };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { supabase, error: 'Forbidden', status: 403 as const };
  }

  return { supabase, error: null, status: null };
}

// POST - add product to showroom
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, error, status } = await requireAdmin();

    if (error) {
      return NextResponse.json({ success: false, error }, { status: status! });
    }

    const { id: showroomId } = await params;
    const body = await request.json();
    const productId = body.product_id as string | undefined;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'product_id is required' },
        { status: 400 }
      );
    }

    // check if already exists
    const { data: existing } = await supabase
      .from('showroom_products')
      .select('product_id')
      .eq('showroom_id', showroomId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Product already assigned to showroom' },
        { status: 409 }
      );
    }

    // get next sort order
    const { data: lastRow } = await supabase
      .from('showroom_products')
      .select('sort_order')
      .eq('showroom_id', showroomId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = (lastRow?.sort_order ?? -1) + 1;

    const { error: insertError } = await supabase
      .from('showroom_products')
      .insert({
        showroom_id: showroomId,
        product_id: productId,
        sort_order: nextSortOrder,
      });

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Product added to showroom' },
    });
  } catch (error) {
    console.error('POST showroom product error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - remove product from showroom
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, error, status } = await requireAdmin();

    if (error) {
      return NextResponse.json({ success: false, error }, { status: status! });
    }

    const { id: showroomId } = await params;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'productId is required' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('showroom_products')
      .delete()
      .eq('showroom_id', showroomId)
      .eq('product_id', productId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Product removed from showroom' },
    });
  } catch (error) {
    console.error('DELETE showroom product error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}