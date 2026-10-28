// lib/data/delivery.ts
// Delivery zones for the public /location page and checkout. Reads Supabase in
// live mode and the bundled Ghana list in demo mode.

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { checkDatabaseHealth, logDatabaseError } from '@/lib/supabase/health';
import { mapShippingZones } from '@/lib/shipping/zones';
import { demoShippingZones } from '@/lib/demo/shipping';

export interface DeliveryZone {
  id: string;
  region: string;
  town: string;
  shipping_fee: number;
  estimated_days_min: number;
  estimated_days_max: number;
}

function normalise(
  rows: Array<{
    id: string;
    region: string;
    town: string;
    name?: string | null;
    shipping_fee: number | string;
    estimated_days_min: number;
    estimated_days_max: number;
    sort_order?: number;
  }>
): DeliveryZone[] {
  return rows
    .map((row) => ({
      id: row.id,
      region: row.region,
      town: row.name || row.town,
      shipping_fee: Number(row.shipping_fee) || 0,
      estimated_days_min: Number(row.estimated_days_min) || 0,
      estimated_days_max: Number(row.estimated_days_max) || 0,
    }))
    .sort(
      (a, b) =>
        a.region.localeCompare(b.region) ||
        a.town.localeCompare(b.town, undefined, { sensitivity: 'base' })
    );
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  if (!isSupabaseConfigured) {
    return normalise(
      demoShippingZones.map((zone) => ({ ...zone, name: zone.town })) as never
    );
  }

  const health = await checkDatabaseHealth();
  if (!health.initialized) return [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('shipping_zones')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      logDatabaseError('getDeliveryZones', error);
      return [];
    }

    return normalise(mapShippingZones(data ?? []) as never);
  } catch (error) {
    logDatabaseError('getDeliveryZones', error);
    return [];
  }
}
