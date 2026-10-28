// lib/demo/catalog.ts
// Bundled skincare catalogue used when no Supabase project is configured.
// It keeps the storefront fully functional (browsing, search, cart, checkout)
// so the UI can be previewed and tested end-to-end.

import type { Category, Product } from '@/types';

const now = '2026-01-15T09:00:00.000Z';

export interface DemoCategory extends Category {
  image_url?: string | null;
}

function category(
  id: string,
  name: string,
  slug: string,
  icon: string,
  image: string,
  sort: number,
  description: string
): DemoCategory {
  return {
    id,
    name,
    slug,
    description,
    icon,
    image_url: `/images/products/${image}`,
    parent_id: null,
    is_active: true,
    archived: false,
    sort_order: sort,
    created_at: now,
    updated_at: now,
  };
}

export const demoCategories: DemoCategory[] = [
  category(
    'cat-facial',
    'Facial Skincare',
    'facial-skincare',
    '',
    'face-cream.webp',
    1,
    'Cleansers, serums, day creams and sunscreen for your face.'
  ),
  category(
    'cat-bath',
    'Bath & Body Care',
    'bath-body-care',
    '',
    'body-lotion.webp',
    2,
    'Body lotions, shower gels and body oils for soft, glowing skin.'
  ),
  category(
    'cat-mother',
    'Mothercare & Pregnancy',
    'mothercare-pregnancy',
    '',
    'baby-lotion.webp',
    3,
    'Stretch-mark creams, nipple balms and post-partum care for mums.'
  ),
  category(
    'cat-baby',
    'Baby Care Essentials',
    'baby-care-essentials',
    '',
    'baby-diapers.webp',
    4,
    'Gentle washes, lotions and diapers for newborns and toddlers.'
  ),
  category(
    'cat-hair',
    'Haircare',
    'haircare',
    '',
    'shampoo.webp',
    5,
    'Shampoos and conditioners for naturals, braids and relaxed hair.'
  ),
  category(
    'cat-bundles',
    'Bundles & Offers',
    'bundles-offers',
    '',
    'serum.webp',
    6,
    'Money-saving bundles and this week’s markdowns.'
  ),
];


interface ProductSeed {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  compareAt: number | null;
  stock: number;
  image: string;
  description: string;
  rating: number;
  reviews: number;
  sold: number;
  options?: string[];
  badge?: string | null;
}

