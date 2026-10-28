-- ============================================================================
--  Sally Skin Care — Supabase schema
--  Run this once in the Supabase SQL editor (or `supabase db push`).
--  Safe to re-run: every object is created with IF NOT EXISTS / OR REPLACE.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 0. Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  phone       text,
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Admin check used by RLS policies (security definer avoids recursion)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Create a profile automatically for every new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Catalogue
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  icon        text,
  image_url   text,
  parent_id   uuid references public.categories (id) on delete set null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  archived    boolean not null default false,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- Skin type vocabulary managed from /admin/skin-types.
-- products.skin_types stores the slugs from this table.
create table if not exists public.skin_types (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  emoji       text,
  description text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);

drop trigger if exists skin_types_updated_at on public.skin_types;
create trigger skin_types_updated_at
  before update on public.skin_types
  for each row execute function public.set_updated_at();

-- Brand vocabulary managed from /admin/brands (Nivea, Vaseline, Johnson's Baby…).
-- products.brand_id points here; products.brand keeps the display name.
create table if not exists public.brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  logo_url    text,
  website_url text,
  country     text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);

-- One brand per name (case-insensitive), so "Nivea" and "nivea" cannot duplicate.
create unique index if not exists brands_name_unique_idx on public.brands (lower(name));

drop trigger if exists brands_updated_at on public.brands;
create trigger brands_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  description      text,
  short_description text,

  price            numeric(12, 2) not null default 0 check (price >= 0),
  compare_at_price numeric(12, 2) check (compare_at_price is null or compare_at_price >= 0),

  category_id      uuid references public.categories (id) on delete set null,
  brand            text,
  brand_id         uuid references public.brands (id) on delete set null,

  -- Skin care specifics
  skin_types       text[] not null default '{}',   -- normal, dry, oily, combination, sensitive, acne-prone
  concerns         text[] not null default '{}',   -- dark-spots, acne, dryness, dullness, ageing…
  ingredients      text,
  how_to_use       text,
  benefits         text,

  -- Options (pack sizes / volumes) + gallery
  sizes            text[] not null default '{}',
  colors           text[] not null default '{}',
  images           text[] not null default '{}',
  thumbnail        text,

  -- Who the product is for, e.g. "Oily / blemish-prone skin", "Newborns 0+ months"
  who_for          text,

  -- Inventory & costing
  sku              text,
  cost_price       numeric(12, 2) not null default 0 check (cost_price >= 0),
  stock_quantity   integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 10,
  weight_grams     integer,

  -- Merchandising
  rating           numeric(3, 2) not null default 0,
  reviews_count    integer not null default 0,
  sold_count       integer not null default 0,
  is_featured      boolean not null default false,
  is_active        boolean not null default true,
  archived         boolean not null default false,

  -- SEO / extra
  seo_title        text,
  seo_description  text,
  metadata         jsonb not null default '{}'::jsonb,

  created_at       timestamptz not null default timezone('utc', now()),
  updated_at       timestamptz not null default timezone('utc', now())
);

-- Older projects created before brands existed get the column added in place.
alter table public.products
  add column if not exists brand_id uuid references public.brands (id) on delete set null;
-- Costing and "who it is for" (added in place for existing projects too).
alter table public.products add column if not exists cost_price numeric(12, 2) not null default 0;
alter table public.products add column if not exists who_for text;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_brand_idx on public.products (brand_id);
create index if not exists products_brand_name_idx on public.products (lower(brand));
create index if not exists products_active_idx on public.products (is_active, archived);
create index if not exists products_created_idx on public.products (created_at desc);
create index if not exists products_name_trgm_idx on public.products using gin (to_tsvector('simple', name || ' ' || coalesce(description, '')));
create index if not exists products_skin_types_idx on public.products using gin (skin_types);

-- Product variants (size x colour) — optional, used when a product has
-- several genuinely different SKUs.
create table if not exists public.product_variants (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products (id) on delete cascade,
  size             text not null default 'default',
  color            text not null default 'default',
  price            numeric(12, 2) not null default 0,
  compare_at_price numeric(12, 2),
  stock_quantity   integer not null default 0 check (stock_quantity >= 0),
  sku              text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default timezone('utc', now()),
  updated_at       timestamptz not null default timezone('utc', now()),
  unique (product_id, size, color)
);

