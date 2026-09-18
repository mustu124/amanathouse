# Brand Audit — Artisan Root → Amanat House

Audit of the cloned repo before rebranding. No files other than this report were modified.

**Repo state note:** at audit time, `Amanat logo.PNG` (97 KB, untracked) has already been dropped into the project root — presumably the new Amanat House logo. Separately, the entire `Artisan Root Product Photos for Website/` folder (tracked in git, ~30+ images used by `npm run supabase:import`) has been deleted from disk outside of any tool call in this session (shows as worktree-deleted, not yet staged/committed). The `public/` folder is also completely empty in this checkout — none of the referenced assets (`/logo.png`, `/instagram-icon.png`) exist on disk, so the site currently renders broken images for logo/Instagram icon everywhere they're used. Flagging this because it affects Sections 2 and 4 below and needs a decision before rebuild (restore old photos vs. treat as intentional cleanup for the new jewellery catalog).

---

## 1. Routes in `/app`

### Public pages
| Route | File | Description |
|---|---|---|
| `/` | [app/page.tsx](app/page.tsx) | Homepage: hero slider, announcement ticker, category grid, bestsellers, video/styling section, testimonials, "Instagram" strip, footer. All client-rendered, pulls `/api/settings` + `/api/products`. |
| `/shop` | [app/shop/page.tsx](app/shop/page.tsx) | Product listing with category/subcategory/price filters, sort, pagination, quick-view + "more like this" modals. |
| `/shop/[slug]` | [app/shop/[slug]/page.tsx](app/shop/%5Bslug%5D/page.tsx) | Product detail page: gallery, variants, quantity, add-to-cart/buy-now, description/dimensions/shipping accordion, related products, lightbox. |
| `/collections` | [app/collections/page.tsx](app/collections/page.tsx) | Masonry gallery ("Artisan Root Gallery") of product media with category filter chips and lightbox. |
| `/about` | [app/about/page.tsx](app/about/page.tsx) | Static "About Artisan Root" brand story page. |
| `/contact` | [app/contact/page.tsx](app/contact/page.tsx) | Contact page with WhatsApp/email/address card, static contact form (non-functional, links out to WhatsApp), refund/shipping policy blurbs. |
| — | [app/layout.tsx](app/layout.tsx) | Root layout: global `<html>`/metadata (title/OG/Twitter all say "Artisan Root"), loads `Navbar` + `Providers`. |
| — | [app/error.tsx](app/error.tsx) | Global error boundary ("A knot needs reworking" copy). |
| — | [app/not-found.tsx](app/not-found.tsx) | 404 page ("This thread has slipped loose" copy). |
| — | [app/globals.css](app/globals.css) | Global styles, brand color usage, `.field-input`, scrollbar theme. |

### Admin panel (all under `middleware.ts` cookie-gated `/admin`)
| Route | File | Description |
|---|---|---|
| `/admin/login` | [app/admin/(auth)/login/page.tsx](app/admin/(auth)/login/page.tsx) | Admin email/password login form, posts to `/api/admin/login`. |
| `/admin` | [app/admin/(panel)/page.tsx](app/admin/(panel)/page.tsx) | Dashboard: stat cards (products/orders/pending/gallery), recent orders table. |
| `/admin/products` | [app/admin/(panel)/products/page.tsx](app/admin/(panel)/products/page.tsx) | Product list/manager: search, category filter, bulk delete, feature toggle, publish status. |
| `/admin/products/new` | [app/admin/(panel)/products/new/page.tsx](app/admin/(panel)/products/new/page.tsx) | Wraps `ProductForm` for creating a product. |
| `/admin/products/[slug]/edit` | [app/admin/(panel)/products/[slug]/edit/page.tsx](app/admin/(panel)/products/%5Bslug%5D/edit/page.tsx) | Wraps `ProductForm` for editing an existing product. |
| `/admin/orders` | [app/admin/(panel)/orders/page.tsx](app/admin/(panel)/orders/page.tsx) | Orders table with status/date filters, status updates, order detail drawer, WhatsApp message preview (hardcodes "Artisan Root order..."). |
| `/admin/gallery` | [app/admin/(panel)/gallery/page.tsx](app/admin/(panel)/gallery/page.tsx) | Read-only gallery view generated from active products (no direct upload here — gallery mirrors product images). |
| `/admin/homepage` | [app/admin/(panel)/homepage/page.tsx](app/admin/(panel)/homepage/page.tsx) | Hero slide editor (desktop + 10 fixed mobile slots, drag-reorder), announcement text, YouTube video URL, homepage SEO meta. |
| `/admin/categories` | [app/admin/(panel)/categories/page.tsx](app/admin/(panel)/categories/page.tsx) | Category manager: name/icon/description/subcategories/visibility, renames propagate to products via `categoryRenames`. |
| `/admin/settings` | [app/admin/(panel)/settings/page.tsx](app/admin/(panel)/settings/page.tsx) | Site settings: WhatsApp number, Instagram/Facebook URLs, about-page markdown, store email/address, footer copyright. |
| — | [app/admin/(panel)/layout.tsx](app/admin/(panel)/layout.tsx) | Wraps admin pages in `AdminShell` (sidebar nav, logout). |

