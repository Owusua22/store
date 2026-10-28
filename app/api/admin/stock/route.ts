// app/api/admin/stock/route.ts
import { NextResponse } from 'next/server';
import { formatZodError } from '@/lib/validation';
import { readJson, requireAdmin } from '@/lib/admin/guard';
import { stockAdjustmentSchema } from '@/lib/admin/schemas';

// GET — stock overview (+ recent movements)
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const lowOnly = searchParams.get('low') === '1';

  const query = guard.db
    .from('products')
    .select('id, name, slug, thumbnail, sku, stock_quantity, low_stock_threshold, price, is_active, category:categories(name)')
    .eq('archived', false)
    .order('stock_quantity', { ascending: true })
    .limit(500);

  const { data: products, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const rows = lowOnly
    ? (products ?? []).filter((row) => row.stock_quantity <= (row.low_stock_threshold ?? 10))
    : (products ?? []);

  const { data: movements } = await guard.db
    .from('inventory_movements')
    .select('*, product:products(name)')
    .order('created_at', { ascending: false })
    .limit(25);

  return NextResponse.json({ success: true, data: { products: rows, movements: movements ?? [] } });
}

// POST — adjust stock (add / remove / set) and log the movement
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const validated = stockAdjustmentSchema.safeParse(parsed.body);
  if (!validated.success) {
    return NextResponse.json({ success: false, error: formatZodError(validated.error) }, { status: 400 });
  }

  const { product_id, quantity, mode, reason, note } = validated.data;

  const { data: product, error: readError } = await guard.db
    .from('products')
    .select('id, name, stock_quantity')
    .eq('id', product_id)
    .maybeSingle();

  if (readError) return NextResponse.json({ success: false, error: readError.message }, { status: 500 });
  if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

  const nextStock =
    mode === 'set'
      ? Math.max(0, quantity)
      : Math.max(0, product.stock_quantity + (mode === 'add' ? quantity : -quantity));

  const change = nextStock - product.stock_quantity;

  const { data: updated, error } = await guard.db
    .from('products')
    .update({ stock_quantity: nextStock })
    .eq('id', product_id)
    .select('id, name, stock_quantity')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  await guard.db.from('inventory_movements').insert({
    product_id,
    change,
    reason,
    note: note ?? null,
    created_by: guard.userId,
  });

  return NextResponse.json({
    success: true,
    data: { ...updated, previous: product.stock_quantity, change },
  });
}
