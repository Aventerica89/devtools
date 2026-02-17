import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bugs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { apiError, parseBody } from '@/lib/api'

const BugUpdateSchema = z.object({
  status: z.enum(['open', 'closed', 'resolved']).optional(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  title: z.string().min(1).max(512).optional(),
  description: z.string().max(10000).optional().nullable(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numId = parseInt(id, 10)
    if (isNaN(numId) || numId <= 0) return apiError(400, 'Invalid bug id')

    const body = await request.json()
    const parsed = parseBody(BugUpdateSchema, body)
    if (!parsed.success) return parsed.response

    const result = await db.update(bugs)
      .set({
        ...parsed.data,
        resolvedAt: parsed.data.status === 'resolved' ? new Date().toISOString() : undefined,
      })
      .where(eq(bugs.id, numId))
      .returning()

    if (result.length === 0) return apiError(404, 'Bug not found')
    return NextResponse.json(result[0])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to update bug: ${message}`)
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numId = parseInt(id, 10)
    if (isNaN(numId) || numId <= 0) return apiError(400, 'Invalid bug id')

    await db.delete(bugs).where(eq(bugs.id, numId))
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to delete bug: ${message}`)
  }
}