### API routes
| Route | File | Description |
|---|---|---|
| `GET/POST /api/products` | [app/api/products/route.ts](app/api/products/route.ts) | List (with filters/sort/pagination, admin-only unpublished view) / create product. Falls back to hardcoded sample catalog when Supabase isn't configured (non-prod only). |
| `GET/PUT/DELETE /api/products/[slug]` | [app/api/products/[slug]/route.ts](app/api/products/%5Bslug%5D/route.ts) | Fetch/update/soft-delete (sets `active=false`) a single product by slug or UUID. |
| `GET /api/products/search` | [app/api/products/search/route.ts](app/api/products/search/route.ts) | Name/description `ilike` search, min 2 chars. |
| `GET/POST /api/orders` | [app/api/orders/route.ts](app/api/orders/route.ts) | Admin: list orders. Public: create order, generates `AR-YYYY-####` order numbers (**"AR" = Artisan Root prefix**). |
| `GET /api/orders/[orderNumber]` | [app/api/orders/[orderNumber]/route.ts](app/api/orders/%5BorderNumber%5D/route.ts) | Fetch single order by order number. |
| `PUT /api/orders/[orderNumber]/status` | [app/api/orders/[orderNumber]/status/route.ts](app/api/orders/%5BorderNumber%5D/status/route.ts) | Admin: update order status. |
| `GET/POST /api/gallery` | [app/api/gallery/route.ts](app/api/gallery/route.ts) | Gallery derived from active product images (falls back to hardcoded sample gallery). |
| `PUT/DELETE /api/gallery/[id]` | [app/api/gallery/[id]/route.ts](app/api/gallery/%5Bid%5D/route.ts) | Update/delete a gallery row (legacy — current UI reads only). |
| `POST /api/gallery/reorder` | [app/api/gallery/reorder/route.ts](app/api/gallery/reorder/route.ts) | Bulk order_index update (legacy, no current caller). |
| `GET/PUT /api/settings` | [app/api/settings/route.ts](app/api/settings/route.ts) | Singleton site settings row; `GET` returns hardcoded Artisan Root defaults when unset; `PUT` also applies category renames to products. |
| `GET /api/media` | [app/api/media/route.ts](app/api/media/route.ts) | Streams a file from the Supabase storage bucket by path (allow-listed prefixes only). |
| `POST /api/upload` | [app/api/upload/route.ts](app/api/upload/route.ts) | Admin: upload jpg/png/webp/mp4 to Supabase storage bucket. |
| `GET /api/health` | [app/api/health/route.ts](app/api/health/route.ts) | Health check; returns `{ service: "Artisan Root API" }`. |
| `POST /api/admin/login` | [app/api/admin/login/route.ts](app/api/admin/login/route.ts) | Supabase Auth sign-in, sets `artisan-admin-token` session cookie. |
| `POST /api/admin/logout` | [app/api/admin/logout/route.ts](app/api/admin/logout/route.ts) | Clears the admin session cookie. |
| `GET /api/admin/me` | [app/api/admin/me/route.ts](app/api/admin/me/route.ts) | Returns current admin user from the session cookie. |
| — | [middleware.ts](middleware.ts) | Gates `/admin/*` pages and admin-mutating API methods behind the `artisan-admin-token` cookie. |

