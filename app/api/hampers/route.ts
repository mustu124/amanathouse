import { fail, ok } from "@/lib/api";
import { assertAdmin } from "@/lib/admin-auth";
import { listHampers, saveHamper, getHamperById } from "@/lib/server-hampers";
import { formatZodError, hamperPayloadSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("admin") === "true";

  if (includeInactive) {
    const unauthorized = await assertAdmin();
    if (unauthorized) return unauthorized;
  }

  const hampers = await listHampers({ includeInactive });
  return ok({ hampers }, "Hampers loaded.");
}

export async function POST(request: Request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  try {
    const parsed = hamperPayloadSchema.safeParse(await request.json());
    if (!parsed.success) return fail(formatZodError(parsed.error), 400);

    const saved = await saveHamper(parsed.data);
    if ("error" in saved) return fail(saved.error, saved.status);

    const hamper = await getHamperById(saved.hamperId, { includeInactive: true });
    return ok({ hamper }, "Hamper created.", { status: 201 });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to create hamper.");
  }
}
