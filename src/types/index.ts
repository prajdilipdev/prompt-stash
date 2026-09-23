export type SortKey = 'updated' | 'created' | 'alpha' | 'oldest'

export type ViewKey = 'all' | 'favorites' | 'recent' | 'archived' | 'trash'

export interface Tag {
  id: string
  name: string
  createdAt: string
}

export interface TagWithCount extends Tag {
  count: number
}

export interface Prompt {
  id: string
  userId: string
  title: string
  description: string
  content: string
  notes: string
  isFavorite: boolean
  tags: Tag[]
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  deletedAt: string | null
}

export interface PromptInput {
  title: string
  description: string
  content: string
  notes: string
  isFavorite: boolean
  /** Tag names; existing tags are matched case-insensitively, missing ones are created. */
  tagNames: string[]
}

export interface Profile {
  id: string
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
}

/** Parameters that fully describe a library query (used as the TanStack Query key). */
export interface LibraryQuery {
  view: ViewKey
  tagId?: string
  search?: string
  sort: SortKey
  page: number
  pageSize: number
}

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'created', label: 'Recently created' },
  { value: 'alpha', label: 'Alphabetical (A–Z)' },
  { value: 'oldest', label: 'Oldest first' },
]

export const DEFAULT_PAGE_SIZE = 48
export const RECENT_WINDOW_DAYS = 30
export const SEARCH_FETCH_LIMIT = 300
