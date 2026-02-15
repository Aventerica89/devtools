import { db } from '@/lib/db'
import { widgetConfig } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { projectId, enabledTools, theme, position } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    const existing = await db
      .select()
      .from(widgetConfig)
      .where(eq(widgetConfig.projectId, projectId))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Widget config does not exist. Create project first.' },
        { status: 400 }
      )
    }

    await db
      .update(widgetConfig)
      .set({
        enabledTools: JSON.stringify(enabledTools),
        theme,
        position,
      })
      .where(eq(widgetConfig.projectId, projectId))

    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to update config: ${message}` },
      { status: 500 }
    )
  }
}
