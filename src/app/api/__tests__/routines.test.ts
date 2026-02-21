import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../routines/route'

const { mockDb } = vi.hoisted(() => {
  const mockDb = { select: vi.fn(), insert: vi.fn() }
  return { mockDb }
})
vi.mock('@/lib/db', () => ({ db: mockDb }))
vi.mock('@/lib/db/schema', () => ({ routineChecklists: {} }))
vi.mock('drizzle-orm', () => ({ eq: vi.fn((a, b) => ({ eq: a, val: b })) }))
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn().mockResolvedValue({ userId: 'user_1' }) }))

beforeEach(() => vi.clearAllMocks())

describe('GET /api/routines', () => {
  it('returns checklists for a project', async () => {
    const rows = [{ id: 1, projectId: 'wp-jupiter', name: 'Weekly' }]
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(rows) }),
    })
    const req = new Request('http://localhost/api/routines?projectId=wp-jupiter')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(rows)
  })
})

describe('POST /api/routines', () => {
  it('creates a checklist', async () => {
    const newRow = { id: 2, projectId: 'wp-jupiter', name: 'Daily', sortOrder: 0 }
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([newRow]) }),
    })
    const req = new Request('http://localhost/api/routines', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'wp-jupiter', name: 'Daily' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect((await res.json()).name).toBe('Daily')
  })
})
