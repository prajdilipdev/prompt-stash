import { z } from 'zod'
import type { Prompt } from '@/types'
import { downloadFile } from './utils'

/**
 * Import / Export.
 *
 * Export shape (v1):
 * {
 *   "app": "prompt-stash",
 *   "version": 1,
 *   "exportedAt": "ISO date",
 *   "prompts": [ { title, description, content, notes, favorite, tags } ]
 * }
 *
 * Import accepts: that shape, a bare array of prompt objects, or a single
 * prompt object. Imported ids/timestamps are NEVER trusted or reused —
 * everything is inserted fresh for the authenticated user.
 */

export const importPromptSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(300, 'Title is too long'),
    content: z
      .string()
      .min(1, 'Content is required')
      .max(100_000, 'Content is too long'),
    description: z
      .union([z.string().trim().max(2000), z.null()])
      .optional()
      .transform((v) => v ?? ''),
    notes: z
      .union([z.string().trim().max(10_000), z.null()])
      .optional()
      .transform((v) => v ?? ''),
    favorite: z.boolean().optional().default(false),
    tags: z
      .array(z.string().trim().min(1).max(40))
      .max(25, 'Too many tags')
      .optional()
      .default([])
      .transform((tags) => {
        const seen = new Set<string>()
        const out: string[] = []
        for (const t of tags) {
          const key = t.toLowerCase()
          if (!seen.has(key)) {
            seen.add(key)
            out.push(t)
          }
        }
        return out
      }),
  })
  // Reject non-string content/title that slipped through (e.g. numbers).
  .strict()

export type ImportedPrompt = z.infer<typeof importPromptSchema>

export interface ImportFileResult {
  prompts: ImportedPrompt[]
  errors: string[]
}

/** Parse and validate the contents of an import file. Never throws. */
export function parseImportFile(text: string): ImportFileResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { prompts: [], errors: ['This file is not valid JSON.'] }
  }

  let candidates: unknown
  if (Array.isArray(data)) {
    candidates = data
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.prompts)) candidates = obj.prompts
    else if ('title' in obj && 'content' in obj) candidates = [data]
    else
      return {
        prompts: [],
        errors: ['Unrecognized format. Expected a Prompt Stash export or an array of prompts.'],
      }
  } else {
    return { prompts: [], errors: ['Unrecognized format. Expected a JSON object or array.'] }
  }

  const list = candidates as unknown[]
  if (list.length === 0) return { prompts: [], errors: ['The file contains no prompts.'] }
  if (list.length > 5000)
    return { prompts: [], errors: ['The file contains more than 5,000 prompts. Split it up and try again.'] }

  const prompts: ImportedPrompt[] = []
  const errors: string[] = []

  list.forEach((item, index) => {
    const parsed = importPromptSchema.safeParse(item)
    if (parsed.success) {
      prompts.push(parsed.data)
    } else {
      const label =
        item && typeof item === 'object' && typeof (item as { title?: unknown }).title === 'string'
          ? `“${(item as { title: string }).title.slice(0, 60)}”`
          : `Item ${index + 1}`
      const firstIssue = parsed.error.issues[0]
      errors.push(
        `${label} was skipped — ${firstIssue?.path.join('.') || 'value'}: ${firstIssue?.message ?? 'invalid'}.`,
      )
    }
  })

  return { prompts, errors }
}

/** Serialize the library to the Prompt Stash export format. */
export function buildExport(prompts: Prompt[]): string {
  return JSON.stringify(
    {
      app: 'prompt-stash',
      version: 1,
      exportedAt: new Date().toISOString(),
      prompts: prompts.map((p) => ({
        title: p.title,
        description: p.description,
        content: p.content,
        notes: p.notes,
        favorite: p.isFavorite,
        tags: p.tags.map((t) => t.name),
      })),
    },
    null,
    2,
  )
}

export function exportPromptsToFile(prompts: Prompt[]): void {
  const stamp = new Date().toISOString().slice(0, 10)
  downloadFile(`prompt-stash-export-${stamp}.json`, buildExport(prompts))
}
