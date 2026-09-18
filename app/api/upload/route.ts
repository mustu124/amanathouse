import { fail, ok } from "@/lib/api";
import { assertAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("A file is required.", 400);
    }

    if (!allowedTypes.includes(file.type)) {
      return fail("Only jpg, png, and webp files are supported.", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = file.name.split(".").pop() || "webp";
    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const path = `images/${Date.now()}-${safeName}.${extension}`;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: true
    });

    if (error) throw error;

    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);

    return ok(
      {
        url: data.publicUrl,
        publicId: path,
        width: null,
        height: null
      },
      "File uploaded."
    );
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to upload file.");
  }
}
