// lib/shipping/zones.ts
// One canonical shape for shipping zones across the admin UI, checkout and API.
//
// Canonical columns: country, region, town, shipping_fee, free_over_amount,
// estimated_days_min/max. The admin UI and checkout also read `name` and
// `free_shipping_threshold`, so responses expose both spellings.

export interface ShippingZoneRow {
  id: string;
  name?: string | null;
  country: string;
  region: string;
  town: string;
  postal_code_prefix?: string | null;
  shipping_fee: number | string;
  free_over_amount?: number | string | null;
  free_shipping_threshold?: number | string | null;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
  sort_order: number;
}

/** Adds the legacy aliases the UI reads without losing the real columns. */
export function mapShippingZone<T extends object>(row: T) {
  const zone = row as unknown as ShippingZoneRow;
  const threshold = zone.free_over_amount ?? zone.free_shipping_threshold ?? null;

  return {
    ...zone,
    name: zone.name || zone.town,
    free_over_amount: threshold,
    free_shipping_threshold: threshold,
  };
}

export function mapShippingZones<T extends object>(rows: T[] | null | undefined) {
  return (rows ?? []).map((row) => mapShippingZone(row));
}
