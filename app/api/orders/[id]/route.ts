// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { formatZodError } from '@/lib/validation';
// ✅ FIX 1: removed unused `OrderStatus` import and unused `cookies` import
import type { ApiResponse, Order } from '@/types';

// ✅ Use the enum values directly — this is the "single source of truth"
const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  notes: z.string().optional(),
});

// ─── GET /api/orders/[id] ─────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  // ✅ FIX 2: In Next.js 15, params is now a Promise — must be awaited
  { params }: { params: Promise<{ id: string }> }
) {
  // ✅ FIX 3: createRouteHandlerSupabaseClient takes NO arguments
  const supabase = await createRouteHandlerSupabaseClient();
  const { id } = await params; // ✅ await params

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
    .eq('id', id);

  if (!profile || profile.role !== 'admin') {
    query = query.eq('user_id', session.user.id);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: error.message, success: false },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'Order not found', success: false },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiResponse<Order>>({
    data: data as Order,
    error: null,
    success: true,
  });
}

// ─── PATCH /api/orders/[id] ───────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createRouteHandlerSupabaseClient();
  const { id } = await params;

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

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'Forbidden', success: false },
      { status: 403 }
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

  const validated = updateOrderSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: formatZodError(validated.error),
        success: false,
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('orders')
    .update(validated.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: error.message, success: false },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse<Order>>({
    data: data as Order,
    error: null,
    success: true,
  });
}