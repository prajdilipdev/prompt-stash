import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Copy,
  MoreHorizontal,
  Pencil,
  Play,
  Star,
  Trash2,
  CopyPlus,
} from 'lucide-react'
import {
  useArchivePrompt,
  useDuplicatePrompt,
  usePrompt,
  usePurgePrompt,
  useToggleFavorite,
  useTrashPrompt,
} from '@/hooks/usePrompts'
import { PromptTester } from '@/components/PromptTester'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TagBadge } from '@/components/TagBadge'
import { Button, IconButton } from '@/components/ui/Button'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { copyToClipboard } from '@/lib/clipboard'
import { extractVariables, variableLabel } from '@/lib/variables'
import { useToast } from '@/components/Toast'
import { useHotkey } from '@/hooks/useHotkeys'
import { formatDateTime, cn } from '@/lib/utils'

/** Dedicated prompt viewer with the full action toolbar. */
export function PromptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: prompt, isPending, isError, refetch } = usePrompt(id)

  const toggleFavorite = useToggleFavorite()
  const archive = useArchivePrompt()
  const trash = useTrashPrompt()
  const duplicate = useDuplicatePrompt()
  const purge = usePurgePrompt()

  const [testerOpen, setTesterOpen] = useState(false)
  const [trashConfirm, setTrashConfirm] = useState(false)

  const copyPrompt = useCallback(async () => {
    if (!prompt) return
    const ok = await copyToClipboard(prompt.content)
    toast(ok ? 'Prompt copied to clipboard.' : 'Could not copy — clipboard unavailable.', ok ? 'success' : 'error')
  }, [prompt, toast])

  // Ctrl/Cmd+Shift+C copies the open prompt.
  useHotkey('c', () => void copyPrompt(), { mod: true, shift: true, enabled: Boolean(prompt) })

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/3" />
        <Skeleton className="mt-8 h-64 w-full" />
      </div>
    )
  }

  if (isError || !prompt) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        {isError ? (
          <ErrorState title="Couldn't load this prompt" onRetry={() => refetch()} />
        ) : (
          <EmptyState
            icon={<Archive className="h-5 w-5" aria-hidden="true" />}
            title="Prompt not found"
            description="It may have been permanently deleted."
            action={
              <Button variant="outline" onClick={() => navigate('/app/prompts')}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to library
              </Button>
            }
          />
        )}
      </div>
    )
  }

  const variables = extractVariables(prompt.content)
  const isArchived = prompt.archivedAt !== null
  const isTrashed = prompt.deletedAt !== null

  return (
    <div className="page-enter mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Button>

        <div className="flex items-center gap-1">
          {!isTrashed && (
            <>
              <IconButton
                label={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                onClick={() =>
                  toggleFavorite.mutate(
                    { id: prompt.id, isFavorite: !prompt.isFavorite },
                    {
                      onSuccess: () =>
                        toast(
                          prompt.isFavorite ? 'Removed from favorites.' : 'Added to favorites.',
                          'success',
                        ),
                    },
                  )
                }
                className={prompt.isFavorite ? 'text-warning hover:text-warning' : ''}
              >
                <Star
                  className={cn('h-[18px] w-[18px]', prompt.isFavorite && 'fill-current')}
                  aria-hidden="true"
                />
              </IconButton>
              <IconButton label="Copy prompt (Ctrl+Shift+C)" onClick={() => void copyPrompt()}>
                <Copy className="h-[18px] w-[18px]" aria-hidden="true" />
              </IconButton>
              <Button variant="secondary" size="sm" className="ml-1" onClick={() => setTesterOpen(true)}>
                <Play className="h-4 w-4" aria-hidden="true" />
                Test Prompt
              </Button>
              {!isArchived && (
                <Button variant="primary" size="sm" onClick={() => navigate(`/app/prompts/${prompt.id}/edit`)}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Button>
              )}
            </>
          )}

          <Menu
            align="end"
            trigger={
              <IconButton label="More actions">
                <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
              </IconButton>
            }
          >
            {!isTrashed && (
              <MenuItem
                icon={<CopyPlus className="h-4 w-4" />}
                onSelect={() =>
                  duplicate.mutate(prompt.id, {
                    onSuccess: (copy) => {
                      toast('Prompt duplicated.', 'success')
                      navigate(`/app/prompts/${copy.id}`)
                    },
                    onError: () => toast('Could not duplicate the prompt.', 'error'),
                  })
                }
              >
                Duplicate
              </MenuItem>
            )}
            {!isTrashed && !isArchived && (
              <MenuItem
                icon={<Archive className="h-4 w-4" />}
                onSelect={() =>
                  archive.mutate(
                    { id: prompt.id, archived: true },
                    {
                      onSuccess: () => {
                        toast('Prompt archived.', 'success')
                        navigate('/app/prompts')
                      },
                    },
                  )
                }
              >
                Archive
              </MenuItem>
            )}
            {isArchived && !isTrashed && (
              <MenuItem
                icon={<ArchiveRestore className="h-4 w-4" />}
                onSelect={() =>
                  archive.mutate(
                    { id: prompt.id, archived: false },
                    { onSuccess: () => toast('Prompt restored.', 'success') },
                  )
                }
              >
                Restore from archive
              </MenuItem>
            )}
            {isTrashed ? (
              <>
                <MenuItem
                  icon={<ArchiveRestore className="h-4 w-4" />}
                  onSelect={() =>
                    trash.mutate(
                      { id: prompt.id, trashed: false },
                      { onSuccess: () => toast('Prompt restored.', 'success') },
                    )
                  }
                >
                  Restore from trash
                </MenuItem>
                <MenuSeparator />
                <MenuItem
                  destructive
                  icon={<Trash2 className="h-4 w-4" />}
                  onSelect={() => setTrashConfirm(true)}
                >
                  Delete permanently
                </MenuItem>
              </>
            ) : (
              <>
                <MenuSeparator />
                <MenuItem
                  destructive
                  icon={<Trash2 className="h-4 w-4" />}
                  onSelect={() => setTrashConfirm(true)}
                >
                  Move to trash
                </MenuItem>
              </>
            )}
          </Menu>
        </div>
      </div>

      {/* Header */}
      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {prompt.tags.map((tag) => (
            <TagBadge
              key={tag.id}
              name={tag.name}
              onClick={() => navigate(`/app/tags/${tag.id}`)}
            />
          ))}
          {isArchived && <TagBadge name="Archived" className="bg-warning/10 text-warning" />}
          {isTrashed && <TagBadge name="In trash" className="bg-danger/10 text-danger" />}
        </div>
        <h1 className="mt-2.5 text-[clamp(1.5rem,3vw,2rem)] font-bold leading-tight tracking-tight">
          {prompt.title}
        </h1>
        {prompt.description && (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {prompt.description}
          </p>
        )}
      </header>

      {/* Content */}
      <section aria-label="Prompt content" className="mt-6">
        <div className="rounded-lg border border-border bg-surface-elevated shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-label uppercase text-muted-foreground">Prompt</span>
            <button
              type="button"
              onClick={() => void copyPrompt()}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy
            </button>
          </div>
          <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-words px-4 py-4 font-mono text-[13px] leading-relaxed text-foreground">
            {prompt.content}
          </pre>
        </div>
      </section>

      {/* Variables */}
      {variables.length > 0 && (
        <section aria-label="Variables" className="mt-5">
          <h2 className="text-label uppercase text-muted-foreground">Variables</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {variables.map((name) => (
              <code
                key={name}
                className="rounded-[6px] border border-primary/20 bg-primary-soft px-2 py-1 font-mono text-xs text-primary"
              >
                {'{{'}
                {name}
                {'}}'} <span className="opacity-70">· {variableLabel(name)}</span>
              </code>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Use <strong>Test Prompt</strong> to preview this prompt with example values.
          </p>
        </section>
      )}

      {/* Notes */}
      {prompt.notes && (
        <section aria-label="Notes" className="mt-5">
          <h2 className="text-label uppercase text-muted-foreground">Notes</h2>
          <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {prompt.notes}
          </p>
        </section>
      )}

      {/* Meta */}
      <footer className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-5 text-[13px] sm:grid-cols-4">
        <div>
          <p className="text-caption text-muted-foreground">Created</p>
          <p className="mt-0.5 font-medium">{formatDateTime(prompt.createdAt)}</p>
        </div>
        <div>
          <p className="text-caption text-muted-foreground">Updated</p>
          <p className="mt-0.5 font-medium">{formatDateTime(prompt.updatedAt)}</p>
        </div>
        <div>
          <p className="text-caption text-muted-foreground">Favorite</p>
          <p className="mt-0.5 font-medium">{prompt.isFavorite ? 'Yes' : 'No'}</p>
        </div>
        <div>
          <p className="text-caption text-muted-foreground">Status</p>
          <p className="mt-0.5 font-medium">
            {isTrashed ? 'In trash' : isArchived ? 'Archived' : 'Active'}
          </p>
        </div>
      </footer>

      {/* Tester */}
      {testerOpen && <PromptTester prompt={prompt} onClose={() => setTesterOpen(false)} />}

      {/* Trash confirmation */}
      <ConfirmDialog
        open={trashConfirm}
        title={isTrashed ? 'Delete permanently?' : 'Move to trash?'}
        description={
          isTrashed
            ? `“${prompt.title}” will be permanently deleted. This action cannot be undone.`
            : `“${prompt.title}” will move to Trash, where you can still restore it.`
        }
        confirmLabel={isTrashed ? 'Delete permanently' : 'Move to trash'}
        destructive={isTrashed}
        requirePhrase={isTrashed ? 'DELETE' : undefined}
        loading={trash.isPending || purge.isPending}
        onCancel={() => setTrashConfirm(false)}
        onConfirm={() => {
          const done = () => {
            setTrashConfirm(false)
            toast(isTrashed ? 'Prompt permanently deleted.' : 'Moved to trash.', 'success')
            navigate(isTrashed ? '/app/trash' : '/app/prompts')
          }
          const fail = (e: unknown) =>
            toast(e instanceof Error ? e.message : 'Could not delete the prompt.', 'error')

          if (isTrashed) {
            purge.mutate(prompt.id, { onSuccess: done, onError: fail })
          } else {
            trash.mutate({ id: prompt.id, trashed: true }, { onSuccess: done, onError: fail })
          }
        }}
      />
    </div>
  )
}
