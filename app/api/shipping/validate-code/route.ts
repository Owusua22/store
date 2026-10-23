import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    let body: { code: string; order_total: number };
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }

    const { code, order_total } = body;
    if (!code) return NextResponse.json({ success: false, error: 'Code is required' }, { status: 400 });

    const adminClient = getAdminClient();

    const { data: discountCode, error } = await adminClient
      .from('shipping_discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !discountCode) {
      return NextResponse.json({ success: false, error: 'Invalid discount code' }, { status: 404 });
    }

    // Check expiry
    if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'This code has expired' }, { status: 400 });
    }

    // Check start date
    if (discountCode.starts_at && new Date(discountCode.starts_at) > new Date()) {
      return NextResponse.json({ success: false, error: 'This code is not yet active' }, { status: 400 });
    }

    // Check max uses
    if (discountCode.max_uses && discountCode.used_count >= discountCode.max_uses) {
      return NextResponse.json({ success: false, error: 'This code has reached its usage limit' }, { status: 400 });
    }

    // Check min order amount
    if (discountCode.min_order_amount && order_total < discountCode.min_order_amount) {
      return NextResponse.json({
        success: false,
        error: `Minimum order amount is $${discountCode.min_order_amount}`,
      }, { status: 400 });
    }

    // Check if user already used this code
    const { data: existingUse } = await adminClient
      .from('shipping_code_uses')
      .select('id')
      .eq('code_id', discountCode.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingUse) {
      return NextResponse.json({ success: false, error: 'You have already used this code' }, { status: 400 });
    }

    // Calculate discount
    let shippingDiscount = 0;
    if (discountCode.discount_type === 'free_shipping') {
      shippingDiscount = -1; // Signal for free shipping
    } else if (discountCode.discount_type === 'fixed_amount') {
      shippingDiscount = discountCode.discount_value;
    } else if (discountCode.discount_type === 'percentage') {
      shippingDiscount = discountCode.discount_value;
    }

    return NextResponse.json({
      success: true,
      data: {
        code_id: discountCode.id,
        code: discountCode.code,
        discount_type: discountCode.discount_type,
        discount_value: shippingDiscount,
        description: discountCode.description,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}