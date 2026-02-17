import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { widgetConfig } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Verify the X-DevTools-Pin header against the stored pinHash for a project.
 * The widget sends its pinHash directly; we compare it to the DB-stored hash.
 * Returns an error response if verification fails, or null if it passes.
 */
export async function verifyWidgetPin(
  request: Request,
  projectId: string
): Promise<NextResponse | null> {
  const pinHeader = request.headers.get('x-devtools-pin')
  if (!pinHeader) {
    return apiError(401, 'Missing X-DevTools-Pin header')
  }

  const rows = await db
    .select({ pinHash: widgetConfig.pinHash })
    .from(widgetConfig)
    .where(eq(widgetConfig.projectId, projectId))
    .limit(1)

  if (rows.length === 0) {
    return apiError(401, 'Unknown project')
  }

  if (pinHeader !== rows[0].pinHash) {
    return apiError(401, 'Invalid PIN')
  }

  return null
}

export function apiError(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export function parseBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues
      .map((e) => `${e.path.map(String).join('.')}: ${e.message}`)
      .join(', ')
    return { success: false, response: apiError(400, message) }
  }
  return { success: true, data: result.data }
}

// Shared schemas
export const ProjectSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(256),
  url: z.string().url().optional().nullable(),
})

export const BugSchema = z.object({
  projectId: z.string().min(1).max(128),
  title: z.string().min(1).max(512),
  description: z.string().max(10000).optional().nullable(),
  severity: z.enum(['low', 'medium', 'high']).default('medium'),
  screenshotUrl: z.string().url().max(2048).optional().nullable(),
  stackTrace: z.string().max(50000).optional().nullable(),
  pageUrl: z.string().max(2048).optional().nullable(),
  userAgent: z.string().max(512).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const DevlogSchema = z.object({
  projectId: z.string().min(1).max(128),
  type: z.string().min(1).max(64).default('note'),
  title: z.string().min(1).max(512),
  content: z.string().max(50000).optional().nullable(),
  source: z.enum(['manual', 'auto']).default('manual'),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const EnvVarCreateSchema = z.object({
  projectId: z.string().min(1).max(128),
  key: z.string().min(1).max(256).regex(/^[A-Z0-9_]+$/i, 'Key must be alphanumeric with underscores'),
  value: z.string().max(10000),
  sensitive: z.boolean().default(false),
  description: z.string().max(1000).optional().nullable(),
})

export const EnvVarUpdateSchema = z.object({
  id: z.number().int().positive(),
  key: z.string().min(1).max(256).regex(/^[A-Z0-9_]+$/i, 'Key must be alphanumeric with underscores').optional(),
  value: z.string().max(10000).optional(),
  sensitive: z.boolean().optional(),
  description: z.string().max(1000).optional().nullable(),
})

export const SavedRequestSchema = z.object({
  projectId: z.string().max(128).optional().nullable(),
  name: z.string().min(1).max(256),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
  url: z.string().url().max(2048),
  headers: z.record(z.string(), z.string()).optional().nullable(),
  body: z.string().max(100000).optional().nullable(),
})

export const WidgetEventSchema = z.object({
  projectId: z.string().min(1).max(128),
  type: z.string().min(1).max(64),
  title: z.string().min(1).max(512),
  content: z.string().max(50000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const WidgetConfigUpdateSchema = z.object({
  projectId: z.string().min(1).max(128),
  enabledTools: z.array(z.string().max(64)).optional(),
  theme: z.enum(['dark', 'light']).optional(),
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional(),
})
