// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { formatZodError } from '@/lib/validation';
import { generateOrderNumber } from '@/lib/utils';
import type { ApiResponse, Order, Product } from '@/types';
// ✅ Import the row types and helper
import {
  type CartItemRow,
  type CartWithItemsRow,
  singleRelation,
} from '@/types/supabase-rows';

const shippingAddressSchema = z.object({
  full_name: z.string().min(1),
  address_line1: z.string().min(1),
  address_line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postal_code: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(1),
});

const createOrderSchema = z.object({
  shipping_address: shippingAddressSchema,
  notes: z.string().optional(),
});

export async function GET(_request: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  let query = supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false });

  if (!profile || profile.role !== 'admin') {
    query = query.eq('user_id', session.user.id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: error.message, success: false },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse<Order[]>>({
    data: (data ?? []) as Order[],
    error: null,
    success: true,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'Invalid JSON body', success: false },
      { status: 400 }
    );
  }

  const validated = createOrderSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: formatZodError(validated.error), success: false },
      { status: 400 }
    );
  }

  // ✅ Type the Supabase response using <CartWithItemsRow>
  const { data: cart } = await supabase
    .from('carts')
    .select('id, user_id, session_id, created_at, updated_at, items:cart_items(*, product:products(*))')
    .eq('user_id', session.user.id)
    .maybeSingle<CartWithItemsRow>();

  if (!cart || !cart.items || cart.items.length === 0) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'Cart is empty', success: false },
      { status: 400 }
    );
  }

  const orderItems: Array<{
    product_id: string;
    product_name: string;
    product_image: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
  }> = [];

  let subtotal = 0;

  // ✅ FIX: typed loop, no `any`
  for (const item of cart.items as CartItemRow[]) {
    const product = singleRelation<Product>(item.product);

    if (!product?.is_active) {
      return NextResponse.json<ApiResponse>(
        {
          data: null,
          error: `Product "${product?.name ?? item.product_id}" is unavailable`,
          success: false,
        },
        { status: 400 }
      );
    }

    if (product.stock_quantity < item.quantity) {
      return NextResponse.json<ApiResponse>(
        {
          data: null,
          error: `Insufficient stock for "${product.name}"`,
          success: false,
        },
        { status: 400 }
      );
    }

    const total_price = product.price * item.quantity;
    subtotal += total_price;

    orderItems.push({
      product_id: item.product_id,
      product_name: product.name,
      product_image: product.thumbnail ?? null,
      quantity: item.quantity,
      unit_price: product.price,
      total_price,
    });
  }

  const tax_amount = Math.round(subtotal * 0.1 * 100) / 100;
  const shipping_amount = subtotal > 50 ? 0 : 9.99;
  const total_amount =
    Math.round((subtotal + tax_amount + shipping_amount) * 100) / 100;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: generateOrderNumber(),
      user_id: session.user.id,
      status: 'pending',
      total_amount,
      subtotal,
      tax_amount,
      shipping_amount,
      shipping_address: validated.data.shipping_address,
      notes: validated.data.notes ?? null,
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: orderError?.message ?? 'Failed to create order',
        success: false,
      },
      { status: 500 }
    );
  }

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id);
    return NextResponse.json<ApiResponse>(
      { data: null, error: itemsError.message, success: false },
      { status: 500 }
    );
  }

  await Promise.all(
    orderItems.map((item) =>
      supabase.rpc('decrement_stock', {
        product_id: item.product_id,
        amount: item.quantity,
      })
    )
  );

  await supabase.from('cart_items').delete().eq('cart_id', cart.id);

  return NextResponse.json<ApiResponse<Order>>(
    { data: order as Order, error: null, success: true },
    { status: 201 }
  );
}