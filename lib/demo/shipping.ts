// lib/demo/shipping.ts
// Ghana shipping zones used when no Supabase project is configured.

export interface DemoShippingZone {
  id: string;
  country: string;
  region: string;
  town: string;
  shipping_fee: number;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
  sort_order: number;
}

const ZONE_SEED: Array<[string, string, number, number, number]> = [
  // Local: same-day around the shop
  ['Eastern', 'East Doboro (pickup at shop)', 0, 0, 0],
  ['Eastern', 'Doboro', 10, 0, 1],
  ['Eastern', 'Nsawam', 15, 0, 1],
  ['Eastern', 'Adoagyiri', 15, 0, 1],
  ['Eastern', 'Nsawam Market', 15, 0, 1],
  ['Eastern', 'Koforidua', 35, 1, 2],
  ['Greater Accra', 'Accra Central', 25, 1, 2],
  ['Greater Accra', 'East Legon', 25, 1, 2],
  ['Greater Accra', 'Madina', 25, 1, 2],
  ['Greater Accra', 'Tema', 30, 1, 2],
  ['Greater Accra', 'Kasoa', 35, 1, 3],
  ['Greater Accra', 'Adenta', 30, 1, 2],
  ['Ashanti', 'Kumasi', 35, 1, 3],
  ['Ashanti', 'Obuasi', 40, 2, 3],
  ['Western', 'Takoradi', 40, 2, 4],
  ['Central', 'Cape Coast', 40, 2, 4],
  ['Northern', 'Tamale', 50, 3, 5],
];

export const demoShippingZones: DemoShippingZone[] = ZONE_SEED.map(
  ([region, town, fee, min, max], index) => ({
    id: `demo-zone-${index + 1}`,
    country: 'Ghana',
    region,
    town,
    shipping_fee: fee,
    estimated_days_min: min,
    estimated_days_max: max,
    is_active: true,
    sort_order: index + 1,
  })
);
