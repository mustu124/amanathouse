import { normalizeProduct, slugifyProductName, type StoreProduct } from "@/lib/product-data";
import type { GalleryItem } from "@/lib/gallery-data";

type AnyRecord = Record<string, any>;

export function normalizeSupabaseProduct(row: AnyRecord): StoreProduct {
  return normalizeProduct({
    _id: row._id ?? row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    subcategory: row.subcategory,
    description: row.description,
    price: Number(row.price ?? 0),
    originalPrice: row.originalPrice ?? row.original_price,
    images: row.images ?? [],
    dimensions: row.dimensions,
    careInstructions: row.careInstructions ?? row.care_instructions,
    shippingInfo: row.shippingInfo ?? row.shipping_info,
    isFeatured: row.isFeatured ?? row.is_featured ?? row.featured ?? false,
    featured: row.featured ?? row.isFeatured ?? row.is_featured ?? false,
    inStock: row.inStock ?? row.in_stock ?? true,
    stockCount: row.stockCount ?? row.stock_count ?? row.inventory ?? 0,
    inventory: row.inventory ?? row.stockCount ?? row.stock_count ?? 0,
    active: row.active ?? true,
    tags: row.tags ?? [],
    rating: row.rating ?? { average: 0, count: 0 },
    variants: row.variants ?? [],
    createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
    material: row.material,
    plating: row.plating,
    metalTone: row.metalTone ?? row.metal_tone,
    size: row.size,
    weightGrams: row.weightGrams ?? row.weight_grams,
    isWaterproof: row.isWaterproof ?? row.is_waterproof,
    isAntiTarnish: row.isAntiTarnish ?? row.is_anti_tarnish,
    stackWith: row.stackWith ?? row.stack_with ?? [],
    badges: row.badges ?? [],
    sortOrder: row.sortOrder ?? row.sort_order ?? 0,
    isPlaceholder: row.isPlaceholder ?? row.is_placeholder ?? false
  });
}

export function productPayloadToSupabase(payload: AnyRecord) {
  const name = String(payload.name ?? "");

  return {
    name,
    slug: payload.slug || slugifyProductName(name),
    category: payload.category,
    subcategory: payload.subcategory ?? "",
    description: payload.description ?? "",
    price: Number(payload.price ?? 0),
    original_price: payload.originalPrice ? Number(payload.originalPrice) : null,
    images: payload.images ?? [],
    dimensions: payload.dimensions ?? "",
    care_instructions: payload.careInstructions ?? "",
    shipping_info: payload.shippingInfo ?? "",
    is_featured: Boolean(payload.isFeatured ?? payload.featured),
    featured: Boolean(payload.featured ?? payload.isFeatured),
    in_stock: Number(payload.stockCount ?? payload.inventory ?? 0) > 0 && (payload.inStock ?? true) !== false,
    stock_count: Number(payload.stockCount ?? payload.inventory ?? 0),
    inventory: Number(payload.inventory ?? payload.stockCount ?? 0),
    active: payload.active ?? true,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    rating: payload.rating ?? { average: 0, count: 0 },
    variants: Array.isArray(payload.variants) ? payload.variants : [],
    material: payload.material ?? "316L Stainless Steel",
    plating: payload.plating ?? "18K PVD Gold",
    metal_tone: payload.metalTone ?? "gold",
    size: payload.size ?? null,
    weight_grams: payload.weightGrams !== undefined && payload.weightGrams !== null && payload.weightGrams !== "" ? Number(payload.weightGrams) : null,
    is_waterproof: payload.isWaterproof === undefined ? true : Boolean(payload.isWaterproof),
    is_anti_tarnish: payload.isAntiTarnish === undefined ? true : Boolean(payload.isAntiTarnish),
    stack_with: Array.isArray(payload.stackWith) ? payload.stackWith : [],
    badges: Array.isArray(payload.badges) ? payload.badges : [],
    sort_order: Number(payload.sortOrder ?? 0),
    is_placeholder: Boolean(payload.isPlaceholder),
    updated_at: new Date().toISOString()
  };
}

export function normalizeSupabaseGalleryItem(row: AnyRecord): GalleryItem {
  return {
    _id: String(row._id ?? row.id),
    url: row.url,
    type: row.type,
    thumbnailUrl: row.thumbnailUrl ?? row.thumbnail_url,
    caption: row.caption,
    category: row.category,
    order: row.order ?? row.order_index ?? 0
  };
}

