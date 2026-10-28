import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Coins,
  Receipt,
  Truck,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { getAccountingOverview } from '@/lib/data/accounting';
import { isDemoMode } from '@/lib/supabase/config';
import { AdminPageHeader, AdminCard, Badge, DemoNotice, EmptyState } from '@/components/admin/ui';
import { formatCedis } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Accounting' };

function money(value: number) {
  return formatCedis(value);
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'gray',
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'gray' | 'green' | 'red' | 'amber' | 'blue';
}) {
  const tones: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <AdminCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-[24px] font-black leading-none tracking-tight text-gray-900">
            {value}
          </p>
          {hint ? <p className="mt-1.5 text-[11.5px] text-gray-500">{hint}</p> : null}
        </div>
        <span className={`rounded-xl p-2.5 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </AdminCard>
  );
}

export default async function AccountingPage() {
  const overview = await getAccountingOverview();
  const { totals, inventory, months } = overview;
  const thisMonth = months[0];

  return (
    <div>
      <AdminPageHeader
        title="Accounting"
        description="What you sold, what it cost you, and what you actually kept."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/purchases"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-red-700"
            >
              <Boxes className="h-4 w-4" /> Record stock purchase
            </Link>
            <Link
              href="/admin/expenses"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Receipt className="h-4 w-4" /> Add expense
            </Link>
          </div>
        }
      />

      {isDemoMode ? (
        <DemoNotice>
          These figures are sample numbers. Add your Supabase keys and run{' '}
          <code className="font-mono">supabase/schema.sql</code> to see your real profit.
        </DemoNotice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={money(totals.revenue)}
          hint={thisMonth ? `This month: ${money(thisMonth.revenue)}` : 'No sales recorded yet'}
          icon={Coins}
          tone="blue"
        />
        <StatCard
          label="Cost of goods sold"
          value={money(totals.cogs)}
          hint={`Margin ${totals.margin.toFixed(1)}%`}
          icon={ArrowDownRight}
          tone="amber"
        />
        <StatCard
          label="Gross profit"
          value={money(totals.grossProfit)}
          hint="Revenue minus what the stock cost"
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          label="Net profit"
          value={money(totals.netProfit)}
          hint={`After ${money(totals.expenses)} running expenses`}
          icon={Wallet}
          tone={totals.netProfit >= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <AdminCard className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-gray-900">Month by month</h2>
            <Link href="/admin/purchases" className="text-[12px] font-semibold text-red-600 hover:underline">
              Stock purchases
            </Link>
          </div>

          {months.length === 0 ? (
            <EmptyState
              title="No figures yet"
              hint="Record a stock purchase or take your first order and the months will fill in here."
            />
          ) : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] uppercase tracking-[0.06em] text-gray-500">
                    <th className="px-5 py-2 font-bold">Month</th>
                    <th className="px-3 py-2 text-right font-bold">Revenue</th>
                    <th className="px-3 py-2 text-right font-bold">Cost of goods</th>
                    <th className="px-3 py-2 text-right font-bold">Expenses</th>
                    <th className="px-3 py-2 text-right font-bold">Stock spend</th>
                    <th className="px-5 py-2 text-right font-bold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((month) => (
                    <tr key={month.month} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 font-semibold text-gray-800">{month.month}</td>
                      <td className="px-3 py-3 text-right">{money(month.revenue)}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{money(month.cogs)}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{money(month.expenses)}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{money(month.stock_spend)}</td>
                      <td
                        className={`px-5 py-3 text-right font-bold ${
                          month.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {money(month.net_profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-[11.5px] leading-relaxed text-gray-400">
            Revenue counts every order except cancelled or refunded ones. Cost of goods sold uses
            the cost price captured on each product at the moment of the sale, so changing
            today&apos;s cost price never rewrites an old month.
          </p>
        </AdminCard>

        <div className="space-y-6">
          <AdminCard>
            <div className="mb-3 flex items-center gap-2">
              <Boxes className="h-4 w-4 text-gray-400" />
              <h2 className="text-[15px] font-bold text-gray-900">Stock on hand</h2>
            </div>
            <dl className="space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Units</dt>
                <dd className="font-bold text-gray-900">{inventory.units}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Value at cost</dt>
                <dd className="font-bold text-gray-900">{money(inventory.costValue)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Value at retail</dt>
                <dd className="font-bold text-gray-900">{money(inventory.retailValue)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                <dt className="text-gray-500">Profit if all sells</dt>
                <dd className="font-bold text-emerald-600">{money(inventory.potentialProfit)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[11.5px] text-gray-400">
              This is money already tied up in your shelves — not a profit yet.
            </p>
          </AdminCard>

          <AdminCard>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-400" />
                <h2 className="text-[15px] font-bold text-gray-900">Owed to suppliers</h2>
              </div>
              <Link href="/admin/suppliers" className="text-[12px] font-semibold text-red-600 hover:underline">
                Manage
              </Link>
            </div>
            {overview.suppliers.length === 0 ? (
              <p className="text-[12.5px] text-gray-500">No suppliers added yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {overview.suppliers.slice(0, 4).map((supplier) => (
                  <li key={supplier.id} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="truncate text-gray-700">{supplier.name}</span>
                    <Badge tone={supplier.balance_owed > 0 ? 'red' : 'green'}>
                      {supplier.balance_owed > 0 ? money(supplier.balance_owed) : 'Settled'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-gray-900">Recent stock purchases</h2>
            <Link href="/admin/purchases" className="text-[12px] font-semibold text-red-600 hover:underline">
              All purchases
            </Link>
          </div>
          {overview.recentPurchases.length === 0 ? (
            <EmptyState title="Nothing bought yet" hint="Log what you buy for resale to track cost prices automatically." />
          ) : (
            <ul className="divide-y divide-gray-50">
              {overview.recentPurchases.slice(0, 6).map((purchase) => (
                <li key={purchase.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-800">
                      {purchase.product?.name ?? 'Product'}
                    </p>
                    <p className="text-[11.5px] text-gray-400">
                      {purchase.quantity} × {money(purchase.unit_cost)} ·{' '}
                      {purchase.supplier?.name ?? 'No supplier'} · {purchase.purchased_at}
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-gray-900">{money(purchase.total_cost)}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <div className="space-y-6">
          <AdminCard>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-gray-900">Recent expenses</h2>
              <Link href="/admin/expenses" className="text-[12px] font-semibold text-red-600 hover:underline">
                All expenses
              </Link>
            </div>
            {overview.recentExpenses.length === 0 ? (
              <EmptyState title="No expenses logged" hint="Rent, transport, data, packaging — log them all." />
            ) : (
              <ul className="divide-y divide-gray-50">
                {overview.recentExpenses.slice(0, 6).map((expense) => (
                  <li key={expense.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-800">{expense.description}</p>
                      <p className="text-[11.5px] capitalize text-gray-400">
                        {expense.category} · {expense.payment_method} · {expense.spent_at}
                      </p>
                    </div>
                    <span className="shrink-0 font-bold text-red-600">−{money(expense.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard>
            <h2 className="mb-1 text-[15px] font-bold text-gray-900">Thin margins</h2>
            <p className="mb-3 text-[11.5px] text-gray-400">
              Under 25% margin — worth renegotiating or repricing.
            </p>
            {overview.lowMarginProducts.length === 0 ? (
              <p className="text-[12.5px] text-gray-500">
                Every product is priced above a 25% margin. Nothing to fix.
              </p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {overview.lowMarginProducts.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-800">{product.name}</p>
                      <p className="text-[11.5px] text-gray-400">
                        Sells {money(product.price)} · costs {money(product.cost_price)} · {product.stock_quantity} left
                      </p>
                    </div>
                    <Badge tone={product.margin < 10 ? 'red' : 'amber'}>
                      {product.margin.toFixed(0)}%
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>
      </div>

      <AdminCard className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">How to read this page</h2>
            <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-gray-500">
              <strong className="text-gray-700">Revenue</strong> is what customers paid.{' '}
              <strong className="text-gray-700">Cost of goods</strong> is what those items cost you to buy.{' '}
              <strong className="text-gray-700">Gross profit</strong> is the difference.{' '}
              <strong className="text-gray-700">Expenses</strong> are rent, transport, data, salaries and
              packaging. <strong className="text-gray-700">Stock spend</strong> is money moved into
              inventory — it shows in net profit only when the stock sells, which is why it is listed
              separately.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-500">
            <ArrowUpRight className="h-4 w-4 text-emerald-500" /> Positive
            <ArrowDownRight className="ml-3 h-4 w-4 text-red-500" /> Negative
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
