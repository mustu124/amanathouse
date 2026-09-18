export type CategoryDetail = {
  name: string;
  slug: string;
  icon: string;
  description: string;
  sortOrder: number;
  image: string;
};

// Single source of truth for the 10 jewellery categories: name, slug (used
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
    name: "Stackable Ring Sets",
    slug: "stackable-ring-sets",
    icon: "💫",
    description:
      "Curated ring sets designed to layer together, mixing textures and widths for an effortless, personalized stacked look.",
    sortOrder: 1,
    image: "/categories/stackable-ring-sets.jpg"
  },
  {
    name: "Studs",
    slug: "studs",
    icon: "✨",
    description:
      "Classic stud earrings in gold and gemstone finishes, light enough for daily wear and easy to match.",
    sortOrder: 2,
    image: "/categories/studs.jpg"
  },
  {
    name: "Hoops & Danglers",
    slug: "hoops-and-danglers",
    icon: "⭕",
    description:
      "Statement hoops and drop earrings that move with you, from subtle everyday hoops to festive danglers.",
    sortOrder: 3,
    image: "/categories/hoops-and-danglers.jpg"
  },
  {
    name: "Necklaces",
    slug: "necklaces",
    icon: "📿",
    description:
      "Chains and statement necklaces to layer or wear alone, finished for everyday shine and lasting quality.",
    sortOrder: 4,
    image: "/categories/necklaces.jpg"
  },
  {
    name: "Pendants & Charms",
    slug: "pendants-and-charms",
    icon: "🔶",
    description:
      "Meaningful pendants and charms to wear close, from minimal symbols to personalized keepsakes for gifting.",
    sortOrder: 5,
    image: "/categories/pendants-and-charms.jpg"
  },
  {
    name: "Bracelets",
    slug: "bracelets",
    icon: "⛓️",
    description:
      "Everyday chain bracelets and charm styles, light and durable enough to wear through daily routines.",
    sortOrder: 6,
    image: "/categories/bracelets.jpg"
  },
  {
    name: "Anklets",
    slug: "anklets",
    icon: "🦶",
    description:
      "Delicate anklets with fine chains and subtle charms, designed for everyday wear and gentle movement.",
    sortOrder: 7,
    image: "/categories/anklets.jpg"
  },
  {
    name: "Chains",
    slug: "chains",
    icon: "🔗",
    description:
      "Solid gold-toned chains in classic link styles, worn alone or layered as a foundation piece.",
    sortOrder: 8,
    image: "/categories/chains.jpg"
  },
  {
    name: "Gift Sets",
    slug: "gift-sets",
    icon: "🎁",
    description:
      "Complete matching sets paired and boxed for gifting, ready for birthdays, weddings, and festive occasions.",
    sortOrder: 9,
    image: "/categories/gift-sets.jpg"
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
  "Keep dry and avoid contact with perfume, lotion, and sanitizer. Wipe gently with a soft, lint-free cloth after each wear. Store flat in the pouch provided, away from direct sunlight and other jewellery to prevent scratching.";

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

const placeholderImage = "/placeholder-product.png";

export const fallbackProducts: StoreProduct[] = [
  {
    _id: "sample-1",
    name: "Classic Gold Band Ring",
    slug: "classic-gold-band-ring",
    category: "Rings",
    description:
      "A slim, everyday gold band ring finished in 18K PVD gold over 316L stainless steel — anti-tarnish, waterproof, and built for daily wear.",
    price: 899,
    originalPrice: 1199,
    images: [
      { url: placeholderImage, alt: "Classic gold band ring" },
      { url: placeholderImage, alt: "Ring band detail" },
      { url: placeholderImage, alt: "Ring styled on hand" }
    ],
    careInstructions: DEFAULT_CARE_INSTRUCTIONS,
    shippingInfo: "Ships in 2-3 business days. Free shipping on orders above ₹999.",
    isFeatured: true,
    featured: true,
    inStock: true,
    stockCount: 12,
    tags: ["gold", "ring", "everyday", "gift"],
    rating: { average: 4.8, count: 42 },
    createdAt: "2026-05-20T10:00:00.000Z",
    variants: ["12", "14", "16", "18"],
    popularScore: 96,
    material: "316L Stainless Steel",
    plating: "18K PVD Gold",
    metalTone: "gold",
    isWaterproof: true,
    isAntiTarnish: true
  },
  {
    _id: "sample-2",
    name: "Layered Gold Chain Necklace",
    slug: "layered-gold-chain-necklace",
    category: "Necklaces",
    description:
      "A double-layered chain necklace that dresses up a plain outfit or layers beautifully with pendants. Anti-tarnish and waterproof for daily wear.",
    price: 1499,
    originalPrice: 1799,
    images: [
      { url: placeholderImage, alt: "Layered gold chain necklace" },
      { url: placeholderImage, alt: "Chain clasp detail" },
      { url: placeholderImage, alt: "Necklace styled on neckline" }
    ],
    careInstructions: DEFAULT_CARE_INSTRUCTIONS,
    shippingInfo: "Ships in 2-3 business days.",
    isFeatured: true,
    featured: true,
    inStock: true,
    stockCount: 8,
    tags: ["necklace", "gold", "layered", "gift"],
    rating: { average: 4.9, count: 31 },
    createdAt: "2026-05-18T10:00:00.000Z",
    variants: ["16 in", "18 in"],
    popularScore: 92,
    material: "316L Stainless Steel",
    plating: "18K PVD Gold",
    metalTone: "gold",
    isWaterproof: true,
    isAntiTarnish: true
  },
  {
    _id: "sample-3",
    name: "Everyday Stud Set",
    slug: "everyday-stud-set",
    category: "Studs",
    description:
      "A set of minimal studs finished in 18K PVD gold, light enough for daily wear and easy to match with anything.",
    price: 599,
    images: [
      { url: placeholderImage, alt: "Everyday stud set" },
      { url: placeholderImage, alt: "Stud setting detail" },
      { url: placeholderImage, alt: "Studs styled on ear" }
    ],
    careInstructions: DEFAULT_CARE_INSTRUCTIONS,
    shippingInfo: "Ships in 2-3 business days.",
    isFeatured: true,
    featured: true,
    inStock: true,
    stockCount: 20,
    tags: ["studs", "gold", "everyday"],
    rating: { average: 4.7, count: 58 },
    createdAt: "2026-05-17T10:00:00.000Z",
    variants: ["Gold", "Rose Gold"],
    popularScore: 88,
    material: "316L Stainless Steel",
    plating: "18K PVD Gold",
    metalTone: "gold",
    isWaterproof: true,
    isAntiTarnish: true
  },
  {
    _id: "sample-4",
    name: "Charm Link Bracelet",
    slug: "charm-link-bracelet",
    category: "Bracelets",
    description: "A gold-tone link bracelet with a delicate charm detail, light enough for daily wear.",
    price: 999,
    originalPrice: 1299,
    images: [
      { url: placeholderImage, alt: "Charm link bracelet" },
      { url: placeholderImage, alt: "Bracelet charm detail" },
      { url: placeholderImage, alt: "Bracelet styled on wrist" }
    ],
    careInstructions: DEFAULT_CARE_INSTRUCTIONS,
    shippingInfo: "Ships in 2-3 business days.",
    isFeatured: true,
    featured: true,
    inStock: true,
    stockCount: 14,
    tags: ["bracelet", "gold", "everyday", "charm"],
    rating: { average: 4.6, count: 24 },
    createdAt: "2026-05-15T10:00:00.000Z",
    variants: ["Adjustable"],
    popularScore: 82,
    material: "316L Stainless Steel",
    plating: "18K PVD Gold",
    metalTone: "gold",
    isWaterproof: true,
    isAntiTarnish: true
  },
  {
    _id: "sample-5",
    name: "Curated Stackable Ring Set",
    slug: "curated-stackable-ring-set",
    category: "Stackable Ring Sets",
    description:
      "A set of three rings designed to layer together, mixing widths and textures for an effortless stacked look.",
    price: 1299,
    images: [
      { url: placeholderImage, alt: "Curated stackable ring set" },
      { url: placeholderImage, alt: "Stacked rings detail" },
      { url: placeholderImage, alt: "Ring set styled on hand" }
    ],
    careInstructions: DEFAULT_CARE_INSTRUCTIONS,
    shippingInfo: "Ships in 2-3 business days.",
    isFeatured: true,
    featured: true,
    inStock: true,
    stockCount: 6,
    tags: ["rings", "gold", "stackable", "set"],
    rating: { average: 4.8, count: 19 },
    createdAt: "2026-05-12T10:00:00.000Z",
    variants: ["12", "14", "16"],
    popularScore: 78,
    material: "316L Stainless Steel",
    plating: "18K PVD Gold",
    metalTone: "gold",
    isWaterproof: true,
    isAntiTarnish: true
  },
  {
    _id: "sample-6",
    name: "Delicate Chain Anklet",
    slug: "delicate-chain-anklet",
    category: "Anklets",
    description: "A fine chain anklet with a tiny gold-tone charm, light enough for everyday wear.",
    price: 599,
    originalPrice: 799,
    images: [
      { url: placeholderImage, alt: "Delicate chain anklet" },
      { url: placeholderImage, alt: "Anklet charm detail" },
      { url: placeholderImage, alt: "Anklet styled on ankle" }
    ],
    careInstructions: DEFAULT_CARE_INSTRUCTIONS,
    shippingInfo: "Ships in 2-3 business days.",
    isFeatured: true,
    featured: true,
    inStock: true,
    stockCount: 35,
    tags: ["anklet", "everyday", "gift"],
    rating: { average: 4.5, count: 64 },
    createdAt: "2026-05-10T10:00:00.000Z",
    variants: ["Single", "Pair"],
    popularScore: 74,
    material: "316L Stainless Steel",
    plating: "18K PVD Gold",
    metalTone: "gold",
    isWaterproof: true,
    isAntiTarnish: true
  },
  {
    _id: "sample-7",
    name: "Initial Pendant with Chain",
    slug: "initial-pendant-with-chain",
    category: "Pendants & Charms",
    description: "A dainty initial pendant on a fine gold-tone chain, worn close for everyday meaning.",
    price: 799,
    images: [
      { url: placeholderImage, alt: "Initial pendant with chain" },
      { url: placeholderImage, alt: "Pendant engraving detail" },
      { url: placeholderImage, alt: "Pendant styled on neckline" }
    ],
    careInstructions: DEFAULT_CARE_INSTRUCTIONS,
    shippingInfo: "Ships in 2-3 business days.",
    isFeatured: true,
    featured: true,
    inStock: true,
    stockCount: 10,
    tags: ["pendant", "gold", "everyday", "gift"],
    rating: { average: 4.7, count: 27 },
    createdAt: "2026-05-08T10:00:00.000Z",
    variants: ["16 in chain", "18 in chain"],
    popularScore: 70,
    material: "316L Stainless Steel",
    plating: "18K PVD Gold",
    metalTone: "gold",
    isWaterproof: true,
    isAntiTarnish: true
  },
  {
    _id: "sample-8",
    name: "Everyday Hoop Earrings",
    slug: "everyday-hoop-earrings",
    category: "Hoops & Danglers",
    description: "Lightweight everyday hoops in 18K PVD gold, comfortable enough to wear all day.",
    price: 799,
    originalPrice: 999,
    images: [
      { url: placeholderImage, alt: "Everyday hoop earrings" },
      { url: placeholderImage, alt: "Hoop earring detail" },
      { url: placeholderImage, alt: "Hoops styled on ear" }
    ],
    careInstructions: DEFAULT_CARE_INSTRUCTIONS,
    shippingInfo: "Ships in 2-3 business days.",
    isFeatured: true,
    featured: true,
    inStock: true,
    stockCount: 15,
    tags: ["hoops", "gold", "everyday"],
    rating: { average: 4.9, count: 16 },
    createdAt: "2026-05-06T10:00:00.000Z",
    variants: ["Small", "Medium", "Large"],
    popularScore: 86,
    material: "316L Stainless Steel",
    plating: "18K PVD Gold",
    metalTone: "gold",
    isWaterproof: true,
    isAntiTarnish: true
  },
  {
    _id: "sample-9",
    name: "Solid Link Chain",
    slug: "solid-link-chain",
    category: "Chains",
    description: "A solid gold-toned link chain, worn alone or layered as a foundation piece.",
    price: 1199,
    images: [
      { url: placeholderImage, alt: "Solid link chain" },
      { url: placeholderImage, alt: "Chain link detail" },
      { url: placeholderImage, alt: "Chain styled on neckline" }
    ],
    careInstructions: DEFAULT_CARE_INSTRUCTIONS,
    shippingInfo: "Ships in 2-3 business days.",
    isFeatured: false,
    inStock: true,
    stockCount: 24,
    tags: ["chain", "gold", "everyday"],
    rating: { average: 4.4, count: 22 },
    createdAt: "2026-05-03T10:00:00.000Z",
    variants: ["18 in", "20 in", "22 in"],
    popularScore: 68,
    material: "316L Stainless Steel",
    plating: "18K PVD Gold",
    metalTone: "gold",
    isWaterproof: true,
    isAntiTarnish: true
  },
  {
    _id: "sample-10",
    name: "Everyday Stack Gift Set",
    slug: "everyday-stack-gift-set",
    category: "Gift Sets",
    description:
      "A complete matching set with a chain necklace and coordinating studs, boxed and ready for gifting.",
    price: 2499,
    images: [
      { url: placeholderImage, alt: "Everyday stack gift set" },
      { url: placeholderImage, alt: "Gift set detail" },
      { url: placeholderImage, alt: "Gift set styled" }
    ],
    careInstructions: DEFAULT_CARE_INSTRUCTIONS,
    shippingInfo: "Ships in 2-3 business days with gift-ready packaging.",
    isFeatured: false,
    inStock: true,
    stockCount: 6,
    tags: ["gift set", "gold", "set"],
    rating: { average: 4.6, count: 73 },
    createdAt: "2026-05-01T10:00:00.000Z",
    variants: ["Gold", "Rose Gold"],
    popularScore: 76,
    material: "316L Stainless Steel",
    plating: "18K PVD Gold",
    metalTone: "gold",
    isWaterproof: true,
    isAntiTarnish: true
  }
];

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
