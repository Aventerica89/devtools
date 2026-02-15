import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { devlog } from '@/lib/db/schema'
import { eq, desc, and, gte } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project')
  const type = searchParams.get('type')
  const limitParam = searchParams.get('limit')
  const daysParam = searchParams.get('days')

  const conditions = []
  if (projectId) {
    conditions.push(eq(devlog.projectId, projectId))
  }
  if (type) {
    conditions.push(eq(devlog.type, type))
  }
  if (daysParam) {
    const days = parseInt(daysParam, 10)
    if (days > 0) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      conditions.push(gte(devlog.createdAt, cutoff.toISOString()))
    }
  }

  let query = db.select().from(devlog).orderBy(desc(devlog.createdAt))
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
  const result = await db.insert(devlog).values({
    projectId: body.projectId,
    type: body.type || 'note',
    title: body.title,
    content: body.content || null,
    source: body.source || 'manual',
    metadata: body.metadata ? JSON.stringify(body.metadata) : null,
  }).returning()
  return NextResponse.json(result[0], { status: 201 })
}
