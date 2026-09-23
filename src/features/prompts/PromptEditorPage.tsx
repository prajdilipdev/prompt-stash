import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Archive,
  Check,
  CopyPlus,
  Loader2,
  MoreHorizontal,
  Trash2,
  Variable,
  XCircle,
} from 'lucide-react'
import {
  useCreatePrompt,
  usePrompt,
  useUpdatePrompt,
  useDuplicatePrompt,
  useArchivePrompt,
  useTrashPrompt,
} from '@/hooks/usePrompts'
import { TagSelector } from '@/components/TagSelector'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button, IconButton } from '@/components/ui/Button'
import { FieldError, Input, Label, Textarea } from '@/components/ui/Field'
import { Switch } from '@/components/ui/Switch'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/States'
import { extractVariables, variableLabel } from '@/lib/variables'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/utils'
import type { PromptInput } from '@/types'

const promptSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Give your prompt a title')
    .max(300, 'Keep the title under 300 characters'),
  description: z.string().trim().max(2000, 'Keep the description under 2,000 characters'),
  content: z.string().min(1, 'The prompt content is required').max(100_000),
  notes: z.string().trim().max(10_000, 'Keep notes under 10,000 characters'),
  isFavorite: z.boolean(),
})

type PromptForm = z.infer<typeof promptSchema>

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DELAY = 1800

