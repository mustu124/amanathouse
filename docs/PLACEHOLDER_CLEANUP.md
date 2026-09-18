# Replacing the placeholder catalogue

Every product seeded by `npm run seed:products` (`scripts/seed-placeholder-products.ts`) is
marked `is_placeholder = true` in the database specifically so it can be found and removed in
one step once you have real products. Nothing else in the app reads or filters on this flag —
it exists purely as a cleanup marker.

## Delete all placeholder products

Run this in the Supabase SQL Editor:

```sql
delete from public.products where is_placeholder = true;
```

That's it — one query, no other tables affected. `order_items.product_id` references are
`on delete set null`, so any historical order line items referencing a deleted placeholder
keep their snapshot (`product_name`, `price`, etc.) even after the product row is gone.

If you'd rather deactivate them first and delete later, update instead of delete:

```sql
update public.products set active = false where is_placeholder = true;
```

## Replacing a placeholder with a real product instead of deleting it

If a placeholder already happens to occupy a slug/category you want to keep (e.g. you're
publishing your first real "Classic Gold Band Ring" and want to reuse that URL), edit it
directly in `/admin/products` instead of deleting it — update the name, price, description,
and images, then either leave `is_placeholder` as-is (harmless once real content is in) or
clear it via the API/SQL:

```sql
update public.products set is_placeholder = false where slug = 'classic-gold-band-ring';
```

## Product photo spec (for when real photos are ready)

Every placeholder product currently points all 3 image slots at
`/public/placeholder-product.png` — a neutral ivory graphic, not a real photo. Drop real photos
in with this exact spec and nothing else needs to change (no layout shift, since the aspect
ratio matches exactly):

| Property | Spec |
|---|---|
| Aspect ratio | **4:5 portrait** |
| Dimensions | **1200 × 1500px** |
| Background | Ivory or soft neutral (matches the site's `#FAF5EC` background so product photos sit naturally against the storefront) |
| Format | **WebP** |
| File size | **Under 300KB** per image |
| Slots per product | 3 (front view, detail/close-up, styled/lifestyle) |

Upload replacement photos through `/admin/products/<slug>/edit` — the image uploader in
`/api/upload` already accepts `image/webp` and enforces a 10MB bucket-level limit (see
`docs/ENV_SETUP.md`), so a 300KB WebP file uploads instantly and replaces a placeholder slot
directly, no code changes required.

## Re-running the seed scripts

Both category and product seed scripts are safe to re-run at any time (upsert-based, keyed by
slug/name — re-running never creates duplicates):

```bash
npm run seed:categories   # 10 jewellery categories
npm run seed:products     # ~35 placeholder products, 3-4 per category
```
