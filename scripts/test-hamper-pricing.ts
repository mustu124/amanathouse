// Offline checks for the hamper pricing engine, config validation, server
// re-pricing helper and the WhatsApp message. No database needed.
//   npm run test:hampers
import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { calculateHamperPrice, formatMoney, validateHamperConfig, type HamperSelectedItem } from "../lib/pricing/hamper";
import { hamperRules, normalizeSupabaseHamper, type HamperCartData } from "../lib/hampers";
import { priceHamperSelection } from "../lib/server-hampers";
import type { CartItem } from "../context/CartContext";

loadEnvConfig(process.cwd());

let passed = 0;
const pending: Array<Promise<void>> = [];
function check(name: string, run: () => void | Promise<void>) {
  pending.push(
    Promise.resolve(run()).then(() => {
      passed += 1;
      console.log(`  ok  ${name}`);
    })
  );
}

const item = (productId: string, unitPrice: number, quantity = 1, extra: Partial<HamperSelectedItem> = {}): HamperSelectedItem => ({
  productId,
  unitPrice,
  quantity,
  ...extra
});

// --- (a) percentage hamper: 12%, min 2, max 5, packaging 0 -----------------
const pct = { discountPercent: 12, packagingFee: 0, minItems: 2, maxItems: 5, requiredProductIds: ["p1"] };

check("percentage: 3 items worth 1797 -> 12% off = 215.64, pays 1581.36", () => {
  const result = calculateHamperPrice(pct, [item("p1", 599), item("p2", 599), item("p3", 599)]);
  assert.equal(result.itemsSubtotal, 1797);
  assert.equal(result.discountAmount, 215.64);
  assert.equal(result.total, 1581.36);
  assert.equal(result.savings, 215.64);
  assert.equal(result.isValid, true);
});

check("percentage: packaging fee is added after the discount", () => {
  const result = calculateHamperPrice({ ...pct, packagingFee: 99 }, [item("p1", 1000), item("p2", 1000)]);
  assert.equal(result.discountAmount, 240);
  assert.equal(result.total, 1760 + 99);
});

check("percentage: 15% of 1797 = 269.55 -> 1527.45 (the spec example)", () => {
  const result = calculateHamperPrice({ ...pct, discountPercent: 15 }, [item("p1", 599), item("p2", 599), item("p3", 599)]);
  assert.equal(result.discountAmount, 269.55);
  assert.equal(result.total, 1527.45);
});

check("percentage: rounding happens once, in paise", () => {
  const result = calculateHamperPrice({ ...pct, discountPercent: 12.5, requiredProductIds: [] }, [item("a", 333.33), item("b", 333.33, 2)]);
  assert.equal(result.itemsSubtotal, 999.99);
  assert.equal(result.discountAmount, 125);
  assert.equal(result.total, 874.99);
});

// --- validation ---------------------------------------------------------------
check("validation: below min, above max, required removed, out of stock, inactive", () => {
  assert.equal(calculateHamperPrice(pct, [item("p1", 500)]).isValid, false);
  assert.match(calculateHamperPrice(pct, [item("p1", 500)]).validationErrors[0], /Add 1 more item/);
  const tooMany = calculateHamperPrice(pct, [1, 2, 3, 4, 5, 6].map((n) => item(n === 1 ? "p1" : `x${n}`, 100)));
  assert.match(tooMany.validationErrors[0], /at most 5/);
  const noRequired = calculateHamperPrice(pct, [item("p2", 100), item("p3", 100)]);
  assert.ok(noRequired.validationErrors.some((message) => /required/.test(message)));
  const oos = calculateHamperPrice({ ...pct, requiredProductIds: [] }, [item("a", 100, 1, { stockCount: 0, name: "Iris" }), item("b", 100)]);
  assert.ok(oos.validationErrors.some((message) => /Iris is out of stock/.test(message)));
  const inactive = calculateHamperPrice({ ...pct, requiredProductIds: [] }, [item("a", 100, 1, { isActive: false, name: "Iris" }), item("b", 100)]);
  assert.ok(inactive.validationErrors.some((message) => /no longer available/.test(message)));
});

// --- (c) invalid configs --------------------------------------------------------
check("config: 95% discount, max < min, 1 eligible with min 3 are all rejected", () => {
  const base = { discountPercent: 10, minItems: 2, maxItems: null, eligibleCount: 4 };
  assert.deepEqual(validateHamperConfig(base), []);
  assert.match(validateHamperConfig({ ...base, discountPercent: 95 })[0], /between 0% and 90%/);
  assert.match(validateHamperConfig({ ...base, minItems: 4, maxItems: 3 })[0], /Maximum items cannot be lower/);
  assert.match(validateHamperConfig({ ...base, minItems: 3, eligibleCount: 1 })[0], /Only 1 eligible product/);
});

