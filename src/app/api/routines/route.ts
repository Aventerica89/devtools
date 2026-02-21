import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineChecklists } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError, parseBody, RoutineChecklistSchema } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return apiError(401, 'Unauthorized')
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const query = db.select().from(routineChecklists)
    const rows = projectId
      ? await query.where(eq(routineChecklists.projectId, projectId))
      : await query
    return NextResponse.json(rows)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch checklists: ${message}`)
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return apiError(401, 'Unauthorized')
    const body = await request.json()
    const parsed = parseBody(RoutineChecklistSchema, body)
    if (!parsed.success) return parsed.response
    const [row] = await db
      .insert(routineChecklists)
      .values({ ...parsed.data, sortOrder: parsed.data.sortOrder ?? 0 })
      .returning()
    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to create checklist: ${message}`)
  }
}
