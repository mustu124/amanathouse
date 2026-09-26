-- A flat shipping fee the admin sets once in Site Settings and which is
-- added to every order. Idempotent - safe to re-run.

alter table public.settings
  add column if not exists shipping_fee numeric not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'settings_shipping_fee_valid') then
    alter table public.settings
      add constraint settings_shipping_fee_valid check (shipping_fee >= 0);
  end if;
end $$;

-- Frozen on the order at checkout time (server-verified), so a later change
-- to the fee never rewrites what a past order actually charged.
alter table public.orders
  add column if not exists shipping_fee numeric not null default 0;
