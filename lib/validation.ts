import { z } from "zod";
import { METAL_TONES, PRODUCT_BADGES } from "@/lib/product-data";

export const productPayloadSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required."),
    slug: z.string().trim().optional(),
    category: z.string().trim().min(1, "Category is required."),
    subcategory: z.string().optional(),
    description: z.string().optional(),
    price: z.coerce.number().nonnegative("Price must be zero or more."),
    originalPrice: z.coerce.number().nonnegative().optional().nullable(),
    images: z
      .array(
        z.object({
          url: z.string().min(1),
          publicId: z.string().optional(),
          alt: z.string().optional()
        })
      )
      .optional(),
    dimensions: z.string().optional(),
    careInstructions: z.string().optional(),
    shippingInfo: z.string().optional(),
    isFeatured: z.boolean().optional(),
    featured: z.boolean().optional(),
    active: z.boolean().optional(),
    inStock: z.boolean().optional(),
    stockCount: z.coerce.number().int().nonnegative().optional(),
    tags: z.array(z.string()).optional(),
    variants: z.array(z.string()).optional(),
    material: z.string().optional(),
    plating: z.string().optional(),
    // "" comes from a cleared <select> — treat it the same as unset.
    metalTone: z.preprocess((value) => (value === "" ? undefined : value), z.enum(METAL_TONES).optional().nullable()),
    size: z.string().optional().nullable(),
    weightGrams: z.coerce.number().nonnegative().optional().nullable(),
    isWaterproof: z.boolean().optional(),
    isAntiTarnish: z.boolean().optional(),
    stackWith: z.array(z.string()).optional(),
    badges: z.array(z.enum(PRODUCT_BADGES)).optional(),
    sortOrder: z.coerce.number().optional(),
    isPlaceholder: z.boolean().optional()
  })
  // Legacy/unmodeled fields (e.g. rating) pass through untouched rather than
  // being stripped, so this validation layer can't silently drop data the
  // rest of the app still reads/writes.
  .passthrough();

export function formatZodError(error: z.ZodError) {
  const first = error.issues[0];
  return first ? `${first.path.join(".") || "value"}: ${first.message}` : "Invalid product data.";
}

export const hamperPayloadSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z.string().trim().optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  heroImageUrl: z.string().optional(),
  galleryImageUrls: z.array(z.string()).optional(),
  discountPercent: z.coerce.number().min(0).max(90),
  packagingFee: z.coerce.number().nonnegative("Packaging fee cannot be negative.").optional(),
  minItems: z.coerce.number().int().min(1, "Minimum items must be at least 1."),
  maxItems: z.coerce.number().int().optional().nullable(),
  isActive: z.boolean().optional(),
  isPlaceholder: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  products: z
    .array(
      z.object({
        productId: z.string().min(1),
        isRequired: z.boolean().optional(),
        sortOrder: z.coerce.number().int().optional()
      })
    )
    .default([])
});

export type HamperPayload = z.infer<typeof hamperPayloadSchema>;
