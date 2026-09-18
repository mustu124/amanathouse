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
