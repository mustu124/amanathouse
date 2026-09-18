import { fail, ok } from "@/lib/api";
import { assertAdmin } from "@/lib/admin-auth";
import { filterFallbackProducts, type StoreProduct } from "@/lib/product-data";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeSupabaseProduct, productPayloadToSupabase } from "@/lib/supabase-mappers";
import { formatZodError, productPayloadSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const sortMap: Record<string, Record<string, 1 | -1>> = {
  price_asc: { price: 1 },
  "price-asc": { price: 1 },
  price_desc: { price: -1 },
  "price-desc": { price: -1 },
  popular: { "rating.count": -1, "rating.average": -1 },
  newest: { createdAt: -1 }
};

function sortFallback(products: StoreProduct[], sort: string) {
  return [...products].sort((a, b) => {
    if (sort === "price_asc" || sort === "price-asc") return a.price - b.price;
    if (sort === "price_desc" || sort === "price-desc") return b.price - a.price;
    if (sort === "popular") return (b.popularScore ?? 0) - (a.popularScore ?? 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message || fallback);
  }
  return fallback;
}

async function createUniqueSlug(supabase: ReturnType<typeof getSupabaseAdmin>, desiredSlug: string) {
  const baseSlug = desiredSlug.trim() || `product-${Date.now()}`;
  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-%`);

  if (error) throw error;

  const existingSlugs = new Set((data ?? []).map((product) => String(product.slug)));
  if (!existingSlugs.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (existingSlugs.has(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get("admin") === "true";
    if (adminView) {
      const unauthorized = await assertAdmin();
      if (unauthorized) return unauthorized;
    }
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const featured = searchParams.get("featured") === "true";
    const exclude = searchParams.get("exclude");
    const sort = searchParams.get("sort") ?? "newest";
    const maxPrice = Number(searchParams.get("maxPrice") ?? 0);
    const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 12), 1), adminView ? 200 : 50);
    const supabaseConfigured = isSupabaseConfigured();
    const canUseFallback = process.env.NODE_ENV !== "production";
    const fallbackFiltered = sortFallback(filterFallbackProducts({ category, exclude, featured }), sort);
    const paginatedFallback = fallbackFiltered.slice((page - 1) * limit, page * limit);

    if (!supabaseConfigured) {
      if (!canUseFallback) {
        return fail("Supabase is not configured for this deployment.", 503);
      }

      return ok(
        {
          products: paginatedFallback,
          total: fallbackFiltered.length,
          page,
          hasMore: page * limit < fallbackFiltered.length,
          fallback: true
        },
        "Products loaded from fallback catalog."
      );
    }

    const supabase = getSupabaseAdmin();
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const sortColumn =
      sort === "price_asc" || sort === "price-asc"
        ? "price"
        : sort === "price_desc" || sort === "price-desc"
          ? "price"
          : "updated_at";
    const ascending = sort === "price_asc" || sort === "price-asc";

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .order(sortColumn, { ascending })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!adminView) query = query.eq("active", true);

    if (category) query = query.eq("category", category);
    if (subcategory) query = query.eq("subcategory", subcategory);
    if (maxPrice > 0) query = query.lte("price", maxPrice);
    if (featured) query = query.or("is_featured.eq.true,featured.eq.true");
    if (exclude) query = query.not("id", "eq", exclude).not("slug", "eq", exclude);

    const { data, error, count } = await query;
    if (error) throw error;
    const normalizedProducts = (data ?? []).map((product) => normalizeSupabaseProduct(product));
    const total = count ?? normalizedProducts.length;

    return ok(
      {
        products: normalizedProducts,
        total,
        page,
        hasMore: page * limit < total,
        fallback: false
      },
      "Products loaded."
    );
  } catch (error) {
    return fail(getErrorMessage(error, "Failed to load products."));
  }
}

export async function POST(request: Request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  try {
    const rawPayload = (await request.json()) as Record<string, unknown>;
    const parsed = productPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return fail(formatZodError(parsed.error), 400);
    }
    const payload = parsed.data;

    const supabase = getSupabaseAdmin();
    const productPayload = productPayloadToSupabase(payload);
    productPayload.slug = await createUniqueSlug(supabase, String(productPayload.slug));

    const { data: product, error } = await supabase
      .from("products")
      .insert(productPayload)
      .select("*")
      .single();

    if (error) throw error;
    return ok({ product: normalizeSupabaseProduct(product) }, "Product created.", { status: 201 });
  } catch (error) {
    return fail(getErrorMessage(error, "Failed to create product."));
  }
}
