# Environment Setup

This project reads its configuration from environment variables. Locally these come from
`.env.local` (copy `.env.local.example` and fill it in — never commit `.env.local`). On
Vercel they're set per-project under **Settings > Environment Variables**, scoped to one or
more of **Production**, **Preview**, and **Development**.

A startup check ([next.config.mjs](../next.config.mjs) and [lib/env.ts](../lib/env.ts)) throws
immediately, naming the exact missing variable, if any required public var below isn't set.
This runs the moment `next dev` or `next build` starts — before any page compiles — so a
missing var can never fail silently at runtime.

## Variables

| Variable | Required? | Where it's read | Where to get it |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Recommended (app runs in fallback/sample-data mode without it, outside production) | [lib/supabase.ts](../lib/supabase.ts), [app/layout.tsx](../app/layout.tsx), admin login, import script | Supabase Dashboard > Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Recommended | Admin login route only (`supabase.auth.signInWithPassword`) | Supabase Dashboard > Project Settings > API > Project API keys > `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Recommended | [lib/supabase.ts](../lib/supabase.ts) — **server-only**, used by every admin/API route that writes to Supabase | Supabase Dashboard > Project Settings > API > Project API keys > `service_role`. **Never** prefix this with `NEXT_PUBLIC_` and never import `lib/supabase.ts` from a `"use client"` file — Next.js would otherwise ship it to the browser. |
| `SUPABASE_STORAGE_BUCKET` | Optional (defaults to `amanat-house` in code if unset — set it explicitly to avoid that stale default) | [lib/supabase.ts](../lib/supabase.ts), import script | The name of a public bucket you create yourself in Supabase Dashboard > Storage — **public read**, 10MB file size limit, MIME types restricted to `image/jpeg`, `image/png`, `image/webp` (matches [app/api/upload/route.ts](../app/api/upload/route.ts)'s own allow-list — no video, this site doesn't accept video uploads). Writes only ever happen server-side with `SUPABASE_SERVICE_ROLE_KEY`, which bypasses these Storage-level limits and RLS — the limits exist to stop anything malformed reaching the bucket via `/api/upload`, not to gate access. |
| `NEXT_PUBLIC_SITE_URL` | **Required** — build/dev throws without it | [app/layout.tsx](../app/layout.tsx) (`metadataBase` for SEO/OpenGraph) | Your production domain, e.g. `https://www.amanathouse.com` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | **Required** — build/dev throws without it | [lib/whatsapp.ts](../lib/whatsapp.ts) (order messages), [app/contact/page.tsx](../app/contact/page.tsx), [app/api/settings/route.ts](../app/api/settings/route.ts) fallback | Digits only with country code, no `+`/spaces/dashes, e.g. `919999999999` |
| `NEXT_PUBLIC_STORE_EMAIL` | **Required** — build/dev throws without it | [app/api/settings/route.ts](../app/api/settings/route.ts) fallback (used until an admin sets one in Site Settings) | The store's real contact inbox |
| `NEXT_PUBLIC_INSTAGRAM_URL` | **Required** — build/dev throws without it | [app/api/settings/route.ts](../app/api/settings/route.ts) fallback (used until an admin sets one in Site Settings) | The brand's Instagram profile URL |
| `NEXT_PUBLIC_STORE_ADDRESS` | Optional — shows a visible `TODO: confirm city` placeholder when unset, never a guess | [lib/env.ts](../lib/env.ts), footer, contact page, structured data | City/address to display — not yet confirmed by the client |

### Admin auth

The admin panel (`/admin`) has no auth env vars of its own. Signing in calls Supabase Auth
directly with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the resulting
session token is verified server-side on every request using `SUPABASE_SERVICE_ROLE_KEY`
(see [lib/admin-auth.ts](../lib/admin-auth.ts)). To create an admin login, add a user under
Supabase Dashboard > Authentication > Users — there is no separate signup flow in the app.

### Why some vars are "required" and some aren't

`NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_SERVICE_ROLE_KEY` are left optional at the env-check level
because the codebase already has explicit, non-silent handling for a missing Supabase config:
`/api/health` returns `503`, admin API routes return a clear "Supabase is not configured" JSON
error, and public pages fall back to a bundled sample catalog outside production. Making these
hard-required would break that intentional local-dev-without-a-database path.

The four `NEXT_PUBLIC_SITE_URL` / `WHATSAPP_NUMBER` / `STORE_EMAIL` / `INSTAGRAM_URL` vars had no
such handling — if left unset they would silently fall back to old Amanat House placeholder
values (wrong brand, wrong contact info) with no warning. That's the silent-failure case the
startup check in `lib/env.ts` exists to catch, so these four are hard-required everywhere,
including local dev.

## Setting these in Vercel

For each variable, add it under the project's **Settings > Environment Variables** and choose
which environments it applies to:

- **Production** — the live `amanathouse.com` deployment. Use real Supabase credentials, the
  real WhatsApp number, real store email, and the real Instagram URL.
- **Preview** — deployments from pull requests/branches. Typically point at the same Supabase
  project as Production (or a staging project, if you have one) so reviewers see real data;
  `NEXT_PUBLIC_SITE_URL` should still be set (Vercel's preview URL also works) so metadata
  generation doesn't throw.
- **Development** — used by `vercel dev` / `vercel env pull`, not by a plain local `next dev`
  (which reads `.env.local` directly). Keep this in sync with your local `.env.local` values if
  you use `vercel env pull` to populate it.

After adding or changing any variable in Vercel, redeploy — Next.js inlines `NEXT_PUBLIC_*`
values at build time, so a running deployment won't pick up a changed value until it's rebuilt.