---

## 2. Components in `/components`

**Layout / chrome**
- [Navbar.tsx](components/Navbar.tsx) — sticky header, mega-menu categories, mobile sidebar, search overlay (title: "Search Artisan Root"), logo (`/logo.png`, alt "Artisan Root") used 3×, social icons incl. `/instagram-icon.png`, hardcoded fallback WhatsApp `910000000000`.
- [PageChrome.tsx](components/PageChrome.tsx) — wraps page content, skip-to-content anchor target, scroll-to-top button.
- [providers.tsx](components/providers.tsx) — composes `AdminProvider` + `CartProvider` + `PageChrome` + `CartSidebar` + toast host.

**Home sections** — homepage sections are defined inline inside [app/page.tsx](app/page.tsx) (not separate component files): `HeroSlider`, `AnnouncementTicker`, `CategoriesSection`/`CategoryCircle`, `FeaturedProducts`, `VideoSection`, `TestimonialsSlider`, `InstagramStrip`, `Footer`, `LeafOrnament`. [featured-intro.tsx](components/featured-intro.tsx) is a standalone, currently-unused "Artisan Root" splash/intro component (grep shows no imports elsewhere).

**Shop / PDP**
- [ProductCard.tsx](components/ProductCard.tsx) — grid card with wishlist (localStorage key `artisan-root-wishlist`), add-to-cart, quick-view/more-like-this actions; also exports `ProductSkeleton` and `QuickViewModal`.
- [ProductFilters.tsx](components/ProductFilters.tsx) — category/subcategory checkboxes, price slider (₹300–₹3500 hardcoded range), sort dropdown, mobile bottom-sheet variant.

**Cart / checkout**
- [CartSidebar.tsx](components/CartSidebar.tsx) — slide-over cart, checkout form (name/phone/email/address/pincode), submits to `/api/orders`, then opens `wa.me` WhatsApp deep link + confetti. Listens for global `artisan-root:start-checkout` event (also dispatched from [app/shop/[slug]/page.tsx](app/shop/%5Bslug%5D/page.tsx)).
- [CartContext.tsx](context/CartContext.tsx) — reducer-based cart state, persists to localStorage key `artisan-root-cart`.

**Admin**
- [AdminShell.tsx](components/admin/AdminShell.tsx) — sidebar nav ("Dashboard/Products/Orders/Gallery/Homepage Settings/Categories/Site Settings"), logo + "Artisan Root" wordmark, logout button.
- [AdminCards.tsx](components/admin/AdminCards.tsx) — `StatCard`, `AdminSection`, `ConfirmButton` (generic, no brand strings).
- [ProductForm.tsx](components/admin/ProductForm.tsx) — full product create/edit form, image upload + drag-reorder (dnd-kit), autosaves draft to localStorage key `artisan-root-product-draft-{slug}`.

**Misc / shared**
- [LoadingSpinner.tsx](components/LoadingSpinner.tsx) — generic 3-dot spinner, no brand strings.
- [AdminContext.tsx](context/AdminContext.tsx) — admin auth state from `/api/admin/me`.

---

## 3. Supabase — tables, columns, storage, policies

Source: [supabase/schema.sql](supabase/schema.sql), [supabase/product-create-fix.sql](supabase/product-create-fix.sql) (a patch/migration applied on top of the same `products` table), [supabase/README.md](supabase/README.md).

### `public.products`
`id (uuid pk)`, `name`, `slug (unique)`, `category`, `subcategory`, `description`, `price (numeric)`, `original_price`, `images (jsonb array)`, `video_url`, `dimensions`, `care_instructions`, `shipping_info`, `is_featured (bool)`, `featured (bool)` *(duplicate flag, both kept in sync in code — see [lib/supabase-mappers.ts](lib/supabase-mappers.ts))*, `in_stock (bool)`, `stock_count (int)`, `inventory (int)` *(duplicate of stock_count)*, `active (bool)`, `tags (text[])`, `rating (jsonb: {average,count})`, `variants (text[])`, `created_at`, `updated_at`.
Indexes: `(active, created_at desc)`, `(category)`, `(is_featured, featured)`.

