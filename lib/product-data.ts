export type CategoryDetail = {
  name: string;
  slug: string;
  icon: string;
  description: string;
  sortOrder: number;
  image: string;
};

// Single source of truth for the 5 jewellery categories: name, slug (used
// in /shop?category=<slug> URLs and the categories DB table), a 12-18 word
// description, display order, and the placeholder product image.
export const CATEGORY_DETAILS: CategoryDetail[] = [
  {
    name: "Rings",
    slug: "rings",
    icon: "💍",
    description:
      "Everyday bands and statement rings crafted in gold-toned finishes for comfortable, all-day wear.",
    sortOrder: 0,
    image: "/categories/rings.jpg"
  },
  {
    name: "Necklaces",
    slug: "necklaces",
    icon: "📿",
    description:
      "Pearl, charm, and chain necklaces to wear alone or layer, finished for everyday shine and lasting quality.",
    sortOrder: 1,
    image: "/categories/necklaces.jpg"
  },
  {
    name: "Earrings",
    slug: "earrings",
    icon: "✨",
    description:
      "Studs, hoops, and drops light enough for daily wear and easy to match with any outfit.",
    sortOrder: 2,
    image: "/categories/earrings.jpg"
  },
  {
    name: "Bracelets",
    slug: "bracelets",
    icon: "⛓️",
    description:
      "Everyday chain bracelets and charm styles, light and durable enough to wear through daily routines.",
    sortOrder: 3,
    image: "/categories/bracelets.jpg"
  },
  {
    name: "Anklets",
    slug: "anklets",
    icon: "🦶",
    description:
      "Delicate anklets with fine chains and subtle charms, designed for everyday wear and gentle movement.",
    sortOrder: 4,
    image: "/categories/anklets.jpg"
  }
];

export const PRODUCT_CATEGORIES = CATEGORY_DETAILS.map((category) => category.name) as [string, ...string[]];

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export function getCategoryBySlug(slug: string) {
  return CATEGORY_DETAILS.find((category) => category.slug.toLowerCase() === slug.toLowerCase());
}

export function getCategoryByName(name: string) {
  return CATEGORY_DETAILS.find((category) => category.name.toLowerCase() === name.toLowerCase());
}

export function slugifyCategoryName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const METAL_TONES = ["gold", "silver", "rose-gold"] as const;
export type MetalTone = (typeof METAL_TONES)[number];

export const PRODUCT_BADGES = ["Bestseller", "New", "Back in Stock"] as const;
export type ProductBadge = (typeof PRODUCT_BADGES)[number];

export type StoreProduct = {
  _id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  subcategory?: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: Array<{
    url: string;
    publicId?: string;
    alt?: string;
  }>;
  dimensions?: string;
  careInstructions?: string;
  shippingInfo?: string;
  isFeatured: boolean;
  featured?: boolean;
  active?: boolean;
  inStock: boolean;
  stockCount: number;
  tags: string[];
  rating: {
    average: number;
    count: number;
  };
  createdAt: string;
  variants?: string[];
  popularScore?: number;
  // Jewellery-specific attributes (nullable — a product may not set all of these).
  material?: string;
  plating?: string;
  metalTone?: MetalTone;
  size?: string;
  weightGrams?: number;
  isWaterproof?: boolean;
  isAntiTarnish?: boolean;
  stackWith?: string[];
  badges?: ProductBadge[];
  sortOrder?: number;
  isPlaceholder?: boolean;
};

// Shared care copy used across every product — a single source of truth
// rather than duplicated JSX/text per item. Stored on each product's own
// `careInstructions` field at seed/save time, but defined once here.
export const DEFAULT_CARE_INSTRUCTIONS =
  "All Amanat House jewellery is crafted from premium 316L stainless steel — tarnish-resistant, hypoallergenic, and water-friendly. To keep your piece shining, simply clean it with mild soap and water.";

const METAL_TONE_LABELS: Record<MetalTone, string> = {
  gold: "Gold",
  silver: "Silver",
  "rose-gold": "Rose Gold"
};

// The one reusable "materials & specs" block — derives its bullet list from
// each product's own structured fields (material/plating/metalTone/size/
// weightGrams/isWaterproof/isAntiTarnish) plus the properties that are true
// of every piece in this catalogue (hypoallergenic 316L steel), so nothing
// here is hardcoded per-product JSX — it's one function fed by data.
export function getMaterialSpecs(
  product: Pick<StoreProduct, "material" | "plating" | "metalTone" | "size" | "weightGrams" | "isWaterproof" | "isAntiTarnish">
): string[] {
  const specs: string[] = [];
  specs.push(product.material || "316L Stainless Steel");
  specs.push(product.plating || "18K PVD Gold Plating");
  if (product.metalTone) specs.push(`${METAL_TONE_LABELS[product.metalTone]} tone`);
  specs.push("Hypoallergenic — safe for sensitive skin");
  if (product.isWaterproof !== false) specs.push("Waterproof — safe for daily wear, swimming, and showering");
  if (product.isAntiTarnish !== false) specs.push("Anti-tarnish finish");
  if (product.size) specs.push(`Size: ${product.size}`);
  if (product.weightGrams) specs.push(`Weight: ${product.weightGrams}g`);
  return specs;
}

