import { API_BASE_URL } from "./client";

export interface MediaUploadResponse {
  status: string;
  id: string;
  url: string;
  data_url: string;
  filename: string;
  size?: number;
  content_type?: string;
}

/**
 * Resolves any media URL (relative /api/v1/media/..., full http/https, or base64 data)
 * to a fully qualified URL reachable by the client browser.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Uploads a local image File directly to the backend database (MongoDB).
 * Returns the persistent URL and base64 Data URL.
 * Falls back safely to base64 Data URL if backend is offline or unreachable.
 */
export async function uploadImageFile(file: File): Promise<MediaUploadResponse> {
  // Generate local data URL first for instant client preview and offline fallback
  const localDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/api/v1/media/upload`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      const resolvedUrl = data.url.startsWith("http")
        ? data.url
        : `${API_BASE_URL}${data.url}`;
      return {
        ...data,
        url: resolvedUrl,
        data_url: data.data_url || localDataUrl,
      };
    }
  } catch (err) {
    console.warn("Multipart upload failed, attempting base64 fallback:", err);
  }

  // Fallback to base64 endpoint
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/media/upload-base64`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data_url: localDataUrl,
        filename: file.name,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const resolvedUrl = data.url.startsWith("http")
        ? data.url
        : `${API_BASE_URL}${data.url}`;
      return {
        ...data,
        url: resolvedUrl,
        data_url: data.data_url || localDataUrl,
      };
    }
  } catch (err2) {
    console.warn("Base64 upload failed, using local Data URL fallback:", err2);
  }

  // If both multipart and base64 server storage failed, fail explicitly
  throw new Error("Failed to store image in server media storage. Please check your network connection and try again.");
}

export interface PageMediaConfig {
  page_id: string;
  title?: string;
  media_type: "gif" | "image";
  media_url: string;
  fallback_url?: string;
  is_active: boolean;
  opacity?: number;
  updated_at?: string;
  updated_by?: string;
}

export async function getAllPageMedia(): Promise<PageMediaConfig[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/media/pages`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Failed to fetch all page media:", e);
  }
  return [];
}

export async function getPageMedia(pageId: string): Promise<PageMediaConfig | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/media/pages/${pageId}`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn(`Failed to fetch media for page ${pageId}:`, e);
  }
  return null;
}

export async function updatePageMedia(
  pageId: string,
  payload: Partial<PageMediaConfig>
): Promise<PageMediaConfig> {
  const { apiClient } = await import("./client");
  return apiClient<PageMediaConfig>(`/media/pages/${pageId}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, page_id: pageId }),
  });
}
