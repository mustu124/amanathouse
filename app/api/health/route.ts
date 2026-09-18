import { fail, ok } from "@/lib/api";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return fail("Supabase is not configured.", 503);
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("products").select("id", { count: "exact", head: true });
    if (error) throw error;

    return ok({ service: "Amanat House API", backend: "supabase" }, "API is healthy.");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "API health check failed.", 500);
  }
}