drop trigger if exists product_variants_updated_at on public.product_variants;
create trigger product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- Stock movement log (audit trail for the admin stock manager)
create table if not exists public.inventory_movements (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  change      integer not null,
  reason      text not null default 'manual-adjustment',
  note        text,
  order_id    uuid,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default timezone('utc', now())
);

create index if not exists inventory_movements_product_idx
  on public.inventory_movements (product_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Merchandising (banners + showrooms)
-- ---------------------------------------------------------------------------
create table if not exists public.banners (
  id              uuid primary key default gen_random_uuid(),
  title           text,
  subtitle        text,
  description     text,
  image_url       text not null,
  link_url        text,
  link_text       text default 'Shop Now',
  text_color      text default '#FFFFFF',
  overlay_opacity numeric(3, 2) default 0.4,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  archived    boolean not null default false,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);

drop trigger if exists banners_updated_at on public.banners;
create trigger banners_updated_at
  before update on public.banners
  for each row execute function public.set_updated_at();

create table if not exists public.showrooms (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  description      text,
  icon             text,
  type             text not null default 'manual'
                   check (type in ('manual', 'auto_new', 'auto_deals', 'auto_bestselling')),
  max_products     integer not null default 8,
  sort_order       integer not null default 0,
  show_on_homepage boolean not null default true,
  is_active        boolean not null default true,
  archived         boolean not null default false,
  created_at       timestamptz not null default timezone('utc', now()),
  updated_at       timestamptz not null default timezone('utc', now())
);

drop trigger if exists showrooms_updated_at on public.showrooms;
create trigger showrooms_updated_at
  before update on public.showrooms
  for each row execute function public.set_updated_at();

create table if not exists public.showroom_products (
  id          uuid primary key default gen_random_uuid(),
  showroom_id uuid not null references public.showrooms (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default timezone('utc', now()),
  unique (showroom_id, product_id)
);

-- ---------------------------------------------------------------------------
-- 4. Cart
-- ---------------------------------------------------------------------------
create table if not exists public.carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  session_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create table if not exists public.cart_items (
  id             uuid primary key default gen_random_uuid(),
  cart_id        uuid not null references public.carts (id) on delete cascade,
  product_id     uuid not null references public.products (id) on delete cascade,
  quantity       integer not null default 1 check (quantity > 0),
  selected_size  text,
  selected_color text,
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now())
);

create unique index if not exists cart_items_unique_line
  on public.cart_items (cart_id, product_id, coalesce(selected_size, ''), coalesce(selected_color, ''));

-- ---------------------------------------------------------------------------
-- 5. Orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique,
  user_id           uuid references auth.users (id) on delete set null,
  status            text not null default 'pending'
                    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  subtotal          numeric(12, 2) not null default 0,
  tax_amount        numeric(12, 2) not null default 0,
  shipping_amount   numeric(12, 2) not null default 0,
  discount_amount   numeric(12, 2) not null default 0,
  total_amount      numeric(12, 2) not null default 0,
  payment_status    text not null default 'pending'
                    check (payment_status in ('pending','paid','failed','refunded')),
  payment_method    text not null default 'cod'
                    check (payment_method in ('cod','card','mpesa','momo')),
  payment_intent_id text,
  shipping_address  jsonb not null default '{}'::jsonb,
  shipping_zone_id  uuid,
  delivery_method   text not null default 'delivery' check (delivery_method in ('delivery','pickup')),
  notes             text,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default timezone('utc', now()),
  updated_at        timestamptz not null default timezone('utc', now())
);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  product_id      uuid references public.products (id) on delete set null,
  product_name    text not null,
  product_image   text,
  quantity        integer not null default 1 check (quantity > 0),
  unit_price      numeric(12, 2) not null default 0,
  unit_cost       numeric(12, 2) not null default 0,
  total_price     numeric(12, 2) not null default 0,
  selected_size   text,
  selected_color  text,
  created_at      timestamptz not null default timezone('utc', now())
);

alter table public.order_items add column if not exists unit_cost numeric(12, 2) not null default 0;

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- 6. Shipping
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_zones (
  id                 uuid primary key default gen_random_uuid(),
  name               text,
  postal_code_prefix text,
  country            text not null default 'Ghana',
  region             text not null,
  town               text not null,
  shipping_fee       numeric(12, 2) not null default 0,
  free_over_amount   numeric(12, 2),
  estimated_days_min integer not null default 1,
  estimated_days_max integer not null default 3,
  is_active          boolean not null default true,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default timezone('utc', now()),
  updated_at         timestamptz not null default timezone('utc', now())
);

