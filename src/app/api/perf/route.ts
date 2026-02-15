import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { devlog } from '@/lib/db/schema'
import { eq, and, gte, desc } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const days = parseInt(searchParams.get('days') || '7', 10)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString()

  const conditions = [
    eq(devlog.type, 'perf'),
    gte(devlog.createdAt, cutoffStr),
  ]
  if (projectId) {
    conditions.push(eq(devlog.projectId, projectId))
  }

  const entries = await db
    .select()
    .from(devlog)
    .where(and(...conditions))
    .orderBy(desc(devlog.createdAt))
    .limit(1000)

  return NextResponse.json(entries)
}
