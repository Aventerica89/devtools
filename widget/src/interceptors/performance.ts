/**
 * Performance interceptor -- uses PerformanceObserver to capture
 * Web Vitals (LCP, CLS, INP, FCP, TTFB) and stores entries
 * in a circular buffer (max 100).
 */

export type MetricName = 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB'
export type Rating = 'good' | 'needs-improvement' | 'poor'

export interface PerfEntry {
  readonly id: number
  readonly timestamp: number
  readonly metric: MetricName
  readonly value: number
  readonly rating: Rating
}

const MAX_ENTRIES = 100

/**
 * Web Vitals thresholds per spec.
 * [good_threshold, poor_threshold]
 * good: value <= t[0]
 * needs-improvement: t[0] < value <= t[1]
 * poor: value > t[1]
 */
const THRESHOLDS: Readonly<Record<MetricName, readonly [number, number]>> = {
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
}

let nextId = 1
const buffer: PerfEntry[] = []
const listeners: Array<(entry: PerfEntry) => void> = []

function rate(metric: MetricName, value: number): Rating {
  const t = THRESHOLDS[metric]
  if (value <= t[0]) return 'good'
  if (value <= t[1]) return 'needs-improvement'
  return 'poor'
}

function pushEntry(metric: MetricName, value: number): void {
  const entry: PerfEntry = {
    id: nextId++,
    timestamp: Date.now(),
    metric,
    value: Math.round(metric === 'CLS' ? value * 1000 : value) / (metric === 'CLS' ? 1000 : 1),
    rating: rate(metric, value),
  }

  if (buffer.length >= MAX_ENTRIES) {
    buffer.shift()
  }
  buffer.push(entry)

  for (const fn of listeners) {
    fn(entry)
  }
}

/** Get a snapshot of all current entries (immutable copy). */
export function getPerfEntries(): readonly PerfEntry[] {
  return [...buffer]
}

/** Clear all entries from the buffer. */
export function clearPerfEntries(): void {
  buffer.length = 0
}

/**
 * Subscribe to new perf entries. Callback receives each new entry.
 * Returns an unsubscribe function.
 */
export function subscribePerfEntries(
  fn: (entry: PerfEntry) => void
): () => void {
  listeners.push(fn)
  return () => {
    const idx = listeners.indexOf(fn)
    if (idx !== -1) {
      listeners.splice(idx, 1)
    }
  }
}

/**
 * Install the performance interceptor. Call once at startup.
 * Sets up PerformanceObserver for Web Vitals metrics.
 * Guards for environments without PerformanceObserver support.
 */
export function installPerformanceInterceptor(): void {
  if (typeof PerformanceObserver === 'undefined') {
    return
  }

  // LCP -- largest-contentful-paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      // LCP reports multiple entries; the last one is the "final" LCP
      const last = entries[entries.length - 1]
      if (last) {
        pushEntry('LCP', last.startTime)
      }
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    // Not supported in this browser
  }

  // CLS -- layout-shift (accumulate)
  try {
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only count shifts without recent user input
        const shift = entry as PerformanceEntry & {
          hadRecentInput?: boolean
          value?: number
        }
        if (!shift.hadRecentInput && typeof shift.value === 'number') {
          clsValue += shift.value
          pushEntry('CLS', clsValue)
        }
      }
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  } catch {
    // Not supported
  }

  // INP -- event timing (approximation via longest event duration)
  try {
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // duration is the processing + presentation delay
        if (entry.duration > 0) {
          pushEntry('INP', entry.duration)
        }
      }
    })
    inpObserver.observe({ type: 'event', buffered: true })
  } catch {
    // Not supported
  }

  // FCP -- first-contentful-paint
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          pushEntry('FCP', entry.startTime)
        }
      }
    })
    fcpObserver.observe({ type: 'paint', buffered: true })
  } catch {
    // Not supported
  }

  // TTFB -- navigation timing
  try {
    const ttfbObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const nav = entry as PerformanceNavigationTiming
        if (nav.responseStart > 0) {
          pushEntry('TTFB', nav.responseStart - nav.requestStart)
        }
      }
    })
    ttfbObserver.observe({ type: 'navigation', buffered: true })
  } catch {
    // Not supported
  }
}
