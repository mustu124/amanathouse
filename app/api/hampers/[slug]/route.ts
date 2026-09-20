import { fail, ok } from "@/lib/api";
import { assertAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { friendlyHamperDbError, getHamperById, getHamperBySlug, saveHamper } from "@/lib/server-hampers";
import { formatZodError, hamperPayloadSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The [slug] segment accepts either the slug or the UUID (admin screens use the id).
function lookup(identifier: string, includeInactive: boolean) {
  return UUID.test(identifier)
    ? getHamperById(identifier, { includeInactive })
    : getHamperBySlug(identifier, { includeInactive });
}

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const includeInactive = new URL(request.url).searchParams.get("admin") === "true";
  if (includeInactive) {
    const unauthorized = await assertAdmin();
    if (unauthorized) return unauthorized;
  }

  const hamper = await lookup(params.slug, includeInactive);
  if (!hamper) return fail("Hamper not found.", 404);
  return ok({ hamper }, "Hamper loaded.");
}

export async function PUT(request: Request, { params }: { params: { slug: string } }) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  try {
    const existing = await lookup(params.slug, true);
    if (!existing) return fail("Hamper not found.", 404);

    const parsed = hamperPayloadSchema.safeParse(await request.json());
    if (!parsed.success) return fail(formatZodError(parsed.error), 400);

    const saved = await saveHamper(parsed.data, existing._id);
    if ("error" in saved) return fail(saved.error, saved.status);

    const hamper = await getHamperById(saved.hamperId, { includeInactive: true });
    return ok({ hamper }, "Hamper updated.");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to update hamper.");
  }
}

// Hard-deletes a hamper nobody has ordered; a hamper that appears in past
// orders is archived (hidden from the storefront) so history stays intact.
export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  try {
    const existing = await lookup(params.slug, true);
    if (!existing) return fail("Hamper not found.", 404);

    const supabase = getSupabaseAdmin();
    const { count, error: countError } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("hamper_id", existing._id);
    if (countError) return fail(friendlyHamperDbError(countError), 500);

    if ((count ?? 0) > 0) {
      const { error } = await supabase.from("hampers").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", existing._id);
      if (error) return fail(friendlyHamperDbError(error), 500);
      return ok(
        { archived: true },
        `This hamper appears in ${count} past order${count === 1 ? "" : "s"}, so it was archived (hidden from the shop) instead of deleted.`
      );
    }

    const { error } = await supabase.from("hampers").delete().eq("id", existing._id);
    if (error) return fail(friendlyHamperDbError(error), 500);
    return ok({ archived: false }, "Hamper deleted.");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to delete hamper.");
  }
}
