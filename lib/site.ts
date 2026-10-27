// lib/site.ts
// Single source of truth for brand-level content.

export const site = {
  name: 'Glow-Up',
  nameFull: 'Glow-Up Skincare & Mother Care',
  shortName: 'Glow-Up',
  tagline: 'Skincare & mother care',
  description:
    'Shop authentic body lotions, face creams, serums, shampoos and conditioners, shower gels, baby care and mother care essentials from Nivea, Vaseline, Johnson’s and more — delivered across Ghana.',
  phone: '0549455367',
  phoneDisplay: '054 945 5367',
  whatsapp: '233549455367',
  email: 'hello@glowupskincare.com',
  address: 'Accra, Greater Accra, Ghana',
  areaServed: 'Ghana',
  freeDeliveryThreshold: 300,
  currencyNote: 'All prices in Ghana Cedis (GH₵)',
  currency: 'GHS',
  /** Canonical origin used for metadata, JSON-LD and auth redirects. */
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://glowupskincare.com',
} as const;

export const NAV_CATEGORIES = [
  { name: 'Body Lotions', slug: 'body-lotions', icon: '🧴' },
  { name: 'Face Care', slug: 'face-care', icon: '✨' },
  { name: 'Serums & Oils', slug: 'serums-oils', icon: '💧' },
  { name: 'Face Wash', slug: 'face-wash', icon: '🫧' },
  { name: 'Shampoos', slug: 'shampoos', icon: '🧖🏽‍♀️' },
  { name: 'Conditioners', slug: 'conditioners', icon: '💆🏽‍♀️' },
  { name: 'Shower Gels', slug: 'shower-gels', icon: '🚿' },
  { name: 'Baby Care', slug: 'baby-care', icon: '🍼' },
  { name: 'Mother Care', slug: 'mother-care', icon: '🤱🏽' },
  { name: 'Sun Care', slug: 'sun-care', icon: '🌤️' },
] as const;

export const POPULAR_SEARCHES = [
  'Nivea body lotion',
  'Vitamin C serum',
  'Face cream',
  'Shampoo',
  'Conditioner',
  "Johnson's baby",
  'Baby diapers',
  'Shower gel',
  'Sunscreen',
] as const;

export const HELP_LINKS = [
  { label: 'Track my order', href: '/orders' },
  { label: 'Shipping & delivery', href: '/contact' },
  { label: 'Returns & refunds', href: '/contact' },
  { label: 'Contact support', href: '/contact' },
] as const;

export const USEFUL_LINKS = [
  { label: 'About us', href: '/about' },
  { label: 'Skincare journal', href: '/blog' },
  { label: 'Shop all products', href: '/products' },
  { label: 'My account', href: '/account' },
  { label: 'My orders', href: '/orders' },
] as const;
