import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { settings } from '@/lib/db/schema'
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto'
import { apiError } from '@/lib/api'

export async function GET() {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'ANTHROPIC_API_KEY'))

    const googleRows = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'GOOGLE_GENERATIVE_AI_API_KEY'))

    return NextResponse.json({
      anthropic: rows.length > 0,
      google: googleRows.length > 0,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch AI key status: ${message}`)
  }
}

export async function PUT(request: Request) {
  const { provider, apiKey } = await request.json()

  if (!provider || !apiKey) {
    return NextResponse.json(
      { error: 'provider and apiKey required' },
      { status: 400 }
    )
  }

  const keyName =
    provider === 'anthropic'
      ? 'ANTHROPIC_API_KEY'
      : provider === 'google'
        ? 'GOOGLE_GENERATIVE_AI_API_KEY'
        : null

  if (!keyName) {
    return NextResponse.json(
      { error: 'Unknown provider' },
      { status: 400 }
    )
  }

  const db = getDb()
  const encryptedValue = encrypt(apiKey.trim())
  await db
    .insert(settings)
    .values({ key: keyName, value: encryptedValue })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: encryptedValue, updatedAt: new Date().toISOString() },
    })

  return NextResponse.json({ saved: true })
}

export async function DELETE(request: Request) {
  const { provider } = await request.json()

  const keyName =
    provider === 'anthropic'
      ? 'ANTHROPIC_API_KEY'
      : provider === 'google'
        ? 'GOOGLE_GENERATIVE_AI_API_KEY'
        : null

  if (!keyName) {
    return NextResponse.json(
      { error: 'Unknown provider' },
      { status: 400 }
    )
  }

  const db = getDb()
  await db.delete(settings).where(eq(settings.key, keyName))

  return NextResponse.json({ deleted: true })
}
