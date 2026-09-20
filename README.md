# Amanat House

Jewellery e-commerce storefront and admin panel for Amanat House.

## Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (Postgres + Storage + Auth)
- **State:** React Context (cart, admin session)
- **Other:** Framer Motion (animation), dnd-kit (drag-and-drop in admin), react-hot-toast, Zod

## Local setup

```bash
npm install
cp .env.local.example .env.local   # then fill in real values, see below
npm run dev
```

The app runs at `http://localhost:3000`. On Windows you can also double-click `start-amanat-dev.cmd`.

To build for production:

```bash
npm run build
npm run start
```

## Environment variables

Full reference with descriptions and Vercel setup: **[docs/ENV_SETUP.md](docs/ENV_SETUP.md)**.

Quick list — copy `.env.local.example` to `.env.local` and fill these in:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (used for admin login) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key — server-only, never expose to the client |
| `SUPABASE_STORAGE_BUCKET` | Public storage bucket name (`amanat-house`) |
| `NEXT_PUBLIC_SITE_URL` | Production domain, used for SEO metadata |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp number for order messages and contact links |
| `NEXT_PUBLIC_STORE_EMAIL` | Store contact email |
| `NEXT_PUBLIC_INSTAGRAM_URL` | Instagram profile URL |

A startup check (`next.config.mjs` + `lib/env.ts`) throws a clear error naming any missing required variable — the app won't start silently misconfigured.

## Supabase setup

Full steps: **[supabase/README.md](supabase/README.md)**. Summary:

1. Create a Supabase project.
2. Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in the SQL Editor (idempotent — safe to re-run).
3. Create a public storage bucket named `amanat-house` with a 10MB size limit and MIME types restricted to `image/jpeg`, `image/png`, `image/webp` (no video — this site doesn't accept video uploads).
4. Create an admin user under Authentication > Users (email + password) — there's no in-app signup flow. Do this before step 2 and the migration auto-seeds them into `admin_users`; after, see `supabase/README.md` for the one-line SQL to add them.

### Database schema

- **`products`** — name, slug, category, subcategory, price, images (jsonb), stock, featured/active flags, tags, rating, variants, plus jewellery attributes (material, plating, metal_tone, size, weight_grams, is_waterproof, is_anti_tarnish, stack_with, badges, sort_order).
- **`categories`** — normalized taxonomy; `products.category` has a foreign key to `categories.name` (`ON UPDATE CASCADE`).
- **`gallery`** — legacy table; the live `/admin/gallery` view and public gallery are now generated directly from active product images, not this table.
- **`orders`** — customer details, items (jsonb, still the source of truth for reads), total, status (`pending` / `confirmed` / `shipped` / `delivered` / `cancelled`).
- **`order_items`** — normalized line items populated alongside `orders.items` for reporting/joins.
- **`settings`** — single row holding hero slides, announcement text, WhatsApp/Instagram/email, about text, SEO meta, and the category taxonomy.
- **`admin_users`** — explicit allowlist checked by `assertAdmin()`; a valid Supabase Auth session alone is not enough.

RLS is enabled on every table: `products`/`categories`/`gallery`/`settings` have public read policies; `orders`/`order_items`/`admin_users` have none at all — every read and write goes through server API routes using the service-role key, gated by admin session + allowlist auth. Full details: [supabase/README.md](supabase/README.md).

## Admin panel

Sign in at `/admin/login` with a Supabase Auth user (created in the Supabase dashboard, see above). Sections:

- **Dashboard** — order/product/gallery stats, recent orders.
- **Products** — search, filter, bulk archive, feature toggle, publish/draft status. Add/edit forms support multi-image upload (with progress and type/size/dimension validation) and drag-to-reorder.
- **Orders** — status updates, customer detail drawer, WhatsApp message preview and one-click send.
- **Gallery** — read-only view generated from active products (add/edit images on a product to update it).
- **Homepage Settings** — hero slides (desktop + 10 fixed mobile slots, drag-to-reorder), announcement ticker text, homepage SEO meta.
- **Categories** — category names, photos (upload), descriptions, subcategories, display order (drag-to-reorder), and storefront visibility. Renaming a category here also updates it on every product that uses it.
- **Site Settings** — WhatsApp number, Instagram/Facebook URLs, about-page markdown, store email/address, footer copyright.

Admin routes and their mutating API calls are gated by `middleware.ts` behind a session cookie set on login.

## Deploy (Vercel)

1. Push this repository to GitHub/GitLab/Bitbucket and import it into Vercel.
2. Add all the environment variables above under **Settings > Environment Variables**, scoped to Production (and Preview if you want PR previews to work against real data).
3. Deploy. `next build` runs automatically; the startup env check will fail the build loudly if a required variable is missing, rather than shipping a broken deployment.
4. Point your domain at the Vercel project and set `NEXT_PUBLIC_SITE_URL` to match it, then redeploy (env var changes require a rebuild to take effect).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build |
| `npm run start` | Serve a production build |
| `npm run lint` | Run ESLint |
| `npm run seed:categories` | Sync the 5 categories to Supabase |
| `npm run import:catalogue` | Import the client catalogue (`scripts/data/*.json` + processed photos) — see `docs/PLACEHOLDER_CLEANUP.md` |
