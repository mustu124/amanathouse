import { fallbackProducts, normalizeProduct, type StoreProduct } from "@/lib/product-data";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeSupabaseProduct } from "@/lib/supabase-mappers";

// Server-only product lookup used by generateMetadata (and any other server
// component that needs a single product without an internal HTTP round-trip
// to /api/products/[slug]). Mirrors that route's public (non-admin) lookup:
// active products only, fallback catalog when Supabase isn't configured.
export async function getProductBySlugForMetadata(slug: string): Promise<StoreProduct | null> {
  if (!isSupabaseConfigured()) {
    const fallback = fallbackProducts.find((product) => product.slug === slug);
    return fallback ? normalizeProduct(fallback as unknown as Record<string, unknown>) : null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("products").select("*").eq("slug", slug).eq("active", true).maybeSingle();
    if (error || !data) return null;
    return normalizeSupabaseProduct(data);
  } catch {
    return null;
  }
}
