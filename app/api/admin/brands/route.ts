// app/api/admin/brands/route.ts
import { NextResponse } from 'next/server';
import { formatZodError } from '@/lib/validation';
import { readJson, requireAdmin, slugify, uniqueSlug } from '@/lib/admin/guard';
import { brandSchema } from '@/lib/admin/schemas';

// GET — every brand with how many products use it
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { data, error } = await guard.db
    .from('brands')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const { data: products } = await guard.db
    .from('products')
    .select('id, brand, brand_id')
    .eq('archived', false);

  const counts: Record<string, number> = {};
  for (const product of products ?? []) {
    const key =
      (product.brand_id as string | null) ??
      (product.brand ? `name:${String(product.brand).toLowerCase()}` : null);
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  }

  return NextResponse.json({
    success: true,
    data: (data ?? []).map((row) => {
      const brand = row as { id: string; name: string; slug: string };
      return {
        ...row,
        product_count:
          (counts[brand.id] ?? 0) + (counts[`name:${brand.name.toLowerCase()}`] ?? 0),
      };
    }),
  });
}

// POST — create
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const validated = brandSchema.safeParse(parsed.body);
  if (!validated.success) {
    return NextResponse.json({ success: false, error: formatZodError(validated.error) }, { status: 400 });
  }

  const input = validated.data;
  const slug = await uniqueSlug(
    guard.db,
    'brands',
    input.slug ? slugify(input.slug) : slugify(input.name)
  );

  const { data, error } = await guard.db
    .from('brands')
    .insert({
      slug,
      name: input.name,
      description: input.description ?? null,
      logo_url: input.logo_url ?? null,
      website_url: input.website_url ?? null,
      country: input.country ?? null,
      sort_order: input.sort_order ?? 99,
      is_active: input.is_active ?? true,
    })
    .select('*')
    .single();

  if (error) {
    const message = error.code === '23505' ? 'A brand with that name already exists' : error.message;
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data }, { status: 201 });
}

// PATCH — update / toggle
export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const id = typeof parsed.body.id === 'string' ? parsed.body.id : null;
  if (!id) return NextResponse.json({ success: false, error: 'Brand ID required' }, { status: 400 });

  const body = { ...parsed.body };
  delete body.id;
  const validated = brandSchema.partial().safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ success: false, error: formatZodError(validated.error) }, { status: 400 });
  }

  const update: Record<string, unknown> = { ...validated.data };
  if (validated.data.slug) update.slug = slugify(validated.data.slug);
  if (validated.data.name && !validated.data.slug) {
    // keep the slug stable on rename unless the admin explicitly changed it
    delete update.slug;
  }

  const { data, error } = await guard.db
    .from('brands')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Keep the denormalised products.brand text in sync with the brand name.
  if (validated.data.name) {
    await guard.db.from('products').update({ brand: validated.data.name }).eq('brand_id', id);
  }

  return NextResponse.json({ success: true, data });
}

// DELETE — removes the brand and un-tags its products
export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Brand ID required' }, { status: 400 });

  // Products keep their brand text but lose the FK, so nothing is deleted with it.
  await guard.db.from('products').update({ brand_id: null }).eq('brand_id', id);

  const { error } = await guard.db.from('brands').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: 'Brand deleted' });
}