/** Prompt creation + editing workspace with debounced autosave. */
export function PromptEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: existing, isPending: loadingExisting } = usePrompt(id)

  const [tags, setTags] = useState<string[]>([])
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [trashConfirm, setTrashConfirm] = useState(false)
  const autosaveTimer = useRef<number | null>(null)
  const savingRef = useRef(false)
  const hydratedRef = useRef(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    formState: { errors, isValid, dirtyFields },
  } = useForm<PromptForm>({
    resolver: zodResolver(promptSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      content: '',
      notes: '',
      isFavorite: false,
    },
  })

  const watchedContent = watch('content')
  const variables = useMemo(() => extractVariables(watchedContent ?? ''), [watchedContent])
  const isDirty = Object.keys(dirtyFields).length > 0

  // Hydrate the form once when editing an existing prompt.
  useEffect(() => {
    if (!existing || hydratedRef.current) return
    reset({
      title: existing.title,
      description: existing.description,
      content: existing.content,
      notes: existing.notes,
      isFavorite: existing.isFavorite,
    })
    setTags(existing.tags.map((t) => t.name))
    hydratedRef.current = true
    setSaveStatus('idle')
  }, [existing, reset])

  // Reset hydration when switching prompts
  useEffect(() => {
    hydratedRef.current = false
  }, [id])

  const createPrompt = useCreatePrompt()
  const updatePromptMutation = useUpdatePrompt()
  const duplicate = useDuplicatePrompt()
  const archive = useArchivePrompt()
  const trash = useTrashPrompt()

  const buildInput = useCallback((): PromptInput => {
    const values = getValues()
    return {
      title: values.title.trim(),
      description: values.description.trim(),
      content: values.content,
      notes: values.notes.trim(),
      isFavorite: values.isFavorite,
      tagNames: tags,
    }
  }, [getValues, tags])

  const persist = useCallback(
    async (silent: boolean): Promise<boolean> => {
      if (savingRef.current) return false
      savingRef.current = true
      setSaveStatus('saving')
      try {
        const input = buildInput()
        if (isNew) {
          const created = await createPrompt.mutateAsync(input)
          setSaveStatus('saved')
          if (!silent) toast('Prompt saved.', 'success')
          navigate(`/app/prompts/${created.id}/edit`, { replace: true })
        } else {
          await updatePromptMutation.mutateAsync({ ...input, id: id as string })
          setSaveStatus('saved')
          if (!silent) toast('Prompt saved.', 'success')
        }
        return true
      } catch (e) {
        setSaveStatus('error')
        if (!silent)
          toast(e instanceof Error ? e.message : 'Unable to save. Please try again.', 'error')
        return false
      } finally {
        savingRef.current = false
      }
    },
    [buildInput, createPrompt, updatePromptMutation, id, isNew, navigate, toast],
  )

  // Keep latest persist/validity in refs so the autosave subscription stays stable.
  const persistRef = useRef(persist)
  useEffect(() => {
    persistRef.current = persist
  }, [persist])
  const isValidRef = useRef(isValid)
  useEffect(() => {
    isValidRef.current = isValid
  }, [isValid])

  // Debounced autosave (existing prompts only; never spams the database).
  useEffect(() => {
    if (isNew) return
    const subscription = watch(() => {
      if (!hydratedRef.current || !isValidRef.current || savingRef.current) return
      setSaveStatus('dirty')
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current)
      autosaveTimer.current = window.setTimeout(() => {
        void persistRef.current(true)
      }, AUTOSAVE_DELAY)
    })
    return () => {
      subscription.unsubscribe()
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current)
    }
  }, [isNew, watch])

  // Warn about unsaved changes on tab close.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && saveStatus !== 'saving') {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, saveStatus])

  const onSubmit = handleSubmit(async () => {
    const ok = await persist(false)
    if (ok && isNew) {
      // persist already navigated to /edit of the new prompt; go to the viewer.
      return
    }
  })

  const onSaveAndClose = handleSubmit(async () => {
    const ok = await persist(false)
    if (ok) {
      navigate(id ? `/app/prompts/${id}` : '/app/prompts')
    }
  })

  // Ctrl/Cmd+S — save in place.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (isValid) void onSubmit()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isValid, onSubmit])

  if (!isNew && loadingExisting) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    )
  }

  if (!isNew && !existing) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <EmptyState
          icon={<Archive className="h-5 w-5" aria-hidden="true" />}
          title="Prompt not found"
          description="It may have been permanently deleted."
          action={
            <Button variant="outline" onClick={() => navigate('/app/prompts')}>
              Back to library
            </Button>
          }
        />
      </div>
    )
  }

  const statusMeta: Record<SaveStatus, { label: string; className: string; icon?: React.ReactNode }> = {
    idle: { label: isNew ? 'New prompt' : 'Up to date', className: 'text-muted-foreground' },
    dirty: { label: 'Unsaved changes', className: 'text-warning' },
    saving: {
      label: 'Saving…',
      className: 'text-muted-foreground',
      icon: <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />,
    },
    saved: { label: 'Saved', className: 'text-success', icon: <Check className="h-3 w-3" aria-hidden="true" /> },
    error: {
      label: 'Unable to save',
      className: 'text-danger',
      icon: <XCircle className="h-3 w-3" aria-hidden="true" />,
    },
  }

  return (
    <div className="page-enter mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => (id ? navigate(`/app/prompts/${id}`) : navigate(-1))}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {id ? 'Back to prompt' : 'Back'}
        </Button>

        <div className="flex items-center gap-2">
          <span
            className={cn('flex items-center gap-1.5 text-xs font-medium', statusMeta[saveStatus].className)}
            role="status"
            aria-live="polite"
          >
            {statusMeta[saveStatus].icon}
            {statusMeta[saveStatus].label}
          </span>

          {!isNew && existing && (
            <Menu
              align="end"
              trigger={
                <IconButton label="More actions">
                  <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
                </IconButton>
              }
            >
              <MenuItem
                icon={<CopyPlus className="h-4 w-4" />}
                onSelect={() =>
                  duplicate.mutate(existing.id, {
                    onSuccess: (copy) => {
                      toast('Prompt duplicated.', 'success')
                      navigate(`/app/prompts/${copy.id}/edit`)
                    },
                  })
                }
              >
                Duplicate
              </MenuItem>
              {!existing.archivedAt && (
                <MenuItem
                  icon={<Archive className="h-4 w-4" />}
                  onSelect={() =>
                    archive.mutate(
                      { id: existing.id, archived: true },
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
              <MenuSeparator />
              <MenuItem
                destructive
                icon={<Trash2 className="h-4 w-4" />}
                onSelect={() => setTrashConfirm(true)}
              >
                Move to trash
              </MenuItem>
            </Menu>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} noValidate className="mt-5">
        <h1 className="sr-only">{isNew ? 'Create a new prompt' : `Edit ${existing?.title ?? 'prompt'}`}</h1>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={watch('isFavorite')}
              onCheckedChange={(v) => reset((prev) => ({ ...prev, isFavorite: v }), { keepDirty: true })}
              label="Mark as favorite"
            />
            <span className="text-[13px] text-muted-foreground">Favorite</span>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" disabled={!isValid} onClick={() => void onSaveAndClose()}>
              Save &amp; Close
            </Button>
            <Button type="submit" disabled={!isValid}>
              Save
            </Button>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <Label htmlFor="prompt-title" required>
              Title
            </Label>
            <Input
              id="prompt-title"
              placeholder="e.g. Product Description Optimizer"
              invalid={Boolean(errors.title)}
              className="h-11 text-[15px] font-medium"
              {...register('title')}
            />
            <FieldError>{errors.title?.message}</FieldError>
          </div>

          <div>
            <Label htmlFor="prompt-description">Description</Label>
            <Input
              id="prompt-description"
              placeholder="What does this prompt do, and when should you use it?"
              invalid={Boolean(errors.description)}
              {...register('description')}
            />
            <FieldError>{errors.description?.message}</FieldError>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt-content" required className="mb-1.5">
                Prompt content
              </Label>
              {variables.length > 0 && (
                <span className="mb-1.5 flex items-center gap-1 text-xs text-primary">
                  <Variable className="h-3.5 w-3.5" aria-hidden="true" />
                  {variables.length} variable{variables.length === 1 ? '' : 's'} detected
                </span>
              )}
            </div>
            <Textarea
              id="prompt-content"
              placeholder={'Write your prompt…\n\nUse {{variables}} for reusable slots, e.g.\nWrite a product description for {{product_name}}.'}
              invalid={Boolean(errors.content)}
              rows={12}
              className="min-h-[240px] font-mono text-[13px] leading-relaxed"
              {...register('content')}
            />
            <FieldError>{errors.content?.message}</FieldError>

            {variables.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Detected variables">
                {variables.map((name) => (
                  <code
                    key={name}
                    className="rounded-[6px] border border-primary/20 bg-primary-soft px-2 py-0.5 font-mono text-[11.5px] text-primary"
                  >
                    {'{{'}
                    {name}
                    {'}}'} <span className="opacity-70">· {variableLabel(name)}</span>
                  </code>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Tags</Label>
            <TagSelector value={tags} onChange={setTags} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Press Enter or comma to confirm a tag. New tags are created automatically.
            </p>
          </div>

          <div>
            <Label htmlFor="prompt-notes">Notes</Label>
            <Textarea
              id="prompt-notes"
              placeholder="Private notes: when to use it, what to watch out for, versions…"
              invalid={Boolean(errors.notes)}
              rows={4}
              {...register('notes')}
            />
            <FieldError>{errors.notes?.message}</FieldError>
          </div>
        </div>
      </form>

      {/* Trash confirmation */}
      {existing && (
        <ConfirmDialog
          open={trashConfirm}
          title="Move to trash?"
          description={`“${existing.title}” will move to Trash, where you can still restore it.`}
          confirmLabel="Move to trash"
          destructive
          loading={trash.isPending}
          onCancel={() => setTrashConfirm(false)}
          onConfirm={() => {
            trash.mutate(
              { id: existing.id, trashed: true },
              {
                onSuccess: () => {
                  setTrashConfirm(false)
                  toast('Moved to trash.', 'success')
                  navigate('/app/prompts')
                },
                onError: (e) =>
                  toast(e instanceof Error ? e.message : 'Could not delete the prompt.', 'error'),
              },
            )
          }}
        />
      )}
    </div>
  )
}
