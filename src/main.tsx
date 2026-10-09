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

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={clerkPublishableKey}
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
