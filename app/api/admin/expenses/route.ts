// app/api/admin/expenses/route.ts
import { NextResponse } from 'next/server';
import { formatZodError } from '@/lib/validation';
import { readJson, requireAdmin } from '@/lib/admin/guard';
import { expenseSchema } from '@/lib/admin/schemas';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { data, error } = await guard.db
    .from('expenses')
    .select('*')
    .order('spent_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const validated = expenseSchema.safeParse(parsed.body);
  if (!validated.success) {
    return NextResponse.json({ success: false, error: formatZodError(validated.error) }, { status: 400 });
  }

  const input = validated.data;
  const { data, error } = await guard.db
    .from('expenses')
    .insert({
      ...input,
      spent_at: input.spent_at || new Date().toISOString().slice(0, 10),
      created_by: guard.userId,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Expense ID required' }, { status: 400 });

  const { error } = await guard.db.from('expenses').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: 'Expense deleted' });
}
