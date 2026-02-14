/**
 * Error interceptor -- listens to window.onerror and
 * window.addEventListener('unhandledrejection').
 * Stores entries in a circular buffer (max 100).
 */

export type ErrorType = 'error' | 'unhandledrejection'

export interface ErrorEntry {
  readonly id: number
  readonly message: string
  readonly stack: string
  readonly source: string
  readonly line: number
  readonly col: number
  readonly timestamp: number
  readonly type: ErrorType
}

const MAX_ENTRIES = 100

let nextId = 1
const buffer: ErrorEntry[] = []
const listeners: Array<() => void> = []

let onErrorCallback: ((entry: ErrorEntry) => void) | null = null

/**
 * Register a callback that fires on each new error.
 * Used by ErrorOverlay to auto-show on uncaught errors.
 */
export function setOnErrorCallback(
  fn: ((entry: ErrorEntry) => void) | null
): void {
  onErrorCallback = fn
}

/** Push an entry into the circular buffer (drops oldest when full). */
function pushEntry(entry: ErrorEntry): void {
  if (buffer.length >= MAX_ENTRIES) {
    buffer.shift()
  }
  buffer.push(entry)

  // Notify subscribers (for in-panel viewer)
  for (const fn of listeners) {
    fn()
  }

  // Notify the overlay callback
  if (onErrorCallback) {
    onErrorCallback(entry)
  }
}

/** Get a snapshot of all current entries (immutable copy). */
export function getErrorEntries(): readonly ErrorEntry[] {
  return [...buffer]
}

/** Clear all entries from the buffer. */
export function clearErrorEntries(): void {
  buffer.length = 0
  for (const fn of listeners) {
    fn()
  }
}

/** Subscribe to buffer changes. Returns an unsubscribe function. */
export function subscribeErrors(fn: () => void): () => void {
  listeners.push(fn)
  return () => {
    const idx = listeners.indexOf(fn)
    if (idx !== -1) {
      listeners.splice(idx, 1)
    }
  }
}

/**
 * Install the error interceptor. Call once at startup.
 * Listens to window.onerror and unhandledrejection.
 * Does not replace existing handlers -- fires alongside them.
 */
export function installErrorInterceptor(): void {
  const prevOnError = window.onerror

  window.onerror = (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ) => {
    const entry: ErrorEntry = {
      id: nextId++,
      message: typeof message === 'string' ? message : 'Unknown error',
      stack: error?.stack ?? '',
      source: source ?? '',
      line: lineno ?? 0,
      col: colno ?? 0,
      timestamp: Date.now(),
      type: 'error',
    }

    pushEntry(entry)

    // Call previous handler if it existed
    if (typeof prevOnError === 'function') {
      return prevOnError(message, source, lineno, colno, error)
    }
    return false
  }

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason
    const isError = reason instanceof Error
    const message = isError
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : 'Unhandled promise rejection'
    const stack = isError ? (reason.stack ?? '') : ''

    const entry: ErrorEntry = {
      id: nextId++,
      message,
      stack,
      source: '',
      line: 0,
      col: 0,
      timestamp: Date.now(),
      type: 'unhandledrejection',
    }

    pushEntry(entry)
  })
}
