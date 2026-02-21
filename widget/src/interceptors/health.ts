export interface HealthIssue {
  severity: 'error' | 'warn'
  category: 'image' | 'mixed-content' | 'alt-text' | 'slow-resource' | 'cors'
  message: string
  detail?: string
}

const issues: HealthIssue[] = []
const listeners: Array<() => void> = []

function push(issue: HealthIssue) {
  issues.push(issue)
  listeners.forEach((fn) => fn())
}

export function getHealthIssues(): HealthIssue[] { return [...issues] }
export function getHealthIssueCount(): number { return issues.length }
export function subscribeHealth(fn: () => void): () => void {
  listeners.push(fn)
  return () => listeners.splice(listeners.indexOf(fn), 1)
}

export function installHealthInterceptor() {
  // Broken images already in DOM
  document.querySelectorAll('img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && img.src) {
      push({ severity: 'error', category: 'image', message: 'Broken image', detail: img.src })
    }
  })

  // Missing alt text
  const noAlt = document.querySelectorAll('img:not([alt])')
  if (noAlt.length > 0) {
    push({ severity: 'warn', category: 'alt-text', message: `${noAlt.length} image(s) missing alt text` })
  }

  // Mixed content
  document.addEventListener('securitypolicyviolation', (e) => {
    push({ severity: 'error', category: 'mixed-content', message: 'Mixed content blocked', detail: e.blockedURI })
  })

  // Slow resources (>2s) via PerformanceObserver
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const res = entry as PerformanceResourceTiming
        if (res.duration > 2000) {
          push({ severity: 'warn', category: 'slow-resource', message: `Slow resource: ${Math.round(res.duration)}ms`, detail: res.name })
        }
      }
    })
    observer.observe({ type: 'resource', buffered: true })
  } catch { /* not supported */ }
}
