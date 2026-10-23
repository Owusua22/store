// app/api/banners/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';

export async function GET() {
  try {
    const supabase = await createRouteHandlerSupabaseClient();

    const { data: banners, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .eq('archived', false)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: banners });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}