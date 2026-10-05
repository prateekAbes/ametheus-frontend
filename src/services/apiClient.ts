/**
 * AMETHEUS Centralized API Client & Base Fetcher (Greenfield Rebuild)
 */

const rawBase =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  'https://ametheus.duckdns.org'

export const API_BASE_URL = rawBase.replace(/\/+$/, '')

/**
 * Resolves a media URL against the API_BASE_URL if it is a relative path.
 * Retains absolute URLs (http, https, data:, blob:).
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed
  }
  if (trimmed.startsWith('/')) {
    return `${API_BASE_URL}${trimmed}`
  }
  return `${API_BASE_URL}/${trimmed}`
}

export interface ApiErrorResponse {
  detail?: string | { msg: string; type: string; loc?: (string | number)[] }[]
  message?: string
  code?: string
}

export class ApiError extends Error {
  statusCode: number
  data: ApiErrorResponse

  constructor(statusCode: number, data: ApiErrorResponse) {
    let message = ''
    if (typeof data.detail === 'string') {
      message = data.detail
    } else if (Array.isArray(data.detail)) {
      message = data.detail.map((d) => (d.loc ? `${d.loc.slice(-1)}: ${d.msg}` : d.msg)).join('; ')
    } else {
      message = data.message || `API request failed with status ${statusCode}`
    }
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.data = data
  }
}

let authTokenGetter: ((options?: { skipCache?: boolean }) => Promise<string | null>) | null = null
let authUserEmailGetter: (() => string | null) | null = null

export function setAuthTokenGetter(getter: (options?: { skipCache?: boolean }) => Promise<string | null>) {
  authTokenGetter = getter
}

export function setAuthUserEmailGetter(getter: (() => string | null) | null) {
  authUserEmailGetter = getter
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit & { _isRetry?: boolean } = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${API_BASE_URL}/api/v1${cleanEndpoint}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  const isProtected =
    cleanEndpoint.startsWith('/admin') ||
    cleanEndpoint.startsWith('/organizer') ||
    cleanEndpoint.startsWith('/auth/') ||
    cleanEndpoint.startsWith('/wallet') ||
    cleanEndpoint.startsWith('/teams') ||
    cleanEndpoint === '/tournaments/my-registrations' ||
    cleanEndpoint.startsWith('/my/') ||
    cleanEndpoint.startsWith('/support/my-tickets') ||
    (cleanEndpoint.startsWith('/tournaments/') && cleanEndpoint.includes('/register'))

  // Inject Bearer token if available
  if (!headers['Authorization'] && authTokenGetter) {
    try {
      let token = await authTokenGetter()
      if (!token && isProtected) {
        await new Promise((res) => setTimeout(res, 200))
        token = await authTokenGetter()
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    } catch {
      // Guest fallback
    }
  }

  // Inject user email header if available to assist authoritative server linking
  if (!headers['X-User-Email'] && authUserEmailGetter) {
    try {
      const email = authUserEmailGetter()
      if (email && email.trim()) {
        headers['X-User-Email'] = email.trim()
      }
    } catch {
      // Ignore
    }
  }

  if (isProtected && !headers['Authorization']) {
    throw new ApiError(401, {
      message: 'Authentication token not yet ready. Please sign in to proceed.',
    })
  }

  const { _isRetry, ...fetchOptions } = options

  let response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  // If unauthorized and we haven't retried yet, request a fresh token
  if (response.status === 401 && authTokenGetter && !_isRetry) {
    try {
      const freshToken = await authTokenGetter({ skipCache: true })
      const currentToken = headers['Authorization']
        ? headers['Authorization'].replace(/^Bearer\s+/i, '')
        : null
      if (freshToken && freshToken !== currentToken) {
        headers['Authorization'] = `Bearer ${freshToken}`
        response = await fetch(url, {
          ...fetchOptions,
          headers,
        })
      }
    } catch {
      // Ignore retry failure and proceed to error handling
    }
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiErrorResponse
    throw new ApiError(response.status, errorData)
  }

  return response.json()
}
