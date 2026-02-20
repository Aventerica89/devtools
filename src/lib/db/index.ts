import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

function getClient() {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) {
    throw new Error('TURSO_DATABASE_URL is not set')
  }

  const isProd = process.env.NODE_ENV === 'production'

  return createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
    // Connection pooling and optimization settings
    syncInterval: isProd ? 60 : 0, // Sync every 60s in prod, disabled in dev
    encryptionKey: process.env.TURSO_ENCRYPTION_KEY,
    // Retry configuration for better reliability
    intMode: 'number', // Use JavaScript numbers for integers
    fetchOptions: {
      timeout: isProd ? 10000 : 30000, // 10s prod, 30s dev for debugging
      // Enable keepalive for connection reuse
      keepalive: true,
    },
  })
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (!_db) {
    _db = drizzle(getClient(), { schema })
  }
  return _db
}

// Backwards-compatible lazy export
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
