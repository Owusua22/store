-- ============================================================================
--  Glow-Up Skincare & Mother Care — seed data
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
-- Brands (managed from /admin/brands)
-- Add Nivea, Vaseline, Johnson's Baby, Dove … here or from the admin screen.
-- ---------------------------------------------------------------------------
insert into public.brands (name, slug, description, country, sort_order)
values
  ('Nivea',          'nivea',          'German skin and body care — Nivea Creme, body lotions and shower creams.', 'Germany', 1),
  ('Vaseline',       'vaseline',       'Petroleum jelly, cocoa radiant and aloe body lotions.', 'USA', 2),
  ('Johnson''s Baby','johnsons-baby',  'Gentle baby washes, shampoos, lotions and oils.', 'USA', 3),
  ('Dove',           'dove',           'Moisturising body washes, shampoos and conditioners.', 'UK', 4),
  ('Baby Dove',      'baby-dove',      'Fragrance-free baby care for delicate skin.', 'UK', 5),
  ('Simple',         'simple',         'No perfume, no colour — kind to sensitive skin.', 'UK', 6),
  ('Cetaphil',       'cetaphil',       'Dermatologist-recommended cleansers and moisturisers.', 'Switzerland', 7),
  ('CeraVe',         'cerave',         'Ceramide-rich cleansers and creams for the skin barrier.', 'USA', 8),
  ('Shea Moisture',  'shea-moisture',  'Shea and coconut hair and body care.', 'USA', 9),
  ('Dark & Lovely',  'dark-and-lovely', 'Relaxers, shampoos and conditioners for Black hair.', 'USA', 10),
  ('Palmolive',      'palmolive',      'Shower gels and liquid soaps.', 'Germany', 11),
  ('Garnier',        'garnier',        'Micellar water, face washes and hair care.', 'France', 12),
  ('Glow-Up',        'glow-up',        'Our own house range, formulated for Ghanaian skin and hair.', 'Ghana', 99)
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description,
      country = excluded.country,
      sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, description, icon, image_url, sort_order)
