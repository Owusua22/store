import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { demoProducts } from '@/lib/demo/catalog';
import { fallbackSkinTypes, type SkinTypeRow } from '@/lib/data/skin-types';
import SkinTypesClient, { type SkinTypeWithCount } from './SkinTypesClient';

export const dynamic = 'force-dynamic';

async function loadSkinTypes(): Promise<SkinTypeWithCount[]> {
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
        return (data as SkinTypeRow[]).map((row) => ({
          ...row,
          product_count: counts[row.slug] ?? 0,
        }));
      }
    } catch (error) {
      console.error('skin types page: falling back to defaults', error);
    }
  }

  return fallbackSkinTypes.map((row) => ({
    ...row,
    product_count: demoProducts.filter((product) =>
      (product.skin_types ?? []).includes(row.slug)
    ).length,
  }));
}

export default async function SkinTypesPage() {
  const skinTypes = await loadSkinTypes();

  return <SkinTypesClient skinTypes={skinTypes} demoMode={!isSupabaseConfigured} />;
}
