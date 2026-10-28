import { demoExpenses, getExpenses, type ExpenseRow } from '@/lib/data/accounting';
import { isDemoMode } from '@/lib/supabase/config';
import ExpensesClient from './ExpensesClient';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Expenses' };

export default async function ExpensesPage() {
  const live = await getExpenses(200);
  const expenses: ExpenseRow[] = live.length > 0 ? live : isDemoMode ? demoExpenses : live;

  return <ExpensesClient expenses={expenses} demoMode={isDemoMode} />;
}