const seeds: ProductSeed[] = [
  {
    id: 'p-body-lotion-shea',
    name: 'Shea Butter Body Lotion 400ml',
    slug: 'shea-butter-body-lotion-400ml',
    category: 'cat-bath',
    price: 79,
    compareAt: 120,
    stock: 64,
    image: 'body-lotion.webp',
    rating: 4.9,
    reviews: 218,
    sold: 940,
    options: ['400ml', '750ml'],
    badge: 'Best seller',
    description:
      'A rich, fast-absorbing shea butter body lotion that locks in moisture for 24 hours. Perfect for dry, ashy skin in harmattan and everyday glow.',
  },
  {
    id: 'p-body-lotion-cocoa',
    name: 'Cocoa Glow Body Lotion 500ml',
    slug: 'cocoa-glow-body-lotion-500ml',
    category: 'cat-bath',
    price: 95,
    compareAt: 140,
    stock: 40,
    image: 'body-lotion.webp',
    rating: 4.7,
    reviews: 132,
    sold: 520,
    options: ['500ml'],
    badge: null,
    description:
      'Cocoa butter and vitamin E blend that visibly evens skin tone while leaving a soft, luminous finish. Dermatologist tested, non-greasy.',
  },
  {
    id: 'p-body-oil-bright',
    name: 'Brightening Body Oil 200ml',
    slug: 'brightening-body-oil-200ml',
    category: 'cat-bath',
    price: 99,
    compareAt: 135,
    stock: 33,
    image: 'serum.webp',
    rating: 4.8,
    reviews: 96,
    sold: 311,
    options: ['200ml'],
    badge: null,
    description:
      'A lightweight glow oil with carrot seed, shea and vitamin E. Use a few drops after bathing for a lit-from-within finish.',
  },
  {
    id: 'p-face-serum-vitc',
    name: 'Vitamin C Glow Serum 30ml',
    slug: 'vitamin-c-glow-serum-30ml',
    category: 'cat-facial',
    price: 149,
    compareAt: 220,
    stock: 28,
    image: 'serum.webp',
    rating: 4.9,
    reviews: 174,
    sold: 760,
    options: ['30ml'],
    badge: 'Hot',
    description:
      '10% stabilised vitamin C with niacinamide to fade dark spots, boost radiance and protect against daily pollution.',
  },
  {
    id: 'p-face-serum-hydra',
    name: 'Hyaluronic Hydra Serum 30ml',
    slug: 'hyaluronic-hydra-serum-30ml',
    category: 'cat-facial',
    price: 139,
    compareAt: 199,
    stock: 25,
    image: 'serum.webp',
    rating: 4.8,
    reviews: 88,
    sold: 240,
    options: ['30ml'],
    badge: null,
    description:
      'Triple-weight hyaluronic acid floods skin with moisture for a plump, dewy look. Layers beautifully under SPF and makeup.',
  },
  {
    id: 'p-face-cream-hydra',
    name: 'Hydra Boost Face Cream 50g',
    slug: 'hydra-boost-face-cream-50g',
    category: 'cat-facial',
    price: 129,
    compareAt: 180,
    stock: 42,
    image: 'face-cream.webp',
    rating: 4.8,
    reviews: 143,
    sold: 610,
    options: ['50g'],
    badge: 'New',
    description:
      'A silky day cream with ceramides and aloe that strengthens the skin barrier and keeps makeup flawless all day.',
  },
  {
    id: 'p-face-cream-night',
    name: 'Night Repair Face Cream 50g',
    slug: 'night-repair-face-cream-50g',
    category: 'cat-facial',
    price: 159,
    compareAt: 210,
    stock: 19,
    image: 'face-cream.webp',
    rating: 4.7,
    reviews: 74,
    sold: 180,
    options: ['50g'],
    badge: null,
    description:
      'Overnight recovery cream with shea butter, peptide complex and Vitamin B3 for smoother, firmer morning skin.',
  },
  {
    id: 'p-face-wash-foam',
    name: 'Gentle Foam Face Wash 150ml',
    slug: 'gentle-foam-face-wash-150ml',
    category: 'cat-facial',
    price: 69,
    compareAt: 95,
    stock: 71,
    image: 'face-wash.webp',
    rating: 4.6,
    reviews: 120,
    sold: 480,
    options: ['150ml'],
    badge: null,
    description:
      'Soap-free, pH-balanced foaming cleanser with aloe and green tea. Removes sunscreen and oil without that tight feeling.',
  },
  {
    id: 'p-face-wash-charcoal',
    name: 'Charcoal Detox Face Wash 150ml',
    slug: 'charcoal-detox-face-wash-150ml',
    category: 'cat-facial',
    price: 75,
    compareAt: 99,
    stock: 55,
    image: 'face-wash.webp',
    rating: 4.5,
    reviews: 65,
    sold: 210,
    options: ['150ml'],
    badge: null,
    description:
      'Activated charcoal and salicylic acid cleanse deep into pores to reduce breakouts and shine. Gentle enough for daily use.',
  },
  {
    id: 'p-shampoo-argan',
    name: 'Nourishing Argan Shampoo 500ml',
    slug: 'nourishing-argan-shampoo-500ml',
    category: 'cat-hair',
    price: 89,
    compareAt: 120,
    stock: 58,
    image: 'shampoo.webp',
    rating: 4.7,
    reviews: 156,
    sold: 700,
    options: ['500ml', '1L'],
    badge: 'Best seller',
    description:
      'Sulphate-free argan oil shampoo that gently cleanses braids, naturals and relaxed hair while reducing breakage.',
  },
  {
    id: 'p-conditioner-silk',
    name: 'Silk Smooth Conditioner 500ml',
    slug: 'silk-smooth-conditioner-500ml',
    category: 'cat-hair',
    price: 85,
    compareAt: 115,
    stock: 47,
    image: 'conditioner.webp',
    rating: 4.6,
    reviews: 92,
    sold: 330,
    options: ['500ml'],
    badge: null,
    description:
      'Deep-conditioning formula with silk protein and shea that detangles, softens and adds slip for easier styling.',
  },
  {
    id: 'p-shower-gel-refresh',
    name: 'Refreshing Shower Gel 750ml',
    slug: 'refreshing-shower-gel-750ml',
    category: 'cat-bath',
    price: 75,
    compareAt: 110,
    stock: 88,
    image: 'shower-gel.webp',
    rating: 4.8,
    reviews: 190,
    sold: 860,
    options: ['750ml'],
    badge: null,
    description:
      'A fresh citrus-mint body wash that lathers richly and rinses clean. pH-balanced so skin never feels dry.',
  },
  {
    id: 'p-shower-gel-shea',
    name: 'Shea Shower Cream 750ml',
    slug: 'shea-shower-cream-750ml',
    category: 'cat-bath',
    price: 82,
    compareAt: 115,
    stock: 36,
    image: 'shower-gel.webp',
    rating: 4.7,
    reviews: 84,
    sold: 260,
    options: ['750ml'],
    badge: null,
    description:
      'Creamy shea-based body wash for very dry skin. Cleanses gently while leaving a soft, comforted finish.',
  },
  {
    id: 'p-baby-lotion',
    name: 'Baby Soft Lotion 400ml',
    slug: 'baby-soft-lotion-400ml',
    category: 'cat-baby',
    price: 65,
    compareAt: 90,
    stock: 62,
    image: 'baby-lotion.webp',
    rating: 4.9,
    reviews: 205,
    sold: 910,
    options: ['400ml'],
    badge: 'Mum favourite',
    description:
      'Paediatrician-tested baby lotion with shea and calendula. Fragrance-free, gentle on newborn skin and perfect for daily massage.',
  },
  {
    id: 'p-baby-diapers',
    name: 'Baby Diapers Jumbo Pack (60pcs)',
    slug: 'baby-diapers-jumbo-pack-60pcs',
    category: 'cat-baby',
    price: 135,
    compareAt: 180,
    stock: 74,
    image: 'baby-diapers.webp',
    rating: 4.8,
    reviews: 311,
    sold: 1420,
    options: ['Size 2', 'Size 3', 'Size 4'],
    badge: 'Bulk deal',
    description:
      'Ultra-soft, super-absorbent diapers with a wetness indicator and breathable back sheet. Up to 12 hours of dryness for happy nights.',
  },
  {
    id: 'p-baby-wash',
    name: 'Baby Bath & Shampoo 500ml',
    slug: 'baby-bath-shampoo-500ml',
    category: 'cat-baby',
    price: 59,
    compareAt: 85,
    stock: 51,
    image: 'baby-lotion.webp',
    rating: 4.7,
    reviews: 98,
    sold: 340,
    options: ['500ml'],
    badge: null,
    description:
      'Tear-free two-in-one wash for hair and body. Mild surfactants lift dirt and cradle cap without stinging little eyes.',
  },
  {
    id: 'p-mother-stretch-cream',
    name: 'Mother Care Stretch Mark Cream 200ml',
    slug: 'mother-care-stretch-mark-cream-200ml',
    category: 'cat-mother',
    price: 119,
    compareAt: 160,
    stock: 38,
    image: 'baby-lotion.webp',
    rating: 4.8,
    reviews: 64,
    sold: 210,
    options: ['200ml'],
    badge: 'New',
    description:
      'Cocoa butter, shea and vitamin E cream for the belly, hips and thighs through pregnancy and after. Fragrance-light and safe for breastfeeding mums.',
  },
  {
    id: 'p-bundle-hospital-bag',
    name: 'Hospital Bag Bundle (Mum & Baby)',
    slug: 'hospital-bag-bundle-mum-and-baby',
    category: 'cat-bundles',
    price: 399,
    compareAt: 520,
    stock: 15,
    image: 'baby-lotion.webp',
    rating: 4.9,
    reviews: 41,
    sold: 96,
    options: ['5-piece set'],
    badge: 'Bundle',
    description:
      'Everything on the hospital bag checklist in one box: stretch-mark cream, baby lotion, tear-free baby wash, a 60-piece diaper pack and maternity pads.',
  },
  {
    id: 'p-sunscreen-spf50',
    name: 'Daily Sunscreen SPF 50 100ml',
    slug: 'daily-sunscreen-spf-50-100ml',
    category: 'cat-facial',
    price: 119,
    compareAt: 160,
    stock: 45,
    image: 'face-wash.webp',
    rating: 4.8,
    reviews: 121,
    sold: 430,
    options: ['100ml'],
    badge: null,
    description:
      'Broad-spectrum SPF 50 PA++++ with no white cast. Lightweight, non-greasy and made for daily wear in strong sun.',
  },
  {
    id: 'p-aloe-gel',
    name: 'Aloe Soothing Gel 200ml',
    slug: 'aloe-soothing-gel-200ml',
    category: 'cat-facial',
    price: 55,
    compareAt: 79,
    stock: 96,
    image: 'shower-gel.webp',
    rating: 4.6,
    reviews: 70,
    sold: 280,
    options: ['200ml'],
    badge: null,
    description:
      'Cooling 98% aloe vera gel for sunburn, shaving irritation and everyday hydration. Absorbs fast and never feels sticky.',
  },
];


