import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTagsWithCounts } from '@/hooks/useTags'
import { cn } from '@/lib/utils'

interface TagSelectorProps {
  value: string[]
  onChange: (tags: string[]) => void
  max?: number
}

/**
 * Tag selector for the prompt editor: pick from existing tags or type a
 * new name. Matching is case-insensitive against existing tags, so
 * duplicates can't be created by accident.
 */
export function TagSelector({ value, onChange, max = 12 }: TagSelectorProps) {
  const { data } = useTagsWithCounts()
  const [draft, setDraft] = useState('')

  const existing = useMemo(() => data?.tags ?? [], [data])
  const selected = useMemo(() => new Set(value.map((v) => v.toLowerCase())), [value])

  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase()
    return existing
      .filter((t) => !selected.has(t.name.toLowerCase()))
      .filter((t) => (q ? t.name.toLowerCase().includes(q) : true))
      .slice(0, 6)
  }, [existing, selected, draft])

  const add = (name: string) => {
    const clean = name.trim().replace(/,+$/, '').trim()
    if (!clean) return
    if (clean.length > 40) return
    if (value.some((v) => v.toLowerCase() === clean.toLowerCase())) {
      setDraft('')
      return
    }
    if (value.length >= max) return
    // Prefer the canonical casing of an existing tag.
    const canonical = existing.find((t) => t.name.toLowerCase() === clean.toLowerCase())
    onChange([...value, canonical?.name ?? clean])
    setDraft('')
  }

  return (
    <div>
      <div
        className={cn(
          'flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-md border border-border bg-input px-2 py-1.5',
          'transition-colors focus-within:border-ring/70 focus-within:ring-2 focus-within:ring-ring/30',
        )}
      >
        {value.map((tag) => (
          <span
            key={tag.toLowerCase()}
            className="inline-flex items-center gap-1 rounded-[6px] bg-primary-soft px-2 py-0.5 text-[12px] font-medium text-primary"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              onClick={() => onChange(value.filter((v) => v !== tag))}
              className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add(draft)
            } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length === 0 ? 'Add tags… (Enter to confirm)' : ''}
          aria-label="Add tags"
          className="h-6 min-w-[120px] flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70"
        />
      </div>

      {(draft.trim() || suggestions.length > 0) && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {draft.trim() &&
            !existing.some((t) => t.name.toLowerCase() === draft.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => add(draft)}
                className="inline-flex items-center gap-1 rounded-[6px] border border-dashed border-primary/40 bg-primary/5 px-2 py-0.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                Create “{draft.trim()}”
              </button>
            )}
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => add(tag.name)}
              className="inline-flex items-center rounded-[6px] bg-muted px-2 py-0.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary"
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
