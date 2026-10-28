// lib/data/skin-types.ts
// Skin type vocabulary: Supabase first, static fallback in demo mode.

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { SKIN_TYPES } from '@/lib/skin-types';
import { checkDatabaseHealth, logDatabaseError } from '@/lib/supabase/health';

export interface SkinTypeRow {
  id: string;
  slug: string;
  label: string;
  emoji: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export const fallbackSkinTypes: SkinTypeRow[] = SKIN_TYPES.map((type, index) => ({
  id: `skin-${type.value}`,
  slug: type.value,
  label: type.label,
  emoji: '',
  description: null,
  sort_order: index + 1,
  is_active: true,
}));

export async function getSkinTypes(options: { includeInactive?: boolean } = {}) {
  if (isSupabaseConfigured) {
    const health = await checkDatabaseHealth();
    if (!health.initialized) {
      return options.includeInactive
        ? fallbackSkinTypes
        : fallbackSkinTypes.filter((type) => type.is_active);
    }

    try {
      const supabase = await createServerSupabaseClient();
      let query = supabase
        .from('skin_types')
        .select('id, slug, label, emoji, description, sort_order, is_active')
        .order('sort_order', { ascending: true });

      if (!options.includeInactive) query = query.eq('is_active', true);

      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as SkinTypeRow[];
    } catch (error) {
      logDatabaseError('getSkinTypes', error);
    }
  }

  return options.includeInactive
    ? fallbackSkinTypes
    : fallbackSkinTypes.filter((type) => type.is_active);
}
