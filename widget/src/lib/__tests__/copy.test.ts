import { describe, it, expect } from 'vitest'
import { formatConsoleRow, formatNetworkRow, formatErrorRow, formatHealthRow } from '../copy'

describe('formatConsoleRow', () => {
  it('includes level and message args', () => {
    const entry = { id: 1, level: 'error' as const, args: ['Oops'], timestamp: Date.now() }
    const out = formatConsoleRow(entry)
    expect(out).toContain('[ERROR]')
    expect(out).toContain('Oops')
  })
})

describe('formatNetworkRow', () => {
  it('formats method + url + status', () => {
    const entry = { id: 1, method: 'GET', url: '/api/users', status: 404, statusText: 'Not Found',
      duration: 50, requestSize: 0, responseSize: 0, requestHeaders: {}, responseHeaders: {},
      startTime: 0, timestamp: Date.now() }
    const out = formatNetworkRow(entry)
    expect(out).toContain('[NETWORK]')
    expect(out).toContain('GET')
    expect(out).toContain('/api/users')
    expect(out).toContain('404')
    expect(out).toContain('50ms')
  })
})

describe('formatErrorRow', () => {
  it('includes message and stack trace', () => {
    const entry = { id: 1, message: 'TypeError', stack: '  at foo.js:12', source: 'foo.js',
      line: 12, col: 0, timestamp: Date.now(), type: 'error' as const }
    const out = formatErrorRow(entry)
    expect(out).toContain('TypeError')
    expect(out).toContain('foo.js:12')
  })
})

describe('formatHealthRow', () => {
  it('includes severity and message', () => {
    const issue = { severity: 'warn' as const, category: 'alt-text' as const, message: '2 images missing alt' }
    const out = formatHealthRow(issue)
    expect(out).toContain('[WARN]')
    expect(out).toContain('2 images missing alt')
  })
})
