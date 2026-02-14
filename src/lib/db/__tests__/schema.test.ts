import { describe, it, expect } from 'vitest'
import * as schema from '../schema'

describe('schema', () => {
  it('should export all tables', () => {
    expect(schema.projects).toBeDefined()
    expect(schema.bugs).toBeDefined()
    expect(schema.devlog).toBeDefined()
    expect(schema.savedRequests).toBeDefined()
    expect(schema.widgetConfig).toBeDefined()
  })
})
