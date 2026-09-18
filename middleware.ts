import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth-constants";

const adminApiPatterns = [
  { pattern: /^\/api\/products(?:\/.*)?$/, methods: ["POST", "PUT", "DELETE"] },
  { pattern: /^\/api\/gallery(?:\/.*)?$/, methods: ["POST", "PUT", "DELETE"] },
  { pattern: /^\/api\/orders$/, methods: ["GET"] },
  // Order lookup exposes full customer PII (name, phone, email, address) —
  // admin-only, distinct from the /status sub-route matched separately below.
  { pattern: /^\/api\/orders\/[^/]+$/, methods: ["GET"] },
  { pattern: /^\/api\/orders\/[^/]+\/status$/, methods: ["PUT"] },
  { pattern: /^\/api\/upload$/, methods: ["POST"] },
  { pattern: /^\/api\/settings$/, methods: ["PUT"] }
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi = adminApiPatterns.some(
    (entry) => entry.pattern.test(pathname) && entry.methods.includes(request.method)
  );

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  if (hasSessionCookie) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json(
      { success: false, data: null, message: "Admin authentication required." },
      { status: 401 }
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"]
};
