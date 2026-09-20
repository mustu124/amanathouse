import { fail, ok } from "@/lib/api";
import { assertAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeSupabaseOrder, orderPayloadToSupabase } from "@/lib/supabase-mappers";
import { getHamperBySlug, priceHamperSelection, type HamperSelectionInput } from "@/lib/server-hampers";
import type { HamperSnapshot } from "@/lib/hampers";

type OrderPayload = {
  items: Array<{
    productId: string;
    name: string;
    image?: string;
    price: number;
    quantity: number;
    selectedVariant?: string;
    itemType?: "product" | "hamper";
    hamperSlug?: string;
    hamperItems?: HamperSelectionInput[];
  }>;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  pincode: string;
  totalAmount: number;
  whatsappSent?: boolean;
};

type PricedItem = OrderPayload["items"][number] & { hamperSnapshot?: HamperSnapshot; hamperId?: string };

// Total tolerance between what the browser computed and what the server
// recomputes from fresh prices (in rupees).
const TOTAL_TOLERANCE = 1;

// Re-prices every line from the database. Returns the trusted items + total,
// or an error message when the client's numbers can't be reconciled.
async function repriceItems(items: OrderPayload["items"], clientTotal: number) {
  const supabase = getSupabaseAdmin();
  const productIds = items
    .filter((item) => item.itemType !== "hamper" && /^[0-9a-f-]{36}$/i.test(item.productId))
    .map((item) => item.productId);
  const { data: productRows, error } = productIds.length
    ? await supabase.from("products").select("id, name, price, active, in_stock, stock_count").in("id", productIds)
    : { data: [], error: null };
  if (error) throw error;
  const freshById = new Map((productRows ?? []).map((row) => [row.id as string, row]));

  const priced: PricedItem[] = [];
  let serverTotalPaise = 0;

  for (const item of items) {
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));

    if (item.itemType === "hamper") {
      const hamper = item.hamperSlug ? await getHamperBySlug(item.hamperSlug) : null;
      if (!hamper) return { error: `"${item.name}" is no longer available. Please remove it from your cart.` };
      const { result, snapshot, errors } = priceHamperSelection(hamper, item.hamperItems ?? []);
      if (errors.length) return { error: `${hamper.name}: ${errors[0]}` };
      serverTotalPaise += Math.round(result.total * 100) * quantity;
      priced.push({ ...item, quantity, price: result.total, hamperSnapshot: snapshot, hamperId: hamper._id });
      continue;
    }

    const fresh = freshById.get(item.productId);
    if (!fresh && /^[0-9a-f-]{36}$/i.test(item.productId)) {
      return { error: `"${item.name}" is no longer available. Please remove it from your cart.` };
    }
    const unitPrice = fresh ? Number(fresh.price) : Number(item.price ?? 0);
    if (fresh && fresh.active === false) return { error: `"${item.name}" is no longer available.` };
    serverTotalPaise += Math.round(unitPrice * 100) * quantity;
    priced.push({ ...item, quantity, price: unitPrice });
  }

  const serverTotal = serverTotalPaise / 100;
  if (Math.abs(serverTotal - Number(clientTotal)) > TOTAL_TOLERANCE) {
    return { error: "Prices have changed since your cart was built. Please review your cart and try again." };
  }
  return { priced, serverTotal };
}

function buildOrderNumber() {
  const year = new Date().getFullYear();
  const suffix = Math.floor(100 + Math.random() * 900);
  return `AH-${year}-${Date.now().toString().slice(-4)}${suffix}`;
}

export async function GET(request: Request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 20), 1), 50);
    const supabase = getSupabaseAdmin();
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;
    const orders = (data ?? []).map((order) => normalizeSupabaseOrder(order));
    const total = count ?? orders.length;

    return ok({ orders, total, page, hasMore: page * limit < total }, "Orders loaded.");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to load orders.");
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as OrderPayload;

    if (
      !payload.customerName ||
      !payload.customerPhone ||
      !payload.deliveryAddress ||
      !payload.pincode ||
      !payload.items?.length
    ) {
      return fail("Missing required order fields.", 400);
    }

    const orderNumber = buildOrderNumber();
    let orderItems: PricedItem[] = payload.items;
    let orderTotal = payload.totalAmount;

    if (isSupabaseConfigured()) {
      const repriced = await repriceItems(payload.items, payload.totalAmount);
      if ("error" in repriced) return fail(repriced.error ?? "Order could not be verified.", 409);
      orderItems = repriced.priced ?? payload.items;
      orderTotal = repriced.serverTotal ?? payload.totalAmount;
    }

    const order = {
      orderNumber,
      items: orderItems.map(({ hamperSnapshot, ...item }) => (hamperSnapshot ? { ...item, hamperContents: hamperSnapshot } : item)),
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail,
      deliveryAddress: payload.deliveryAddress,
      pincode: payload.pincode,
      totalAmount: orderTotal,
      status: "pending",
      whatsappSent: Boolean(payload.whatsappSent)
    };
    if (!isSupabaseConfigured()) {
      return ok({ order: { ...order, _id: orderNumber }, fallback: true }, "Order created.", { status: 201 });
    }

    const supabase = getSupabaseAdmin();
    const { data: createdOrder, error } = await supabase
      .from("orders")
      .insert(orderPayloadToSupabase(order))
      .select("*")
      .single();

    if (error) throw error;

    // orders.items (jsonb) stays the source of truth for the admin UI and
    // WhatsApp message text. order_items is a normalized side-table for
    // reporting/joins — best-effort, never blocks the order itself.
    const orderItemRows = orderItems.map((item) => ({
      order_id: createdOrder.id,
      product_id:
        !item.hamperSnapshot && item.productId && /^[0-9a-f-]{36}$/i.test(item.productId) ? item.productId : null,
      product_name: item.name,
      image_url: item.image ?? null,
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 1),
      selected_variant: item.selectedVariant ?? null,
      item_type: item.hamperSnapshot ? "hamper" : "product",
      hamper_id: item.hamperId ?? null,
      hamper_contents: item.hamperSnapshot ?? null
    }));
    const { error: itemsError } = await supabase.from("order_items").insert(orderItemRows);
    if (itemsError) console.error("Failed to insert order_items:", itemsError.message);

    return ok({ order: normalizeSupabaseOrder(createdOrder) }, "Order created.", { status: 201 });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to create order.");
  }
}
