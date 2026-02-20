/**
 * Simple in-memory rate limiter for widget endpoints.
 * For production with multiple instances, use @upstash/ratelimit with Redis.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check if a request should be rate limited.
 * @param identifier - Unique identifier (e.g., IP address, project ID)
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    }
  }

  if (entry.count >= limit) {
    // Rate limit exceeded
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetAt,
    }
  }

  // Increment count
  entry.count++
  store.set(identifier, entry)

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetAt,
  }
}

/**
 * Get rate limit identifier from request.
 * Uses X-Forwarded-For header or socket address.
 */
export function getRateLimitIdentifier(request: Request): string {
  // Get IP from headers (Vercel provides x-forwarded-for)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0].trim() || 'unknown'

  // Combine with project ID if available for per-project limits
  const url = new URL(request.url)
  const projectId = url.searchParams.get('project') || url.searchParams.get('projectId')

  return projectId ? `${ip}:${projectId}` : ip
}

/**
 * For production with distributed instances, use this instead:
 *
 * import { Ratelimit } from '@upstash/ratelimit'
 * import { Redis } from '@upstash/redis'
 *
 * export const widgetLimiter = new Ratelimit({
 *   redis: Redis.fromEnv(),
 *   limiter: Ratelimit.slidingWindow(100, '1 m'),
 *   prefix: 'widget',
 * })
 *
 * Then in your API route:
 * const { success } = await widgetLimiter.limit(identifier)
 */
