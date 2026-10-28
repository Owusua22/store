// lib/data/accounting.ts
// Server-side reads for the bookkeeping screens: suppliers, stock purchases,
// running expenses and the profit summary. Live mode is authoritative; demo
// mode returns a small, clearly-labelled example set so the screens make sense.

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { checkDatabaseHealth, logDatabaseError } from '@/lib/supabase/health';

export interface SupplierRow {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  payment_terms: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface SupplierBalance extends SupplierRow {
  total_purchases: number;
  total_paid: number;
  balance_owed: number;
  last_purchase: string | null;
}

export interface PurchaseRow {
  id: string;
  supplier_id: string | null;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  amount_paid: number;
  payment_method: string;
  reference: string | null;
  note: string | null;
  purchased_at: string;
  product?: { name: string } | null;
  supplier?: { name: string } | null;
}

export interface ExpenseRow {
  id: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  supplier_id: string | null;
  reference: string | null;
  spent_at: string;
}

export interface MonthSummary {
  month: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
  expenses: number;
  stock_spend: number;
  net_profit: number;
}

export interface AccountingOverview {
  live: boolean;
  months: MonthSummary[];
  totals: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    expenses: number;
    stockSpend: number;
    netProfit: number;
    margin: number;
  };
  inventory: {
    units: number;
    costValue: number;
    retailValue: number;
    potentialProfit: number;
  };
  suppliers: SupplierBalance[];
  recentPurchases: PurchaseRow[];
  recentExpenses: ExpenseRow[];
  lowMarginProducts: Array<{
    id: string;
    name: string;
    price: number;
    cost_price: number;
    margin: number;
    stock_quantity: number;
  }>;
  paymentMix: Array<{ method: string; total: number }>;
}

const num = (value: unknown) => Number(value ?? 0) || 0;

const demoTodays = () => new Date().toISOString().slice(0, 10);

/** Sample stock purchases for demo mode (never written to a database). */
export const demoPurchases: PurchaseRow[] = [
  {
    id: 'demo-purchase-1',
    supplier_id: 'demo-supplier-1',
    product_id: 'demo-product-1',
    quantity: 24,
    unit_cost: 42,
    total_cost: 1008,
    amount_paid: 1008,
    payment_method: 'momo',
    reference: 'MM-884213',
    note: 'Nivea and Vaseline restock',
    purchased_at: demoTodays(),
    product: { name: 'Shea Butter Body Lotion 400ml' },
    supplier: { name: 'Nsawam Wholesale Cosmetics' },
  },
  {
    id: 'demo-purchase-2',
    supplier_id: 'demo-supplier-2',
    product_id: 'demo-product-2',
    quantity: 18,
    unit_cost: 55,
    total_cost: 990,
    amount_paid: 990,
    payment_method: 'cash',
    reference: null,
    note: null,
    purchased_at: demoTodays(),
    product: { name: 'Cocoa Glow Body Lotion 500ml' },
    supplier: { name: 'Glow-Up Imports' },
  },
  {
    id: 'demo-purchase-3',
    supplier_id: 'demo-supplier-1',
    product_id: 'demo-product-3',
    quantity: 36,
    unit_cost: 18,
    total_cost: 648,
    amount_paid: 400,
    payment_method: 'credit',
    reference: 'INV-2291',
    note: 'Balance to pay on next visit',
    purchased_at: demoTodays(),
    product: { name: 'Baby Wipes 80 sheets' },
    supplier: { name: 'Nsawam Wholesale Cosmetics' },
  },
];

/** Sample running expenses for demo mode. */
export const demoExpenses: ExpenseRow[] = [
  {
    id: 'demo-expense-1',
    category: 'rent',
    description: 'Shop rent — East Doboro',
    amount: 800,
    payment_method: 'momo',
    supplier_id: null,
    reference: null,
    spent_at: demoTodays(),
  },
  {
    id: 'demo-expense-2',
    category: 'transport',
    description: 'Trotro to Nsawam market for restock',
    amount: 60,
    payment_method: 'cash',
    supplier_id: null,
    reference: null,
    spent_at: demoTodays(),
  },
  {
    id: 'demo-expense-3',
    category: 'packaging',
    description: 'Branded paper bags and tissue',
    amount: 180,
    payment_method: 'cash',
    supplier_id: null,
    reference: null,
    spent_at: demoTodays(),
  },
];

