import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
