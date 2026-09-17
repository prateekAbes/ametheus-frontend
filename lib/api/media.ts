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

  // Client-side local data URL fallback
  return {
    status: "client_fallback",
    id: `img_${Date.now()}`,
    url: localDataUrl,
    data_url: localDataUrl,
    filename: file.name,
    size: file.size,
    content_type: file.type || "image/png",
  };
}
