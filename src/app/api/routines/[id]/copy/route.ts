import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineChecklists, routineItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError, parseBody } from '@/lib/api'
import { z } from 'zod'

const CopySchema = z.object({
  targetProjectId: z.string().min(1),
})

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { userId } = await auth()
    if (!userId) return apiError(401, 'Unauthorized')

    const { id } = await params
    const body = await request.json()
    const parsed = parseBody(CopySchema, body)
    if (!parsed.success) return parsed.response

    const sourceId = Number(id)
    const { targetProjectId } = parsed.data

    const [source] = await db
      .select()
      .from(routineChecklists)
      .where(eq(routineChecklists.id, sourceId))
    if (!source) return apiError(404, 'Source checklist not found')

    const items = await db
      .select()
      .from(routineItems)
      .where(eq(routineItems.checklistId, sourceId))

    const [newChecklist] = await db
      .insert(routineChecklists)
      .values({
        projectId: targetProjectId,
        name: source.name,
        description: source.description,
        sortOrder: source.sortOrder,
      })
      .returning()

    if (items.length > 0) {
      await db.insert(routineItems).values(
        items.map((item) => ({
          checklistId: newChecklist.id,
          name: item.name,
          type: item.type,
          snippet: item.snippet,
          notes: item.notes,
          sortOrder: item.sortOrder,
        }))
      )
    }

    const newItems = await db
      .select()
      .from(routineItems)
      .where(eq(routineItems.checklistId, newChecklist.id))

    return NextResponse.json(
      { checklist: newChecklist, items: newItems },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to copy checklist: ${message}`)
  }
}
