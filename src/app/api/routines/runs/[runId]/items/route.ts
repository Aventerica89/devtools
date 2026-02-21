import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineRunItems } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiError, parseBody, RoutineRunCheckSchema } from '@/lib/api'

type Params = { params: Promise<{ runId: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const { userId } = await auth()
    if (!userId) return apiError(401, 'Unauthorized')
    const { runId } = await params
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    if (!itemId) return apiError(400, 'itemId required')
    const data = await request.json()
    const parsed = parseBody(RoutineRunCheckSchema, data)
    if (!parsed.success) return parsed.response
    const [row] = await db
      .update(routineRunItems)
      .set({ checked: parsed.data.checked ? 1 : 0, checkedAt: parsed.data.checked ? new Date().toISOString() : null })
      .where(and(eq(routineRunItems.runId, Number(runId)), eq(routineRunItems.itemId, Number(itemId))))
      .returning()
    return NextResponse.json(row)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to update run item: ${message}`)
  }
}
