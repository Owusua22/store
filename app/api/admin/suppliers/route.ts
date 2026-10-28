// app/api/admin/suppliers/route.ts
import { NextResponse } from 'next/server';
import { formatZodError } from '@/lib/validation';
import { readJson, requireAdmin } from '@/lib/admin/guard';
import { supplierSchema } from '@/lib/admin/schemas';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { data, error } = await guard.db
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const validated = supplierSchema.safeParse(parsed.body);
  if (!validated.success) {
    return NextResponse.json({ success: false, error: formatZodError(validated.error) }, { status: 400 });
  }

  const { data, error } = await guard.db
    .from('suppliers')
    .insert({ ...validated.data, is_active: validated.data.is_active ?? true })
    .select('*')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const id = typeof parsed.body.id === 'string' ? parsed.body.id : null;
  if (!id) return NextResponse.json({ success: false, error: 'Supplier ID required' }, { status: 400 });

  const body = { ...parsed.body };
  delete body.id;

  const validated = supplierSchema.partial().safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ success: false, error: formatZodError(validated.error) }, { status: 400 });
  }

  const { data, error } = await guard.db
    .from('suppliers')
    .update(validated.data)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Supplier ID required' }, { status: 400 });

  // Purchases keep their history; the supplier link is set to null by the FK.
  const { error } = await guard.db.from('suppliers').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: 'Supplier deleted' });
}
