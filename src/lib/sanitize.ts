/**
 * Input sanitization utilities to prevent XSS attacks.
 *
 * For production, install and use DOMPurify:
 * npm install dompurify isomorphic-dompurify @types/dompurify
 *
 * Then replace the implementation below with:
 * import DOMPurify from 'isomorphic-dompurify'
 * export function sanitizeHtml(dirty: string): string {
 *   return DOMPurify.sanitize(dirty, {
 *     ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre', 'p', 'br'],
 *     ALLOWED_ATTR: [],
 *   })
 * }
 */

/**
 * Basic HTML sanitization - escapes HTML entities.
 * This is a minimal implementation for immediate use.
 * For production with rich text, use DOMPurify (see above).
 */
export function sanitizeHtml(dirty: string): string {
  return dirty
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Sanitize user input for safe display.
 * Removes control characters and trims whitespace.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
}

/**
 * Sanitize JSON metadata before storage.
 * Recursively sanitizes string values in objects.
 */
export function sanitizeMetadata(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeInput(value)
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeMetadata(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        typeof item === 'string'
          ? sanitizeInput(item)
          : item && typeof item === 'object'
          ? sanitizeMetadata(item as Record<string, unknown>)
          : item
      )
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Validate and sanitize URL to prevent javascript: and data: URIs.
 */
export function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim()

  // Block dangerous protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null
  }

  try {
    // Validate URL format
    const parsed = new URL(trimmed)

    // Only allow http(s) and relative URLs
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }

    return trimmed
  } catch {
    // If URL parsing fails, check if it's a relative path
    if (trimmed.startsWith('/')) {
      return trimmed
    }
    return null
  }
}