/**
 * Skin care attributes kept out of the seed list above so the list stays
 * readable. Keyed by product id.
 */
const EXTRAS: Record<
  string,
  {
    skinTypes: string[];
    concerns: string[];
    ingredients: string;
    howTo: string;
    benefits: string;
    brand?: string;
  }
> = {
  'p-body-lotion-shea': {
    skinTypes: ['dry', 'normal', 'sensitive'],
    concerns: ['dryness', 'dullness'],
    ingredients: 'Shea butter, cocoa butter, vitamin E, glycerin',
    howTo: 'Smooth over damp skin after bathing, morning and night.',
    benefits: 'Deep hydration, softer skin, less ashiness',
  },
  'p-body-lotion-cocoa': {
    skinTypes: ['normal', 'dry'],
    concerns: ['uneven-tone', 'dryness'],
    ingredients: 'Cocoa butter, vitamin E, niacinamide',
    howTo: 'Massage into clean, dry skin daily, focusing on dry patches.',
    benefits: 'Even tone, luminous finish, non-greasy',
  },
  'p-body-oil-bright': {
    skinTypes: ['normal', 'dry', 'combination'],
    concerns: ['dullness', 'uneven-tone'],
    ingredients: 'Carrot seed oil, shea oil, vitamin E',
    howTo: 'Add a few drops to damp skin after bathing.',
    benefits: 'Lit-from-within glow, soft texture',
  },
  'p-face-serum-vitc': {
    skinTypes: ['combination', 'normal', 'oily'],
    concerns: ['dark-spots', 'dullness', 'uneven-tone'],
    ingredients: '10% vitamin C, niacinamide 4%, hyaluronic acid',
    howTo: 'Apply 3–4 drops in the morning before moisturiser and SPF.',
    benefits: 'Brighter tone, fewer dark spots, antioxidant protection',
  },
  'p-face-serum-hydra': {
    skinTypes: ['dry', 'normal', 'sensitive'],
    concerns: ['dryness'],
    ingredients: 'Triple-weight hyaluronic acid, panthenol, glycerin',
    howTo: 'Apply to damp skin morning and night, then seal with cream.',
    benefits: 'Plump, dewy skin, reduced tightness',
  },
  'p-face-cream-hydra': {
    skinTypes: ['dry', 'normal', 'sensitive'],
    concerns: ['dryness', 'sensitivity'],
    ingredients: 'Ceramides, aloe vera, squalane, glycerin',
    howTo: 'Apply to face and neck each morning after serum.',
    benefits: 'Stronger barrier, all-day hydration',
  },
  'p-face-cream-night': {
    skinTypes: ['dry', 'normal'],
    concerns: ['ageing', 'dryness'],
    ingredients: 'Shea butter, peptide complex, vitamin B3',
    howTo: 'Apply a generous layer at night as the last step.',
    benefits: 'Smoother, firmer morning skin',
  },
  'p-face-wash-foam': {
    skinTypes: ['normal', 'dry', 'sensitive', 'combination'],
    concerns: ['sensitivity', 'dullness'],
    ingredients: 'Aloe vera, green tea, amino-acid surfactants',
    howTo: 'Massage onto damp skin morning and night, rinse with lukewarm water.',
    benefits: 'Cleans without stripping, calm skin',
  },
  'p-face-wash-charcoal': {
    skinTypes: ['oily', 'combination', 'acne-prone'],
    concerns: ['acne', 'dullness'],
    ingredients: 'Activated charcoal, salicylic acid, tea tree',
    howTo: 'Use once or twice daily on oily areas, then moisturise.',
    benefits: 'Fewer breakouts, less shine, clearer pores',
  },
  'p-shampoo-argan': {
    skinTypes: ['normal', 'dry'],
    concerns: ['dryness'],
    ingredients: 'Argan oil, glycerin, panthenol',
    howTo: 'Massage into wet scalp and lengths, then rinse well.',
    benefits: 'Gentle cleanse, less breakage',
    brand: 'Shea Moisture',
  },
  'p-conditioner-silk': {
    skinTypes: ['normal', 'dry'],
    concerns: ['dryness'],
    ingredients: 'Silk protein, shea butter, glycerin',
    howTo: 'Apply to mid-lengths and ends, leave 2–3 minutes, rinse.',
    benefits: 'Detangled, soft, shiny hair',
    brand: 'Dove',
  },
  'p-shower-gel-refresh': {
    skinTypes: ['normal', 'oily', 'combination'],
    concerns: ['dullness'],
    ingredients: 'Citrus extract, mint, glycerin',
    howTo: 'Lather onto a sponge or hands, wash and rinse.',
    benefits: 'Fresh, clean skin that never feels dry',
  },
  'p-shower-gel-shea': {
    skinTypes: ['dry', 'sensitive'],
    concerns: ['dryness'],
    ingredients: 'Shea butter, glycerin, oat extract',
    howTo: 'Massage over damp skin and rinse with lukewarm water.',
    benefits: 'Comforted, soft skin after every shower',
  },
  'p-baby-lotion': {
    skinTypes: ['sensitive'],
    concerns: ['dryness', 'sensitivity'],
    ingredients: 'Shea butter, calendula, glycerin (fragrance-free)',
    howTo: 'Apply within 3 minutes of bathing, morning and night.',
    benefits: 'Gentle moisture, calm skin, safe for newborns',
    brand: "Johnson's Baby",
  },
  'p-baby-diapers': {
    skinTypes: ['sensitive'],
    concerns: ['sensitivity'],
    ingredients: 'Soft non-woven top sheet, absorbent pulp, breathable back sheet',
    howTo: 'Change after each feed or when soiled.',
    benefits: 'Fewer leaks, dry nights, gentle on skin',
    brand: 'Glow-Up',
  },
  'p-baby-wash': {
    skinTypes: ['sensitive'],
    concerns: ['sensitivity'],
    ingredients: 'Tear-free surfactants, calendula, glycerin',
    howTo: 'Add a small amount to bath water or lather on hair and body, then rinse.',
    benefits: 'No tears, gentle cleanse',
    brand: "Johnson's Baby",
  },
  'p-mother-stretch-cream': {
    skinTypes: ['dry', 'sensitive', 'normal'],
    concerns: ['dryness'],
    ingredients: 'Cocoa butter, shea butter, vitamin E, squalane',
    howTo: 'Massage into the belly, hips and thighs twice a day from the second trimester.',
    benefits: 'Improves elasticity, soothes itchy stretching skin',
    brand: 'Glow-Up',
  },
  'p-sunscreen-spf50': {
    skinTypes: ['normal', 'dry', 'oily', 'combination', 'sensitive'],
    concerns: ['sun-protection', 'dark-spots'],
    ingredients: 'SPF 50 filters, niacinamide, vitamin E',
    howTo: 'Apply generously 15 minutes before sun exposure. Reapply every 2 hours.',
    benefits: 'No white cast, broad-spectrum protection',
  },
  'p-aloe-gel': {
    skinTypes: ['sensitive', 'oily', 'normal'],
    concerns: ['sensitivity', 'sun-protection'],
    ingredients: '98% aloe vera, cucumber, panthenol',
    howTo: 'Apply a thin layer to irritated or sun-exposed skin as needed.',
    benefits: 'Cooling relief, fast-absorbing hydration',
  },
};


