import type { StoreProduct } from "@/lib/product-data";

export type GalleryItem = {
  _id: string;
  url: string;
  type: "image";
  thumbnailUrl?: string;
  caption: string;
  category: string;
  order: number;
  productId?: string;
  productSlug?: string;
  productName?: string;
};

// Only used when Supabase is not configured; the live gallery is built from
// real product images.
export const fallbackGalleryItems: GalleryItem[] = [];

export function filterGalleryItems(category?: string | null) {
  if (!category || category === "All") return fallbackGalleryItems;
  return fallbackGalleryItems.filter((item) => item.category === category);
}

export function productToGalleryItems(product: StoreProduct, productIndex = 0): GalleryItem[] {
  const productKey = product.slug || product._id;

  return product.images.map((image, imageIndex) => ({
    _id: `${productKey}-image-${imageIndex + 1}`,
    url: image.url,
    type: "image" as const,
    thumbnailUrl: image.url,
    caption: image.alt || product.name,
    category: product.category,
    order: productIndex * 100 + imageIndex + 1,
    productId: product._id,
    productSlug: product.slug,
    productName: product.name
  }));
}

export function filterProductGalleryItems(items: GalleryItem[], category?: string | null, type?: string | null) {
  const normalizedCategory = category?.toLowerCase().trim();

  return items.filter((item) => {
    if (type && item.type !== type) return false;
    if (!normalizedCategory || normalizedCategory === "all") return true;
    return item.category.toLowerCase() === normalizedCategory;
  });
}