### `public.gallery`
`id (uuid pk)`, `url`, `type ('image'|'video')`, `thumbnail_url`, `caption`, `category` (default `'Lifestyle'`), `order_index`, `public_id (unique)`, `featured`, `created_at`, `updated_at`.
Index: `(order_index, created_at desc)`.
Note: the live `/api/gallery` GET route no longer reads this table for its primary response — it derives gallery items from `products` images (see [app/api/gallery/route.ts](app/api/gallery/route.ts)). The table and its `PUT/DELETE/reorder` routes are effectively legacy/unused by current UI.

### `public.orders`
`id (uuid pk)`, `order_number (unique, text)`, `items (jsonb array)`, `customer_name`, `customer_phone`, `customer_email`, `delivery_address`, `pincode`, `total_amount (numeric)`, `status` (check: pending/confirmed/shipped/delivered/cancelled), `whatsapp_sent (bool)`, `created_at`, `updated_at`.
Index: `(status, created_at desc)`.
Order numbers are generated client-side as `AR-{year}-{4 digits}{3 random digits}` — the `AR` prefix is an Artisan Root initialism (see `buildOrderNumber()` in [app/api/orders/route.ts](app/api/orders/route.ts:24-28)).

### `public.settings` (singleton row, id fixed to `00000000-0000-0000-0000-000000000001`)
`id`, `hero_slides (jsonb)`, `mobile_hero_slides (jsonb)`, `video_url`, `announcement_text`, `whatsapp_number`, `social_links (jsonb: {instagram,facebook})`, `about_text`, `meta_title`, `meta_description`, `store_email`, `store_address` (default `'Gurgaon'`), `footer_copyright`, `categories (jsonb array)`, `created_at`, `updated_at`.
The schema's seed `insert` (only runs if the table is empty) hardcodes all Artisan Root brand copy directly into the DB: about text, meta title/description, footer copyright (`© 2025 Artisan Root`), announcement text.

