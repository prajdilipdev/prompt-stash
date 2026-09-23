import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface UIContextValue {
  paletteOpen: boolean
  openPalette: () => void
  closePalette: () => void
  importOpen: boolean
  openImport: () => void
  closeImport: () => void
  tagManagerOpen: boolean
  openTagManager: () => void
  closeTagManager: () => void
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}

const UIContext = createContext<UIContextValue | null>(null)

/** App-wide UI state: command palette, import dialog, tag manager, mobile nav. */
export function UIProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [tagManagerOpen, setTagManagerOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const value = useMemo(
    () => ({
      paletteOpen,
      openPalette: () => setPaletteOpen(true),
      closePalette: () => setPaletteOpen(false),
      importOpen,
      openImport: () => setImportOpen(true),
      closeImport: () => setImportOpen(false),
      tagManagerOpen,
      openTagManager: () => setTagManagerOpen(true),
      closeTagManager: () => setTagManagerOpen(false),
      mobileNavOpen,
      setMobileNavOpen,
    }),
    [paletteOpen, importOpen, tagManagerOpen, mobileNavOpen],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
