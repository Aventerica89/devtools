import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { envVars } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  let query = db.select().from(envVars).orderBy(desc(envVars.createdAt))
  if (projectId) {
    query = query.where(eq(envVars.projectId, projectId)) as typeof query
  }

  const all = await query.all()
  return NextResponse.json(all)
}

export async function POST(request: Request) {
  const body = await request.json()
  const result = await db
    .insert(envVars)
    .values({
      projectId: body.projectId,
      key: body.key,
      value: body.value,
      sensitive: body.sensitive ?? false,
      description: body.description || null,
    })
    .returning()
  return NextResponse.json(result[0], { status: 201 })
}

export async function PUT(request: Request) {
  const body = await request.json()
  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }

  if (body.key !== undefined) updates.key = body.key
  if (body.value !== undefined) updates.value = body.value
  if (body.sensitive !== undefined) updates.sensitive = body.sensitive
  if (body.description !== undefined) updates.description = body.description

  const result = await db
    .update(envVars)
    .set(updates)
    .where(eq(envVars.id, body.id))
    .returning()
  return NextResponse.json(result[0])
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'Missing id parameter' },
      { status: 400 }
    )
  }

  await db.delete(envVars).where(eq(envVars.id, parseInt(id)))
  return NextResponse.json({ success: true })
}