drop trigger if exists shipping_zones_updated_at on public.shipping_zones;
create trigger shipping_zones_updated_at
  before update on public.shipping_zones
  for each row execute function public.set_updated_at();

create unique index if not exists shipping_zones_unique_town
  on public.shipping_zones (country, region, town);

create table if not exists public.shipping_discount_codes (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  description    text,
  discount_type  text not null default 'free_shipping'
                 check (discount_type in ('free_shipping','fixed_amount','percentage')),
  discount_value numeric(12, 2) not null default 0,
  min_order_amount numeric(12, 2),
  max_uses       integer,
  used_count     integer not null default 0,
  starts_at      timestamptz,
  expires_at     timestamptz,
  is_active      boolean not null default true,
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now())
);

create table if not exists public.shipping_code_uses (
  id         uuid primary key default gen_random_uuid(),
  code_id    uuid not null references public.shipping_discount_codes (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  order_id   uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (code_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 7. Blog
-- ---------------------------------------------------------------------------
create table if not exists public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  excerpt         text,
  content         text not null default '',
  cover_image     text,
  category        text,                 -- e.g. "Skin care tips", "Routine", "Ingredients"
  tags            text[] not null default '{}',
  skin_types      text[] not null default '{}',
  author_name     text not null default 'Sally Skin Care',
  status          text not null default 'draft' check (status in ('draft','published','archived')),
  is_featured     boolean not null default false,
  read_minutes    integer not null default 4,
  published_at    timestamptz,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now())
);

drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

create index if not exists blog_posts_status_idx
  on public.blog_posts (status, published_at desc);

-- ---------------------------------------------------------------------------
-- 8. Newsletter
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  source     text default 'website',
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- 9. Suppliers, stock purchases, expenses (bookkeeping)
-- ---------------------------------------------------------------------------
create table if not exists public.suppliers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  contact_person text,
  phone          text,
  email          text,
  address        text,
  notes          text,
  payment_terms  text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now())
);

drop trigger if exists suppliers_updated_at on public.suppliers;
create trigger suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

-- Every delivery of stock you buy in. Recording one raises stock, updates the
-- product's moving-average cost price and logs an inventory movement.
create table if not exists public.stock_purchases (
  id             uuid primary key default gen_random_uuid(),
  supplier_id    uuid references public.suppliers (id) on delete set null,
  product_id     uuid not null references public.products (id) on delete cascade,
  quantity       integer not null check (quantity > 0),
  unit_cost      numeric(12, 2) not null default 0 check (unit_cost >= 0),
  total_cost     numeric(12, 2) generated always as (quantity * unit_cost) stored,
  amount_paid    numeric(12, 2) not null default 0 check (amount_paid >= 0),
  payment_method text not null default 'cash',
  reference      text,
  note           text,
  purchased_at   date not null default current_date,
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default timezone('utc', now())
);

create index if not exists stock_purchases_product_idx
  on public.stock_purchases (product_id, purchased_at desc);
create index if not exists stock_purchases_supplier_idx
  on public.stock_purchases (supplier_id, purchased_at desc);

-- Running costs that are not stock: rent, transport, data, salaries, packaging…
create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),
  category       text not null default 'other',
  description    text not null,
  amount         numeric(12, 2) not null check (amount > 0),
  payment_method text not null default 'cash',
  supplier_id    uuid references public.suppliers (id) on delete set null,
  reference      text,
  spent_at       date not null default current_date,
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default timezone('utc', now())
);

create index if not exists expenses_spent_idx on public.expenses (spent_at desc);

-- One row per supplier name, so the seed and the admin form cannot create twins.
create unique index if not exists suppliers_name_unique_idx on public.suppliers (lower(name));

-- ---------------------------------------------------------------------------
-- 10. Accounting views (used by /admin/accounting)
-- ---------------------------------------------------------------------------
create or replace view public.inventory_valuation as
select
  p.id,
  p.name,
  p.sku,
  p.stock_quantity,
  p.cost_price,
  p.price,
  (p.stock_quantity * p.cost_price)::numeric(12, 2) as stock_value_cost,
  (p.stock_quantity * p.price)::numeric(12, 2)      as stock_value_retail,
  ((p.price - p.cost_price) * p.stock_quantity)::numeric(12, 2) as potential_profit
