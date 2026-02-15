import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { devlog } from '@/lib/db/schema'

interface WidgetEvent {
  readonly type: string
  readonly title: string
  readonly content?: string
  readonly metadata?: Record<string, unknown>
  readonly projectId: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const events: readonly WidgetEvent[] = body?.events

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'No events provided' },
        { status: 400 }
      )
    }

    // Cap batch size to prevent abuse
    const capped = events.slice(0, 100)

    const rows = capped.map((e) => ({
      projectId: e.projectId,
      type: e.type,
      title: e.title,
      content: e.content || '',
      source: 'auto' as const,
      metadata: e.metadata ? JSON.stringify(e.metadata) : null,
    }))

    await db.insert(devlog).values(rows)

    return NextResponse.json({ inserted: rows.length })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to ingest events: ${message}` },
      { status: 500 }
    )
  }
}
