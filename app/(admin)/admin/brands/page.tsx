import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { checkDatabaseHealth, isSchemaMissingError } from '@/lib/supabase/health';
import { fallbackBrands, type BrandWithCount } from '@/lib/data/brands';
import BrandsClient from './BrandsClient';

export const dynamic = 'force-dynamic';

async function loadBrands(): Promise<{
  rows: BrandWithCount[];
  usingDefaults: boolean;
  schemaMissing: boolean;
}> {
  if (isSupabaseConfigured) {
    try {
      const health = await checkDatabaseHealth();
      if (!health.initialized) {
        return { rows: [], usingDefaults: false, schemaMissing: true };
      }

      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('sort_order', { ascending: true });

      // An older project that has not re-run schema.sql yet: the rest of the app
      // works, but the brands table is missing.
      if (error && isSchemaMissingError(error)) {
        return { rows: [], usingDefaults: false, schemaMissing: true };
      }

      const { data: products } = await supabase
        .from('products')
        .select('brand, brand_id')
        .eq('archived', false);

      const counts: Record<string, number> = {};
      for (const product of products ?? []) {
        const row = product as { brand: string | null; brand_id: string | null };
        if (row.brand_id) counts[row.brand_id] = (counts[row.brand_id] ?? 0) + 1;
        if (row.brand) {
          const key = `name:${row.brand.toLowerCase()}`;
          counts[key] = (counts[key] ?? 0) + 1;
        }
      }

      if (data && data.length > 0) {
        return {
          rows: (data as BrandWithCount[]).map((row) => ({
            ...row,
            product_count:
              (counts[row.id] ?? 0) + (counts[`name:${row.name.toLowerCase()}`] ?? 0),
          })),
          usingDefaults: false,
          schemaMissing: false,
        };
      }

      // Table exists but is empty: show the built-in vocabulary so the product
      // form has options straight away.
      return {
        rows: fallbackBrands.map((row) => ({ ...row, product_count: 0 })),
        usingDefaults: true,
        schemaMissing: false,
      };
    } catch (error) {
      console.error('brands page: falling back to defaults', error);
    }

    return { rows: [], usingDefaults: false, schemaMissing: false };
  }

  return {
    rows: fallbackBrands.map((row) => ({ ...row, product_count: 0 })),
    usingDefaults: true,
    schemaMissing: false,
  };
}

export default async function BrandsPage() {
  const { rows, usingDefaults, schemaMissing } = await loadBrands();

  return (
    <BrandsClient
      brands={rows}
      demoMode={!isSupabaseConfigured}
      usingDefaults={usingDefaults && isSupabaseConfigured}
      schemaMissing={schemaMissing}
    />
  );
}
