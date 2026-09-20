import { fail, ok } from "@/lib/api";
import { getHamperBySlug, priceHamperSelection, type HamperSelectionInput } from "@/lib/server-hampers";

export const dynamic = "force-dynamic";

// Re-prices a hamper selection against fresh DB prices/stock. Used by the cart
// to re-validate saved hamper lines; the same helper backs the order API.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { slug?: string; items?: HamperSelectionInput[] };
    if (!body.slug || !Array.isArray(body.items)) return fail("slug and items are required.", 400);

    const hamper = await getHamperBySlug(body.slug);
    if (!hamper) return fail("This hamper is no longer available.", 404);

    const { result, snapshot, errors } = priceHamperSelection(hamper, body.items);
    return ok({ result, snapshot, errors }, "Hamper priced.");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to price hamper.");
  }
}
