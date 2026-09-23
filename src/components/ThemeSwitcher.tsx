import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { ACCENTS, useTheme, type ThemeMode } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

const modes: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'system', label: 'System', icon: Monitor },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
]

/** Segmented appearance control: System / Light / Dark. */
export function ThemeModeSwitcher({ className }: { className?: string }) {
  const { mode, setMode } = useTheme()
  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className={cn('inline-flex rounded-md border border-border bg-input p-0.5', className)}
    >
      {modes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={mode === id}
          onClick={() => setMode(id)}
          className={cn(
            'flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium transition-all duration-150',
            mode === id
              ? 'bg-surface-elevated text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )
}

/** Accent preset swatches. */
export function AccentPicker({ className }: { className?: string }) {
  const { accent, setAccent } = useTheme()
  return (
    <div role="radiogroup" aria-label="Accent color" className={cn('flex flex-wrap gap-2', className)}>
      {ACCENTS.map((a) => {
        const active = accent === a.id
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`Accent: ${a.label}`}
            title={a.label}
            onClick={() => setAccent(a.id)}
            className={cn(
              'relative h-7 w-7 rounded-full transition-transform duration-150 hover:scale-110',
              active && 'ring-2 ring-foreground/70 ring-offset-2 ring-offset-surface-elevated',
            )}
            style={{ backgroundColor: a.swatch }}
          >
            {active && (
              <Check
                className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow"
                aria-hidden="true"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Compact inline switcher used in the sidebar footer. */
export function ThemeSwitcher({ compact }: { compact?: boolean }) {
  const { mode, setMode } = useTheme()
  if (!compact) return <ThemeModeSwitcher />

  return (
    <div role="radiogroup" aria-label="Appearance" className="flex rounded-md border border-border bg-input p-0.5">
      {modes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={mode === id}
          aria-label={`${label} theme`}
          title={`${label} theme`}
          onClick={() => setMode(id)}
          className={cn(
            'flex h-7 flex-1 items-center justify-center rounded-[5px] transition-all duration-150',
            mode === id
              ? 'bg-surface-elevated text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
