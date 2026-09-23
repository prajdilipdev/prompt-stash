import { describe, expect, it, vi } from 'vitest'
import { formatDate, pluralize, timeAgo } from './utils'

describe('timeAgo', () => {
  it('renders stable, human relative times', () => {
    vi.setSystemTime(new Date('2026-09-23T12:00:00Z'))
    const now = Date.now()
    expect(timeAgo(new Date(now - 20 * 1000).toISOString())).toBe('just now')
    expect(timeAgo(new Date(now - 5 * 60 * 1000).toISOString())).toBe('5m ago')
    expect(timeAgo(new Date(now - 3 * 3600 * 1000).toISOString())).toBe('3h ago')
    expect(timeAgo(new Date(now - 24 * 3600 * 1000).toISOString())).toBe('yesterday')
    expect(timeAgo(new Date(now - 3 * 24 * 3600 * 1000).toISOString())).toBe('3 days ago')
    vi.useRealTimers()
  })

  it('falls back to a date for invalid input', () => {
    expect(timeAgo('not-a-date')).toBe('—')
  })
})

describe('formatDate', () => {
  it('formats ISO dates', () => {
    expect(formatDate('2026-09-23T08:30:00.000Z')).toMatch(/2026/)
  })
})

describe('pluralize', () => {
  it('handles singular and plural', () => {
    expect(pluralize(1, 'prompt')).toBe('1 prompt')
    expect(pluralize(124, 'prompt')).toBe('124 prompts')
    expect(pluralize(0, 'prompt')).toBe('0 prompts')
  })
})
