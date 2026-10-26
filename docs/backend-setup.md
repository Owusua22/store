# Backend setup — Supabase + Cloudflare R2

This app runs in two modes:

| Mode | Trigger | What happens |
| --- | --- | --- |
| **Demo** | no `NEXT_PUBLIC_SUPABASE_URL` / anon key | Bundled skincare catalogue, localStorage cart, fake sign-in, admin screens render sample data (writes return a demo notice) |
| **Live** | Supabase keys present | Postgres data, auth, RLS, admin CRUD, Cloudflare R2 image uploads |

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

## 4. Cloudflare R2 for images

1. Cloudflare dashboard → **R2 → Create bucket** (e.g. `sally-images`).
2. **Manage R2 API tokens → Create API token** with *Object Read & Write* for that bucket.
   Copy the Access Key ID, Secret Access Key and Account ID.
3. Public access:
   - Either enable the **r2.dev public development URL**, or
   - Connect a custom domain (recommended, e.g. `cdn.sallyskincare.com`).
4. Fill in `.env.local`:

```bash
CLOUDFLARE_R2_ACCOUNT_ID=xxxxxxxx
CLOUDFLARE_R2_ACCESS_KEY_ID=xxxxxxxx
CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxxxxxxx
CLOUDFLARE_R2_BUCKET_NAME=sally-images
CLOUDFLARE_R2_PUBLIC_URL=https://cdn.sallyskincare.com   # no trailing slash
```

5. Test it: sign in as admin → `/api/test-r2` or upload an image in
   **Admin → Products → Add product → Gallery**.

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
| POST | `/api/upload` | multipart `file` → R2 URL |

Unauthenticated calls return `401`; signed-in non-admins get `403`; in demo mode
every admin route returns `503` with `{ demo: true }`.

## 9. Deploying

- Vercel (or any Node host): add the same env vars to the project.
- Set `NEXT_PUBLIC_APP_URL` to the production origin.
- Supabase → **Authentication → URL configuration**: add the production URL and
  `/api/auth/callback` to the redirect allow-list.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only (it bypasses RLS).
