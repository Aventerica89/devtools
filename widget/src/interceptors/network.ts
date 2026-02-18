/**
 * Network interceptor -- monkey-patches window.fetch and XMLHttpRequest
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

/** Estimate the byte size of an XHR response. */
function getXhrResponseSize(xhr: XMLHttpRequest): number {
  if (!xhr.response) return 0
  if (typeof xhr.response === 'string') return xhr.response.length
  if (xhr.response instanceof Blob) return xhr.response.size
  if (xhr.response instanceof ArrayBuffer) return xhr.response.byteLength
  try {
    return JSON.stringify(xhr.response).length
  } catch {
    return 0
  }
}

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

type XhrMeta = {
  method: string
  url: string
  requestHeaders: Record<string, string>
  requestSize: number
  startTime: number
  timestamp: number
}

/** Install XHR interceptor by patching XMLHttpRequest.prototype. */
function installXhrInterceptor(): void {
  const proto = XMLHttpRequest.prototype
  const originalOpen = proto.open
  const originalSetRequestHeader = proto.setRequestHeader
  const originalSend = proto.send
  const xhrMeta = new WeakMap<XMLHttpRequest, XhrMeta>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proto.open = function (this: XMLHttpRequest, method: string, url: string, ...rest: any[]) {
    xhrMeta.set(this, {
      method: method.toUpperCase(),
      url: typeof url === 'string' ? url : String(url),
      requestHeaders: {},
      requestSize: 0,
      startTime: 0,
      timestamp: 0,
    })
    return originalOpen.call(this, method, url, ...rest)
  }

  proto.setRequestHeader = function (this: XMLHttpRequest, header: string, value: string) {
    const m = xhrMeta.get(this)
    if (m) m.requestHeaders[header] = value
    return originalSetRequestHeader.call(this, header, value)
  }

  proto.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
    const m = xhrMeta.get(this)
    if (m) {
      m.requestSize = estimateBodySize(body ?? null)
      m.startTime = performance.now()
      m.timestamp = Date.now()

      this.addEventListener('loadend', () => {
        const duration = performance.now() - m.startTime
        const responseHeaders: Record<string, string> = {}
        const rawHeaders = this.getAllResponseHeaders()
        for (const line of rawHeaders.trim().split('\r\n')) {
          const idx = line.indexOf(': ')
          if (idx !== -1) {
            responseHeaders[line.slice(0, idx).toLowerCase()] = line.slice(idx + 2)
          }
        }

        const entry: NetworkEntry = {
          id: nextId++,
          method: m.method,
          url: m.url,
          status: this.status,
          statusText: this.statusText || (this.status === 0 ? 'Network Error' : ''),
          duration: Math.round(duration),
          requestSize: m.requestSize,
          responseSize: getXhrResponseSize(this),
          requestHeaders: m.requestHeaders,
          responseHeaders,
          startTime: m.startTime,
          timestamp: m.timestamp,
        }

        pushEntry(entry)
        xhrMeta.delete(this)
      })
    }

    return originalSend.call(this, body)
  }
}

/**
 * Install the network interceptor. Call once at startup.
 * Patches window.fetch and XMLHttpRequest to capture request/response metadata.
 * The originals are still called -- responses pass through untouched.
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

  installXhrInterceptor()
}
