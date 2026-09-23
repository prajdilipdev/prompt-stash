import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

/** Central query-key factory — keeps cache invalidation predictable. */
export const queryKeys = {
  prompts: (params: unknown = null) => ['prompts', params] as const,
  prompt: (id: string) => ['prompt', id] as const,
  tags: ['tags'] as const,
  profile: ['profile'] as const,
}
