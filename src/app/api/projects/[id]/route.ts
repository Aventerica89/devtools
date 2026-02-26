import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { apiError, parseBody } from '@/lib/api'

const PLATFORMS = ['vercel', 'cloudflare-workers', 'cloudflare-pages', 'github'] as const

const ProjectUpdateSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  url: z.string().url().max(2048).optional().nullable(),
  platform: z.enum(PLATFORMS).optional().nullable(),
  platformId: z.string().max(256).optional().nullable(),
})

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await db.select().from(projects).where(eq(projects.id, id)).get()
    if (!project) return apiError(404, 'Project not found')
    return NextResponse.json(project)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch project: ${message}`)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = parseBody(ProjectUpdateSchema, body)
    if (!parsed.success) return parsed.response

    const result = await db.update(projects).set(parsed.data).where(eq(projects.id, id)).returning()
    if (result.length === 0) return apiError(404, 'Project not found')
    return NextResponse.json(result[0])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to update project: ${message}`)
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.delete(projects).where(eq(projects.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to delete project: ${message}`)
  }
}
