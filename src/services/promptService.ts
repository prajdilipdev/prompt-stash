import { supabase } from '@/lib/supabase'
import type { LibraryQuery, Prompt, PromptInput, SortKey, Tag } from '@/types'
import { RECENT_WINDOW_DAYS, SEARCH_FETCH_LIMIT } from '@/types'

/* ------------------------------------------------------------------ */
/* Row shapes (hand-maintained mirror of the database schema)          */
/* ------------------------------------------------------------------ */

interface TagRow {
  id: string
  name: string
  created_at: string
}

interface PromptTagJoin {
  tag_id: string
  tags: TagRow | null
}

interface PromptRow {
  id: string
  user_id: string
  title: string
  description: string
  content: string
  notes: string
  is_favorite: boolean
  created_at: string
  updated_at: string
  archived_at: string | null
  deleted_at: string | null
  prompt_tags?: PromptTagJoin[]
}

export function mapTag(row: TagRow): Tag {
  return { id: row.id, name: row.name, createdAt: row.created_at }
}

export function mapPrompt(row: PromptRow): Prompt {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? '',
    content: row.content,
    notes: row.notes ?? '',
    isFavorite: row.is_favorite,
    tags: (row.prompt_tags ?? [])
      .map((pt) => pt.tags)
      .filter((t): t is TagRow => t !== null)
      .map(mapTag),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at,
  }
}

const PROMPT_SELECT = '*, prompt_tags(tag_id, tags(*))'

export function assertNoError(error: { message: string } | null, fallback: string): void {
  if (error) {
    const message = error.message || fallback
    throw new Error(message)
  }
}

/** Escape a search term for use inside a PostgREST `or=(...)` expression. */
export function escapeOrValue(value: string): string {
  return value.replace(/([\\,()])/g, '\\$1')
}

/* ------------------------------------------------------------------ */
/* Library query                                                       */
/* ------------------------------------------------------------------ */

export interface LibraryResult {
  items: Prompt[]
  total: number
  hasMore: boolean
}

const comparators: Record<SortKey, (a: Prompt, b: Prompt) => number> = {
  updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  created: (a, b) => b.createdAt.localeCompare(a.createdAt),
  alpha: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
}

export function sortPrompts(items: Prompt[], sort: SortKey): Prompt[] {
  return [...items].sort(comparators[sort])
}

/** Structural types for the Supabase filter chain (methods return `this`). */
interface ViewFilterable<Q> {
  not(column: string, operator: 'is', value: null): Q
  is(column: string, value: null): Q
  eq(column: string, value: boolean): Q
  gte(column: string, value: string): Q
}

interface Sortable<Q> {
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): Q
}

function applyViewFilters<Q extends ViewFilterable<Q>>(query: Q, view: LibraryQuery['view']): Q {
  switch (view) {
    case 'trash':
      return query.not('deleted_at', 'is', null)
    case 'archived':
      return query.not('archived_at', 'is', null).is('deleted_at', null)
    case 'favorites':
      return query.is('archived_at', null).is('deleted_at', null).eq('is_favorite', true)
    case 'recent': {
      const cutoff = new Date(Date.now() - RECENT_WINDOW_DAYS * 86_400_000).toISOString()
      return query.is('archived_at', null).is('deleted_at', null).gte('updated_at', cutoff)
    }
    case 'all':
    default:
      return query.is('archived_at', null).is('deleted_at', null)
  }
}

function applySort<Q extends Sortable<Q>>(query: Q, sort: SortKey): Q {
  switch (sort) {
    case 'created':
      return query.order('created_at', { ascending: false })
    case 'alpha':
      return query.order('title', { ascending: true, nullsFirst: false })
    case 'oldest':
      return query.order('created_at', { ascending: true })
    case 'updated':
    default:
      return query.order('updated_at', { ascending: false })
  }
}

/**
 * Fetch a page of the library.
 *
 * Without search: server-side sort + pagination with exact counts.
 * With search: server-side ILIKE across text fields merged with a tag-name
 * match query, deduplicated and sorted client-side (search results are
 * capped rather than paginated, which is the right UX for search).
 */
