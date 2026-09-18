export function getSupabaseStoragePath(src?: string | null) {
  if (!src || src.startsWith("/api/media")) return null;
  if (!src.startsWith("http")) return null;

  try {
    const url = new URL(src);
    const marker = "/storage/v1/object/public/";
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) return null;
    const bucketAndPath = url.pathname.slice(markerIndex + marker.length);
    const firstSlash = bucketAndPath.indexOf("/");

    if (firstSlash === -1) return null;
    return decodeURIComponent(bucketAndPath.slice(firstSlash + 1));
  } catch {
    return null;
  }
}

export function getDisplayMediaUrl(src?: string | null) {
  const path = getSupabaseStoragePath(src);
  return path ? `/api/media?path=${encodeURIComponent(path)}` : src || "/placeholder-product.png";
}
