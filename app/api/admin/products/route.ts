// app/api/admin/products/route.ts
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

const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  price: z.number().positive(),
  compare_at_price: z.number().positive().nullable().optional(),
  stock_quantity: z.number().int().nonnegative().default(0),
  sku: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  compare_at_price: z.number().positive().nullable().optional(),
  stock_quantity: z.number().int().nonnegative('Stock must be non-negative'),
  category: z.string().optional(),
  category_id: z.string().uuid().nullable().optional(),
  thumbnail: z.string().url().optional().or(z.literal('')),
  images: z.array(z.string().url()).optional().default([]),
  sizes: z.array(z.string()).optional().default([]),
  colors: z.array(z.string()).optional().default([]),
  is_active: z.boolean().default(true),
  variants: z.array(variantSchema).optional().default([]),
});

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// GET
export async function GET() {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const adminClient = getAdminClient();
    const { data: products, error } = await adminClient
      .from('products')
      .select('*, variants:product_variants(*)')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}

// POST
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const validated = productSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: formatZodError(validated.error) }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const { variants, ...productData } = validated.data;

    // Auto-calculate from variants if they exist
    if (variants.length > 0) {
      productData.sizes = [...new Set(variants.map((v) => v.size))];
      productData.colors = [...new Set(variants.map((v) => v.color))];
      productData.stock_quantity = variants.reduce((sum, v) => sum + v.stock_quantity, 0);
      productData.price = Math.min(...variants.map((v) => v.price));
      const comparePrices = variants.filter((v) => v.compare_at_price).map((v) => v.compare_at_price!);
      if (comparePrices.length > 0) {
        productData.compare_at_price = Math.min(...comparePrices);
      }
    }

    let slug = generateSlug(productData.name);
    const { data: existing } = await adminClient.from('products').select('slug').eq('slug', slug).maybeSingle();
    if (existing) slug = `${slug}-${Date.now()}`;

    const { data: product, error } = await adminClient
      .from('products')
      .insert({ ...productData, slug })
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    // Save variants
    if (variants.length > 0) {
      const { error: variantsError } = await adminClient
        .from('product_variants')
        .insert(variants.map((v) => ({ ...v, product_id: product.id })));

      if (variantsError) {
        console.error('Variants error:', variantsError);
      }
    }

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}

// PATCH
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const { id, variants, ...updateData } = body as { id: string; variants?: Array<{ size: string; color: string; price: number; compare_at_price?: number | null; stock_quantity: number; sku?: string }>; [key: string]: unknown };
    if (!id) return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });

    const adminClient = getAdminClient();

    // Auto-calculate from variants
    if (variants && variants.length > 0) {
      updateData.sizes = [...new Set(variants.map((v) => v.size))];
      updateData.colors = [...new Set(variants.map((v) => v.color))];
      updateData.stock_quantity = variants.reduce((sum, v) => sum + v.stock_quantity, 0);
      updateData.price = Math.min(...variants.map((v) => v.price));
    }

    const { error } = await adminClient.from('products').update(updateData).eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    // Replace variants
    if (variants) {
      await adminClient.from('product_variants').delete().eq('product_id', id);
      if (variants.length > 0) {
        await adminClient.from('product_variants').insert(variants.map((v) => ({ ...v, product_id: id })));
      }
    }

    return NextResponse.json({ success: true, data: { message: 'Product updated' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}

// DELETE - keep as is
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });

    const adminClient = getAdminClient();
    const { error } = await adminClient.from('products').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}