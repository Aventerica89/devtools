import { installConsoleInterceptor } from './console'
import { installNetworkInterceptor } from './network'
import {
  installErrorInterceptor,
  subscribeErrors,
  getErrorEntries,
} from './errors'
import {
  installPerformanceInterceptor,
  subscribePerfEntries,
} from './performance'
import { createApiClient } from '../api/client'
import type { ApiClient } from '../api/client'
import type { PerfEntry } from './performance'

const FLUSH_INTERVAL_MS = 10_000
const FLUSH_THRESHOLD = 20

interface BatchEvent {
  readonly type: string
  readonly title: string
  readonly content?: string
  readonly metadata?: Record<string, unknown>
  readonly projectId: string
}

/**
 * Start event batching -- subscribes to error and perf interceptors,
 * accumulates events, and flushes every 10s or when 20 events accumulate.
 * Also flushes on beforeunload via navigator.sendBeacon.
 */
function startEventBatching(
  projectId: string,
  apiClient: ApiClient,
  apiBase: string
): void {
  let pending: BatchEvent[] = []

  function addEvent(event: BatchEvent): void {
    pending = [...pending, event]
    if (pending.length >= FLUSH_THRESHOLD) {
      flush()
    }
  }

  function flush(): void {
    if (pending.length === 0) return

    const batch = [...pending]
    pending = []

    apiClient.sendEvents(batch).catch(() => {
      // Silently drop on failure to avoid infinite loops
    })
  }

  function flushBeacon(): void {
    if (pending.length === 0) return

    const batch = [...pending]
    pending = []

    const payload = JSON.stringify({ events: batch })
    const url = `${apiBase}/api/widget/event`

    try {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon(url, blob)
    } catch {
      // sendBeacon not available or failed -- data is lost
    }
  }

  // Track last-seen error ID to avoid duplicate sends
  let lastErrorId = 0

  // Subscribe to errors -- callback has no args,
  // so we check the buffer for entries newer than lastErrorId
  subscribeErrors(() => {
    const entries = getErrorEntries()
    const newEntries = entries.filter((e) => e.id > lastErrorId)
    if (newEntries.length > 0) {
      lastErrorId = newEntries[newEntries.length - 1].id
      for (const entry of newEntries) {
        addEvent({
          type: 'error',
          title: entry.message,
          content: entry.stack,
          metadata: {
            errorType: entry.type,
            source: entry.source,
            line: entry.line,
            col: entry.col,
          },
          projectId,
        })
      }
    }
  })

  // Subscribe to perf entries -- callback receives each new entry directly
  subscribePerfEntries((entry: PerfEntry) => {
    addEvent({
      type: 'perf',
      title: `${entry.metric}: ${entry.value}`,
      content: `Rating: ${entry.rating}`,
      metadata: {
        metric: entry.metric,
        value: entry.value,
        rating: entry.rating,
      },
      projectId,
    })
  })

  // Periodic flush every 10 seconds
  setInterval(flush, FLUSH_INTERVAL_MS)

  // Flush on page unload via sendBeacon for reliability
  window.addEventListener('beforeunload', flushBeacon)
}

/**
 * Interceptors for console, network, errors, and performance.
 * All four interceptors are installed here at startup, plus event batching.
 */
export function initInterceptors(
  projectId: string,
  pinHash: string,
  apiBase: string
): void {
  installConsoleInterceptor()
  installNetworkInterceptor()
  installErrorInterceptor()
  installPerformanceInterceptor()

  // Set up event batching to send errors and perf data to dashboard
  const apiClient = createApiClient(apiBase, pinHash)
  startEventBatching(projectId, apiClient, apiBase)
}
