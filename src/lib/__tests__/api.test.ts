import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  apiError, parseBody, ProjectSchema, BugSchema, WidgetEventSchema,
  IdeaSchema, IdeaUpdateSchema, verifyApiKey,
} from '../api'
import { z } from 'zod'

// verifyWidgetPin calls the DB — keep it out of pure-logic tests
vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/db/schema', () => ({ widgetConfig: {} }))
vi.mock('drizzle-orm', () => ({ eq: vi.fn() }))

describe('apiError', () => {
  it('returns JSON with the correct status and error field', async () => {
    const res = apiError(400, 'bad input')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'bad input' })
  })

  it('works for 5xx codes', async () => {
    const res = apiError(500, 'internal')
    expect(res.status).toBe(500)
  })
})

describe('parseBody', () => {
  const Schema = z.object({ name: z.string().min(1), count: z.number().int() })

  it('returns success and typed data for valid input', () => {
    const result = parseBody(Schema, { name: 'foo', count: 3 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('foo')
      expect(result.data.count).toBe(3)
    }
  })

  it('returns failure response for missing required field', async () => {
    const result = parseBody(Schema, { name: 'foo' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.response.status).toBe(400)
      const body = await result.response.json()
      expect(body.error).toContain('count')
    }
  })

  it('returns failure for wrong type', async () => {
    const result = parseBody(Schema, { name: '', count: 'not-a-number' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const body = await result.response.json()
      expect(body.error).toBeTruthy()
    }
  })
})

describe('ProjectSchema', () => {
  it('accepts valid project', () => {
    const r = ProjectSchema.safeParse({ id: 'my-project', name: 'My Project' })
    expect(r.success).toBe(true)
  })

  it('rejects empty id', () => {
    const r = ProjectSchema.safeParse({ id: '', name: 'x' })
    expect(r.success).toBe(false)
  })

  it('rejects invalid url', () => {
    const r = ProjectSchema.safeParse({ id: 'x', name: 'x', url: 'not-a-url' })
    expect(r.success).toBe(false)
  })

  it('accepts null url', () => {
    const r = ProjectSchema.safeParse({ id: 'x', name: 'x', url: null })
    expect(r.success).toBe(true)
  })
})

describe('BugSchema', () => {
  const valid = { projectId: 'proj1', title: 'Test bug' }

  it('accepts minimal valid bug', () => {
    expect(BugSchema.safeParse(valid).success).toBe(true)
  })

  it('defaults severity to medium', () => {
    const r = BugSchema.safeParse(valid)
    if (r.success) expect(r.data.severity).toBe('medium')
  })

  it('rejects invalid severity', () => {
    expect(BugSchema.safeParse({ ...valid, severity: 'critical' }).success).toBe(false)
  })

  it('rejects missing title', () => {
    expect(BugSchema.safeParse({ projectId: 'x' }).success).toBe(false)
  })

  it('rejects title over 512 chars', () => {
    expect(BugSchema.safeParse({ ...valid, title: 'x'.repeat(513) }).success).toBe(false)
  })
})

describe('WidgetEventSchema', () => {
  const valid = { projectId: 'p1', type: 'console', title: 'log message' }

  it('accepts valid event', () => {
    expect(WidgetEventSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty projectId', () => {
    expect(WidgetEventSchema.safeParse({ ...valid, projectId: '' }).success).toBe(false)
  })

  it('rejects title over 512 chars', () => {
    expect(WidgetEventSchema.safeParse({ ...valid, title: 'x'.repeat(513) }).success).toBe(false)
  })
})

describe('IdeaSchema', () => {
  it('accepts valid idea with required fields only', () => {
    const result = parseBody(IdeaSchema, { projectId: 'p1', title: 'My idea' })
    expect(result.success).toBe(true)
  })

  it('accepts idea with all fields', () => {
    const result = parseBody(IdeaSchema, {
      projectId: 'p1',
      title: 'My idea',
      body: 'Details here',
      status: 'in-progress',
      tags: ['ux', 'mobile'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing title', () => {
    const result = parseBody(IdeaSchema, { projectId: 'p1' })
    expect(result.success).toBe(false)
  })

  it('rejects missing projectId', () => {
    const result = parseBody(IdeaSchema, { title: 'x' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status', () => {
    const result = parseBody(IdeaSchema, {
      projectId: 'p1',
      title: 'x',
      status: 'unknown',
    })
    expect(result.success).toBe(false)
  })

  it('defaults status to idea', () => {
    const result = parseBody(IdeaSchema, { projectId: 'p1', title: 'x' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('idea')
    }
  })

  it('rejects tags with too many items', () => {
    const result = parseBody(IdeaSchema, {
      projectId: 'p1',
      title: 'x',
      tags: Array(11).fill('tag'),
    })
    expect(result.success).toBe(false)
  })
})

describe('IdeaUpdateSchema', () => {
  it('accepts partial update with status only', () => {
    const result = parseBody(IdeaUpdateSchema, { status: 'done' })
    expect(result.success).toBe(true)
  })

  it('accepts partial update with title only', () => {
    const result = parseBody(IdeaUpdateSchema, { title: 'Updated title' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = parseBody(IdeaUpdateSchema, { status: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('accepts empty object (no-op update)', () => {
    const result = parseBody(IdeaUpdateSchema, {})
    expect(result.success).toBe(true)
  })
})

describe('verifyApiKey', () => {
  const originalEnv = process.env.DEVTOOLS_API_KEY

  beforeEach(() => {
    process.env.DEVTOOLS_API_KEY = 'test-key-abc'
  })

  afterEach(() => {
    process.env.DEVTOOLS_API_KEY = originalEnv
  })

  it('returns null for correct key', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-devtools-api-key': 'test-key-abc' },
    })
    expect(verifyApiKey(req)).toBeNull()
  })

  it('returns 401 for wrong key', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-devtools-api-key': 'wrong' },
    })
    const res = verifyApiKey(req)
    expect(res?.status).toBe(401)
  })

  it('returns 401 when header missing', () => {
    const req = new Request('http://localhost/')
    const res = verifyApiKey(req)
    expect(res?.status).toBe(401)
  })

  it('returns 401 when env var not set', () => {
    delete process.env.DEVTOOLS_API_KEY
    const req = new Request('http://localhost/', {
      headers: { 'x-devtools-api-key': 'test-key-abc' },
    })
    const res = verifyApiKey(req)
    expect(res?.status).toBe(401)
  })
})
