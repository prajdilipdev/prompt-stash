import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Archive,
  ArrowRight,
  Clock,
  Download,
  FileText,
  Info,
  Palette,
  Play,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  SunMoon,
  Upload,
} from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { useUI } from '@/components/UIContext'
import { useTheme } from '@/hooks/useTheme'
import { useDebouncedValue } from '@/hooks/useDebounce'
import { fetchLibrary } from '@/services/promptService'
import { fetchAllForExport } from '@/services/promptService'
import { exportPromptsToFile } from '@/lib/importExport'
import { useToast } from '@/components/Toast'
import { modKeyLabel, cn } from '@/lib/utils'
import type { Prompt } from '@/types'

interface Command {
  id: string
  label: string
  hint?: string
  icon: React.ReactNode
  perform: () => void
}

/**
 * Global command palette (Ctrl/Cmd+K). Full keyboard navigation:
 * ↑/↓ move, Enter runs, Esc closes.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setMode, resolved, cycleAccent } = useTheme()
  const { openImport } = useUI()

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [promptResults, setPromptResults] = useState<Prompt[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebouncedValue(query, 220)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setPromptResults([])
      // Focus after the dialog mounts
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Prompt search results
  useEffect(() => {
    if (!open) return
    const q = debouncedQuery.trim()
    if (!q) {
      setPromptResults([])
      return
    }
    let cancelled = false
    fetchLibrary({ view: 'all', search: q, sort: 'updated', page: 0, pageSize: 200 })
      .then((result) => {
        if (!cancelled) setPromptResults(result.items.slice(0, 6))
      })
      .catch(() => {
        if (!cancelled) setPromptResults([])
      })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, open])

  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  const commands = useMemo<Command[]>(
    () => [
      {
        id: 'new-prompt',
        label: 'New Prompt',
        hint: `${modKeyLabel()} N`,
        icon: <Plus className="h-4 w-4" />,
        perform: () => go('/app/prompts/new'),
      },
      {
        id: 'all',
        label: 'All Prompts',
        icon: <FileText className="h-4 w-4" />,
        perform: () => go('/app/prompts'),
      },
      {
        id: 'favorites',
        label: 'Favorites',
        icon: <Star className="h-4 w-4" />,
        perform: () => go('/app/favorites'),
      },
      {
        id: 'recent',
        label: 'Recent',
        icon: <Clock className="h-4 w-4" />,
        perform: () => go('/app/recent'),
      },
      {
        id: 'archived',
        label: 'Archived',
        icon: <Archive className="h-4 w-4" />,
        perform: () => go('/app/archived'),
      },
      {
        id: 'import',
        label: 'Import prompts from JSON',
        icon: <Upload className="h-4 w-4" />,
        perform: () => {
          onClose()
          openImport()
        },
      },
      {
        id: 'export',
        label: 'Export library to JSON',
        icon: <Download className="h-4 w-4" />,
        perform: async () => {
          onClose()
          try {
            const prompts = await fetchAllForExport()
            exportPromptsToFile(prompts)
            toast(`Exported ${prompts.length} prompts.`, 'success')
          } catch {
            toast('Export failed. Please try again.', 'error')
          }
        },
      },
      {
        id: 'toggle-theme',
        label: resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        icon: <SunMoon className="h-4 w-4" />,
        perform: () => {
          setMode(resolved === 'dark' ? 'light' : 'dark')
          onClose()
        },
      },
      {
        id: 'accent',
        label: 'Change accent color',
        icon: <Palette className="h-4 w-4" />,
        perform: () => {
          cycleAccent()
          toast('Accent color changed.', 'info')
        },
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: <Settings className="h-4 w-4" />,
        perform: () => go('/app/settings'),
      },
      {
        id: 'about',
        label: 'About Prompt Stash',
        icon: <Info className="h-4 w-4" />,
        perform: () => go('/app/about'),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolved, open],
  )

  const q = query.trim().toLowerCase()
  const filteredCommands = q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands

  const items = useMemo(() => {
    const commandItems = filteredCommands.map((c) => ({ kind: 'command' as const, command: c }))
    const promptItems = promptResults.map((p) => ({ kind: 'prompt' as const, prompt: p }))
    return [...commandItems, ...promptItems]
  }, [filteredCommands, promptResults])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const runItem = (index: number) => {
    const item = items[index]
    if (!item) return
    if (item.kind === 'command') {
      item.command.perform()
    } else {
      onClose()
      navigate(`/app/prompts/${item.prompt.id}`)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (items.length ? (i + 1) % items.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (items.length ? (i - 1 + items.length) % items.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runItem(activeIndex)
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  let cursor = -1

  return (
    <Dialog open={open} onClose={onClose} hideClose size="lg" className="mt-[8vh] self-start overflow-hidden p-0">
      <div className="flex items-center gap-2.5 border-b border-border px-4">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search prompts or type a command…"
          aria-label="Command palette"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          className="h-12 w-full bg-transparent text-base sm:text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
          ESC
        </kbd>
      </div>

      <div ref={listRef} id="palette-results" role="listbox" aria-label="Results" className="max-h-[46vh] overflow-y-auto p-2">
        {items.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            No matches. Try a different search or command.
          </p>
        )}

        {filteredCommands.length > 0 && (
          <p className="px-3 pb-1 pt-2 text-label uppercase text-muted-foreground">Commands</p>
        )}
        {filteredCommands.map((command) => {
          cursor += 1
          const index = cursor
          return (
            <button
              key={command.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              data-active={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => runItem(index)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                index === activeIndex ? 'bg-primary-soft text-primary' : 'text-foreground/90',
              )}
            >
              <span className={cn('shrink-0', index === activeIndex ? 'text-primary' : 'text-muted-foreground')}>
                {command.icon}
              </span>
              <span className="flex-1 truncate font-medium">{command.label}</span>
              {command.hint && (
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {command.hint}
                </kbd>
              )}
            </button>
          )
        })}

        {promptResults.length > 0 && (
          <p className="px-3 pb-1 pt-3 text-label uppercase text-muted-foreground">Prompts</p>
        )}
        {promptResults.map((prompt) => {
          cursor += 1
          const index = cursor
          return (
            <button
              key={prompt.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              data-active={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => runItem(index)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                index === activeIndex ? 'bg-primary-soft text-primary' : 'text-foreground/90',
              )}
            >
              <Sparkles
                className={cn('h-4 w-4 shrink-0', index === activeIndex ? 'text-primary' : 'text-muted-foreground')}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{prompt.title}</span>
                {prompt.description && (
                  <span className="block truncate text-xs text-muted-foreground">{prompt.description}</span>
                )}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-medium">↑↓</kbd> navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-medium">↵</kbd> select
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-medium">esc</kbd> close
        </span>
        <span className="ml-auto hidden sm:block">
          <Play className="mr-1 inline h-3 w-3" aria-hidden="true" />
          Prompt Stash
        </span>
      </div>
    </Dialog>
  )
}
