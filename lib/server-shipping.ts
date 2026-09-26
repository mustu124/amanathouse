import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

const SETTINGS_SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

// The one place the order API (and anything else server-side) reads the
// admin's flat shipping fee — never trust a client-sent value.
export async function getServerShippingFee(): Promise<number> {
  noStore();
  if (!isSupabaseConfigured()) return 0;

  try {
    const supabase = getSupabaseAdmin();
    const singleton = await supabase.from("settings").select("shipping_fee").eq("id", SETTINGS_SINGLETON_ID).maybeSingle();
    const row = singleton.data ?? (await supabase.from("settings").select("shipping_fee").order("updated_at", { ascending: false }).limit(1).maybeSingle()).data;
    return Number(row?.shipping_fee ?? 0) || 0;
  } catch {
    return 0;
  }
}
