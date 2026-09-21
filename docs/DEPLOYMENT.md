# Deploying Amanat House to Vercel

This is a from-scratch deploy to the **client's own** Vercel account and a
**brand-new** Supabase project — not a migration of the developer's
existing accounts. Follow this in order; each numbered section is a
checkpoint before the next.

`amanathouse.com` is used throughout as the working example domain,
matching what's already configured in `NEXT_PUBLIC_SITE_URL`. Replace it
everywhere with whatever domain the client actually owns — see the
"Domain" section below and the outstanding items in
[go-live checklist below](#5-what-i-still-need-from-the-client-before-go-live).

---

## 1. Repo

The code currently lives at `github.com/mustu124/artisans` — a leftover
name from the original clone, and (depending on who owns that account) not
necessarily under the client's control.

1. Either **rename** the repo (GitHub → Settings → repository name →
   e.g. `amanat-house`) if the client will own that GitHub account going
   forward, **or transfer** it to the client's own GitHub account/org
   (GitHub → Settings → Danger Zone → Transfer ownership) so the client
   fully owns the source going forward.
2. Confirm the `main` branch (or whichever branch is production) is the
   one with all rebrand work merged — this session's work should already
   be committed; double-check `git log` and `git status` before proceeding.

## 2. New Supabase project

Do **not** reuse the Supabase project used during development — create a
clean one so the client's real data starts empty and the client owns the
project (billing, backups, access control) from day one.

1. [supabase.com/dashboard](https://supabase.com/dashboard) → New Project,
   under the **client's** Supabase organization/account.
2. Run [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql)
   then [`supabase/migrations/0002_is_placeholder.sql`](../supabase/migrations/0002_is_placeholder.sql)
   then [`supabase/migrations/0003_hampers.sql`](../supabase/migrations/0003_hampers.sql)
   in the SQL Editor, in that order (both idempotent).
3. Create the storage bucket — see [supabase/README.md](../supabase/README.md)
   step 5 (`amanat-house` bucket, public, 10MB limit, `image/jpeg` /
   `image/png` / `image/webp` only — **no `video/mp4`**, this site doesn't
   accept video uploads).
4. Create the first admin user (Authentication → Users → email + password),
   then follow [supabase/README.md](../supabase/README.md) step 4 to add
   them to `admin_users`.
5. From Project Settings → API, copy the **Project URL**, **anon public**
   key, and **service_role** key — these feed the Vercel env vars below.
6. Run `npm run seed:categories` once (from a machine with these new
   credentials in `.env.local`) to seed the 5 jewellery categories, then
   `python scripts/process-catalogue-images.py` and `npm run import:catalogue`
   to load the real catalogue — see [docs/PLACEHOLDER_CLEANUP.md](PLACEHOLDER_CLEANUP.md).

## 3. Create the Vercel project

1. [vercel.com](https://vercel.com) → sign in with (or invite) the
   **client's** account.
2. Add New → Project → Import the GitHub repo from step 1 (Vercel's GitHub
   App needs access to that repo — grant it if prompted).
3. Framework Preset: Vercel auto-detects **Next.js** — leave it.
4. **Build command**: leave as the default (`npm run build` /
   `next build` — no `vercel.json` exists and none is needed).
5. **Output directory**: leave as default (`.next` — Next.js managed).
6. **Install command**: leave as default (`npm install`).
7. **Node.js Version**: Project Settings → General → Node.js Version →
   select **20.x**. `package.json` now pins `"engines": { "node": "20.x" }`
   too, so this should be pre-selected, but confirm it in the dashboard.
8. Add the environment variables (next section) **before** the first
   deploy, or the build will fail — `lib/env.ts` and `next.config.mjs`
   both throw at build time if any required `NEXT_PUBLIC_*` var is missing.

### Environment variables (per Vercel environment)

Vercel has three environment scopes: **Production**, **Preview**, and
**Development**. Add every variable below to **all three** — this is one
small business site with one Supabase project backing every environment,
not a multi-tenant setup, so there's no reason for Preview/Development to
point anywhere different. (If the client later wants Preview deployments
to test against a disposable database without risking production data,
create a second Supabase project and give Preview its own
`NEXT_PUBLIC_SUPABASE_URL` / keys — optional, not needed for launch.)

| Variable | Scope | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All | The new Supabase project's URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | The new project's anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | All | The new project's service_role key — **mark as "Sensitive" in Vercel** (hides the value from the dashboard UI after saving) |
| `SUPABASE_STORAGE_BUCKET` | All | `amanat-house` (or whatever you named it in step 2.3) |
| `NEXT_PUBLIC_SITE_URL` | All | `https://www.amanathouse.com` (no trailing slash) — see note below |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | All | Real WhatsApp number, digits only with country code, e.g. `917978022866` |
| `NEXT_PUBLIC_STORE_EMAIL` | All | Real store contact email |
| `NEXT_PUBLIC_INSTAGRAM_URL` | All | Real Instagram profile URL |

**On `NEXT_PUBLIC_SITE_URL` for Preview**: Preview deployments get a unique
`*.vercel.app` URL per deployment, which won't match this fixed value —
that only affects SEO metadata (canonical/OG tags) on preview links, which
don't need to be search-correct anyway. Leave it pointing at the real
production domain in all three scopes; don't try to make it dynamic.

Full reference for what each variable does and where it's read in code:
[docs/ENV_SETUP.md](ENV_SETUP.md).

9. Click **Deploy**. First deploy will succeed once the build completes —
   confirm no red errors in the Vercel build log.

## 4. Domain and DNS

Replace `amanathouse.com` below with the domain the client actually owns
(see the go-live checklist — this hasn't been confirmed yet).

1. Vercel Project → Settings → Domains → Add `www.amanathouse.com` — set
   this as the **primary** domain (matches `NEXT_PUBLIC_SITE_URL`).
2. Also add the bare `amanathouse.com` and set it to **redirect** to
   `www.amanathouse.com` (Vercel offers this as a one-click option when you
   add the second domain).
3. At the domain's DNS provider (wherever it's registered — Namecheap,
   GoDaddy, Cloudflare, etc.), add:

   | Type | Host | Value |
   |---|---|---|
   | A | `@` (root/apex) | `76.76.21.21` (Vercel's anycast IP — confirm the exact current value in the Vercel dashboard's domain instructions, it's shown per-domain when you add it) |
   | CNAME | `www` | `cname.vercel-dns.com` |

   If the DNS provider supports `ALIAS`/`ANAME` records (Cloudflare, some
   others), Vercel's dashboard will suggest that instead of the apex `A`
   record — follow whatever Vercel's own domain-verification screen shows,
   it tailors the instructions to what it detects about the provider.
4. DNS propagation is typically minutes, occasionally up to 24-48 hours.
   Vercel's Domains screen shows a live "Valid Configuration" check once it
   sees the records.
5. Vercel auto-provisions an SSL certificate once DNS resolves — no
   separate action needed.

## 5. What I still need from the client before go-live

Nothing above requires these to complete the *technical* deploy, but the
site isn't truly launch-ready without them:

1. **The real domain name** — this doc uses `amanathouse.com` as a
   placeholder throughout. Confirm the actual domain (already owned, or
   needs registering) and who has access to its DNS settings.
2. **Earrings and Bracelets** — Necklaces (20) and Rings (11, with client
   prices) are imported. Earrings and Bracelets still need their documents
   and photos (same process: see
   [docs/PLACEHOLDER_CLEANUP.md](PLACEHOLDER_CLEANUP.md)).
3. **Real stock quantities, weights and lengths** — imported products use
   10 units of stock as a stand-in and have no weight or chain length.
4. **Policy confirmations** — returns, shipping and the 6-month warranty
   in `lib/content/policies.ts` now follow the client's document; confirm
   the "free shipping above ₹999" ticker line and the `new50` welcome offer
   (5% off, applied manually — there is no discount-code engine yet).
5. **Instagram handle** — `NEXT_PUBLIC_INSTAGRAM_URL` is currently set to
   `https://www.instagram.com/amanat.jewelhouse`; confirm this is the real,
   final handle the client wants live (or provide the correct one).
6. **Domain access** — whoever manages DNS for the domain needs to either
   make the changes in section 4 themselves, or grant access/instructions
   to whoever is doing this deploy.
8. **Facebook page** (optional) — the Facebook icon was removed from the
   footer and nav in Prompt 16's QA pass because no real page existed to
   link to. If the client has or wants one, add the URL in
   `/admin/settings` and it'll reappear automatically.
9. **A decision on the ~1 hour session-expiry UX** — documented as a known
   limitation in [docs/ADMIN_AUTH.md](ADMIN_AUTH.md): admins get logged out
   after roughly an hour of activity and just need to log back in. Fine to
   ship as-is, but the client should know this is expected, not a bug.

## Rolling back a bad deploy

Vercel keeps every previous deployment. To roll back:

1. Vercel Project → Deployments tab.
2. Find the last known-good deployment (green checkmark, from before the
   problem).
3. Click the `...` menu on that deployment → **Promote to Production**.
   This is instant — it repoints the production domain at that build
   without needing a new git push or rebuild.
4. If the bad deploy also included a Supabase migration that needs
   reverting, that's separate and manual — Vercel rollback only affects
   the app code, not the database. Check what changed in
   `supabase/migrations/` before assuming a rollback fully undoes a
   release.

For a bad change that's already been live a while (so rolling back would
also lose since-then data changes), prefer fixing forward: push a new
commit with the fix rather than rolling back, since rollback plus new
customer orders in between can get confusing about which app version wrote
what.

## Rotating keys

**Supabase service role key** (if leaked, or as routine hygiene):
1. Supabase Dashboard → Project Settings → API → service_role key →
   regenerate (this immediately invalidates the old one).
2. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel → Settings →
   Environment Variables for all three scopes.
3. Redeploy (Vercel → Deployments → `...` → Redeploy on the latest
   production deployment) — env var changes don't apply to already-running
   deployments until a redeploy.

**Supabase anon key**: same steps, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Safe to
rotate any time since it's designed to be public (protected by RLS, not
secrecy) — rotate mainly if you suspect the *service role* key leaked
alongside it and want to be thorough.

**Admin passwords**: Supabase Dashboard → Authentication → Users → select
the user → Send password recovery, or set a new password directly. No
Vercel-side change needed since credentials aren't stored as env vars.

**After any rotation**: confirm `/api/health` still returns 200 and log
into `/admin` successfully before considering the rotation complete.

---

## Verify before considering this deploy-ready

Run locally with real (or realistically-shaped) production values in
`.env.local`:

```bash
npm run build
```

Should complete with zero errors (warnings from `next lint` would also
surface here — there should be none; see `QA_REPORT.md`). This was
last confirmed clean on 2026-09-18.

## Post-deploy smoke tests (run these against the live URL)

1. **Home** (`/`) loads, hero renders, no console errors.
2. **Shop** (`/shop`) loads, category filters work, at least one product
   card renders (requires real products to be seeded — see section 5.2).
3. **One product page** (`/shop/<slug>`) loads with correct price,
   images, and metal-tone/size selectors.
4. **Add to cart** — add the product, confirm the cart drawer shows it
   with the right price and quantity, and that reloading the page keeps
   the cart (localStorage persistence).
5. **WhatsApp order** — complete checkout, confirm it opens WhatsApp with
   a correctly formatted pre-filled order message (brand name, item,
   price, total, customer details) addressed to the real
   `NEXT_PUBLIC_WHATSAPP_NUMBER`.
6. **Admin login** (`/admin/login`) — log in with the real admin
   credentials created in section 2.4; confirm redirect to `/admin`.
7. **Create a product** in `/admin/products/new`, upload at least one
   image, publish it, and confirm it appears on the live storefront within
   the same session (no caching lag expected for product pages).
8. **Place a test order** from the storefront and confirm it appears in
   `/admin/orders` with the correct items/customer details, then archive
   or otherwise clean up the test product/order afterward so the client's
   live catalog and order history start clean.