export async function fetchLibrary(params: LibraryQuery): Promise<LibraryResult> {
  const search = params.search?.trim()

  if (search) {
    const escaped = escapeOrValue(search).replace(/[%_]/g, '\\$&')
    const pattern = `%${escaped}%`

    const textFilter = `title.ilike.${pattern},description.ilike.${pattern},content.ilike.${pattern},notes.ilike.${pattern}`

    let textQuery = supabase
      .from('prompts')
      .select(PROMPT_SELECT)
      .or(textFilter)
      .limit(SEARCH_FETCH_LIMIT)
    textQuery = applyViewFilters(textQuery, params.view)
    if (params.tagId) {
      textQuery = textQuery.or(`tag_id.eq.${params.tagId}`, { foreignTable: 'prompt_tags' })
    }

    const [textResult, tagResult] = await Promise.all([
      textQuery,
      (async () => {
        // Tag-name matches (join filter). Skipped when already filtered by tag.
        if (params.tagId) return { data: [] as unknown[], error: null }
        let tagQuery = supabase
          .from('prompts')
          .select('id')
          .limit(SEARCH_FETCH_LIMIT)
          .or(`name.ilike.${pattern}`, { foreignTable: 'prompt_tags.tags' })
        tagQuery = applyViewFilters(tagQuery, params.view)
        return tagQuery
      })(),
    ])

    assertNoError(textResult.error, 'Could not search prompts.')
    assertNoError(tagResult.error, 'Could not search tags.')

    const textRows = (textResult.data ?? []) as unknown as PromptRow[]
    const byId = new Map<string, PromptRow>()
    for (const row of textRows) byId.set(row.id, row)

    const tagIds = ((tagResult.data ?? []) as { id: string }[])
      .map((r) => r.id)
      .filter((id) => !byId.has(id))

    if (tagIds.length > 0) {
      const extra = await supabase.from('prompts').select(PROMPT_SELECT).in('id', tagIds)
      assertNoError(extra.error, 'Could not search prompts.')
      for (const row of (extra.data ?? []) as unknown as PromptRow[]) byId.set(row.id, row)
    }

    const items = sortPrompts(Array.from(byId.values()).map(mapPrompt), params.sort)
    return { items, total: items.length, hasMore: false }
  }

  // No search — server-side pagination.
  const from = params.page * params.pageSize
  const to = from + params.pageSize - 1

  let query = supabase.from('prompts').select(PROMPT_SELECT, { count: 'exact' })
  query = applyViewFilters(query, params.view)
  if (params.tagId) {
    query = query.or(`tag_id.eq.${params.tagId}`, { foreignTable: 'prompt_tags' })
  }
  query = applySort(query, params.sort).range(from, to)

  const { data, error, count } = await query
  assertNoError(error, 'Could not load prompts.')

  const items = ((data ?? []) as unknown as PromptRow[]).map(mapPrompt)
  const total = count ?? items.length
  return { items, total, hasMore: to + 1 < total }
}

/* ------------------------------------------------------------------ */
/* Single prompt                                                       */
/* ------------------------------------------------------------------ */

export async function fetchPromptById(id: string): Promise<Prompt | null> {
  const { data, error } = await supabase
    .from('prompts')
    .select(PROMPT_SELECT)
    .eq('id', id)
    .maybeSingle()
  assertNoError(error, 'Could not load this prompt.')
  return data ? mapPrompt(data as unknown as PromptRow) : null
}

/* ------------------------------------------------------------------ */
/* Tags (owned by the current user; RLS guarantees isolation)          */
/* ------------------------------------------------------------------ */

export async function fetchUserTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('*').order('name', { ascending: true })
  assertNoError(error, 'Could not load tags.')
  return ((data ?? []) as TagRow[]).map(mapTag)
}

/**
 * Resolve tag names to tag rows: existing tags match case-insensitively,
 * missing ones are created. Never creates duplicates.
 */
export async function resolveTags(names: string[]): Promise<Tag[]> {
  const wanted = Array.from(
    new Map(names.map((n) => [n.trim().toLowerCase(), n.trim()])).values(),
  ).filter(Boolean)
  if (wanted.length === 0) return []

  const existing = await fetchUserTags()
  const existingByName = new Map(existing.map((t) => [t.name.toLowerCase(), t]))

  const resolved: Tag[] = []
  for (const name of wanted) {
    const found = existingByName.get(name.toLowerCase())
    if (found) {
      resolved.push(found)
      continue
    }
    const { data, error } = await supabase
      .from('tags')
      .insert({ name })
      .select()
      .single()
    if (error) {
      // Lost a race on the unique index — re-read and retry once.
      if (error.code === '23505') {
        const refreshed = await fetchUserTags()
        const raced = refreshed.find((t) => t.name.toLowerCase() === name.toLowerCase())
        if (raced) {
          resolved.push(raced)
          continue
        }
      }
      assertNoError(error, 'Could not create tag.')
    }
    resolved.push(mapTag(data as TagRow))
  }
  return resolved
}

