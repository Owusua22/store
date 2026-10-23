// app/api/admin/showrooms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { z } from 'zod';
import { formatZodError } from '@/lib/validation';

const showroomSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  type: z.enum(['manual', 'auto_new', 'auto_deals', 'auto_bestselling']).default('manual'),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  show_on_homepage: z.boolean().default(true),
  max_products: z.number().int().min(1).max(50).default(12),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') +
    '-' +
    Math.random().toString(36).substring(2, 7);
}

// POST - Create Showroom
export async function POST(request: NextRequest) {
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const validated = showroomSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(validated.error) },
        { status: 400 }
      );
    }

    const slug = generateSlug(validated.data.name);

    const { data: showroom, error } = await supabase
      .from('showrooms')
      .insert({ ...validated.data, slug, archived: false })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: showroom }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}

// GET - List Showrooms
export async function GET() {
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

    const { data: showrooms, error } = await supabase
      .from('showrooms')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: showrooms });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}