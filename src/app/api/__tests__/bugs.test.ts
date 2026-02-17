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
vi.mock('@/lib/db/schema', () => ({ bugs: {}, widgetConfig: {} }))
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), desc: vi.fn(), and: vi.fn() }))

import { GET, POST } from '../bugs/route'

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/bugs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/bugs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns bug list', async () => {
    mockAll.mockResolvedValue([{ id: 1, title: 'A bug' }])
    const res = await GET(new Request('http://localhost/api/bugs'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })
})

describe('POST /api/bugs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a bug with valid data (no PIN header, dashboard path)', async () => {
    mockReturning.mockResolvedValue([{ id: 1, title: 'NullPointerException', projectId: 'p1' }])
    const res = await POST(postRequest({ projectId: 'p1', title: 'NullPointerException' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.title).toBe('NullPointerException')
  })

  it('returns 400 for missing projectId', async () => {
    const res = await POST(postRequest({ title: 'Oops' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing title', async () => {
    const res = await POST(postRequest({ projectId: 'p1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid severity', async () => {
    const res = await POST(postRequest({ projectId: 'p1', title: 'Bug', severity: 'critical' }))
    expect(res.status).toBe(400)
  })

  it('accepts valid severity values', async () => {
    mockReturning.mockResolvedValue([{ id: 2, title: 'Bug', severity: 'high' }])
    for (const severity of ['low', 'medium', 'high']) {
      const res = await POST(postRequest({ projectId: 'p1', title: 'Bug', severity }))
      expect(res.status).toBe(201)
    }
  })
})
