// lib/site.ts
// Single source of truth for brand-level, location and contact content.

export const site = {
  name: 'Glow-Up',
  nameFull: 'Glow-Up Skincare & Mother Care',
  shortName: 'Glow-Up',
  tagline: 'Authentic skincare and Mothercare for every budget',
  headline:
    "100% Authentic Skincare, Body Care & Mothercare in East Doboro — Beside St. George's Height",
  description:
    'Authentic Nivea, Vaseline, Johnson’s, Dove and Cetaphil skincare, body care, haircare, mothercare and baby essentials at honest prices — in East Doboro beside St. George’s Height, Nsawam, with delivery across Ghana.',
  phone: '0549455367',
  phoneDisplay: '054 945 5367',
  whatsapp: '233549455367',
  whatsappDisplay: '054 945 5367',
  email: 'hello@glowupskincare.com',
  address: 'East Doboro, beside St. George’s Height, Nsawam, Eastern Region, Ghana',
  areaServed: 'Ghana',
  town: 'East Doboro',
  region: 'Eastern Region',
  district: 'Nsawam Adoagyiri',
  landmark: "St. George's Height",
  /** Everything after "https://maps.google.com/?q=" */
  mapQuery: "St. George's Height, East Doboro, Nsawam, Ghana",
  mapEmbedUrl:
    'https://www.google.com/maps?q=' +
    encodeURIComponent("St. George's Height, East Doboro, Nsawam, Ghana") +
    '&output=embed',
  mapLink:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent("St. George's Height, East Doboro, Nsawam, Ghana"),
  directionsLink:
    'https://www.google.com/maps/dir/?api=1&destination=' +
    encodeURIComponent("St. George's Height, East Doboro, Nsawam, Ghana"),
  /** MTN MoMo Pay Till / merchant number used for manual verification. */
  momo: {
    network: 'MTN Mobile Money',
    name: 'Glow-Up Skincare & Mother Care',
    number: '054 945 5367',
    till: '054 945 5367',
    /** Set the real Pay Till / merchant ID here once MTN issues it. */
    payTill: process.env.NEXT_PUBLIC_MOMO_TILL || '0549455367',
  },
  hours: [
    { day: 'Monday', short: 'Mon', open: '8:00 AM', close: '8:00 PM', openTime: '08:00', closeTime: '20:00' },
    { day: 'Tuesday', short: 'Tue', open: '8:00 AM', close: '8:00 PM', openTime: '08:00', closeTime: '20:00' },
    { day: 'Wednesday', short: 'Wed', open: '8:00 AM', close: '8:00 PM', openTime: '08:00', closeTime: '20:00' },
    { day: 'Thursday', short: 'Thu', open: '8:00 AM', close: '8:00 PM', openTime: '08:00', closeTime: '20:00' },
    { day: 'Friday', short: 'Fri', open: '8:00 AM', close: '8:00 PM', openTime: '08:00', closeTime: '20:00' },
    { day: 'Saturday', short: 'Sat', open: '8:00 AM', close: '8:00 PM', openTime: '08:00', closeTime: '20:00' },
    { day: 'Sunday', short: 'Sun', open: '1:00 PM', close: '7:00 PM', openTime: '13:00', closeTime: '19:00' },
  ],
  hoursSummary: 'Mon–Sat 8:00 AM – 8:00 PM · Sun 1:00 PM – 7:00 PM',
  freeDeliveryThreshold: 300,
  currencyNote: 'All prices in Ghana Cedis (GH₵)',
  currency: 'GHS',
  currencySymbol: 'GH₵',
  policy: {
    exchangeWindowHours: 48,
    /** Order cut-off for same-day dispatch around Nsawam/Doboro. */
    sameDayCutoff: '2:00 PM',
  },
  /** Canonical origin used for metadata, JSON-LD and auth redirects. */
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://glowupskincare.com',
} as const;

/** Every address variant people actually search for. */
export const LOCATION_KEYWORDS = [
  'skincare shop East Doboro',
  'cosmetics shop Nsawam',
  'mothercare Nsawam',
  'baby products Doboro',
  'skincare near St. George’s Height',
  'body lotion Nsawam',
  'baby diapers Nsawam',
  'authentic cosmetics Eastern Region',
] as const;

/**
 * The four core shop departments, plus bundles and haircare.
 * `slug` is the /categories/<slug> URL and the `categories.slug` in Supabase.
 */
export const SHOP_CATEGORIES = [
  {
    slug: 'facial-skincare',
    name: 'Facial Skincare',
    icon: '',
    blurb: 'Cleansers, serums, day creams and sunscreen for your face.',
    image: '/images/products/face-cream.webp',
  },
  {
    slug: 'bath-body-care',
    name: 'Bath & Body Care',
    icon: '',
    blurb: 'Body lotions, shower gels and body oils for soft, glowing skin.',
    image: '/images/products/body-lotion.webp',
  },
  {
    slug: 'mothercare-pregnancy',
    name: 'Mothercare & Pregnancy',
    icon: '',
    blurb: 'Stretch-mark creams, nipple balms and post-partum care for mums.',
    image: '/images/products/baby-lotion.webp',
  },
  {
    slug: 'baby-care-essentials',
    name: 'Baby Care Essentials',
    icon: '',
    blurb: 'Gentle washes, lotions and diapers for newborns and toddlers.',
    image: '/images/products/baby-diapers.webp',
  },
] as const;

export const EXTRA_CATEGORIES = [
  {
    slug: 'haircare',
    name: 'Haircare',
    icon: '',
    blurb: 'Shampoos and conditioners for naturals, braids and relaxed hair.',
    image: '/images/products/shampoo.webp',
  },
  {
    slug: 'bundles-offers',
    name: 'Bundles & Offers',
    icon: '',
    blurb: 'Money-saving bundles and this week’s markdowns.',
    image: '/images/products/serum.webp',
  },
] as const;

export const NAV_CATEGORIES = [...SHOP_CATEGORIES, ...EXTRA_CATEGORIES] as const;

/** Old category URLs kept alive so shared links never 404. */
export const LEGACY_CATEGORY_SLUGS: Record<string, string> = {
  'body-lotions': 'bath-body-care',
  'shower-gels': 'bath-body-care',
  'face-care': 'facial-skincare',
  'face-wash': 'facial-skincare',
  'serums-oils': 'facial-skincare',
  'sun-care': 'facial-skincare',
  haircare: 'haircare',
  'hair-care': 'haircare',
  shampoos: 'haircare',
  conditioners: 'haircare',
  'mother-care': 'mothercare-pregnancy',
  'baby-care': 'baby-care-essentials',
  deals: 'bundles-offers',
  offers: 'bundles-offers',
};

export const POPULAR_SEARCHES = [
  'Nivea body lotion',
  'Vitamin C serum',
  'Baby diapers',
  "Johnson's baby",
  'Stretch mark cream',
  'Shampoo',
  'Sunscreen',
] as const;

export const HELP_LINKS = [
  { label: 'Track my order', href: '/orders' },
  { label: 'Shop location & hours', href: '/location' },
  { label: 'Delivery rates', href: '/location#delivery' },
  { label: 'Returns & refunds', href: '/policies#returns' },
  { label: 'Payment methods', href: '/policies#payment' },
] as const;

export const USEFUL_LINKS = [
  { label: 'About us', href: '/about' },
  { label: 'Skincare journal', href: '/blog' },
  { label: 'Shop all products', href: '/products' },
  { label: 'My account', href: '/account' },
  { label: 'My orders', href: '/orders' },
] as const;
