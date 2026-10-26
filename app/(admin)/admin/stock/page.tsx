import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { demoProducts } from '@/lib/demo/catalog';
import StockClient, { type StockRow } from './StockClient';

export const dynamic = 'force-dynamic';

interface Movement {
  id: string;
  change: number;
  reason: string;
  note: string | null;
  created_at: string;
  product: { name: string } | null;
}

async function loadStock(): Promise<{ rows: StockRow[]; movements: Movement[] }> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: products } = await supabase
        .from('products')
        .select('id, name, thumbnail, sku, stock_quantity, low_stock_threshold, price, category:categories(name)')
        .eq('archived', false)
        .order('stock_quantity', { ascending: true });

      const { data: movements } = await supabase
        .from('inventory_movements')
        .select('*, product:products(name)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (products) {
        return {
          rows: products.map((row) => ({
            ...row,
            category_name:
              (row.category as { name?: string } | null)?.name ?? 'Uncategorised',
          })) as StockRow[],
          movements: (movements ?? []) as Movement[],
        };
      }
    } catch (error) {
      console.error('stock page: could not load live stock', error);
    }
  }

  // Live mode with a failed lookup: render an empty table, never demo rows.
  if (isSupabaseConfigured) {
    return { rows: [], movements: [] };
  }

  return {
    rows: demoProducts.map((product) => ({
      id: product.id,
      name: product.name,
      thumbnail: product.thumbnail,
      sku: product.sku ?? null,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold ?? 10,
      price: product.price,
      category_name: 'Demo catalogue',
    })),
    movements: [],
  };
}

export default async function StockPage() {
  const { rows, movements } = await loadStock();

  return <StockClient rows={rows} movements={movements} demoMode={!isSupabaseConfigured} />;
}
