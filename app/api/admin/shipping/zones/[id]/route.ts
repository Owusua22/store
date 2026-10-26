import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { formatZodError } from '@/lib/validation';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const zoneUpdateSchema = z.object({
  country: z.string().trim().optional(),
  region: z.string().trim().min(1, 'Region is required').optional(),
  town: z.string().trim().min(1, 'Town is required').optional(),
  shipping_fee: z.number().nonnegative().optional(),
  estimated_days_min: z.number().int().positive().optional(),
  estimated_days_max: z.number().int().positive().optional(),
  free_over_amount: z.number().nonnegative().nullable().optional(),
  free_shipping_threshold: z.number().nonnegative().nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();
    
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const validated = zoneUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: formatZodError(validated.error) }, { status: 400 });
    }

    // Only persist real columns; default the country to Ghana
    const { free_shipping_threshold, ...fields } = validated.data;
    const payload = {
      ...fields,
      country: validated.data.country || 'Ghana',
      free_over_amount: validated.data.free_over_amount ?? free_shipping_threshold ?? null,
      updated_at: new Date().toISOString(),
    };

    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from('shipping_zones')
      .update(payload)
      .eq('id', id);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: { message: 'Zone updated' } });
  } catch (error) {
    console.error('Zone update error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const adminClient = getAdminClient();
    const { error } = await adminClient.from('shipping_zones').delete().eq('id', id);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: { message: 'Zone deleted' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}
