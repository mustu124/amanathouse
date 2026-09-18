-- Adds is_placeholder, used to mark seeded catalogue content that stands in
-- for real product photography/copy until the client has their own.
-- Idempotent — safe to re-run.

alter table public.products
  add column if not exists is_placeholder boolean not null default false;

create index if not exists products_is_placeholder_idx on public.products(is_placeholder);
