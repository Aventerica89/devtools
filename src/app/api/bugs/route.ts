import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bugs } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { apiError, parseBody, verifyWidgetPin, BugSchema } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project')
    const status = searchParams.get('status')
    const limitParam = searchParams.get('limit')

    const conditions = []
    if (projectId) conditions.push(eq(bugs.projectId, projectId))
    if (status) conditions.push(eq(bugs.status, status))

    let query = db.select().from(bugs).orderBy(desc(bugs.createdAt))
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
    return apiError(500, `Failed to fetch bugs: ${message}`)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = parseBody(BugSchema, body)
    if (!parsed.success) return parsed.response

    // Widget-originated requests carry the PIN header; verify it
    if (request.headers.get('x-devtools-pin')) {
      const pinError = await verifyWidgetPin(request, parsed.data.projectId)
      if (pinError) return pinError
    }

    const { metadata, ...fields } = parsed.data
    const result = await db.insert(bugs).values({
      ...fields,
      metadata: metadata ? JSON.stringify(metadata) : null,
    }).returning()
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to create bug: ${message}`)
  }
}
