-- Amanat House — full schema, idempotent.
-- Safe to run against a brand-new empty Supabase project OR the existing
-- project (adds only what's missing; never drops data). Re-running this
-- file is always safe.
--
-- Design notes (read before extending):
--   * `products.category` stays a plain text column — every existing query
--     in the app filters/writes it as text (`.eq("category", ...)`). Rather
--     than replace it, this migration adds a real `categories` table and
--     puts a foreign key ON products.category itself (referencing
--     categories.name), so category integrity is enforced at the DB level
--     with zero changes to existing app code. Renaming a category cascades
--     automatically (ON UPDATE CASCADE), in addition to the app's own
--     categoryRenames propagation in PUT /api/settings.
--   * `orders.items` (jsonb) is still the primary read path for the admin
--     UI and the WhatsApp message builder — untouched. `order_items` is
--     added as a normalized side-table populated in parallel on order
--     creation, for reporting/joins, without breaking any existing read.
--   * Two requested columns were intentionally NOT added because they'd
--     duplicate existing ones: `is_active` (products.active already exists
--     and is used everywhere) and `stock_quantity` (products.stock_count /
--     inventory already exist and are kept in sync in code). Adding
--     parallel columns with the same meaning would just create a second
--     source of truth. See supabase/README.md for the full rationale.

create extension if not exists "pgcrypto";

-- ============================================================
-- categories
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text unique,
  icon text default '',
  description text default '',
  subcategories jsonb not null default '[]'::jsonb,
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists categories_sort_order_idx on public.categories(sort_order);

-- Seed the current jewellery taxonomy (safe no-op if already present).
insert into public.categories (name, slug, icon, description, subcategories, sort_order)
values
  ('Rings', 'rings', 'Ring', 'Everyday and statement rings.', '["Solitaire","Band","Cocktail"]'::jsonb, 0),
  ('Necklaces', 'necklaces', 'Necklace', 'Chains and statement necklaces.', '["Chain","Choker","Statement"]'::jsonb, 1),
  ('Earrings', 'earrings', 'Earring', 'Studs, drops, and festive earrings.', '["Studs","Drops","Jhumkas"]'::jsonb, 2),
  ('Bracelets', 'bracelets', 'Bracelet', 'Everyday and charm bracelets.', '["Chain","Charm","Cuff"]'::jsonb, 3),
  ('Bangles', 'bangles', 'Bangle', 'Traditional and modern bangles.', '["Single","Set of 2","Set of 4"]'::jsonb, 4),
  ('Anklets', 'anklets', 'Anklet', 'Delicate everyday anklets.', '["Single","Pair"]'::jsonb, 5),
  ('Pendants', 'pendants', 'Pendant', 'Pendants with or without chain.', '["With Chain","Pendant Only"]'::jsonb, 6),
  ('Mangalsutra', 'mangalsutra', 'Mangalsutra', 'Traditional and modern mangalsutra designs.', '["Short","Long"]'::jsonb, 7),
  ('Nose Pins', 'nose-pins', 'Nose Pin', 'Everyday and festive nose pins.', '["Screw","Press"]'::jsonb, 8),
  ('Jewellery Sets', 'jewellery-sets', 'Set', 'Complete bridal and festive sets.', '["Bridal","Festive"]'::jsonb, 9)
on conflict (name) do nothing;

-- ============================================================
-- products
-- ============================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  subcategory text default '',
  description text default '',
  price numeric not null default 0,
  original_price numeric,
  images jsonb not null default '[]'::jsonb,
  video_url text,
  dimensions text default '',
  care_instructions text default '',
  shipping_info text default '',
  is_featured boolean default false,
  featured boolean default false,
  in_stock boolean default true,
  stock_count integer default 0,
  inventory integer default 0,
  active boolean default true,
  tags text[] default '{}',
  rating jsonb default '{"average":0,"count":0}'::jsonb,
  variants text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Jewellery-specific attributes (item 2). All nullable; defaults apply
-- only to new rows that don't specify a value.
alter table public.products
  add column if not exists material text default '316L Stainless Steel',
  add column if not exists plating text default '18K PVD Gold',
  add column if not exists metal_tone text default 'gold',
  add column if not exists size text,
  add column if not exists weight_grams numeric,
  add column if not exists is_waterproof boolean default true,
  add column if not exists is_anti_tarnish boolean default true,
  add column if not exists stack_with text[] default '{}',
  add column if not exists badges text[] default '{}',
  add column if not exists sort_order integer default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_metal_tone_check'
  ) then
    alter table public.products
      add constraint products_metal_tone_check
      check (metal_tone is null or metal_tone in ('gold', 'silver', 'rose-gold'));
  end if;
