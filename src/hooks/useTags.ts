import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import { deleteTag, fetchTagsWithCounts, renameTag } from '@/services/tagService'

export function useTagsWithCounts() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: fetchTagsWithCounts,
  })
}

export function useRenameTag() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameTag(id, name),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.tags })
      client.invalidateQueries({ queryKey: ['prompts'] })
      client.invalidateQueries({ queryKey: ['prompt'] })
    },
  })
}

export function useDeleteTag() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.tags })
      client.invalidateQueries({ queryKey: ['prompts'] })
      client.invalidateQueries({ queryKey: ['prompt'] })
    },
  })
}
