import {
  Command,
  Copy,
  LayoutGrid,
  List,
  Play,
  Search,
  Star,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Static, clearly-stylized Prompt Stash UI fragments used as the About-page
 * hero and showcase visuals. These are illustrations built from the real
 * component language — not live data.
 */

export function MiniTag({ children, active }: { children: string; active?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[11px] font-medium',
        active ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-foreground',
      )}
    >
      <Tag className="h-3 w-3 opacity-70" aria-hidden="true" />
      {children}
    </span>
  )
}

export function HeroPromptCard({ className, delay }: { className?: string; delay?: string }) {
  return (
    <div
      className={cn(
        'reveal w-[300px] max-w-full rounded-lg border border-border bg-surface-elevated p-4 text-left shadow-pop',
        className,
      )}
      style={{ '--reveal-delay': delay } as React.CSSProperties}
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <MiniTag active>Marketing</MiniTag>
          <MiniTag>E-commerce</MiniTag>
        </div>
        <Star className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
      </div>
      <p className="mt-2.5 text-[14px] font-semibold text-foreground">Product Description Optimizer</p>
      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
        Enhance product descriptions for e-commerce platforms, focusing on key features and
        benefits.
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
        <span className="text-[11px] text-muted-foreground">Updated 3 days ago</span>
        <span className="flex gap-1 text-muted-foreground">
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}

export function HeroSearchBar({ className, delay }: { className?: string; delay?: string }) {
  return (
    <div
      className={cn(
        'reveal flex w-[320px] max-w-full items-center gap-2.5 rounded-md border border-border bg-input px-3 py-2.5 shadow-card',
        className,
      )}
      style={{ '--reveal-delay': delay } as React.CSSProperties}
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="flex-1 truncate text-[13px] text-muted-foreground/80">
        Search prompts, descriptions, tags…
      </span>
      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        ⌘K
      </kbd>
    </div>
  )
}

export function HeroCommandPalette({ className, delay }: { className?: string; delay?: string }) {
  const items = [
    { label: 'New Prompt', icon: <span className="text-primary">+</span>, active: true },
    { label: 'Agent System Prompt Architect', icon: <span aria-hidden="true">✦</span> },
    { label: 'Code Review Assistant', icon: <span aria-hidden="true">✦</span> },
    { label: 'Change accent color', icon: <span aria-hidden="true">◐</span> },
  ]
  return (
    <div
      className={cn(
        'reveal w-[320px] max-w-full overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-overlay',
        className,
      )}
      style={{ '--reveal-delay': delay } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
        <Command className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <span className="text-[12.5px] text-muted-foreground">Type a command or search…</span>
      </div>
      <div className="p-1.5">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12.5px]',
              item.active ? 'bg-primary-soft font-medium text-primary' : 'text-foreground/85',
            )}
          >
            <span className="w-3 text-center" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ViewToggleFragment() {
  return (
    <div className="inline-flex rounded-md border border-border bg-input p-0.5">
      <span className="flex h-7 w-8 items-center justify-center rounded-[5px] bg-surface-elevated text-foreground shadow-sm">
        <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="flex h-7 w-8 items-center justify-center rounded-[5px] text-muted-foreground">
        <List className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </div>
  )
}

export function TesterFragment({ className, delay }: { className?: string; delay?: string }) {
  return (
    <div
      className={cn(
        'reveal w-[340px] max-w-full rounded-lg border border-border bg-surface-elevated p-4 shadow-pop',
        className,
      )}
      style={{ '--reveal-delay': delay } as React.CSSProperties}
    >
      <p className="text-label uppercase text-muted-foreground">Test prompt</p>
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2">
          <code className="w-28 shrink-0 truncate rounded bg-primary-soft px-1.5 py-0.5 font-mono text-[10.5px] text-primary">
            {'{{product_name}}'}
          </code>
          <span className="flex-1 truncate rounded border border-border bg-input px-2 py-1 text-[11.5px] text-foreground">
            Wireless Headphones
          </span>
        </div>
      </div>
      <p className="mt-3 rounded-md border border-border bg-input p-2.5 font-mono text-[11px] leading-relaxed text-foreground/90">
        Write a product description for <span className="text-primary">Wireless Headphones</span>…
      </p>
      <div className="mt-3 flex justify-end gap-1.5">
        <span className="rounded-md bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          Reset
        </span>
        <span className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
          Copy Result
        </span>
      </div>
    </div>
  )
}
