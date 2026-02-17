import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { settings } from '@/lib/db/schema'
import { decrypt, isEncrypted } from '@/lib/crypto'

export async function getAiKey(
  provider: 'anthropic' | 'google'
): Promise<string | null> {
  const envKey =
    provider === 'anthropic'
      ? 'ANTHROPIC_API_KEY'
      : 'GOOGLE_GENERATIVE_AI_API_KEY'

  // DB-stored key takes priority
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(settings)
      .where(eq(settings.key, envKey))

    if (rows.length > 0 && rows[0].value) {
      const raw = rows[0].value.trim()
      // Decrypt if stored in encrypted format; fall back to raw for legacy plaintext values
      return isEncrypted(raw) ? decrypt(raw) : raw
    }
  } catch {
    // DB not available, fall through to env
  }

  // Fall back to env var
  return process.env[envKey]?.trim() || null
}
