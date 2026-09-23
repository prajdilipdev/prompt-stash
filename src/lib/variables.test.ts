import { describe, expect, it } from 'vitest'
import {
  extractVariables,
  hasVariables,
  resolveVariables,
  variableLabel,
} from './variables'

describe('extractVariables', () => {
  it('extracts unique variables in first-seen order', () => {
    expect(
      extractVariables('Hi {{name}}, meet {{name}} and {{friend}}.'),
    ).toEqual(['name', 'friend'])
  })

  it('handles whitespace inside braces', () => {
    expect(extractVariables('Value: {{ spaced_var }}')).toEqual(['spaced_var'])
  })

  it('supports dashes, dots and digits in names', () => {
    expect(extractVariables('{{a-b}} {{c.d}} {{x2}}')).toEqual(['a-b', 'c.d', 'x2'])
  })

  it('ignores invalid patterns', () => {
    expect(extractVariables('{{}} {{1abc}} {single} {{ with space }}')).toEqual([])
  })

  it('returns empty for empty content', () => {
    expect(extractVariables('')).toEqual([])
  })
})

describe('resolveVariables', () => {
  it('replaces provided values', () => {
    expect(
      resolveVariables('Write about {{topic}} for {{audience}}.', {
        topic: 'coffee',
        audience: 'developers',
      }),
    ).toBe('Write about coffee for developers.')
  })

  it('replaces repeated occurrences', () => {
    expect(resolveVariables('{{x}} and {{x}}', { x: 'y' })).toBe('y and y')
  })

  it('leaves variables without values intact', () => {
    expect(resolveVariables('{{a}} {{b}}', { a: '1' })).toBe('1 {{b}}')
  })

  it('allows empty-string replacement', () => {
    expect(resolveVariables('[{{x}}]', { x: '' })).toBe('[]')
  })

  it('does not execute or interpolate code-like input', () => {
    const result = resolveVariables('{{x}}', { x: '${process.env.SECRET}' })
    expect(result).toBe('${process.env.SECRET}')
  })

  it('returns empty string for empty content', () => {
    expect(resolveVariables('', { a: 'b' })).toBe('')
  })
})

describe('hasVariables', () => {
  it('detects presence', () => {
    expect(hasVariables('Hello {{world}}')).toBe(true)
    expect(hasVariables('Hello world')).toBe(false)
  })
})

describe('variableLabel', () => {
  it('humanizes snake_case names', () => {
    expect(variableLabel('target_audience')).toBe('Target audience')
    expect(variableLabel('product-name')).toBe('Product name')
  })
})
