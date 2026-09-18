// Re-runnable seed: upserts ~35 placeholder products (3-4 per category) so
// the storefront has something realistic to browse before the client has
// real photography and copy. Every row is marked is_placeholder = true —
// see docs/PLACEHOLDER_CLEANUP.md for the one-line query that removes them
// all once real products are ready.
//
// Usage: npm run seed:products
import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { DEFAULT_CARE_INSTRUCTIONS, slugifyProductName } from "../lib/product-data";

loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const PLACEHOLDER_IMAGE = "/placeholder-product.png";

type MetalTone = "gold" | "silver" | "rose-gold";
type Badge = "Bestseller" | "New" | "Back in Stock";

type SeedProduct = {
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  description: string;
  metalTone: MetalTone;
  size?: string;
  weightGrams: number;
  stockCount: number;
  badges?: Badge[];
  isFeatured?: boolean;
};

function images(name: string) {
  return [
    { url: PLACEHOLDER_IMAGE, alt: `${name} — front view` },
    { url: PLACEHOLDER_IMAGE, alt: `${name} — detail view` },
    { url: PLACEHOLDER_IMAGE, alt: `${name} — styled` }
  ];
}

const PRODUCTS: SeedProduct[] = [
  // Rings (4)
  {
    name: "Classic Gold Band Ring",
    category: "Rings",
    price: 899,
    description:
      "A clean, everyday band with a polished gold finish that pairs easily with anything else on your hand. Comfortable enough to wear day and night without a second thought. A quiet staple you'll reach for on repeat.",
    metalTone: "gold",
    size: "Adjustable (6-9)",
    weightGrams: 3.2,
    stockCount: 24,
    badges: ["Bestseller"],
    isFeatured: true
  },
  {
    name: "Emerald Cut Statement Ring",
    category: "Rings",
    price: 1499,
    originalPrice: 1899,
    description:
      "A faceted emerald-cut centre stone set in a sleek gold-toned band for evenings that call for a little more sparkle. Substantial without being heavy, and finished to catch the light from every angle.",
    metalTone: "gold",
    size: "7",
    weightGrams: 4.1,
    stockCount: 12
  },
  {
    name: "Silver Minimalist Ring",
    category: "Rings",
    price: 599,
    description:
      "A slim, understated silver-toned ring designed to sit quietly on its own or stack alongside others. Light on the hand and easy to wear from your first coffee to your last errand of the day.",
    metalTone: "silver",
    size: "Adjustable",
    weightGrams: 2.5,
    stockCount: 30,
    badges: ["New"]
  },
  {
    name: "Rose Gold Twist Ring",
    category: "Rings",
    price: 799,
    description:
      "A softly twisted band in warm rose gold that adds movement without shouting for attention. Finished smooth on the inside for all-day comfort, this is the ring you forget you're wearing — in the best way.",
    metalTone: "rose-gold",
    size: "8",
    weightGrams: 3.0,
    stockCount: 18
  },

  // Stackable Ring Sets (3)
  {
    name: "Layered Bands Stack Set",
    category: "Stackable Ring Sets",
    price: 1299,
    originalPrice: 1599,
    description:
      "Three slim gold-toned bands in slightly different widths, designed to be worn together or split across fingers. Mix, match, and rearrange them as your mood changes — that's the whole point of a stack.",
    metalTone: "gold",
    size: "Set of 3, Adjustable",
    weightGrams: 6.0,
    stockCount: 15,
    badges: ["Bestseller"],
    isFeatured: true
  },
  {
    name: "Textured Trio Ring Set",
    category: "Stackable Ring Sets",
    price: 1099,
    description:
      "A set of three silver-toned rings, each with a subtly different texture — hammered, ridged, and smooth — so no two stacks ever look quite the same. Built to layer effortlessly with pieces you already own.",
    metalTone: "silver",
    size: "Adjustable",
    weightGrams: 5.4,
    stockCount: 20
  },
  {
    name: "Rose Gold Stacking Set",
    category: "Stackable Ring Sets",
    price: 1399,
    description:
      "Three warm rose gold bands with a gentle taper, made to stack close together for a fuller look on one finger or spread across several. A soft, romantic set that still holds its own on a busy day.",
    metalTone: "rose-gold",
    size: "Adjustable",
    weightGrams: 5.8,
    stockCount: 10,
    badges: ["Bestseller"]
  },

  // Studs (4)
  {
    name: "Classic Gold Studs",
    category: "Studs",
    price: 499,
    description:
      "Simple, round gold-toned studs that work for every day, not just special occasions. Small enough to layer with a second piercing, secure enough to wear and forget.",
    metalTone: "gold",
    weightGrams: 1.8,
    stockCount: 40,
    badges: ["Bestseller"],
    isFeatured: true
  },
  {
    name: "Pearl Solitaire Studs",
    category: "Studs",
    price: 699,
    originalPrice: 899,
    description:
      "A single lustrous pearl set in a silver-toned mount for a classic, quietly elegant finish. Dresses up a plain outfit in seconds without ever feeling fussy.",
    metalTone: "silver",
    weightGrams: 2.0,
    stockCount: 22
  },
  {
    name: "Cubic Zirconia Studs",
    category: "Studs",
    price: 799,
    description:
      "Brilliant-cut cubic zirconia stones in a gold-toned setting that catch the light like the real thing. A small daily indulgence that photographs beautifully.",
    metalTone: "gold",
    weightGrams: 1.9,
    stockCount: 16,
    badges: ["New"]
  },
  {
    name: "Rose Gold Dot Studs",
    category: "Studs",
    price: 399,
    description:
      "Tiny polished dots in warm rose gold, sized to sit close to the ear for a subtle everyday finish. An easy first pair for a new piercing or a reliable backup for busy mornings.",
    metalTone: "rose-gold",
    weightGrams: 1.5,
    stockCount: 35
  },

  // Hoops & Danglers (3)
  {
    name: "Classic Gold Hoops",
    category: "Hoops & Danglers",
    price: 899,
    description:
      "Medium-sized gold-toned hoops with a secure hinged back, light enough to wear from morning meetings to dinner plans. A wardrobe staple that never quite goes out of style.",
    metalTone: "gold",
    weightGrams: 4.5,
    stockCount: 20,
    badges: ["Bestseller"],
    isFeatured: true
  },
  {
    name: "Beaded Danglers",
    category: "Hoops & Danglers",
    price: 1099,
    originalPrice: 1399,
    description:
      "Delicate gold-toned chains finished with small beaded drops that sway with movement. Festive enough for celebrations, light enough that you'll forget you have them on.",
    metalTone: "gold",
    weightGrams: 5.2,
    stockCount: 14
  },
  {
    name: "Silver Chain Danglers",
    category: "Hoops & Danglers",
    price: 949,
    description:
      "Fine silver-toned chain danglers with a soft, fluid movement that catches the light as you move. A modern update on a classic silhouette.",
    metalTone: "silver",
    weightGrams: 4.8,
    stockCount: 11,
    badges: ["Back in Stock"]
  },

  // Necklaces (4)
  {
    name: "Layered Gold Chain Necklace",
    category: "Necklaces",
    price: 1599,
    originalPrice: 1899,
    description:
      "Two gold-toned chains of different lengths, pre-layered so you get the stacked look without the tangle. Sits close to the collarbone for a clean, polished finish on any neckline.",
    metalTone: "gold",
    size: "16in + 18in",
    weightGrams: 8.5,
    stockCount: 18,
    badges: ["Bestseller"],
    isFeatured: true
  },
  {
    name: "Delicate Pearl Necklace",
    category: "Necklaces",
    price: 1299,
    description:
      "A single freshwater-style pearl suspended on a fine silver-toned chain for a look that's classic without trying too hard. Easy to dress up or wear with a plain white shirt.",
    metalTone: "silver",
    size: "18in",
    weightGrams: 6.0,
    stockCount: 15
  },
  {
    name: "Rose Gold Choker",
    category: "Necklaces",
    price: 1199,
    description:
      "A close-fitting rose gold chain choker that sits neatly at the base of the neck. Pairs well with both high necklines and off-shoulder pieces for an instantly finished look.",
    metalTone: "rose-gold",
    size: "14in",
    weightGrams: 7.2,
    stockCount: 9,
    badges: ["New"]
  },
  {
    name: "Classic Herringbone Necklace",
    category: "Necklaces",
    price: 1899,
    description:
      "A flat, woven herringbone chain in a warm gold tone that lies smooth and flush against the skin. Substantial enough to wear on its own as a statement piece.",
    metalTone: "gold",
    size: "20in",
    weightGrams: 9.8,
    stockCount: 13
  },

  // Pendants & Charms (3)
  {
    name: "Om Pendant with Chain",
    category: "Pendants & Charms",
    price: 799,
    description:
      "A dainty Om pendant in a soft gold tone, hung on a fine chain for everyday meaning without extra weight. A thoughtful gift for yourself or someone starting a new chapter.",
    metalTone: "gold",
    size: "18in chain",
    weightGrams: 3.5,
    stockCount: 17
  },
  {
    name: "Initial Letter Charm Pendant",
    category: "Pendants & Charms",
    price: 649,
    description:
      "A single polished initial in warm rose gold, worn close on a delicate chain. Simple, personal, and easy to layer with other necklaces you already wear.",
    metalTone: "rose-gold",
    size: "16in chain",
    weightGrams: 2.8,
    stockCount: 25,
    badges: ["Bestseller"],
    isFeatured: true
  },
  {
    name: "Evil Eye Pendant",
    category: "Pendants & Charms",
    price: 599,
    description:
      "A classic protective symbol rendered in enamel and silver tone, small enough for daily wear. A popular pick for gifting and layering alike.",
    metalTone: "silver",
    size: "18in chain",
    weightGrams: 2.5,
    stockCount: 21
  },

  // Bracelets (4)
  {
    name: "Classic Chain Bracelet",
    category: "Bracelets",
    price: 799,
    description:
      "A simple gold-toned link bracelet that sits comfortably on the wrist without catching on sleeves. An easy everyday layer for stacking with a watch or other bracelets.",
    metalTone: "gold",
    weightGrams: 5.0,
    stockCount: 22,
    badges: ["Bestseller"],
    isFeatured: true
  },
  {
    name: "Charm Link Bracelet",
    category: "Bracelets",
    price: 999,
    originalPrice: 1249,
    description:
      "A rose gold-toned link chain finished with a few small charms for a personal touch. Adjustable enough to fit comfortably through the day.",
    metalTone: "rose-gold",
    weightGrams: 6.2,
    stockCount: 14
  },
  {
    name: "Beaded Stretch Bracelet",
    category: "Bracelets",
    price: 499,
    description:
      "A stretch bracelet strung with small silver-toned beads, easy to pull on and layer without a clasp to fuss with. A comfortable everyday basic.",
    metalTone: "silver",
    weightGrams: 3.8,
    stockCount: 30,
    badges: ["New"]
  },
  {
    name: "Cuff Bangle Bracelet",
    category: "Bracelets",
    price: 1199,
    description:
      "An open gold-toned cuff with a smooth, structured finish that slips on without a clasp. Substantial enough to wear alone as a statement piece.",
    metalTone: "gold",
    weightGrams: 8.0,
    stockCount: 10
  },

  // Anklets (3)
  {
    name: "Delicate Chain Anklet",
    category: "Anklets",
    price: 499,
    description:
      "A fine silver-toned chain anklet with a small clasp charm, light enough to wear barefoot or with sandals. An easy everyday piece for warmer days.",
    metalTone: "silver",
    size: "9-10in",
    weightGrams: 2.2,
    stockCount: 26,
    badges: ["Bestseller"]
  },
  {
    name: "Beaded Charm Anklet",
    category: "Anklets",
    price: 599,
    description:
      "A gold-toned anklet finished with small beads and a single charm that catches the light with every step. Adjustable for a comfortable, secure fit.",
    metalTone: "gold",
    size: "9-10in",
    weightGrams: 2.6,
    stockCount: 19
  },
  {
    name: "Rose Gold Layered Anklet",
    category: "Anklets",
    price: 699,
    originalPrice: 849,
    description:
      "Two fine rose gold chains layered on one anklet for a fuller look without added bulk. A pretty, low-maintenance finishing touch.",
    metalTone: "rose-gold",
    size: "9-11in",
    weightGrams: 3.0,
    stockCount: 12
  },

  // Chains (3)
  {
    name: "Solid Gold Link Chain",
    category: "Chains",
    price: 1699,
    description:
      "A substantial gold-toned link chain designed to be worn alone or as the base for your favourite pendant. Solidly made, with a lobster clasp that holds securely through the day.",
    metalTone: "gold",
    size: "20in",
    weightGrams: 10.5,
    stockCount: 11,
    badges: ["Bestseller"],
    isFeatured: true
  },
  {
    name: "Silver Box Chain",
    category: "Chains",
    price: 999,
    description:
      "A classic box-link chain in a bright silver tone, thin enough to layer or wear on its own with a pendant. Simple, versatile, and built to last.",
    metalTone: "silver",
    size: "18in",
    weightGrams: 7.0,
    stockCount: 17
  },
  {
    name: "Rose Gold Twist Chain",
    category: "Chains",
    price: 1399,
    description:
      "A tightly twisted link chain in warm rose gold that adds texture without extra ornamentation. Pairs beautifully with a single pendant or wears well solo.",
    metalTone: "rose-gold",
    size: "20in",
    weightGrams: 9.2,
    stockCount: 8,
    badges: ["Back in Stock"]
  },

  // Gift Sets (4)
  {
    name: "Bridal Jewellery Set",
    category: "Gift Sets",
    price: 2499,
    originalPrice: 2999,
    description:
      "A complete matching set with a statement necklace and coordinating earrings, boxed and ready for the big day. Designed to photograph beautifully and hold up through a full day of celebrations.",
    metalTone: "gold",
    size: "Necklace 16in + Earrings",
    weightGrams: 22,
    stockCount: 6,
    badges: ["Bestseller"],
    isFeatured: true
  },
  {
    name: "Everyday Essentials Set",
    category: "Gift Sets",
    price: 1499,
    description:
      "A matching necklace, stud earrings, and bracelet in a soft silver tone, boxed together for an easy gift or a complete everyday look in one order.",
    metalTone: "silver",
    size: "Necklace + Studs + Bracelet",
    weightGrams: 15,
    stockCount: 13
  },
  {
    name: "Festive Gold Set",
    category: "Gift Sets",
    price: 1999,
    originalPrice: 2399,
    description:
      "A coordinated necklace and earring set in a warm gold tone, made for festive occasions and family celebrations. Comes boxed and ready to gift.",
    metalTone: "gold",
    size: "Necklace + Earrings",
    weightGrams: 18,
    stockCount: 9,
    badges: ["New"]
  },
  {
    name: "Rose Gold Duo Set",
    category: "Gift Sets",
    price: 1299,
    description:
      "A matching bracelet and ring in rose gold, boxed as a small, thoughtful gift set for birthdays or just because. Each piece also wears well on its own.",
    metalTone: "rose-gold",
    size: "Bracelet + Ring",
    weightGrams: 10,
    stockCount: 16
  }
];