### RLS policies
- `products`: public `select` where `active = true`.
- `gallery`: public `select` (unrestricted).
- `settings`: public `select` (unrestricted).
- `orders`: RLS enabled, **no policies defined** — table is fully locked to anon/authenticated roles; all reads/writes happen server-side via `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS (see comment at [supabase/schema.sql:99](supabase/schema.sql)).
- No `insert`/`update`/`delete` policies exist for any table — all writes go through the service-role key in API routes, gated by `assertAdmin()`.

### Storage
- Single public bucket, name from `SUPABASE_STORAGE_BUCKET` env var, default fallback `"artisan-root"` (see [lib/supabase.ts:3](lib/supabase.ts)).
- README instructs creating a bucket literally named `artisan-root` ([supabase/README.md:5](supabase/README.md)).
- Upload paths are namespaced by type: `images/`, `videos/`, plus importer-specific `products/` ([app/api/upload/route.ts:32](app/api/upload/route.ts), [app/api/media/route.ts:4](app/api/media/route.ts) allow-lists `products/ gallery/ uploads/ homepage/ images/ videos/`).

### Import script
[scripts/import-product-assets.cjs](scripts/import-product-assets.cjs) bulk-uploads from a local folder (default `./Artisan Root Product Photos for Website`, now deleted from disk — see note at top of this report) into storage + `products` + `gallery` + `settings`, hardcoding "Artisan Root" into generated product names/descriptions/tags and all settings fields (lines 48, 54, 66, 69, 95, 126, 139, 196-200).

---

## 4. Every place the brand appears

### Text strings "Artisan Root" / "artisanroot" / "artisan-root"
64 matches across 29 files. Full grep output (representative, not exhaustive per-line):

- **Metadata** — [app/layout.tsx:8-36](app/layout.tsx) — page title, template, description, `applicationName`, `authors`, `creator`, `publisher`, OpenGraph `siteName`/title/description, Twitter card title/description all hardcode "Artisan Root | Cultivating Creative Spaces" and variants.
- **Homepage** — [app/page.tsx](app/page.tsx): hero overline "Artisan Root" (:404), console debug log (:242), Instagram strip heading "Follow us @artisanroot" (:1014) + alt text/aria-labels (:1017, 1024), footer logo alt + wordmark "Artisan Root" (:1080, 1082), footer copyright default `© 2025 Artisan Root` (:1138), footer email `artisanroot22@gmail.com` (:1065).
- **About page** — [app/about/page.tsx:24,29](app/about/page.tsx) — "About Artisan Root" overline + full brand-story paragraph.
- **Contact page** — [app/contact/page.tsx:9,73](app/contact/page.tsx) — `artisanroot22@gmail.com`, WhatsApp prefill text "Hello Artisan Root...".
- **Shop pages** — [app/shop/page.tsx:171](app/shop/page.tsx) "Shop Artisan Root"; [app/shop/[slug]/page.tsx:308](app/shop/%5Bslug%5D/page.tsx) custom event name `artisan-root:start-checkout`; WhatsApp question link hardcodes phone `910000000000` (:317).
- **Collections page** — [app/collections/page.tsx:88,183,223,334](app/collections/page.tsx) "Artisan Root Gallery" heading + 3× alt-text fallbacks.
- **Settings API defaults** — [app/api/settings/route.ts:41-46](app/api/settings/route.ts) — `aboutText`, `metaTitle`, `metaDescription`, `storeEmail: "hello@artisanroot.in"`, `footerCopyright`.
- **Health API** — [app/api/health/route.ts:16](app/api/health/route.ts) — `{ service: "Artisan Root API" }`.
- **Admin UI** — [components/admin/AdminShell.tsx:74-75](components/admin/AdminShell.tsx) logo alt + wordmark; [app/admin/(auth)/login/page.tsx:51](app/admin/(auth)/login/page.tsx) "Artisan Root" overline; [app/admin/(panel)/orders/page.tsx:41](app/admin/(panel)/orders/page.tsx) WhatsApp preview text "your Artisan Root order..."; [app/admin/(panel)/settings/page.tsx:151](app/admin/(panel)/settings/page.tsx) footer placeholder text.
- **Cart/Navbar** — [components/Navbar.tsx:122,202,349,543](components/Navbar.tsx) logo alt ×3, search modal title "Search Artisan Root"; [components/CartSidebar.tsx:43-44](components/CartSidebar.tsx) event listener name; [components/ProductCard.tsx:33,39,45](components/ProductCard.tsx) `artisan-root-wishlist` localStorage key; [components/featured-intro.tsx:19](components/featured-intro.tsx) unused splash heading.
- **localStorage/sessionStorage keys** (functional, need renaming to avoid orphaning existing customer data, though for a new brand this is a clean break anyway): `artisan-root-cart` ([context/CartContext.tsx:6](context/CartContext.tsx)), `artisan-root-wishlist` ([components/ProductCard.tsx](components/ProductCard.tsx)), `artisan-root-product-draft-{slug}` ([components/admin/ProductForm.tsx:55](components/admin/ProductForm.tsx)), `artisan-root-homepage-draft-v2` ([app/admin/(panel)/homepage/page.tsx:53](app/admin/(panel)/homepage/page.tsx)), `artisan-root-categories-draft-v2` ([app/admin/(panel)/categories/page.tsx:35](app/admin/(panel)/categories/page.tsx)), `artisan-root-site-settings-draft-v2` ([app/admin/(panel)/settings/page.tsx:35](app/admin/(panel)/settings/page.tsx)).
- **Custom DOM event**: `artisan-root:start-checkout` (dispatched in PDP, listened in CartSidebar).
- **Cookie name**: `artisan-admin-token` ([lib/admin-auth-constants.ts:1](lib/admin-auth-constants.ts)).
- **Session cookie / auth const, package name, script names**: `package.json` `"name": "artisan-root"`; `start-artisan-dev.cmd` echoes "Starting Artisan Root..."; `npm run supabase:import` → `scripts/import-product-assets.cjs`.
- **Supabase**: bucket name default `"artisan-root"` ([lib/supabase.ts:3](lib/supabase.ts)), README bucket instructions, DB seed row content (see Section 3), import script hardcodes.
- **Order number prefix**: `AR-YYYY-####` in [app/api/orders/route.ts:27](app/api/orders/route.ts).

