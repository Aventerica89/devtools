import bcrypt from 'bcryptjs'
import { randomBytes, createHash } from 'crypto'

const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required')
}
const SESSION_EXPIRY_DAYS = 7

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12)
}

export async function verifyPin(
  pin: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

export function createSessionToken(): string {
  const payload = JSON.stringify({
    random: randomBytes(32).toString('hex'),
    exp: Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  })
  const signature = createHash('sha256')
    .update(payload + SESSION_SECRET)
    .digest('hex')
  return Buffer.from(payload).toString('base64') + '.' + signature
}

export function verifySessionToken(token: string): boolean {
  try {
    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return false

    const payload = Buffer.from(payloadB64, 'base64').toString()
    const expected = createHash('sha256')
      .update(payload + SESSION_SECRET)
      .digest('hex')
    if (signature !== expected) return false

    const data = JSON.parse(payload)
    return data.exp > Date.now()
  } catch {
    return false
  }
}
