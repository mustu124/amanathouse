export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

export async function adminFetch<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers
    }
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MIN_IMAGE_DIMENSION = 400;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions."));
    };
    image.src = url;
  });
}

// The one image-file check for every admin uploader (products, hampers).
// Returns a readable problem, or null when the file is fine to upload.
export async function validateImageFile(file: File): Promise<string | null> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return `${file.name}: only JPG, PNG, or WebP images are supported.`;
  if (file.size > MAX_UPLOAD_BYTES) return `${file.name}: file is over 10MB.`;
  try {
    const { width, height } = await readImageDimensions(file);
    if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
      return `${file.name}: image is too small (${width}x${height}px) — use at least ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION}px.`;
    }
  } catch {
    return `${file.name}: couldn't read this image — try a different file.`;
  }
  return null;
}

// XHR (not fetch) because it's the only browser API that exposes upload
// progress events — used by the product image uploader's progress bars.
export function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<ApiResponse<{ url: string; publicId: string }>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const body = new FormData();
    body.append("file", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });

    xhr.addEventListener("load", () => {
      try {
        const payload = JSON.parse(xhr.responseText) as ApiResponse<{ url: string; publicId: string }>;
        if (xhr.status >= 200 && xhr.status < 300 && payload.success) {
          resolve(payload);
        } else {
          reject(new Error(payload.message || "Upload failed."));
        }
      } catch {
        reject(new Error("Upload failed."));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed — check your connection.")));
    xhr.open("POST", url);
    xhr.send(body);
  });
}

export function formatCurrency(value: number) {
  return `\u20B9${value.toLocaleString("en-IN")}`;
}

export function formatDate(value?: string | Date) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
