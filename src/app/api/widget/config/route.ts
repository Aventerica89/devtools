import { db } from '@/lib/db'
import { widgetConfig } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { apiError, parseBody, WidgetConfigUpdateSchema } from '@/lib/api'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const parsed = parseBody(WidgetConfigUpdateSchema, body)
    if (!parsed.success) return parsed.response

    const { projectId, enabledTools, theme, position } = parsed.data

    const existing = await db
      .select()
      .from(widgetConfig)
      .where(eq(widgetConfig.projectId, projectId))
      .limit(1)

    if (existing.length === 0) {
      return apiError(400, 'Widget config does not exist. Create project first.')
    }

    await db
      .update(widgetConfig)
      .set({
        enabledTools: enabledTools ? JSON.stringify(enabledTools) : undefined,
        theme,
        position,
      })
      .where(eq(widgetConfig.projectId, projectId))

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to update config: ${message}`)
  }
}