values
  ('Facial Skincare',       'facial-skincare',      'Cleansers, serums, day creams and sunscreen for your face.', '✨', '/images/products/face-cream.webp', 1),
  ('Bath & Body Care',      'bath-body-care',       'Body lotions, shower gels and body oils for soft, glowing skin.', '🧴', '/images/products/body-lotion.webp', 2),
  ('Mothercare & Pregnancy','mothercare-pregnancy', 'Stretch-mark creams, nipple balms and post-partum care for mums.', '🤱🏽', '/images/products/baby-lotion.webp', 3),
  ('Baby Care Essentials',  'baby-care-essentials', 'Gentle washes, lotions and diapers for newborns and toddlers.', '🍼', '/images/products/baby-diapers.webp', 4),
  ('Haircare',              'haircare',             'Shampoos and conditioners for naturals, braids and relaxed hair.', '💆🏽‍♀️', '/images/products/shampoo.webp', 5),
  ('Bundles & Offers',      'bundles-offers',       'Money-saving bundles and this week’s markdowns.', '🎁', '/images/products/serum.webp', 6)
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
    (select id from public.categories where slug = 'bath-body-care'),
    'Glow-Up', array['dry','normal','sensitive'], array['dryness','dullness'],
    'Shea butter, cocoa butter, vitamin E, glycerin',
    'Smooth over damp skin after bathing, morning and night. Focus on elbows, knees and heels.',
    'Deep hydration, softer skin, less ashiness',
    array['400ml','750ml'],
    array['/images/products/body-lotion.webp'], '/images/products/body-lotion.webp',
    64, 4.90, 218, 940, true, true
  ),
  (
    'Vitamin C Glow Serum 30ml', 'vitamin-c-glow-serum-30ml',
    '10% stabilised vitamin C with niacinamide to fade dark spots, boost radiance and protect against daily pollution.',
    'Fades dark spots, boosts glow',
    149, 220,
    (select id from public.categories where slug = 'facial-skincare'),
    'Glow-Up', array['combination','normal','oily'], array['dark-spots','dullness','uneven-tone'],
    '10% vitamin C, niacinamide 4%, hyaluronic acid, ferulic acid',
    'Apply 3–4 drops to clean skin in the morning before moisturiser and sunscreen.',
    'Brighter tone, fewer dark spots, antioxidant protection',
    array['30ml'],
    array['/images/products/serum.webp'], '/images/products/serum.webp',
    28, 4.90, 174, 760, true, true
  ),
  (
    'Hydra Boost Face Cream 50g', 'hydra-boost-face-cream-50g',
    'A silky day cream with ceramides and aloe that strengthens the skin barrier and keeps makeup flawless all day.',
    'Lightweight barrier repair cream',
    129, 180,
    (select id from public.categories where slug = 'facial-skincare'),
    'Glow-Up', array['dry','normal','sensitive'], array['dryness','sensitivity'],
    'Ceramides, aloe vera, squalane, glycerin',
    'Apply to face and neck each morning after serum. Use a richer layer at night if needed.',
    'Stronger barrier, all-day hydration, smooth base for makeup',
    array['50g'],
    array['/images/products/face-cream.webp'], '/images/products/face-cream.webp',
    42, 4.80, 143, 610, true, true
  ),
  (
    'Gentle Foam Face Wash 150ml', 'gentle-foam-face-wash-150ml',
    'Soap-free, pH-balanced foaming cleanser with aloe and green tea. Removes sunscreen and oil without that tight feeling.',
    'Soap-free daily cleanser',
    69, 95,
    (select id from public.categories where slug = 'facial-skincare'),
    'Glow-Up', array['normal','dry','sensitive','combination'], array['sensitivity','dullness'],
    'Aloe vera, green tea, glycerin, mild amino-acid surfactants',
    'Massage a small amount onto damp skin morning and night, then rinse with lukewarm water.',
    'Cleans without stripping, calm skin, no tight feeling',
    array['150ml'],
    array['/images/products/face-wash.webp'], '/images/products/face-wash.webp',
    71, 4.60, 120, 480, false, true
  ),
  (
    'Nourishing Argan Shampoo 500ml', 'nourishing-argan-shampoo-500ml',
    'Sulphate-free argan oil shampoo that gently cleanses braids, naturals and relaxed hair while reducing breakage.',
    'Sulphate-free, for braids and naturals',
    89, 120,
    (select id from public.categories where slug = 'haircare'),
    'Glow-Up', array['normal','dry'], array['dryness'],
    'Argan oil, glycerin, panthenol, mild surfactants',
    'Wet hair, massage into scalp, work through lengths and rinse. Follow with Silk Smooth Conditioner.',
    'Gentle cleanse, less breakage, softer hair',
    array['500ml','1L'],
    array['/images/products/shampoo.webp'], '/images/products/shampoo.webp',
    58, 4.70, 156, 700, true, true
  ),
  (
    'Baby Diapers Jumbo Pack (60pcs)', 'baby-diapers-jumbo-pack-60pcs',
    'Ultra-soft, super-absorbent diapers with a wetness indicator and breathable back sheet. Up to 12 hours of dryness for happy nights.',
    'Up to 12 hours of dryness',
    135, 180,
    (select id from public.categories where slug = 'baby-care-essentials'),
    'Glow-Up Baby', array['sensitive'], array[]::text[],
    'Soft non-woven top sheet, absorbent pulp, breathable back sheet',
    'Change after each feed or when soiled. Dispose of soiled diapers in a bin.',
    'Fewer leaks, dry nights, gentle on newborn skin',
    array['Size 2','Size 3','Size 4'],
    array['/images/products/baby-diapers.webp'], '/images/products/baby-diapers.webp',
    74, 4.80, 311, 1420, true, true
  )
