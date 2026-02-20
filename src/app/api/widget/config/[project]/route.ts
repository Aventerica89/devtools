import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { widgetConfig } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const DEFAULT_CONFIG = {
  enabledTools: ['console', 'network', 'errors', 'bugs', 'ai'],
  theme: 'dark',
  position: 'bottom-right',
} as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ project: string }> }
) {
  try {
    const { project } = await params

    const rows = await db
      .select()
      .from(widgetConfig)
      .where(eq(widgetConfig.projectId, project))
      .limit(1)

    if (rows.length === 0) {
      return NextResponse.json(DEFAULT_CONFIG)
    }

    const row = rows[0]

    return NextResponse.json(
      {
        enabledTools: row.enabledTools
          ? JSON.parse(row.enabledTools)
          : DEFAULT_CONFIG.enabledTools,
        theme: row.theme || DEFAULT_CONFIG.theme,
        position: row.position || DEFAULT_CONFIG.position,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to load config: ${message}` },
      { status: 500 }
    )
  }
}
