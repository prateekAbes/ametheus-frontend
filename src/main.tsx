import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import App from './App'
import './index.css'
import { initAppearance } from './lib/appearance'

import { router } from './routes'
import { ametheusClerkAppearance } from './lib/clerkTheme'

// Initialize user's persisted appearance palette and accent before render
initAppearance()

// Gracefully handle Vite lazy-loaded module hash updates after deployments
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const key = 'ametheus_chunk_reload_ts'
  const lastReload = sessionStorage.getItem(key)
  const now = Date.now()
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem(key, String(now))
    window.location.reload()
  }
})

function extractClerkFrontendApi(publishableKey: string): string | null {
  try {
    const parts = publishableKey.trim().split('_')
    if (parts.length >= 3 && parts[2]) {
      const decoded = atob(parts[2])
      if (decoded.endsWith('$')) {
        return decoded.slice(0, -1)
      }
    }
  } catch {
    // Graceful fallback if base64 decoding fails
  }
  return null
}

const rawPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!rawPublishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

const clerkPublishableKey = rawPublishableKey.trim()
const decodedFrontendApi = extractClerkFrontendApi(clerkPublishableKey)
const explicitProxyUrl = (import.meta.env.VITE_CLERK_PROXY_URL as string | undefined)?.trim()

// Prevent ClerkJS auto-proxy 405 on Vercel preview:
// When running on *.vercel.app with a production key (pk_live_...), ClerkJS automatically defaults
// proxyUrl to `${origin}/__clerk` expecting a Next.js server with clerkMiddleware.
// Because Ametheus is a static Vite SPA, Vercel receives POST /__clerk/*, rewrites to /index.html,
// and rejects with 405 Method Not Allowed.
// Dynamically setting proxyUrl to the decoded Frontend API ensures requests go directly to Clerk
// without hardcoding any production domain.
const resolvedProxyUrl: string | undefined = (() => {
  if (explicitProxyUrl) {
    return explicitProxyUrl
  }

  const isVercelHost =
    typeof window !== 'undefined' &&
    window.location.hostname.endsWith('.vercel.app')

  if (isVercelHost && clerkPublishableKey.startsWith('pk_live_') && decodedFrontendApi) {
    return `https://${decodedFrontendApi}`
  }

  return undefined
})()

if (typeof window !== 'undefined') {
  if ((window as any).__clerk_proxy_url === '/__clerk') {
    delete (window as any).__clerk_proxy_url
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      proxyUrl={resolvedProxyUrl}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/"
      routerPush={(to) => router.navigate(to)}
      routerReplace={(to) => router.navigate(to, { replace: true })}
      appearance={ametheusClerkAppearance}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