on conflict (slug) do nothing;

-- Branded staples + the shampoo/conditioner and mother-care lines -------------
insert into public.products (
  name, slug, description, short_description, price, compare_at_price,
  category_id, brand, brand_id, skin_types, concerns, ingredients, how_to_use, benefits,
  sizes, images, thumbnail, stock_quantity, rating, reviews_count, sold_count,
  is_featured, is_active
)
values
  (
    'Silk Smooth Conditioner 500ml', 'silk-smooth-conditioner-500ml',
    'A rich, silicone-free conditioner with shea and panthenol that melts knots out of braids, naturals and relaxed hair in three minutes.',
    'Detangles in 3 minutes, no build-up',
    95, 130,
    (select id from public.categories where slug = 'haircare'),
    'Glow-Up Hair', (select id from public.brands where slug = 'glow-up'),
    array['normal','dry'], array['dryness','breakage'],
    'Shea butter, panthenol, coconut oil, cetrimonium chloride',
    'After shampooing, apply from mid-length to ends, leave 3 minutes and rinse thoroughly.',
    'Softer hair, easy detangling, less breakage',
    array['500ml','1L'],
    array['/images/products/shampoo.webp'], '/images/products/shampoo.webp',
    46, 4.70, 88, 320, true, true
  ),
  (
    'Mother Care Stretch Mark Cream 200ml', 'mother-care-stretch-mark-cream-200ml',
    'Cocoa butter, shea and vitamin E cream for the belly, hips and thighs through pregnancy and after. Fragrance-light and safe for breastfeeding mums.',
    'Cocoa butter cream for pregnancy skin',
    119, 160,
    (select id from public.categories where slug = 'mothercare-pregnancy'),
    'Glow-Up', (select id from public.brands where slug = 'glow-up'),
    array['dry','sensitive','normal'], array['stretch-marks','dryness'],
    'Cocoa butter, shea butter, vitamin E, squalane',
    'Massage into the belly, hips and thighs twice a day from the second trimester.',
    'Improves elasticity, soothes itchy stretching skin',
    array['200ml'],
    array['/images/products/baby-lotion.webp'], '/images/products/baby-lotion.webp',
    38, 4.80, 64, 210, true, true
  ),
  (
    'Nivea Cocoa Nourish Body Lotion 400ml', 'nivea-cocoa-nourish-body-lotion-400ml',
    'Nivea''s deep moisture serum with cocoa butter for 48-hour hydration on very dry skin. A Ghanaian favourite in harmattan.',
    '48-hour moisture for very dry skin',
    89, 115,
    (select id from public.categories where slug = 'bath-body-care'),
    'Nivea', (select id from public.brands where slug = 'nivea'),
    array['dry','normal'], array['dryness','dullness'],
    'Cocoa butter, glycerin, deep moisture serum',
    'Apply daily after showering, focusing on elbows, knees and heels.',
    '48-hour moisture, softer skin',
    array['400ml'],
    array['/images/products/body-lotion.webp'], '/images/products/body-lotion.webp',
    120, 4.80, 402, 2100, true, true
  ),
  (
    'Vaseline Cocoa Radiant Body Lotion 400ml', 'vaseline-cocoa-radiant-body-lotion-400ml',
    'Vaseline cocoa butter and pure petroleum jelly lotion that leaves skin glowing without feeling greasy.',
    'Glow-boosting cocoa butter lotion',
    75, 98,
    (select id from public.categories where slug = 'bath-body-care'),
    'Vaseline', (select id from public.brands where slug = 'vaseline'),
    array['normal','dry'], array['dullness','dryness'],
    'Cocoa butter, pure petroleum jelly, glycerin',
    'Smooth over damp skin after bathing for all-day glow.',
    'Radiant glow, locks in moisture',
    array['400ml'],
    array['/images/products/body-lotion.webp'], '/images/products/body-lotion.webp',
    96, 4.70, 288, 1750, true, true
  ),
  (
    'Johnson''s Baby Shampoo 500ml', 'johnsons-baby-shampoo-500ml',
    'The original no-more-tears baby shampoo, pH-balanced and free from parabens and dyes.',
    'No more tears, pH balanced',
    62, 80,
    (select id from public.categories where slug = 'haircare'),
    'Johnson''s Baby', (select id from public.brands where slug = 'johnsons-baby'),
    array['sensitive','normal'], array['sensitivity'],
    'Water, mild cleansers, glycerin, fragrance',
    'Wet baby''s hair, lather gently with a little shampoo, then rinse with warm water.',
    'Gentle cleansing, no stinging eyes',
    array['500ml'],
    array['/images/products/shampoo.webp'], '/images/products/shampoo.webp',
    88, 4.90, 520, 2600, true, true
  ),
  (
    'Dove Intense Repair Shampoo 400ml', 'dove-intense-repair-shampoo-400ml',
    'Keratin-actives shampoo that repairs damaged, chemically treated hair from the first wash.',
    'For dry, damaged and relaxed hair',
    79, 105,
    (select id from public.categories where slug = 'haircare'),
    'Dove', (select id from public.brands where slug = 'dove'),
    array['normal','dry'], array['breakage','dryness'],
    'Keratin repair actives, glycerin, mild surfactants',
    'Massage into wet hair, lather, then rinse. Follow with Dove Intense Repair Conditioner.',
    'Repairs damage, softer hair',
    array['400ml'],
    array['/images/products/shampoo.webp'], '/images/products/shampoo.webp',
    64, 4.60, 341, 1290, false, true
  ),
  (
    'Johnson''s Baby Soft Lotion 400ml', 'johnsons-baby-soft-lotion-400ml',
    'Clinically proven mildness for delicate baby skin, with a light, clean scent that mums love.',
    'Clinically proven mildness',
    58, 75,
    (select id from public.categories where slug = 'baby-care-essentials'),
    'Johnson''s Baby', (select id from public.brands where slug = 'johnsons-baby'),
    array['sensitive'], array[]::text[],
    'Water, glycerin, mineral oil, mild fragrance',
    'Apply to baby''s skin after every bath, morning and night.',
    'Soft, moisturised baby skin',
    array['400ml'],
    array['/images/products/baby-lotion.webp'], '/images/products/baby-lotion.webp',
    92, 4.90, 611, 2900, true, true
  )
