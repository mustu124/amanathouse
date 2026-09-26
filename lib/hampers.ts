import type { StoreProduct } from "@/lib/product-data";
import { normalizeSupabaseProduct } from "@/lib/supabase-mappers";
import type { HamperPricingRules, HamperSelectedItem } from "@/lib/pricing/hamper";

type Row = Record<string, unknown>;

export const HAMPER_CATEGORY = { name: "Hampers", slug: "hampers", icon: "🎁", href: "/hampers", image: "/categories/hampers.jpg" } as const;

export type HamperEligibleProduct = {
  product: StoreProduct;
  isRequired: boolean;
  sortOrder: number;
};

// Hampers use one pricing method: a percentage off whatever the customer picks.
export type Hamper = {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  heroImageUrl: string;
  galleryImageUrls: string[];
  discountPercent: number;
  packagingFee: number;
  minItems: number;
  maxItems: number | null;
  isActive: boolean;
  isPlaceholder: boolean;
  sortOrder: number;
  createdAt: string;
  products: HamperEligibleProduct[];
};

export type HamperContentLine = {
  productId: string;
  name: string;
  slug: string;
  variant: string | null;
  metalTone: string | null;
  size: string | null;
  unitPrice: number;
  quantity: number;
};

// Frozen at order time so later price edits never rewrite history.
export type HamperSnapshot = {
  hamperId: string;
  hamperName: string;
  hamperSlug: string;
  items: HamperContentLine[];
  itemsSubtotal: number;
  discountPercentApplied: number;
  discountAmount: number;
  packagingFee: number;
  hamperTotal: number;
};

// What the browser keeps in the cart for a hamper line.
export type HamperCartData = {
  hamperId: string;
  slug: string;
  name: string;
  heroImageUrl: string;
  items: HamperContentLine[];
  itemsSubtotal: number;
  discountAmount: number;
  packagingFee: number;
  total: number;
  // Set by cart re-validation when the live hamper no longer matches what
  // the customer built. The customer must confirm or edit before checkout.
  notice?: string;
  freshTotal?: number;
};

export function normalizeSupabaseHamper(row: Row, links: Row[] = [], products: Row[] = []): Hamper {
  const productById = new Map(products.map((product) => [product.id as string, product]));
  const eligible: HamperEligibleProduct[] = links
    .filter((link) => productById.has(link.product_id as string))
    .map((link) => ({
      product: normalizeSupabaseProduct(productById.get(link.product_id as string) as Row),
      isRequired: Boolean(link.is_required),
      sortOrder: Number(link.sort_order ?? 0)
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const nullableNumber = (value: unknown) => (value == null ? null : Number(value));

  return {
    _id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    shortDescription: (row.short_description as string) ?? "",
    longDescription: (row.long_description as string) ?? "",
    heroImageUrl: (row.hero_image_url as string) ?? "",
    galleryImageUrls: (row.gallery_image_urls as string[]) ?? [],
    discountPercent: Number(row.discount_percent ?? 0),
    packagingFee: Number(row.packaging_fee ?? 0),
    minItems: Number(row.min_items ?? 1),
    maxItems: nullableNumber(row.max_items),
    isActive: Boolean(row.is_active),
    isPlaceholder: Boolean(row.is_placeholder),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    products: eligible
  };
}

export function hamperPayloadToSupabase(payload: Row) {
  return {
    name: payload.name,
    slug: payload.slug,
    short_description: payload.shortDescription ?? "",
    long_description: payload.longDescription ?? "",
    hero_image_url: payload.heroImageUrl ?? "",
    gallery_image_urls: payload.galleryImageUrls ?? [],
    pricing_mode: "percentage",
    discount_percent: Number(payload.discountPercent),
    fixed_price: null,
    packaging_fee: Number(payload.packagingFee ?? 0),
    min_items: Number(payload.minItems),
    max_items: payload.maxItems == null || payload.maxItems === "" ? null : Number(payload.maxItems),
    is_active: payload.isActive ?? true,
    is_placeholder: Boolean(payload.isPlaceholder),
    sort_order: Number(payload.sortOrder ?? 0),
    updated_at: new Date().toISOString()
  };
}

export function hamperRules(hamper: Hamper): HamperPricingRules {
  return {
    discountPercent: hamper.discountPercent,
    packagingFee: hamper.packagingFee,
    minItems: hamper.minItems,
    maxItems: hamper.maxItems,
    requiredProductIds: hamper.products.filter((entry) => entry.isRequired).map((entry) => entry.product._id)
  };
}

export function selectedItemFromProduct(product: StoreProduct, quantity: number): HamperSelectedItem {
  return {
    productId: product._id,
    name: product.name,
    unitPrice: product.price,
    quantity,
    isActive: product.active !== false,
    inStock: product.inStock,
    stockCount: product.stockCount
  };
}

export function hamperOfferLabel(hamper: Pick<Hamper, "discountPercent">) {
  return `Save ${hamper.discountPercent ?? 0}% when you build your own`;
}

export function hamperCartProductId(slug: string, items: Array<{ productId: string; quantity: number; variant?: string | null }>) {
  const signature = [...items]
    .sort((a, b) => a.productId.localeCompare(b.productId))
    .map((item) => `${item.productId.slice(0, 8)}x${item.quantity}${item.variant ? `-${item.variant}` : ""}`)
    .join("_");
  return `hamper:${slug}:${signature}`;
}

// Round-trips a loaded hamper back into the save payload (used by list toggles).
export function hamperToPayload(hamper: Hamper, overrides: Partial<Hamper> = {}) {
  const merged = { ...hamper, ...overrides };
  return {
    name: merged.name,
    slug: merged.slug,
    shortDescription: merged.shortDescription,
    longDescription: merged.longDescription,
    heroImageUrl: merged.heroImageUrl,
    galleryImageUrls: merged.galleryImageUrls,
    discountPercent: merged.discountPercent,
    packagingFee: merged.packagingFee,
    minItems: merged.minItems,
    maxItems: merged.maxItems,
    isActive: merged.isActive,
    isPlaceholder: merged.isPlaceholder,
    sortOrder: merged.sortOrder,
    products: merged.products.map((entry, index) => ({ productId: entry.product._id, isRequired: entry.isRequired, sortOrder: index }))
  };
}
