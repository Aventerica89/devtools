import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { devlog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError } from '@/lib/api'

const ALLOWED_TYPES = ['console', 'error', 'network', 'perf', 'warning'] as const

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type || !ALLOWED_TYPES.includes(type as typeof ALLOWED_TYPES[number])) {
      return apiError(400, `Invalid type. Allowed: ${ALLOWED_TYPES.join(', ')}`)
    }

    await db.delete(devlog).where(eq(devlog.type, type))
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to bulk delete: ${message}`)
  }
}