export function galleryPayloadToSupabase(payload: AnyRecord) {
  return {
    url: payload.url,
    type: payload.type ?? "image",
    thumbnail_url: payload.thumbnailUrl ?? payload.thumbnail_url ?? payload.url,
    caption: payload.caption ?? "",
    category: payload.category ?? "Lifestyle",
    order_index: Number(payload.order ?? payload.order_index ?? 0),
    public_id: payload.publicId ?? payload.public_id ?? null,
    featured: Boolean(payload.featured)
  };
}

export function normalizeSupabaseOrder(row: AnyRecord) {
  return {
    _id: row._id ?? row.id,
    orderNumber: row.orderNumber ?? row.order_number,
    items: row.items ?? [],
    customerName: row.customerName ?? row.customer_name,
    customerPhone: row.customerPhone ?? row.customer_phone,
    customerEmail: row.customerEmail ?? row.customer_email,
    deliveryAddress: row.deliveryAddress ?? row.delivery_address,
    pincode: row.pincode,
    totalAmount: Number(row.totalAmount ?? row.total_amount ?? 0),
    status: row.status,
    whatsappSent: row.whatsappSent ?? row.whatsapp_sent ?? false,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at
  };
}

export function orderPayloadToSupabase(payload: AnyRecord & { orderNumber?: string }) {
  return {
    order_number: payload.orderNumber,
    items: payload.items ?? [],
    customer_name: payload.customerName,
    customer_phone: payload.customerPhone,
    customer_email: payload.customerEmail ?? null,
    delivery_address: payload.deliveryAddress,
    pincode: payload.pincode,
    total_amount: Number(payload.totalAmount ?? 0),
    status: payload.status ?? "pending",
    whatsapp_sent: Boolean(payload.whatsappSent)
  };
}

export function normalizeSupabaseSettings(row: AnyRecord | null, defaults: AnyRecord) {
  if (!row) return defaults;
  const rawStoreAddress = row.storeAddress ?? row.store_address ?? defaults.storeAddress;
  const storeAddress =
    typeof rawStoreAddress === "string" && /pyramid elite|sector 86|gurugram/i.test(rawStoreAddress)
      ? defaults.storeAddress
      : rawStoreAddress;

  return {
    ...defaults,
    heroSlides: row.heroSlides ?? row.hero_slides ?? defaults.heroSlides,
    mobileHeroSlides: row.mobileHeroSlides ?? row.mobile_hero_slides ?? defaults.mobileHeroSlides,
    announcementText: row.announcementText ?? row.announcement_text ?? defaults.announcementText,
    whatsappNumber: row.whatsappNumber ?? row.whatsapp_number ?? defaults.whatsappNumber,
    socialLinks: row.socialLinks ?? row.social_links ?? defaults.socialLinks,
    aboutText: row.aboutText ?? row.about_text ?? defaults.aboutText,
    metaTitle: row.metaTitle ?? row.meta_title ?? defaults.metaTitle,
    metaDescription: row.metaDescription ?? row.meta_description ?? defaults.metaDescription,
    storeEmail: row.storeEmail ?? row.store_email ?? defaults.storeEmail,
    storeAddress,
    footerCopyright: row.footerCopyright ?? row.footer_copyright ?? defaults.footerCopyright,
    categories: row.categories ?? defaults.categories
  };
}

export function settingsPayloadToSupabase(payload: AnyRecord) {
  return {
    hero_slides: payload.heroSlides ?? [],
    mobile_hero_slides: payload.mobileHeroSlides ?? [],
    announcement_text: payload.announcementText ?? "",
    whatsapp_number: payload.whatsappNumber ?? "",
    social_links: payload.socialLinks ?? {},
    about_text: payload.aboutText ?? "",
    meta_title: payload.metaTitle ?? "",
    meta_description: payload.metaDescription ?? "",
    store_email: payload.storeEmail ?? "",
    store_address: payload.storeAddress ?? "",
    footer_copyright: payload.footerCopyright ?? "",
    categories: payload.categories ?? [],
    updated_at: new Date().toISOString()
  };
}
