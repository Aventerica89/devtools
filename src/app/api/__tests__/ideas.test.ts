import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAll, mockReturning, mockInsert, mockSelect } = vi.hoisted(() => {
  const mockReturning = vi.fn()
  const mockAll = vi.fn()
  const mockInsert = vi.fn(() => ({ values: vi.fn(() => ({ returning: mockReturning })) }))
  const mockLimit = vi.fn(() => ({ all: mockAll }))
  const mockWhere = vi.fn(() => ({ all: mockAll, limit: mockLimit }))
  const mockOrderBy = vi.fn(() => ({ where: mockWhere, all: mockAll, limit: mockLimit }))
  const mockSelect = vi.fn(() => ({ from: vi.fn(() => ({ orderBy: mockOrderBy })) }))
  return { mockAll, mockReturning, mockInsert, mockSelect }
})

vi.mock('@/lib/db', () => ({ db: { select: mockSelect, insert: mockInsert } }))
vi.mock('@/lib/db/schema', () => ({ ideas: {}, widgetConfig: {} }))
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), desc: vi.fn(), and: vi.fn() }))

// Set API key for auth tests
process.env.DEVTOOLS_API_KEY = 'test-api-key'

import { GET, POST } from '../ideas/route'

function getRequest(params = ''): Request {
  return new Request(`http://localhost/api/ideas${params}`, {
    headers: { 'x-devtools-api-key': 'test-api-key' },
  })
}

function postRequest(body: unknown, usePin = false): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (usePin) headers['x-devtools-pin'] = 'hashed-pin'
  else headers['x-devtools-api-key'] = 'test-api-key'
  return new Request('http://localhost/api/ideas', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('GET /api/ideas', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns idea list with API key auth', async () => {
    mockAll.mockResolvedValue([{ id: 1, title: 'Great idea', projectId: 'p1' }])
    const res = await GET(getRequest('?projectId=p1'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('returns ideas without auth (dashboard path via Clerk)', async () => {
    mockAll.mockResolvedValue([{ id: 1, title: 'Great idea' }])
    const res = await GET(new Request('http://localhost/api/ideas'))
    expect(res.status).toBe(200)
  })
})

describe('POST /api/ideas', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates idea with valid data via API key', async () => {
    mockReturning.mockResolvedValue([{ id: 1, title: 'Build it', projectId: 'p1' }])
    const res = await POST(postRequest({ projectId: 'p1', title: 'Build it' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.title).toBe('Build it')
  })

  it('returns 400 for missing projectId', async () => {
    const res = await POST(postRequest({ title: 'Oops' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing title', async () => {
    const res = await POST(postRequest({ projectId: 'p1' }))
    expect(res.status).toBe(400)
  })

  it('returns 401 for POST without any auth', async () => {
    const res = await POST(new Request('http://localhost/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'p1', title: 'test' }),
    }))
    expect(res.status).toBe(401)
  })
})
