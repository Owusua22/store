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
    'cat-body',
    'Body Lotions',
    'body-lotions',
    '🧴',
    'body-lotion.jpg',
    1,
    'Shea, cocoa and vitamin-rich body lotions for soft, glowing skin all day.'
  ),
  category(
    'cat-face',
    'Face Care',
    'face-care',
    '✨',
    'face-cream.jpg',
    2,
    'Creams, serums and treatments that hydrate, brighten and protect.'
  ),
  category(
    'cat-hair',
    'Hair Care',
    'hair-care',
    '💆🏽‍♀️',
    'shampoo.jpg',
    3,
    'Nourishing shampoos and conditioners for strong, silky hair.'
  ),
  category(
    'cat-shower',
    'Shower Gels',
    'shower-gels',
    '🚿',
    'shower-gel.jpg',
    4,
    'Refreshing, pH-balanced body washes for a clean, soft finish.'
  ),
  category(
    'cat-baby',
    'Baby Care',
    'baby-care',
    '🍼',
    'baby-diapers.jpg',
    5,
    'Gentle baby lotions, washes and diapers trusted by Ghanaian mums.'
  ),
  category(
    'cat-serums',
    'Serums & Oils',
    'serums-oils',
    '💧',
    'serum.jpg',
    6,
    'Vitamin C, hyaluronic and glow oils for targeted skin results.'
  ),
  category(
    'cat-wash',
    'Face Wash',
    'face-wash',
    '🫧',
    'face-wash.jpg',
    7,
    'Everyday cleansers that remove dirt without stripping moisture.'
  ),
  category(
    'cat-sun',
    'Sun Care',
    'sun-care',
    '🌤️',
    'sunscreen.jpg',
    8,
    'SPF protection and after-sun soothers for the Ghanaian sun.'
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
    category: 'cat-body',
    price: 79,
    compareAt: 120,
    stock: 64,
    image: 'body-lotion.jpg',
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
    category: 'cat-body',
    price: 95,
    compareAt: 140,
    stock: 40,
    image: 'body-lotion.jpg',
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
    category: 'cat-serums',
    price: 99,
    compareAt: 135,
    stock: 33,
    image: 'serum.jpg',
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
    category: 'cat-serums',
    price: 149,
    compareAt: 220,
    stock: 28,
    image: 'serum.jpg',
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
    category: 'cat-serums',
    price: 139,
    compareAt: 199,
    stock: 25,
    image: 'serum.jpg',
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
    category: 'cat-face',
    price: 129,
    compareAt: 180,
    stock: 42,
    image: 'face-cream.jpg',
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
    category: 'cat-face',
    price: 159,
    compareAt: 210,
    stock: 19,
    image: 'face-cream.jpg',
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
    category: 'cat-wash',
    price: 69,
    compareAt: 95,
    stock: 71,
    image: 'face-wash.jpg',
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
    category: 'cat-wash',
    price: 75,
    compareAt: 99,
    stock: 55,
    image: 'face-wash.jpg',
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
    image: 'shampoo.jpg',
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
    image: 'conditioner.jpg',
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
    category: 'cat-shower',
    price: 75,
    compareAt: 110,
    stock: 88,
    image: 'shower-gel.jpg',
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
    category: 'cat-shower',
    price: 82,
    compareAt: 115,
    stock: 36,
    image: 'shower-gel.jpg',
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
    image: 'baby-lotion.jpg',
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
    image: 'baby-diapers.jpg',
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
    image: 'baby-lotion.jpg',
    rating: 4.7,
    reviews: 98,
    sold: 340,
    options: ['500ml'],
    badge: null,
    description:
      'Tear-free two-in-one wash for hair and body. Mild surfactants lift dirt and cradle cap without stinging little eyes.',
  },
  {
    id: 'p-sunscreen-spf50',
    name: 'Daily Sunscreen SPF 50 100ml',
    slug: 'daily-sunscreen-spf-50-100ml',
    category: 'cat-sun',
    price: 119,
    compareAt: 160,
    stock: 45,
    image: 'face-wash.jpg',
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
    category: 'cat-sun',
    price: 55,
    compareAt: 79,
    stock: 96,
    image: 'shower-gel.jpg',
    rating: 4.6,
    reviews: 70,
    sold: 280,
    options: ['200ml'],
    badge: null,
    description:
      'Cooling 98% aloe vera gel for sunburn, shaving irritation and everyday hydration. Absorbs fast and never feels sticky.',
  },
];

export const demoProducts: Product[] = seeds.map((seed, index) => {
  const cat = demoCategories.find((c) => c.id === seed.category);
  const thumbnail = `/images/products/${seed.image}`;

  return {
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    description: seed.description,
    price: seed.price,
    compare_at_price: seed.compareAt,
    stock_quantity: seed.stock,
    category_id: seed.category,
    images: [thumbnail],
    thumbnail,
    sizes: seed.options ?? [],
    colors: [],
    is_active: true,
    archived: false,
    metadata: {
      rating: seed.rating,
      reviews: seed.reviews,
      sold: seed.sold,
      badge: seed.badge,
      brand: 'Sally Skin',
    },
    created_at: new Date(Date.UTC(2026, 0, 15 - index)).toISOString(),
    updated_at: now,
    category: cat ? { ...cat } : undefined,
  };
});

export const demoBanners = [
  {
    id: 'banner-glow',
    title: 'Glow season starts here.',
    subtitle: 'Up to 40% off skin care',
    description:
      'Authentic body lotions, serums, face creams and baby care — delivered nationwide across Ghana.',
    image_url: '/images/hero-skincare.jpg',
    link_url: '/products',
    link_text: 'Shop the sale',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'banner-body',
    title: 'Soft skin, all harmattan.',
    subtitle: 'Body care edit',
    description:
      'Shea-rich lotions and shower creams that keep ash away for 24 hours. Free delivery over GH₵300.',
    image_url: '/images/hero-skincare.jpg',
    link_url: '/categories/body-lotions',
    link_text: 'Shop body care',
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'banner-baby',
    title: 'Gentle care for little ones.',
    subtitle: 'Baby care bundle',
    description:
      'Paediatrician-tested lotions, washes and jumbo diaper packs — now at bundle prices.',
    image_url: '/images/hero-skincare.jpg',
    link_url: '/categories/baby-care',
    link_text: 'Shop baby care',
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
    icon: '🔥',
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
    description: 'Fresh drops from Sally Skin.',
    icon: '✨',
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
