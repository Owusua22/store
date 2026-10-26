// app/api/admin/products/archive/route.ts
// Toggle a product between archived (hidden) and live.
import { NextResponse } from 'next/server';
import { requireAdmin, readJson } from '@/lib/admin/guard';

export async function PUT(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const id = typeof parsed.body.id === 'string' ? parsed.body.id : null;
  const archive = Boolean(parsed.body.archive);

  if (!id) {
    return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
  }

  const { error } = await guard.db
    .from('products')
    .update(archive ? { archived: true, is_active: false } : { archived: false, is_active: true })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: archive ? 'Product archived' : 'Product restored',
  });
}