function emptyOverview(live: boolean): AccountingOverview {
  return {
    live,
    months: [],
    totals: {
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      expenses: 0,
      stockSpend: 0,
      netProfit: 0,
      margin: 0,
    },
    inventory: { units: 0, costValue: 0, retailValue: 0, potentialProfit: 0 },
    suppliers: [],
    recentPurchases: [],
    recentExpenses: [],
    lowMarginProducts: [],
    paymentMix: [],
  };
}

/** Demo-mode numbers so /admin/accounting is understandable before go-live. */
function demoOverview(): AccountingOverview {
  const base = emptyOverview(false);
  const thisMonth = new Date().toISOString().slice(0, 7);

  return {
    ...base,
    months: [
      {
        month: thisMonth,
        revenue: 4850,
        cogs: 2910,
        gross_profit: 1940,
        expenses: 1240,
        stock_spend: 4320,
        net_profit: 700,
      },
    ],
    totals: {
      revenue: 4850,
      cogs: 2910,
      grossProfit: 1940,
      expenses: 1240,
      stockSpend: 4320,
      netProfit: 700,
      margin: 40,
    },
    inventory: { units: 410, costValue: 21240, retailValue: 34880, potentialProfit: 13640 },
    suppliers: [
      {
        id: 'demo-supplier-1',
        name: 'Nsawam Wholesale Cosmetics',
        contact_person: 'Mr. Boateng',
        phone: '0244123456',
        email: null,
        address: 'Nsawam Market',
        notes: 'Main supplier for Nivea, Vaseline and Dove.',
        payment_terms: 'Cash on delivery',
        is_active: true,
        total_purchases: 1656,
        total_paid: 1408,
        balance_owed: 248,
        last_purchase: demoTodays(),
      },
      {
        id: 'demo-supplier-2',
        name: 'Glow-Up Imports',
        contact_person: 'Kofi Mensah',
        phone: '0555551234',
        email: null,
        address: 'Tema Harbour',
        notes: 'Own-brand range, sea freight.',
        payment_terms: '50% deposit',
        is_active: true,
        total_purchases: 990,
        total_paid: 990,
        balance_owed: 0,
        last_purchase: null,
      },
    ],
    recentPurchases: demoPurchases,
    recentExpenses: demoExpenses,
    lowMarginProducts: [
      {
        id: 'demo-product-3',
        name: 'Baby Wipes 80 sheets',
        price: 20,
        cost_price: 18,
        margin: 10,
        stock_quantity: 36,
      },
    ],
    paymentMix: [
      { method: 'momo', total: 3200 },
      { method: 'cash', total: 1650 },
    ],
  };
}

