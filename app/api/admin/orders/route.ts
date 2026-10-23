// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET - List all orders
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const adminClient = getAdminClient();

    let query = adminClient
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('❌ Orders fetch error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Fetch customer profiles
    const userIds = [...new Set((orders ?? []).map((o) => o.user_id).filter(Boolean))];
    let profiles: Record<string, { full_name: string; email: string }> = {};

    if (userIds.length > 0) {
      const { data: profilesData } = await adminClient
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesData) {
        profiles = Object.fromEntries(
          profilesData.map((p) => [p.id, { full_name: p.full_name, email: p.email }])
        );
      }
    }

    const ordersWithProfiles = (orders ?? []).map((order) => ({
      ...order,
      profile: profiles[order.user_id] || null,
    }));

    return NextResponse.json({
      success: true,
      data: ordersWithProfiles,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('❌ GET /api/admin/orders error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update order status with inventory management
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { order_id, new_status } = body;

    console.log('🔄 [PATCH] Updating order status:', { order_id, new_status });

    if (!order_id || !new_status) {
      return NextResponse.json(
        { success: false, error: 'Missing order_id or new_status' },
        { status: 400 }
      );
    }

    const adminClient = getAdminClient();

    // Get the current order
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const previousStatus = order.status;
    console.log(`📋 Previous status: ${previousStatus}, New status: ${new_status}`);

    // Get order items
    const { data: orderItems, error: itemsError } = await adminClient
      .from('order_items')
      .select('*')
      .eq('order_id', order_id);

    if (itemsError) {
      console.error('❌ Error fetching order items:', itemsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch order items' },
        { status: 500 }
      );
    }

    console.log(`📦 Processing ${orderItems?.length || 0} items`);

    const inventoryUpdates: Array<{
      product_id: string;
      old_stock: number;
      new_stock: number;
      action: string;
    }> = [];

    // Handle inventory based on status changes
    if (orderItems && orderItems.length > 0) {
      const shouldRestock = new_status === 'delivered' && previousStatus !== 'delivered';
      const shouldDestock = previousStatus === 'delivered' && new_status !== 'delivered';
      const shouldCancelStock = new_status === 'cancelled' && previousStatus !== 'cancelled';
      const shouldRestoreCancelledStock = previousStatus === 'cancelled' && new_status !== 'cancelled';

      console.log('📊 Inventory actions:', {
        shouldRestock,
        shouldDestock,
        shouldCancelStock,
        shouldRestoreCancelledStock,
      });

      for (const item of orderItems) {
        const { data: product, error: productError } = await adminClient
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (productError || !product) {
          console.error(`❌ Product not found: ${item.product_id}`, productError);
          continue;
        }

        const oldStock = product.stock_quantity;
        let newStock = oldStock;
        let action = '';

        // RESTOCK: when status changes TO delivered
        if (shouldRestock) {
          newStock = oldStock + item.quantity;
          action = `RESTOCK (+${item.quantity})`;
          console.log(`✅ Restocking: Product ${item.product_id}, ${oldStock} → ${newStock}`);
        }
        // DESTOCK: when status changes FROM delivered
        else if (shouldDestock) {
          newStock = Math.max(0, oldStock - item.quantity);
          action = `DESTOCK (-${item.quantity})`;
          console.log(`📉 De-stocking: Product ${item.product_id}, ${oldStock} → ${newStock}`);
        }
        // CANCEL: when status changes TO cancelled
        else if (shouldCancelStock) {
          newStock = oldStock + item.quantity;
          action = `CANCEL_RESTOCK (+${item.quantity})`;
          console.log(`♻️ Cancelling order: Product ${item.product_id}, ${oldStock} → ${newStock}`);
        }
        // RESTORE from cancelled: when status changes FROM cancelled
        else if (shouldRestoreCancelledStock) {
          newStock = Math.max(0, oldStock - item.quantity);
          action = `RESTORE_DESTOCK (-${item.quantity})`;
          console.log(`📥 Restoring from cancel: Product ${item.product_id}, ${oldStock} → ${newStock}`);
        }

        // Update product stock if changed
        if (newStock !== oldStock) {
          const { error: updateError } = await adminClient
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product_id);

          if (updateError) {
            console.error(`❌ Error updating stock for product ${item.product_id}:`, updateError);
          } else {
            console.log(`✅ Stock updated successfully`);
            inventoryUpdates.push({
              product_id: item.product_id,
              old_stock: oldStock,
              new_stock: newStock,
              action,
            });
          }
        }
      }
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await adminClient
      .from('orders')
      .update({ status: new_status, updated_at: new Date().toISOString() })
      .eq('id', order_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating order status:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    console.log('✅ Order status updated successfully');

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      inventoryUpdates,
      message: `Order status updated from ${previousStatus} to ${new_status}`,
    });
  } catch (error) {
    console.error('❌ PATCH /api/admin/orders error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}

// POST - Create new order with inventory deduction
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      items,
      subtotal,
      tax_amount,
      shipping_amount,
      total_amount,
      shipping_address,
      payment_method,
      notes,
    } = body;

    console.log('🛍️ [POST] Creating order with', items?.length || 0, 'items');

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items in order' },
        { status: 400 }
      );
    }

    const adminClient = getAdminClient();

    // Create the order
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: 'pending',
        total_amount,
        subtotal,
        tax_amount,
        shipping_amount,
        shipping_address,
        payment_intent_id: null,
        payment_status: 'pending',
        payment_method,
        notes,
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      );
    }

    console.log('✅ Order created:', order.order_number);

    // Create order items and decrease stock
    const inventoryUpdates: Array<{
      product_id: string;
      old_stock: number;
      new_stock: number;
    }> = [];
    const stockErrors: string[] = [];

    for (const item of items) {
      console.log(`\n📦 Processing item: ${item.product_id}, quantity: ${item.quantity}`);

      // Create order item
      const { error: itemError } = await adminClient
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          selected_size: item.selected_size || null,
          selected_color: item.selected_color || null,
        });

      if (itemError) {
        stockErrors.push(`Failed to create order item for ${item.product_name}`);
        console.error('❌ Error creating order item:', itemError);
        continue;
      }

      // Get current product stock
      const { data: product, error: productError } = await adminClient
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        stockErrors.push(`Product ${item.product_id} not found`);
        console.error('❌ Error fetching product:', productError);
        continue;
      }

      const oldStock = product.stock_quantity;

      // Decrease stock
      const newStock = Math.max(0, oldStock - item.quantity);

      const { error: updateError } = await adminClient
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', item.product_id);

      if (updateError) {
        stockErrors.push(`Failed to update stock for ${item.product_name}`);
        console.error('❌ Error updating stock:', updateError);
        continue;
      }

      console.log(`✅ Stock updated: ${oldStock} → ${newStock}`);
      inventoryUpdates.push({
        product_id: item.product_id,
        old_stock: oldStock,
        new_stock: newStock,
      });
    }

    // Clear cart
    const { data: cart } = await adminClient
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (cart) {
      await adminClient
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);
      console.log('✅ Cart cleared');
    }

    console.log('✅ Order creation completed successfully');

    return NextResponse.json(
      {
        success: true,
        data: order,
        inventoryUpdates,
        warnings: stockErrors.length > 0 ? stockErrors : undefined,
        message: `Order ${order.order_number} created successfully with inventory adjusted`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ POST /api/admin/orders error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}