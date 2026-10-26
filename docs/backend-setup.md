# Backend setup — Supabase + Cloudflare R2

This app runs in two modes:

| Mode | Trigger | What happens |
| --- | --- | --- |
| **Demo** | no `NEXT_PUBLIC_SUPABASE_URL` / anon key | Bundled skincare catalogue, localStorage cart, fake sign-in, admin screens render sample data (writes return a demo notice like under `⚠️` banners) |
| **Live** | Supabase keys present | Postgres is the **only** source of truth — an empty catalogue renders empty (no sample products leak in), real auth, RLS, admin CRUD, Cloudflare R2 uploads |

Everything below is one-time setup.

---

## 1. Create the Supabase project

1. Go to <https://app.supabase.com> → **New project**.
2. Choose a region close to Ghana (e.g. `eu-west-1` / `eu-central-1`).
3. Copy the keys from **Project settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only — never expose it)

## 2. Run the schema

Open **SQL Editor** and run, in order:

1. `supabase/schema.sql` — tables, RLS policies, triggers, stock RPC
2. `supabase/seed.sql` — categories, skin types, 6 sample products, 12 Ghana shipping zones, banners, 3 blog posts

Both files are idempotent, so you can re-run them after pulling updates.

Tables created:

| Area | Tables |
| --- | --- |
| Accounts | `profiles` (with `role = customer \| admin`), auto-created on signup |
| Catalogue | `categories`, `skin_types`, `products`, `product_variants` |
| Inventory | `inventory_movements` (+ `low_stock_products` view, `adjust_stock()` RPC) |
| Merchandising | `banners`, `showrooms`, `showroom_products` |
| Cart & orders | `carts`, `cart_items`, `orders`, `order_items` |
| Shipping | `shipping_zones`, `shipping_discount_codes`, `shipping_code_uses` |
| Content | `blog_posts`, `newsletter_subscribers` |

`products.skin_types` is a `text[]` of slugs from `skin_types` (`normal`, `dry`, `oily`,
`combination`, `sensitive`, `acne-prone`, plus anything you add in the admin).

## 2b. If you connected Supabase but see "Could not find the table … in the schema cache"

That means the keys work but `schema.sql` has not been run — a brand-new Supabase
project starts empty. Instead of raw 500s the app now:

- shows a **Database not initialised** banner across `/admin`
- lets signed-in users reach **`/admin/setup`**, which lists the missing tables and
  has **Copy schema.sql** / **Copy seed.sql** buttons (plus a link to the SQL editor)
- reports state at **`/api/health`**

Fix in four steps:

