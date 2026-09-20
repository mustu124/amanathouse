import { fail } from "@/lib/api";
import { getSupabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

const allowedPrefixes = ["products/", "gallery/", "uploads/", "homepage/", "images/", "hampers/"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path || path.includes("..") || !allowedPrefixes.some((prefix) => path.startsWith(prefix))) {
      return fail("Invalid media path.", 400);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download(path);

    if (error || !data) {
      return fail("Media not found.", 404);
    }

    return new Response(data, {
      headers: {
        "Content-Type": data.type || contentTypeForPath(path),
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800"
      }
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to load media.");
  }
}

function contentTypeForPath(path: string) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
