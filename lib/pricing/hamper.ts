// The ONE place hamper arithmetic lives. The builder UI, the cart, the order
// API and the admin preview all call calculateHamperPrice - never re-derive
// these numbers elsewhere. Money is computed in integer paise and rounded
// once (the discount), then converted back to rupees.

export type HamperPricingMode = "percentage" | "fixed";

export type HamperPricingRules = {
  pricingMode: HamperPricingMode;
  discountPercent?: number | null;
  fixedPrice?: number | null;
  packagingFee?: number | null;
  minItems: number;
  maxItems?: number | null;
  requiredProductIds?: string[];
};

export type HamperSelectedItem = {
  productId: string;
  unitPrice: number;
  quantity: number;
  name?: string;
  isActive?: boolean;
  inStock?: boolean;
  stockCount?: number;
};

export type HamperPriceResult = {
  itemCount: number;
  itemsSubtotal: number;
  discountAmount: number;
  discountPercentApplied: number;
  packagingFee: number;
  total: number;
  savings: number;
  isValid: boolean;
  validationErrors: string[];
};

const toPaise = (rupees: number) => Math.round((Number.isFinite(rupees) ? rupees : 0) * 100);
const toRupees = (paise: number) => paise / 100;

// itemCount / min_items / max_items count units (sum of quantities).
export function calculateHamperPrice(rules: HamperPricingRules, selectedItems: HamperSelectedItem[]): HamperPriceResult {
  const items = selectedItems.filter((item) => item.quantity > 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPaise = items.reduce((sum, item) => sum + toPaise(item.unitPrice) * item.quantity, 0);
  const feePaise = toPaise(rules.packagingFee ?? 0);

  let discountPaise = 0;
  let totalPaise: number;
  let discountPercentApplied = 0;

  if (rules.pricingMode === "percentage") {
    const percentBasis = Math.round((rules.discountPercent ?? 0) * 100);
    discountPaise = Math.round((subtotalPaise * percentBasis) / 10000);
    discountPercentApplied = percentBasis / 100;
    totalPaise = subtotalPaise - discountPaise + feePaise;
  } else {
    totalPaise = toPaise(rules.fixedPrice ?? 0) + feePaise;
  }

  // Savings are only ever positive: a fixed price above the selection's
  // value gives no saving rather than a negative one.
  const fixedPricePaise = toPaise(rules.fixedPrice ?? 0);
  const savingsPaise =
    rules.pricingMode === "percentage" ? discountPaise : Math.max(subtotalPaise - fixedPricePaise, 0);
  if (rules.pricingMode === "fixed") {
    discountPaise = savingsPaise;
    discountPercentApplied = subtotalPaise > 0 ? Math.round((savingsPaise / subtotalPaise) * 10000) / 100 : 0;
  }

  const validationErrors: string[] = [];
  if (itemCount < rules.minItems) {
    const missing = rules.minItems - itemCount;
    validationErrors.push(
      `Add ${missing} more item${missing === 1 ? "" : "s"} to complete your hamper (minimum ${rules.minItems}).`
    );
  }
  if (rules.maxItems != null && itemCount > rules.maxItems) {
    validationErrors.push(`This hamper holds at most ${rules.maxItems} items - remove ${itemCount - rules.maxItems}.`);
  }
  const selectedIds = new Set(items.map((item) => item.productId));
  for (const requiredId of rules.requiredProductIds ?? []) {
    if (!selectedIds.has(requiredId)) validationErrors.push("A required item is missing from your hamper.");
  }
  for (const item of items) {
    const label = item.name ?? "An item";
    if (item.isActive === false) validationErrors.push(`${label} is no longer available.`);
    else if (item.inStock === false || (item.stockCount !== undefined && item.stockCount <= 0)) {
      validationErrors.push(`${label} is out of stock.`);
    } else if (item.stockCount !== undefined && item.quantity > item.stockCount) {
      validationErrors.push(`Only ${item.stockCount} of ${label} left in stock.`);
    }
  }

  return {
    itemCount,
    itemsSubtotal: toRupees(subtotalPaise),
    discountAmount: toRupees(discountPaise),
    discountPercentApplied,
    packagingFee: toRupees(feePaise),
    total: toRupees(totalPaise),
    savings: toRupees(savingsPaise),
    isValid: validationErrors.length === 0,
    validationErrors: Array.from(new Set(validationErrors))
  };
}

// Configuration checks shared by the admin form (client) and the API (server);
// the DB CHECK constraints are the last line of defence and mirror these.
export function validateHamperConfig(config: {
  pricingMode: HamperPricingMode;
  discountPercent?: number | null;
  fixedPrice?: number | null;
  packagingFee?: number | null;
  minItems: number;
  maxItems?: number | null;
  eligibleCount: number;
}): string[] {
  const errors: string[] = [];
  if (config.pricingMode === "percentage") {
    const percent = config.discountPercent;
    if (percent == null || Number.isNaN(percent) || percent < 0 || percent > 90) {
      errors.push("Discount must be between 0% and 90%.");
    }
  } else if (config.fixedPrice == null || Number.isNaN(config.fixedPrice) || config.fixedPrice <= 0) {
    errors.push("Fixed price must be greater than ₹0.");
  }
  if ((config.packagingFee ?? 0) < 0) errors.push("Packaging fee cannot be negative.");
  if (!Number.isInteger(config.minItems) || config.minItems < 1) errors.push("Minimum items must be at least 1.");
  if (config.maxItems != null && config.maxItems < config.minItems) {
    errors.push("Maximum items cannot be lower than minimum items.");
  }
  if (config.eligibleCount < config.minItems) {
    errors.push(
      `Only ${config.eligibleCount} eligible product${config.eligibleCount === 1 ? "" : "s"} selected, but customers must pick at least ${config.minItems}.`
    );
  }
  return errors;
}

// Rupees with 0 decimals for whole amounts and exactly 2 otherwise (₹1,527.45).
export function formatMoney(value: number) {
  const hasPaise = Math.round(value * 100) % 100 !== 0;
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: hasPaise ? 2 : 0, maximumFractionDigits: 2 })}`;
}
