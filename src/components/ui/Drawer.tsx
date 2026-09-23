import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from './Button'

interface DrawerProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  labelledBy?: string
  /** Hide the default close button in the corner. */
  hideClose?: boolean
  size?: 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const sizes = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

/**
 * Slide-over right drawer: portal, overlay, focus trap, Escape to close,
 * focus restoration, body scroll lock, right-to-left slide animation.
 */
export function Drawer({
  open,
  onClose,
  children,
  labelledBy,
  hideClose,
  size = '2xl',
  className,
}: DrawerProps) {
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
    <div className="fixed inset-0 z-[80] overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          className={cn(
            'relative flex h-full w-screen flex-col border-l border-border bg-surface-elevated shadow-overlay outline-none animate-slide-in-right',
            sizes[size],
            className,
          )}
        >
          {!hideClose && (
            <IconButton
              label="Close panel"
              size="sm"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function DrawerHeader({
  id,
  title,
  description,
  children,
}: {
  id?: string
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="border-b border-border px-6 py-5">
      <div className="pr-8">
        <h2 id={id} className="text-h3 font-semibold text-foreground">
          {title}
        </h2>
        {description && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function DrawerBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-6 py-5', className)}>
      {children}
    </div>
  )
}

export function DrawerFooter({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse justify-end gap-2 border-t border-border bg-surface px-6 py-4 sm:flex-row',
        className,
      )}
    >
      {children}
    </div>
  )
}
