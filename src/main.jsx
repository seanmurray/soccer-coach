import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Dev-mode service-worker cleanup. vite-plugin-pwa only generates an SW in
// production builds, but a developer who once ran `npm run build/preview`
// can have a stale SW registered for localhost that then intercepts dev
// fetches — including outbound calls to supabase.co. Clear it on dev boot
// so we're not chasing ghost cache hits.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    if (regs.length > 0) {
      console.log('[dev] Unregistering', regs.length, 'service worker(s).');
      regs.forEach((r) => r.unregister());
    }
  }).catch(() => { /* ignore */ });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
