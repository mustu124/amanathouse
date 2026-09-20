// Imports the client's real catalogue. Safe to re-run: products are matched
// on slug (upsert), images are overwritten in place, nothing is duplicated.
//
//   python scripts/process-catalogue-images.py   # once, builds the WebP files
//   npm run import:catalogue
//
// Data lives in scripts/data/*.json (one file per category as the client
// sends them); images are read from client-assets/processed/<slug>-N.webp.
import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CARE_INSTRUCTIONS } from "../lib/product-data";
import { HOME_HERO_SLIDES, MARQUEE_TICKER_TEXT } from "../lib/content/home";
import { productPayloadToSupabase } from "../lib/supabase-mappers";

loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "amanat-house";

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

type CatalogueProduct = {
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  description: string;
  material: string;
  plating: string;
  metalTone: "gold" | "silver" | "rose-gold";
  size: string | null;
  weightGrams: number | null;
  stockCount: number;
  badges: string[];
  isFeatured: boolean;
  tags: string[];
};

const dataDir = path.join(process.cwd(), "scripts", "data");
const processedDir = path.join(process.cwd(), "client-assets", "processed");

function loadCatalogue(): CatalogueProduct[] {
  return fs
    .readdirSync(dataDir)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf-8")) as CatalogueProduct[]);
}

function imagesFor(slug: string) {
  return fs
    .readdirSync(processedDir)
    // Exact `<slug>-<n>.webp` only — "sana-pearl" must not also claim the
    // images of "sana-pearl-chain".
    .filter((file) => file.startsWith(`${slug}-`) && /^\d+\.webp$/.test(file.slice(slug.length + 1)))
    .sort((a, b) => Number(a.match(/-(\d+)\.webp$/)?.[1]) - Number(b.match(/-(\d+)\.webp$/)?.[1]));
}

async function main() {
  const catalogue = loadCatalogue();
  const problems: string[] = [];
  const slugs = new Set<string>();

  for (const product of catalogue) {
    if (slugs.has(product.slug)) problems.push(`duplicate slug: ${product.slug}`);
    slugs.add(product.slug);
    if (!product.price || product.price <= 0) problems.push(`missing price: ${product.name}`);
    if (imagesFor(product.slug).length === 0) problems.push(`no images: ${product.name}`);
  }
  if (problems.length > 0) {
    console.error("Refusing to import:\n - " + problems.join("\n - "));
    process.exit(1);
  }

  // 1. Remove placeholder products (docs/PLACEHOLDER_CLEANUP.md).
  const { error: cleanupError } = await supabase.from("products").delete().eq("is_placeholder", true);
  if (cleanupError) throw cleanupError;
  console.log("Placeholder products removed.");

  // 2. Upload images and upsert products.
  const now = Date.now();
  for (let index = 0; index < catalogue.length; index += 1) {
    const product = catalogue[index];
    const images: Array<{ url: string; publicId: string; alt: string }> = [];

    const files = imagesFor(product.slug);
    for (let imageIndex = 0; imageIndex < files.length; imageIndex += 1) {
      const file = files[imageIndex];
      const storagePath = `products/${file}`;
      const body = fs.readFileSync(path.join(processedDir, file));
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, body, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
      if (uploadError) throw new Error(`Upload failed for ${file}: ${uploadError.message}`);

      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      images.push({
        url: data.publicUrl,
        publicId: storagePath,
        alt: imageIndex === 0 ? `${product.name} worn on model` : `${product.name} — view ${imageIndex + 1}`
      });
    }

    const row = {
      ...productPayloadToSupabase({
        name: product.name,
        slug: product.slug,
        category: product.category,
        description: product.description,
        price: product.price,
        originalPrice: product.compareAtPrice,
        images,
        careInstructions: DEFAULT_CARE_INSTRUCTIONS,
        isFeatured: product.isFeatured,
        stockCount: product.stockCount,
        active: true,
        tags: product.tags,
        material: product.material,
        plating: product.plating,
        metalTone: product.metalTone,
        size: product.size,
        weightGrams: product.weightGrams,
        badges: product.badges,
        sortOrder: index,
        isPlaceholder: false
      }),
      // Newest-first listing follows the order the client's document uses.
      updated_at: new Date(now - index * 1000).toISOString()
    };

    const { error } = await supabase.from("products").upsert(row, { onConflict: "slug" });
    if (error) throw new Error(`Upsert failed for ${product.slug}: ${error.message}`);
    console.log(`  ✓ ${product.name} (${images.length} image${images.length === 1 ? "" : "s"})`);
  }

  // 3. Keep the live homepage settings in step with lib/content/home.ts.
  const heroSlides = HOME_HERO_SLIDES.map((slide) => ({
    image: slide.image,
    title: slide.headline,
    subtitle: slide.subtitle,
    ctaText: slide.ctaText,
    ctaLink: slide.ctaLink
  }));
  const mobileHeroSlides = HOME_HERO_SLIDES.map((slide) => ({
    image: slide.mobileImage ?? slide.image,
    title: slide.headline,
    subtitle: slide.subtitle,
    ctaText: slide.ctaText,
    ctaLink: slide.ctaLink
  }));
  const { error: settingsError } = await supabase.from("settings").upsert(
    {
      id: "00000000-0000-0000-0000-000000000001",
      hero_slides: heroSlides,
      mobile_hero_slides: mobileHeroSlides,
      announcement_text: MARQUEE_TICKER_TEXT,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );
  if (settingsError) throw settingsError;

  const { count } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("active", true);
  console.log(`Done. ${catalogue.length} products in the document, ${count} active products live.`);
}

main().catch((error) => {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
