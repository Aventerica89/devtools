import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { hubCache } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { apiError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return apiError(401, 'Unauthorized')

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') return apiError(400, 'No file provided')

    const html = await (file as File).text()
    if (!html.trim()) return apiError(400, 'File is empty')

    const fetchedAt = new Date().toISOString()
    const [existing] = await db.select({ id: hubCache.id }).from(hubCache)
      .where(and(eq(hubCache.source, 'plans'), eq(hubCache.cacheKey, 'html')))

    if (existing) {
      await db.update(hubCache).set({ content: html, fetchedAt }).where(eq(hubCache.id, existing.id))
    } else {
      await db.insert(hubCache).values({ source: 'plans', cacheKey: 'html', content: html, fetchedAt })
    }

    return NextResponse.json({ ok: true, size: html.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Upload failed: ${message}`)
  }
}
