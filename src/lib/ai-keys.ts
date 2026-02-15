import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { settings } from '@/lib/db/schema'

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
      return rows[0].value.trim()
    }
  } catch {
    // DB not available, fall through to env
  }

  // Fall back to env var
  return process.env[envKey]?.trim() || null
}
