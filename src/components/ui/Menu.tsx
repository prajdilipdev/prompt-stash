import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

interface MenuProps {
  /** Trigger element — receives aria + click wiring. */
  trigger: ReactElement
  children: ReactNode
  align?: 'start' | 'end'
  side?: 'bottom' | 'top' | 'right' | 'left'
  width?: string
}

/**
 * Lightweight accessible dropdown menu:
 * outside click closes, Escape closes, arrow keys navigate items,
 * Enter/Space activates, focus returns to trigger.
 */
export function Menu({ trigger, children, align = 'end', side = 'bottom', width = 'w-52' }: MenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const close = useCallback((focusTrigger = true) => {
    setOpen(false)
    if (focusTrigger) {
      const triggerEl = containerRef.current?.querySelector<HTMLElement>('[data-menu-trigger]')
      triggerEl?.focus()
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        close()
        return
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [],
      )
      if (items.length === 0) return
      event.preventDefault()
      const currentIndex = items.indexOf(document.activeElement as HTMLElement)
      let next = currentIndex
      if (event.key === 'ArrowDown') next = currentIndex < items.length - 1 ? currentIndex + 1 : 0
      else next = currentIndex > 0 ? currentIndex - 1 : items.length - 1
      items[next].focus()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    // Focus first item when opened
    const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
    first?.focus()
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  const triggerElement = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<Record<string, unknown>>, {
        'data-menu-trigger': true,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
        onClick: (event: React.MouseEvent) => {
          const original = (trigger.props as { onClick?: (e: React.MouseEvent) => void }).onClick
          original?.(event)
          if (!event.defaultPrevented) setOpen((v) => !v)
        },
      })
    : trigger

  const positionClasses = {
    bottom: cn('top-full mt-1.5 origin-top', align === 'end' ? 'right-0' : 'left-0'),
    top: cn('bottom-full mb-1.5 origin-bottom', align === 'end' ? 'right-0' : 'left-0'),
    right: 'bottom-0 left-full ml-2 origin-bottom-left',
    left: 'bottom-0 right-full mr-2 origin-bottom-right',
  }[side]

  return (
    <div ref={containerRef} className="relative inline-flex">
      {triggerElement}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          tabIndex={-1}
          className={cn(
            'absolute z-[70] overflow-hidden rounded-md border border-border bg-surface-elevated py-1 shadow-overlay animate-scale-in',
            positionClasses,
            width,
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              const target = e.target as HTMLElement
              if (target.getAttribute('role') === 'menuitem') {
                e.preventDefault()
                target.click()
              }
            }
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  icon?: ReactNode
  children: ReactNode
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
  closeOnSelect?: boolean
}

export function MenuItem({
  icon,
  children,
  onSelect,
  destructive,
  disabled,
  closeOnSelect = true,
}: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] font-medium outline-none transition-colors',
        'focus-visible:bg-surface-hover focus:bg-surface-hover',
        destructive ? 'text-danger hover:bg-danger/10' : 'text-foreground/90 hover:bg-surface-hover',
        disabled && 'pointer-events-none opacity-50',
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
        if (closeOnSelect) {
          const container = (e.currentTarget as HTMLElement).closest('[class*="relative"]')
          container?.querySelector<HTMLElement>('[data-menu-trigger]')?.focus()
        }
      }}
    >
      {icon && (
        <span className="shrink-0 text-muted-foreground" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </button>
  )
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-border" role="separator" />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-1.5 text-label uppercase text-muted-foreground">{children}</div>
  )
}
