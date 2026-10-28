'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Boxes, Loader2, Plus, Trash2, X } from 'lucide-react';

import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
  Badge,
  DemoNotice,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
} from '@/components/admin/ui';
import { formatCedis } from '@/lib/utils';
import type { PurchaseRow, SupplierBalance } from '@/lib/data/accounting';

export interface PurchaseProduct {
  id: string;
  name: string;
  sku: string | null;
  stock_quantity: number;
  cost_price: number | null;
  price: number;
  thumbnail: string | null;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function PurchasesClient({
  purchases,
  suppliers,
  products,
  demoMode,
}: {
  purchases: PurchaseRow[];
  suppliers: SupplierBalance[];
  products: PurchaseProduct[];
  demoMode: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [productId, setProductId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [quantity, setQuantity] = useState('12');
  const [unitCost, setUnitCost] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo' | 'bank' | 'credit'>('cash');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [purchasedAt, setPurchasedAt] = useState(today());
  const [addToStock, setAddToStock] = useState(true);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [productId, products]
  );

  const total = (Number(quantity) || 0) * (Number(unitCost) || 0);

  const stats = useMemo(() => {
    const spend = purchases.reduce((sum, row) => sum + Number(row.total_cost ?? 0), 0);
    const unpaid = purchases.reduce(
      (sum, row) => sum + Math.max(0, Number(row.total_cost ?? 0) - Number(row.amount_paid ?? 0)),
      0
    );
    const units = purchases.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
    return { spend, unpaid, units };
  }, [purchases]);

  const reset = () => {
    setProductId('');
    setSupplierId('');
    setQuantity('12');
    setUnitCost('');
    setAmountPaid('');
    setPaymentMethod('cash');
    setReference('');
    setNote('');
    setPurchasedAt(today());
    setAddToStock(true);
  };

  const openForm = () => {
    reset();
    setShowForm(true);
  };

  const pickProduct = (id: string) => {
    setProductId(id);
    const product = products.find((row) => row.id === id);
    if (product?.cost_price) setUnitCost(String(product.cost_price));
  };

  const submit = async () => {
    if (demoMode) {
      toast.info('Demo mode — connect Supabase to record real purchases.');
      return;
    }
    if (!productId) {
      toast.error('Choose the product you bought');
      return;
    }
    if (!(Number(quantity) > 0)) {
      toast.error('Quantity must be at least 1');
      return;
    }
    if (unitCost === '' || Number(unitCost) < 0) {
      toast.error('Enter what you paid per unit');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/admin/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          supplier_id: supplierId || null,
          quantity: Number(quantity),
          unit_cost: Number(unitCost),
          amount_paid: amountPaid === '' ? total : Number(amountPaid),
          payment_method: paymentMethod,
          reference: reference || null,
          note: note || null,
          purchased_at: purchasedAt,
          add_to_stock: addToStock,
        }),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Could not record the purchase');
      }

      toast.success(
        addToStock ? 'Purchase recorded and stock increased' : 'Purchase recorded'
      );
      reset();
      setShowForm(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not record the purchase');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this purchase? The stock it added will be taken back out.')) return;
    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/purchases?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Could not delete the purchase');
      }
      toast.success('Purchase deleted');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete the purchase');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Stock purchases"
        description="Every restock you buy. This is what keeps cost prices and your books correct."
        action={
          <AdminButton onClick={showForm ? () => setShowForm(false) : openForm}>
            {showForm ? (
              <>
                <X className="h-4 w-4" /> Close
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Record purchase
              </>
            )}
          </AdminButton>
        }
      />

      {demoMode ? (
        <DemoNotice>Purchases are example data until you connect Supabase.</DemoNotice>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <AdminCard>
          <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-gray-500">
            Total spent
          </p>
          <p className="mt-2 text-[22px] font-black text-gray-900">{formatCedis(stats.spend)}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-gray-500">
            Still owed
          </p>
          <p className="mt-2 text-[22px] font-black text-red-600">{formatCedis(stats.unpaid)}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-gray-500">
            Units bought
          </p>
          <p className="mt-2 text-[22px] font-black text-gray-900">{stats.units}</p>
        </AdminCard>
      </div>

      {showForm ? (
        <AdminCard className="mb-6">
          <h2 className="mb-4 text-[15px] font-bold text-gray-900">New purchase</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Product" hint={selectedProduct ? `On hand: ${selectedProduct.stock_quantity}` : undefined}>
              <Select value={productId} onChange={(event) => pickProduct(event.target.value)}>
                <option value="">Choose a product…</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.sku ? ` · ${product.sku}` : ''}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Supplier">
              <Select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
                <option value="">No supplier / walk-in</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Quantity bought">
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </Field>

            <Field label="Cost per unit (GH₵)" hint="What one unit cost you, not the selling price.">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={unitCost}
                onChange={(event) => setUnitCost(event.target.value)}
                placeholder="0.00"
              />
            </Field>

            <Field label="Date bought">
              <Input type="date" value={purchasedAt} onChange={(event) => setPurchasedAt(event.target.value)} />
            </Field>

            <Field label="Paid with">
              <Select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as 'cash' | 'momo' | 'bank' | 'credit')
                }
              >
                <option value="cash">Cash</option>
                <option value="momo">Mobile money</option>
                <option value="bank">Bank transfer</option>
                <option value="credit">On credit (owe supplier)</option>
              </Select>
            </Field>

            <Field label="Amount paid now (GH₵)" hint={`Total cost: ${formatCedis(total)} — leave blank if fully paid.`}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={amountPaid}
                onChange={(event) => setAmountPaid(event.target.value)}
                placeholder={String(total)}
              />
            </Field>

            <Field label="Receipt / reference">
              <Input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Invoice number, MoMo ID…"
              />
            </Field>

            <Field label="Note" className="md:col-span-2">
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Anything worth remembering about this batch."
              />
            </Field>
          </div>

          <label className="mt-4 flex items-start gap-3 rounded-lg bg-gray-50 p-3 text-[12.5px] text-gray-600">
            <input
              type="checkbox"
              checked={addToStock}
              onChange={(event) => setAddToStock(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-red-600"
            />
            <span>
              Add these units to stock and recalculate the cost price.
              <span className="mt-0.5 block text-[11.5px] text-gray-400">
                Cost price becomes the average of old stock and this batch, so profit stays accurate.
              </span>
            </span>
          </label>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold text-gray-700">
              This purchase: <span className="font-black text-gray-900">{formatCedis(total)}</span>
            </p>
            <div className="flex gap-2">
              <AdminButton variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </AdminButton>
              <AdminButton onClick={submit} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Boxes className="h-4 w-4" />}
                Save purchase
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      ) : null}

      <AdminCard padded={false}>
        {purchases.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No purchases recorded"
              hint="Start with the stock you already have in the shop. Each purchase updates cost prices automatically."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-[0.06em] text-gray-500">
                  <th className="px-5 py-3 font-bold">Date</th>
                  <th className="px-3 py-3 font-bold">Product</th>
                  <th className="px-3 py-3 font-bold">Supplier</th>
                  <th className="px-3 py-3 text-right font-bold">Qty</th>
                  <th className="px-3 py-3 text-right font-bold">Unit cost</th>
                  <th className="px-3 py-3 text-right font-bold">Total</th>
                  <th className="px-3 py-3 font-bold">Paid</th>
                  <th className="px-5 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => {
                  const owed = Number(purchase.total_cost ?? 0) - Number(purchase.amount_paid ?? 0);
                  return (
                    <tr key={purchase.id} className="border-b border-gray-50 last:border-0">
                      <td className="whitespace-nowrap px-5 py-3 text-gray-600">{purchase.purchased_at}</td>
                      <td className="px-3 py-3 font-semibold text-gray-800">
                        {purchase.product?.name ?? 'Product removed'}
                      </td>
                      <td className="px-3 py-3 text-gray-600">{purchase.supplier?.name ?? '—'}</td>
                      <td className="px-3 py-3 text-right">{purchase.quantity}</td>
                      <td className="px-3 py-3 text-right">{formatCedis(Number(purchase.unit_cost))}</td>
                      <td className="px-3 py-3 text-right font-bold text-gray-900">
                        {formatCedis(Number(purchase.total_cost))}
                      </td>
                      <td className="px-3 py-3">
                        {owed > 0.01 ? (
                          <Badge tone="red">Owe {formatCedis(owed)}</Badge>
                        ) : (
                          <Badge tone="green">Fully paid</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => remove(purchase.id)}
                          disabled={deleting === purchase.id || demoMode}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                          title={demoMode ? 'Not available in demo mode' : 'Delete purchase'}
                        >
                          {deleting === purchase.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
