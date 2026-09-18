import { fail, ok } from "@/lib/api";
import { assertAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeSupabaseOrder, orderPayloadToSupabase } from "@/lib/supabase-mappers";

type OrderPayload = {
  items: Array<{
    productId: string;
    name: string;
    image?: string;
    price: number;
    quantity: number;
    selectedVariant?: string;
  }>;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  pincode: string;
  totalAmount: number;
  whatsappSent?: boolean;
};

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
    const order = {
      orderNumber,
      items: payload.items,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail,
      deliveryAddress: payload.deliveryAddress,
      pincode: payload.pincode,
      totalAmount: payload.totalAmount,
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
    const orderItemRows = payload.items.map((item) => ({
      order_id: createdOrder.id,
      product_id: item.productId && /^[0-9a-f-]{36}$/i.test(item.productId) ? item.productId : null,
      product_name: item.name,
      image_url: item.image ?? null,
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 1),
      selected_variant: item.selectedVariant ?? null
    }));
    const { error: itemsError } = await supabase.from("order_items").insert(orderItemRows);
    if (itemsError) console.error("Failed to insert order_items:", itemsError.message);

    return ok({ order: normalizeSupabaseOrder(createdOrder) }, "Order created.", { status: 201 });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to create order.");
  }
}
