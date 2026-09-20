import { unstable_noStore as noStore } from "next/cache";
import { env } from "@/lib/env";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export type ServerContact = {
  email: string;
  whatsappNumber: string;
  instagramUrl: string;
  address: string;
};

const SETTINGS_SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

// Server-side twin of useSiteContact: the admin's saved settings win, env is the fallback.
export async function getServerContact(): Promise<ServerContact> {
  const fallback: ServerContact = {
    email: env.storeEmail,
    whatsappNumber: env.whatsappNumber,
    instagramUrl: env.instagramUrl,
    address: env.storeAddress
  };
  // supabase-js uses fetch(), which Next would otherwise cache between requests.
  noStore();
  if (!isSupabaseConfigured()) return fallback;

  try {
    const supabase = getSupabaseAdmin();
    const columns = "store_email, whatsapp_number, social_links, store_address";
    const singleton = await supabase.from("settings").select(columns).eq("id", SETTINGS_SINGLETON_ID).maybeSingle();
    const row = singleton.data ?? (await supabase.from("settings").select(columns).order("updated_at", { ascending: false }).limit(1).maybeSingle()).data;
    if (!row) return fallback;

    const socialLinks = (row.social_links ?? {}) as { instagram?: string };
    return {
      email: row.store_email?.trim() || fallback.email,
      whatsappNumber: row.whatsapp_number?.trim() || fallback.whatsappNumber,
      instagramUrl: socialLinks.instagram?.trim() || fallback.instagramUrl,
      address: row.store_address?.trim() || fallback.address
    };
  } catch {
    return fallback;
  }
}
