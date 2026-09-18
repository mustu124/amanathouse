# Admin auth flow

Technical reference for how `/admin` is protected. For the non-technical
walkthrough of using the admin panel day-to-day, see
[ADMIN_GUIDE.md](ADMIN_GUIDE.md).

## How an admin logs in

1. The admin visits `/admin` (or any `/admin/*` page) without a valid session
   and is redirected to `/admin/login?callbackUrl=<original path>` by
   [middleware.ts](../middleware.ts).
2. [app/admin/(auth)/login/page.tsx](../app/admin/(auth)/login/page.tsx) posts
   `{ email, password }` to `POST /api/admin/login`.
3. [app/api/admin/login/route.ts](../app/api/admin/login/route.ts) calls
   `supabase.auth.signInWithPassword` using the **anon** key (a normal
   Supabase Auth sign-in — there is no separate admin password store).
4. On success, the Supabase **access token** (JWT) is written to a signed,
   `httpOnly` cookie (`ADMIN_SESSION_COOKIE`, see
   [lib/admin-auth-constants.ts](../lib/admin-auth-constants.ts)) via
   `setAdminSessionCookie` in [lib/admin-auth.ts](../lib/admin-auth.ts).
   `maxAge` is 7 days, `secure` in production, `sameSite: "lax"`.
5. The browser is redirected to `callbackUrl` (default `/admin`).

## Where "admin" is decided

Signing in with Supabase Auth alone is **not** sufficient — every Supabase
Auth user is checked against the `admin_users` table:

```
getAdminUser() in lib/admin-auth.ts:
  1. Read the session cookie.
  2. supabase.auth.getUser(token) — validates the JWT is real and unexpired.
  3. SELECT id FROM admin_users WHERE id = <user.id> — must exist.
  4. Only if both pass, the request is treated as an admin.
```

To make someone an admin: create their user in Supabase Dashboard >
Authentication > Users, then insert a row `{ id: <that user's UUID> }` into
`admin_users` (see [supabase/README.md](../supabase/README.md)). Deleting the
`admin_users` row revokes admin access immediately without touching their
login credentials.

## What protects the routes

Two layers, deliberately redundant:

1. **[middleware.ts](../middleware.ts)** — a fast, cookie-presence-only gate
   that runs before any page or API route code. It matches:
   - Every `/admin/*` page except `/admin/login`.
   - A curated list of admin-only API method+path patterns
     (`adminApiPatterns`) — e.g. `POST/PUT/DELETE /api/products*`,
     `GET/PUT /api/orders*`, `POST /api/upload`, `PUT /api/settings`.

   If the cookie is missing: pages redirect to `/admin/login`, API routes get
   `401 { success: false, message: "Admin authentication required." }`.

   **This layer only checks that a cookie exists — it does not validate it.**
   A forged or expired cookie value passes the middleware and is only caught
   by layer 2.

2. **`assertAdmin()` inside the route handler** — every admin-only API route
   (products POST/PUT/DELETE, gallery POST/PUT/DELETE, orders GET and
   `[orderNumber]` GET, `orders/[orderNumber]/status` PUT, `upload` POST,
   `settings` PUT) calls `assertAdmin()` from
   [lib/admin-auth.ts](../lib/admin-auth.ts) itself, which does the full
   `getAdminUser()` check above (JWT validity + `admin_users` membership).
   This is what actually rejects a stale/forged/non-admin session — the
   middleware is a cheap pre-filter, not the source of truth.

   Because both layers independently call the real check, a route added to
   the app but *missed* in `middleware.ts`'s pattern list is still safe **as
   long as its own handler calls `assertAdmin()`** — but a route that misses
   *both* is not protected. When adding a new admin-only route, add it to
   both `middleware.ts` and call `assertAdmin()` in the handler.

## What happens on an unauthenticated request

| Request | Result |
|---|---|
| `GET /admin/*` (no cookie) | 302 redirect to `/admin/login?callbackUrl=...` |
| `GET /admin/login` (no cookie) | Loads normally — the login page itself is never gated |
| `POST /api/products` (no cookie) | `401` from middleware, body never reached |
| `POST /api/products` (stale/forged cookie) | Middleware passes it through (cookie exists); `assertAdmin()` inside the route returns `401` |
| `GET /api/orders/[orderNumber]` (no cookie) | `401` — this route was fixed as part of Prompt 14 (see below) |

## Known gap found and fixed in this pass

`GET /api/orders/[orderNumber]` had **no auth check at all** — neither in
`middleware.ts`'s pattern list nor inside the handler — despite returning full
customer PII (name, phone, email, delivery address, pincode, order total,
items). It also turned out to be unused by any current frontend flow. Fixed
by adding `assertAdmin()` inside the handler and adding the route to
`middleware.ts`'s pattern list for defense-in-depth. Audited every other
`/api/*` route at the same time — all other write/list/detail admin
endpoints already called `assertAdmin()` internally.

## Known limitation (not fixed — documented instead)

The session cookie's `maxAge` is 7 days, but the Supabase access token stored
inside it uses Supabase's default JWT expiry (typically ~1 hour) and this app
never refreshes it. In practice an admin will be silently logged out (next
request 401s, page redirects to `/admin/login`) well before the 7-day cookie
actually expires. This is not a security hole — an expired token safely fails
`assertAdmin()` — but it is a UX rough edge. Documented in
[ADMIN_GUIDE.md](ADMIN_GUIDE.md) as "if you're logged out unexpectedly, just
log back in" rather than engineered around, since implementing refresh-token
rotation is a larger change than this pass's scope (fixing broken auth gates
and documenting the flow).

## Logging out

`POST /api/admin/logout` clears the cookie (`clearAdminSessionCookie`). It
does not revoke the underlying Supabase session server-side (no
`supabase.auth.signOut()` call, since the server holds no refresh token for
this session) — the JWT simply stops being sent by the browser and remains
valid, unused, until it expires naturally (~1 hour).
