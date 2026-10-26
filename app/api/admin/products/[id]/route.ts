// app/api/admin/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { formatZodError } from '@/lib/validation';
import { readJson, requireAdmin, slugify } from '@/lib/admin/guard';
import { productSchema } from '@/lib/admin/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET — single product with its variants
export async function GET(_request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const { data: product, error } = await guard.db
    .from('products')
    .select('*, category:categories(id, name, slug)')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

  const { data: variants } = await guard.db
    .from('product_variants')
    .select('*')
    .eq('product_id', id)
    .order('size', { ascending: true })
    .order('color', { ascending: true });

  return NextResponse.json({
    success: true,
    data: { ...product, variants: variants ?? [] },
  });
}

// PUT — full update (also accepts PATCH-style partial bodies)
export async function PUT(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const validated = productSchema.partial().safeParse(parsed.body);
  if (!validated.success) {
    return NextResponse.json(
      { success: false, error: formatZodError(validated.error), issues: validated.error.issues },
      { status: 400 }
    );
  }

  const input = validated.data;

  const { data: existing } = await guard.db
    .from('products')
    .select('stock_quantity, slug')
    .eq('id', id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

  const {
    variants,
    slug,
    images,
    thumbnail,
    name,
    price,
    compare_at_price,
    stock_quantity,
    sizes,
    colors,
    brand,
    description,
    short_description,
    skin_types,
    concerns,
    ingredients,
    how_to_use,
    benefits,
    category_id,
    sku,
    low_stock_threshold,
    weight_grams,
    rating,
    reviews_count,
    sold_count,
    is_featured,
    is_active,
    seo_title,
    seo_description,
  } = input;

  const update: Record<string, unknown> = {};
  const assign = (key: string, value: unknown) => {
    if (value !== undefined) update[key] = value;
  };

  assign('name', name);
  assign('description', description);
  assign('short_description', short_description);
  assign('price', price);
  assign('compare_at_price', compare_at_price);
  assign('category_id', category_id);
  assign('brand', brand);
  assign('skin_types', skin_types);
  assign('concerns', concerns);
  assign('ingredients', ingredients);
  assign('how_to_use', how_to_use);
  assign('benefits', benefits);
  assign('sizes', sizes);
  assign('colors', colors);
  assign('sku', sku);
  assign('low_stock_threshold', low_stock_threshold);
  assign('weight_grams', weight_grams);
  assign('rating', rating);
  assign('reviews_count', reviews_count);
  assign('sold_count', sold_count);
  assign('is_featured', is_featured);
  assign('is_active', is_active);
  assign('seo_title', seo_title);
  assign('seo_description', seo_description);

  if (images !== undefined) {
    update.images = images;
    update.thumbnail = thumbnail || images[0] || null;
  } else if (thumbnail !== undefined) {
    update.thumbnail = thumbnail;
  }

  if (slug) update.slug = slugify(slug);

  // Variants win over manual aggregate fields when present
  if (variants) {
    if (variants.length > 0) {
      update.sizes = [...new Set(variants.map((variant) => variant.size))];
      update.colors = [...new Set(variants.map((variant) => variant.color))];
      update.stock_quantity = variants.reduce((sum, variant) => sum + variant.stock_quantity, 0);
      const prices = variants.map((variant) => variant.price).filter((value) => value > 0);
      if (prices.length > 0) update.price = Math.min(...prices);
    }
  } else {
    assign('stock_quantity', stock_quantity);
  }

  const { data: product, error } = await guard.db
    .from('products')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  if (variants) {
    await guard.db.from('product_variants').delete().eq('product_id', id);
    if (variants.length > 0) {
      const { error: variantError } = await guard.db.from('product_variants').insert(
        variants.map((variant) => ({
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

      if (variantError) {
        return NextResponse.json(
          { success: false, error: `Product saved but variants failed: ${variantError.message}` },
          { status: 500 }
        );
      }
    }
  }

  if (
    typeof update.stock_quantity === 'number' &&
    update.stock_quantity !== existing.stock_quantity
  ) {
    await guard.db.from('inventory_movements').insert({
      product_id: id,
      change: update.stock_quantity - existing.stock_quantity,
      reason: 'product-edit',
      note: 'Stock updated from product form',
      created_by: guard.userId,
    });
  }

  return NextResponse.json({ success: true, data: product });
}

export async function PATCH(request: Request, context: RouteContext) {
  return PUT(request, context);
}

// DELETE — archive unless ?hard=1
export async function DELETE(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const { searchParams } = new URL(request.url);

  if (searchParams.get('hard') === '1') {
    const { error } = await guard.db.from('products').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: { message: 'Product deleted' } });
  }

  const { error } = await guard.db
    .from('products')
    .update({ archived: true, is_active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: { message: 'Product archived' } });
}
