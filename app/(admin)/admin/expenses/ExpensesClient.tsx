'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Loader2, Plus, Receipt, Trash2, X } from 'lucide-react';

import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
  DemoNotice,
  EmptyState,
  Field,
  Input,
  Select,
} from '@/components/admin/ui';
import { formatCedis } from '@/lib/utils';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from '@/lib/admin/accounting-constants';
import type { ExpenseRow } from '@/lib/data/accounting';

const today = () => new Date().toISOString().slice(0, 10);

const CATEGORY_LABELS = EXPENSE_CATEGORY_LABELS;

export default function ExpensesClient({
  expenses,
  demoMode,
}: {
  expenses: ExpenseRow[];
  demoMode: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const [category, setCategory] = useState<string>('other');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo' | 'bank'>('cash');
  const [reference, setReference] = useState('');
  const [spentAt, setSpentAt] = useState(today());

  const filtered = useMemo(
    () => (filter === 'all' ? expenses : expenses.filter((row) => row.category === filter)),
    [expenses, filter]
  );

  const total = useMemo(
    () => filtered.reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
    [filtered]
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of expenses) {
      map.set(row.category, (map.get(row.category) ?? 0) + Number(row.amount ?? 0));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const reset = () => {
    setCategory('other');
    setDescription('');
    setAmount('');
    setPaymentMethod('cash');
    setReference('');
    setSpentAt(today());
  };

  const submit = async () => {
    if (demoMode) {
      toast.info('Demo mode — connect Supabase to record real expenses.');
      return;
    }
    if (description.trim().length < 2) {
      toast.error('Describe the expense');
      return;
    }
    if (!(Number(amount) > 0)) {
      toast.error('Enter an amount greater than zero');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description: description.trim(),
          amount: Number(amount),
          payment_method: paymentMethod,
          reference: reference || null,
          spent_at: spentAt,
        }),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Could not save the expense');
      }
      toast.success('Expense saved');
      reset();
      setShowForm(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the expense');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/expenses?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Could not delete the expense');
      }
      toast.success('Expense deleted');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete the expense');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Expenses"
        description="Rent, transport, data, salaries and packaging — everything that is not stock."
        action={
          <AdminButton onClick={() => (showForm ? setShowForm(false) : setShowForm(true))}>
            {showForm ? (
              <>
                <X className="h-4 w-4" /> Close
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Add expense
              </>
            )}
          </AdminButton>
        }
      />

      {demoMode ? <DemoNotice>These are sample expenses until you connect Supabase.</DemoNotice> : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <AdminCard className="lg:col-span-1">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-gray-500">
            {filter === 'all' ? 'Total expenses' : CATEGORY_LABELS[filter] ?? filter}
          </p>
          <p className="mt-2 text-[26px] font-black text-gray-900">{formatCedis(total)}</p>
          <p className="mt-1 text-[11.5px] text-gray-400">
            {filtered.length} record{filtered.length === 1 ? '' : 's'}
          </p>
        </AdminCard>

        <AdminCard className="lg:col-span-2">
          <p className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.08em] text-gray-500">
            Where the money went
          </p>
          {byCategory.length === 0 ? (
            <p className="text-[12.5px] text-gray-500">Nothing logged yet.</p>
          ) : (
            <ul className="space-y-2">
              {byCategory.slice(0, 5).map(([key, value]) => {
                const share = total > 0 ? (value / byCategory.reduce((s, [, v]) => s + v, 0)) * 100 : 0;
                return (
                  <li key={key} className="text-[12.5px]">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-semibold text-gray-700">{CATEGORY_LABELS[key] ?? key}</span>
                      <span className="font-bold text-gray-900">{formatCedis(value)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: `${Math.max(share, 2)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>
      </div>

      {showForm ? (
        <AdminCard className="mb-6">
          <h2 className="mb-4 text-[15px] font-bold text-gray-900">New expense</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Category">
              <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                {EXPENSE_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {CATEGORY_LABELS[option] ?? option}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Amount (GH₵)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="What was it for" className="md:col-span-2">
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. ECG prepaid top-up for the shop"
              />
            </Field>
            <Field label="Paid with">
              <Select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as 'cash' | 'momo' | 'bank')}
              >
                <option value="cash">Cash</option>
                <option value="momo">Mobile money</option>
                <option value="bank">Bank transfer</option>
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" value={spentAt} onChange={(event) => setSpentAt(event.target.value)} />
            </Field>
            <Field label="Receipt / reference" className="md:col-span-2">
              <Input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="MoMo transaction ID, receipt number…"
              />
            </Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <AdminButton variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </AdminButton>
            <AdminButton onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
              Save expense
            </AdminButton>
          </div>
        </AdminCard>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
            filter === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {EXPENSE_CATEGORIES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
              filter === option
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {CATEGORY_LABELS[option] ?? option}
          </button>
        ))}
      </div>

      <AdminCard padded={false}>
        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No expenses here" hint="Add rent, transport or data to see your true profit." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-[0.06em] text-gray-500">
                  <th className="px-5 py-3 font-bold">Date</th>
                  <th className="px-3 py-3 font-bold">Description</th>
                  <th className="px-3 py-3 font-bold">Category</th>
                  <th className="px-3 py-3 font-bold">Paid with</th>
                  <th className="px-3 py-3 text-right font-bold">Amount</th>
                  <th className="px-5 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-50 last:border-0">
                    <td className="whitespace-nowrap px-5 py-3 text-gray-600">{expense.spent_at}</td>
                    <td className="px-3 py-3 font-semibold text-gray-800">
                      {expense.description}
                      {expense.reference ? (
                        <span className="mt-0.5 block text-[11px] font-normal text-gray-400">
                          {expense.reference}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {CATEGORY_LABELS[expense.category] ?? expense.category}
                    </td>
                    <td className="px-3 py-3 capitalize text-gray-600">{expense.payment_method}</td>
                    <td className="px-3 py-3 text-right font-bold text-red-600">
                      −{formatCedis(Number(expense.amount))}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => remove(expense.id)}
                        disabled={deleting === expense.id || demoMode}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        {deleting === expense.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
