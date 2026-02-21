import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineRuns, routineRunItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError, verifyWidgetPin } from '@/lib/api'

type Params = { params: Promise<{ runId: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { runId } = await params
    const [run] = await db.select().from(routineRuns).where(eq(routineRuns.id, Number(runId)))
    if (!run) return apiError(404, 'Not found')
    const { userId } = await auth()
    if (!userId) {
      const pinError = await verifyWidgetPin(_req, run.projectId)
      if (pinError) return pinError
    }
    const items = await db.select().from(routineRunItems).where(eq(routineRunItems.runId, Number(runId)))
    return NextResponse.json({ ...run, items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch run: ${message}`)
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { runId } = await params
    const [run] = await db.select().from(routineRuns).where(eq(routineRuns.id, Number(runId)))
    if (!run) return apiError(404, 'Not found')
    const { userId } = await auth()
    if (!userId) {
      const pinError = await verifyWidgetPin(request, run.projectId)
      if (pinError) return pinError
    }
    const body = await request.json().catch(() => ({}))
    const updates: Record<string, unknown> = {}
    if (body.close === true) {
      updates.completedAt = new Date().toISOString()
    }
    if (Object.keys(updates).length === 0) return apiError(400, 'Nothing to update')
    const [updated] = await db
      .update(routineRuns).set(updates)
      .where(eq(routineRuns.id, Number(runId))).returning()
    return NextResponse.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to update run: ${message}`)
  }
}
