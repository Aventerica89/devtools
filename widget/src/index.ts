import { render, h } from 'preact'
import { Toolbar } from './toolbar/FloatingButton'
import { initInterceptors } from './interceptors'
import { createApiClient } from './api/client'
import { ErrorToast } from './tools/ErrorToast'
import { BugReporter } from './tools/BugReporter'
import { QuickAI } from './tools/QuickAI'
import type { ErrorEntry } from './interceptors/errors'
import type { ApiClient } from './api/client'
import { useState, useCallback } from 'preact/hooks'

const WIDGET_CSS = [
  ':host { all: initial; }',
  '#devtools-root { font-family: system-ui, sans-serif; }',
].join('\n')

/**
 * Root app component that holds the Toolbar, ErrorToast,
 * and the inline BugReporter triggered from the toast.
 */
interface AppProps {
  readonly projectId: string
  readonly pinHash: string
  readonly apiBase: string
  readonly apiClient: ApiClient
}

function App({ projectId, pinHash, apiBase, apiClient }: AppProps) {
  const [bugFromError, setBugFromError] = useState<ErrorEntry | null>(null)

  const handleReportFromToast = useCallback((entry: ErrorEntry) => {
    setBugFromError(entry)
  }, [])

  const handleCloseBugReporter = useCallback(() => {
    setBugFromError(null)
  }, [])

  return h(
    'div',
    null,
    h(Toolbar, { projectId, pinHash, apiBase, apiClient }),
    h(ErrorToast, { onReportBug: handleReportFromToast }),
    h(QuickAI, { apiBase, pinHash }),
    // Inline bug reporter triggered from error toast
    bugFromError
      ? h(
          'div',
          {
            style: {
              position: 'fixed',
              bottom: '80px',
              right: '20px',
              width: '340px',
              maxHeight: '400px',
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              zIndex: '999997',
              overflow: 'auto',
            },
          },
          h(BugReporter, {
            apiClient,
            projectId,
            prefillTitle: bugFromError.message,
            prefillStack: bugFromError.stack,
            onClose: handleCloseBugReporter,
          })
        )
      : null
  )
}

function init() {
  const script = document.currentScript as HTMLScriptElement
  const projectId = script?.getAttribute('data-project') || 'default'
  const pinHash = script?.getAttribute('data-pin') || ''
  const apiBase = script?.src.replace('/widget.js', '') || ''

  // Create API client
  const apiClient = createApiClient(apiBase, pinHash)

  // Create shadow DOM host
  const host = document.createElement('div')
  host.id = 'devtools-widget'
  document.body.appendChild(host)
  const shadow = host.attachShadow({ mode: 'open' })

  // Inject styles
  const style = document.createElement('style')
  style.textContent = WIDGET_CSS
  shadow.appendChild(style)

  // Mount Preact app
  const root = document.createElement('div')
  root.id = 'devtools-root'
  shadow.appendChild(root)
  render(h(App, { projectId, pinHash, apiBase, apiClient }), root)

  // Start interceptors
  initInterceptors(projectId, pinHash, apiBase)
}

// Auto-init when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
