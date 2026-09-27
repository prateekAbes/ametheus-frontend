/**
 * AMETHEUS Centralized API Client & Base Fetcher
 */

const rawBase = process.env.NEXT_PUBLIC_API_URL?.trim() || "https://ametheus.duckdns.org";
export const API_BASE_URL = rawBase.replace(/\/+$/, "");

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

let authTokenGetter: ((options?: { skipCache?: boolean }) => Promise<string | null>) | null = null;

export function setAuthTokenGetter(getter: (options?: { skipCache?: boolean }) => Promise<string | null>) {
  authTokenGetter = getter;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit & { _isRetry?: boolean } = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}/api/v1${cleanEndpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const isProtected = cleanEndpoint.startsWith("/admin/") || cleanEndpoint === "/auth/me";

  // Inject Bearer token if available
  if (!headers["Authorization"] && authTokenGetter) {
    try {
      let token = await authTokenGetter();
      // If token not ready yet on protected route, retry once after short delay
      if (!token && isProtected) {
        await new Promise((res) => setTimeout(res, 200));
        token = await authTokenGetter();
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // Fallback or guest request
    }
  }

  // Prevent sending guaranteed-to-fail unauthenticated requests to protected APIs
  if (isProtected && !headers["Authorization"]) {
    throw new ApiError(401, {
      message: "Authentication token not yet ready. Please wait for session to initialize.",
    });
  }

  const { _isRetry, ...fetchOptions } = options;

  let response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // If unauthorized and we haven't retried yet, request a fresh token (skipCache) and retry once
  if (response.status === 401 && authTokenGetter && !_isRetry) {
    try {
      const freshToken = await authTokenGetter({ skipCache: true });
      const currentToken = headers["Authorization"] ? headers["Authorization"].replace(/^Bearer\s+/i, "") : null;
      if (freshToken && freshToken !== currentToken) {
        headers["Authorization"] = `Bearer ${freshToken}`;
        response = await fetch(url, {
          ...fetchOptions,
          headers,
        });
      }
    } catch {
      // Ignore retry failure and proceed to error handling
    }
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiErrorResponse;
    throw new ApiError(response.status, errorData);
  }

  return response.json();
}
