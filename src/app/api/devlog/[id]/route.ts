import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { devlog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { apiError, parseBody } from '@/lib/api'

const DevlogUpdateSchema = z.object({
  type: z.string().min(1).max(64).optional(),
  title: z.string().min(1).max(512).optional(),
  content: z.string().max(50000).optional().nullable(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numId = parseInt(id, 10)
    if (isNaN(numId) || numId <= 0) return apiError(400, 'Invalid devlog id')

    const body = await request.json()
    const parsed = parseBody(DevlogUpdateSchema, body)
    if (!parsed.success) return parsed.response

    const result = await db.update(devlog).set(parsed.data).where(eq(devlog.id, numId)).returning()
    if (result.length === 0) return apiError(404, 'Devlog entry not found')
    return NextResponse.json(result[0])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to update devlog entry: ${message}`)
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numId = parseInt(id, 10)
    if (isNaN(numId) || numId <= 0) return apiError(400, 'Invalid devlog id')

    await db.delete(devlog).where(eq(devlog.id, numId))
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to delete devlog entry: ${message}`)
  }
}
