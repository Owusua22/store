import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { demoShippingZones } from '@/lib/demo/shipping';

function getPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ✅ Named HTTP Method Export
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ success: true, data: demoShippingZones });
  }

  try {
    const client = getPublicClient();

    // Fetch active shipping zones matching global/default
    const { data: zones, error } = await client
      .from('shipping_zones')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Zone fetch error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: zones ?? [] });
  } catch (error) {
    console.error('Zone fetch error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}