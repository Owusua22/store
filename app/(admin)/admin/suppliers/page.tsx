import { getSuppliers, type SupplierBalance } from '@/lib/data/accounting';
import { isDemoMode } from '@/lib/supabase/config';
import SuppliersClient from './SuppliersClient';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Suppliers' };

export default async function SuppliersPage() {
  const suppliers: SupplierBalance[] = await getSuppliers();

  return <SuppliersClient suppliers={suppliers} demoMode={isDemoMode} />;
}
