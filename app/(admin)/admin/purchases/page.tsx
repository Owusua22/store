import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isDemoMode, isSupabaseConfigured } from '@/lib/supabase/config';
import { checkDatabaseHealth } from '@/lib/supabase/health';
import {
  demoPurchases,
  getPurchases,
  getSuppliers,
  type PurchaseRow,
  type SupplierBalance,
} from '@/lib/data/accounting';
import { demoProducts } from '@/lib/demo/catalog';
import PurchasesClient, { type PurchaseProduct } from './PurchasesClient';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Stock purchases' };

async function loadProducts(): Promise<PurchaseProduct[]> {
  if (isSupabaseConfigured) {
    const health = await checkDatabaseHealth();
    if (!health.initialized) return [];

    try {
      const supabase = await createServerSupabaseClient();
      const { data } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, cost_price, price, thumbnail')
        .eq('archived', false)
        .order('name', { ascending: true });

      return (data ?? []) as PurchaseProduct[];
    } catch (error) {
      console.error('purchases page: could not load products', error);
      return [];
    }
  }

  return demoProducts.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku ?? null,
    stock_quantity: product.stock_quantity,
    cost_price: null,
    price: product.price,
    thumbnail: product.thumbnail,
  }));
}

export default async function PurchasesPage() {
  const [livePurchases, suppliers, products]: [PurchaseRow[], SupplierBalance[], PurchaseProduct[]] =
    await Promise.all([getPurchases(100), getSuppliers(), loadProducts()]);

  const purchases = livePurchases.length > 0 ? livePurchases : isDemoMode ? demoPurchases : livePurchases;

  return (
    <PurchasesClient
      purchases={purchases}
      suppliers={suppliers}
      products={products}
      demoMode={isDemoMode}
    />
  );
}
