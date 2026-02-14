import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .get()
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(project)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const result = await db
    .update(projects)
    .set({ name: body.name, url: body.url })
    .where(eq(projects.id, id))
    .returning()
  return NextResponse.json(result[0])
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.delete(projects).where(eq(projects.id, id))
  return NextResponse.json({ success: true })
}
