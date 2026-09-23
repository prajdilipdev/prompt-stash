import { supabase } from '@/lib/supabase'
import type { TagWithCount } from '@/types'
import { assertNoError, fetchUserTags, mapTag } from './promptService'

export interface TagsWithCounts {
  tags: TagWithCount[]
  totalActivePrompts: number
}

/**
 * Tags with live per-tag counts (active prompts only).
 *
 * Implementation: read active prompts' tag links once and count client-side.
 * Cheap for personal libraries and always consistent with what the
 * dashboard shows. RLS guarantees only the user's own rows are visible.
 */
export async function fetchTagsWithCounts(): Promise<TagsWithCounts> {
  const [tags, linksResult] = await Promise.all([
    fetchUserTags(),
    supabase
      .from('prompts')
      .select('id, prompt_tags(tag_id)')
      .is('archived_at', null)
      .is('deleted_at', null),
  ])
  assertNoError(linksResult.error, 'Could not load tag counts.')

  const counts = new Map<string, number>()
  let totalActivePrompts = 0
  for (const row of (linksResult.data ?? []) as { id: string; prompt_tags: { tag_id: string }[] }[]) {
    totalActivePrompts += 1
    const seen = new Set<string>()
    for (const link of row.prompt_tags ?? []) {
      if (seen.has(link.tag_id)) continue
      seen.add(link.tag_id)
      counts.set(link.tag_id, (counts.get(link.tag_id) ?? 0) + 1)
    }
  }

  return {
    tags: tags.map((t) => ({ ...t, count: counts.get(t.id) ?? 0 })),
    totalActivePrompts,
  }
}

export async function renameTag(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('tags').update({ name: name.trim() }).eq('id', id)
  assertNoError(error, 'Could not rename the tag.')
}

export async function deleteTag(id: string): Promise<void> {
  // prompt_tags links cascade from the tag's FK; RLS scopes everything.
  const { error } = await supabase.from('tags').delete().eq('id', id)
  assertNoError(error, 'Could not delete the tag.')
}

export { mapTag }
