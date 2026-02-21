import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError, parseBody, RoutineItemSchema } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { userId } = await auth()
    if (!userId) return apiError(401, 'Unauthorized')
    const { id } = await params
    const rows = await db.select().from(routineItems).where(eq(routineItems.checklistId, Number(id)))
    return NextResponse.json(rows)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch items: ${message}`)
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { userId } = await auth()
    if (!userId) return apiError(401, 'Unauthorized')
    const { id } = await params
    const data = await request.json()
    const parsed = parseBody(RoutineItemSchema, data)
    if (!parsed.success) return parsed.response
    const [row] = await db
      .insert(routineItems)
      .values({ ...parsed.data, checklistId: Number(id), sortOrder: parsed.data.sortOrder ?? 0 })
      .returning()
    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to create item: ${message}`)
  }
}
