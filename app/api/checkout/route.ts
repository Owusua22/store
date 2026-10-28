// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { formatZodError } from '@/lib/validation';
import type { Product } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { site } from '@/lib/site';

const FREE_DELIVERY_THRESHOLD = site.freeDeliveryThreshold;

// ============================================
// Schemas and Helpers
// ============================================

const shippingSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  town: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  zone_id: z.string().uuid().optional().nullable(),
  delivery_notes: z.string().optional(),
});

const checkoutSchema = z.object({
  shipping_address: shippingSchema,
  payment_method: z.enum(['cod', 'card', 'mpesa', 'momo']).default('cod'),
  notes: z.string().optional(),
  delivery_method: z.enum(['delivery', 'pickup']).default('delivery'),
  shipping_zone_id: z.string().uuid().optional().nullable(),
  discount_code_id: z.string().uuid().optional().nullable(),
});

function generateOrderNumber(): string {
  const prefix = 'ORD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================
// CHECKOUT API ROUTE (POST)
// ============================================
export async function POST(request: NextRequest) {
  // Demo mode: accept the order without a backend so checkout can be tested.
  if (!isSupabaseConfigured) {
    try {
      const body = await request.json();
      const shipping = body?.shipping_address ?? {};
      const name = String(shipping.full_name ?? '').trim();

      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Full name is required' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { order_number: generateOrderNumber(), demo: true },
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
  }

  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();

    if (!user) {
      console.log('❌ [CHECKOUT] No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Please sign in to checkout' },
        { status: 401 }
      );
    }

    console.log('🛍️ [CHECKOUT] Starting checkout for user:', user.id);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const validated = checkoutSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(validated.error) },
        { status: 400 }
      );
    }

    // Get user's cart
    console.log('🛒 [CHECKOUT] Fetching user cart...');
    const { data: userCart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (cartError || !userCart) {
      console.error('❌ [CHECKOUT] Cart fetch error:', cartError);
      return NextResponse.json(
        { success: false, error: 'Your cart is empty or could not be found.' },
        { status: 404 }
      );
    }

    console.log('✅ [CHECKOUT] Cart found:', userCart.id);

    // Get all cart items
    console.log('📦 [CHECKOUT] Fetching cart items...');
    const { data: allCartItems, error: cartItemsError } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('cart_id', userCart.id);

    if (cartItemsError || !allCartItems || allCartItems.length === 0) {
      console.error('❌ [CHECKOUT] Cart items fetch error:', cartItemsError);
      return NextResponse.json(
        { success: false, error: 'Your cart is empty.' },
        { status: 400 }
      );
    }

    console.log(`✅ [CHECKOUT] Found ${allCartItems.length} items in cart`);

    // Validate stock and prepare order items
    let subtotal = 0;
    const orderItemsPayload: Array<{
      product_id: string;
      product_name: string;
      product_image: string | null;
      quantity: number;
      unit_price: number;
      /** Cost price at the moment of sale — powers the COGS in /admin/accounting */
      unit_cost: number;
      total_price: number;
      selected_size: string | null;
      selected_color: string | null;
    }> = [];

    const inventoryUpdates: Array<{
      product_id: string;
      product_name: string;
      old_stock: number;
      new_stock: number;
    }> = [];

    console.log('🔍 [CHECKOUT] Validating items and stock...');
    for (const item of allCartItems) {
      const product = item.product as Product;

      if (!product || !product.is_active) {
        console.error(`❌ [CHECKOUT] Product not available: ${product?.name}`);
        return NextResponse.json(
          { success: false, error: `Product "${product?.name || 'Unknown'}" is no longer available.` },
          { status: 400 }
        );
      }

      if (item.quantity > product.stock_quantity) {
        console.error(`❌ [CHECKOUT] Insufficient stock: ${product.name}`);
        return NextResponse.json(
          {
            success: false,
            error: `Only ${product.stock_quantity} of "${product.name}" available. You requested ${item.quantity}.`,
          },
          { status: 400 }
        );
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      console.log(`  ✅ ${product.name}: ${item.quantity} × ${product.price}`);

      orderItemsPayload.push({
        product_id: product.id,
        product_name: product.name,
        product_image: product.thumbnail,
        quantity: item.quantity,
        unit_price: product.price,
        unit_cost: Number(product.cost_price ?? 0),
        total_price: itemTotal,
        selected_size: item.selected_size || null,
        selected_color: item.selected_color || null,
      });

      inventoryUpdates.push({
        product_id: product.id,
        product_name: product.name,
        old_stock: product.stock_quantity,
        new_stock: product.stock_quantity - item.quantity,
      });
    }

    // Delivery is free above the brand threshold (GH₵300) and for pickup.
    // Below that we use the zone the shopper picked, falling back to the
    // matching town/region and finally the cheapest active zone.
    const address = validated.data.shipping_address;
    const adminClient = getAdminClient();
    const deliveryMethod = validated.data.delivery_method;
    const zoneId = validated.data.shipping_zone_id ?? address.zone_id ?? null;
    let shippingAmount = 0;

    if (deliveryMethod === 'delivery' && subtotal < FREE_DELIVERY_THRESHOLD) {
      let zoneFee: number | null = null;

      if (zoneId) {
        const { data: zone } = await adminClient
          .from('shipping_zones')
          .select('shipping_fee')
          .eq('id', zoneId)
          .maybeSingle();
        zoneFee = zone ? Number(zone.shipping_fee) : null;
      }

      if (zoneFee === null && (address.town || address.city || address.region)) {
        let zoneQuery = adminClient
          .from('shipping_zones')
          .select('shipping_fee')
          .eq('is_active', true)
          .limit(1);
        if (address.town || address.city) zoneQuery = zoneQuery.eq('town', address.town ?? address.city);
        else if (address.region) zoneQuery = zoneQuery.eq('region', address.region);

        const { data: zone } = await zoneQuery;
        zoneFee = zone && zone[0] ? Number(zone[0].shipping_fee) : null;
      }

      if (zoneFee === null) {
        const { data: cheapest } = await adminClient
          .from('shipping_zones')
          .select('shipping_fee')
          .eq('is_active', true)
          .order('shipping_fee', { ascending: true })
          .limit(1);
        zoneFee = cheapest && cheapest[0] ? Number(cheapest[0].shipping_fee) : 0;
      }

      shippingAmount = zoneFee ?? 0;
    }

    const taxAmount = 0;
    const totalAmount = subtotal + shippingAmount + taxAmount;

    const orderNumber = generateOrderNumber();

    console.log('💳 [CHECKOUT] Order summary:', {
      orderNumber,
      subtotal,
      shippingAmount,
      totalAmount,
      itemCount: orderItemsPayload.length,
    });

    // Create the Order
    console.log('📝 [CHECKOUT] Creating order...');
    const { data: order, error: orderCreateError } = await adminClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        status: 'pending',
        subtotal,
        shipping_amount: shippingAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        shipping_address: validated.data.shipping_address,
        payment_status: 'pending',
        payment_method: validated.data.payment_method,
        notes: validated.data.notes || null,
        delivery_method: deliveryMethod,
        shipping_zone_id: zoneId,
        discount_amount: 0,
      })
      .select()
      .single();

    if (orderCreateError) {
      console.error('❌ [CHECKOUT] Order creation error:', orderCreateError);
      throw new Error(`Order creation failed: ${orderCreateError.message}`);
    }

    console.log('✅ [CHECKOUT] Order created:', order.id);

    // Insert Order Items
    console.log('📦 [CHECKOUT] Creating order items...');
    const { error: orderItemsInsertError } = await adminClient
      .from('order_items')
      .insert(orderItemsPayload.map((item) => ({ ...item, order_id: order.id })));

    if (orderItemsInsertError) {
      console.error('❌ [CHECKOUT] Order items insert error:', orderItemsInsertError);
      // Rollback: Delete the order if item creation fails
      await adminClient.from('orders').delete().eq('id', order.id);
      throw new Error(`Order item creation failed: ${orderItemsInsertError.message}`);
    }

    console.log('✅ [CHECKOUT] Order items created');

    // Update Product Stock
    console.log('🔄 [CHECKOUT] Updating inventory...');
    for (const update of inventoryUpdates) {
      const { error: stockUpdateError } = await adminClient
        .from('products')
        .update({ stock_quantity: update.new_stock })
        .eq('id', update.product_id);

      if (stockUpdateError) {
        console.error(`❌ [CHECKOUT] Stock update error for ${update.product_id}:`, stockUpdateError);
      } else {
        console.log(`  ✅ ${update.product_name}: ${update.old_stock} → ${update.new_stock}`);
        await adminClient.from('inventory_movements').insert({
          product_id: update.product_id,
          change: update.new_stock - update.old_stock,
          reason: 'order-fulfilled',
          note: `Order ${orderNumber}`,
          order_id: order.id,
        });
      }
    }

    console.log('✅ [CHECKOUT] Inventory updated');

    // Clear the cart
    console.log('🗑️ [CHECKOUT] Clearing cart...');
    const { error: cartClearError } = await adminClient
      .from('cart_items')
      .delete()
      .eq('cart_id', userCart.id);

    if (cartClearError) {
      console.error('⚠️ [CHECKOUT] Warning - Cart clear error:', cartClearError);
    } else {
      console.log('✅ [CHECKOUT] Cart cleared');
    }

    console.log('✅ [CHECKOUT] Checkout completed successfully');

    return NextResponse.json(
      {
        success: true,
        data: {
          order_id: order.id,
          order_number: order.order_number,
          total_amount: totalAmount,
          inventory_updates: inventoryUpdates,
        },
        message: 'Order created successfully. Inventory updated.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [CHECKOUT] Exception:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'A server error occurred during checkout.',
      },
      { status: 500 }
    );
  }
}