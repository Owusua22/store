-- ============================================================================
--  Sally Skin Care — seed data
--  Run after schema.sql. Safe to re-run (upserts on slug / code).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Skin types (managed from /admin/skin-types)
-- ---------------------------------------------------------------------------
insert into public.skin_types (slug, label, emoji, description, sort_order)
values
  ('normal',      'Normal',      '🌿', 'Balanced skin that rarely breaks out or feels tight.', 1),
  ('dry',         'Dry',         '🏜️', 'Skin that feels tight, flaky or ashy, especially in harmattan.', 2),
  ('oily',        'Oily',        '💧', 'Shiny through the day with visible pores and frequent breakouts.', 3),
  ('combination', 'Combination', '⚖️', 'Oily T-zone with normal or dry cheeks.', 4),
  ('sensitive',   'Sensitive',   '🌸', 'Reacts quickly to fragrance, scrubs or harsh cleansers.', 5),
  ('acne-prone',  'Acne-prone',  '🩹', 'Prone to blackheads, whiteheads and inflamed breakouts.', 6)
on conflict (slug) do update
  set label = excluded.label,
      emoji = excluded.emoji,
      description = excluded.description,
      sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, description, icon, image_url, sort_order)
values
  ('Body Lotions',  'body-lotions', 'Shea, cocoa and vitamin-rich body lotions for soft, glowing skin all day.', '🧴', '/images/products/body-lotion.jpg', 1),
  ('Face Care',     'face-care',    'Creams, serums and treatments that hydrate, brighten and protect.', '✨', '/images/products/face-cream.jpg', 2),
  ('Hair Care',     'hair-care',    'Nourishing shampoos and conditioners for strong, silky hair.', '💆🏽‍♀️', '/images/products/shampoo.jpg', 3),
  ('Shower Gels',   'shower-gels',  'Refreshing, pH-balanced body washes for a clean, soft finish.', '🚿', '/images/products/shower-gel.jpg', 4),
  ('Baby Care',     'baby-care',    'Gentle baby lotions, washes and diapers trusted by Ghanaian mums.', '🍼', '/images/products/baby-diapers.jpg', 5),
  ('Serums & Oils', 'serums-oils',  'Vitamin C, hyaluronic and glow oils for targeted skin results.', '💧', '/images/products/serum.jpg', 6),
  ('Face Wash',     'face-wash',    'Everyday cleansers that remove dirt without stripping moisture.', '🫧', '/images/products/face-wash.jpg', 7),
  ('Sun Care',      'sun-care',     'SPF protection and after-sun soothers for the Ghanaian sun.', '🌤️', '/images/products/face-wash.jpg', 8)
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      image_url = excluded.image_url,
      sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Sample products (edit or delete from the admin once you are live)
