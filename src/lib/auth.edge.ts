/**
 * Edge-compatible session token verification.
 * Uses Web Crypto API (available in Edge runtime and Node.js 20+).
 * Import this in middleware instead of auth.ts.
 */

const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required')
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifySessionTokenEdge(token: string): Promise<boolean> {
  try {
    const dotIndex = token.indexOf('.')
    if (dotIndex === -1) return false

    const payloadB64 = token.slice(0, dotIndex)
    const signature = token.slice(dotIndex + 1)
    if (!payloadB64 || !signature) return false

    const payload = atob(payloadB64)
    const expected = await sha256Hex(payload + SESSION_SECRET)
    if (signature !== expected) return false

    const data = JSON.parse(payload)
    return data.exp > Date.now()
  } catch {
    return false
  }
}
