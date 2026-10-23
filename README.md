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
| Admin | Shell + pages render with empty data |

A dismissible banner explains demo mode. Add real keys to `.env.local`
(see `.env.example`) and the same code paths switch to Supabase automatically.

## Environment variables

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# optional: admin image uploads via Cloudflare R2
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_PUBLIC_URL=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

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
  (admin)/admin/…           admin dashboard, products, orders, shipping…
  api/…                     cart, checkout, orders, search, shipping, admin
components/
  layout/                   Navbar, Footer, AppShell, newsletter, demo banner
  home/                     HeroBanner, CategoryStrip, ProductSection, rail, promos
  products/                 ProductCard, ProductDetails, filters
  cart/ auth/ ui/ …
lib/
  data/store.ts             server data access (Supabase → demo fallback)
  demo/                     bundled catalog, cart, shipping zones
  supabase/                 client/server/route-handler + offline stub
  site.ts                   brand content (nav, contact, copy)
public/images/              generated hero + product photography
```

## Catalogue content

Categories: Body Lotions, Face Care, Hair Care, Shower Gels, Baby Care,
Serums & Oils, Face Wash, Sun Care. Each product carries price, compare-at price,
stock, pack sizes, rating, reviews and units sold — all editable from `/admin`.

## Notes

- Brand colour is `--brand: #e11b22` with `GH₵` price formatting (`lib/utils.ts`).
- All Supabase/R2 access is lazy and guarded, so `npm run build` succeeds with no
  environment variables set (the previous build crash came from eager credential
  checks in `lib/r2/client.ts` and `proxy.ts`).
