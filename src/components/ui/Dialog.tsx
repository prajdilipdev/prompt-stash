import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from './Button'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  labelledBy?: string
  /** Hide the default close button in the corner. */
  hideClose?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

/**
 * Accessible modal dialog: portal, overlay, focus trap, Escape to close,
 * focus restoration, body scroll lock.
 */
export function Dialog({
  open,
  onClose,
  children,
  labelledBy,
  hideClose,
  size = 'md',
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panel)?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
      if (focusables.length === 0) return
      const firstEl = focusables[0]
      const lastEl = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault()
        lastEl.focus()
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = prevOverflow
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          'relative w-full rounded-t-xl bg-surface-elevated shadow-overlay outline-none animate-scale-in sm:rounded-lg',
          'max-h-[92dvh] overflow-y-auto border border-border',
          sizes[size],
          className,
        )}
      >
        {!hideClose && (
          <IconButton
            label="Close dialog"
            size="sm"
            onClick={onClose}
            className="absolute right-3 top-3 z-10"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function DialogHeader({
  id,
  title,
  description,
}: {
  id?: string
  title: string
  description?: string
}) {
  return (
    <div className="border-b border-border px-6 py-4">
      <h2 id={id} className="text-h3 text-foreground">
        {title}
      </h2>
      {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
    </div>
  )
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse justify-end gap-2 border-t border-border px-6 py-4 sm:flex-row',
        className,
      )}
    >
      {children}
    </div>
  )
}
