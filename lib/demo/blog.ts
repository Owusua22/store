// lib/demo/blog.ts
// Bundled articles used in demo mode (no Supabase project configured).

import type { BlogPost } from '@/types';

const posts: Array<Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>> = [
  {
    title: "A simple skin care routine for Ghana's harmattan season",
    slug: 'harmattan-skin-care-routine',
    excerpt:
      'Dry, tight, ashy skin? Here is the exact routine we recommend from December to February.',
    cover_image: '/images/products/body-lotion.webp',
    category: 'Skin care tips',
    tags: ['harmattan', 'routine', 'dry skin'],
    skin_types: ['dry', 'normal', 'sensitive'],
    author_name: 'Glow-Up Skincare',
    status: 'published',
    is_featured: true,
    read_minutes: 4,
    published_at: '2026-01-06T08:00:00.000Z',
    content: `## Why harmattan wrecks your skin

Harmattan air is dry and dusty, so your skin loses water faster than usual. The goal is simple: **add water, then seal it in**.

## Morning

1. Rinse with a gentle foam cleanser — no soap bars.
2. Apply a hydrating serum while skin is still damp.
3. Follow with Hydra Boost Face Cream.
4. Finish with SPF 50 — the sun is still strong.

## Evening

1. Cleanse again to remove dust and sunscreen.
2. Layer a shea-rich body lotion on damp skin.
3. Add a thicker layer of face cream on dry patches.

## Our picks

- Shea Butter Body Lotion 400ml
- Hydra Boost Face Cream 50g
- Gentle Foam Face Wash 150ml`,
  },
  {
    title: 'How to choose products for oily, acne-prone skin',
    slug: 'products-for-oily-acne-prone-skin',
    excerpt:
      'More oil does not mean you should skip moisturiser. Here is what actually helps.',
    cover_image: '/images/products/face-wash.webp',
    category: 'Routine',
    tags: ['acne', 'oily skin', 'serums'],
    skin_types: ['oily', 'combination', 'acne-prone'],
    author_name: 'Glow-Up Skincare',
    status: 'published',
    is_featured: false,
    read_minutes: 3,
    published_at: '2026-01-10T08:00:00.000Z',
    content: `## Oily skin needs balance, not stripping

Over-washing pushes your skin to produce more oil. Instead, use a gentle cleanser twice a day and a lightweight, non-comedogenic moisturiser.

## What to look for

- **Salicylic acid** for clogged pores
- **Niacinamide** to control shine and calm redness
- **Gel moisturisers** instead of heavy creams
- **SPF that says non-comedogenic**

## What to avoid

Alcohol-heavy toners, gritty scrubs and picking at breakouts.

## Our picks

- Charcoal Detox Face Wash 150ml
- Vitamin C Glow Serum 30ml
- Daily Sunscreen SPF 50`,
  },
  {
    title: 'Baby skin 101: what to use in the first year',
    slug: 'baby-skin-care-first-year',
    excerpt:
      'Fragrance-free, gentle and simple — the three rules for newborn skin.',
    cover_image: '/images/products/baby-lotion.webp',
    category: 'Baby care',
    tags: ['baby', 'sensitive skin'],
    skin_types: ['sensitive'],
    author_name: 'Glow-Up Baby',
    status: 'published',
    is_featured: true,
    read_minutes: 3,
    published_at: '2026-01-14T08:00:00.000Z',
    content: `## Keep it simple

A baby's skin barrier is still developing. Choose fragrance-free products with short ingredient lists.

## Bath time

Use lukewarm water and a tear-free wash no more than three times a week. Pat dry, don't rub.

## Moisturise

Apply Baby Soft Lotion within three minutes of bathing to lock in water.

## Nappies

Change often, keep the area dry, and use a barrier cream at the first sign of redness.

## Our picks

- Baby Soft Lotion 400ml
- Baby Bath & Shampoo 500ml
- Baby Diapers Jumbo Pack`,
  },
  {
    title: 'Vitamin C serums: how to use them without irritation',
    slug: 'how-to-use-vitamin-c-serum',
    excerpt:
      'Strength is not everything. Here is how to get results from vitamin C without the sting.',
    cover_image: '/images/products/serum.webp',
    category: 'Ingredients',
    tags: ['vitamin c', 'serums', 'dark spots'],
    skin_types: ['normal', 'combination', 'oily'],
    author_name: 'Glow-Up Skincare',
    status: 'published',
    is_featured: false,
    read_minutes: 4,
    published_at: '2026-01-18T08:00:00.000Z',
    content: `## Start slow

Begin with three mornings a week, then build to daily use. A little sting is normal; burning is not.

## Layer it right

Cleanse, then serum on dry skin, then moisturiser, then SPF. Vitamin C works best in the morning under sunscreen.

## Store it properly

Amber bottles and cool, dark cupboards keep vitamin C from oxidising. If it turns deep brown, replace it.`,
  },
];

export const demoBlogPosts: BlogPost[] = posts.map((post, index) => ({
  ...post,
  id: `demo-post-${index + 1}`,
  created_at: post.published_at ?? '2026-01-01T08:00:00.000Z',
  updated_at: post.published_at ?? '2026-01-01T08:00:00.000Z',
}));

export function findDemoBlogPost(slug: string) {
  return demoBlogPosts.find((post) => post.slug === slug) ?? null;
}
