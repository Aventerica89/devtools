import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bugs } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project')
  const status = searchParams.get('status')
  const limitParam = searchParams.get('limit')

  const conditions = []
  if (projectId) {
    conditions.push(eq(bugs.projectId, projectId))
  }
  if (status) {
    conditions.push(eq(bugs.status, status))
  }

  let query = db.select().from(bugs).orderBy(desc(bugs.createdAt))
  if (conditions.length > 0) {
    query = query.where(
      conditions.length === 1 ? conditions[0] : and(...conditions)
    ) as typeof query
  }

  const limit = limitParam ? parseInt(limitParam, 10) : undefined
  if (limit && limit > 0) {
    query = query.limit(limit) as typeof query
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
