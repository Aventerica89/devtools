import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError, parseBody, RoutineItemSchema } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const { userId } = await auth()
    if (!userId) return apiError(401, 'Unauthorized')
    const { id } = await params
    const data = await request.json()
    const parsed = parseBody(RoutineItemSchema.partial(), data)
    if (!parsed.success) return parsed.response
    const [row] = await db
      .update(routineItems).set(parsed.data)
      .where(eq(routineItems.id, Number(id))).returning()
    if (!row) return apiError(404, 'Not found')
    return NextResponse.json(row)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to update item: ${message}`)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { userId } = await auth()
    if (!userId) return apiError(401, 'Unauthorized')
    const { id } = await params
    await db.delete(routineItems).where(eq(routineItems.id, Number(id)))
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to delete item: ${message}`)
  }
}
