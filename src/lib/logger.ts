/**
 * Structured logging utility for server-side operations.
 *
 * For production, consider using Pino or Winston:
 * npm install pino pino-pretty
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private minLevel: LogLevel

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel
    this.minLevel = envLevel || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.minLevel)
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const base = {
      timestamp,
      level,
      message,
      env: process.env.NODE_ENV,
    }

    return JSON.stringify({ ...base, ...context })
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (this.shouldLog('error')) {
      const errorContext = error instanceof Error
        ? {
            errorMessage: error.message,
            errorStack: error.stack,
            errorName: error.name,
          }
        : { error }

      console.error(this.formatMessage('error', message, { ...context, ...errorContext }))
    }
  }

  /**
   * Log API request/response for debugging
   */
  apiCall(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ) {
    this.info('API call', {
      method,
      path,
      statusCode,
      duration,
      ...context,
    })
  }

  /**
   * Log database query for performance monitoring
   */
  dbQuery(query: string, duration: number, context?: LogContext) {
    this.debug('Database query', {
      query,
      duration,
      ...context,
    })
  }
}

export const logger = new Logger()

/**
 * Middleware helper for timing API requests
 */
export function withTiming<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  const start = Date.now()
  return fn().finally(() => {
    const duration = Date.now() - start
    if (duration > 1000) {
      logger.warn(`Slow operation: ${label}`, { duration })
    } else {
      logger.debug(label, { duration })
    }
  })
}
