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

// All 16 regions in Ghana (manual selection; towns can be added later)
const GHANA_REGIONS = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
] as const;

// Schema for updating a shipping discount code (all fields optional so partial updates are allowed)
const updateCodeSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(20)
    .transform((v) => v.toUpperCase().replace(/\s/g, ''))
    .optional(),
  description: z.string().optional().nullable(),
  discount_type: z.enum(['free_shipping', 'fixed_amount', 'percentage']).optional(),
  discount_value: z.number().nonnegative().optional(),
  min_order_amount: z.number().nonnegative().optional(),
  max_uses: z.number().int().positive().nullable().optional(),
  starts_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  // Allow updating regions (must be a subset/selection of Ghana regions)
  regions: z.array(z.enum(GHANA_REGIONS)).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Params
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing code id' }, { status: 400 });
    }

    // Body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    // Validate (partial update)
    const validated = updateCodeSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(validated.error) },
        { status: 400 }
      );
    }

    // Build update payload (never allow updating protected fields)
    const updatePayload: Record<string, unknown> = {
      ...validated.data,
      updated_at: new Date().toISOString(),
    };
    // Remove undefined keys so we don’t overwrite with undefined
    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key] === undefined) delete updatePayload[key];
    });

    // Update in DB
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('shipping_discount_codes')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Params
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing code id' }, { status: 400 });
    }

    // Delete in DB
    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from('shipping_discount_codes')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, data: { message: 'Code deleted' } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Server error',
      },
      { status: 500 }
    );
  }
}
