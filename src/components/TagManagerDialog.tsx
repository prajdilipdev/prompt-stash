import { useState } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Dialog, DialogHeader } from '@/components/ui/Dialog'
import { Button, IconButton } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useTagsWithCounts, useRenameTag, useDeleteTag } from '@/hooks/useTags'
import { resolveTags } from '@/services/promptService'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/Toast'

/**
 * Tag management: create, rename, delete. Tag creation matches existing
 * tags case-insensitively so accidental duplicates are impossible.
 */
export function TagManagerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, refetch } = useTagsWithCounts()
  const renameTag = useRenameTag()
  const deleteTagMutation = useDeleteTag()
  const client = useQueryClient()
  const { toast } = useToast()

  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tags = data?.tags ?? []

  const invalidate = () => {
    client.invalidateQueries({ queryKey: ['tags'] })
    client.invalidateQueries({ queryKey: ['prompts'] })
  }

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    setError(null)
    if (name.length > 40) {
      setError('Tag names are limited to 40 characters.')
      return
    }
    if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      setError('You already have a tag with this name.')
      return
    }
    setCreating(true)
    try {
      await resolveTags([name])
      setNewName('')
      invalidate()
      toast(`Tag “${name}” created.`, 'success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the tag.')
    } finally {
      setCreating(false)
    }
  }

  const handleRename = async (id: string) => {
    const name = editName.trim()
    if (!name) {
      setEditingId(null)
      return
    }
    if (tags.some((t) => t.id !== id && t.name.toLowerCase() === name.toLowerCase())) {
      setError('Another tag already uses this name.')
      return
    }
    try {
      await renameTag.mutateAsync({ id, name })
      setEditingId(null)
      invalidate()
      toast('Tag renamed.', 'success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not rename the tag.')
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} labelledBy="tag-manager-title" size="md">
        <DialogHeader
          id="tag-manager-title"
          title="Manage tags"
          description="Rename or delete tags. Deleting a tag removes it from prompts but never deletes the prompts themselves."
        />

        <div className="px-4 py-4 sm:px-6 sm:py-5">
          {/* Create */}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void handleCreate()
            }}
          >
            <Input
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value)
                setError(null)
              }}
              placeholder="New tag name…"
              aria-label="New tag name"
              maxLength={40}
            />
            <Button type="submit" loading={creating} disabled={!newName.trim()}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add
            </Button>
          </form>
          {error && (
            <p role="alert" className="mt-2 text-xs font-medium text-danger">
              {error}
            </p>
          )}

          {/* List */}
          <ul className="mt-4 max-h-[320px] divide-y divide-border overflow-y-auto rounded-md border border-border">
            {tags.length === 0 && (
              <li className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                No tags yet. Create one above or add tags while editing a prompt.
              </li>
            )}
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center gap-2 px-3 py-2">
                {editingId === tag.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      aria-label={`Rename tag ${tag.name}`}
                      className="h-8 flex-1"
                      maxLength={40}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleRename(tag.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                    <IconButton label="Save name" size="sm" onClick={() => void handleRename(tag.id)}>
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </IconButton>
                    <IconButton label="Cancel rename" size="sm" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" aria-hidden="true" />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{tag.name}</span>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums text-muted-foreground">
                      {tag.count}
                    </span>
                    <IconButton
                      label={`Rename tag ${tag.name}`}
                      size="sm"
                      onClick={() => {
                        setEditingId(tag.id)
                        setEditName(tag.name)
                        setError(null)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      label={`Delete tag ${tag.name}`}
                      size="sm"
                      onClick={() => setDeleting({ id: tag.id, name: tag.name })}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </IconButton>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete tag “${deleting?.name}”?`}
        description="The tag is removed from all prompts. The prompts themselves are kept. This cannot be undone."
        confirmLabel="Delete tag"
        destructive
        loading={deleteTagMutation.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          deleteTagMutation.mutate(deleting.id, {
            onSuccess: () => {
              toast(`Tag “${deleting.name}” deleted.`, 'success')
              setDeleting(null)
              invalidate()
              void refetch()
            },
            onError: (e) => toast(e instanceof Error ? e.message : 'Could not delete the tag.', 'error'),
          })
        }}
      />
    </>
  )
}
