import { useNavigate } from 'react-router-dom'
import {
  Archive,
  ArchiveRestore,
  Copy,
  MoreHorizontal,
  Pencil,
  Play,
  Star,
  Trash2,
} from 'lucide-react'
import type { Prompt } from '@/types'
import { TagBadge } from '@/components/TagBadge'
import { IconButton } from '@/components/ui/Button'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import {
  useArchivePrompt,
  useDuplicatePrompt,
  useToggleFavorite,
  useTrashPrompt,
} from '@/hooks/usePrompts'
import { copyToClipboard } from '@/lib/clipboard'
import { useToast } from '@/components/Toast'
import { timeAgo, cn } from '@/lib/utils'

export type CardContext = 'active' | 'archived' | 'trash'

interface PromptCardProps {
  prompt: Prompt
  context?: CardContext
  layout?: 'grid' | 'list'
  onTest?: (prompt: Prompt) => void
  onRequestPurge?: (prompt: Prompt) => void
  onTagClick?: (tagId: string) => void
}

export function PromptCard({
  prompt,
  context = 'active',
  layout = 'grid',
  onTest,
  onRequestPurge,
  onTagClick,
}: PromptCardProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const toggleFavorite = useToggleFavorite()
  const archive = useArchivePrompt()
  const trash = useTrashPrompt()
  const duplicate = useDuplicatePrompt()

  const open = () => navigate(`/app/prompts/${prompt.id}`)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const ok = await copyToClipboard(prompt.content)
    toast(ok ? 'Prompt copied to clipboard.' : 'Could not copy — clipboard unavailable.', ok ? 'success' : 'error')
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite.mutate(
      { id: prompt.id, isFavorite: !prompt.isFavorite },
      {
        onSuccess: () =>
          toast(prompt.isFavorite ? 'Removed from favorites.' : 'Added to favorites.', 'success'),
        onError: (err) => toast(err instanceof Error ? err.message : 'Could not update favorite.', 'error'),
      },
    )
  }

  const visibleTags = prompt.tags.slice(0, 3)
  const extraTags = prompt.tags.length - visibleTags.length

  const isList = layout === 'list'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target === e.currentTarget) open()
      }}
      aria-label={`Open prompt: ${prompt.title}`}
      className={cn(
        'group relative cursor-pointer rounded-lg border border-border bg-surface-elevated text-left shadow-card outline-none',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-pop focus-visible:border-primary/50 active:scale-[0.995]',
        isList ? 'flex items-start gap-4 px-4 py-3.5' : 'flex flex-col gap-2.5 p-4',
      )}
    >

      {/* Tags */}
      {!isList && (prompt.tags.length > 0 || context !== 'active') && (
        <div className="flex flex-wrap items-center gap-1.5">
          {visibleTags.map((tag) =>
            onTagClick ? (
              <TagBadge key={tag.id} name={tag.name} onClick={() => onTagClick(tag.id)} />
            ) : (
              <TagBadge key={tag.id} name={tag.name} />
            ),
          )}
          {extraTags > 0 && (
            <span className="text-[11px] font-medium text-muted-foreground">+{extraTags}</span>
          )}
        </div>
      )}

      <div className={cn(isList && 'min-w-0 flex-1')}>
        {/* Title row */}
        <div className="flex items-start gap-2">
          <h3 className={cn('min-w-0 flex-1 truncate font-semibold leading-snug text-foreground', isList ? 'text-[14.5px]' : 'text-h3')}>
            {prompt.title}
          </h3>
        </div>

        {/* Description / preview */}
        {prompt.description ? (
          <p className={cn('mt-1 text-[13px] leading-relaxed text-muted-foreground', isList ? 'line-clamp-1' : 'line-clamp-2')}>
            {prompt.description}
          </p>
        ) : (
          <p className={cn('mt-1 font-mono text-xs leading-relaxed text-muted-foreground/80', isList ? 'line-clamp-1' : 'line-clamp-2')}>
            {prompt.content}
          </p>
        )}

        {/* Meta */}
        <div className="mt-2.5 flex items-center gap-2 text-caption text-muted-foreground">
          <span>Updated {timeAgo(prompt.updatedAt)}</span>
          {context === 'archived' && <span className="text-warning">· Archived</span>}
          {context === 'trash' && <span className="text-danger">· In trash</span>}
          {isList && prompt.tags.length > 0 && (
            <span className="hidden items-center gap-1 md:flex">
              {visibleTags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} />
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div
        className={cn(
          'flex items-center gap-0.5 opacity-100 transition-opacity duration-150 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100',
          isList ? 'shrink-0 self-center' : 'absolute right-2.5 top-2.5 rounded-md bg-surface-elevated/90 backdrop-blur-sm',
        )}
        role="toolbar"
        aria-label="Prompt actions"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {context === 'active' && (
          <IconButton
            label={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            size="sm"
            onClick={handleFavorite}
            className={prompt.isFavorite ? 'text-warning hover:text-warning' : ''}
          >
            <Star
              className={cn('h-4 w-4 transition-colors', prompt.isFavorite && 'fill-current')}
              aria-hidden="true"
            />
          </IconButton>
        )}
        <IconButton label="Copy prompt" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <Menu
          align="end"
          trigger={
            <IconButton label={`Actions for ${prompt.title}`} size="sm">
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          }
        >
          {context === 'active' && (
            <>
              <MenuItem icon={<Pencil className="h-4 w-4" />} onSelect={() => navigate(`/app/prompts/${prompt.id}/edit`)}>
                Edit
              </MenuItem>
              {onTest && (
                <MenuItem icon={<Play className="h-4 w-4" />} onSelect={() => onTest(prompt)}>
                  Test prompt
                </MenuItem>
              )}
              <MenuItem
                icon={<Copy className="h-4 w-4" />}
                onSelect={() =>
                  duplicate.mutate(prompt.id, {
                    onSuccess: () => toast('Prompt duplicated.', 'success'),
                    onError: () => toast('Could not duplicate the prompt.', 'error'),
                  })
                }
              >
                Duplicate
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                icon={<Archive className="h-4 w-4" />}
                onSelect={() =>
                  archive.mutate(
                    { id: prompt.id, archived: true },
                    {
                      onSuccess: () => toast('Prompt archived.', 'success'),
                      onError: () => toast('Could not archive the prompt.', 'error'),
                    },
                  )
                }
              >
                Archive
              </MenuItem>
              <MenuItem
                destructive
                icon={<Trash2 className="h-4 w-4" />}
                onSelect={() =>
                  trash.mutate(
                    { id: prompt.id, trashed: true },
                    {
                      onSuccess: () => toast('Moved to trash.', 'info'),
                      onError: () => toast('Could not delete the prompt.', 'error'),
                    },
                  )
                }
              >
                Move to trash
              </MenuItem>
            </>
          )}

          {context === 'archived' && (
            <>
              <MenuItem
                icon={<ArchiveRestore className="h-4 w-4" />}
                onSelect={() =>
                  archive.mutate(
                    { id: prompt.id, archived: false },
                    {
                      onSuccess: () => toast('Prompt restored.', 'success'),
                      onError: () => toast('Could not restore the prompt.', 'error'),
                    },
                  )
                }
              >
                Restore
              </MenuItem>
              <MenuItem
                destructive
                icon={<Trash2 className="h-4 w-4" />}
                onSelect={() =>
                  trash.mutate(
                    { id: prompt.id, trashed: true },
                    {
                      onSuccess: () => toast('Moved to trash.', 'info'),
                      onError: () => toast('Could not delete the prompt.', 'error'),
                    },
                  )
                }
              >
                Move to trash
              </MenuItem>
            </>
          )}

          {context === 'trash' && (
            <>
              <MenuItem
                icon={<ArchiveRestore className="h-4 w-4" />}
                onSelect={() =>
                  trash.mutate(
                    { id: prompt.id, trashed: false },
                    {
                      onSuccess: () => toast('Prompt restored.', 'success'),
                      onError: () => toast('Could not restore the prompt.', 'error'),
                    },
                  )
                }
              >
                Restore
              </MenuItem>
              {onRequestPurge && (
                <MenuItem
                  destructive
                  icon={<Trash2 className="h-4 w-4" />}
                  onSelect={() => onRequestPurge(prompt)}
                >
                  Delete permanently
                </MenuItem>
              )}
            </>
          )}
        </Menu>
      </div>
    </div>
  )
}
