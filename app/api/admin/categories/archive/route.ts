// src/app/api/admin/categories/archive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';

export async function POST(request: NextRequest) {
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

  const formData = await request.formData();
  const id = formData.get('id') as string;
  const archived = formData.get('archived') === 'true';

  if (!id) {
    return NextResponse.json({ success: false, error: 'Category ID required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('categories')
    .update({ 
      archived, 
      is_active: archived ? false : true,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: { message: archived ? 'Category archived' : 'Category restored' },
  });
}