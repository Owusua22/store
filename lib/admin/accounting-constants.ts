// lib/admin/accounting-constants.ts
// Client-safe vocabulary for the bookkeeping screens. Kept out of
// lib/data/accounting.ts so client components never pull in a server client.

export const EXPENSE_CATEGORIES = [
  'rent',
  'transport',
  'utilities',
  'internet',
  'salaries',
  'packaging',
  'marketing',
  'repairs',
  'fees',
  'other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_METHODS = ['cash', 'momo', 'bank'] as const;

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  rent: 'Rent',
  transport: 'Transport',
  utilities: 'Utilities (light, water)',
  internet: 'Internet / data',
  salaries: 'Salaries & wages',
  packaging: 'Packaging & bags',
  marketing: 'Marketing & flyers',
  repairs: 'Repairs & maintenance',
  fees: 'Bank / MoMo fees',
  other: 'Other',
};
