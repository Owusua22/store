// src/app/api/admin/products/archive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';

export async function PUT(request: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient();
  const user = await getAuthenticatedUser(); // ✅ No argument

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

  let body: { id?: string; archive?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, archive } = body;
  if (!id) {
    return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
  }

  // archive = true → set is_active = false (hide product)
  // archive = false → set is_active = true (restore)
  const isActive = !archive;

  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: { message: archive ? 'Product archived' : 'Product restored' },
  });
}