import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAll, mockReturning, mockValues, mockInsert, mockSelect } = vi.hoisted(() => {
  const mockReturning = vi.fn()
  const mockValues = vi.fn(() => ({ returning: mockReturning }))
  const mockAll = vi.fn()
  const mockInsert = vi.fn(() => ({ values: mockValues }))
  const mockLimit = vi.fn(() => ({ all: mockAll }))
  const mockWhere = vi.fn(() => ({ all: mockAll, limit: mockLimit }))
  const mockOrderBy = vi.fn(() => ({ where: mockWhere, all: mockAll, limit: mockLimit }))
  const mockSelect = vi.fn(() => ({ from: vi.fn(() => ({ orderBy: mockOrderBy })) }))
  return { mockAll, mockReturning, mockValues, mockInsert, mockSelect }
})

vi.mock('@/lib/db', () => ({ db: { select: mockSelect, insert: mockInsert } }))
vi.mock('@/lib/db/schema', () => ({ devlog: {}, widgetConfig: {} }))
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), desc: vi.fn(), and: vi.fn(), gte: vi.fn() }))

import { GET, POST } from '../devlog/route'

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/devlog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/devlog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns entries', async () => {
    mockAll.mockResolvedValue([{ id: 1, title: 'Note' }])
    const res = await GET(new Request('http://localhost/api/devlog'))
    expect(res.status).toBe(200)
    expect(Array.isArray(await res.json())).toBe(true)
  })
})

describe('POST /api/devlog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates an entry with valid data', async () => {
    mockReturning.mockResolvedValue([{ id: 1, title: 'Deploy note', projectId: 'p1' }])
    const res = await POST(postRequest({ projectId: 'p1', title: 'Deploy note' }))
    expect(res.status).toBe(201)
  })

  it('defaults type to note and source to manual', async () => {
    mockReturning.mockResolvedValue([{ id: 2, type: 'note', source: 'manual' }])
    await POST(postRequest({ projectId: 'p1', title: 'Hello' }))
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'note', source: 'manual' })
    )
  })

  it('returns 400 for missing title', async () => {
    const res = await POST(postRequest({ projectId: 'p1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing projectId', async () => {
    const res = await POST(postRequest({ title: 'x' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid source value', async () => {
    const res = await POST(postRequest({ projectId: 'p1', title: 'x', source: 'robot' }))
    expect(res.status).toBe(400)
  })
})
