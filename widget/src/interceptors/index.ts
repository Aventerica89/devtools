import {
  installConsoleInterceptor,
  subscribeConsole,
  getConsoleEntries,
} from './console'
import {
  installNetworkInterceptor,
  subscribeNetwork,
  getNetworkEntries,
} from './network'
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

// Capture original console.warn before any interceptor patches it
const _warn = console.warn.bind(console)

const FLUSH_INTERVAL_MS = 10_000
const FLUSH_THRESHOLD = 50
const MAX_PENDING = 200

/**
 * Console levels to forward to the DevTools backend.
 * All levels included so the dashboard Console Log page shows everything.
 */
const CONSOLE_LEVELS_TO_SEND = new Set(['log', 'info', 'warn', 'error', 'debug'])

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
    // Drop events if buffer is full to prevent resource exhaustion
    if (pending.length >= MAX_PENDING) return
    pending.push(event)
    if (pending.length >= FLUSH_THRESHOLD) {
      flush()
    }
  }

  function flush(): void {
    if (pending.length === 0) return

    const batch = [...pending]
    pending = []

    apiClient.sendEvents(batch).catch((err: unknown) => {
      _warn('[DevTools] Failed to send events:', err)
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

  // Subscribe to console entries -- only warn/error to avoid flooding
  let lastConsoleId = 0

  subscribeConsole(() => {
    const entries = getConsoleEntries()
    const newEntries = entries.filter((e) => e.id > lastConsoleId)
    if (newEntries.length > 0) {
      lastConsoleId = newEntries[newEntries.length - 1].id
      for (const entry of newEntries) {
        if (!CONSOLE_LEVELS_TO_SEND.has(entry.level)) continue
        // Skip messages about widget's own API to prevent feedback loops
        const msg = entry.args.join(' ')
        if (msg.includes('/api/widget/') || msg.includes('/api/ai/analyze')) continue
        addEvent({
          type: 'console',
          title: msg.slice(0, 500),
          content: entry.args.join('\n').slice(0, 2000),
          metadata: {
            level: entry.level,
            argCount: entry.args.length,
          },
          projectId,
        })
      }
    }
  })

  // Subscribe to network entries -- skip widget's own API calls
  let lastNetworkId = 0

  subscribeNetwork(() => {
    const entries = getNetworkEntries()
    const newEntries = entries.filter((e) => e.id > lastNetworkId)
    if (newEntries.length > 0) {
      lastNetworkId = newEntries[newEntries.length - 1].id
      for (const entry of newEntries) {
        // Skip widget's own requests to avoid infinite loops
        if (entry.url.includes('/api/widget/')) continue
        if (entry.url.includes('/api/bugs')) continue
        if (entry.url.includes('/api/ai/analyze')) continue

        addEvent({
          type: 'network',
          title: `${entry.method} ${entry.url}`.slice(0, 500),
          content: `${entry.status} ${entry.statusText} (${entry.duration}ms)`,
          metadata: {
            method: entry.method,
            url: entry.url,
            status: entry.status,
            statusText: entry.statusText,
            duration: entry.duration,
            requestSize: entry.requestSize,
            responseSize: entry.responseSize,
          },
          projectId,
        })
      }
    }
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
