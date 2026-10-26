// app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { formatZodError } from '@/lib/validation';
import type { ApiResponse, Cart } from '@/types';
import { isSchemaMissingError, setupRequiredResponse } from '@/lib/supabase/health';

// 🚨 CRITICAL: Prevent Next.js from caching the cart API response
export const dynamic = 'force-dynamic';

// ✅ Strict TypeScript Interfaces for DB Response
interface DbVariant {
  id: string;
  size: string;
  color: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  is_active: boolean;
}

interface DbProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  thumbnail: string | null;
  is_active: boolean;
  variants: DbVariant[];
}

interface DbCartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  selected_size: string | null;
  selected_color: string | null;
  created_at: string;
  updated_at: string;
  product: DbProduct;
}

const cartItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID format'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  selected_size: z.string().nullable().optional(),
  selected_color: z.string().nullable().optional(),
});

// ─── GET /api/cart ────────────────────────────────────────────────────────────
export async function GET() {
  const supabase = await createRouteHandlerSupabaseClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 }
    );
  }

  const { data: existingCart, error: cartError } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  let cart = existingCart;

  if (cartError) {
    if (isSchemaMissingError(cartError)) {
      // Tables not created yet — treat the cart as empty instead of erroring.
      return NextResponse.json(
        {
          success: true,
          setupRequired: true,
          data: { id: 'setup-required', user_id: user.id, items: [] },
        },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { data: null, error: cartError.message, success: false },
      { status: 500 }
    );
  }

  if (!cart) {
    const { data: newCart, error: createError } = await supabase
      .from('carts')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (createError || !newCart) {
      if (createError && isSchemaMissingError(createError)) return setupRequiredResponse();

      return NextResponse.json<ApiResponse>(
        { data: null, error: createError?.message ?? 'Failed to create cart', success: false },
        { status: 500 }
      );
    }
    cart = newCart;
  }

  const { data: items, error: itemsError } = await supabase
    .from('cart_items')
    .select(
      `id, cart_id, product_id, quantity, selected_size, selected_color, created_at, updated_at,
       product:products(id, name, slug, price, compare_at_price,
                        stock_quantity, thumbnail, is_active,
                        variants:product_variants(id, size, color, price, compare_at_price, stock_quantity, is_active))`
    )
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true });

  if (itemsError) {
    if (isSchemaMissingError(itemsError)) return setupRequiredResponse();

    return NextResponse.json<ApiResponse>(
      { data: null, error: itemsError.message, success: false },
      { status: 500 }
    );
  }

  // ✅ FIX: Cast through `unknown` to resolve TypeScript overlap error.
  // Supabase inference may treat `product` as an array, but the query returns a single object.
  const mappedItems = (items as unknown as DbCartItem[] | null)?.map((item) => {
    let finalPrice = item.product.price;
    let finalCompareAtPrice = item.product.compare_at_price;
    let finalStock = item.product.stock_quantity;
    let finalIsActive = item.product.is_active;

    if (item.selected_size && item.selected_color && item.product.variants && item.product.variants.length > 0) {
      const variant = item.product.variants.find(
        (v) => v.size === item.selected_size && v.color === item.selected_color
      );
      
      if (variant) {
        finalPrice = variant.price;
        finalCompareAtPrice = variant.compare_at_price;
        finalStock = variant.stock_quantity;
        finalIsActive = variant.is_active && item.product.is_active;
      } else {
        finalIsActive = false;
        finalStock = 0;
      }
    }

    return {
      id: item.id,
      cart_id: item.cart_id,
      product_id: item.product_id,
      quantity: item.quantity,
      selected_size: item.selected_size,
      selected_color: item.selected_color,
      created_at: item.created_at,
      updated_at: item.updated_at,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: finalPrice,
        compare_at_price: finalCompareAtPrice,
        stock_quantity: finalStock,
        thumbnail: item.product.thumbnail,
        is_active: finalIsActive,
      },
    };
  }) ?? [];

  return NextResponse.json<ApiResponse<Cart>>({
    data: { ...cart, items: mappedItems } as Cart,
    error: null,
    success: true,
  });
}

