# Amanat House Supabase Setup

## 1. Create the project

Create a new Supabase project (or use an existing empty one). You'll need three
values from **Project Settings > API** in a moment: the Project URL, the
`anon` `public` key, and the `service_role` key.

## 2. Run the migration

The entire schema lives in one idempotent file:
[`supabase/migrations/0001_init.sql`](migrations/0001_init.sql). It's safe to
run against a brand-new empty project or re-run against one that already has
this schema — it only creates what's missing and never drops data.

**Option A — SQL Editor (simplest):**
1. Open your project's **SQL Editor**.
2. Paste the full contents of `supabase/migrations/0001_init.sql`.
3. Click **Run**.

**Option B — Supabase CLI:**
```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```
(`db push` applies every file under `supabase/migrations/` in order: `0001_init.sql`, `0002_is_placeholder.sql`, `0003_hampers.sql`.)

**Hampers:** run [`0003_hampers.sql`](migrations/0003_hampers.sql) too. It adds the `hampers` and `hamper_products` tables (with CHECK constraints and public-read-active RLS) and the `item_type` / `hamper_id` / `hamper_contents` columns on `order_items`. Then `npm run seed:hampers` loads two placeholder hampers.

Future schema changes should be added as new files (`0002_*.sql`, `0003_*.sql`, ...) rather than editing `0001_init.sql` in place, so the migration history stays truthful.

## 3. What the migration creates

| Table | Purpose |
|---|---|
| `products` | Catalog, extended with jewellery-specific columns (see below) |
| `categories` | Normalized category taxonomy. `products.category` (still plain text, unchanged for the app) has a foreign key to `categories.name` with `ON UPDATE CASCADE`, so renaming a category here automatically renames it on every product |
| `gallery` | Legacy table kept for backward compatibility — the live gallery is generated from active products, not this table |
| `orders` | Customer orders. `orders.items` (jsonb) remains the source of truth read by the admin UI and the WhatsApp message builder |
| `order_items` | Normalized line items, one row per item per order, populated alongside `orders.items` on every order creation — for reporting/joins without disturbing any existing read |
| `settings` | Singleton row: hero slides, announcement text, contact info, SEO meta, category taxonomy mirror |
| `admin_users` | Explicit allowlist of admin-capable Supabase Auth users — see step 4 |

New jewellery columns on `products` (all nullable, sensibly defaulted): `material` (default `316L Stainless Steel`), `plating` (default `18K PVD Gold`), `metal_tone` (`gold` / `silver` / `rose-gold`, default `gold`), `size`, `weight_grams`, `is_waterproof` (default `true`), `is_anti_tarnish` (default `true`), `stack_with` (text array), `badges` (text array — `Bestseller`, `New`, `Back in Stock`), `sort_order`.

Two commonly-expected columns were deliberately **not** added because equivalents already exist and adding a second column with the same meaning would create two sources of truth: `is_active` (use the existing `active`) and `stock_quantity` (use the existing `stock_count` / `inventory`, which the app already keeps in sync).

### Row Level Security

- `products` — public read where `active = true`.
- `categories`, `gallery`, `settings` — public read, unrestricted.
- `orders`, `order_items`, `admin_users` — **no public policies at all.** Every read and write goes through a Next.js API route using `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. The anon key has zero access to these three tables, by design.
- No table has public INSERT/UPDATE/DELETE policies — all writes happen server-side with the service-role key, gated by `assertAdmin()`.

## 4. Create your first admin user

The admin panel (`/admin`) has no signup form — access is Supabase Auth plus an explicit allowlist:

1. **Authentication > Users > Add user** — create a user with an email and password. This is what you'll log in with at `/admin/login`.
2. The migration auto-seeds `admin_users` from every `auth.users` row that exists **at the time you run it** — so if you create your admin user *before* running the migration, no further action is needed.
3. If you add a user *after* the migration has already run, insert their row manually (SQL Editor):
   ```sql
   insert into public.admin_users (id, email)
   select id, email from auth.users where email = 'the-new-admin@example.com'
   on conflict (id) do nothing;
   ```
   Without this step, that user can still log in (valid Supabase Auth session) but every admin API call will 401 — `assertAdmin()` checks `admin_users` membership, not just "is there a session."

## 5. Storage bucket

Create a public bucket named `amanat-house` (or whatever you set `SUPABASE_STORAGE_BUCKET` to): **Storage > New bucket > Public**. Then restrict it to what `/api/upload` actually accepts — 10MB file size limit, MIME types `image/jpeg`, `image/png`, `image/webp` (no video — this site doesn't accept video uploads). Via SQL Editor:

```sql
update storage.buckets
set public = true,
    file_size_limit = 10000000,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
where name = 'amanat-house';
```

(Or **Storage > amanat-house > Edit bucket** in the dashboard.) No additional Storage RLS policies are needed — public buckets allow anonymous reads, and every upload goes through `/api/upload` with the service-role key, which bypasses Storage RLS the same as any other table.

## 6. Environment variables

Copy `.env.local.example` to `.env.local` and fill in real values — see [docs/ENV_SETUP.md](../docs/ENV_SETUP.md) for what each one does:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=amanat-house
NEXT_PUBLIC_SITE_URL=https://www.amanathouse.com
NEXT_PUBLIC_WHATSAPP_NUMBER=919999999999
NEXT_PUBLIC_STORE_EMAIL=hello@amanathouse.com
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/amanathouse
```

## 7. Import the catalogue

Process the client's photos and load the products (idempotent — safe to re-run):

```bash
python scripts/process-catalogue-images.py
npm run import:catalogue
```

See [docs/PLACEHOLDER_CLEANUP.md](../docs/PLACEHOLDER_CLEANUP.md).
