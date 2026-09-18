import { fail, ok } from "@/lib/api";
import { assertAdmin } from "@/lib/admin-auth";
import { env } from "@/lib/env";
import { CATEGORY_DETAILS, slugifyCategoryName } from "@/lib/product-data";
import { HOME_HERO_SLIDES, MARQUEE_TICKER_TEXT } from "@/lib/content/home";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeSupabaseSettings, settingsPayloadToSupabase } from "@/lib/supabase-mappers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SETTINGS_SINGLETON_ID = "00000000-0000-0000-0000-000000000001";
const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0"
};

const defaultSettings = {
  heroSlides: HOME_HERO_SLIDES.map((slide) => ({
    image: slide.image,
    title: slide.headline,
    subtitle: slide.subtitle,
    ctaText: slide.ctaText,
    ctaLink: slide.ctaLink
  })),
  mobileHeroSlides: HOME_HERO_SLIDES.map((slide) => ({
    image: slide.image,
    title: slide.headline,
    subtitle: slide.subtitle,
    ctaText: slide.ctaText,
    ctaLink: slide.ctaLink
  })),
  announcementText: MARQUEE_TICKER_TEXT,
  whatsappNumber: env.whatsappNumber,
  socialLinks: {
    instagram: env.instagramUrl,
    facebook: "https://www.facebook.com/"
  },
  aboutText:
    "Amanat House makes minimal, modern jewellery in 316L stainless steel with 18K PVD gold plating, anti-tarnish and waterproof, made for daily wear. Established 2019.",
  metaTitle: "Amanat House | Minimal. Modern. Made to be your Amanat.",
  metaDescription:
    "Shop everyday jewellery from Amanat House: rings, chains, studs, and more in anti-tarnish, waterproof 18K gold-plated steel.",
  storeEmail: env.storeEmail,
  storeAddress: env.storeAddress,
  footerCopyright: "\u00A9 2025 Amanat House",
  categories: CATEGORY_DETAILS.map((category) => ({
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    description: category.description,
    image: category.image,
    subcategories: [] as string[],
    visible: true
  }))
};

function withDefaultCategorySubcategories(settings: typeof defaultSettings) {
  const defaultCategoryMap = new Map(defaultSettings.categories.map((category) => [category.name, category]));

  return {
    ...settings,
    categories: (settings.categories?.length ? settings.categories : defaultSettings.categories).map((category) => {
      const fallback = defaultCategoryMap.get(category.name);
      return {
        ...category,
        slug: category.slug || fallback?.slug || "",
        icon: category.icon || fallback?.icon || "",
        description: category.description || fallback?.description || "",
        image: category.image || fallback?.image || "",
        subcategories: category.subcategories?.length ? category.subcategories : fallback?.subcategories ?? [],
        visible: category.visible ?? true
      };
    })
  };
}

async function getSettingsRow() {
  const supabase = getSupabaseAdmin();
  const singleton = await supabase
    .from("settings")
    .select("*")
    .eq("id", SETTINGS_SINGLETON_ID)
    .maybeSingle();

  if (singleton.error) throw singleton.error;
  if (singleton.data) return singleton.data;

  const latest = await supabase
    .from("settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest.error) throw latest.error;
  return latest.data;
}

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return ok(
        { settings: withDefaultCategorySubcategories(defaultSettings), fallback: true },
        "Settings loaded.",
        { headers: noStoreHeaders }
      );
    }

    const settings = await getSettingsRow();
    const normalizedSettings = normalizeSupabaseSettings(settings, defaultSettings);
    return ok(
      { settings: withDefaultCategorySubcategories(normalizedSettings as typeof defaultSettings), fallback: !settings },
      "Settings loaded.",
      { headers: noStoreHeaders }
    );
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to load settings.");
  }
}

export async function PUT(request: Request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json();
    const supabase = getSupabaseAdmin();
    const existing = await getSettingsRow();
    const normalizedExisting = normalizeSupabaseSettings(existing, defaultSettings);
    const settingsPayload = {
      id: SETTINGS_SINGLETON_ID,
      ...settingsPayloadToSupabase({
        ...normalizedExisting,
        ...payload
      })
    };

    const { data: settings, error } = await supabase
      .from("settings")
      .upsert(settingsPayload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;

    const categoryRenames = Array.isArray(payload.categoryRenames)
      ? payload.categoryRenames.filter(
          (rename: unknown): rename is { from: string; to: string } =>
            typeof rename === "object" &&
            rename !== null &&
            typeof (rename as { from?: unknown }).from === "string" &&
            typeof (rename as { to?: unknown }).to === "string" &&
            Boolean((rename as { from: string }).from.trim()) &&
            Boolean((rename as { to: string }).to.trim()) &&
            (rename as { from: string; to: string }).from.trim() !== (rename as { from: string; to: string }).to.trim()
        )
      : [];

    // Rename in the categories table first — products.category has an
    // ON UPDATE CASCADE foreign key to categories.name, so this alone
    // propagates the rename to every product. The loop below is then a
    // harmless no-op safety net for rows the cascade already caught.
    for (const rename of categoryRenames) {
      const { error: categoryRenameError } = await supabase
        .from("categories")
        .update({ name: rename.to.trim(), updated_at: new Date().toISOString() })
        .eq("name", rename.from.trim());
      if (categoryRenameError) throw categoryRenameError;
    }

    for (const rename of categoryRenames) {
      const { error: renameError } = await supabase
        .from("products")
        .update({ category: rename.to.trim(), updated_at: new Date().toISOString() })
        .eq("category", rename.from.trim());
      if (renameError) throw renameError;
    }

    // Keep the categories table (the FK target for products.category) in
    // sync with whatever was just saved to settings.categories, so a
    // brand-new category is insertable as a product's category immediately.
    const categoriesToSync = Array.isArray(payload.categories) ? payload.categories : [];
    if (categoriesToSync.length > 0) {
      const categoryRows = categoriesToSync
        .filter((category: unknown): category is { name: string } =>
          typeof category === "object" && category !== null && typeof (category as { name?: unknown }).name === "string" && Boolean((category as { name: string }).name.trim())
        )
        .map((category: Record<string, unknown>, index: number) => ({
          name: String(category.name).trim(),
          slug: typeof category.slug === "string" && category.slug ? category.slug : slugifyCategoryName(String(category.name)),
          icon: typeof category.icon === "string" ? category.icon : "",
          description: typeof category.description === "string" ? category.description : "",
          subcategories: Array.isArray(category.subcategories) ? category.subcategories : [],
          visible: category.visible !== false,
          sort_order: index,
          updated_at: new Date().toISOString()
        }));

      if (categoryRows.length > 0) {
        const { error: categorySyncError } = await supabase
          .from("categories")
          .upsert(categoryRows, { onConflict: "name" });
        if (categorySyncError) throw categorySyncError;
      }
    }

    return ok(
      { settings: normalizeSupabaseSettings(settings, defaultSettings) },
      "Settings updated.",
      { headers: noStoreHeaders }
    );
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to update settings.");
  }
}
