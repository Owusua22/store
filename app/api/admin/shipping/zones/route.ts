import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { formatZodError } from '@/lib/validation';

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

const zoneSchema = z
  .object({
    name: z.string().trim().optional(),
    country: z.string().trim().default('Ghana'),
    region: z.string().trim().min(1, 'Region is required'),
    town: z.string().trim().min(1, 'Town is required'),
    postal_code_prefix: z.string().optional(),
    shipping_fee: z.number().nonnegative(),
    estimated_days_min: z.number().int().positive(),
    estimated_days_max: z.number().int().positive(),
    free_over_amount: z.number().nonnegative().nullable().optional(),
    free_shipping_threshold: z.number().nonnegative().nullable().optional(),
    is_active: z.boolean().default(true),
    sort_order: z.number().int().default(0),
  })
  .refine((value) => value.estimated_days_max >= value.estimated_days_min, {
    message: 'Maximum delivery days must be greater than or equal to the minimum',
    path: ['estimated_days_max'],
  });

export async function GET() {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('shipping_zones')
      .select('*')
      .order('sort_order')
      .order('region')
      .order('town');

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }

    const validated = zoneSchema.safeParse(body);
    if (!validated.success) return NextResponse.json({ success: false, error: formatZodError(validated.error) }, { status: 400 });

    // Only persist columns that exist on public.shipping_zones
    const { free_shipping_threshold, ...zoneFields } = validated.data;
    const zoneData = {
      ...zoneFields,
      country: validated.data.country || 'Ghana',
      free_over_amount: validated.data.free_over_amount ?? free_shipping_threshold ?? null,
    };

    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('shipping_zones')
      .insert(zoneData)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}