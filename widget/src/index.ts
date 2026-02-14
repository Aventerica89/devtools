import { render, h } from 'preact'
import { Toolbar } from './toolbar/FloatingButton'
import { initInterceptors } from './interceptors'

const WIDGET_CSS = [
  ':host { all: initial; }',
  '#devtools-root { font-family: system-ui, sans-serif; }',
].join('\n')

function init() {
  const script = document.currentScript as HTMLScriptElement
  const projectId = script?.getAttribute('data-project') || 'default'
  const pinHash = script?.getAttribute('data-pin') || ''
  const apiBase = script?.src.replace('/widget.js', '') || ''

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
  render(h(Toolbar, { projectId, pinHash, apiBase }), root)

  // Start interceptors
  initInterceptors(projectId, pinHash, apiBase)
}

// Auto-init when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
