import { describe, expect, it } from 'vitest'
import { escapeOrValue, sortPrompts } from './promptService'
import type { Prompt } from '@/types'

function makePrompt(overrides: Partial<Prompt>): Prompt {
  return {
    id: 'id',
    userId: 'user',
    title: 'Title',
    description: '',
    content: '',
    notes: '',
    isFavorite: false,
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    ...overrides,
  }
}

describe('sortPrompts', () => {
  const older = makePrompt({
    id: 'a',
    title: 'Banana',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z',
  })
  const newer = makePrompt({
    id: 'b',
    title: 'apple',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-05T00:00:00.000Z',
  })

  it('sorts by most recently updated first', () => {
    expect(sortPrompts([older, newer], 'updated').map((p) => p.id)).toEqual(['b', 'a'])
  })

  it('sorts by most recently created first', () => {
    expect(sortPrompts([older, newer], 'created').map((p) => p.id)).toEqual(['b', 'a'])
  })

  it('sorts alphabetically, case-insensitively', () => {
    expect(sortPrompts([older, newer], 'alpha').map((p) => p.title)).toEqual(['apple', 'Banana'])
  })

  it('sorts oldest first', () => {
    expect(sortPrompts([newer, older], 'oldest').map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('does not mutate the input array', () => {
    const input = [older, newer]
    sortPrompts(input, 'alpha')
    expect(input.map((p) => p.id)).toEqual(['a', 'b'])
  })
})

describe('escapeOrValue', () => {
  it('escapes commas so or() filters cannot be injected', () => {
    expect(escapeOrValue('a,b')).toBe('a\\,b')
  })

  it('escapes parentheses', () => {
    expect(escapeOrValue('(x)')).toBe('\\(x\\)')
  })

  it('escapes backslashes', () => {
    expect(escapeOrValue('a\\b')).toBe('a\\\\b')
  })

  it('leaves plain text untouched', () => {
    expect(escapeOrValue('hello world')).toBe('hello world')
  })
})
