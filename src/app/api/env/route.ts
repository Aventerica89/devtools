import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { envVars } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { apiError, parseBody, EnvVarCreateSchema, EnvVarUpdateSchema } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    let query = db.select().from(envVars).orderBy(desc(envVars.createdAt))
    if (projectId) {
      query = query.where(eq(envVars.projectId, projectId)) as typeof query
    }

    const all = await query.all()
    return NextResponse.json(all)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch env vars: ${message}`)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = parseBody(EnvVarCreateSchema, body)
    if (!parsed.success) return parsed.response

    const result = await db.insert(envVars).values(parsed.data).returning()
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to create env var: ${message}`)
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const parsed = parseBody(EnvVarUpdateSchema, body)
    if (!parsed.success) return parsed.response

    const { id, ...fields } = parsed.data
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (fields.key !== undefined) updates.key = fields.key
    if (fields.value !== undefined) updates.value = fields.value
    if (fields.sensitive !== undefined) updates.sensitive = fields.sensitive
    if (fields.description !== undefined) updates.description = fields.description

    const result = await db.update(envVars).set(updates).where(eq(envVars.id, id)).returning()
    if (result.length === 0) return apiError(404, 'Env var not found')
    return NextResponse.json(result[0])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to update env var: ${message}`)
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return apiError(400, 'Missing id parameter')
    const numId = parseInt(id, 10)
    if (isNaN(numId) || numId <= 0) return apiError(400, 'Invalid id parameter')

    await db.delete(envVars).where(eq(envVars.id, numId))
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to delete env var: ${message}`)
  }
}
