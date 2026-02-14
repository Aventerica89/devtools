import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { devlog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const result = await db.update(devlog)
    .set({
      type: body.type,
      title: body.title,
      content: body.content,
    })
    .where(eq(devlog.id, parseInt(id)))
    .returning()
  return NextResponse.json(result[0])
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.delete(devlog).where(eq(devlog.id, parseInt(id)))
  return NextResponse.json({ success: true })
}
