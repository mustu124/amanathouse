// Live end-to-end checks against the real database + running server
// (http://localhost:3000). Creates temporary rows and removes them again.
//   npm run verify:hampers
import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
const BASE = process.env.VERIFY_BASE_URL || "http://localhost:3000";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string, {
  auth: { persistSession: false }
});

const say = (label: string, value: unknown) => console.log(`${label}: ${typeof value === "string" ? value : JSON.stringify(value)}`);
const post = async (path: string, body: unknown) => {
  const response = await fetch(`${BASE}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { status: response.status, json: (await response.json()) as { success: boolean; message: string; data: Record<string, any> } };
};

async function main() {
  const { saveHamper } = await import("../lib/server-hampers");
  const { data: products } = await supabase.from("products").select("id,name,price,stock_count").eq("active", true).order("price");
  if (!products || products.length < 6) throw new Error("need 6+ products");
  const cheap = products.slice(0, 6);
  const rich = products.slice(-5);

  // a) percentage hamper 12%, min 2, max 5, 6 eligible, 1 required
  const created = await saveHamper({
    name: "ZZ Verify Percent", slug: "zz-verify-percent", pricingMode: "percentage", discountPercent: 12, packagingFee: 0,
    minItems: 2, maxItems: 5, isActive: true, isPlaceholder: true, products: cheap.map((p, i) => ({ productId: p.id, isRequired: i === 0, sortOrder: i }))
  });
  say("a) created percentage hamper", created);
  const a = await post("/api/hampers/price", { slug: "zz-verify-percent", items: cheap.slice(0, 3).map((p) => ({ productId: p.id, quantity: 1 })) });
  const subtotal = cheap.slice(0, 3).reduce((s, p) => s + Number(p.price), 0);
  say("a) basket", { items: cheap.slice(0, 3).map((p) => `${p.name} ${p.price}`), subtotal, expectedDiscount: +(subtotal * 0.12).toFixed(2), expectedTotal: +(subtotal * 0.88).toFixed(2) });
  say("a) server says", a.json.data.result);

  // b) fixed hamper 1499, min 2: cheapest vs priciest
  const fixedCreated = await saveHamper({
    name: "ZZ Verify Fixed", slug: "zz-verify-fixed", pricingMode: "fixed", fixedPrice: 1499, packagingFee: 0, minItems: 2, maxItems: null,
    isActive: true, isPlaceholder: true, products: [...cheap.slice(0, 2), ...rich].map((p, i) => ({ productId: p.id, isRequired: false, sortOrder: i }))
  });
  say("b) created fixed hamper", fixedCreated);
  const cheapest = await post("/api/hampers/price", { slug: "zz-verify-fixed", items: cheap.slice(0, 2).map((p) => ({ productId: p.id, quantity: 1 })) });
  const priciest = await post("/api/hampers/price", { slug: "zz-verify-fixed", items: rich.map((p) => ({ productId: p.id, quantity: 1 })) });
  say("b) two cheapest total/savings", [cheapest.json.data.result.total, cheapest.json.data.result.savings]);
  say("b) five priciest total/savings", [priciest.json.data.result.total, priciest.json.data.result.savings]);

  // c) invalid configs blocked (app layer) and at the DB constraint
  const app = async (label: string, payload: Parameters<typeof saveHamper>[0]) => {
    const result = await saveHamper(payload);
    say(`c) app-layer ${label}`, "error" in result ? result.error : "SAVED (unexpected)");
  };
  const base = { name: "ZZ Bad", slug: "zz-bad", pricingMode: "percentage" as const, discountPercent: 10, minItems: 2, maxItems: null, products: cheap.map((p) => ({ productId: p.id })) };
  await app("95% discount", { ...base, discountPercent: 95 });
  await app("fixed price 0", { ...base, pricingMode: "fixed", fixedPrice: 0 });
  await app("max < min", { ...base, minItems: 4, maxItems: 3 });
  await app("1 eligible, min 3", { ...base, minItems: 3, products: [{ productId: cheap[0].id }] });
  const row = { name: "ZZ Bad", slug: "zz-bad-db", short_description: "", long_description: "", hero_image_url: "" };
  for (const [label, extra] of [
    ["95% discount", { pricing_mode: "percentage", discount_percent: 95, min_items: 2 }],
    ["fixed price 0", { pricing_mode: "fixed", fixed_price: 0, min_items: 2 }],
    ["max < min", { pricing_mode: "percentage", discount_percent: 10, min_items: 4, max_items: 3 }],
    ["min 0", { pricing_mode: "percentage", discount_percent: 10, min_items: 0 }]
  ] as const) {
    const { error } = await supabase.from("hampers").insert({ ...row, ...extra });
    say(`c) DB constraint ${label}`, error ? `${error.code} ${error.message}` : "INSERTED (unexpected)");
  }

  // f) out-of-stock contained product -> notice data
  const target = cheap[1];
  await supabase.from("products").update({ in_stock: false, stock_count: 0 }).eq("id", target.id);
  const oos = await post("/api/hampers/price", { slug: "zz-verify-percent", items: cheap.slice(0, 3).map((p) => ({ productId: p.id, quantity: 1 })) });
  say("f) with a contained product out of stock", oos.json.data.errors);
  await supabase.from("products").update({ in_stock: true, stock_count: target.stock_count }).eq("id", target.id);

  // g) tamper: hamper + product with a lowered total
  const selection = cheap.slice(0, 3).map((p) => ({ productId: p.id, quantity: 1 }));
  const honest = a.json.data.result.total as number;
  const line = { itemType: "hamper", productId: "x", name: "ZZ Verify Percent", price: honest, quantity: 1, hamperSlug: "zz-verify-percent", hamperItems: selection };
  const customer = { customerName: "ZZ Test Order", customerPhone: "9999999999", deliveryAddress: "Test", pincode: "400001" };
  const tampered = await post("/api/orders", { ...customer, items: [line], totalAmount: 100 });
  say("g) tampered total (100) ->", [tampered.status, tampered.json.message]);

  // h) real order: 1 hamper + 1 normal product
  const normal = cheap[3];
  const orderTotal = honest + Number(normal.price);
  const placed = await post("/api/orders", {
    ...customer,
    items: [line, { productId: normal.id, name: normal.name, price: Number(normal.price), quantity: 1 }],
    totalAmount: orderTotal
  });
  say("h) honest order ->", [placed.status, placed.json.message]);
  const orderNumber = placed.json.data?.order?.orderNumber as string | undefined;
  if (orderNumber) {
    const { data: order } = await supabase.from("orders").select("id,total_amount,items").eq("order_number", orderNumber).single();
    const { data: items } = await supabase.from("order_items").select("item_type,hamper_id,product_name,price,hamper_contents").eq("order_id", order?.id);
    say("h) orders.total_amount", order?.total_amount);
    say("h) order_items", (items ?? []).map((i) => ({ type: i.item_type, name: i.product_name, price: i.price, hasSnapshot: Boolean(i.hamper_contents), snapshotTotal: i.hamper_contents?.hamperTotal, snapshotItems: i.hamper_contents?.items?.length })));

    // delete guard: hamper is now in an order -> archive instead of delete
    const hamperId = created && "hamperId" in created ? created.hamperId : "";
    const { count } = await supabase.from("order_items").select("id", { count: "exact", head: true }).eq("hamper_id", hamperId);
    say("h) order_items referencing the hamper (delete would archive)", count);

    await supabase.from("orders").delete().eq("id", order?.id);
    say("h) test order removed", orderNumber);
  }

  // cleanup
  await supabase.from("hampers").delete().in("slug", ["zz-verify-percent", "zz-verify-fixed"]);
  const { count: left } = await supabase.from("hampers").select("id", { count: "exact", head: true }).like("slug", "zz-%");
  say("cleanup: leftover zz- hampers", left);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
