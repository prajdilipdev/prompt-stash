import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { storage } from '@/lib/utils'

export type ThemeMode = 'system' | 'light' | 'dark'
export type AccentId = 'blue' | 'indigo' | 'violet' | 'emerald' | 'teal' | 'amber'

export const ACCENTS: { id: AccentId; label: string; swatch: string }[] = [
  { id: 'blue', label: 'Electric Blue', swatch: '#3b82f6' },
  { id: 'indigo', label: 'Indigo', swatch: '#6f7bf7' },
  { id: 'violet', label: 'Violet', swatch: '#9d6ef0' },
  { id: 'emerald', label: 'Emerald', swatch: '#26b581' },
  { id: 'teal', label: 'Teal', swatch: '#22a3a0' },
  { id: 'amber', label: 'Amber', swatch: '#eda121' },
]

const MODE_KEY = 'theme'
const ACCENT_KEY = 'accent'

function applyAttributes(mode: ThemeMode, accent: AccentId): 'light' | 'dark' {
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
  const resolved = mode === 'system' ? (systemPrefersLight ? 'light' : 'dark') : mode
  document.documentElement.dataset.theme = resolved
  document.documentElement.dataset.accent = accent
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  return resolved
}

interface ThemeContextValue {
  mode: ThemeMode
  accent: AccentId
  /** The theme actually applied right now (system resolved). */
  resolved: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: AccentId) => void
  cycleAccent: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readInitialMode(): ThemeMode {
  const stored = storage.get<string>(MODE_KEY, 'system')
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

function readInitialAccent(): AccentId {
  const stored = storage.get<string>(ACCENT_KEY, 'indigo')
  return (ACCENTS.find((a) => a.id === stored)?.id ?? 'indigo') as AccentId
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readInitialMode)
  const [accent, setAccentState] = useState<AccentId>(readInitialAccent)
  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark',
  )

  useEffect(() => {
    setResolved(applyAttributes(mode, accent))
  }, [mode, accent])

  // Follow OS preference while in System mode.
  useEffect(() => {
    if (mode !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setResolved(applyAttributes(mode, accent))
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode, accent])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    storage.set(MODE_KEY, next)
  }, [])

  const setAccent = useCallback((next: AccentId) => {
    setAccentState(next)
    storage.set(ACCENT_KEY, next)
  }, [])

  const cycleAccent = useCallback(() => {
    setAccentState((current) => {
      const index = ACCENTS.findIndex((a) => a.id === current)
      const next = ACCENTS[(index + 1) % ACCENTS.length]
      storage.set(ACCENT_KEY, next.id)
      return next.id
    })
  }, [])

  const value = useMemo(
    () => ({ mode, accent, resolved, setMode, setAccent, cycleAccent }),
    [mode, accent, resolved, setMode, setAccent, cycleAccent],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
