import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { settings } from '@/lib/db/schema'

export async function GET() {
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
  await db
    .insert(settings)
    .values({ key: keyName, value: apiKey.trim() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: apiKey.trim(), updatedAt: new Date().toISOString() },
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
