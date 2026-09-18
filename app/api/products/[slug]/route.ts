import { fail, ok } from "@/lib/api";
import { assertAdmin } from "@/lib/admin-auth";
import { fallbackProducts, normalizeProduct } from "@/lib/product-data";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeSupabaseProduct, productPayloadToSupabase } from "@/lib/supabase-mappers";
import { formatZodError, productPayloadSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message || fallback);
  }
  return fallback;
}

async function findProductBySlugOrId(supabase: ReturnType<typeof getSupabaseAdmin>, slugOrId: string, onlyActive = false) {
  let slugQuery = supabase.from("products").select("*").eq("slug", slugOrId);
  if (onlyActive) slugQuery = slugQuery.eq("active", true);

  const slugResult = await slugQuery.maybeSingle();
  if (slugResult.error || slugResult.data || !uuidPattern.test(slugOrId)) {
    return slugResult;
  }

  let idQuery = supabase.from("products").select("*").eq("id", slugOrId);
  if (onlyActive) idQuery = idQuery.eq("active", true);
  return idQuery.maybeSingle();
}

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const adminView = new URL(request.url).searchParams.get("admin") === "true";
    if (adminView) {
      const unauthorized = await assertAdmin();
      if (unauthorized) return unauthorized;
    }

    const fallbackProduct = fallbackProducts.find(
      (product) => product.slug === params.slug || product._id === params.slug
    );
    const supabaseConfigured = isSupabaseConfigured();
    const canUseFallback = process.env.NODE_ENV !== "production";

    if (!supabaseConfigured) {
      if (!canUseFallback) {
        return fail("Supabase is not configured for this deployment.", 503);
      }

      if (!fallbackProduct) return fail("Product not found.", 404);
      return ok({ product: normalizeProduct(fallbackProduct as unknown as Record<string, unknown>), fallback: true }, "Product loaded.");
    }

    const supabase = getSupabaseAdmin();
    const { data: product, error } = await findProductBySlugOrId(supabase, params.slug, !adminView);

    if (error) throw error;

    if (!product && (!canUseFallback || !fallbackProduct)) return fail("Product not found.", 404);

    return ok(
      {
        product: product
          ? normalizeSupabaseProduct(product)
          : normalizeProduct(fallbackProduct as unknown as Record<string, unknown>),
        fallback: !product
      },
      "Product loaded."
    );
  } catch (error) {
    return fail(getErrorMessage(error, "Failed to load product."));
  }
}

export async function PUT(request: Request, { params }: { params: { slug: string } }) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const supabase = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await findProductBySlugOrId(supabase, params.slug);

    if (lookupError) throw lookupError;
    if (!existing) return fail("Product not found.", 404);

    const merged = { ...normalizeSupabaseProduct(existing), ...payload };
    const parsed = productPayloadSchema.safeParse(merged);
    if (!parsed.success) {
      return fail(formatZodError(parsed.error), 400);
    }

    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const { data: collision, error: collisionError } = await supabase
        .from("products")
        .select("id")
        .eq("slug", parsed.data.slug)
        .neq("id", existing.id)
        .maybeSingle();
      if (collisionError) throw collisionError;
      if (collision) {
        return fail(`The slug "${parsed.data.slug}" is already used by another product — choose a different one.`, 409);
      }
    }

    const { data: product, error } = await supabase
      .from("products")
      .update(productPayloadToSupabase(parsed.data))
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw error;
    return ok({ product: normalizeSupabaseProduct(product) }, "Product updated.");
  } catch (error) {
    return fail(getErrorMessage(error, "Failed to update product."));
  }
}

export async function DELETE(_: Request, { params }: { params: { slug: string } }) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await findProductBySlugOrId(supabase, params.slug);

    if (lookupError) throw lookupError;
    if (!existing) return fail("Product not found.", 404);

    const { data: product, error } = await supabase
      .from("products")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw error;
    return ok({ product: normalizeSupabaseProduct(product) }, "Product deleted.");
  } catch (error) {
    return fail(getErrorMessage(error, "Failed to delete product."));
  }
}
