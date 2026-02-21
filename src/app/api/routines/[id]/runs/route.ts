import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineChecklists, routineRuns, routineItems, routineRunItems } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiError, verifyWidgetPin } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const [checklist] = await db.select().from(routineChecklists).where(eq(routineChecklists.id, Number(id)))
    if (!checklist) return apiError(404, 'Checklist not found')
    const { userId } = await auth()
    if (!userId) {
      const pinError = await verifyWidgetPin(_req, checklist.projectId)
      if (pinError) return pinError
    }
    const rows = await db.select().from(routineRuns).where(eq(routineRuns.checklistId, Number(id)))
    return NextResponse.json(rows)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch runs: ${message}`)
  }
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const { userId } = await auth()
    const { id } = await params
    const checklistId = Number(id)

    const [checklist] = await db
      .select({ projectId: routineChecklists.projectId })
      .from(routineChecklists)
      .where(eq(routineChecklists.id, checklistId))
    if (!checklist) return apiError(404, 'Checklist not found')

    if (!userId) {
      const pinError = await verifyWidgetPin(_req, checklist.projectId)
      if (pinError) return pinError
    }

    // Check for existing open run — return it rather than creating a duplicate
    const [existing] = await db
      .select()
      .from(routineRuns)
      .where(and(eq(routineRuns.checklistId, checklistId), isNull(routineRuns.completedAt)))
      .limit(1)
    if (existing) return NextResponse.json(existing, { status: 200 })

    const items = await db.select().from(routineItems).where(eq(routineItems.checklistId, checklistId))
    if (items.length === 0) return apiError(400, 'Checklist has no items')

    const [run] = await db
      .insert(routineRuns)
      .values({ projectId: checklist.projectId, checklistId, startedAt: new Date().toISOString() })
      .returning()

    await db.insert(routineRunItems).values(
      items.map((item) => ({ runId: run.id, itemId: item.id, checked: 0 }))
    )
    return NextResponse.json(run, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to start run: ${message}`)
  }
}
