import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { slugifyProductName } from "@/lib/product-data";
import type { HamperPayload } from "@/lib/validation";
import {
  hamperPayloadToSupabase,
  hamperRules,
  normalizeSupabaseHamper,
  selectedItemFromProduct,
  type Hamper,
  type HamperContentLine,
  type HamperSnapshot
} from "@/lib/hampers";
import { calculateHamperPrice, validateHamperConfig, type HamperPriceResult } from "@/lib/pricing/hamper";

type Row = Record<string, unknown>;

// Server-only hamper reads. The tables come from migration 0003; if it has not
// been applied yet these return empty results instead of taking pages down.
async function loadHampers(where: { column: "slug" | "id"; value: string } | null, includeInactive: boolean): Promise<Hamper[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("hampers").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (!includeInactive) query = query.eq("is_active", true);
    if (where) query = query.eq(where.column, where.value);
    const { data: rows, error } = await query;
    if (error || !rows?.length) return [];

    const hamperIds = (rows as Row[]).map((row) => row.id);
    const { data: links, error: linksError } = await supabase.from("hamper_products").select("*").in("hamper_id", hamperIds);
    if (linksError) return [];

    const productIds = Array.from(new Set((links ?? []).map((link) => link.product_id as string)));
    let products: Row[] = [];
    if (productIds.length) {
      const { data: productRows, error: productsError } = await supabase.from("products").select("*").in("id", productIds);
      if (productsError) return [];
      products = productRows ?? [];
    }

    return (rows as Row[]).map((row) =>
      normalizeSupabaseHamper(
        row,
        (links ?? []).filter((link) => link.hamper_id === row.id),
        // Inactive products are kept (flagged active:false) so pricing can report them clearly.
        products
      )
    );
  } catch {
    return [];
  }
}

export function listHampers(options: { includeInactive?: boolean } = {}) {
  return loadHampers(null, Boolean(options.includeInactive));
}

export async function getHamperBySlug(slug: string, options: { includeInactive?: boolean } = {}) {
  const [hamper] = await loadHampers({ column: "slug", value: slug }, Boolean(options.includeInactive));
  return hamper ?? null;
}

export async function getHamperById(id: string, options: { includeInactive?: boolean } = {}) {
  const [hamper] = await loadHampers({ column: "id", value: id }, Boolean(options.includeInactive));
  return hamper ?? null;
}

export type HamperSelectionInput = { productId: string; quantity: number; variant?: string | null };

// Re-prices a customer's selection against FRESH database prices and stock.
// Used by the order API (and cart re-validation); the client never gets to
// dictate the price.
export function priceHamperSelection(
  hamper: Hamper,
  selection: HamperSelectionInput[]
): { result: HamperPriceResult; snapshot: HamperSnapshot; errors: string[] } {
  const errors: string[] = [];
  const lines: HamperContentLine[] = [];
  const selectedItems = [];

  for (const entry of selection) {
    const eligible = hamper.products.find((candidate) => candidate.product._id === entry.productId);
    if (!eligible) {
      errors.push("A selected item is not part of this hamper.");
      continue;
    }
    const quantity = Math.max(0, Math.floor(Number(entry.quantity) || 0));
    if (quantity === 0) continue;
    const product = eligible.product;
    selectedItems.push(selectedItemFromProduct(product, quantity));
    lines.push({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      variant: entry.variant ?? null,
      metalTone: product.metalTone ?? null,
      size: product.size ?? null,
      unitPrice: product.price,
      quantity
    });
  }

  const result = calculateHamperPrice(hamperRules(hamper), selectedItems);
  const snapshot: HamperSnapshot = {
    hamperId: hamper._id,
    hamperName: hamper.name,
    hamperSlug: hamper.slug,
    items: lines,
    itemsSubtotal: result.itemsSubtotal,
    discountPercentApplied: result.discountPercentApplied,
    discountAmount: result.discountAmount,
    packagingFee: result.packagingFee,
    hamperTotal: result.total
  };

  return { result, snapshot, errors: [...errors, ...result.validationErrors] };
}

const CONSTRAINT_MESSAGES: Record<string, string> = {
  hampers_percentage_valid: "Discount must be between 0% and 90%.",
  hampers_fixed_valid: "Fixed price must be greater than ₹0.",
  hampers_packaging_fee_valid: "Packaging fee cannot be negative.",
  hampers_min_items_valid: "Minimum items must be at least 1.",
  hampers_max_items_valid: "Maximum items cannot be lower than minimum items.",
  hampers_slug_key: "That URL name (slug) is already used by another hamper."
};

export function friendlyHamperDbError(error: { message?: string; code?: string }) {
  const message = error.message ?? "";
  for (const [constraint, text] of Object.entries(CONSTRAINT_MESSAGES)) {
    if (message.includes(constraint)) return text;
  }
  if (error.code === "42P01" || /relation .*hampers.* does not exist|schema cache/i.test(message)) {
    return "The hampers tables are missing - run supabase/migrations/0003_hampers.sql in the Supabase SQL Editor first.";
  }
  if (error.code === "23505") return "That URL name (slug) is already used by another hamper.";
  return message || "Database error.";
}

// Create (id omitted) or update a hamper and replace its eligible-product list.
export async function saveHamper(payload: HamperPayload, id?: string): Promise<{ hamperId: string } | { error: string; status: number }> {
  const errors = validateHamperConfig({
    discountPercent: payload.discountPercent,
    packagingFee: payload.packagingFee,
    minItems: payload.minItems,
    maxItems: payload.maxItems,
    eligibleCount: payload.products.length
  });
  const requiredCount = payload.products.filter((entry) => entry.isRequired).length;
  if (payload.maxItems != null && requiredCount > payload.maxItems) {
    errors.push("More products are marked required than the maximum item count allows.");
  }
  if (errors.length) return { error: errors[0], status: 400 };

  const supabase = getSupabaseAdmin();
  const row = hamperPayloadToSupabase({ ...payload, slug: payload.slug || slugifyProductName(payload.name) });
  const write = id
    ? await supabase.from("hampers").update(row).eq("id", id).select("id").single()
    : await supabase.from("hampers").insert(row).select("id").single();
  if (write.error || !write.data) return { error: friendlyHamperDbError(write.error ?? {}), status: 400 };

  const hamperId = write.data.id as string;
  const cleared = await supabase.from("hamper_products").delete().eq("hamper_id", hamperId);
  if (cleared.error) return { error: friendlyHamperDbError(cleared.error), status: 500 };
  if (payload.products.length) {
    const inserted = await supabase.from("hamper_products").insert(
      payload.products.map((entry, index) => ({
        hamper_id: hamperId,
        product_id: entry.productId,
        is_required: Boolean(entry.isRequired),
        sort_order: entry.sortOrder ?? index
      }))
    );
    if (inserted.error) return { error: friendlyHamperDbError(inserted.error), status: 400 };
  }

  return { hamperId };
}