/** Who each product is for + what it costs us — mirrors `who_for`/`cost_price`. */
const PRODUCT_META: Record<string, { whoFor: string; cost: number }> = {
  'p-body-lotion-shea': { whoFor: 'Dry, ashy and very dry skin', cost: 52 },
  'p-body-lotion-cocoa': { whoFor: 'Dull skin that needs a glow', cost: 46 },
  'p-body-oil-bright': { whoFor: 'Dry skin and uneven tone', cost: 58 },
  'p-face-serum-vitc': { whoFor: 'Dull skin, dark spots, uneven tone', cost: 96 },
  'p-face-serum-hydra': { whoFor: 'Dehydrated and combination skin', cost: 78 },
  'p-face-cream-hydra': { whoFor: 'Dry, sensitive and combination skin', cost: 84 },
  'p-face-cream-night': { whoFor: 'Dry and mature skin', cost: 88 },
  'p-face-wash-foam': { whoFor: 'All skin types, including sensitive', cost: 44 },
  'p-face-wash-charcoal': { whoFor: 'Oily and blemish-prone skin', cost: 47 },
  'p-shampoo-argan': { whoFor: 'Braids, naturals, relaxed or fine hair', cost: 57 },
  'p-conditioner-silk': { whoFor: 'Dry, knotty or heat-styled hair', cost: 55 },
  'p-shower-gel-refresh': { whoFor: 'Normal to oily skin', cost: 38 },
  'p-shower-gel-shea': { whoFor: 'Dry and sensitive skin', cost: 42 },
  'p-baby-lotion': { whoFor: 'Newborns 0+ months and sensitive skin', cost: 38 },
  'p-baby-diapers': { whoFor: 'Newborns and toddlers (sizes 2–4)', cost: 92 },
  'p-baby-wash': { whoFor: 'Babies and children 0+ months', cost: 35 },
  'p-mother-stretch-cream': { whoFor: 'Expectant and breastfeeding mothers', cost: 74 },
  'p-sunscreen-spf50': { whoFor: 'Every skin type, daily sun protection', cost: 58 },
  'p-aloe-gel': { whoFor: 'Sensitive, sun-exposed or irritated skin', cost: 32 },
  'p-bundle-hospital-bag': { whoFor: 'Expectant mothers from 34 weeks', cost: 268 },
};

