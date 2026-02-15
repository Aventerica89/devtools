import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { savedRequests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db
    .delete(savedRequests)
    .where(eq(savedRequests.id, parseInt(id)))
  return NextResponse.json({ success: true })
}