from public.products p
where p.archived = false;

create or replace view public.monthly_pnl as
with revenue as (
  select
    to_char(date_trunc('month', o.created_at), 'YYYY-MM') as month,
    sum(o.total_amount)                                   as revenue,
    sum(i.cost)                                           as cogs
  from public.orders o
  left join (
    select order_id, sum(quantity * unit_cost) as cost
    from public.order_items
    group by order_id
  ) i on i.order_id = o.id
  where o.status not in ('cancelled', 'refunded')
  group by 1
),
spend as (
  select to_char(date_trunc('month', purchased_at), 'YYYY-MM') as month,
         sum(amount_paid) as stock_spend
  from public.stock_purchases
  group by 1
),
costs as (
  select to_char(date_trunc('month', spent_at), 'YYYY-MM') as month,
         sum(amount) as expenses
  from public.expenses
  group by 1
)
select
  coalesce(r.month, s.month, c.month)                 as month,
  coalesce(r.revenue, 0)::numeric(12, 2)              as revenue,
  coalesce(r.cogs, 0)::numeric(12, 2)                 as cogs,
  (coalesce(r.revenue, 0) - coalesce(r.cogs, 0))::numeric(12, 2) as gross_profit,
  coalesce(c.expenses, 0)::numeric(12, 2)             as expenses,
  coalesce(s.stock_spend, 0)::numeric(12, 2)          as stock_spend,
  (coalesce(r.revenue, 0) - coalesce(r.cogs, 0) - coalesce(c.expenses, 0))::numeric(12, 2)
    as net_profit
from revenue r
full join spend s on s.month = r.month
full join costs c on c.month = coalesce(r.month, s.month);

create or replace view public.supplier_balances as
select
  s.id,
  s.name,
  s.phone,
  s.is_active,
  coalesce(sum(p.total_cost), 0)::numeric(12, 2)   as total_purchases,
  coalesce(sum(p.amount_paid), 0)::numeric(12, 2)  as total_paid,
  (coalesce(sum(p.total_cost), 0) - coalesce(sum(p.amount_paid), 0))::numeric(12, 2) as balance_owed,
  max(p.purchased_at)                              as last_purchase
from public.suppliers s
left join public.stock_purchases p on p.supplier_id = s.id
group by s.id, s.name, s.phone, s.is_active;

-- ---------------------------------------------------------------------------
-- 11. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles                  enable row level security;
alter table public.categories                enable row level security;
alter table public.skin_types               enable row level security;
alter table public.brands                   enable row level security;
alter table public.products                  enable row level security;
alter table public.product_variants          enable row level security;
alter table public.inventory_movements       enable row level security;
alter table public.suppliers                 enable row level security;
alter table public.stock_purchases           enable row level security;
alter table public.expenses                  enable row level security;
alter table public.banners                   enable row level security;
alter table public.showrooms                 enable row level security;
alter table public.showroom_products         enable row level security;
alter table public.carts                     enable row level security;
alter table public.cart_items                enable row level security;
alter table public.orders                    enable row level security;
alter table public.order_items               enable row level security;
alter table public.shipping_zones            enable row level security;
alter table public.shipping_discount_codes   enable row level security;
alter table public.shipping_code_uses        enable row level security;
alter table public.blog_posts                enable row level security;
alter table public.newsletter_subscribers    enable row level security;

-- Drop old policies so this script is idempotent
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles','categories','skin_types','brands','products','product_variants','inventory_movements',
        'banners','showrooms','showroom_products','carts','cart_items','orders',
        'order_items','shipping_zones','shipping_discount_codes','shipping_code_uses',
        'blog_posts','newsletter_subscribers','suppliers','stock_purchases','expenses'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Profiles ------------------------------------------------------------------
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id or public.is_admin());
create policy "profiles: admin insert" on public.profiles
  for insert with check (public.is_admin());

-- Public catalogue ----------------------------------------------------------
create policy "categories: public read active" on public.categories
  for select using ((is_active and not archived) or public.is_admin());
create policy "categories: admin write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "skin types: public read active" on public.skin_types
  for select using (is_active or public.is_admin());