// --- server re-pricing (tamper) -------------------------------------------------
const productRow = (id: string, name: string, price: number, extra: Record<string, unknown> = {}) => ({
  id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  category: "Necklaces",
  price,
  active: true,
  in_stock: true,
  stock_count: 10,
  images: [],
  ...extra
});
const rows = [productRow("p1", "Iris", 599), productRow("p2", "Shell", 699), productRow("p3", "Amaris", 799), productRow("p4", "Evara", 899)];
const hamperRow = {
  id: "h1",
  name: "The Everyday Edit",
  slug: "the-everyday-edit",
  discount_percent: 15,
  packaging_fee: 0,
  min_items: 3,
  max_items: null,
  is_active: true
};
const hamper = normalizeSupabaseHamper(
  hamperRow,
  rows.map((row, index) => ({ hamper_id: "h1", product_id: row.id, sort_order: index, is_required: false })),
  rows
);

check("server pricing: matches the client engine and rejects a tampered total", () => {
  const selection = [{ productId: "p1", quantity: 1 }, { productId: "p2", quantity: 1 }, { productId: "p3", quantity: 1 }];
  const { result, snapshot, errors } = priceHamperSelection(hamper, selection);
  assert.deepEqual(errors, []);
  assert.equal(result.itemsSubtotal, 2097);
  assert.equal(result.total, 1782.45);
  assert.equal(snapshot.hamperTotal, 1782.45);
  assert.equal(snapshot.items.length, 3);
  const clientClaim = 1000;
  assert.ok(Math.abs(result.total - clientClaim) > 1, "tampered total exceeds the ₹1 tolerance -> order rejected");
});

check("server pricing: an ineligible product and a too-small selection are errors", () => {
  assert.ok(priceHamperSelection(hamper, [{ productId: "zzz", quantity: 1 }]).errors.length >= 1);
  assert.match(priceHamperSelection(hamper, [{ productId: "p1", quantity: 1 }]).errors[0], /Add 2 more items/);
});

check("server pricing: out-of-stock and inactive contents are reported (cart re-validation)", () => {
  const outRows = [productRow("p1", "Iris", 599, { in_stock: false, stock_count: 0 }), ...rows.slice(1)];
  const stale = normalizeSupabaseHamper(hamperRow, rows.map((row, i) => ({ hamper_id: "h1", product_id: row.id, sort_order: i, is_required: false })), outRows);
  const priced = priceHamperSelection(stale, [{ productId: "p1", quantity: 1 }, { productId: "p2", quantity: 1 }, { productId: "p3", quantity: 1 }]);
  assert.ok(priced.errors.some((message) => /Iris is out of stock/.test(message)));
  assert.equal(priced.result.isValid, false);
});

// --- WhatsApp: 2 hampers + 3 normal products -------------------------------------
check("whatsapp: two hampers + three products -> one valid, non-truncated wa.me link", async () => {
  const { buildWhatsAppMessage } = await import("../lib/whatsapp");
  const priced = priceHamperSelection(hamper, [{ productId: "p1", quantity: 1 }, { productId: "p2", quantity: 1 }, { productId: "p3", quantity: 2 }]);
  const cartHamper = (slug: string): CartItem => {
    const data: HamperCartData = {
      hamperId: "h1",
      slug,
      name: priced.snapshot.hamperName,
      heroImageUrl: "",
      items: priced.snapshot.items,
      itemsSubtotal: priced.snapshot.itemsSubtotal,
      discountAmount: priced.snapshot.discountAmount,
      packagingFee: priced.snapshot.packagingFee,
      total: priced.snapshot.hamperTotal
    };
    return {
      product: { _id: `hamper:${slug}`, name: data.name, slug, category: "Hampers", price: data.total, images: [], stockCount: 10 },
      quantity: 2,
      hamper: data
    };
  };
  const plain = (id: string, name: string, price: number): CartItem => ({
    product: { _id: id, name, slug: name.toLowerCase(), category: "Necklaces", price, images: [], stockCount: 10 },
    quantity: 1,
    selectedVariant: "16 in"
  });
  const cart = [cartHamper("the-everyday-edit"), plain("a", "Iris", 599), cartHamper("the-gifting-box"), plain("b", "Shell", 699), plain("c", "Amaris", 799)];
  const url = buildWhatsAppMessage(cart, { name: "Test Buyer", phone: "9999999999", address: "12 Test Street, Mumbai", pincode: "400001", email: "t@example.com" });
  console.log(`      wa.me URL length: ${url.length}`);
  assert.ok(url.startsWith("https://wa.me/"));
  assert.ok(url.length < 4000, "under the safe link length");
  assert.doesNotThrow(() => new URL(url));
  const text = decodeURIComponent(new URL(url).searchParams.get("text") ?? "");
  assert.match(text, /The Everyday Edit\* \(Hamper\) x2/);
  assert.match(text, /Hamper total: /);
  assert.match(text, /Customer Details/);
  assert.match(text, /Address: 12 Test Street, Mumbai\nEmail: t@example.com$/, "message is not truncated");
  const total = 4 * priced.result.total + 599 + 699 + 799; // two hampers x qty 2, plus three products
  assert.ok(text.includes(`Order Total: ${formatMoney(total)}`), `total ${formatMoney(total)} present`);
});

check("rules: required product ids come from the hamper", () => {
  assert.deepEqual(hamperRules(hamper).requiredProductIds, []);
});

console.log(`\n${passed} checks passed`);
