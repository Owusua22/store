// app/api/admin/showrooms/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') +
    '-' +
    Math.random().toString(36).substring(2, 7);
}

// GET - Get Single Showroom with Products
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const { data: showroom, error } = await supabase
      .from('showrooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !showroom) {
      return NextResponse.json({ success: false, error: 'Showroom not found' }, { status: 404 });
    }

    // Get assigned products
    const { data: showroomProducts } = await supabase
      .from('showroom_products')
      .select('product_id, sort_order, product:products(id, name, slug, price, compare_at_price, thumbnail, stock_quantity, is_active)')
      .eq('showroom_id', id)
      .order('sort_order', { ascending: true });

    return NextResponse.json({
      success: true,
      data: { ...showroom, products: showroomProducts ?? [] },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}

// PUT - Update Showroom
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { ...body };
    if (body.name && typeof body.name === 'string') {
      updateData.slug = generateSlug(body.name);
    }
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('showrooms')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { message: 'Showroom updated' } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}