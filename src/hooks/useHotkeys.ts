import { useEffect } from 'react'

export type HotkeyHandler = (event: KeyboardEvent) => void

interface HotkeyOptions {
  /** Require Ctrl (or ⌘ on macOS). */
  mod?: boolean
  shift?: boolean
  /** Ignore events originating from inputs/textareas/contenteditable. Default true. */
  ignoreInputs?: boolean
  enabled?: boolean
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
  )
}

/**
 * Register a global keyboard shortcut.
 * The event is prevented automatically when the handler runs.
 */
export function useHotkey(
  key: string,
  handler: HotkeyHandler,
  { mod = false, shift = false, ignoreInputs = true, enabled = true }: HotkeyOptions = {},
): void {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return
      if (mod && !(event.metaKey || event.ctrlKey)) return
      if (!mod && (event.metaKey || event.ctrlKey)) return
      if (shift !== event.shiftKey) return
      if (ignoreInputs && isEditableTarget(event.target)) return
      event.preventDefault()
      handler(event)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [key, handler, mod, shift, ignoreInputs, enabled])
}
