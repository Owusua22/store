// lib/data/brands.ts
// Product brands (Nivea, Vaseline, Johnson's Baby …). Brands live in their own
// table so the admin can add, rename and hide them exactly like categories, and
// so the storefront can filter by brand.

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { checkDatabaseHealth, logDatabaseError } from '@/lib/supabase/health';
import type { Brand } from '@/types';

export interface BrandRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  country: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export type BrandWithCount = BrandRow & { product_count: number };

/** Used in demo mode and when the brands table is empty, so filters still work. */
export const fallbackBrands: BrandRow[] = [
  { id: 'brand-nivea', name: 'Nivea', slug: 'nivea', description: null, logo_url: null, website_url: null, country: 'Germany', sort_order: 1, is_active: true },
  { id: 'brand-vaseline', name: 'Vaseline', slug: 'vaseline', description: null, logo_url: null, website_url: null, country: 'USA', sort_order: 2, is_active: true },
  { id: 'brand-johnsons-baby', name: "Johnson's Baby", slug: 'johnsons-baby', description: null, logo_url: null, website_url: null, country: 'USA', sort_order: 3, is_active: true },
  { id: 'brand-dove', name: 'Dove', slug: 'dove', description: null, logo_url: null, website_url: null, country: 'UK', sort_order: 4, is_active: true },
  { id: 'brand-baby-dove', name: 'Baby Dove', slug: 'baby-dove', description: null, logo_url: null, website_url: null, country: 'UK', sort_order: 5, is_active: true },
  { id: 'brand-simple', name: 'Simple', slug: 'simple', description: null, logo_url: null, website_url: null, country: 'UK', sort_order: 6, is_active: true },
  { id: 'brand-cetaphil', name: 'Cetaphil', slug: 'cetaphil', description: null, logo_url: null, website_url: null, country: 'Switzerland', sort_order: 7, is_active: true },
  { id: 'brand-cerave', name: 'CeraVe', slug: 'cerave', description: null, logo_url: null, website_url: null, country: 'USA', sort_order: 8, is_active: true },
  { id: 'brand-shea-moisture', name: 'Shea Moisture', slug: 'shea-moisture', description: null, logo_url: null, website_url: null, country: 'USA', sort_order: 9, is_active: true },
  { id: 'brand-dark-and-lovely', name: 'Dark & Lovely', slug: 'dark-and-lovely', description: null, logo_url: null, website_url: null, country: 'USA', sort_order: 10, is_active: true },
  { id: 'brand-palmolive', name: 'Palmolive', slug: 'palmolive', description: null, logo_url: null, website_url: null, country: 'Germany', sort_order: 11, is_active: true },
  { id: 'brand-garnier', name: 'Garnier', slug: 'garnier', description: null, logo_url: null, website_url: null, country: 'France', sort_order: 12, is_active: true },
];

function sortBrands(rows: BrandRow[]): BrandRow[] {
  return [...rows].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}

/**
 * Every active brand, for the storefront filter and the product form.
 * Live mode reads Postgres; demo mode (or an empty table) uses the built-in list.
 */
export async function getBrands(): Promise<BrandRow[]> {
  if (!isSupabaseConfigured) return sortBrands(fallbackBrands);

  const health = await checkDatabaseHealth();
  if (!health.initialized) return [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      logDatabaseError('getBrands', error);
      return [];
    }

    const rows = (data ?? []) as BrandRow[];
    if (rows.length > 0) return rows;
    return sortBrands(fallbackBrands);
  } catch (error) {
    logDatabaseError('getBrands', error);
    return [];
  }
}

/** Brand lookup by slug, used by /products?brand=… */
export async function getBrandBySlug(slug: string): Promise<BrandRow | null> {
  const brands = await getBrands();
  return brands.find((brand) => brand.slug === slug) ?? null;
}

export { brandSlug, brandHref } from '@/lib/brands';
export type { Brand };