-- ---------------------------------------------------------------------------
insert into public.products (
  name, slug, description, short_description, price, compare_at_price,
  category_id, brand, skin_types, concerns, ingredients, how_to_use, benefits,
  sizes, images, thumbnail, stock_quantity, rating, reviews_count, sold_count,
  is_featured, is_active
)
values
  (
    'Shea Butter Body Lotion 400ml', 'shea-butter-body-lotion-400ml',
    'A rich, fast-absorbing shea butter body lotion that locks in moisture for 24 hours. Perfect for dry, ashy skin in harmattan and everyday glow.',
    '24-hour moisture for dry, ashy skin',
    79, 120,
    (select id from public.categories where slug = 'body-lotions'),
    'Sally Skin', array['dry','normal','sensitive'], array['dryness','dullness'],
    'Shea butter, cocoa butter, vitamin E, glycerin',
    'Smooth over damp skin after bathing, morning and night. Focus on elbows, knees and heels.',
    'Deep hydration, softer skin, less ashiness',
    array['400ml','750ml'],
    array['/images/products/body-lotion.jpg'], '/images/products/body-lotion.jpg',
    64, 4.90, 218, 940, true, true
  ),
  (
    'Vitamin C Glow Serum 30ml', 'vitamin-c-glow-serum-30ml',
    '10% stabilised vitamin C with niacinamide to fade dark spots, boost radiance and protect against daily pollution.',
    'Fades dark spots, boosts glow',
    149, 220,
    (select id from public.categories where slug = 'serums-oils'),
    'Sally Skin', array['combination','normal','oily'], array['dark-spots','dullness','uneven-tone'],
    '10% vitamin C, niacinamide 4%, hyaluronic acid, ferulic acid',
    'Apply 3–4 drops to clean skin in the morning before moisturiser and sunscreen.',
    'Brighter tone, fewer dark spots, antioxidant protection',
    array['30ml'],
    array['/images/products/serum.jpg'], '/images/products/serum.jpg',
    28, 4.90, 174, 760, true, true
  ),
  (
    'Hydra Boost Face Cream 50g', 'hydra-boost-face-cream-50g',
    'A silky day cream with ceramides and aloe that strengthens the skin barrier and keeps makeup flawless all day.',
    'Lightweight barrier repair cream',
    129, 180,
    (select id from public.categories where slug = 'face-care'),
    'Sally Skin', array['dry','normal','sensitive'], array['dryness','sensitivity'],
    'Ceramides, aloe vera, squalane, glycerin',
    'Apply to face and neck each morning after serum. Use a richer layer at night if needed.',
    'Stronger barrier, all-day hydration, smooth base for makeup',
    array['50g'],
    array['/images/products/face-cream.jpg'], '/images/products/face-cream.jpg',
    42, 4.80, 143, 610, true, true
  ),
  (
    'Gentle Foam Face Wash 150ml', 'gentle-foam-face-wash-150ml',
    'Soap-free, pH-balanced foaming cleanser with aloe and green tea. Removes sunscreen and oil without that tight feeling.',
    'Soap-free daily cleanser',
    69, 95,
    (select id from public.categories where slug = 'face-wash'),
    'Sally Skin', array['normal','dry','sensitive','combination'], array['sensitivity','dullness'],
    'Aloe vera, green tea, glycerin, mild amino-acid surfactants',
    'Massage a small amount onto damp skin morning and night, then rinse with lukewarm water.',
    'Cleans without stripping, calm skin, no tight feeling',
    array['150ml'],
    array['/images/products/face-wash.jpg'], '/images/products/face-wash.jpg',
    71, 4.60, 120, 480, false, true
  ),
  (
    'Nourishing Argan Shampoo 500ml', 'nourishing-argan-shampoo-500ml',
    'Sulphate-free argan oil shampoo that gently cleanses braids, naturals and relaxed hair while reducing breakage.',
    'Sulphate-free, for braids and naturals',
    89, 120,
    (select id from public.categories where slug = 'hair-care'),
    'Sally Skin', array['normal','dry'], array['dryness'],
    'Argan oil, glycerin, panthenol, mild surfactants',
    'Wet hair, massage into scalp, work through lengths and rinse. Follow with Silk Smooth Conditioner.',
    'Gentle cleanse, less breakage, softer hair',
    array['500ml','1L'],
    array['/images/products/shampoo.jpg'], '/images/products/shampoo.jpg',
    58, 4.70, 156, 700, true, true
  ),
  (
    'Baby Diapers Jumbo Pack (60pcs)', 'baby-diapers-jumbo-pack-60pcs',
    'Ultra-soft, super-absorbent diapers with a wetness indicator and breathable back sheet. Up to 12 hours of dryness for happy nights.',
    'Up to 12 hours of dryness',
    135, 180,
    (select id from public.categories where slug = 'baby-care'),
    'Sally Baby', array['sensitive'], array[]::text[],
    'Soft non-woven top sheet, absorbent pulp, breathable back sheet',
    'Change after each feed or when soiled. Dispose of soiled diapers in a bin.',
    'Fewer leaks, dry nights, gentle on newborn skin',
    array['Size 2','Size 3','Size 4'],
    array['/images/products/baby-diapers.jpg'], '/images/products/baby-diapers.jpg',
    74, 4.80, 311, 1420, true, true
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Import note: banners above omit text_color/overlay_opacity on purpose so the
-- table defaults apply.

-- ---------------------------------------------------------------------------
-- Shipping zones (Ghana)
-- ---------------------------------------------------------------------------
insert into public.shipping_zones (country, region, town, shipping_fee, estimated_days_min, estimated_days_max, sort_order)
values
  ('Ghana','Greater Accra','Accra Central', 25, 1, 2, 1),
  ('Ghana','Greater Accra','East Legon',    25, 1, 2, 2),
  ('Ghana','Greater Accra','Madina',        25, 1, 2, 3),
  ('Ghana','Greater Accra','Tema',          30, 1, 2, 4),
  ('Ghana','Greater Accra','Kasoa',         35, 1, 3, 5),
  ('Ghana','Greater Accra','Adenta',        30, 1, 2, 6),
  ('Ghana','Ashanti','Kumasi',              35, 1, 3, 7),
  ('Ghana','Ashanti','Obuasi',              40, 2, 3, 8),
  ('Ghana','Western','Takoradi',            40, 2, 4, 9),
  ('Ghana','Central','Cape Coast',          40, 2, 4, 10),
  ('Ghana','Eastern','Koforidua',           40, 2, 4, 11),
  ('Ghana','Northern','Tamale',             50, 3, 5, 12)
on conflict (country, region, town) do nothing;

-- ---------------------------------------------------------------------------
-- Promo code example
-- ---------------------------------------------------------------------------
insert into public.shipping_discount_codes (code, description, discount_type, discount_value, min_order_amount, is_active)
values ('FREESHIP', 'Free delivery on your first order', 'free_shipping', 0, 150, true)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Homepage banners (swap the image URLs for your own R2 uploads)
-- ---------------------------------------------------------------------------
insert into public.banners (title, subtitle, description, image_url, link_url, link_text, sort_order, is_active)
select * from (
  values
    ('Glow season starts here.', 'Up to 40% off skin care', 'Authentic body lotions, serums, face creams and baby care — delivered nationwide across Ghana.', '/images/hero-skincare.jpg', '/products', 'Shop the sale', 1, true),
    ('Soft skin, all harmattan.', 'Body care edit', 'Shea-rich lotions and shower creams that keep ash away for 24 hours. Free delivery over GH₵300.', '/images/hero-skincare.jpg', '/categories/body-lotions', 'Shop body care', 2, true),
    ('Gentle care for little ones.', 'Baby care bundle', 'Paediatrician-tested lotions, washes and jumbo diaper packs — now at bundle prices.', '/images/hero-skincare.jpg', '/categories/baby-care', 'Shop baby care', 3, true)
) as t(title, subtitle, description, image_url, link_url, link_text, sort_order, is_active)
where not exists (select 1 from public.banners);

-- ---------------------------------------------------------------------------
-- Blog: starter articles
-- ---------------------------------------------------------------------------
insert into public.blog_posts (title, slug, excerpt, content, cover_image, category, tags, skin_types, status, is_featured, read_minutes, published_at)
values
  (
    'A simple skin care routine for Ghana''s harmattan season',
    'harmattan-skin-care-routine',
    'Dry, tight, ashy skin? Here is the exact routine we recommend from December to February.',
    E'## Why harmattan wrecks your skin\n\nHarmattan air is dry and dusty, so your skin loses water faster than usual. The goal is simple: **add water, then seal it in**.\n\n## Morning\n\n1. Rinse with a gentle foam cleanser — no soap bars.\n2. Apply a hydrating serum while skin is still damp.\n3. Follow with Hydra Boost Face Cream.\n4. Finish with SPF 50 — the sun is still strong.\n\n## Evening\n\n1. Cleanse again to remove dust and sunscreen.\n2. Layer a shea-rich body lotion on damp skin.\n3. Add a thicker layer of face cream on dry patches.\n\n## Our picks\n\n- Shea Butter Body Lotion 400ml\n- Hydra Boost Face Cream 50g\n- Gentle Foam Face Wash 150ml',
    '/images/products/body-lotion.jpg',
    'Skin care tips',
    array['harmattan','routine','dry skin'],
    array['dry','normal','sensitive'],
    'published', true, 4, timezone('utc', now())
  ),
  (
    'How to choose products for oily, acne-prone skin',
    'products-for-oily-acne-prone-skin',
    'More oil does not mean you should skip moisturiser. Here is what actually helps.',
    E'## Oily skin needs balance, not stripping\n\nOver-washing pushes your skin to produce more oil. Instead, use a gentle cleanser twice a day and a lightweight, non-comedogenic moisturiser.\n\n## What to look for\n\n- **Salicylic acid** for clogged pores\n- **Niacinamide** to control shine and calm redness\n- **Gel moisturisers** instead of heavy creams\n- **SPF that says non-comedogenic**\n\n## What to avoid\n\nAlcohol-heavy toners, gritty scrubs and picking at breakouts.\n\n## Our picks\n\n- Charcoal Detox Face Wash 150ml\n- Vitamin C Glow Serum 30ml\n- Daily Sunscreen SPF 50',
    '/images/products/face-wash.jpg',
    'Routine',
    array['acne','oily skin','serums'],
    array['oily','combination','acne-prone'],
    'published', false, 3, timezone('utc', now())
  ),
  (
    'Baby skin 101: what to use in the first year',
    'baby-skin-care-first-year',
    'Fragrance-free, gentle and simple — the three rules for newborn skin.',
    E'## Keep it simple\n\nA baby''s skin barrier is still developing. Choose fragrance-free products with short ingredient lists.\n\n## Bath time\n\nUse lukewarm water and a tear-free wash no more than three times a week. Pat dry, don''t rub.\n\n## Moisturise\n\nApply Baby Soft Lotion within three minutes of bathing to lock in water.\n\n## Nappies\n\nChange often, keep the area dry, and use a barrier cream at the first sign of redness.\n\n## Our picks\n\n- Baby Soft Lotion 400ml\n- Baby Bath & Shampoo 500ml\n- Baby Diapers Jumbo Pack',
    '/images/products/baby-lotion.jpg',
    'Baby care',
    array['baby','sensitive skin'],
    array['sensitive'],
    'published', false, 3, timezone('utc', now())
  )
on conflict (slug) do nothing;
