/**
 * AMETHEUS Centralized API Client & Base Fetcher
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface ApiErrorResponse {
  detail?: string | { msg: string; type: string }[];
  message?: string;
  code?: string;
}

export class ApiError extends Error {
  statusCode: number;
  data: ApiErrorResponse;

  constructor(statusCode: number, data: ApiErrorResponse) {
    const message =
      typeof data.detail === "string"
        ? data.detail
        : data.message || `API request failed with status ${statusCode}`;
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

let authTokenGetter: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  authTokenGetter = getter;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}/api/v1${cleanEndpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  // Inject Bearer token if available
  if (!headers["Authorization"] && authTokenGetter) {
    try {
      const token = await authTokenGetter();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // Fallback or guest request
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiErrorResponse;
    throw new ApiError(response.status, errorData);
  }

  return response.json();
}
