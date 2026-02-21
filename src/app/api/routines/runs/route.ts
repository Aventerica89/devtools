import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineRuns, routineRunItems } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiError, verifyWidgetPin } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return apiError(400, 'projectId required')

    const { userId } = await auth()
    if (!userId) {
      const pinError = await verifyWidgetPin(request, projectId)
      if (pinError) return pinError
    }

    // Find the most recent non-completed run for this project
    const [run] = await db
      .select()
      .from(routineRuns)
      .where(and(eq(routineRuns.projectId, projectId), isNull(routineRuns.completedAt)))
      .orderBy(routineRuns.id)
      .limit(1)

    if (!run) return NextResponse.json(null)

    const items = await db.select().from(routineRunItems).where(eq(routineRunItems.runId, run.id))
    return NextResponse.json({ ...run, items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch active run: ${message}`)
  }
}
