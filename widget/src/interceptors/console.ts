/**
 * Console interceptor — monkey-patches console.log/warn/error/info
 * and stores entries in a circular buffer (max 500).
 */

export type ConsoleLevel = 'log' | 'warn' | 'error' | 'info'

export interface ConsoleEntry {
  readonly id: number
  readonly level: ConsoleLevel
  readonly args: readonly string[]
  readonly timestamp: number
}

const MAX_ENTRIES = 500

let nextId = 1
const buffer: ConsoleEntry[] = []
const listeners: Array<() => void> = []

/** Serialize a single argument to a display string. */
function serializeArg(arg: unknown): string {
  if (arg === null) return 'null'
  if (arg === undefined) return 'undefined'
  if (typeof arg === 'string') return arg
  if (typeof arg === 'number' || typeof arg === 'boolean') {
    return String(arg)
  }
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}`
  }
  try {
    return JSON.stringify(arg, null, 2)
  } catch {
    return String(arg)
  }
}

/** Push an entry into the circular buffer (drops oldest when full). */
function pushEntry(level: ConsoleLevel, args: unknown[]): void {
  const entry: ConsoleEntry = {
    id: nextId++,
    level,
    args: args.map(serializeArg),
    timestamp: Date.now(),
  }

  if (buffer.length >= MAX_ENTRIES) {
    buffer.shift()
  }
  buffer.push(entry)

  // Notify subscribers
  for (const fn of listeners) {
    fn()
  }
}

/** Get a snapshot of all current entries (immutable copy). */
export function getConsoleEntries(): readonly ConsoleEntry[] {
  return [...buffer]
}

/** Clear all entries from the buffer. */
export function clearConsoleEntries(): void {
  buffer.length = 0
  for (const fn of listeners) {
    fn()
  }
}

/** Subscribe to buffer changes. Returns an unsubscribe function. */
export function subscribeConsole(fn: () => void): () => void {
  listeners.push(fn)
  return () => {
    const idx = listeners.indexOf(fn)
    if (idx !== -1) {
      listeners.splice(idx, 1)
    }
  }
}

/**
 * Install the console interceptor. Call once at startup.
 * Patches console.log, console.warn, console.error, console.info.
 * Original functions are still called after capture.
 */
export function installConsoleInterceptor(): void {
  const levels: ConsoleLevel[] = ['log', 'warn', 'error', 'info']

  for (const level of levels) {
    const original = console[level].bind(console)

    console[level] = (...args: unknown[]) => {
      pushEntry(level, args)
      original(...args)
    }
  }
}
