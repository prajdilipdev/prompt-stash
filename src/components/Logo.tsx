import { cn } from '@/lib/utils'

/**
 * Prompt Stash brand mark — curly braces framing a spark,
 * a nod to the {{variable}} system at the product's core.
 */
export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={cn('shrink-0', className)}
      role="img"
      aria-label="Prompt Stash logo"
    >
      <defs>
        <linearGradient id="psm-tile" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#171b28" />
          <stop offset="1" stopColor="#0b0d15" />
        </linearGradient>
        <linearGradient id="psm-accent" x1="16" y1="14" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="hsl(var(--primary) / 0.95)" />
          <stop offset="1" stopColor="hsl(var(--primary) / 0.75)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#psm-tile)" />
      <rect
        x="2.75"
        y="2.75"
        width="58.5"
        height="58.5"
        rx="13.25"
        stroke="#ffffff"
        strokeOpacity="0.09"
        strokeWidth="1.5"
      />
      <path
        d="M24.5 15c-4.6 0-6.8 2.4-6.8 6.4 0 2.9.9 4.6 3.3 6.3 1.2.85 1.2 2.35 0 3.2-2.4 1.7-3.3 3.4-3.3 6.3 0 4 2.2 6.4 6.8 6.4"
        stroke="url(#psm-accent)"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M39.5 15c4.6 0 6.8 2.4 6.8 6.4 0 2.9-.9 4.6-3.3 6.3-1.2.85-1.2 2.35 0 3.2 2.4 1.7 3.3 3.4 3.3 6.3 0 4-2.2 6.4-6.8 6.4"
        stroke="url(#psm-accent)"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="3.4" fill="hsl(var(--primary))" />
    </svg>
  )
}

export function Logo({
  size = 28,
  wordmark = true,
  className,
}: {
  size?: number
  wordmark?: boolean
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {wordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Prompt Stash
        </span>
      )}
    </span>
  )
}
