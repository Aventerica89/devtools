import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'
import { apiError, parseBody, ProjectSchema } from '@/lib/api'

export async function GET() {
  try {
    const all = await db.select().from(projects).all()
    return NextResponse.json(all)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch projects: ${message}`)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = parseBody(ProjectSchema, body)
    if (!parsed.success) return parsed.response

    const result = await db.insert(projects).values({
      id: parsed.data.id,
      name: parsed.data.name,
      url: parsed.data.url ?? null,
    }).returning()
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to create project: ${message}`)
  }
}
