import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange?: (e: { target: { value: string } }) => void
  chevron?: boolean
  className?: string
  width?: string
  disabled?: boolean
  id?: string
  'aria-label'?: string
}

/**
 * Modern custom Select dropdown:
 * Replaces native OS select with an accessible, keyboard-friendly,
 * dark/light theme-matched custom popover list box.
 */
export function Select({
  options,
  value,
  onChange,
  chevron = true,
  className,
  width,
  disabled = false,
  id,
  'aria-label': ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selectedOption = options.find((o) => o.value === value) ?? options[0]

  const close = useCallback((focusTrigger = true) => {
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }, [])

  const select = useCallback(
    (optValue: string) => {
      onChange?.({ target: { value: optValue } } as { target: { value: string } })
      close(true)
    },
    [onChange, close],
  )

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        close(true)
        return
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
      const buttons = Array.from(
        listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
      )
      if (buttons.length === 0) return
      event.preventDefault()
      const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement)
      let next = currentIndex
      if (event.key === 'ArrowDown') next = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0
      else next = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1
      buttons[next].focus()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    // Focus selected or first item
    requestAnimationFrame(() => {
      const selectedBtn = listRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')
      const firstBtn = listRef.current?.querySelector<HTMLButtonElement>('[role="option"]')
      ;(selectedBtn ?? firstBtn)?.focus()
    })

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex h-9 items-center justify-between gap-2 rounded-md border border-border bg-input px-3 text-base sm:text-sm text-foreground shadow-sm',
          'transition-all duration-150',
          'hover:bg-surface-hover hover:border-primary/40 focus:outline-none focus:border-ring/70 focus:ring-2 focus:ring-ring/30',
          'active:scale-[0.98]',
          disabled && 'cursor-not-allowed opacity-60 pointer-events-none',
        )}
      >
        <span className="truncate font-medium">{selectedOption?.label}</span>
        {chevron && (
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180 text-foreground',
            )}
            aria-hidden="true"
          />
        )}
      </button>

      {open && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          className={cn(
            'absolute right-0 top-full z-50 mt-1.5 min-w-full w-max max-w-xs overflow-hidden rounded-lg border border-border bg-surface-elevated p-1 shadow-overlay animate-scale-in',
            width,
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => select(opt.value)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-xs sm:text-[13px] font-medium transition-colors outline-none',
                  isSelected
                    ? 'bg-primary-soft text-primary font-semibold'
                    : 'text-foreground/90 hover:bg-surface-hover hover:text-foreground focus:bg-surface-hover focus:text-foreground',
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
