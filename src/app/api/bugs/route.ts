import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bugs } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project')

  let query = db.select().from(bugs).orderBy(desc(bugs.createdAt))
  if (projectId) {
    query = query.where(eq(bugs.projectId, projectId)) as typeof query
  }

  const all = await query.all()
  return NextResponse.json(all)
}

export async function POST(request: Request) {
  const body = await request.json()
  const result = await db.insert(bugs).values({
    projectId: body.projectId,
    title: body.title,
    description: body.description || null,
    severity: body.severity || 'medium',
    screenshotUrl: body.screenshotUrl || null,
    stackTrace: body.stackTrace || null,
    pageUrl: body.pageUrl || null,
    userAgent: body.userAgent || null,
    metadata: body.metadata ? JSON.stringify(body.metadata) : null,
  }).returning()
  return NextResponse.json(result[0], { status: 201 })
}
