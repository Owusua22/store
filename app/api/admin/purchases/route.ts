// app/api/admin/purchases/route.ts
// Recording a stock purchase is the single action that keeps stock, cost price
// and the books in sync: it raises on-hand stock, updates the product's
// moving-average cost price, and writes an inventory movement for the audit trail.

import { NextResponse } from 'next/server';
import { formatZodError } from '@/lib/validation';
import { readJson, requireAdmin, logInventoryChange } from '@/lib/admin/guard';
import { purchaseSchema } from '@/lib/admin/schemas';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { data, error } = await guard.db
    .from('stock_purchases')
    .select('*, product:products(name), supplier:suppliers(name)')
    .order('purchased_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const validated = purchaseSchema.safeParse(parsed.body);
  if (!validated.success) {
    return NextResponse.json({ success: false, error: formatZodError(validated.error) }, { status: 400 });
  }

  const input = validated.data;

  const { data: product, error: productError } = await guard.db
    .from('products')
    .select('id, name, stock_quantity, cost_price')
    .eq('id', input.product_id)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ success: false, error: productError.message }, { status: 500 });
  }
  if (!product) {
    return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
  }

  const stockBefore = Number(product.stock_quantity ?? 0);
  const oldCost = Number(product.cost_price ?? 0);
  const addToStock = input.add_to_stock !== false;
  const amountPaid = input.amount_paid ?? input.quantity * input.unit_cost;

  if (amountPaid > input.quantity * input.unit_cost + 0.01) {
    return NextResponse.json(
      { success: false, error: 'Amount paid cannot be more than the total cost' },
      { status: 400 }
    );
  }

  const { data: purchase, error } = await guard.db
    .from('stock_purchases')
    .insert({
      supplier_id: input.supplier_id ?? null,
      product_id: input.product_id,
      quantity: input.quantity,
      unit_cost: input.unit_cost,
      amount_paid: amountPaid,
      payment_method: input.payment_method,
      reference: input.reference ?? null,
      note: input.note ?? null,
      purchased_at: input.purchased_at || new Date().toISOString().slice(0, 10),
      created_by: guard.userId,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  if (addToStock) {
    const newStock = stockBefore + input.quantity;

    // Moving-average cost: existing stock at the old cost + the new units at
    // this cost, divided by the new total.
    const weighted =
      (stockBefore * oldCost + input.quantity * input.unit_cost) /
      Math.max(stockBefore + input.quantity, 1);

    const { error: updateError } = await guard.db
      .from('products')
      .update({
        stock_quantity: newStock,
        cost_price: Number(weighted.toFixed(2)),
      })
      .eq('id', input.product_id);

    if (updateError) {
      // Roll the purchase row back so the books never claim stock we did not add.
      await guard.db.from('stock_purchases').delete().eq('id', purchase.id);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    await logInventoryChange(
      guard.db,
      input.product_id,
      input.quantity,
      'stock-purchase',
      `Bought ${input.quantity} @ GH₵${input.unit_cost.toFixed(2)}${
        input.reference ? ` (${input.reference})` : ''
      }`,
      guard.userId
    );
  }

  return NextResponse.json(
    { success: true, data: purchase, cost_price: Number(product.cost_price ?? 0) },
    { status: 201 }
  );
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Purchase ID required' }, { status: 400 });

  // Reverse the stock that the purchase added, then remove the record.
  const { data: purchase } = await guard.db
    .from('stock_purchases')
    .select('id, product_id, quantity')
    .eq('id', id)
    .maybeSingle();

  if (!purchase) {
    return NextResponse.json({ success: false, error: 'Purchase not found' }, { status: 404 });
  }

  const { data: product } = await guard.db
    .from('products')
    .select('stock_quantity')
    .eq('id', purchase.product_id)
    .maybeSingle();

  if (product) {
    const newStock = Math.max(0, Number(product.stock_quantity ?? 0) - Number(purchase.quantity));
    await guard.db.from('products').update({ stock_quantity: newStock }).eq('id', purchase.product_id);
    await logInventoryChange(
      guard.db,
      purchase.product_id,
      -Number(purchase.quantity),
      'purchase-deleted',
      'Stock purchase record deleted',
      guard.userId
    );
  }

  const { error } = await guard.db.from('stock_purchases').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: 'Purchase deleted and stock reversed' });
}