async function main() {
  const rows = PRODUCTS.map((product) => {
    const slug = slugifyProductName(product.name);
    return {
      name: product.name,
      slug,
      category: product.category,
      subcategory: "",
      description: product.description,
      price: product.price,
      original_price: product.originalPrice ?? null,
      images: images(product.name),
      dimensions: product.size ?? "",
      care_instructions: DEFAULT_CARE_INSTRUCTIONS,
      shipping_info: "Ships in 3-5 business days with secure, gift-ready packaging.",
      is_featured: Boolean(product.isFeatured),
      featured: Boolean(product.isFeatured),
      in_stock: product.stockCount > 0,
      stock_count: product.stockCount,
      inventory: product.stockCount,
      active: true,
      tags: [product.category.toLowerCase(), product.metalTone, "placeholder"],
      material: "316L Stainless Steel",
      plating: "18K PVD Gold",
      metal_tone: product.metalTone,
      size: product.size ?? null,
      weight_grams: product.weightGrams,
      is_waterproof: true,
      is_anti_tarnish: true,
      stack_with: [],
      badges: product.badges ?? [],
      sort_order: 0,
      is_placeholder: true,
      updated_at: new Date().toISOString()
    };
  });

  console.log(`Upserting ${rows.length} placeholder products...`);
  const { error } = await supabase.from("products").upsert(rows, { onConflict: "slug" });
  if (error) throw error;

  console.log(`Done. Seeded ${rows.length} placeholder products across ${new Set(PRODUCTS.map((p) => p.category)).size} categories.`);
}

main().catch((error) => {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