export const demoProducts: Product[] = seeds.map((seed, index) => {
  const cat = demoCategories.find((c) => c.id === seed.category);
  const thumbnail = `/images/products/${seed.image}`;

  const extra = EXTRAS[seed.id];

  return {
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    description: seed.description,
    short_description: seed.description.slice(0, 90),
    price: seed.price,
    compare_at_price: seed.compareAt,
    stock_quantity: seed.stock,
    category_id: seed.category,
    who_for: PRODUCT_META[seed.id]?.whoFor ?? null,
    cost_price: PRODUCT_META[seed.id]?.cost ?? Math.round(seed.price * 0.65),
    brand: extra?.brand ?? 'Glow-Up',
    skin_types: extra?.skinTypes ?? ['normal'],
    concerns: extra?.concerns ?? [],
    ingredients: extra?.ingredients ?? null,
    how_to_use: extra?.howTo ?? null,
    benefits: extra?.benefits ?? null,
    images: [thumbnail],
    thumbnail,
    sizes: seed.options ?? [],
    colors: [],
    rating: seed.rating,
    reviews_count: seed.reviews,
    sold_count: seed.sold,
    is_featured: Boolean(seed.badge),
    is_active: true,
    archived: false,
    metadata: {
      rating: seed.rating,
      reviews: seed.reviews,
      sold: seed.sold,
      badge: seed.badge,
      brand: extra?.brand ?? 'Glow-Up',
    },
    created_at: new Date(Date.UTC(2026, 0, 15 - index)).toISOString(),
    updated_at: now,
    category: cat ? { ...cat } : undefined,
  };
});