1. Sign in (you can use a user you created in **Authentication → Users**).
2. Open `/admin/setup` (or <https://supabase.com/dashboard/project/_/sql/new>).
3. Paste and run `supabase/schema.sql`, then `supabase/seed.sql`.
4. Press **Re-check** on the setup page — statuses turn green.

`/api/health` returns `setup-required` until every table exists, then `ready`.

## 3. Create the admin account

1. **Authentication → Users → Add user** — enter your email and a password.
2. Copy the new user's UUID and promote it:

```sql
update public.profiles
set role = 'admin', full_name = 'Store Admin'
where id = 'PASTE-USER-UUID-HERE';
```

3. Sign in at `/login`, then open `/admin/dashboard`.

New signups get `role = 'customer'` automatically via the `handle_new_user` trigger.

## 4. Cloudflare R2 for images (bucket `glow-up`)

### 4a. Where the two keys come from

`CLOUDFLARE_R2_ACCESS_KEY_ID` and `CLOUDFLARE_R2_SECRET_ACCESS_KEY` are **not** the
same as your Cloudflare login, and they are not found under "My Profile". They are
created per bucket:

1. Open <https://dash.cloudflare.com> → **R2** in the left sidebar.
2. Click **Manage R2 API Tokens** (top-right of the R2 overview, sometimes under
   *API* → *Manage API tokens*).
3. **Create API token**:
   - *Token name*: `sally-admin-uploads`
   - *Permissions*: **Object Read & Write**
   - *Specify bucket(s)*: `glow-up` (or *All buckets*)
   - Optionally set a TTL, then **Create API Token**
4. The next screen shows, **once**:
   - **Access Key ID** → `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `CLOUDFLARE_R2_SECRET_ACCESS_KEY` (copy it now; you
     cannot view it again — if you lose it, roll the token and create a new one)
5. **Account ID** → R2 overview page, right-hand sidebar (*Account ID*), or the
   part of the dashboard URL before `.r2.cloudflarestorage.com`.

> The S3 endpoint used by the app is
> `https://<CLOUDFLARE_R2_ACCOUNT_ID>.r2.cloudflarestorage.com` (region `auto`).

### 4b. Make the bucket publicly readable

Uploads return a public URL, so the bucket needs public access:

1. R2 → **glow-up** → **Settings** → **Public access**.
2. Either enable the **r2.dev public development URL** (fine for testing, e.g.
   `https://pub-xxxxxxxx.r2.dev`) or attach a **custom domain**
   (`cdn.yourdomain.com`) — recommended for production.
3. Copy that base URL (no trailing slash) into `CLOUDFLARE_R2_PUBLIC_URL`.

### 4c. Environment

```bash
CLOUDFLARE_R2_ACCOUNT_ID=xxxxxxxxxxxxxxxx
CLOUDFLARE_R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxx
CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxx
CLOUDFLARE_R2_BUCKET_NAME=glow-up
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev   # no trailing slash
```

`CLOUDFLARE_R2_BUCKET_NAME` also defaults to `glow-up` in code
(`lib/r2/client.ts`), so uploads still target the right bucket if the variable is
missing — but the public URL **must** be set or images will not render.

### 4d. Verify

Restart the dev server, sign in as admin, then open **`/api/test-r2`**:

```json
{
  "success": true,
  "storage": { "bucket": "glow-up", "configured": true, "publicUrl": "https://…" },
  "message": "Connected to the "glow-up" bucket.",
  "sampleObjects": ["products/…jpg"]
}
```

You can also upload from **Admin → Products → Add product → Gallery**, or
**Admin → Blog → New article → Cover image**. `next/image` remote hosts are read
from `CLOUDFLARE_R2_PUBLIC_URL` in `next.config.ts`, so any custom domain works
without code changes (restart after changing it).

Uploads go through `POST /api/upload` (admin session required), are placed under
`products/`, and return `{ success: true, data: { url } }`. The public URL must be
reachable from the browser, otherwise `next/image` will not render the file.

### CORS (only needed for direct browser uploads)

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

## 5. Local env file

```bash
cp .env.example .env.local
```

Required for live mode:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_PUBLIC_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Restart `npm run dev` after editing.

## 6. What the admin can do

| Screen | Path | Capabilities |
| --- | --- | --- |
| Dashboard | `/admin/dashboard` | Revenue, orders, low stock, recent activity |
| Products | `/admin/products` | Search/filter by category, skin type, stock, status; add/edit/archive |
| Product form | `/admin/products/new`, `/admin/products/[id]/edit` | Name, brand, category, tagline, description, price/compare-at, SKU, stock + low-stock alert, sizes, skin types, concerns, ingredients, how-to-use, benefits, gallery upload to R2, SEO, visibility, featured |
| Skin types | `/admin/skin-types` | Create/rename/hide/delete skin types, see how many products use each |
| Stock | `/admin/stock` | Units, low/out-of-stock counts, stock value, quick ±1, bulk adjust with reason + note, recent movement log |
| Orders | `/admin/orders`, `/admin/orders/[id]` | Filter, view line items, move status (stock is restored on cancel) |
| Shipping | `/admin/shipping` | Zones (region/town/fee/ETA/free-over), discount codes |
| Blog | `/admin/blog` | List drafts/published, create/edit/delete, markdown body with preview, cover upload, skin-type tagging, SEO |
| Categories, Showrooms, Banners, Users | `/admin/…` | Existing CRUD screens |

## 7. Storefront surfaces backed by the new tables

- `/products?skin=dry` and the **Skin type** filter chips read `skin_types`
- `/blog` and `/blog/[slug]` read published `blog_posts`
- `/api/shipping/zones` + checkout read `shipping_zones` (free delivery over GH₵300)
- Every checkout writes `orders`, `order_items`, decrements stock and logs an
  `inventory_movements` row

## 8. API reference (all require an admin session)

| Method | Route | Purpose |
| --- | --- | --- |
| GET/POST/PATCH/DELETE | `/api/admin/products` | List, create, update (`{id, …}`), archive (`?id=`) |
| GET/PUT/PATCH/DELETE | `/api/admin/products/[id]` | Single product, full update, archive/hard delete (`?hard=1`) |
| GET/POST/PATCH/DELETE | `/api/admin/skin-types` | Skin type vocabulary |
| GET/POST | `/api/admin/stock` | Stock overview / adjust (`{product_id, quantity, mode: add\|remove\|set, reason, note}`) |
| GET/POST | `/api/admin/blog` · GET/PUT/PATCH/DELETE `/api/admin/blog/[id]` | Articles |
| POST | `/api/upload` | multipart `file` (+ optional `folder`) → R2 `{ url, key, bucket }`. JPG/PNG/WEBP/AVIF/GIF, max 8 MB |
| GET | `/api/test-r2` | admin-only storage diagnostics (bucket + public URL) |

Unauthenticated calls return `401`; signed-in non-admins get `403`; in demo mode
every admin route returns `503` with `{ demo: true }`.

## 9. Live-mode behaviour worth knowing

- **No demo data in live mode.** `lib/data/store.ts` only uses the bundled
  catalogue when no Supabase project is configured. An empty table renders an
  empty state instead of fake products.
- **Setup checklist.** Until `categories`, `products` or R2 are ready,
  `/admin/dashboard` shows a checklist with the exact next action.
- **Caching.** The homepage revalidates every 60 s; every other storefront page
  is dynamic, so admin edits appear immediately there.
- **Images.** Uploaded URLs live under `products/`, `blog/`, `banners/`,
  `categories/` or `showrooms/` in the bucket.

## 10. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `Could not find the table 'public.products' in the schema cache` | Schema not created — run `supabase/schema.sql` (see 2b) |
| `/admin` bounces you to Setup | Signed in, but no `profiles` row / not an admin yet — run the promote SQL |
| Cart shows empty and `/api/cart` returns `setupRequired` | Same missing schema; the storefront degrades gracefully until it is fixed |
| Storefront shows nothing after connecting Supabase | `supabase/schema.sql` + `supabase/seed.sql` have not run, or all products are `is_active = false` / `archived = true` |
| `/admin/*` redirects to the homepage | The signed-in user's `profiles.role` is not `admin` — run the `update public.profiles set role='admin' …` statement |
| `permission denied for table …` | RLS is on (correct) — anonymous reads need `is_active`/published rows; writes need the service-role key on the server |
| `/api/upload` returns "R2 is not configured" | One of `CLOUDFLARE_R2_ACCOUNT_ID`, `_ACCESS_KEY_ID`, `_SECRET_ACCESS_KEY` is empty; restart after editing `.env.local` |
| Upload succeeds but the image is broken | `CLOUDFLARE_R2_PUBLIC_URL` is missing/wrong, or the bucket has no public access |
| `signature does not match` from R2 | Secret key was copied incorrectly (or truncated) — roll the token and re-copy |
| Cart is always empty | The user must be signed in; carts are per-user rows guarded by RLS |

## 11. Deploying

- Vercel (or any Node host): add the same env vars to the project.
- Set `NEXT_PUBLIC_APP_URL` to the production origin.
- Supabase → **Authentication → URL configuration**: add the production URL and
  `/api/auth/callback` to the redirect allow-list.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only (it bypasses RLS).
