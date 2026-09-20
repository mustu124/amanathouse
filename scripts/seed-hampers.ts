// Seeds two placeholder hampers (is_placeholder = true) from products that
// already exist in the database. Idempotent: matched on slug, eligible
// products are replaced each run. Requires migration 0003_hampers.sql.
//
//   python scripts/... (not needed) -> ivory placeholder heroes live in
//   client-assets/hampers/<slug>.webp (1200x1500, 4:5)
//   npm run seed:hampers
import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import path from "node:path";

loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "amanat-house";

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

type SeedHamper = {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  pricingMode: "percentage" | "fixed";
  discountPercent: number | null;
  fixedPrice: number | null;
  packagingFee: number;
  minItems: number;
  maxItems: number | null;
  sortOrder: number;
  eligibleCount: number;
  requiredCount: number;
};

const HAMPERS: SeedHamper[] = [
  {
    slug: "the-everyday-edit",
    name: "The Everyday Edit",
    shortDescription: "Pick three or more favourites and take 15% off.",
    longDescription:
      "Build a set you will actually wear. Choose at least three pieces from our everyday edit - pearls, charms and chains - and 15% comes off the total automatically.",
    pricingMode: "percentage",
    discountPercent: 15,
    fixedPrice: null,
    packagingFee: 0,
    minItems: 3,
    maxItems: null,
    sortOrder: 0,
    eligibleCount: 8,
    requiredCount: 0
  },
  {
    slug: "the-gifting-box",
    name: "The Gifting Box",
    shortDescription: "Two to four pieces, one flat price of ₹1,499.",
    longDescription:
      "A ready-to-gift box with a signature piece already inside. Add one to three more from the edit - the price stays ₹1,499 however you build it.",
    pricingMode: "fixed",
    discountPercent: null,
    fixedPrice: 1499,
    packagingFee: 0,
    minItems: 2,
    maxItems: 4,
    sortOrder: 1,
    eligibleCount: 6,
    requiredCount: 1
  }
];

async function main() {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, price")
    .eq("active", true)
    .order("name", { ascending: true })
    .limit(60);
  if (error) throw error;
  if (!products || products.length < 6) throw new Error("Need at least 6 active products to seed hampers.");

  for (const hamper of HAMPERS) {
    const heroFile = path.join(process.cwd(), "client-assets", "hampers", `${hamper.slug}.webp`);
    let heroUrl = "";
    if (fs.existsSync(heroFile)) {
      const storagePath = `hampers/${hamper.slug}.webp`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, fs.readFileSync(heroFile), { contentType: "image/webp", upsert: true });
      if (uploadError) throw uploadError;
      heroUrl = supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
    }

    const row = {
      name: hamper.name,
      slug: hamper.slug,
      short_description: hamper.shortDescription,
      long_description: hamper.longDescription,
      hero_image_url: heroUrl,
      gallery_image_urls: [] as string[],
      pricing_mode: hamper.pricingMode,
      discount_percent: hamper.discountPercent,
      fixed_price: hamper.fixedPrice,
      packaging_fee: hamper.packagingFee,
      min_items: hamper.minItems,
      max_items: hamper.maxItems,
      is_active: true,
      is_placeholder: true,
      sort_order: hamper.sortOrder,
      updated_at: new Date().toISOString()
    };
    const { data: saved, error: saveError } = await supabase.from("hampers").upsert(row, { onConflict: "slug" }).select("id").single();
    if (saveError || !saved) throw saveError ?? new Error("Hamper save failed");

    // Spread the eligible list across the price range rather than taking the first N names.
    const byPrice = [...products].sort((a, b) => Number(a.price) - Number(b.price));
    const step = Math.max(Math.floor(byPrice.length / hamper.eligibleCount), 1);
    const eligible = Array.from({ length: hamper.eligibleCount }, (_, index) => byPrice[Math.min(index * step, byPrice.length - 1)]);
    const unique = Array.from(new Map(eligible.map((product) => [product.id, product])).values());

    await supabase.from("hamper_products").delete().eq("hamper_id", saved.id);
    const { error: linkError } = await supabase.from("hamper_products").insert(
      unique.map((product, index) => ({
        hamper_id: saved.id,
        product_id: product.id,
        sort_order: index,
        is_required: index < hamper.requiredCount
      }))
    );
    if (linkError) throw linkError;
    console.log(`Seeded ${hamper.name}: ${unique.length} eligible products, ${hamper.requiredCount} required.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
