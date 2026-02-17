import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { savedRequests } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { apiError, parseBody, SavedRequestSchema } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project')

    let query = db.select().from(savedRequests).orderBy(desc(savedRequests.createdAt))
    if (projectId) {
      query = query.where(eq(savedRequests.projectId, projectId)) as typeof query
    }

    const all = await query.all()
    return NextResponse.json(all)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch saved requests: ${message}`)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = parseBody(SavedRequestSchema, body)
    if (!parsed.success) return parsed.response

    const { headers, ...fields } = parsed.data
    const result = await db.insert(savedRequests).values({
      ...fields,
      headers: headers ? JSON.stringify(headers) : null,
    }).returning()
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to save request: ${message}`)
  }
}