create policy "skin types: admin write" on public.skin_types
  for all using (public.is_admin()) with check (public.is_admin());

create policy "brands: public read active" on public.brands
  for select using (is_active or public.is_admin());
create policy "brands: admin write" on public.brands
  for all using (public.is_admin()) with check (public.is_admin());

create policy "products: public read active" on public.products
  for select using ((is_active and not archived) or public.is_admin());
create policy "products: admin write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "variants: public read" on public.product_variants
  for select using (true or public.is_admin());
create policy "variants: admin write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

create policy "suppliers: admin only" on public.suppliers
  for all using (public.is_admin()) with check (public.is_admin());

create policy "purchases: admin only" on public.stock_purchases
  for all using (public.is_admin()) with check (public.is_admin());

create policy "expenses: admin only" on public.expenses
  for all using (public.is_admin()) with check (public.is_admin());

create policy "inventory: admin only" on public.inventory_movements
  for all using (public.is_admin()) with check (public.is_admin());

create policy "banners: public read active" on public.banners
  for select using ((is_active and not archived) or public.is_admin());
create policy "banners: admin write" on public.banners
  for all using (public.is_admin()) with check (public.is_admin());

create policy "showrooms: public read active" on public.showrooms
  for select using ((is_active and not archived) or public.is_admin());
create policy "showrooms: admin write" on public.showrooms
  for all using (public.is_admin()) with check (public.is_admin());

create policy "showroom products: public read" on public.showroom_products
  for select using (true);
create policy "showroom products: admin write" on public.showroom_products
  for all using (public.is_admin()) with check (public.is_admin());

-- Blog ----------------------------------------------------------------------
create policy "blog: public read published" on public.blog_posts
  for select using (status = 'published' or public.is_admin());
create policy "blog: admin write" on public.blog_posts
  for all using (public.is_admin()) with check (public.is_admin());

-- Carts ---------------------------------------------------------------------
create policy "carts: owner read" on public.carts
  for select using (auth.uid() = user_id or public.is_admin());
create policy "carts: owner write" on public.carts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cart items: owner" on public.cart_items
  for all using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
    or public.is_admin()
  );

-- Orders --------------------------------------------------------------------
create policy "orders: owner read" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "orders: owner insert" on public.orders
  for insert with check (auth.uid() = user_id or public.is_admin());
create policy "orders: admin update" on public.orders
  for update using (public.is_admin());

create policy "order items: owner read" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );
create policy "order items: owner insert" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );

-- Shipping ------------------------------------------------------------------
create policy "zones: public read active" on public.shipping_zones
  for select using (is_active or public.is_admin());
create policy "zones: admin write" on public.shipping_zones
  for all using (public.is_admin()) with check (public.is_admin());

create policy "codes: public read active" on public.shipping_discount_codes
  for select using (is_active or public.is_admin());
create policy "codes: admin write" on public.shipping_discount_codes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "code uses: owner" on public.shipping_code_uses
  for select using (auth.uid() = user_id or public.is_admin());
create policy "code uses: owner insert" on public.shipping_code_uses
  for insert with check (auth.uid() = user_id or public.is_admin());

-- Newsletter ----------------------------------------------------------------
create policy "newsletter: anyone insert" on public.newsletter_subscribers
  for insert with check (true);
create policy "newsletter: admin read" on public.newsletter_subscribers
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 12. Stock helper: adjust stock and log the movement atomically
-- ---------------------------------------------------------------------------
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_change integer,
  p_reason text default 'manual-adjustment',
  p_note text default null
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.products;
begin
  if not public.is_admin() then
    raise exception 'Only admins can adjust stock';
  end if;

  update public.products
     set stock_quantity = greatest(0, stock_quantity + p_change)
   where id = p_product_id
   returning * into updated;

  if updated.id is null then
    raise exception 'Product not found';
  end if;

  insert into public.inventory_movements (product_id, change, reason, note, created_by)
  values (p_product_id, p_change, p_reason, p_note, auth.uid());

  return updated;
end;
$$;

-- ---------------------------------------------------------------------------
-- 13. Low stock view for the admin dashboard
-- ---------------------------------------------------------------------------
create or replace view public.low_stock_products as
select id, name, slug, stock_quantity, low_stock_threshold, thumbnail
from public.products
where not archived
  and stock_quantity <= low_stock_threshold
order by stock_quantity asc;

