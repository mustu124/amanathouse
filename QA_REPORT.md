# Amanat House — Full Verification Sweep

Date: 2026-09-18. Verified against a clean `npm run build` + `npm run start`
production server, and a temporary admin session created and destroyed for
this sweep (all test data removed afterward — the catalog is empty again).

**Overall: PASS**, with fixes applied for every real issue found. Two items
(4 and part of 6) could only be verified by code/CSS audit rather than an
actual browser, since no browser automation tool is available in this
environment — see the "Could not fix / could not verify" section at the end
for exactly what that limits.

---

## 1. Brand leakage — PASS (after fixes)

Grepped for every listed term plus adjacent risk terms (handmade,
handcrafted, knot, thread, craft, bridal) across `.ts/.tsx/.css/.json/.md`,
including alt text, aria-labels, placeholders, comments, and seed data.

**Fixed:**
- `app/not-found.tsx` — headline was "This thread has slipped loose" and
  body said "keep exploring handmade pieces." Rewritten.
- `app/error.tsx` — headline was "A knot needs reworking." Rewritten.
- `app/shop/ShopContent.tsx` — shop hero said "Fine Jewellery, Handcrafted
  with Care" / "gold, bridal, and everyday jewellery crafted with care."
  Rewritten to match the anti-tarnish/waterproof/18K PVD positioning.
- `components/CartSidebar.tsx` — empty-cart copy said "Add a handcrafted
  piece..." Fixed.
- `app/admin/(panel)/homepage/page.tsx` — the blank hero-slide default used
  a stock Unsplash photo URL and the subtitle "Handcrafted gold and bridal
  jewellery for life's most cherished moments." Both replaced (now defaults
  to `/logo.png` and the correct brand line).
- `app/page.tsx` — `getProductDisplayName`'s corrupted-name fallback
  returned `Handmade ${category}`; now `Amanat House ${category}`.
- Three places used `"Craft"` as a default category-icon fallback
  (`app/admin/(panel)/categories/page.tsx`, `app/page.tsx`,
  `components/Navbar.tsx` ×2) — replaced with a neutral `✦` glyph.
- `app/admin/(panel)/gallery/page.tsx` — a `"Bridal"` filter option that
  could never match any real product category (gallery items are generated
  from products, whose category is always one of the 10 official ones).
  Removed, along with an equally dead `"Lifestyle"` option.
- **`lib/product-data.ts`'s `fallbackProducts` catalog** (used only when
  Supabase isn't configured) was still the pre-Prompt-8 taxonomy —
  Earrings, Bangles, Mangalsutra, Nose Pins, Jewellery Sets, and a "Bridal
  Jewellery Set." Flagged as a known gap back in Prompt 11 and deferred;
  fixed now — rewritten as 10 products, one per current category, with
  correct material/plating/anti-tarnish/waterproof fields.
- `lib/supabase-mappers.ts` — a regex-based legacy-address cleanup
  (catches old "Pyramid Elite / Sector 86 / Gurugram" values) was itself
  hardcoded to output the literal string `"Gurgaon"`. Now falls through to
  the real default (the `TODO: confirm city` placeholder from Prompt 13).