on conflict (slug) do nothing;

-- Link every product that has a brand name to its brands row ---------------
update public.products p
   set brand_id = b.id
  from public.brands b
 where p.brand_id is null
   and lower(p.brand) = lower(b.name);

-- ---------------------------------------------------------------------------
-- Import note: banners above omit text_color/overlay_opacity on purpose so the
-- table defaults apply.


-- ---------------------------------------------------------------------------
-- Cost prices, "who it is for" and exact sizes
-- cost_price is what YOU pay the supplier per unit — it powers the profit
-- reports in /admin/accounting. Update it from the product form or by
-- recording a stock purchase in /admin/purchases.
-- ---------------------------------------------------------------------------
update public.products p set
  cost_price = v.cost_price,
  who_for    = v.who_for
from (values
  ('shea-butter-body-lotion-400ml',            52.00, 'Dry, ashy and very dry skin'),
  ('vitamin-c-glow-serum-30ml',                96.00, 'Dull skin, dark spots, uneven tone'),
  ('hydra-boost-face-cream-50g',               84.00, 'Dry, sensitive and combination skin'),
  ('gentle-foam-face-wash-150ml',              44.00, 'All skin types, including sensitive'),
  ('nourishing-argan-shampoo-500ml',           57.00, 'Braids, naturals, relaxed or fine hair'),
  ('baby-diapers-jumbo-pack-60pcs',            92.00, 'Newborns and toddlers (sizes 2–4)'),
  ('silk-smooth-conditioner-500ml',            61.00, 'Dry, knotty or heat-styled hair'),
  ('mother-care-stretch-mark-cream-200ml',     74.00, 'Expectant and breastfeeding mothers'),
  ('nivea-cocoa-nourish-body-lotion-400ml',    58.00, 'Very dry skin, harmattan skin'),
  ('vaseline-cocoa-radiant-body-lotion-400ml', 49.00, 'Dull skin that needs a glow'),
  ('johnsons-baby-shampoo-500ml',              41.00, 'Babies and children 0+ months'),
  ('dove-intense-repair-shampoo-400ml',        52.00, 'Dry, damaged or chemically treated hair'),
  ('johnsons-baby-soft-lotion-400ml',          38.00, 'Newborns 0+ months and sensitive skin')
) as v(slug, cost_price, who_for)
where p.slug = v.slug;

