import { describe, it, expect } from 'vitest'
import { RoutineChecklistSchema, RoutineItemSchema, RoutineRunCheckSchema } from '@/lib/api'

describe('RoutineChecklistSchema', () => {
  it('validates valid checklist', () => {
    const result = RoutineChecklistSchema.safeParse({ projectId: 'wp-jupiter', name: 'Weekly' })
    expect(result.success).toBe(true)
  })
  it('rejects missing projectId', () => {
    const result = RoutineChecklistSchema.safeParse({ name: 'Weekly' })
    expect(result.success).toBe(false)
  })
})

describe('RoutineItemSchema', () => {
  it('defaults type to maintenance', () => {
    const result = RoutineItemSchema.parse({ name: 'Check logs' })
    expect(result.type).toBe('maintenance')
  })
  it('rejects invalid type', () => {
    const result = RoutineItemSchema.safeParse({ name: 'Check', type: 'bogus' })
    expect(result.success).toBe(false)
  })
})

describe('RoutineRunCheckSchema', () => {
  it('accepts boolean', () => {
    expect(RoutineRunCheckSchema.parse({ checked: true })).toEqual({ checked: true })
  })
})
