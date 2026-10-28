// lib/admin/brands.ts
// Server helpers for the brands vocabulary. Used by the admin API and by the
// product create/update routes so typing a new brand in the product form
// automatically adds it to /admin/brands (like categories).

import type { SupabaseClient } from '@supabase/supabase-js';
import { slugify, uniqueSlug } from '@/lib/admin/guard';

export interface ResolvedBrand {
  brand: string | null;
  brand_id: string | null;
  /** True when the brand row was created by this call. */
  created: boolean;
}

/**
 * Map a typed brand name to a `brands` row, creating it when missing.
 * Never throws: if the brands table does not exist yet (old schema) the product
 * still saves with the plain text brand.
 */
export async function resolveBrand(
  db: SupabaseClient,
  name: string | null | undefined
): Promise<ResolvedBrand> {
  const cleaned = (name ?? '').trim();
  if (!cleaned) return { brand: null, brand_id: null, created: false };

  try {
    const { data: existing, error } = await db
      .from('brands')
      .select('id, name')
      .ilike('name', cleaned)
      .limit(1)
      .maybeSingle();

    if (error) return { brand: cleaned, brand_id: null, created: false };
    if (existing) {
      return {
        brand: (existing as { name: string }).name,
        brand_id: (existing as { id: string }).id,
        created: false,
      };
    }

    const slug = await uniqueSlug(db, 'brands', slugify(cleaned) || `brand-${Date.now()}`);
    const { data: inserted, error: insertError } = await db
      .from('brands')
      .insert({ name: cleaned, slug })
      .select('id, name')
      .single();

    if (insertError || !inserted) {
      // Most likely a duplicate racing insert — fall back to the text field.
      return { brand: cleaned, brand_id: null, created: false };
    }

    return {
      brand: (inserted as { name: string }).name,
      brand_id: (inserted as { id: string }).id,
      created: true,
    };
  } catch {
    return { brand: cleaned, brand_id: null, created: false };
  }
}
