// lib/site.ts
// Single source of truth for brand-level content.

export const site = {
  name: 'Sally',
  nameFull: "Sally's Skin Care",
  tagline: 'Skin care & more',
  description:
    'Shop authentic body lotions, face creams, serums, shampoos, shower gels, baby care and more — delivered across Ghana.',
  phone: '0549455367',
  phoneDisplay: '054 945 5367',
  whatsapp: '233549455367',
  email: 'hello@sallyskincare.com',
  address: 'Accra, Greater Accra, Ghana',
  freeDeliveryThreshold: 300,
  currencyNote: 'All prices in Ghana Cedis (GH₵)',
} as const;

export const NAV_CATEGORIES = [
  { name: 'Body Lotions', slug: 'body-lotions', icon: '🧴' },
  { name: 'Face Care', slug: 'face-care', icon: '✨' },
  { name: 'Hair Care', slug: 'hair-care', icon: '💆🏽‍♀️' },
  { name: 'Shower Gels', slug: 'shower-gels', icon: '🚿' },
  { name: 'Baby Care', slug: 'baby-care', icon: '🍼' },
  { name: 'Serums & Oils', slug: 'serums-oils', icon: '💧' },
  { name: 'Face Wash', slug: 'face-wash', icon: '🫧' },
  { name: 'Sun Care', slug: 'sun-care', icon: '🌤️' },
] as const;

export const POPULAR_SEARCHES = [
  'Body lotion',
  'Vitamin C serum',
  'Face cream',
  'Shampoo',
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
  { label: 'Shop all products', href: '/products' },
  { label: 'My account', href: '/account' },
  { label: 'My orders', href: '/orders' },
] as const;
