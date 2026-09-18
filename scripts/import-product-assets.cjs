const fs = require("fs");
const path = require("path");
const { loadEnvConfig } = require("@next/env");
const { createClient } = require("@supabase/supabase-js");

loadEnvConfig(process.cwd());

const PRODUCT_CATEGORIES = [
  "Rings",
  "Necklaces",
  "Earrings",
  "Bracelets",
  "Bangles",
  "Anklets",
  "Pendants",
  "Mangalsutra",
  "Nose Pins",
  "Jewellery Sets"
];

const mimeTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

function withTimeout(promise, ms, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromFile(fileName, index) {
  const cleaned = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/whatsapp image \d{4}-\d{2}-\d{2} at/gi, "Amanat House")
    .replace(/\(\d+\)/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.length < 4) return `Amanat House Jewellery Piece ${String(index + 1).padStart(2, "0")}`;
  return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function main() {
  const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "amanat-house";
  const sourceDir =
    process.argv[2] ||
    path.join(process.cwd(), "Amanat House Jewellery Photos for Website");

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Product photos folder not found: ${sourceDir}`);
  }

  const files = fs
    .readdirSync(sourceDir)
    .filter((file) => mimeTypes[path.extname(file).toLowerCase()])
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (!files.length) {
    throw new Error(`No supported images found in ${sourceDir}`);
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let imported = 0;
  const importedImages = [];

  for (const [index, fileName] of files.entries()) {
    const localPath = path.join(sourceDir, fileName);
    const ext = path.extname(fileName).toLowerCase();
    const name = titleFromFile(fileName, index);
    const slug = slugify(name || `amanat-house-piece-${index + 1}`);
    const category = PRODUCT_CATEGORIES[index % PRODUCT_CATEGORIES.length];
    const price = 799 + (index % 8) * 250;
    const storagePath = `products/${slug}${ext}`;
    const buffer = fs.readFileSync(localPath);

    console.log(`Uploading ${index + 1}/${files.length}: ${name}`);
    const { error: uploadError } = await withTimeout(
      supabase.storage.from(bucket).upload(storagePath, buffer, {
        contentType: mimeTypes[ext],
        upsert: true
      }),
      45000,
      `Upload ${fileName}`
    );

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    const image = {
      url: publicUrlData.publicUrl,
      publicId: storagePath,
      alt: name
    };
    importedImages.push({ image, name, category });

    const productPayload = {
      name,
      slug,
      category,
      subcategory: "",
      description: "A handcrafted Amanat House jewellery piece made with quality materials and lasting finish.",
      price,
      original_price: price + 400,
      images: [image],
      dimensions: "Custom sizing available. Contact us for exact measurements.",
      care_instructions: "Avoid contact with perfume, water, and lotions. Store in a dry, lined pouch.",
      shipping_info: "All over India shipping is available.",
      is_featured: index < 8,
      featured: index < 8,
      in_stock: true,
      stock_count: 10,
      inventory: 10,
      active: true,
      tags: ["amanat-house", "jewellery", "handcrafted", category],
      rating: { average: 4.8, count: 12 },
      variants: []
    };

    const { error: productError } = await withTimeout(
      supabase.from("products").upsert(productPayload, { onConflict: "slug" }),
      30000,
      `Product upsert ${slug}`
    );
    if (productError) throw productError;

    const galleryPayload = {
      url: image.url,
      thumbnail_url: image.url,
      public_id: storagePath,
      type: "image",
      caption: name,
      category,
      order_index: index,
      featured: index < 12
    };

    const { error: galleryError } = await withTimeout(
      supabase.from("gallery").upsert(galleryPayload, { onConflict: "public_id" }),
      30000,
      `Gallery upsert ${storagePath}`
    );
    if (galleryError) throw galleryError;

    imported += 1;
    console.log(`Imported ${imported}/${files.length}: ${name}`);
  }

  const heroSlides = importedImages.slice(0, 5).map(({ image, name }) => ({
    image: image.url,
    title: name,
    subtitle: "Handcrafted gold and bridal jewellery for life's most cherished moments.",
    ctaText: "Shop Now",
    ctaLink: "/shop"
  }));
  const mobileHeroSlides = importedImages.slice(0, 10).map(({ image, name }) => ({
    image: image.url,
    title: name,
    subtitle: "Timeless jewellery, made to treasure.",
    ctaText: "Shop Now",
    ctaLink: "/shop"
  }));

  if (heroSlides.length) {
    const settingsPayload = {
      hero_slides: heroSlides,
      mobile_hero_slides: mobileHeroSlides,
      announcement_text:
        "Free shipping on orders over ₹999 · Certified hallmark jewellery · Handcrafted with love · New arrivals every week",
      whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
      social_links: { instagram: "", facebook: "" },
      about_text: "Amanat House creates timeless gold and bridal jewellery for life's most cherished moments.",
      meta_title: "Amanat House | Timeless Jewellery, Made to Treasure",
      meta_description:
        "Shop fine gold, bridal, and everyday jewellery from Amanat House.",
      footer_copyright: "© 2025 Amanat House"
    };

    const { data: existingSettings, error: settingsLookupError } = await supabase
      .from("settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (settingsLookupError) throw settingsLookupError;

    const settingsRequest = existingSettings
      ? supabase.from("settings").update(settingsPayload).eq("id", existingSettings.id)
      : supabase.from("settings").insert(settingsPayload);

    const { error: settingsError } = await settingsRequest;
    if (settingsError) throw settingsError;
  }

  console.log(`Done. Imported ${imported} images into Supabase Storage, products, and gallery.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