export async function getAccountingOverview(): Promise<AccountingOverview> {
  if (!isSupabaseConfigured) return demoOverview();

  const health = await checkDatabaseHealth();
  if (!health.initialized) return emptyOverview(true);

  try {
    const supabase = await createServerSupabaseClient();

    const [pnl, valuation, suppliers, purchases, expenses, products] = await Promise.all([
      supabase.from('monthly_pnl').select('*').order('month', { ascending: false }).limit(12),
      supabase.from('inventory_valuation').select('*'),
      supabase.from('supplier_balances').select('*').order('balance_owed', { ascending: false }),
      supabase
        .from('stock_purchases')
        .select('*, product:products(name), supplier:suppliers(name)')
        .order('purchased_at', { ascending: false })
        .limit(10),
      supabase.from('expenses').select('*').order('spent_at', { ascending: false }).limit(10),
      supabase
        .from('products')
        .select('id, name, price, cost_price, stock_quantity, metadata')
        .eq('archived', false),
    ]);

    if (pnl.error) logDatabaseError('accounting.monthly_pnl', pnl.error);

    const months: MonthSummary[] = (pnl.data ?? []).map((row) => ({
      month: String(row.month),
      revenue: num(row.revenue),
      cogs: num(row.cogs),
      gross_profit: num(row.gross_profit),
      expenses: num(row.expenses),
      stock_spend: num(row.stock_spend),
      net_profit: num(row.net_profit),
    }));

    const totals = months.reduce(
      (acc, month) => ({
        revenue: acc.revenue + month.revenue,
        cogs: acc.cogs + month.cogs,
        grossProfit: acc.grossProfit + month.gross_profit,
        expenses: acc.expenses + month.expenses,
        stockSpend: acc.stockSpend + month.stock_spend,
        netProfit: acc.netProfit + month.net_profit,
        margin: 0,
      }),
      { revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, stockSpend: 0, netProfit: 0, margin: 0 }
    );
    totals.margin = totals.revenue > 0 ? (totals.grossProfit / totals.revenue) * 100 : 0;

    const inventory = (valuation.data ?? []).reduce(
      (acc, row) => ({
        units: acc.units + num(row.stock_quantity),
        costValue: acc.costValue + num(row.stock_value_cost),
        retailValue: acc.retailValue + num(row.stock_value_retail),
        potentialProfit: acc.potentialProfit + num(row.potential_profit),
      }),
      { units: 0, costValue: 0, retailValue: 0, potentialProfit: 0 }
    );

    const supplierRows: SupplierBalance[] = (suppliers.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      contact_person: null,
      phone: (row.phone as string | null) ?? null,
      email: null,
      address: null,
      notes: null,
      payment_terms: null,
      is_active: Boolean(row.is_active),
      total_purchases: num(row.total_purchases),
      total_paid: num(row.total_paid),
      balance_owed: num(row.balance_owed),
      last_purchase: (row.last_purchase as string | null) ?? null,
    }));

    const lowMarginProducts = (products.data ?? [])
      .map((row) => {
        const price = num(row.price);
        const cost = num(row.cost_price);
        const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
        return {
          id: String(row.id),
          name: String(row.name),
          price,
          cost_price: cost,
          margin,
          stock_quantity: num(row.stock_quantity),
        };
      })
      .filter((row) => row.price > 0 && row.margin < 25)
      .sort((a, b) => a.margin - b.margin)
      .slice(0, 8);

    // How customers actually pay — useful for deciding on a gateway.
    const paymentMap = new Map<string, number>();
    for (const row of expenses.data ?? []) {
      const method = String(row.payment_method ?? 'cash');
      paymentMap.set(method, (paymentMap.get(method) ?? 0) + num(row.amount));
    }

    return {
      live: true,
      months,
      totals,
      inventory,
      suppliers: supplierRows,
      recentPurchases: (purchases.data ?? []) as PurchaseRow[],
      recentExpenses: (expenses.data ?? []) as ExpenseRow[],
      lowMarginProducts,
      paymentMix: [...paymentMap.entries()].map(([method, total]) => ({ method, total })),
    };
  } catch (error) {
    logDatabaseError('getAccountingOverview', error);
    return emptyOverview(true);
  }
}

export async function getSuppliers(): Promise<SupplierBalance[]> {
  if (!isSupabaseConfigured) return demoOverview().suppliers;

  const health = await checkDatabaseHealth();
  if (!health.initialized) return [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logDatabaseError('getSuppliers', error);
      return [];
    }

    return (data ?? []).map((row) => ({
      ...(row as SupplierRow),
      total_purchases: 0,
      total_paid: 0,
      balance_owed: 0,
      last_purchase: null,
    }));
  } catch (error) {
    logDatabaseError('getSuppliers', error);
    return [];
  }
}

export async function getPurchases(limit = 50): Promise<PurchaseRow[]> {
  if (!isSupabaseConfigured) return [];

  const health = await checkDatabaseHealth();
  if (!health.initialized) return [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('stock_purchases')
      .select('*, product:products(name), supplier:suppliers(name)')
      .order('purchased_at', { ascending: false })
      .limit(limit);

    if (error) {
      logDatabaseError('getPurchases', error);
      return [];
    }
    return (data ?? []) as PurchaseRow[];
  } catch (error) {
    logDatabaseError('getPurchases', error);
    return [];
  }
}

export async function getExpenses(limit = 50): Promise<ExpenseRow[]> {
  if (!isSupabaseConfigured) return [];

  const health = await checkDatabaseHealth();
  if (!health.initialized) return [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('spent_at', { ascending: false })
      .limit(limit);

    if (error) {
      logDatabaseError('getExpenses', error);
      return [];
    }
    return (data ?? []) as ExpenseRow[];
  } catch (error) {
    logDatabaseError('getExpenses', error);
    return [];
  }
}

export { EXPENSE_CATEGORIES, PAYMENT_METHODS, EXPENSE_CATEGORY_LABELS } from '@/lib/admin/accounting-constants';