export const demoBanners = [
  {
    id: 'banner-shelf',
    title: 'The shelf, this week',
    subtitle: null,
    description: null,
    image_url: '/images/banners/banner-1.webp',
    link_url: '/products',
    link_text: null,
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'banner-shea',
    title: 'Shea, by the jar',
    subtitle: null,
    description: null,
    image_url: '/images/banners/banner-2.webp',
    link_url: '/categories/bath-body-care',
    link_text: null,
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'banner-baby',
    title: 'For the new arrival',
    subtitle: null,
    description: null,
    image_url: '/images/banners/banner-3.webp',
    link_url: '/categories/baby-care-essentials',
    link_text: null,
    is_active: true,
    sort_order: 3,
  },
];

export const demoShowrooms = [
  {
    id: 'showroom-deals',
    name: 'Mega Deals',
    slug: 'mega-deals',
    description: 'Limited-time savings on your everyday essentials.',
    icon: '',
    type: 'auto_deals',
    sort_order: 1,
    show_on_homepage: true,
    max_products: 8,
    products: [] as Product[],
  },
  {
    id: 'showroom-new',
    name: 'New Arrivals',
    slug: 'new-arrivals',
    description: 'Fresh drops from Glow-Up.',
    icon: '',
    type: 'auto_new',
    sort_order: 2,
    show_on_homepage: true,
    max_products: 8,
    products: [] as Product[],
  },
];

export function findDemoProduct(slug: string) {
  return demoProducts.find((p) => p.slug === slug) ?? null;
}

export function findDemoCategory(slug: string) {
  return demoCategories.find((c) => c.slug === slug) ?? null;
}

export function searchDemoProducts(query: string, limit = 8) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  return demoProducts
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        (p.category?.name ?? '').toLowerCase().includes(q)
    )
    .slice(0, limit);
}
