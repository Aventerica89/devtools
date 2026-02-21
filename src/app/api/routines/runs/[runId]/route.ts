import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineRuns, routineRunItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError } from '@/lib/api'

type Params = { params: Promise<{ runId: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { userId } = await auth()
    if (!userId) return apiError(401, 'Unauthorized')
    const { runId } = await params
    const [run] = await db.select().from(routineRuns).where(eq(routineRuns.id, Number(runId)))
    if (!run) return apiError(404, 'Not found')
    const items = await db.select().from(routineRunItems).where(eq(routineRunItems.runId, Number(runId)))
    return NextResponse.json({ ...run, items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch run: ${message}`)
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { userId } = await auth()
    if (!userId) return apiError(401, 'Unauthorized')
    const { runId } = await params
    const body = await request.json().catch(() => ({}))
    const completedAt = body.close ? new Date().toISOString() : null
    const [run] = await db
      .update(routineRuns).set({ completedAt })
      .where(eq(routineRuns.id, Number(runId))).returning()
    return NextResponse.json(run)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to update run: ${message}`)
  }
}