-- ---------------------------------------------------------------------------
-- 14. Idempotent upgrades
-- Adds columns introduced after an earlier run of this file, so re-running it
-- against an existing project is always safe.
-- ---------------------------------------------------------------------------
alter table public.shipping_zones add column if not exists name text;
alter table public.shipping_zones add column if not exists postal_code_prefix text;
alter table public.shipping_zones add column if not exists free_over_amount numeric(12, 2);

alter table public.products add column if not exists short_description text;
alter table public.products add column if not exists brand text;
alter table public.products add column if not exists skin_types text[] not null default '{}';
alter table public.products add column if not exists concerns text[] not null default '{}';
alter table public.products add column if not exists ingredients text;
alter table public.products add column if not exists how_to_use text;
alter table public.products add column if not exists benefits text;
alter table public.products add column if not exists low_stock_threshold integer not null default 10;
alter table public.products add column if not exists weight_grams integer;
alter table public.products add column if not exists sold_count integer not null default 0;
alter table public.products add column if not exists rating numeric(3, 2) not null default 0;
alter table public.products add column if not exists reviews_count integer not null default 0;
alter table public.products add column if not exists is_featured boolean not null default false;
alter table public.products add column if not exists seo_title text;
alter table public.products add column if not exists seo_description text;

-- Cost prices and storefront copy introduced with the accounting release.
alter table public.products add column if not exists cost_price numeric(12, 2) not null default 0;
alter table public.products add column if not exists who_for text;
alter table public.order_items add column if not exists unit_cost numeric(12, 2) not null default 0;

alter table public.banners add column if not exists text_color text default '#FFFFFF';
alter table public.banners add column if not exists overlay_opacity numeric(3, 2) default 0.4;

alter table public.orders add column if not exists delivery_method text not null default 'delivery';
alter table public.orders add column if not exists shipping_zone_id uuid;
alter table public.orders add column if not exists discount_amount numeric(12, 2) not null default 0;

-- Keep the low_stock view in sync after upgrades
create or replace view public.low_stock_products as
select id, name, slug, stock_quantity, low_stock_threshold, thumbnail
from public.products
where not archived
  and stock_quantity <= low_stock_threshold
order by stock_quantity asc;


-- ---------------------------------------------------------------------------
-- Customer product reviews (live on the storefront, moderated in the admin)
-- ---------------------------------------------------------------------------
create table if not exists public.product_reviews (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid references public.products(id) on delete cascade,
  customer_name  text not null,
  rating         integer not null check (rating between 1 and 5),
  body           text not null,
  status         text not null default 'published' check (status in ('pending', 'published', 'hidden')),
  is_verified    boolean not null default false,
  created_at     timestamptz not null default timezone('utc', now())
);

create index if not exists product_reviews_created_idx
  on public.product_reviews (created_at desc);
create index if not exists product_reviews_product_idx
  on public.product_reviews (product_id, created_at desc);
create index if not exists product_reviews_status_idx
  on public.product_reviews (status, created_at desc);

alter table public.product_reviews enable row level security;

-- Anyone may read published reviews; anyone may post one (it starts published
-- so the live feed is honest — hide the bad ones deliberately, not by default).
drop policy if exists "reviews are public" on public.product_reviews;
create policy "reviews are public"
  on public.product_reviews for select
  using (status = 'published' or public.is_admin());

drop policy if exists "anyone can leave a review" on public.product_reviews;
create policy "anyone can leave a review"
  on public.product_reviews for insert
  with check (status = 'published' and is_verified = false);

drop policy if exists "admins manage reviews" on public.product_reviews;
create policy "admins manage reviews"
  on public.product_reviews for all
  using (public.is_admin())
  with check (public.is_admin());

-- Keep products.rating / reviews_count in step with what is published.
create or replace function public.refresh_product_rating(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products p
     set rating = coalesce((
           select round(avg(r.rating)::numeric, 2)
             from public.product_reviews r
            where r.product_id = p.id and r.status = 'published'
         ), 0),
         reviews_count = (
           select count(*)
             from public.product_reviews r
            where r.product_id = p.id and r.status = 'published'
         )
   where p.id = p_product_id;
end;
$$;

-- Realtime: the storefront subscribes to inserts on this table.
do $$
begin
  alter publication supabase_realtime add table public.product_reviews;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

-- Done.
