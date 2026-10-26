// app/api/admin/products/route.ts
import { NextResponse } from 'next/server';
import { formatZodError } from '@/lib/validation';
import { productSchema, type ProductInput } from '@/lib/admin/schemas';
import {
  readJson,
  requireAdmin,
  slugify,
  uniqueSlug,
} from '@/lib/admin/guard';


function derivedFromVariants(input: ProductInput) {
  const variants = input.variants ?? [];
  if (variants.length === 0) return null;

  const sizes = [...new Set(variants.map((variant) => variant.size))];
  const colors = [...new Set(variants.map((variant) => variant.color))];
  const prices = variants.map((variant) => variant.price).filter((price) => price > 0);
  const comparePrices = variants
    .map((variant) => variant.compare_at_price)
    .filter((price): price is number => typeof price === 'number' && price > 0);

  return {
    sizes,
    colors,
    stock_quantity: variants.reduce((sum, variant) => sum + variant.stock_quantity, 0),
    price: prices.length > 0 ? Math.min(...prices) : input.price,
    compare_at_price: comparePrices.length > 0 ? Math.min(...comparePrices) : input.compare_at_price ?? null,
  };
}

function cleanPayload(input: Partial<ProductInput>) {
  const { variants: _variants, slug: _slug, ...rest } = input;

  if (rest.images && rest.images.length > 0 && !rest.thumbnail) {
    rest.thumbnail = rest.images[0];
  }

  return rest;
}

// --- GET: list products (admin view, includes archived) ---------------------
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q')?.trim();
  const status = searchParams.get('status'); // active | inactive | archived
  const skinType = searchParams.get('skin');

  let query = guard.db
    .from('products')
    .select('*, category:categories(id, name, slug)')
    .order('created_at', { ascending: false })
    .limit(500);

  if (search) {
    query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,sku.ilike.%${search}%`);
  }
  if (status === 'active') query = query.eq('is_active', true).eq('archived', false);
  if (status === 'inactive') query = query.eq('is_active', false).eq('archived', false);
  if (status === 'archived') query = query.eq('archived', true);
  if (skinType) query = query.contains('skin_types', [skinType]);

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data });
}

// --- POST: create ----------------------------------------------------------
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const validated = productSchema.safeParse(parsed.body);
  if (!validated.success) {
    return NextResponse.json(
      { success: false, error: formatZodError(validated.error), issues: validated.error.issues },
      { status: 400 }
    );
  }

  const input = validated.data;
  const derived = derivedFromVariants(input);
  const payload = { ...cleanPayload(input), ...(derived ?? {}) };

  const slug = await uniqueSlug(
    guard.db,
    'products',
    input.slug ? slugify(input.slug) : slugify(input.name)
  );

  const { data: product, error } = await guard.db
    .from('products')
    .insert({ ...payload, slug })
    .select('*')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  if (input.variants.length > 0) {
    const { error: variantError } = await guard.db.from('product_variants').insert(
      input.variants.map((variant) => ({
        product_id: product.id,
        size: variant.size,
        color: variant.color,
        price: variant.price,
        compare_at_price: variant.compare_at_price ?? null,
        stock_quantity: variant.stock_quantity,
        sku: variant.sku ?? null,
        is_active: variant.is_active ?? true,
      }))
    );

    if (variantError) {
      console.error('product variants insert failed', variantError);
    }
  }

  if (input.stock_quantity > 0) {
    await guard.db.from('inventory_movements').insert({
      product_id: product.id,
      change: input.stock_quantity,
      reason: 'initial-stock',
      note: 'Product created',
      created_by: guard.userId,
    });
  }

  return NextResponse.json({ success: true, data: product }, { status: 201 });
}

// --- PATCH: update ---------------------------------------------------------
export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const id = typeof parsed.body.id === 'string' ? parsed.body.id : null;
  if (!id) {
    return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
  }

  const { id: _ignored, ...body } = parsed.body;
  const validated = productSchema.partial().safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { success: false, error: formatZodError(validated.error), issues: validated.error.issues },
      { status: 400 }
    );
  }

  const input = validated.data;

  // Current stock lets us log the delta for the audit trail
  const { data: existing } = await guard.db
    .from('products')
    .select('stock_quantity')
    .eq('id', id)
    .maybeSingle();

  const derived = input.variants ? derivedFromVariants(input as ProductInput) : null;

  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(cleanPayload(input))) {
    if (value !== undefined) update[key] = value;
  }
  if (derived) Object.assign(update, derived);
  if (input.slug) update.slug = slugify(input.slug);

  const { data: product, error } = await guard.db
    .from('products')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  if (input.variants) {
    await guard.db.from('product_variants').delete().eq('product_id', id);
    if (input.variants.length > 0) {
      await guard.db.from('product_variants').insert(
        input.variants.map((variant) => ({
          product_id: id,
          size: variant.size,
          color: variant.color,
          price: variant.price,
          compare_at_price: variant.compare_at_price ?? null,
          stock_quantity: variant.stock_quantity,
          sku: variant.sku ?? null,
          is_active: variant.is_active ?? true,
        }))
      );
    }
  }

  if (
    typeof input.stock_quantity === 'number' &&
    existing &&
    existing.stock_quantity !== input.stock_quantity
  ) {
    await guard.db.from('inventory_movements').insert({
      product_id: id,
      change: input.stock_quantity - existing.stock_quantity,
      reason: 'product-edit',
      note: 'Stock updated from product form',
      created_by: guard.userId,
    });
  }

  return NextResponse.json({ success: true, data: product });
}

// --- DELETE: archive by default, hard delete with ?hard=1 ------------------
export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
  }

  if (searchParams.get('hard') === '1') {
    const { error } = await guard.db.from('products').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: 'Product deleted' });
  }

  const { error } = await guard.db
    .from('products')
    .update({ archived: true, is_active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: 'Product archived' });
}