// ─── POST /api/cart ───────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient();
  const user = await getAuthenticatedUser();

  if (!user) {
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

  const validated = cartItemSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: formatZodError(validated.error), success: false },
      { status: 400 }
    );
  }

  const { product_id, quantity, selected_size, selected_color } = validated.data;

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, stock_quantity, is_active')
    .eq('id', product_id)
    .maybeSingle();

  if (productError || !product) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'Product not found', success: false },
      { status: 404 }
    );
  }

  if (!product.is_active) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'Product is no longer available', success: false },
      { status: 400 }
    );
  }

  let { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!cart) {
    const { data: newCart, error: createError } = await supabase
      .from('carts')
      .insert({ user_id: user.id })
      .select('id')
      .single();
    if (createError || !newCart) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Failed to create cart', success: false },
        { status: 500 }
      );
    }
    cart = newCart;
  }

  let existingItemQuery = supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart.id)
    .eq('product_id', product_id);

  if (selected_size) {
    existingItemQuery = existingItemQuery.eq('selected_size', selected_size);
  } else {
    existingItemQuery = existingItemQuery.is('selected_size', null);
  }

  if (selected_color) {
    existingItemQuery = existingItemQuery.eq('selected_color', selected_color);
  } else {
    existingItemQuery = existingItemQuery.is('selected_color', null);
  }

  const { data: existingItem } = await existingItemQuery.maybeSingle();

  const newQuantity = (existingItem?.quantity ?? 0) + quantity;

  if (newQuantity > product.stock_quantity) {
    const remaining = product.stock_quantity - (existingItem?.quantity ?? 0);
    return NextResponse.json<ApiResponse>(
      { data: null, error: `Only ${remaining} unit(s) remaining`, success: false },
      { status: 400 }
    );
  }

  if (existingItem) {
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq('id', existingItem.id);

    if (updateError) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: updateError.message, success: false },
        { status: 500 }
      );
    }
  } else {
    const { error: insertError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cart.id,
        product_id,
        quantity,
        selected_size: selected_size || null,
        selected_color: selected_color || null,
      });

    if (insertError) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: insertError.message, success: false },
        { status: 500 }
      );
    }
  }

  return NextResponse.json<ApiResponse>(
    { data: { message: 'Added to cart' }, error: null, success: true },
    { status: 201 }
  );
}

// ─── PUT /api/cart ────────────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    let body: { itemId: string; quantity: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON body', success: false },
        { status: 400 }
      );
    }

    const { itemId, quantity } = body;

    if (!itemId || quantity < 1) {
      return NextResponse.json(
        { data: null, error: 'Invalid itemId or quantity', success: false },
        { status: 400 }
      );
    }

    const { data: cartItem, error: cartItemError } = await supabase
      .from('cart_items')
      .select('id, cart_id, product_id')
      .eq('id', itemId)
      .single();

    if (cartItemError || !cartItem) {
      return NextResponse.json(
        { data: null, error: 'Cart item not found', success: false },
        { status: 404 }
      );
    }

    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('user_id')
      .eq('id', cartItem.cart_id)
      .single();

    if (cartError || !cart || cart.user_id !== user.id) {
      return NextResponse.json(
        { data: null, error: 'Forbidden', success: false },
        { status: 403 }
      );
    }

    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', cartItem.product_id)
      .single();

    if (product && quantity > product.stock_quantity) {
      return NextResponse.json(
        { data: null, error: `Only ${product.stock_quantity} unit(s) available`, success: false },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', itemId);

    if (updateError) {
      return NextResponse.json(
        { data: null, error: updateError.message, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { message: 'Quantity updated' },
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('PUT /api/cart error:', error);
    return NextResponse.json(
      { data: null, error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/cart ─────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('itemId');
  const clearAll = searchParams.get('clearAll') === 'true';

  if (clearAll) {
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (cart) {
      await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    }

    return NextResponse.json<ApiResponse>({
      data: { message: 'Cart cleared' },
      error: null,
      success: true,
    });
  }

  if (!itemId) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'itemId is required', success: false },
      { status: 400 }
    );
  }

  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, cart_id')
    .eq('id', itemId)
    .maybeSingle();

  if (!existingItem) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'Cart item not found', success: false },
      { status: 404 }
    );
  }

  const { data: cart } = await supabase
    .from('carts')
    .select('user_id')
    .eq('id', existingItem.cart_id)
    .single();

  if (cart?.user_id !== user.id) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'Forbidden', success: false },
      { status: 403 }
    );
  }

  await supabase.from('cart_items').delete().eq('id', itemId);

  return NextResponse.json<ApiResponse>({
    data: { message: 'Item removed' },
    error: null,
    success: true,
  });
}