-- Every listing states its exact size in ml / g / count.
update public.products set sizes = array['400ml']   where slug = 'nivea-cocoa-nourish-body-lotion-400ml';
update public.products set sizes = array['400ml']   where slug = 'vaseline-cocoa-radiant-body-lotion-400ml';
update public.products set sizes = array['500ml']   where slug = 'johnsons-baby-shampoo-500ml';
update public.products set sizes = array['400ml']   where slug = 'dove-intense-repair-shampoo-400ml';
update public.products set sizes = array['400ml']   where slug = 'johnsons-baby-soft-lotion-400ml';
update public.products set sizes = array['60 wipes'] where slug = 'baby-diapers-jumbo-pack-60pcs';

-- Bundle: the hospital-bag set for expectant mothers (Nsawam & Doboro favourite)
insert into public.products (
  name, slug, description, short_description, price, compare_at_price,
  category_id, brand, brand_id, skin_types, concerns, ingredients, how_to_use, benefits,
  sizes, images, thumbnail, stock_quantity, cost_price, who_for, rating, reviews_count,
  sold_count, is_featured, is_active
)
select
  'Hospital Bag Bundle (Mum & Baby)',
  'hospital-bag-bundle-mum-and-baby',
  'Everything on the hospital bag checklist in one box: stretch-mark cream, nipple balm-friendly baby lotion, tear-free baby wash, a 60-piece diaper pack and maternity pads.',
  'The hospital bag checklist in one box',
  399, 520,
  (select id from public.categories where slug = 'bundles-offers'),
  'Glow-Up', (select id from public.brands where slug = 'glow-up'),
  array['sensitive','dry'], array['dryness','sensitivity'],
  'Stretch mark cream 200ml, baby lotion 400ml, baby wash 500ml, 60 diapers, maternity pads',
  'Pack it in your hospital bag from week 34. Use the cream twice daily on the belly and hips.',
  'Saves GH₵121, everything a new mum needs in one trip',
  array['5-piece set'],
  array['/images/products/baby-lotion.webp'], '/images/products/baby-lotion.webp',
  15, 268.00, 'Expectant mothers from 34 weeks',
  4.90, 41, 96, true, true
where not exists (
  select 1 from public.products where slug = 'hospital-bag-bundle-mum-and-baby'
);

-- ---------------------------------------------------------------------------
-- Suppliers, opening stock purchases and running expenses (bookkeeping)
-- Replace these with your real suppliers — the numbers are examples that make
-- /admin/accounting show a complete picture from day one.
-- ---------------------------------------------------------------------------
insert into public.suppliers (name, contact_person, phone, email, address, payment_terms, notes)
values
  ('Nsawam Wholesale Cosmetics', 'Mr. Boateng', '0244123456', 'orders@nsawamwholesale.example', 'Nsawam Market, Eastern Region', 'Cash on delivery', 'Main supplier for Nivea, Vaseline and Dove.'),
  ('Accra Beauty Distributors',  'Auntie Efua', '0201987654', 'sales@accrabeauty.example',     'Circle, Accra',                 '14 days',          'Johnson''s Baby and Cetaphil; delivers on Tuesdays.'),
  ('Glow-Up Imports',            'Kofi Mensah', '0555551234', 'imports@glowup.example',        'Tema Harbour',                  '50% deposit',      'Own-brand Glow-Up range, sea freight.')
