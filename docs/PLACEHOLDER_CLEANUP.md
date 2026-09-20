# Placeholder catalogue — retired

The placeholder products (and `scripts/seed-placeholder-products.ts`, and
`/public/placeholder-product.png`) have been removed. The catalogue is now the
client's real one, imported by `npm run import:catalogue`.

## How the real catalogue is imported

1. The client's document goes into `scripts/data/<category>.json` (one file per
   category; see `necklaces.json` for the shape).
2. Their photos go into `client-assets/<category>/` (git-ignored — raw files are
   large and are not deployed).
3. `python scripts/process-catalogue-images.py` converts photos to
   `client-assets/processed/<slug>-N.webp` — 1200x1500 (4:5), the whole photo
   kept in frame on an ivory canvas, under 300KB.
4. `npm run import:catalogue` uploads the images to the Supabase bucket
   (`products/<slug>-N.webp`) and upserts every product **by slug**, so
   re-running never duplicates. It also deletes any leftover rows flagged
   `is_placeholder = true` first.

## Manual cleanup query (if a placeholder row ever reappears)

```sql
delete from public.products where is_placeholder = true;
```

## Photo spec for new products

| Property | Spec |
|---|---|
| Aspect ratio | **4:5 portrait** (3:4 originals are letterboxed onto ivory, never cropped) |
| Dimensions | **1200 x 1500px** |
| Format | **WebP**, under **300KB** |
| Naming | `<product-slug>-1.webp`, `-2.webp`, ... (first image is the primary) |

Images can also be uploaded per product in `/admin/products/<slug>/edit`.

## Placeholder hampers

`npm run seed:hampers` creates two hampers flagged `is_placeholder = true` (with ivory placeholder heroes from `client-assets/hampers/`). Remove them once real hampers exist:

```sql
delete from public.hampers where is_placeholder = true;
```

Hamper hero photo spec: **4:5 portrait, 1200 x 1500px, WebP/JPG/PNG under 300KB-10MB**, ivory or neutral background - upload in `/admin/hampers/<slug>/edit`.
