/**
 * AMETHEUS Centralized API Client & Base Fetcher
 */

function resolveApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  let base = envUrl || 'https://api.ametheus.games'
  // Remove trailing slashes
  base = base.replace(/\/+$/, '')
  // If base already contains trailing /api/v1, strip it so we don't end up with /api/v1/api/v1
  if (base.endsWith('/api/v1')) {
    base = base.slice(0, -'/api/v1'.length).replace(/\/+$/, '')
  }
  return base || 'https://api.ametheus.games'
}

export const API_BASE_URL = resolveApiBaseUrl()

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
    if (trimmed.startsWith('data:image/svg+xml')) {
      if (trimmed.includes('<svg') || trimmed.includes('</svg>') || trimmed.includes('<') || trimmed.includes('>')) {
        const commaIndex = trimmed.indexOf(',')
        if (commaIndex !== -1) {
          const header = trimmed.slice(0, commaIndex)
          const body = trimmed.slice(commaIndex + 1)
          return `${header},${encodeURIComponent(body)}`
        }
      }
      return trimmed
    }
    if (trimmed.includes('images.unsplash.com') && !trimmed.includes('w=')) {
      const sep = trimmed.includes('?') ? '&' : '?'
      return `${trimmed}${sep}auto=format&fit=crop&q=75&w=800`
    }
    return trimmed
  }
  if (trimmed.startsWith('/assets/') || trimmed.startsWith('assets/')) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }
  if (trimmed.startsWith('img_')) {
    return `${API_BASE_URL}/api/v1/media/${trimmed}`
  }
  if (trimmed.startsWith('/media/') || trimmed.startsWith('media/')) {
    const id = trimmed.replace(/^\/?media\//, '')
    return `${API_BASE_URL}/api/v1/media/${id}`
  }
  if (trimmed.startsWith('/api/v1/')) {
    return `${API_BASE_URL}${trimmed}`
  }
  if (trimmed.startsWith('api/v1/')) {
    return `${API_BASE_URL}/${trimmed}`
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
    if (statusCode === 0) {
      message = 'Unable to connect. Please check your internet connection and try again.'
    } else if (typeof data.detail === 'string') {
      const d = data.detail
      // Filter out raw server stack traces or database error strings on server faults
      if (
        statusCode >= 500 &&
        (d.includes('Traceback') ||
          d.includes('pymongo') ||
          d.includes('MongoDB') ||
          d.includes('Internal Server Error') ||
          d.includes('ConnectionRefusedError'))
      ) {
        message = 'The service is temporarily unavailable. Please try again shortly.'
      } else {
        message = d
      }
    } else if (Array.isArray(data.detail)) {
      message = data.detail.map((d) => (d.loc ? `${d.loc.slice(-1)}: ${d.msg}` : d.msg)).join('; ')
    } else if (data.message) {
      message = data.message
    } else if (statusCode === 401) {
      message = 'Please sign in to continue.'
    } else if (statusCode === 403) {
      message = 'You do not have permission to perform this action.'
    } else if (statusCode === 404) {
      message = 'The requested resource was not found.'
    } else if (statusCode >= 500) {
      message = 'The service encountered an error. Please try again shortly.'
    } else {
      message = 'An unexpected error occurred. Please try again.'
    }
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.data = data
  }
}

let authTokenGetter: ((options?: { skipCache?: boolean }) => Promise<string | null>) | null = null
let authUserEmailGetter: (() => string | null) | null = null

export function setAuthTokenGetter(getter: ((options?: { skipCache?: boolean }) => Promise<string | null>) | null) {
  authTokenGetter = getter
}

export function setAuthUserEmailGetter(getter: (() => string | null) | null) {
  authUserEmailGetter = getter
}

function isProtectedEndpoint(endpoint: string, method: string = 'GET'): boolean {
  const ep = endpoint.toLowerCase()
  const m = method.toUpperCase()

  if (
    ep.startsWith('/admin') ||
    ep.startsWith('/organizer') ||
    ep.startsWith('/auth/me') ||
    ep.startsWith('/auth/sync') ||
    ep.startsWith('/auth/profile') ||
    ep.startsWith('/wallet') ||
    ep.startsWith('/payments') ||
    ep.startsWith('/teams') ||
    ep.startsWith('/notifications') ||
    ep.startsWith('/my/') ||
    ep.includes('/my-registrations') ||
    ep.includes('/my-tickets') ||
    ep.includes('/register') ||
    ep.includes('/submit-upi-utr') ||
    ep.includes('/check-in') ||
    ep.includes('/submit-result') ||
    ep.includes('/dispute')
  ) {
    return true
  }

  return false
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit & { _isRetry?: boolean } = {}
): Promise<T> {
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  if (cleanEndpoint.startsWith('/api/v1/')) {
    cleanEndpoint = cleanEndpoint.slice('/api/v1'.length)
  } else if (cleanEndpoint === '/api/v1') {
    cleanEndpoint = ''
  }

  const url = `${API_BASE_URL}/api/v1${cleanEndpoint}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  const method = (options.method || 'GET').toUpperCase()
  const isProtected = isProtectedEndpoint(cleanEndpoint, method)

  // Inject Bearer token if not already explicitly provided
  if (!headers['Authorization'] && authTokenGetter) {
    try {
      let token = await authTokenGetter()
      if (!token && isProtected) {
        // Short backoff to allow Clerk session resolution on first mount
        await new Promise((res) => setTimeout(res, 250))
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

  let response: Response
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    })
  } catch (netErr: any) {
    console.error(`[API Network Error] ${fetchOptions.method || 'GET'} ${endpoint}:`, netErr)
    throw new ApiError(0, {
      message: 'Unable to connect. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR',
    })
  }

  // If unauthorized and we haven't retried yet, request a fresh token
  if (response.status === 401 && authTokenGetter && !_isRetry) {
    try {
      const freshToken = await authTokenGetter({ skipCache: true })
      const currentToken = headers['Authorization']
        ? headers['Authorization'].replace(/^Bearer\s+/i, '').trim()
        : null
      if (freshToken && freshToken !== currentToken) {
        headers['Authorization'] = `Bearer ${freshToken}`
        return await apiClient<T>(endpoint, {
          ...options,
          _isRetry: true,
          headers,
        })
      }
    } catch {
      // Fall through to error handler
    }
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiErrorResponse
    throw new ApiError(response.status, errorData)
  }

  return response.json()
}
