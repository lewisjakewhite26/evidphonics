import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'
import './globals.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML =
    '<p style="font-family:sans-serif;padding:1rem">Missing #root — check index.html</p>'
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <div id="app-content" className="min-h-[100dvh]">
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </div>
      </ErrorBoundary>
    </StrictMode>,
  )
}
