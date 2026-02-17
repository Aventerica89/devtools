import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { devlog } from '@/lib/db/schema'
import { eq, and, gte, desc } from 'drizzle-orm'
import { apiError } from '@/lib/api'

const MAX_LIMIT = 500
const DEFAULT_LIMIT = 200

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '7', 10), 1), 90)
    const limit = Math.min(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10), MAX_LIMIT)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const conditions = [
      eq(devlog.type, 'perf'),
      gte(devlog.createdAt, cutoff.toISOString()),
    ]
    if (projectId) {
      conditions.push(eq(devlog.projectId, projectId))
    }

    const entries = await db
      .select()
      .from(devlog)
      .where(and(...conditions))
      .orderBy(desc(devlog.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json(entries)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch perf entries: ${message}`)
  }
}
