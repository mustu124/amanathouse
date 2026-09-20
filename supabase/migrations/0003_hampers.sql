-- Build-your-own gift hampers. Idempotent - safe to re-run.
-- (0002 was already taken by is_placeholder, so this is 0003.)

do $$
begin
  if not exists (select 1 from pg_type where typname = 'hamper_pricing_mode') then
    create type public.hamper_pricing_mode as enum ('percentage', 'fixed');
  end if;
end $$;

create table if not exists public.hampers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text not null default '',
  long_description text not null default '',
  hero_image_url text not null default '',
  gallery_image_urls text[] not null default '{}',
  pricing_mode public.hamper_pricing_mode not null default 'percentage',
  discount_percent numeric(5,2),
  fixed_price numeric,
  packaging_fee numeric not null default 0,
  min_items integer not null default 2,
  max_items integer,
  is_active boolean not null default true,
  is_placeholder boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hampers_percentage_valid check (
    pricing_mode <> 'percentage' or (discount_percent is not null and discount_percent >= 0 and discount_percent <= 90)
  ),
  constraint hampers_fixed_valid check (
    pricing_mode <> 'fixed' or (fixed_price is not null and fixed_price > 0)
  ),
  constraint hampers_packaging_fee_valid check (packaging_fee >= 0),
  constraint hampers_min_items_valid check (min_items >= 1),
  constraint hampers_max_items_valid check (max_items is null or max_items >= min_items)
);

create index if not exists hampers_active_sort_idx on public.hampers(is_active, sort_order);

create table if not exists public.hamper_products (
  id uuid primary key default gen_random_uuid(),
  hamper_id uuid not null references public.hampers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  is_required boolean not null default false,
  unique (hamper_id, product_id)
);

create index if not exists hamper_products_hamper_idx on public.hamper_products(hamper_id);
create index if not exists hamper_products_product_idx on public.hamper_products(product_id);

-- A hamper is ONE order line: item_type + frozen contents snapshot.
alter table public.order_items
  add column if not exists item_type text not null default 'product',
  add column if not exists hamper_id uuid references public.hampers(id) on delete set null,
  add column if not exists hamper_contents jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'order_items_item_type_check') then
    alter table public.order_items
      add constraint order_items_item_type_check check (item_type in ('product', 'hamper'));
  end if;
end $$;

create index if not exists order_items_hamper_id_idx on public.order_items(hamper_id);

-- RLS: public read of active hampers only; every write goes through the
-- service-role key in the admin API routes (which bypasses RLS).
alter table public.hampers enable row level security;
alter table public.hamper_products enable row level security;

drop policy if exists "Public read hampers" on public.hampers;
create policy "Public read hampers" on public.hampers for select using (is_active = true);

drop policy if exists "Public read hamper products" on public.hamper_products;
create policy "Public read hamper products" on public.hamper_products for select using (
  exists (select 1 from public.hampers h where h.id = hamper_id and h.is_active = true)
);
