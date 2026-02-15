import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { savedRequests } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project')

  let query = db
    .select()
    .from(savedRequests)
    .orderBy(desc(savedRequests.createdAt))

  if (projectId) {
    query = query.where(
      eq(savedRequests.projectId, projectId)
    ) as typeof query
  }

  const all = await query.all()
  return NextResponse.json(all)
}

export async function POST(request: Request) {
  const body = await request.json()
  const result = await db
    .insert(savedRequests)
    .values({
      projectId: body.projectId || null,
      name: body.name,
      method: body.method,
      url: body.url,
      headers: body.headers ? JSON.stringify(body.headers) : null,
      body: body.body || null,
    })
    .returning()
  return NextResponse.json(result[0], { status: 201 })
}
