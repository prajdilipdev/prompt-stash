/**
 * Variable system.
 *
 * Variables are written as {{variable_name}} inside prompt content.
 * Names may contain letters, digits, underscores, dashes and dots.
 * Nothing here executes code — substitution is pure string replacement.
 */

export const VARIABLE_PATTERN = /\{\{\s*([A-Za-z][A-Za-z0-9_.-]*)\s*\}\}/g

/**
 * Extract unique variable names in first-seen order.
 *
 *   extractVariables("Hi {{name}}, meet {{name}} and {{friend}}")
 *   // -> ["name", "friend"]
 */
export function extractVariables(content: string): string[] {
  if (!content) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const match of content.matchAll(VARIABLE_PATTERN)) {
    const name = match[1]
    if (!seen.has(name)) {
      seen.add(name)
      result.push(name)
    }
  }
  return result
}

/**
 * Replace variables with provided values.
 * - A variable with a provided value (including empty string) is replaced.
 * - A variable without a value is left intact so drafts stay visible.
 */
export function resolveVariables(
  content: string,
  values: Record<string, string>,
): string {
  if (!content) return ''
  return content.replace(VARIABLE_PATTERN, (original, name: string) => {
    return Object.prototype.hasOwnProperty.call(values, name) ? values[name] : original
  })
}

/** True when the content contains at least one {{variable}}. */
export function hasVariables(content: string): boolean {
  VARIABLE_PATTERN.lastIndex = 0
  return VARIABLE_PATTERN.test(content)
}

/**
 * Convert a variable name into a human label: "target_audience" → "Target audience".
 */
export function variableLabel(name: string): string {
  const cleaned = name.replace(/[_\-.]+/g, ' ').trim()
  if (!cleaned) return name
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}
