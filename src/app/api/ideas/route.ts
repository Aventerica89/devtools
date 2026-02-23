import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ideas } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { apiError, parseBody, verifyApiKey, verifyWidgetPin, IdeaSchema } from '@/lib/api'
import { sanitizeInput } from '@/lib/sanitize'

export async function GET(request: Request) {
  // Dashboard requests pass through Clerk middleware — no explicit auth needed.
  // CLI requests include X-DevTools-Api-Key header (verified in middleware).
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const limitParam = searchParams.get('limit')

    const conditions = []
    if (projectId) conditions.push(eq(ideas.projectId, projectId))
    if (status) conditions.push(eq(ideas.status, status))

    let query = db.select().from(ideas).orderBy(desc(ideas.createdAt))
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
    return apiError(500, `Failed to fetch ideas: ${message}`)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = parseBody(IdeaSchema, body)
    if (!parsed.success) return parsed.response

    // Widget uses PIN; CLI uses API key; dashboard uses Clerk (no header)
    if (request.headers.get('x-devtools-pin')) {
      const pinError = await verifyWidgetPin(request, parsed.data.projectId)
      if (pinError) return pinError
    } else if (request.headers.get('x-devtools-api-key')) {
      const keyError = verifyApiKey(request)
      if (keyError) return keyError
    } else {
      // No auth header — reject unless coming through Clerk middleware
      // Clerk middleware sets auth context; if neither header is present
      // and this is a direct external request, it won't reach here.
      // But for safety, require at least one auth method for POST.
      return apiError(401, 'Authentication required')
    }

    const { tags, ...fields } = parsed.data
    const result = await db
      .insert(ideas)
      .values({
        ...fields,
        title: sanitizeInput(fields.title),
        body: fields.body ? sanitizeInput(fields.body) : null,
        tags: tags ? JSON.stringify(tags) : null,
      })
      .returning()

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to create idea: ${message}`)
  }
}
