import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth-constants";
import { fail } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";

const maxAge = 60 * 60 * 24 * 7;

export function setAdminSessionCookie(accessToken: string) {
  cookies().set(ADMIN_SESSION_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge
  });
}

export function clearAdminSessionCookie() {
  cookies().set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getAdminUser() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return null;

  // A valid Supabase Auth session alone isn't enough — it must also be an
  // explicit admin_users row. Without this check, any authenticated
  // Supabase Auth user (not just ones intended as admins) could call every
  // admin write route.
  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (adminError || !adminRow) return null;

  return data.user;
}

export async function assertAdmin() {
  const user = await getAdminUser();

  if (!user?.email) {
    return fail("Admin authentication required.", 401);
  }

  return null;
}
