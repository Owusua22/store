import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdmin() {
  const user = await getAuthenticatedUser();
  if (!user) return { user: null, error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };

  const supabase = await createRouteHandlerSupabaseClient();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  if (profile?.role !== 'admin') {
    return { user: null, error: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return { user, error: null };
}

// GET - Get Single Product WITH Variants
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = getAdminClient();

  const { data: product, error: dbError } = await adminClient
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  const { data: variants } = await adminClient
    .from('product_variants')
    .select('*')
    .eq('product_id', id)
    .order('size', { ascending: true })
    .order('color', { ascending: true });

  return NextResponse.json({
    success: true,
    data: { ...product, variants: variants ?? [] },
  });
}

// PUT - Update Product WITH Variants
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = getAdminClient();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const variants = body.variants as Array<{
    size: string;
    color: string;
    price: number;
    compare_at_price?: number | null;
    stock_quantity: number;
    sku?: string;
  }> | undefined;

  delete body.variants;

  // Auto-calculate aggregates from variants
  if (variants && variants.length > 0) {
    body.sizes = [...new Set(variants.map((v) => v.size))];
    body.colors = [...new Set(variants.map((v) => v.color))];
    body.stock_quantity = variants.reduce((sum, v) => sum + v.stock_quantity, 0);
    
    const allPrices = variants.map((v) => v.price);
    body.price = Math.min(...allPrices);
    
    const maxPrice = Math.max(...allPrices);
    if (maxPrice > (body.price as number)) {
      body.metadata = { ...(body.metadata as object || {}), max_price: maxPrice };
    } else {
      if (body.metadata && typeof body.metadata === 'object' && 'max_price' in body.metadata) {
        delete (body.metadata as {max_price?: number}).max_price;
      }
    }
  }
  
  body.updated_at = new Date().toISOString();

  const { error: updateError } = await adminClient
    .from('products')
    .update(body)
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
  }

  // Replace variants
  if (variants !== undefined) {
    await adminClient.from('product_variants').delete().eq('product_id', id);

    if (variants.length > 0) {
      const { error: variantsError } = await adminClient
        .from('product_variants')
        .insert(variants.map((v) => ({ ...v, product_id: id })));

      if (variantsError) {
        console.error('Variants update error:', variantsError);
        return NextResponse.json({ success: false, error: 'Failed to update variants' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true, data: { message: 'Product updated' } });
}

// DELETE
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = getAdminClient();

  const { error: dbError } = await adminClient.from('products').delete().eq('id', id);
  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { message: 'Product deleted' } });
}