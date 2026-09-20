import type { MetadataRoute } from "next";
import { CATEGORY_DETAILS } from "@/lib/product-data";
import { env } from "@/lib/env";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { listHampers } from "@/lib/server-hampers";

// Without both of these, this route's data can freeze at whatever was in the
// database the first time it was ever built/rendered (Next.js's fetch cache
// applies to supabase-js's internal fetch() calls same as any other fetch) —
// products added or removed later through the admin panel would never show
// up. revalidate = 0 is what actually disables caching for this special
// metadata-route file (confirmed by testing: force-dynamic alone was not
// enough — sitemap.ts/robots.ts appear to need the explicit revalidate).
// A sitemap is fetched rarely enough that always querying fresh is cheap.
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getActiveProductSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("products").select("slug").eq("active", true).limit(1000);
    if (error) throw error;
    return (data ?? []).map((row) => row.slug as string);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = env.siteUrl.replace(/\/$/, "");
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/hampers`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/collections`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/shipping`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 }
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORY_DETAILS.map((category) => ({
    url: `${siteUrl}/shop?category=${category.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8
  }));

  const productSlugs = await getActiveProductSlugs();
  const productPages: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${siteUrl}/shop/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7
  }));

  const hamperPages: MetadataRoute.Sitemap = (await listHampers()).map((hamper) => ({
    url: `${siteUrl}/hampers/${hamper.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7
  }));

  return [...staticPages, ...categoryPages, ...productPages, ...hamperPages];
}