end $$;

-- Referential integrity for category, added without changing the column's
-- type or any query that reads/writes it as plain text.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_category_fkey'
  ) then
    alter table public.products
      add constraint products_category_fkey
      foreign key (category) references public.categories(name)
      on update cascade;
  end if;
end $$;

create index if not exists products_active_created_idx on public.products(active, created_at desc);
create index if not exists products_category_idx on public.products(category);
create index if not exists products_featured_idx on public.products(is_featured, featured);
create index if not exists products_sort_order_idx on public.products(sort_order);

-- ============================================================
-- gallery (legacy — public gallery is generated from active products;
-- kept for backward compatibility with the existing gallery API routes)
-- ============================================================
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  type text not null default 'image' check (type in ('image', 'video')),
  thumbnail_url text,
  caption text not null default '',
  category text not null default 'Lifestyle',
  order_index integer default 0,
  public_id text unique,
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists gallery_order_idx on public.gallery(order_index, created_at desc);

-- ============================================================
-- orders
-- ============================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  items jsonb not null default '[]'::jsonb,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_address text not null,
  pincode text not null,
  total_amount numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  whatsapp_sent boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists orders_status_created_idx on public.orders(status, created_at desc);

-- ============================================================
-- order_items — normalized line items, populated alongside orders.items
-- ============================================================
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  image_url text,
  price numeric not null default 0,
  quantity integer not null default 1,
  selected_variant text,
  created_at timestamptz default now()
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);

-- ============================================================
-- settings (singleton)
-- ============================================================
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  hero_slides jsonb not null default '[]'::jsonb,
  mobile_hero_slides jsonb not null default '[]'::jsonb,
  video_url text default '',
  announcement_text text default '',
  whatsapp_number text default '',
  social_links jsonb default '{}'::jsonb,
  about_text text default '',
  meta_title text default '',
  meta_description text default '',
  store_email text default '',
  store_address text default '',
  footer_copyright text default '',
  categories jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- admin_users — explicit allowlist of admin-capable Supabase Auth users.
-- assertAdmin() checks this table, not just "is there any valid session",
-- closing the gap where any authenticated user (not just intended admins)
-- could call admin write routes.
-- ============================================================
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

-- Seed: every Supabase Auth user that already exists today was created
-- specifically to be an admin (this app has no public signup flow), so
-- backfilling from auth.users cannot grant access to anyone who didn't
-- already have it, and guarantees this migration never locks out an
-- existing admin login.
insert into public.admin_users (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.gallery enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;
alter table public.admin_users enable row level security;

-- Public read: products (active only), categories, gallery, settings.
drop policy if exists "Public read products" on public.products;
create policy "Public read products" on public.products for select using (active = true);

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories for select using (true);

drop policy if exists "Public read gallery" on public.gallery;
create policy "Public read gallery" on public.gallery for select using (true);

drop policy if exists "Public read settings" on public.settings;
create policy "Public read settings" on public.settings for select using (true);

-- orders, order_items, admin_users: no public policies at all — every read
-- and write goes through Next.js API routes using SUPABASE_SERVICE_ROLE_KEY,
-- which bypasses RLS. Anon/authenticated roles get zero access.

insert into public.settings (
  hero_slides,
  mobile_hero_slides,
  announcement_text,
  whatsapp_number,
  social_links,
  about_text,
  meta_title,
  meta_description,
  footer_copyright,
  categories
)
select
  '[]'::jsonb,
  '[]'::jsonb,
  'Free shipping on orders over ₹999 · Certified hallmark jewellery · Handcrafted with love · New arrivals every week',
  '',
  '{"instagram":"","facebook":""}'::jsonb,
  'Amanat House creates timeless gold and bridal jewellery for life''s most cherished moments.',
  'Amanat House | Timeless Jewellery, Made to Treasure',
  'Shop fine gold, bridal, and everyday jewellery from Amanat House.',
  '© 2025 Amanat House',
  '[]'::jsonb
where not exists (select 1 from public.settings);