on conflict (lower(name)) do nothing;

insert into public.stock_purchases (supplier_id, product_id, quantity, unit_cost, amount_paid, payment_method, reference, purchased_at, note)
select s.id, p.id, v.quantity, v.unit_cost, v.amount_paid, v.payment_method, v.reference, current_date - v.days_ago, v.note
from (values
  ('Nsawam Wholesale Cosmetics', 'nivea-cocoa-nourish-body-lotion-400ml',    40, 58.00, 2320.00, 'momo', 'NWC-1041', 21, 'Opening stock'),
  ('Nsawam Wholesale Cosmetics', 'vaseline-cocoa-radiant-body-lotion-400ml', 36, 49.00, 1764.00, 'momo', 'NWC-1042', 21, 'Opening stock'),
  ('Accra Beauty Distributors',  'johnsons-baby-soft-lotion-400ml',          48, 38.00, 1824.00, 'cash', 'ABD-2207', 14, 'Opening stock'),
  ('Accra Beauty Distributors',  'johnsons-baby-shampoo-500ml',              36, 41.00, 1476.00, 'cash', 'ABD-2208', 14, 'Opening stock'),
  ('Glow-Up Imports',            'shea-butter-body-lotion-400ml',            60, 52.00, 1560.00, 'bank', 'GUI-3301', 30, '50% deposit paid'),
  ('Glow-Up Imports',            'mother-care-stretch-mark-cream-200ml',     24, 74.00, 1776.00, 'bank', 'GUI-3302', 30, 'Deposit paid')
) as v(supplier, slug, quantity, unit_cost, amount_paid, payment_method, reference, days_ago, note)
join public.suppliers s on s.name = v.supplier
join public.products  p on p.slug = v.slug
where not exists (
  select 1 from public.stock_purchases sp where sp.reference = v.reference
);

insert into public.expenses (category, description, amount, payment_method, reference, spent_at)
select v.category, v.description, v.amount, v.payment_method, v.reference, current_date - v.days_ago
from (values
  ('rent',      'Shop rent — East Doboro (monthly)',      800.00, 'momo', 'RENT-01',  20),
  ('transport', 'Tricycle delivery runs around Nsawam',   120.00, 'cash', 'TRIP-014', 12),
  ('internet',  'MTN data bundle for orders & WhatsApp',   80.00, 'momo', 'DATA-09',  10),
  ('packaging', 'Branded paper bags and tissue',          150.00, 'cash', 'PACK-02',   6),
  ('utilities', 'ECG prepaid top-up',                      90.00, 'momo', 'ECG-77',    3)
) as v(category, description, amount, payment_method, reference, days_ago)
where not exists (
  select 1 from public.expenses e where e.reference = v.reference
);

-- ---------------------------------------------------------------------------
-- Shipping zones (Ghana)
-- ---------------------------------------------------------------------------
insert into public.shipping_zones (country, region, town, shipping_fee, estimated_days_min, estimated_days_max, sort_order)
values
  ('Ghana','Eastern','East Doboro (pickup at shop)', 0, 0, 0, 1),
  ('Ghana','Eastern','Doboro',               10, 0, 1, 2),
  ('Ghana','Eastern','Nsawam',               15, 0, 1, 3),
  ('Ghana','Eastern','Adoagyiri',            15, 0, 1, 4),
  ('Ghana','Eastern','Nsawam Market',        15, 0, 1, 5),
  ('Ghana','Greater Accra','Accra Central', 25, 1, 2, 10),
  ('Ghana','Greater Accra','East Legon',    25, 1, 2, 2),
  ('Ghana','Greater Accra','Madina',        25, 1, 2, 3),
  ('Ghana','Greater Accra','Tema',          30, 1, 2, 4),
  ('Ghana','Greater Accra','Kasoa',         35, 1, 3, 5),
  ('Ghana','Greater Accra','Adenta',        30, 1, 2, 6),
  ('Ghana','Ashanti','Kumasi',              35, 1, 3, 7),
  ('Ghana','Ashanti','Obuasi',              40, 2, 3, 8),
  ('Ghana','Western','Takoradi',            40, 2, 4, 9),
  ('Ghana','Central','Cape Coast',          40, 2, 4, 10),
  ('Ghana','Northern','Tamale',             50, 3, 5, 12)