### Logo / image assets
- `/logo.png` — referenced 10+ times ([app/layout.tsx] favicon not set explicitly; used in [components/Navbar.tsx] ×3, [components/admin/AdminShell.tsx], [app/page.tsx] footer + fallback thumbnails, [app/api/settings/route.ts] default hero slide image, [lib/media.ts:23] fallback when no image). **File does not exist in `public/`** — currently a broken image everywhere.
- `/instagram-icon.png` — referenced in [components/Navbar.tsx:1051 mobile sidebar, :1116 desktop footer via app/page.tsx]. Also missing from `public/`.
- `public/` is entirely empty in this checkout (no favicon either — Next.js will serve its default icon).
- `Amanat logo.PNG` — new, untracked file already sitting in project root (not yet wired into the app).
- Product photography: previously `Artisan Root Product Photos for Website/` (30 tracked jpg/png files used only by the one-off import script) — deleted from disk in this working tree (see top-of-report note). All product imagery actually served by the live site comes from Supabase Storage / the `products` table, not from this folder.
- Fallback/sample data ([lib/product-data.ts](lib/product-data.ts), [lib/gallery-data.ts](lib/gallery-data.ts)) uses `images.unsplash.com` stock photos of macrame/boho decor — irrelevant to jewellery and should be replaced regardless of Supabase config.

### Colors (Tailwind theme, [tailwind.config.js:11-18](tailwind.config.js))
```
artisan-brown:      #5c2d0a
artisan-terracotta: #c4714a
artisan-sage:       #6b7c5c
artisan-cream:      #f9f3ec
artisan-gold:       #c9973a
artisan-sand:       #e8d5bc
```
These class names (`bg-artisan-brown`, `text-artisan-terracotta`, etc.) are used pervasively across nearly every component/page — renaming the palette is a repo-wide find/replace, not just a config change, unless the Tailwind keys are kept and only the hex values are swapped (recommended approach for a jewellery palette, e.g. gold/black/ivory).

### Fonts
[tailwind.config.js:19-22](tailwind.config.js) declares `heading`/`body` font families, but both are just `["Arial", "sans-serif"]` — no real custom typeface loaded. [app/globals.css:8-9](app/globals.css) also declares unused CSS vars `--font-playfair`/`--font-lato` (both set to `Arial`), and a global `* { font-family: Arial !important }` rule ([app/globals.css:39-42](app/globals.css)) overrides everything anyway. Effectively **no distinct heading/body typefaces are actually loaded** — this is an easy, high-impact rebrand lever (e.g. add a serif for jewellery elegance).

### Metadata (SEO/social)
All in [app/layout.tsx:6-44](app/layout.tsx): title/template, description, applicationName, authors, creator, publisher, keywords (`["macrame","handcraft","handmade decor","plant hangers","wall hangings","artisan home decor"]`), OpenGraph block, Twitter card block. `viewport.themeColor` is `#f9f3ec` (the cream brand color, [app/layout.tsx:49](app/layout.tsx)). No `metadataBase`, no explicit favicon/icons block, no OG image configured.

### Phone numbers / WhatsApp
- `+91704474478` — footer contact ([app/page.tsx:1062-1130](app/page.tsx)), contact page ([app/contact/page.tsx:11](app/contact/page.tsx)).
- `910000000000` — placeholder fallback owner WhatsApp in [lib/whatsapp.ts:12](lib/whatsapp.ts), PDP "Ask on WhatsApp" link ([app/shop/[slug]/page.tsx:317](app/shop/%5Bslug%5D/page.tsx)), Navbar mobile sidebar social icon ([components/Navbar.tsx:432](components/Navbar.tsx)).
- `91XXXXXXXXXX` — placeholder default in settings API ([app/api/settings/route.ts:36](app/api/settings/route.ts)).
- Real number is meant to come from `NEXT_PUBLIC_OWNER_WHATSAPP` env var or the `settings.whatsapp_number` DB column — see Section 5/6.

