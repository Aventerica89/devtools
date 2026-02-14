/**
 * Network interceptor -- monkey-patches window.fetch
 * and stores entries in a circular buffer (max 200).
 */

export interface NetworkEntry {
  readonly id: number
  readonly method: string
  readonly url: string
  readonly status: number
  readonly statusText: string
  readonly duration: number
  readonly requestSize: number
  readonly responseSize: number
  readonly requestHeaders: Record<string, string>
  readonly responseHeaders: Record<string, string>
  readonly startTime: number
  readonly timestamp: number
}

const MAX_ENTRIES = 200

let nextId = 1
const buffer: NetworkEntry[] = []
const listeners: Array<() => void> = []

/** Estimate the byte size of a body payload. */
function estimateBodySize(body: unknown): number {
  if (body === null || body === undefined) return 0
  if (typeof body === 'string') return body.length
  if (body instanceof Blob) return body.size
  if (body instanceof ArrayBuffer) return body.byteLength
  if (body instanceof FormData) {
    // Rough estimate -- FormData size is not directly available
    let size = 0
    body.forEach((value) => {
      if (typeof value === 'string') {
        size += value.length
      } else if (value instanceof Blob) {
        size += value.size
      }
    })
    return size
  }
  if (body instanceof URLSearchParams) return body.toString().length
  return 0
}

/** Extract headers from a Headers object into a plain Record. */
function headersToRecord(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

/** Push an entry into the circular buffer (drops oldest when full). */
function pushEntry(entry: NetworkEntry): void {
  if (buffer.length >= MAX_ENTRIES) {
    buffer.shift()
  }
  buffer.push(entry)

  for (const fn of listeners) {
    fn()
  }
}

/** Get a snapshot of all current entries (immutable copy). */
export function getNetworkEntries(): readonly NetworkEntry[] {
  return [...buffer]
}

/** Clear all entries from the buffer. */
export function clearNetworkEntries(): void {
  buffer.length = 0
  for (const fn of listeners) {
    fn()
  }
}

/** Subscribe to buffer changes. Returns an unsubscribe function. */
export function subscribeNetwork(fn: () => void): () => void {
  listeners.push(fn)
  return () => {
    const idx = listeners.indexOf(fn)
    if (idx !== -1) {
      listeners.splice(idx, 1)
    }
  }
}

/**
 * Install the network interceptor. Call once at startup.
 * Patches window.fetch to capture request/response metadata.
 * The original fetch is still called -- responses pass through untouched.
 */
export function installNetworkInterceptor(): void {
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const method = (init?.method ?? 'GET').toUpperCase()
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url
    const requestSize = estimateBodySize(init?.body ?? null)

    // Capture request headers
    let requestHeaders: Record<string, string> = {}
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        requestHeaders = headersToRecord(init.headers)
      } else if (Array.isArray(init.headers)) {
        for (const [key, value] of init.headers) {
          requestHeaders[key] = value
        }
      } else {
        requestHeaders = { ...init.headers }
      }
    }

    const startTime = performance.now()
    const timestamp = Date.now()

    try {
      const response = await originalFetch(input, init)
      const duration = performance.now() - startTime

      // Clone so we can read the body without consuming the original
      const clone = response.clone()
      let responseSize = 0
      try {
        const blob = await clone.blob()
        responseSize = blob.size
      } catch {
        // Body may be unavailable (e.g. opaque responses)
        responseSize = 0
      }

      const entry: NetworkEntry = {
        id: nextId++,
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        duration: Math.round(duration),
        requestSize,
        responseSize,
        requestHeaders,
        responseHeaders: headersToRecord(response.headers),
        startTime,
        timestamp,
      }

      pushEntry(entry)
      return response
    } catch (error) {
      const duration = performance.now() - startTime

      const entry: NetworkEntry = {
        id: nextId++,
        method,
        url,
        status: 0,
        statusText: 'Network Error',
        duration: Math.round(duration),
        requestSize,
        responseSize: 0,
        requestHeaders,
        responseHeaders: {},
        startTime,
        timestamp,
      }

      pushEntry(entry)
      throw error
    }
  }
}
