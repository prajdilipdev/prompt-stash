import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Archive,
  Clock,
  Inbox,
  LayoutGrid,
  List,
  Plus,
  Search,
  SearchX,
  Star,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import {
  useLibrary,
  useLibraryData,
  usePurgePrompt,
} from '@/hooks/usePrompts'
import { useTagsWithCounts } from '@/hooks/useTags'
import { PromptCard, type CardContext } from '@/components/PromptCard'
import { PromptTester } from '@/components/PromptTester'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button, IconButton } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { PromptGridSkeleton } from '@/components/ui/Skeleton'
import { useDebouncedValue } from '@/hooks/useDebounce'
import { storage, cn, pluralize } from '@/lib/utils'
import { useToast } from '@/components/Toast'
import type { Prompt, SortKey, ViewKey } from '@/types'
import { DEFAULT_PAGE_SIZE, SORT_OPTIONS } from '@/types'

const VIEW_META: Record<
  ViewKey | 'tag',
  { title: string; icon: React.ReactNode; empty: { title: string; description: string } }
> = {
  all: {
    title: 'Prompts',
    icon: <Inbox className="h-5 w-5" aria-hidden="true" />,
    empty: {
      title: 'No prompts yet',
      description:
        'Build your personal prompt library by saving your first prompt. Capture anything worth keeping.',
    },
  },
  favorites: {
    title: 'Favorites',
    icon: <Star className="h-5 w-5" aria-hidden="true" />,
    empty: {
      title: 'No favorites yet',
      description: 'Star the prompts you reach for every day and they will live here.',
    },
  },
  recent: {
    title: 'Recent',
    icon: <Clock className="h-5 w-5" aria-hidden="true" />,
    empty: {
      title: 'Nothing recent',
      description: 'Prompts you created or edited in the last 30 days show up here.',
    },
  },
  archived: {
    title: 'Archived',
    icon: <Archive className="h-5 w-5" aria-hidden="true" />,
    empty: {
      title: 'No archived prompts',
      description: 'Archive prompts you want to keep out of sight without deleting them.',
    },
  },
  trash: {
    title: 'Trash',
    icon: <Trash2 className="h-5 w-5" aria-hidden="true" />,
    empty: {
      title: 'Trash is empty',
      description: 'Deleted prompts land here and can be restored until you remove them permanently.',
    },
  },
  tag: {
    title: 'Tag',
    icon: <Tag className="h-5 w-5" aria-hidden="true" />,
    empty: {
      title: 'No prompts with this tag',
      description: 'Add this tag to prompts from the editor, or pick another tag.',
    },
  },
}

interface LibraryPageProps {
  view: ViewKey | 'tag'
}

