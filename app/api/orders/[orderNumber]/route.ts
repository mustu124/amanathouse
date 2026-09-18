import { fail, ok } from "@/lib/api";
import { assertAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { normalizeSupabaseOrder } from "@/lib/supabase-mappers";

// Admin-only: this returns full customer PII (name, phone, email, address,
// pincode). Order numbers are sequential-ish and guessable, so this must
// never be reachable without a verified admin session.
export async function GET(_: Request, { params }: { params: { orderNumber: string } }) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", params.orderNumber)
      .maybeSingle();

    if (error) throw error;
    if (!order) return fail("Order not found.", 404);
    return ok({ order: normalizeSupabaseOrder(order) }, "Order loaded.");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to load order.");
  }
}
