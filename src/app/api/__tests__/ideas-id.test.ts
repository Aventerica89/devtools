import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockUpdateReturning, mockUpdate, mockDelete } = vi.hoisted(() => {
  const mockUpdateReturning = vi.fn()
  const mockUpdateWhere = vi.fn(() => ({ returning: mockUpdateReturning }))
  const mockSet = vi.fn(() => ({ where: mockUpdateWhere }))
  const mockUpdate = vi.fn(() => ({ set: mockSet }))

  const mockDeleteWhere = vi.fn().mockResolvedValue(undefined)
  const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }))

  return { mockUpdateReturning, mockUpdate, mockDelete }
})

vi.mock('@/lib/db', () => ({ db: { update: mockUpdate, delete: mockDelete } }))
vi.mock('@/lib/db/schema', () => ({ ideas: {}, widgetConfig: {} }))
vi.mock('drizzle-orm', () => ({ eq: vi.fn() }))

import { PATCH, DELETE } from '../ideas/[id]/route'

function patchRequest(body: unknown): Request {
  return new Request('http://localhost/api/ideas/1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function deleteRequest(): Request {
  return new Request('http://localhost/api/ideas/1', {
    method: 'DELETE',
  })
}

describe('PATCH /api/ideas/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates status', async () => {
    mockUpdateReturning.mockResolvedValue([{ id: 1, status: 'in-progress' }])
    const res = await PATCH(patchRequest({ status: 'in-progress' }), {
      params: Promise.resolve({ id: '1' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('in-progress')
  })

  it('returns 400 for non-numeric id', async () => {
    const res = await PATCH(patchRequest({ status: 'done' }), {
      params: Promise.resolve({ id: 'abc' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 404 when idea not found', async () => {
    mockUpdateReturning.mockResolvedValue([])
    const res = await PATCH(patchRequest({ status: 'done' }), {
      params: Promise.resolve({ id: '999' }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid status value', async () => {
    const res = await PATCH(patchRequest({ status: 'invalid' }), {
      params: Promise.resolve({ id: '1' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/ideas/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes an idea', async () => {
    const res = await DELETE(deleteRequest(), {
      params: Promise.resolve({ id: '1' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 400 for non-numeric id', async () => {
    const res = await DELETE(deleteRequest(), {
      params: Promise.resolve({ id: 'nope' }),
    })
    expect(res.status).toBe(400)
  })
})
