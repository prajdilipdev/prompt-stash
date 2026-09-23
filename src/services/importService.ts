import { createPrompt } from './promptService'
import type { ImportedPrompt } from '@/lib/importExport'

export interface ImportReport {
  imported: number
  failed: number
  failures: string[]
}

/**
 * Insert validated prompts one by one so a single bad row can never abort
 * the whole import. All rows were already Zod-validated before reaching
 * here; ids/timestamps from the file are ignored entirely.
 */
export async function importPrompts(prompts: ImportedPrompt[]): Promise<ImportReport> {
  let imported = 0
  let failed = 0
  const failures: string[] = []

  for (const prompt of prompts) {
    try {
      await createPrompt({
        title: prompt.title,
        description: prompt.description,
        content: prompt.content,
        notes: prompt.notes,
        isFavorite: prompt.favorite,
        tagNames: prompt.tags,
      })
      imported += 1
    } catch (error) {
      failed += 1
      const message = error instanceof Error ? error.message : 'Unknown error'
      failures.push(`“${prompt.title.slice(0, 60)}”: ${message}`)
    }
  }

  return { imported, failed, failures }
}
