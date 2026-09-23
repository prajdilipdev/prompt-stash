import { useCallback, useMemo } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { queryClient, queryKeys } from '@/lib/queryClient'
import {
  createPrompt,
  duplicatePrompt,
  fetchLibrary,
  fetchPromptById,
  purgePrompt,
  setArchived,
  setFavorite,
  setTrashed,
  updatePrompt,
} from '@/services/promptService'
import type { LibraryQuery, Prompt, PromptInput } from '@/types'

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

export type LibraryParams = Omit<LibraryQuery, 'page'>

/**
 * Library query with "Load more" pagination. Filters live in the query
 * key, so changing view/search/sort resets pagination automatically.
 */
export function useLibrary(params: LibraryParams) {
  return useInfiniteQuery({
    queryKey: queryKeys.prompts({ ...params, paged: 'v1' }),
    queryFn: ({ pageParam }) =>
      fetchLibrary({ ...params, page: pageParam, pageSize: params.pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastParam) =>
      lastPage.hasMore ? lastParam + 1 : undefined,
  })
}

export function usePrompt(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.prompt(id ?? 'missing'),
    queryFn: () => fetchPromptById(id as string),
    enabled: Boolean(id),
  })
}

export function useLibraryData(query: ReturnType<typeof useLibrary>) {
  return useMemo(() => {
    const pages = query.data?.pages ?? []
    return {
      items: pages.flatMap((p) => p.items),
      total: pages[0]?.total ?? 0,
      hasMore: Boolean(query.hasNextPage),
    }
  }, [query.data, query.hasNextPage])
}

/* ------------------------------------------------------------------ */
/* Cache helpers (optimistic favorite toggle)                          */
/* ------------------------------------------------------------------ */

function patchPromptInCache(id: string, patch: Partial<Prompt>) {
  const applyToData = (data: unknown): unknown => {
    if (!data) return data
    const infinite = data as { pages?: Array<{ items: Prompt[] }> }
    if (Array.isArray(infinite.pages)) {
      return {
        ...infinite,
        pages: infinite.pages.map((page) => ({
          ...page,
          items: page.items.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      }
    }
    const single = data as Prompt
    if (typeof single === 'object' && single.id === id) return { ...single, ...patch }
    return data
  }

  for (const q of queryClient.getQueryCache().findAll({ queryKey: ['prompts'] })) {
    queryClient.setQueryData(q.queryKey, applyToData(q.state.data))
  }
  for (const q of queryClient.getQueryCache().findAll({ queryKey: ['prompt'] })) {
    queryClient.setQueryData(q.queryKey, applyToData(q.state.data))
  }
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export function useInvalidateLibrary() {
  const client = useQueryClient()
  return useCallback(() => {
    client.invalidateQueries({ queryKey: ['prompts'] })
    client.invalidateQueries({ queryKey: ['prompt'] })
    client.invalidateQueries({ queryKey: queryKeys.tags })
  }, [client])
}

export function useCreatePrompt() {
  const invalidate = useInvalidateLibrary()
  return useMutation({
    mutationFn: (input: PromptInput) => createPrompt(input),
    onSuccess: invalidate,
  })
}

export function useUpdatePrompt() {
  const invalidate = useInvalidateLibrary()
  return useMutation({
    mutationFn: (input: PromptInput & { id: string }) => updatePrompt(input),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.prompt(data.id), data)
      invalidate()
    },
  })
}

export function useToggleFavorite() {
  const invalidate = useInvalidateLibrary()
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      setFavorite(id, isFavorite),
    onMutate: async ({ id, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: ['prompts'] })
      patchPromptInCache(id, { isFavorite })
    },
    onError: (_err, { id, isFavorite }) => {
      // Reconcile the failed optimistic update.
      patchPromptInCache(id, { isFavorite: !isFavorite })
    },
    onSettled: invalidate,
  })
}

export function useArchivePrompt() {
  const invalidate = useInvalidateLibrary()
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) => setArchived(id, archived),
    onSuccess: invalidate,
  })
}

export function useTrashPrompt() {
  const invalidate = useInvalidateLibrary()
  return useMutation({
    mutationFn: ({ id, trashed }: { id: string; trashed: boolean }) => setTrashed(id, trashed),
    onSuccess: invalidate,
  })
}

export function usePurgePrompt() {
  const invalidate = useInvalidateLibrary()
  return useMutation({
    mutationFn: (id: string) => purgePrompt(id),
    onSuccess: invalidate,
  })
}

export function useDuplicatePrompt() {
  const invalidate = useInvalidateLibrary()
  return useMutation({
    mutationFn: (id: string) => duplicatePrompt(id),
    onSuccess: invalidate,
  })
}