on conflict (country, region, town) do nothing;

-- Give every zone a display name (the admin UI shows `name`).
update public.shipping_zones
   set name = coalesce(nullif(name, ''), town);

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
    ('Glow season starts here.', 'Up to 40% off skin care', 'Authentic body lotions, serums, face creams and baby care — delivered nationwide across Ghana.', '/images/hero-skincare.webp', '/products', 'Shop the sale', 1, true),
    ('Soft skin, all harmattan.', 'Body care edit', 'Shea-rich lotions and shower creams that keep ash away for 24 hours. Free delivery over GH₵300.', '/images/hero-skincare.webp', '/categories/body-lotions', 'Shop body care', 2, true),
    ('Gentle care for little ones.', 'Baby care bundle', 'Paediatrician-tested lotions, washes and jumbo diaper packs — now at bundle prices.', '/images/hero-skincare.webp', '/categories/baby-care', 'Shop baby care', 3, true)
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
    '/images/products/body-lotion.webp',
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
    '/images/products/face-wash.webp',
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
    '/images/products/baby-lotion.webp',
    'Baby care',
    array['baby','sensitive skin'],
    array['sensitive'],
    'published', false, 3, timezone('utc', now())
  )
on conflict (slug) do nothing;

-- One local, educational guide a month — this month: the hospital bag checklist.
insert into public.blog_posts (title, slug, excerpt, content, cover_image, category, tags, skin_types, status, is_featured, read_minutes, published_at)
values (
  'Hospital Bag Checklist for Expectant Mothers in Nsawam & Doboro',
  'hospital-bag-checklist-nsawam-doboro',
  'What to pack from week 34, where to buy it locally, and why the hygiene rules at the hospital matter for baby creams.',
  E'## Pack from week 34\n\nThe hospitals around Nsawam and Doboro ask you to bring your own baby care items, so pack them early and keep the bag by the door.\n\n## For mum\n\n1. Stretch-mark cream (200ml is enough for a five-day stay).\n2. Maternity pads — two packs.\n3. Two loose nightgowns that open at the front.\n4. Toiletries: soap, toothbrush, towel, sanitary pads.\n5. Your antenatal card and NHIS card.\n\n## For baby\n\n1. 60 diapers (newborn size for the first week).\n2. Tear-free baby wash and shampoo.\n3. Baby lotion, fragrance-free.\n4. Two cotton hats, three vests, one wrapper.\n5. Baby wipes and a barrier cream.\n\n## Do you need to sterilise everything?\n\nNo. Wash new clothes and towels in warm water, dry them in the sun, and keep creams sealed until you need them — sealed, unopened items are also the only ones our shop can exchange.\n\n## Where to buy in Doboro\n\nWe are beside St. George''s Height in East Doboro, Monday to Saturday 8am–8pm and Sunday 1pm–7pm. The Hospital Bag Bundle already contains the mum-and-baby essentials, or send us a WhatsApp message and we will pack it for you.',
  '/images/products/baby-lotion.webp', 'Motherhood', array['hospital bag','pregnancy','nsawam'], array['sensitive'],
  'published', true, 5, timezone('utc', now())
)
on conflict (slug) do nothing;
