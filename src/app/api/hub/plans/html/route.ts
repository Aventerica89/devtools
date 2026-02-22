import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { hubCache } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const [cached] = await db.select({ content: hubCache.content }).from(hubCache)
    .where(and(eq(hubCache.source, 'plans'), eq(hubCache.cacheKey, 'html')))

  if (!cached) return new Response('Not found', { status: 404 })

  return new Response(cached.content, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