### Emails
- `artisanroot22@gmail.com` — [app/page.tsx:1065](app/page.tsx), [app/contact/page.tsx:9](app/contact/page.tsx).
- `hello@artisanroot.in` — [app/api/settings/route.ts:44](app/api/settings/route.ts) (settings-API default, different from the two above — inconsistent even within the current brand).

### Addresses
- `"Gurgaon"` — hardcoded in multiple places: [app/page.tsx:1064](app/page.tsx), [app/contact/page.tsx:8](app/contact/page.tsx), DB schema default ([supabase/schema.sql:72](supabase/schema.sql)), settings API default ([app/api/settings/route.ts:45](app/api/settings/route.ts)). Also [lib/supabase-mappers.ts:123-127](lib/supabase-mappers.ts) has a curious regex hack that force-overwrites any stored address matching `/pyramid elite|sector 86|gurugram/i` back to plain `"Gurgaon"` — evidence of a prior address migration that will need to be removed/updated for Amanat House's real address.

### Social links
- Instagram/Facebook default to empty-string placeholders in DB, but UI fallback links point to bare `https://www.instagram.com/` and `https://www.facebook.com/` ([app/page.tsx:1103-1104](app/page.tsx), [components/Navbar.tsx:430-431](components/Navbar.tsx), [app/shop/[slug]/page.tsx:357](app/shop/%5Bslug%5D/page.tsx)) — not real handles, just the generic homepage.

---

## 5. Every environment variable read (file:line)

| Variable | File:Line | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | [app/layout.tsx:57](app/layout.tsx), [lib/supabase.ts:10](lib/supabase.ts), [app/api/admin/login/route.ts:16](app/api/admin/login/route.ts), [scripts/import-product-assets.cjs:84](scripts/import-product-assets.cjs) | Supabase project URL; also used for `<link rel="preconnect">` in layout. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [app/api/admin/login/route.ts:17](app/api/admin/login/route.ts) | Anon key used only for the admin sign-in call (`signInWithPassword`). |
| `SUPABASE_SERVICE_ROLE_KEY` | [lib/supabase.ts:6,11](lib/supabase.ts), [scripts/import-product-assets.cjs:84](scripts/import-product-assets.cjs) | Service-role key for all server-side admin Supabase calls (bypasses RLS). |
| `SUPABASE_STORAGE_BUCKET` | [lib/supabase.ts:3](lib/supabase.ts), [scripts/import-product-assets.cjs:66](scripts/import-product-assets.cjs) | Storage bucket name, defaults to `"artisan-root"` if unset. |
| `NEXT_PUBLIC_OWNER_WHATSAPP` | [lib/whatsapp.ts:12](lib/whatsapp.ts), [app/contact/page.tsx:16](app/contact/page.tsx), [app/api/settings/route.ts:36](app/api/settings/route.ts), [scripts/import-product-assets.cjs:194](scripts/import-product-assets.cjs) | Owner's WhatsApp number for order messages / contact links. |
| `NODE_ENV` | [app/page.tsx:241](app/page.tsx) (dev-only console.debug), [lib/admin-auth.ts:12,22](lib/admin-auth.ts) (cookie `secure` flag), [app/api/products/route.ts:69](app/api/products/route.ts), [app/api/products/[slug]/route.ts:45](app/api/products/%5Bslug%5D/route.ts), [app/api/products/search/route.ts:18](app/api/products/search/route.ts), [app/api/gallery/route.ts:22](app/api/gallery/route.ts) | Standard Next.js env; gates whether fallback/sample data is allowed (non-production only) and dev-only logging. |

