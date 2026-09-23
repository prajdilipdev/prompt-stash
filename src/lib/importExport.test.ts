import { describe, expect, it } from 'vitest'
import { buildExport, parseImportFile } from './importExport'
import type { Prompt } from '@/types'

const validPrompt = {
  title: 'Test Prompt',
  description: 'A description',
  content: 'Do {{thing}}',
  notes: '',
  favorite: true,
  tags: ['writing', 'writing', 'Marketing'],
}

describe('parseImportFile', () => {
  it('rejects invalid JSON', () => {
    const result = parseImportFile('{ nope')
    expect(result.prompts).toHaveLength(0)
    expect(result.errors[0]).toContain('not valid JSON')
  })

  it('rejects unknown shapes', () => {
    const result = parseImportFile(JSON.stringify({ hello: 'world' }))
    expect(result.prompts).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('accepts a bare array', () => {
    const result = parseImportFile(JSON.stringify([validPrompt]))
    expect(result.prompts).toHaveLength(1)
    expect(result.errors).toHaveLength(0)
  })

  it('accepts the Prompt Stash export envelope', () => {
    const file = JSON.stringify({
      app: 'prompt-stash',
      version: 1,
      exportedAt: new Date().toISOString(),
      prompts: [validPrompt],
    })
    const result = parseImportFile(file)
    expect(result.prompts).toHaveLength(1)
    expect(result.prompts[0].title).toBe('Test Prompt')
  })

  it('accepts a single prompt object', () => {
    const result = parseImportFile(JSON.stringify(validPrompt))
    expect(result.prompts).toHaveLength(1)
  })

  it('trims titles and rejects empty ones', () => {
    const result = parseImportFile(
      JSON.stringify([{ title: '   ', content: 'x' }, { title: ' ok ', content: 'y' }]),
    )
    expect(result.prompts).toHaveLength(1)
    expect(result.prompts[0].title).toBe('ok')
    expect(result.errors).toHaveLength(1)
  })

  it('deduplicates tags case-insensitively', () => {
    const result = parseImportFile(JSON.stringify([validPrompt]))
    expect(result.prompts[0].tags).toEqual(['writing', 'Marketing'])
  })

  it('reports per-item errors without aborting the batch', () => {
    const result = parseImportFile(
      JSON.stringify([validPrompt, { title: 'Missing content' }, { content: 'Missing title' }]),
    )
    expect(result.prompts).toHaveLength(1)
    expect(result.errors).toHaveLength(2)
  })

  it('rejects non-string content', () => {
    const result = parseImportFile(JSON.stringify([{ title: 't', content: 42 }]))
    expect(result.prompts).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
  })
})

describe('buildExport', () => {
  it('serializes the documented shape', () => {
    const prompt = {
      id: '1',
      userId: 'u',
      title: 'T',
      description: 'D',
      content: 'C',
      notes: 'N',
      isFavorite: true,
      tags: [{ id: 't1', name: 'alpha', createdAt: '' }],
      createdAt: '',
      updatedAt: '',
      archivedAt: null,
      deletedAt: null,
    } satisfies Prompt
    const parsed = JSON.parse(buildExport([prompt])) as {
      app: string
      version: number
      prompts: { title: string; tags: string[] }[]
    }
    expect(parsed.app).toBe('prompt-stash')
    expect(parsed.version).toBe(1)
    expect(parsed.prompts[0].title).toBe('T')
    expect(parsed.prompts[0].tags).toEqual(['alpha'])
  })
})