async function setPromptTags(promptId: string, tags: Tag[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('prompt_tags')
    .delete()
    .eq('prompt_id', promptId)
  assertNoError(deleteError, 'Could not update tags.')
  if (tags.length === 0) return
  const { error } = await supabase
    .from('prompt_tags')
    .insert(tags.map((t) => ({ prompt_id: promptId, tag_id: t.id })))
  assertNoError(error, 'Could not update tags.')
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export async function createPrompt(input: PromptInput): Promise<Prompt> {
  const tags = await resolveTags(input.tagNames)
  const { data, error } = await supabase
    .from('prompts')
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      content: input.content,
      notes: input.notes.trim(),
      is_favorite: input.isFavorite,
    })
    .select()
    .single()
  assertNoError(error, 'Could not create the prompt.')
  const row = data as unknown as PromptRow
  if (tags.length > 0) await setPromptTags(row.id, tags)
  return { ...mapPrompt(row), tags }
}

export async function updatePromptFields(
  id: string,
  input: Partial<Omit<PromptInput, 'tagNames'>>,
): Promise<Prompt> {
  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title.trim()
  if (input.description !== undefined) patch.description = input.description.trim()
  if (input.content !== undefined) patch.content = input.content
  if (input.notes !== undefined) patch.notes = input.notes.trim()
  if (input.isFavorite !== undefined) patch.is_favorite = input.isFavorite

  const { data, error } = await supabase
    .from('prompts')
    .update(patch)
    .eq('id', id)
    .select(PROMPT_SELECT)
    .single()
  assertNoError(error, 'Could not save the prompt.')
  return mapPrompt(data as unknown as PromptRow)
}

export async function updatePrompt(input: PromptInput & { id: string }): Promise<Prompt> {
  const tags = await resolveTags(input.tagNames)
  const updated = await updatePromptFields(input.id, input)
  await setPromptTags(input.id, tags)
  return { ...updated, tags }
}

export async function setFavorite(id: string, isFavorite: boolean): Promise<void> {
  const { error } = await supabase.from('prompts').update({ is_favorite: isFavorite }).eq('id', id)
  assertNoError(error, isFavorite ? 'Could not add to favorites.' : 'Could not remove from favorites.')
}

export async function setArchived(id: string, archived: boolean): Promise<void> {
  const { error } = await supabase
    .from('prompts')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id)
  assertNoError(error, archived ? 'Could not archive the prompt.' : 'Could not restore the prompt.')
}

export async function setTrashed(id: string, trashed: boolean): Promise<void> {
  const { error } = await supabase
    .from('prompts')
    .update({ deleted_at: trashed ? new Date().toISOString() : null })
    .eq('id', id)
  assertNoError(error, trashed ? 'Could not delete the prompt.' : 'Could not restore the prompt.')
}

export async function purgePrompt(id: string): Promise<void> {
  const { error } = await supabase.from('prompts').delete().eq('id', id)
  assertNoError(error, 'Could not permanently delete the prompt.')
}

export async function duplicatePrompt(id: string): Promise<Prompt> {
  const original = await fetchPromptById(id)
  if (!original) throw new Error('Prompt not found.')
  return createPrompt({
    title: `${original.title} (copy)`.slice(0, 300),
    description: original.description,
    content: original.content,
    notes: original.notes,
    isFavorite: false,
    tagNames: original.tags.map((t) => t.name),
  })
}

/**
 * Fetch every non-trashed prompt (paginated internally) for export.
 */
export async function fetchAllForExport(): Promise<Prompt[]> {
  const pageSize = 500
  const all: Prompt[] = []
  for (let page = 0; page < 40; page++) {
    const { data, error } = await supabase
      .from('prompts')
      .select(PROMPT_SELECT)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1)
    assertNoError(error, 'Could not export prompts.')
    const rows = (data ?? []) as unknown as PromptRow[]
    all.push(...rows.map(mapPrompt))
    if (rows.length < pageSize) break
  }
  return all
}
