// app/api/admin/skin-types/route.ts
import { NextResponse } from 'next/server';
import { formatZodError } from '@/lib/validation';
import { readJson, requireAdmin, slugify, uniqueSlug } from '@/lib/admin/guard';
import { skinTypeSchema } from '@/lib/admin/schemas';

// GET — every skin type with the number of products using it
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { data, error } = await guard.db
    .from('skin_types')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const { data: products } = await guard.db
    .from('products')
    .select('skin_types')
    .eq('archived', false);

  const counts: Record<string, number> = {};
  for (const product of products ?? []) {
    for (const slug of (product.skin_types as string[]) ?? []) {
      counts[slug] = (counts[slug] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    success: true,
    data: (data ?? []).map((row) => ({ ...row, product_count: counts[row.slug] ?? 0 })),
  });
}

// POST — create
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const validated = skinTypeSchema.safeParse(parsed.body);
  if (!validated.success) {
    return NextResponse.json({ success: false, error: formatZodError(validated.error) }, { status: 400 });
  }

  const input = validated.data;
  const slug = await uniqueSlug(
    guard.db,
    'skin_types',
    input.slug ? slugify(input.slug) : slugify(input.label)
  );

  const { data, error } = await guard.db
    .from('skin_types')
    .insert({
      slug,
      label: input.label,
      emoji: input.emoji ?? '✨',
      description: input.description ?? null,
      sort_order: input.sort_order ?? 99,
      is_active: input.is_active ?? true,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data }, { status: 201 });
}

// PATCH — update / toggle
export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const id = typeof parsed.body.id === 'string' ? parsed.body.id : null;
  if (!id) return NextResponse.json({ success: false, error: 'Skin type ID required' }, { status: 400 });

  const { id: _id, ...body } = parsed.body;
  const validated = skinTypeSchema.partial().safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ success: false, error: formatZodError(validated.error) }, { status: 400 });
  }

  const update: Record<string, unknown> = { ...validated.data };
  if (validated.data.slug) update.slug = slugify(validated.data.slug);
  if (validated.data.label && !validated.data.slug) {
    // keep slug stable on rename unless the admin explicitly changed it
    delete update.slug;
  }

  const { data, error } = await guard.db
    .from('skin_types')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE — removes the type and un-tags it from products
export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Skin type ID required' }, { status: 400 });

  const { data: row } = await guard.db
    .from('skin_types')
    .select('slug')
    .eq('id', id)
    .maybeSingle();

  if (row?.slug) {
    const { data: products } = await guard.db
      .from('products')
      .select('id, skin_types')
      .contains('skin_types', [row.slug]);

    for (const product of products ?? []) {
      const next = ((product.skin_types as string[]) ?? []).filter((slug) => slug !== row.slug);
      await guard.db.from('products').update({ skin_types: next }).eq('id', product.id);
    }
  }

  const { error } = await guard.db.from('skin_types').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: 'Skin type deleted' });
}
