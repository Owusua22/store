'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { AlertTriangle, Boxes, Loader2, Minus, PackageX, Plus } from 'lucide-react';

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

export interface StockRow {
  id: string;
  name: string;
  thumbnail: string | null;
  sku: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  price: number;
  category_name: string;
}

interface Movement {
  id: string;
  change: number;
  reason: string;
  note: string | null;
  created_at: string;
  product: { name: string } | null;
}

export default function StockClient({
  rows,
  movements,
  demoMode,
}: {
  rows: StockRow[];
  movements: Movement[];
  demoMode: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<StockRow | null>(null);
  const [mode, setMode] = useState<'add' | 'remove' | 'set'>('add');
  const [quantity, setQuantity] = useState('10');
  const [reason, setReason] = useState('restock');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    const low = rows.filter(
      (row) => row.stock_quantity > 0 && row.stock_quantity <= row.low_stock_threshold
    ).length;
    const out = rows.filter((row) => row.stock_quantity === 0).length;
    const units = rows.reduce((sum, row) => sum + row.stock_quantity, 0);
    const value = rows.reduce((sum, row) => sum + row.stock_quantity * row.price, 0);
    return { low, out, units, value };
  }, [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === 'low' && !(row.stock_quantity > 0 && row.stock_quantity <= row.low_stock_threshold)) {
        return false;
      }
      if (filter === 'out' && row.stock_quantity !== 0) return false;
      if (term && !`${row.name} ${row.sku ?? ''} ${row.category_name}`.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  }, [rows, filter, search]);

  const openAdjust = (row: StockRow, preset: 'add' | 'set' = 'add') => {
    setTarget(row);
    setMode(preset);
    setQuantity(preset === 'set' ? String(row.stock_quantity) : '10');
    setReason(preset === 'set' ? 'stock-count' : 'restock');
    setNote('');
  };

  const quickAdjust = async (row: StockRow, delta: number) => {
    await submitAdjustment(row, delta > 0 ? 'add' : 'remove', Math.abs(delta), 'quick-adjust', null);
  };

  const submitAdjustment = async (
    row: StockRow,
    adjustMode: 'add' | 'remove' | 'set',
    qty: number,
    adjustReason: string,
    adjustNote: string | null
  ) => {
    if (demoMode) {
      toast.info('Demo mode: connect Supabase to update stock.');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: row.id,
          quantity: qty,
          mode: adjustMode,
          reason: adjustReason,
          note: adjustNote,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error ?? 'Update failed');

      toast.success(
        `${row.name}: ${payload.data.previous} → ${payload.data.stock_quantity} units`
      );
      setTarget(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Stock"
        description="Adjust inventory, watch low-stock alerts and review every movement."
      />

      {demoMode ? <DemoNotice /> : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Units in stock', value: stats.units.toLocaleString(), icon: Boxes, tone: 'text-gray-900' },
          { label: 'Low stock', value: String(stats.low), icon: AlertTriangle, tone: 'text-amber-600' },
          { label: 'Out of stock', value: String(stats.out), icon: PackageX, tone: 'text-red-600' },
          { label: 'Stock value', value: formatCedis(stats.value), icon: Boxes, tone: 'text-emerald-600' },
        ].map((card) => (
          <AdminCard key={card.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                  {card.label}
                </p>
                <p className={`mt-1.5 text-[22px] font-black ${card.tone}`}>{card.value}</p>
              </div>
              <card.icon className="h-5 w-5 text-gray-300" />
            </div>
          </AdminCard>
        ))}
      </div>

      {target ? (
        <AdminCard className="mb-6 border-red-100 bg-red-50/30">
          <h2 className="text-[15px] font-extrabold text-gray-900">
            Adjust stock — {target.name}
          </h2>
          <p className="mt-1 text-[12px] text-gray-500">
            Current stock: <strong>{target.stock_quantity}</strong> units
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Action">
              <Select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
                <option value="add">Add stock</option>
                <option value="remove">Remove stock</option>
                <option value="set">Set exact count</option>
              </Select>
            </Field>
            <Field label="Quantity">
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </Field>
            <Field label="Reason">
              <Select value={reason} onChange={(event) => setReason(event.target.value)}>
                <option value="restock">Restock / delivery</option>
                <option value="stock-count">Stock count correction</option>
                <option value="damaged">Damaged / expired</option>
                <option value="return">Customer return</option>
                <option value="manual-adjustment">Other</option>
              </Select>
            </Field>
            <Field label="Note">
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Supplier delivery #12"
              />
            </Field>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <AdminButton variant="secondary" onClick={() => setTarget(null)}>
              Cancel
            </AdminButton>
            <AdminButton
              disabled={busy}
              onClick={() =>
                submitAdjustment(target, mode, Math.abs(Number(quantity) || 0), reason, note || null)
              }
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Apply adjustment
            </AdminButton>
          </div>
        </AdminCard>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products or SKU…"
          className="max-w-xs"
        />
        <div className="flex gap-1.5">
          {(['all', 'low', 'out'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors ${
                filter === value
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {value === 'all' ? 'All' : value === 'low' ? 'Low stock' : 'Out of stock'}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-gray-500">{filtered.length} products</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {filtered.length === 0 ? (
            <EmptyState title="Nothing to show" hint="Adjust the filter or search term." />
          ) : (
            <AdminCard padded={false}>
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-bold">Product</th>
                    <th className="px-5 py-3 font-bold">Stock</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 text-right font-bold">Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((row) => {
                    const isOut = row.stock_quantity === 0;
                    const isLow =
                      !isOut && row.stock_quantity <= (row.low_stock_threshold ?? 10);

                    return (
                      <tr key={row.id} className="hover:bg-gray-50/60">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
                              {row.thumbnail ? (
                                <Image
                                  src={row.thumbnail}
                                  alt=""
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : null}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{row.name}</p>
                              <p className="text-[11.5px] text-gray-500">
                                {row.category_name}
                                {row.sku ? ` · ${row.sku}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[15px] font-black text-gray-900">
                            {row.stock_quantity}
                          </span>
                          <span className="ml-1 text-[11px] text-gray-400">
                            / alert at {row.low_stock_threshold ?? 10}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {isOut ? (
                            <Badge tone="red">Out of stock</Badge>
                          ) : isLow ? (
                            <Badge tone="amber">Low stock</Badge>
                          ) : (
                            <Badge tone="green">In stock</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <AdminButton
                              size="sm"
                              variant="secondary"
                              title="Remove 1"
                              onClick={() => quickAdjust(row, -1)}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </AdminButton>
                            <AdminButton
                              size="sm"
                              variant="secondary"
                              title="Add 1"
                              onClick={() => quickAdjust(row, 1)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </AdminButton>
                            <AdminButton size="sm" onClick={() => openAdjust(row)}>
                              Adjust
                            </AdminButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </AdminCard>
          )}
        </div>

        <AdminCard padded={false} className="h-fit">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-[14px] font-extrabold text-gray-900">Recent movements</h2>
            <p className="text-[11.5px] text-gray-500">Every stock change is logged.</p>
          </div>
          {movements.length === 0 ? (
            <p className="px-5 py-8 text-center text-[12px] text-gray-400">
              No movements recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {movements.map((movement) => (
                <li key={movement.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12.5px] font-semibold text-gray-800">
                      {movement.product?.name ?? 'Product'}
                    </p>
                    <span
                      className={`text-[12px] font-black ${
                        movement.change > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {movement.change > 0 ? '+' : ''}
                      {movement.change}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {movement.reason.replace(/-/g, ' ')} ·{' '}
                    {new Date(movement.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