Declared but with **no other documented vars** beyond what's in [.env.local.example](.env.local.example):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=artisan
NEXT_PUBLIC_OWNER_WHATSAPP=
```
Note: the example file's bucket placeholder is `artisan` (no "-root"), while the code's actual fallback default and the README both say `artisan-root` — these three values disagree and should be reconciled during rebrand.

---

## 6. Hardcoded data that should be CMS/DB-driven

- **Product categories** — canonical list duplicated in at least 4 places that must stay in sync: [lib/product-data.ts:1-12](lib/product-data.ts) (`PRODUCT_CATEGORIES` — the real source of truth type), [app/page.tsx:93-104](app/page.tsx) (homepage fallback with emoji icons), [app/api/settings/route.ts:47-118](app/api/settings/route.ts) (full default settings categories with descriptions/subcategories), [components/Navbar.tsx:31-42](components/Navbar.tsx) (`fallbackCategories`). All ten are macrame/home-decor categories (Handbag, Wall hanging w/wo mirror, Runner, Pot hanger, Key Chains, Dinner Mat, Coaster, Pocket Organiser, Lamp Shade) — **none apply to jewellery** and all need full replacement (e.g. Rings, Necklaces, Earrings, Bracelets, Bridal Sets).
- **Hero slides fallback** — [app/page.tsx:80-88](app/page.tsx) single hardcoded slide ("Handmade warmth for modern homes... Shop Now"), duplicated as the DB default in [app/api/settings/route.ts:15-32](app/api/settings/route.ts).
- **Testimonials** — fully hardcoded, no admin UI or DB table: [app/page.tsx:106-125](app/page.tsx) (3 fake customers: Aarohi Mehta/Pune, Nisha Rao/Bengaluru, Mira Kapoor/Jaipur, macrame-specific quotes).
- **Announcement/marquee text** — hardcoded fallback in [app/page.tsx:499-500](app/page.tsx) ("Free shipping on orders above ₹999 · Handcrafted with love · 100% natural cotton rope..."), duplicated in [app/api/settings/route.ts:34-35](app/api/settings/route.ts) and the SQL seed ([supabase/schema.sql:116](supabase/schema.sql)) — mentions "cotton rope" (macrame-specific, not jewellery).
- **Video/styling section copy** — [app/page.tsx:835-840](app/page.tsx) ("How to Choose Macramé for Your Home", bullet points about wall size/knot style) is fully hardcoded JSX, not settings-driven at all (only the YouTube URL is configurable).
- **Footer policy text** — [app/page.tsx:1134-1135](app/page.tsx) "Returns: 15 days of return acceptable" / "Shipping: All over India shipping is available" are hardcoded strings, not pulled from settings even though [app/contact/page.tsx:11-12](app/contact/page.tsx) has near-identical hardcoded copy independently (two separate hardcoded copies that already drift slightly in wording).
- **Footer nav links / social icons** — [app/page.tsx:1061](app/page.tsx) link list and social platform list (`Instagram/Facebook/WhatsApp`) are hardcoded arrays, not configurable beyond the URLs.
- **Fallback product catalog** — [lib/product-data.ts:87-352](lib/product-data.ts) — 10 fully-authored sample products (names, descriptions, prices, Unsplash images, dimensions, care instructions) used whenever Supabase isn't configured or in non-production. All macrame-themed; would need full replacement with jewellery samples or removal.
- **Fallback gallery data** — [lib/gallery-data.ts:16-66](lib/gallery-data.ts) — 30 generated sample gallery entries from the same Unsplash macrame images.
- **Price filter range** — [components/ProductFilters.tsx:27,183-197](components/ProductFilters.tsx) and [app/shop/page.tsx:27](app/shop/page.tsx) hardcode a ₹300–₹3500 slider range tuned for macrame decor price points — jewellery price points will likely need a different range/step.
- **Order number prefix** `"AR-"` — [app/api/orders/route.ts:27](app/api/orders/route.ts) — literal brand-initialism prefix baked into business logic, not configurable.
- **`normalizeSupabaseSettings` address override** — [lib/supabase-mappers.ts:123-127](lib/supabase-mappers.ts) silently force-rewrites any stored address matching old-location regex back to `"Gurgaon"` — a leftover one-off hack that will interfere with entering Amanat House's real address unless removed.