export function LibraryPage({ view }: LibraryPageProps) {
  const navigate = useNavigate()
  const params = useParams<{ tagId: string }>()
  const { toast } = useToast()

  const { data: tagData } = useTagsWithCounts()
  const activeTag = view === 'tag' ? tagData?.tags.find((t) => t.id === params.tagId) : undefined

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const [sort, setSort] = useState<SortKey>(() => storage.get<SortKey>('default-sort', 'updated'))
  const [layout, setLayout] = useState<'grid' | 'list'>(() =>
    storage.get<'grid' | 'list'>('view-mode', 'grid'),
  )

  // Reset search when navigating between views.
  useEffect(() => {
    setSearch('')
  }, [view, params.tagId])

  const query = useLibrary({
    view: view === 'tag' ? 'all' : view,
    tagId: view === 'tag' ? params.tagId : undefined,
    search: debouncedSearch.trim() || undefined,
    sort,
    pageSize: DEFAULT_PAGE_SIZE,
  })

  const { items, total, hasMore } = useLibraryData(query)

  const [testing, setTesting] = useState<Prompt | null>(null)
  const [purging, setPurging] = useState<Prompt | null>(null)
  const purge = usePurgePrompt()

  const meta = VIEW_META[view]
  const title = view === 'tag' ? (activeTag?.name ?? 'Tag') : meta.title
  const cardContext: CardContext = view === 'archived' ? 'archived' : view === 'trash' ? 'trash' : 'active'

  const setLayoutPersist = (next: 'grid' | 'list') => {
    setLayout(next)
    storage.set('view-mode', next)
  }

  const setSortPersist = (next: SortKey) => {
    setSort(next)
    storage.set('default-sort', next)
  }

  const searching = Boolean(debouncedSearch.trim())
  const showEmpty = !query.isPending && !query.isError && items.length === 0
  const emptyMeta = useMemo(() => {
    if (searching) {
      return {
        title: 'No prompts match your search',
        description: `Nothing matches “${debouncedSearch.trim()}” in this view. Try fewer words or a different view.`,
      }
    }
    return meta.empty
  }, [searching, debouncedSearch, meta.empty])

  return (
    <div className="mx-auto w-full max-w-content px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-muted-foreground">{meta.icon}</span>
            <h1 className="text-h1">{title}</h1>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground" aria-live="polite">
            {query.isPending ? 'Loading…' : pluralize(total, 'prompt')}
            {view === 'recent' && total > 0 && ' · updated in the last 30 days'}
          </p>
        </div>
        <Button onClick={() => navigate('/app/prompts/new')}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Prompt
        </Button>
      </header>

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts, descriptions, tags, and content…"
            aria-label="Search prompts"
            className="h-9 w-full rounded-md border border-border bg-input pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-ring/70 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <Select
          aria-label="Sort prompts"
          value={sort}
          onChange={(e) => setSortPersist(e.target.value as SortKey)}
          options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />

        <div
          role="radiogroup"
          aria-label="Layout"
          className="inline-flex rounded-md border border-border bg-input p-0.5"
        >
          <button
            type="button"
            role="radio"
            aria-checked={layout === 'grid'}
            aria-label="Grid view"
            onClick={() => setLayoutPersist('grid')}
            className={cn(
              'flex h-[30px] w-8 items-center justify-center rounded-[5px] transition-colors',
              layout === 'grid' ? 'bg-surface-elevated text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={layout === 'list'}
            aria-label="List view"
            onClick={() => setLayoutPersist('list')}
            className={cn(
              'flex h-[30px] w-8 items-center justify-center rounded-[5px] transition-colors',
              layout === 'list' ? 'bg-surface-elevated text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <List className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-5">
        {query.isPending ? (
          <PromptGridSkeleton count={layout === 'grid' ? 9 : 6} />
        ) : query.isError ? (
          <ErrorState
            title="Couldn't load prompts"
            message="Check your connection and try again. Your data is safe in Supabase."
            onRetry={() => query.refetch()}
          />
        ) : showEmpty ? (
          <EmptyState
            icon={searching ? <SearchX className="h-5 w-5" aria-hidden="true" /> : meta.icon}
            title={emptyMeta.title}
            description={emptyMeta.description}
            action={
              !searching && view === 'all' ? (
                <Button onClick={() => navigate('/app/prompts/new')}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create Prompt
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div
              className={cn(
                layout === 'grid'
                  ? 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'
                  : 'flex flex-col gap-2',
              )}
            >
              {items.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  context={cardContext}
                  layout={layout}
                  onTest={cardContext === 'active' ? setTesting : undefined}
                  onRequestPurge={cardContext === 'trash' ? setPurging : undefined}
                  onTagClick={(tagId) => navigate(`/app/tags/${tagId}`)}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  loading={query.isFetchingNextPage}
                  onClick={() => query.fetchNextPage()}
                >
                  Load more prompts
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tester + purge confirmation */}
      <PromptTester prompt={testing} onClose={() => setTesting(null)} />

      <ConfirmDialog
        open={purging !== null}
        title="Delete permanently?"
        description={`“${purging?.title}” will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete permanently"
        destructive
        requirePhrase={undefined}
        loading={purge.isPending}
        onCancel={() => setPurging(null)}
        onConfirm={() => {
          if (!purging) return
          purge.mutate(purging.id, {
            onSuccess: () => {
              toast('Prompt permanently deleted.', 'success')
              setPurging(null)
            },
            onError: (e) =>
              toast(e instanceof Error ? e.message : 'Could not delete the prompt.', 'error'),
          })
        }}
      />
    </div>
  )
}

/** Small helper for pages that only render an icon button (kept for reuse). */
export function LibraryIconButton(props: React.ComponentProps<typeof IconButton>) {
  return <IconButton {...props} />
}
