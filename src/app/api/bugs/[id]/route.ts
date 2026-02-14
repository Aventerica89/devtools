import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bugs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const result = await db.update(bugs)
    .set({
      status: body.status,
      severity: body.severity,
      title: body.title,
      description: body.description,
      resolvedAt: body.status === 'resolved'
        ? new Date().toISOString()
        : null,
    })
    .where(eq(bugs.id, parseInt(id)))
    .returning()
  return NextResponse.json(result[0])
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.delete(bugs).where(eq(bugs.id, parseInt(id)))
  return NextResponse.json({ success: true })
}
