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

/**
 * Check if a URL targets a private/reserved IP range.
 * Blocks: localhost, 127.x, 10.x, 172.16-31.x, 192.168.x,
 * 169.254.x (link-local/cloud metadata), ::1, fc00::/7
 */
export function isPrivateUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString)
    const hostname = parsed.hostname.toLowerCase()

    // Block localhost variants
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return true
    }

    // Block [::1] bracket notation
    if (hostname === '[::1]') {
      return true
    }

    // IPv4 private ranges
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number)
      if (a === 10) return true                          // 10.0.0.0/8
      if (a === 172 && b >= 16 && b <= 31) return true   // 172.16.0.0/12
      if (a === 192 && b === 168) return true             // 192.168.0.0/16
      if (a === 169 && b === 254) return true             // 169.254.0.0/16 (metadata)
      if (a === 127) return true                          // 127.0.0.0/8
      if (a === 0) return true                            // 0.0.0.0/8
    }

    // IPv6 private (fc00::/7, fe80::/10)
    if (/^(fc|fd|fe8|fe9|fea|feb)/i.test(hostname.replace(/[\[\]]/g, ''))) {
      return true
    }

    return false
  } catch {
    return true // Invalid URL = block
  }
}
