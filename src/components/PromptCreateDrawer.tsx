import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Variable } from 'lucide-react'
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { FieldError, Input, Label, Textarea } from '@/components/ui/Field'
import { Switch } from '@/components/ui/Switch'
import { TagSelector } from '@/components/TagSelector'
import { useCreatePrompt } from '@/hooks/usePrompts'
import { extractVariables } from '@/lib/variables'
import { useToast } from '@/components/Toast'

const createPromptSchema = z.object({
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

type CreatePromptForm = z.infer<typeof createPromptSchema>

interface PromptCreateDrawerProps {
  open: boolean
  onClose: () => void
}

/**
 * Slide-over right-side drawer to create a new prompt without leaving the page.
 * Slides in from right to left with rich variable detection and tag picker.
 */
export function PromptCreateDrawer({ open, onClose }: PromptCreateDrawerProps) {
  const { toast } = useToast()
  const createPrompt = useCreatePrompt()
  const [tags, setTags] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CreatePromptForm>({
    resolver: zodResolver(createPromptSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      content: '',
      notes: '',
      isFavorite: false,
    },
  })

  // Reset form whenever drawer opens
  useEffect(() => {
    if (open) {
      reset({
        title: '',
        description: '',
        content: '',
        notes: '',
        isFavorite: false,
      })
      setTags([])
    }
  }, [open, reset])

  const watchedContent = watch('content')
  const variables = useMemo(() => extractVariables(watchedContent ?? ''), [watchedContent])

  const onSubmit = async (values: CreatePromptForm) => {
    try {
      await createPrompt.mutateAsync({
        title: values.title.trim(),
        description: values.description.trim(),
        content: values.content,
        notes: values.notes.trim(),
        isFavorite: values.isFavorite,
        tagNames: tags,
      })
      toast('Prompt created successfully.', 'success')
      onClose()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not create prompt. Please try again.', 'error')
    }
  }

  return (
    <Drawer open={open} onClose={onClose} labelledBy="create-drawer-title" size="2xl">
      <DrawerHeader
        id="create-drawer-title"
        title="New Prompt"
        description="Create and organize a prompt with reusable {{variables}} and tags."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden" noValidate>
        <DrawerBody className="space-y-5">
          {/* Title */}
          <div>
            <Label htmlFor="create-title" required>
              Title
            </Label>
            <Input
              id="create-title"
              placeholder="e.g. Cold Outreach Email Generator"
              invalid={Boolean(errors.title)}
              className="h-10 text-base sm:text-sm font-medium"
              autoFocus
              {...register('title')}
            />
            <FieldError>{errors.title?.message}</FieldError>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="create-description">Description</Label>
            <Input
              id="create-description"
              placeholder="What does this prompt do, and when should you use it?"
              invalid={Boolean(errors.description)}
              className="text-base sm:text-sm"
              {...register('description')}
            />
            <FieldError>{errors.description?.message}</FieldError>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <TagSelector value={tags} onChange={setTags} />
            <p className="mt-1 text-xs text-muted-foreground">Type a tag name and press Enter or comma to add.</p>
          </div>

          {/* Prompt content */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="create-content" required className="mb-1.5">
                Prompt content
              </Label>
              {variables.length > 0 && (
                <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-primary">
                  <Variable className="h-3.5 w-3.5" aria-hidden="true" />
                  {variables.length} variable{variables.length === 1 ? '' : 's'} detected
                </span>
              )}
            </div>
            <Textarea
              id="create-content"
              placeholder={'Write your prompt here…\n\nTip: Use {{variables}} for dynamic values, e.g.:\nWrite a 200-word email to {{prospect_name}} about {{product_feature}}.'}
              invalid={Boolean(errors.content)}
              rows={8}
              className="font-mono text-base sm:text-[13px] leading-relaxed"
              {...register('content')}
            />
            <FieldError>{errors.content?.message}</FieldError>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="create-notes">Private Notes (Optional)</Label>
            <Textarea
              id="create-notes"
              placeholder="When to use this, model tips, target parameters…"
              invalid={Boolean(errors.notes)}
              rows={3}
              className="text-base sm:text-sm"
              {...register('notes')}
            />
            <FieldError>{errors.notes?.message}</FieldError>
          </div>

          {/* Favorite Switch */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
            <div>
              <p className="text-[13px] font-medium text-foreground">Add to Favorites</p>
              <p className="text-xs text-muted-foreground">Pin this prompt to your Favorites list for fast access.</p>
            </div>
            <Switch
              checked={watch('isFavorite')}
              onCheckedChange={(v) => reset((prev) => ({ ...prev, isFavorite: v }), { keepDirty: true })}
              label="Add to Favorites"
            />
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isValid || isSubmitting} loading={isSubmitting || createPrompt.isPending}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Prompt
          </Button>
        </DrawerFooter>
      </form>
    </Drawer>
  )
}
