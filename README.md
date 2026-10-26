# Sally — Skin Care Store (Ghana)

A Next.js 16 storefront + admin for a Ghanaian **skin care** retailer: body lotions,
shower gels, shampoos &amp; conditioners, baby diapers, baby lotions, face creams, serums,
face washes and sun care.

The storefront UI follows the ishtari.com.gh layout: a utility strip, a search-first
header with "All Categories", a banner carousel, circular category shortcuts, and
"Hot arrivals / Mega deals / Top picks / Hot sellers" product grids with discount
badges, star ratings and sold counts, all priced in Ghana Cedis.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm start   # production
npm run lint                 # eslint (0 errors)
npx tsc --noEmit             # type check
```

## Demo mode (no backend required)

If `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing, the app
falls back to **demo mode** so every screen still works:

| Area | Behaviour in demo mode |
| --- | --- |
| Catalogue | 19 bundled skin care products + 8 categories (`lib/demo/catalog.ts`) |
| Images | Local generated packshots in `public/images/` |
| Cart | Persisted in `localStorage` (`lib/demo/cart.ts`) |
| Sign in / sign up | Local demo session (any email + 6-char password) |
| Checkout | Validates the form and returns a demo order number |
| Shipping | 12 Ghana zones in `lib/demo/shipping.ts` |
| Admin | Shell + all pages render with the bundled catalogue; writes show a demo notice |
| Blog | 4 bundled articles in `lib/demo/blog.ts` |

A dismissible banner explains demo mode. Add real keys to `.env.local`
(see `.env.example`) and the same code paths switch to Supabase automatically.

## Going live: Supabase + Cloudflare R2

The full walkthrough lives in **[docs/backend-setup.md](docs/backend-setup.md)**.
Short version:

1. Create a Supabase project and run `supabase/schema.sql`, then `supabase/seed.sql`
   in the SQL editor (both are idempotent).
2. Create a user in **Authentication → Users**, then promote it:
   `update public.profiles set role = 'admin' where id = '<user-uuid>';`
3. Create a Cloudflare R2 bucket + API token, enable public access, and point
   `CLOUDFLARE_R2_PUBLIC_URL` at it.
4. Copy `.env.example` → `.env.local`, fill in the values, restart the dev server.
5. Sign in at `/login` and open `/admin/dashboard`.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# admin image uploads via Cloudflare R2
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_PUBLIC_URL=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database

| Table(s) | Purpose |
| --- | --- |
| `profiles` | Accounts + `role` (`customer` / `admin`), auto-created on signup |
| `categories`, `skin_types`, `products`, `product_variants` | Catalogue, with `products.skin_types text[]` |
| `inventory_movements`, `low_stock_products` view, `adjust_stock()` | Stock audit trail and low-stock alerts |
| `carts`, `cart_items`, `orders`, `order_items` | Shopping + checkout |
| `shipping_zones`, `shipping_discount_codes` | Ghana delivery fees, ETAs, free-over thresholds, promo codes |
| `blog_posts`, `newsletter_subscribers` | Journal content and email list |

RLS is on for every table: the storefront can only read active/published rows,
customers only see their own cart, orders and profile, and every write path for
catalogue content requires `profiles.role = 'admin'`. The admin API routes
additionally verify the session server-side and use the service-role key.

## Project map

```
app/
  page.tsx                  stores homepage (hero, categories, product rails)
  products/                 all products + product detail
  categories/[slug]/        category listing
  cart/ checkout/           cart page and checkout flow
  account/ profile/ orders/ customer area
  login/ register/          auth pages
  about/ contact/ terms/ privacy/
  blog/                     public journal index + article pages
  (admin)/admin/…           dashboard, products, categories, skin-types, stock,
                            orders, shipping, blog, showrooms, banners, users
  api/…                     cart, checkout, orders, search, shipping, admin
components/
  layout/                   Navbar, Footer, AppShell, newsletter, demo banner
  home/                     HeroBanner, CategoryStrip, ProductSection, rail, promos
  products/                 ProductCard, ProductDetails, filters
  cart/ auth/ ui/ …
lib/
  data/store.ts             server data access (Supabase → demo fallback)
  data/blog.ts              blog queries with demo fallback
  data/skin-types.ts        skin type vocabulary with demo fallback
  admin/guard.ts            requireAdmin() + service-role client + slug helpers
  admin/schemas.ts          shared zod schemas for the admin API
  demo/                     bundled catalog, blog posts, cart, shipping zones
  supabase/                 client/server/route-handler + offline stub
  skin-types.ts             skin type + concern vocabulary, markdown renderer
  site.ts                   brand content (nav, contact, copy)
supabase/
  schema.sql                tables, RLS policies, triggers, stock RPC
  seed.sql                  categories, skin types, products, zones, blog posts
docs/backend-setup.md       step-by-step Supabase + Cloudflare R2 guide
public/images/              generated hero + product photography
```

## Catalogue content

Categories: Body Lotions, Face Care, Hair Care, Shower Gels, Baby Care,
Serums & Oils, Face Wash, Sun Care. Each product carries brand, price, compare-at
price, stock + low-stock threshold, pack sizes, skin types, concerns, ingredients,
how-to-use, benefits and gallery images — all editable from `/admin/products`.

Skin types (`normal`, `dry`, `oily`, `combination`, `sensitive`, `acne-prone`) are
managed at `/admin/skin-types` and power the storefront filter chips
(`/products?skin=dry`). Journal articles are written at `/admin/blog` and published
at `/blog`.

## Notes

- Brand colour is `--brand: #e11b22` with `GH₵` price formatting (`lib/utils.ts`).
- All Supabase/R2 access is lazy and guarded, so `npm run build` succeeds with no
  environment variables set (the previous build crash came from eager credential
  checks in `lib/r2/client.ts` and `proxy.ts`).