- **The live Supabase `settings` row** still had `store_address: "Gurgaon"`
  saved directly (from before Prompt 13's fix) — updated in the database to
  the TODO placeholder. Also found that `app/api/settings/route.ts`'s own
  `defaultSettings.storeAddress` was still `"Address coming soon"` instead
  of `env.storeAddress`, meaning the Prompt 13 TODO placeholder could never
  actually surface — fixed.
- A coincidental hex match: the PDP's gold metal-tone swatch color
  (`#C9973A`, chosen independently in Prompt 10) happened to match one of
  the old palette's hex values byte-for-byte. Not an actual leftover style,
  but nudged to `#D4AF37` to remove any ambiguity.
- `README.md` and `supabase/README.md` still documented `video/mp4` as an
  accepted upload MIME type and described a "styling-guide video URL"
  setting — both removed post-Prompt-11. Docs corrected.
- **The live Supabase storage bucket** was still configured to allow
  `video/mp4` uploads at the infrastructure level (the app layer already
  rejected it, but the bucket itself hadn't been tightened) — updated via
  the Storage API to `image/jpeg`, `image/png`, `image/webp` only.
- `scripts/seed-placeholder-products.ts` had a product named "Rose Gold
  Rope Chain" — "rope chain" is legitimate jewellery terminology (a real
  chain-link style), not a macrame remnant, but renamed to "Rose Gold Twist
  Chain" anyway to satisfy the zero-tolerance bar with no ambiguity.

**Confirmed clean, no action needed:** `artisanroot22@…`, `704474478`, any
`vercel.app` URL, the old Artisan Root hex palette (one coincidental
6-character match, addressed above), and youtube/iframe/embed/`<video>`
(zero hits anywhere in source). The word "video" still appears twice in
`docs/ENV_SETUP.md`, both inside sentences explicitly stating the site
*doesn't* accept video — correct, not a leak.

**Left as-is (explained, not a leak):** `BRAND_AUDIT.md`, the Prompt-1
audit snapshot, still describes the pre-rebrand state by design (a
historical record, same status as git history) — matches the precedent set
in Prompts 11 and 15.

---

## 2. Routes — PASS

Every public route returns 200: `/`, `/shop`, every `/shop?category=<slug>`
(all 10), `/about`, `/contact`, `/collections`, `/sitemap.xml`,
`/robots.txt`. An unknown path returns 404 with the branded not-found page.
Every admin route redirects to `/admin/login` when logged out (307) and
returns 200 when authenticated, including the dynamic
`/admin/products/[slug]/edit` and public `/shop/[slug]` routes (tested
against a temporary product created and removed for this sweep). Custom
`app/error.tsx` and `app/not-found.tsx` both render with full Amanat House
branding (confirmed above, copy also fixed).

One environment hazard hit during this pass, noted for awareness: a stale
`next start` process left over from Prompt 15's session held port 3000 and
served a corrupted hybrid build after a `.next` rebuild raced with it —
resolved by force-killing all node processes and rebuilding clean. Not a
site bug, but worth remembering if a future session sees routes
mysteriously 404 or serve a Pages-Router-style error page in an App Router
project — it means a stale process, not a code problem.

---

## 3. Links — PASS (after fixes)

- No literal `href="#"` anywhere in the codebase.
- The one dynamic `"#"` fallback (Instagram strip, if `instagramUrl` were
  ever empty) is unreachable in practice — `NEXT_PUBLIC_INSTAGRAM_URL` is a
  required, asserted env var, so this path never fires.
- **Fixed a real placeholder-URL issue**: the Facebook social icon (footer
  and mobile nav) fell back to the generic `https://www.facebook.com/`
  when no real Facebook page was configured — exactly the "placeholder URL
  in a social icon" this item warns about. No real Facebook page exists for
  Amanat House, so the icon is now omitted entirely when unconfigured
  rather than pointing somewhere generic and non-brand.
- **Fixed a broken anchor**: the nav's "Categories" link pointed to
  `/shop#categories`, but no element on the shop page had that id — the
  jump did nothing. Added the id (with a scroll-margin offset for the fixed
  header) to the actual category filter section.
- Every other internal link (footer nav, breadcrumbs, category tiles,
  related-products, admin nav) resolves to a route confirmed live in
  section 2.

---

## 4. Responsive (375 / 414 / 768 / 1024 / 1440) — PASS, verified by code/CSS audit only

**No browser or screenshot tool is available in this environment** (same
constraint noted throughout this project — see Prompts 5, 6, 8, 14). This
was verified by auditing every fixed-width class, breakpoint, and overflow
container rather than visually rendering the site at each width. Concretely:

- Grepped for every `w-[Npx]` / `min-w-[Npx]` arbitrary value site-wide.
  Found and fixed one real risk: the desktop mega-menu dropdown
  (`components/Navbar.tsx`) was a fixed `w-[680px]`, centered under its
  trigger — at exactly 768px (the `md` breakpoint where it first becomes
  visible) this could clip off-screen depending on trigger position. Capped
  it to `w-[min(680px,92vw)]` and dropped its inner grid from a flat 5
  columns to `grid-cols-3 lg:grid-cols-5` so it stays readable at md widths.
- The two admin data tables (`min-w-[720px]`, `min-w-[900px]`) are both
  correctly wrapped in `overflow-x-auto` containers — this scrolls the
  table, not the page, which is the standard accepted pattern for
  responsive data tables and matches this item's own framing ("admin
  tables" listed as something to check, not banned from scrolling).
- The cart drawer is `w-full sm:max-w-[420px]` — full-bleed on mobile,
  capped on larger screens; no overflow risk.
- Category grid, product grid, and PDP gallery all already used Tailwind's
  responsive grid utilities (`grid-cols-2 sm:grid-cols-3 ... xl:grid-cols-5`
  style patterns, confirmed in Prompts 5, 8, and 10) with no fixed-width
  children that would break down at 375–414px.
- Nothing renders under 12px — see item 6 below (this was a genuine,
  substantial finding).

**What this doesn't cover**: actual pixel-level overlap, wrapping, or
touch-target spacing can only be confirmed by rendering the page. If you
want that level of certainty, the standing offer from earlier prompts still
applies — I can install Playwright for real screenshot-based verification
at each of the five widths.

---

## 5. Functionality — PASS

- **Search**: `GET /api/products/search?q=...` tested live, returns
  matches (confirmed against a temporary test product).
- **Filters / sort / pagination**: `/api/products?category=...`,
  `?sort=price_asc`, `?page=1&limit=1` all return 200 with correctly
  shaped, correctly filtered/sorted/paginated responses (category filtering
  across all 10 categories re-confirmed in this pass).
- **Cart add/remove/update**: reviewed `context/CartContext.tsx`'s reducer
  — keyed by `(productId, selectedVariant)`, quantity clamped to
  `stockCount`, correct add/remove/update-quantity transitions.
- **Cart persistence on reload**: confirmed by code — localStorage is read
  once on mount via a `hasHydrated` guard that prevents the initial empty
  render from overwriting the stored cart before it's read back; writes
  happen only after hydration completes. This is the correct pattern and
  was already in place.
- **WhatsApp order**: re-verified `buildWhatsAppMessage` end-to-end for a
  5-item cart (built in Prompt 13) — produces a valid, non-truncated wa.me
  link with brand name, itemized lines, total, and customer details.
- **Contact form**: the form has no backend endpoint by design (WhatsApp is
  the order channel) — confirmed it builds a WhatsApp link from whatever
  the visitor typed (fixed from a dead no-op handler in Prompt 13; still
  correct here).
- **Admin CRUD**: re-confirmed create/edit/archive for products (with the
  Prompt 14 friendly-uniqueness and archive-not-delete behavior),
  categories (image upload + reorder + remove, added in Prompt 14), and
  order status updates, all against a live temporary admin session.

---

## 6. Accessibility — PASS (after real fixes)

**Fixed — sub-12px text (a genuine, wide-spread violation):** grepped every
`text-[Npx]` arbitrary value under 12px and found ~25 instances across
`app/page.tsx`, `ProductCard.tsx`, `ProductFilters.tsx`, `ShopContent.tsx`,
`ProductDetailContent.tsx`, `AboutContent.tsx`, both admin table pages, and
the cart badge — sizes as small as 8px at the base (mobile) breakpoint,
only growing past 12px at `sm:`/`xl:`. All bumped to `text-xs` (12px) at
minimum; the cart-count badge circle was enlarged slightly (20px → 22px) so
the now-larger text isn't cramped. Re-grepped after: zero remaining.

**Fixed — Esc-to-close was missing on most modals:** only the search
overlay and the collections-page lightbox handled Escape. Added a shared
`hooks/useEscapeKey.ts` and wired it into the cart drawer, the checkout
modal, `QuickViewModal`, the PDP lightbox, the ring-size/chain-length guide
modals, and the mobile nav drawer.

**Fixed — no modal trapped focus:** added `hooks/useFocusTrap.ts` (moves
focus into the dialog on open, cycles Tab/Shift+Tab within it, restores
focus to the trigger on close) and applied it to every modal listed above
plus the search overlay.

**Fixed — missing `<h1>`:** the About page had zero heading elements at
all (the visual "title" is the logo image; all text was in `<p>` tags).
Added a visually-hidden `<h1>` ("About Amanat House") so the page has a
valid document outline without changing the design. The homepage does have
an `<h1>` (I initially miscounted it — `motion.h1` doesn't match a plain
`<h1` grep — but it's there and correctly ordered under it: h1 → h2 section
titles → h3 product-card names).

**Fixed — unlabelled disclosure state:** the PDP accordion and the contact
page's FAQ accordion toggled visually (rotating chevron / +↔−) but had no
`aria-expanded` on the trigger button, so screen readers had no way to know
a section was a toggle or whether it was open. Added `aria-expanded` to
both, and `aria-hidden="true"` on the purely decorative icon glyphs.

**Already correct, verified not changed:** every functional icon-only
button already had `aria-label` (cart, search, close, wishlist, quantity
+/−, gallery arrows, admin drag handles); every image use I touched or
reviewed carries meaningful `alt` text (empty `alt=""` only on the
Instagram glyph icon, which is correctly decorative next to labelled text);
`focus-visible`/`focus:ring` states are used consistently across
interactive elements (this was already a strong pattern from earlier
prompts, not something this pass needed to introduce).

**Contrast**: not re-audited pixel-by-pixel in this pass — the palette's
WCAG contrast ratios (ink/clay/gold/stone against ivory and white) were
computed and confirmed ≥4.5:1 body / ≥3:1 large text in Prompt 5, and no
color values changed in this sweep (only font sizes and structural markup),
so those ratios stand unchanged.

---

## 7. Performance — PASS (after fixes)

- **Fixed both remaining raw `<img>` tags** flagged by
  `@next/next/no-img-element`: the admin product-list thumbnail
  (`app/admin/(panel)/products/page.tsx`) and the homepage hero image
  (`app/page.tsx`) — both converted to `next/image`. The hero conversion
  keeps its existing manual next-slide preloading (a `new Image()` warm-up
  effect, independent of the rendered element) and adds `priority` since
  it's the LCP candidate.
- `npm run lint` now reports **zero warnings, zero errors** (was 2
  warnings before this pass).
- Below-the-fold images (product grids, category tiles, gallery, cart line
  items) already use `next/image` with `loading="lazy"` or rely on
  `next/image`'s own default lazy behavior; only genuinely above-the-fold
  images (hero, PDP main gallery image) use `priority`.
- Fonts load via `next/font/google` (Cormorant Garamond, Jost) with
  `display: "swap"` and explicit fallback-font metrics — established in
  Prompt 5, unchanged, non-blocking.
- **Console errors/warnings**: could not capture real browser console
  output (no browser automation available — see the note under item 4).
  What I *could* confirm: the dev server log and production server log
  produced no server-side errors or unhandled rejections across the entire
  sweep (route checks, admin CRUD, cart/order flows), and `next build`'s
  own React/webpack diagnostics are clean.

---

## 8. Build / lint / types — PASS

- `npm run build` — clean, zero errors, zero warnings.
- `npm run lint` — clean, zero errors, zero warnings.
- TypeScript `strict: true` already set in `tsconfig.json` (unchanged).
- No `@ts-ignore`, `@ts-nocheck`, `@ts-expect-error`, or `any` types were
  added during this sweep (grepped for all four patterns repo-wide; the one
  incidental match was the English phrase "same as any other" inside a
  code comment, not a type annotation).

---

## Could not fix / could not verify, and why

1. **True responsive rendering (item 4) and live console-error capture
   (item 7)** — this environment has no browser automation tool (no
   Playwright, no screenshot capability). Everything in those two sections
   was verified by static/CSS audit and server-log inspection instead of
   an actual rendered browser at 375/414/768/1024/1440px. I'm confident in
   the fixes made (they were real, grep-confirmed structural risks), but
   pixel-level layout confirmation and browser console output remain
   unverified by direct observation. Offering, as in earlier prompts: I can
   install Playwright if you want that level of certainty.

2. **Pixel-level contrast re-audit** — not recomputed in this pass since no
   color values changed; relying on Prompt 5's original WCAG math. If any
   color token has changed since without my knowledge, that math would need
   redoing, but nothing in this session touched palette hex values (the one
   swatch color changed was a one-off literal, not a design token).

3. **`lib/product-data.ts`'s `fallbackProducts` rewrite is a fallback-mode
   catalog only** — it's what renders if Supabase is ever misconfigured in
   production; it is not seeded into the live database. The real, live
   placeholder catalogue (from `scripts/seed-placeholder-products.ts`,
   Prompt 9) still hasn't been run — the products table is empty right now
   (by design, cleaned up after this sweep's temporary test data). That's a
   standing item from Prompts 9/10, not something new this sweep found.

---

# Re-run after the real catalogue import (2026-09-20)

Scope: 5 categories, 20 real necklaces imported. Rings, Earrings, Bracelets and
Anklets are empty on purpose until the client sends them.

| Check | Result |
|---|---|
| Live product count vs document | **PASS** — document lists 20 necklaces, 20 active in Supabase; re-running the import keeps it at 20 (idempotent on slug) |
| Every product has an image and a price | **PASS** — checked through `/api/products` |
| Every category has at least one product | **FAIL (expected)** — only Necklaces; the other 4 show the designed empty state until their documents arrive |
| Placeholder text / `/placeholder-product.png` | **PASS** — file, seed script and all references removed; fake testimonials removed (section hidden until real reviews exist) |
| Product pages load | **PASS** — all 20 return 200; metadata, canonical and Product JSON-LD (INR, availability) verified on one |
| Routes / sitemap / robots | **PASS** — sitemap lists 20 products + 5 categories, no admin |
| Brand-leak grep | **PASS** — only the client's own "unboxing video" return wording remains (a customer recording, not a site video) |
| `href="#"`, text under 12px, raw `<img>` | **PASS** — 0 / 0 / 0 |
| `npm run lint`, `npm run build` | **PASS** — clean |
| 375px / 1440px rendering | **NOT VERIFIED** — no browser available; layout checked by CSS only |

Fixed in this pass:
- Product photos used `/api/media` in OG tags and JSON-LD, but `/api` is disallowed in robots.txt — they now use the direct storage URL.
- PDP metal-tone picker offered Silver / Rose Gold on gold-only pieces; it now shows only the product's own tone.
- Ring/chain size guides said "placeholder measurements"; reworded as standard reference charts.
- `manifest.json` still said "gold and bridal jewellery".
- `scripts/import-product-assets.cjs` (old importer with stale copy that would overwrite live settings) removed.
- Live homepage settings had reverted to the old ticker text and empty hero slides; re-synced from `lib/content/home.ts`.

Open items for the client / you:
1. Isla Charm, Sana Pearl and Sana Pearl Chain all use the same photo (the client's own PDF shows the same necklace for all three). Confirm, or send separate photos.
2. "Sana pearl" appears twice in the document (899 and 799); the second is named **Sana Pearl Chain** — confirm the name.
3. Stock is a stand-in (10 each); no weights, lengths or compare-at prices were given.
4. "Free shipping above ₹999" (ticker) is not in the client's document; the `new50` welcome offer is shown but applied manually (no discount-code engine).
5. The photos are one image per product, so PDP galleries have a single image.
6. Client wording changes are listed in `scripts/data/necklaces.json` (`clientDescription` vs `description`).

## Hampers (Prompt 20) — verification status

Verified offline (`npm run test:hampers`, `npm run build`, `npm run lint`, HTTP smoke tests):
- Pricing engine: percentage (12% / 15% worked examples hand-checked), fixed price constant across cheapest/priciest baskets, packaging after discount, single rounding, savings never negative, min/max/required/out-of-stock/inactive validation.
- Config validation: 95% discount, fixed price 0, max < min, 1 eligible with min 3 all rejected with readable messages (client + API share `validateHamperConfig`; DB CHECK constraints mirror them in `0003_hampers.sql`).
- Server re-pricing: `priceHamperSelection` matches the client engine; a tampered total is rejected. Live: an order for a real product claiming ₹1 is refused with HTTP 409.
- WhatsApp: 2 hampers + 3 products produces one valid wa.me link (~1.4k chars, not truncated).
- Routes: `/hampers` 200 (empty state), unknown hamper 404, sitemap lists `/hampers`, admin hamper writes are 401 without a session.

Blocked until migration `0003_hampers.sql` is run in the Supabase SQL Editor (DDL cannot be applied from code): creating hampers in admin, live builder, cart persistence with real hampers, order snapshot rows, DB-level constraint rejection, out-of-stock notice against real data, and the real test order.
Not verifiable here: responsive rendering at 375/768/1440 (no browser automation) — layouts were checked by reading the CSS only.

### Hampers — live results after migration 0003 (`npm run verify:hampers`)
- a) 12% hamper, min 2 / max 5, 6 eligible, 1 required: basket of 3 items worth ₹1,597 -> discount ₹191.64 -> pays ₹1,405.36 (hand-checked: 1597 x 0.12 = 191.64).
- b) Fixed ₹1,499 hamper: two cheapest items -> pays ₹1,499 (no saving line); five priciest -> pays ₹1,499 (worth ₹6,695, saves ₹5,196).
- c) 95% discount, fixed price 0, max < min, 1 eligible with min 3 are all rejected with readable messages by the API; the database itself also rejects the first three plus min 0 (`hampers_percentage_valid`, `hampers_fixed_valid`, `hampers_max_items_valid`, `hampers_min_items_valid`).
- f) A contained product set out of stock -> pricing reports "... is out of stock." (drives the cart notice); product restored afterwards.
- g) Hamper order with client total ₹100 -> HTTP 409, nothing stored.
- h) Real order (1 hamper + 1 product) -> HTTP 201; orders.total_amount ₹2,104.36 (= 1,405.36 + 699); order_items has a `hamper` row with the frozen 3-item snapshot and a `product` row. Test order and test hamper rows were deleted afterwards.
- Seeded placeholder hampers: The Everyday Edit (15%, min 3, 8 eligible) and The Gifting Box (₹1,499, min 2 max 4, 6 eligible, 1 required); `/hampers` pages return 200 and the sitemap lists them.
Still not machine-verifiable here: browser rendering at 375/768/1440 and cart UI interactions (no browser automation).
