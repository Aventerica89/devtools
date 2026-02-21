import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { devlog } from '@/lib/db/schema'
import { eq, desc, and, gte } from 'drizzle-orm'
import { apiError, parseBody, DevlogSchema } from '@/lib/api'
import { sanitizeInput, sanitizeMetadata } from '@/lib/sanitize'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project')
    const type = searchParams.get('type')
    const limitParam = searchParams.get('limit')
    const daysParam = searchParams.get('days')

    const conditions = []
    if (projectId) conditions.push(eq(devlog.projectId, projectId))
    if (type) conditions.push(eq(devlog.type, type))
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
      query = query.limit(Math.min(limit, 500)) as typeof query
    }

    const all = await query.all()
    return NextResponse.json(all)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch devlog: ${message}`)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = parseBody(DevlogSchema, body)
    if (!parsed.success) return parsed.response

    const { metadata, ...fields } = parsed.data

    // Sanitize user inputs to prevent XSS
    const sanitizedData = {
      ...fields,
      title: sanitizeInput(fields.title),
      content: fields.content ? sanitizeInput(fields.content) : null,
      metadata: metadata ? JSON.stringify(sanitizeMetadata(metadata)) : null,
    }

    const result = await db.insert(devlog).values(sanitizedData).returning()
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to create devlog entry: ${message}`)
  }
}
