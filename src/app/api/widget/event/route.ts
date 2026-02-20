import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { devlog } from '@/lib/db/schema'
import { z } from 'zod'
import { apiError, parseBody, verifyWidgetPin, WidgetEventSchema } from '@/lib/api'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { sanitizeInput, sanitizeMetadata } from '@/lib/sanitize'

const BatchSchema = z.object({
  events: z.array(WidgetEventSchema).min(1).max(100),
})

export async function POST(request: Request) {
  try {
    // Rate limiting: 100 requests per minute per IP/project
    const identifier = getRateLimitIdentifier(request)
    const rateLimit = checkRateLimit(identifier, 100, 60 * 1000)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', reset: new Date(rateLimit.reset).toISOString() },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
            'Retry-After': Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    const body = await request.json()
    const parsed = parseBody(BatchSchema, body)
    if (!parsed.success) return parsed.response

    // Verify PIN against the first event's project (all events must share a project)
    const projectId = parsed.data.events[0].projectId
    const pinError = await verifyWidgetPin(request, projectId)
    if (pinError) return pinError

    // Reject cross-project batches to prevent PIN bypass via mixed projectIds
    if (parsed.data.events.some((e) => e.projectId !== projectId)) {
      return apiError(400, 'All events in a batch must belong to the same project')
    }

    // Sanitize widget events to prevent XSS
    const rows = parsed.data.events.map((e) => ({
      projectId: e.projectId,
      type: e.type,
      title: sanitizeInput(e.title),
      content: e.content ? sanitizeInput(e.content) : '',
      source: 'auto' as const,
      metadata: e.metadata ? JSON.stringify(sanitizeMetadata(e.metadata)) : null,
    }))

    await db.insert(devlog).values(rows)

    return NextResponse.json(
      { inserted: rows.length },
      {
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to ingest events: ${message}`)
  }
}
