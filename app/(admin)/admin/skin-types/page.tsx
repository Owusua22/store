import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { demoProducts } from '@/lib/demo/catalog';
import { fallbackSkinTypes, type SkinTypeRow } from '@/lib/data/skin-types';
import SkinTypesClient, { type SkinTypeWithCount } from './SkinTypesClient';

export const dynamic = 'force-dynamic';

async function loadSkinTypes(): Promise<{ rows: SkinTypeWithCount[]; usingDefaults: boolean }> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data } = await supabase
        .from('skin_types')
        .select('*')
        .order('sort_order', { ascending: true });

      const { data: products } = await supabase
        .from('products')
        .select('skin_types')
        .eq('archived', false);

      const counts: Record<string, number> = {};
      for (const product of products ?? []) {
        for (const slug of (product.skin_types as string[] | null) ?? []) {
          counts[slug] = (counts[slug] ?? 0) + 1;
        }
      }

      if (data && data.length > 0) {
        return {
          rows: (data as SkinTypeRow[]).map((row) => ({
            ...row,
            product_count: counts[row.slug] ?? 0,
          })),
          usingDefaults: false,
        };
      }

      // Table exists but is empty: fall back to the built-in vocabulary so the
      // product form and storefront filters still work.
      return {
        rows: fallbackSkinTypes.map((row) => ({
          ...row,
          product_count: 0,
        })),
        usingDefaults: true,
      };
    } catch (error) {
      console.error('skin types page: falling back to defaults', error);
    }
  }

  if (isSupabaseConfigured) {
    return { rows: [], usingDefaults: false };
  }

  return {
    rows: fallbackSkinTypes.map((row) => ({
      ...row,
      product_count: demoProducts.filter((product) =>
        (product.skin_types ?? []).includes(row.slug)
      ).length,
    })),
    usingDefaults: !isSupabaseConfigured,
  };
}

export default async function SkinTypesPage() {
  const { rows, usingDefaults } = await loadSkinTypes();

  return (
    <SkinTypesClient
      skinTypes={rows}
      demoMode={!isSupabaseConfigured}
      usingDefaults={usingDefaults && isSupabaseConfigured}
    />
  );
}
