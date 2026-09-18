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

const placeholderImage = "/placeholder-product.png";

const categories = [
  "Necklaces",
  "Rings",
  "Studs",
  "Bracelets",
  "Anklets",
  "Chains",
  "Hoops & Danglers",
  "Pendants & Charms",
  "Stackable Ring Sets",
  "Gift Sets"
];

export const fallbackGalleryItems: GalleryItem[] = Array.from({ length: 30 }).map((_, index) => {
  const imageIndex = index % categories.length;

  return {
    _id: `gallery-${index + 1}`,
    url: placeholderImage,
    type: "image",
    thumbnailUrl: placeholderImage,
    caption: [
      "Layered gold necklaces styled for everyday wear",
      "Minimal gold band rings, stacked and styled",
      "Everyday studs finished in 18K PVD gold",
      "Chain bracelets layered for daily wear",
      "Delicate anklets for a finishing touch",
      "Solid gold-toned chains worn alone",
      "Hoops and danglers that move with you",
      "Pendants and charms worn close",
      "Stackable ring sets mixed and matched",
      "Gift sets boxed and ready to give"
    ][imageIndex],
    category: categories[imageIndex],
    order: index + 1
  };
});

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
