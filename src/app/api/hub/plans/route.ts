import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { hubCache } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { apiError } from '@/lib/api'
import fs from 'fs/promises'
import path from 'path'

type Plan = { title: string; project: string; status: string; date: string }

function parsePlansHtml(html: string): Plan[] {
  const rows: Plan[] = []
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let rowMatch
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const cells: string[] = []
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi
    let cellMatch
    while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim())
    }
    if (cells.length >= 4) {
      rows.push({ title: cells[0], project: cells[1], status: cells[2], date: cells[3] })
    }
  }
  return rows
}

async function updateCache(plans: Plan[]) {
  const content = JSON.stringify(plans)
  const fetchedAt = new Date().toISOString()
  const [existing] = await db.select({ id: hubCache.id }).from(hubCache)
    .where(and(eq(hubCache.source, 'plans'), eq(hubCache.cacheKey, 'all')))
  if (existing) {
    await db.update(hubCache).set({ content, fetchedAt }).where(eq(hubCache.id, existing.id))
  } else {
    await db.insert(hubCache).values({ source: 'plans', cacheKey: 'all', content, fetchedAt })
  }
}

async function checkHasHtml(): Promise<boolean> {
  try {
    const [row] = await db.select({ id: hubCache.id }).from(hubCache)
      .where(and(eq(hubCache.source, 'plans'), eq(hubCache.cacheKey, 'html')))
    return !!row
  } catch {
    return false
  }
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return apiError(401, 'Unauthorized')

  const hasHtml = await checkHasHtml()

  // Try reading from local file first (dev) — caches to Turso for production use
  try {
    const filePath = path.join(process.env.HOME ?? '~', 'Desktop', 'plans-index.html')
    const html = await fs.readFile(filePath, 'utf-8')
    const plans = parsePlansHtml(html)
    await updateCache(plans).catch(() => {}) // fire-and-forget cache update
    return NextResponse.json({ available: true, plans, source: 'local', hasHtml })
  } catch {
    // Fall back to cached data (available in production)
    try {
      const [cached] = await db.select().from(hubCache)
        .where(and(eq(hubCache.source, 'plans'), eq(hubCache.cacheKey, 'all')))
      if (cached) {
        return NextResponse.json({ available: true, plans: JSON.parse(cached.content), source: 'cache', hasHtml })
      }
    } catch {
      // DB unavailable
    }
    return NextResponse.json({ available: false, hasHtml })
  }
}
