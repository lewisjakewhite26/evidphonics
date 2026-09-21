import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'
import './globals.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML =
    '<p style="font-family:sans-serif;padding:1rem">Missing #root. Check index.html</p>'
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <div id="app-content" className="min-h-[100dvh]">
          {/* Global reduced-motion switch: disables transform/layout animation (scale, rotate,
              x/y springs — the pop-in used across every activity component) for anyone with
              the OS "reduce motion" preference set, without touching each component. */}
          <MotionConfig reducedMotion="user">
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </MotionConfig>
        </div>
      </ErrorBoundary>
    </StrictMode>,
  )
}
