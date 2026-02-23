import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ideas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError, parseBody, IdeaUpdateSchema } from '@/lib/api'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numId = parseInt(id, 10)
    if (isNaN(numId) || numId <= 0) return apiError(400, 'Invalid idea id')

    const body = await request.json()
    const parsed = parseBody(IdeaUpdateSchema, body)
    if (!parsed.success) return parsed.response

    const { tags, ...fields } = parsed.data
    const result = await db
      .update(ideas)
      .set({
        ...fields,
        tags: tags !== undefined ? JSON.stringify(tags) : undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(ideas.id, numId))
      .returning()

    if (result.length === 0) return apiError(404, 'Idea not found')
    return NextResponse.json(result[0])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to update idea: ${message}`)
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numId = parseInt(id, 10)
    if (isNaN(numId) || numId <= 0) return apiError(400, 'Invalid idea id')

    await db.delete(ideas).where(eq(ideas.id, numId))
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to delete idea: ${message}`)
  }
}