export function slugifyProductName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStableRatingSeed(value: string) {
  return Array.from(value).reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) % 9973;
  }, 17);
}

export function getDisplayRating(product: Pick<StoreProduct, "slug" | "name" | "_id">) {
  const seed = getStableRatingSeed(product.slug || product.name || product._id);
  return Number((4.5 + (seed % 6) / 10).toFixed(1));
}

// Only used when Supabase is not configured (local dev without credentials).
// The live catalogue lives in the database — see scripts/import-catalogue.ts.
export const fallbackProducts: StoreProduct[] = [];

export function normalizeProduct(product: Record<string, unknown>): StoreProduct {
  const name = String(product.name ?? "Untitled Product");
  const slug = String(product.slug ?? slugifyProductName(name));
  const isFeatured = Boolean(product.isFeatured ?? product.featured);
  const _id = String(product._id ?? product.id ?? slug);
  const ratingAverage = getDisplayRating({ _id, name, slug });

  return {
    _id,
    name,
    slug,
    category: (product.category as ProductCategory) ?? "Rings",
    subcategory: product.subcategory ? String(product.subcategory) : undefined,
    description: String(product.description ?? ""),
    price: Number(product.price ?? 0),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
    images: Array.isArray(product.images) ? (product.images as StoreProduct["images"]) : [],
    dimensions: product.dimensions ? String(product.dimensions) : undefined,
    careInstructions: product.careInstructions ? String(product.careInstructions) : undefined,
    shippingInfo: product.shippingInfo ? String(product.shippingInfo) : undefined,
    isFeatured,
    featured: isFeatured,
    active: product.active === undefined ? true : Boolean(product.active),
    inStock:
      Number(product.stockCount ?? product.inventory ?? 0) > 0 &&
      (product.inStock === undefined ? true : Boolean(product.inStock)),
    stockCount: Number(product.stockCount ?? product.inventory ?? 0),
    tags: Array.isArray(product.tags) ? (product.tags as string[]) : [],
    rating: { average: ratingAverage, count: 0 },
    createdAt: product.createdAt ? String(product.createdAt) : new Date().toISOString(),
    variants: Array.isArray(product.variants) ? (product.variants as string[]) : undefined,
    popularScore: Number(product.popularScore ?? 0),
    material: product.material ? String(product.material) : undefined,
    plating: product.plating ? String(product.plating) : undefined,
    metalTone: (METAL_TONES as readonly string[]).includes(product.metalTone as string)
      ? (product.metalTone as MetalTone)
      : undefined,
    size: product.size ? String(product.size) : undefined,
    weightGrams: product.weightGrams !== undefined && product.weightGrams !== null ? Number(product.weightGrams) : undefined,
    isWaterproof: product.isWaterproof === undefined ? true : Boolean(product.isWaterproof),
    isAntiTarnish: product.isAntiTarnish === undefined ? true : Boolean(product.isAntiTarnish),
    stackWith: Array.isArray(product.stackWith) ? (product.stackWith as string[]) : [],
    badges: Array.isArray(product.badges)
      ? (product.badges as string[]).filter((badge): badge is ProductBadge =>
          (PRODUCT_BADGES as readonly string[]).includes(badge)
        )
      : [],
    sortOrder: Number(product.sortOrder ?? 0),
    isPlaceholder: Boolean(product.isPlaceholder)
  };
}

export function filterFallbackProducts({
  category,
  subcategory,
  exclude,
  featured,
  maxPrice,
  query
}: {
  category?: string | null;
  subcategory?: string | null;
  exclude?: string | null;
  featured?: boolean;
  maxPrice?: number;
  query?: string | null;
}) {
  const normalizedQuery = query?.toLowerCase().trim();

  return fallbackProducts.filter((product) => {
    if (featured && !product.isFeatured) return false;
    if (category && product.category !== category) return false;
    if (subcategory && product.subcategory !== subcategory) return false;
    if (maxPrice && product.price > maxPrice) return false;
    if (exclude && (product._id === exclude || product.slug === exclude)) return false;

    if (normalizedQuery) {
      const haystack = [product.name, product.category, product.description, product.tags.join(" ")]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(normalizedQuery)) return false;
    }

    return true;
  }).map((product) => normalizeProduct(product as unknown as Record<string, unknown>));
}
