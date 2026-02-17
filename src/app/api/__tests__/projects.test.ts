import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAll, mockReturning, mockInsert, mockSelect } = vi.hoisted(() => {
  const mockReturning = vi.fn()
  const mockAll = vi.fn()
  const mockInsert = vi.fn(() => ({ values: vi.fn(() => ({ returning: mockReturning })) }))
  const mockSelect = vi.fn(() => ({
    from: vi.fn(() => ({
      all: mockAll,
      orderBy: vi.fn(() => ({ all: mockAll, where: vi.fn(() => ({ all: mockAll })) })),
    })),
  }))
  return { mockAll, mockReturning, mockInsert, mockSelect }
})

vi.mock('@/lib/db', () => ({ db: { select: mockSelect, insert: mockInsert } }))
vi.mock('@/lib/db/schema', () => ({ projects: {}, widgetConfig: {} }))
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), desc: vi.fn() }))

import { GET, POST } from '../projects/route'

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/projects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns list of projects', async () => {
    mockAll.mockResolvedValue([{ id: 'proj1', name: 'My Project' }])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0].id).toBe('proj1')
  })

  it('returns 500 on DB error', async () => {
    mockAll.mockRejectedValue(new Error('DB down'))
    const res = await GET()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('DB down')
  })
})

describe('POST /api/projects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates and returns a new project', async () => {
    mockReturning.mockResolvedValue([{ id: 'p1', name: 'Test' }])
    const res = await POST(postRequest({ id: 'p1', name: 'Test' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('p1')
  })

  it('returns 400 for missing name', async () => {
    const res = await POST(postRequest({ id: 'p1' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('returns 400 for empty id', async () => {
    const res = await POST(postRequest({ id: '', name: 'Test' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid url', async () => {
    const res = await POST(postRequest({ id: 'p1', name: 'Test', url: 'not-a-url' }))
    expect(res.status).toBe(400)
  })

  it('accepts a valid https url', async () => {
    mockReturning.mockResolvedValue([{ id: 'p1', name: 'Test', url: 'https://example.com' }])
    const res = await POST(postRequest({ id: 'p1', name: 'Test', url: 'https://example.com' }))
    expect(res.status).toBe(201)
  })
})
