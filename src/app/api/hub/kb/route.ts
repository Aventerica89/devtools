import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { hubCache } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { apiError } from '@/lib/api'

const NOTION_KB_DB_ID = 'b7c13809-35cc-42a2-a6ed-3231ab7e73ae'
const NOTION_STANDARDS_DB_ID = '885cd9c275bd45bb93e17fe0f156d1b1'
const TTL_MS = 60 * 60 * 1000 // 1 hour

async function fetchFromDb(dbId: string, token: string) {
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ page_size: 100 }),
  })
  if (!res.ok) throw new Error(`Notion API error: ${res.status}`)
  return ((await res.json()).results ?? []) as Record<string, unknown>[]
}

function pageToEntry(page: Record<string, unknown>) {
  const props = page.properties as Record<string, Record<string, unknown>>
  const titleProp = props?.Name ?? props?.Title ?? {}
  const titleArr = (titleProp.title as Array<{ plain_text: string }>) ?? []
  const title = titleArr.map((t) => t.plain_text).join('') || 'Untitled'
  const type = (props?.Type?.select as { name?: string } | null)?.name ?? ''
  const snippet = ((props?.Snippet?.rich_text as Array<{ plain_text: string }>) ?? [])
    .map((t) => t.plain_text).join('')
  const description = ((props?.Description?.rich_text as Array<{ plain_text: string }>) ?? [])
    .map((t) => t.plain_text).join('')
  return {
    id: page.id as string,
    title,
    type,
    snippet,
    description,
    lastEdited: page.last_edited_time as string,
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return apiError(401, 'Unauthorized')

    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type')
    const forceRefresh = searchParams.get('refresh') === 'true'
    const token = process.env.NOTION_API_TOKEN
    if (!token) return apiError(503, 'NOTION_API_TOKEN not configured')

    if (!forceRefresh) {
      const [cached] = await db.select().from(hubCache)
        .where(and(eq(hubCache.source, 'notion'), eq(hubCache.cacheKey, 'all')))
      if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < TTL_MS) {
        let entries = JSON.parse(cached.content)
        if (typeFilter) entries = entries.filter((e: { type: string }) => e.type === typeFilter)
        return NextResponse.json(entries)
      }
    }

    const [kbPages, standardsPages] = await Promise.all([
      fetchFromDb(NOTION_KB_DB_ID, token),
      fetchFromDb(NOTION_STANDARDS_DB_ID, token),
    ])
    const entries = [...kbPages.map(pageToEntry), ...standardsPages.map(pageToEntry)]
    const content = JSON.stringify(entries)
    const fetchedAt = new Date().toISOString()

    const [existing] = await db.select({ id: hubCache.id }).from(hubCache)
      .where(and(eq(hubCache.source, 'notion'), eq(hubCache.cacheKey, 'all')))
    if (existing) {
      await db.update(hubCache).set({ content, fetchedAt }).where(eq(hubCache.id, existing.id))
    } else {
      await db.insert(hubCache).values({ source: 'notion', cacheKey: 'all', content, fetchedAt })
    }

    const result = typeFilter ? entries.filter((e) => e.type === typeFilter) : entries
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch KB: ${message}`)
  }
}
