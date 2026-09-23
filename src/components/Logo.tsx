import { cn } from '@/lib/utils'

/**
 * Prompt Stash brand mark — prompt chevron nested in a stash vault
 * illuminated by an ambient variable spark.
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
        <linearGradient id="psm-bg" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#181c2e" />
          <stop offset="100%" stopColor="#0a0c16" />
        </linearGradient>
        <linearGradient id="psm-chevron" x1="18" y1="20" x2="38" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="psm-tray" x1="34" y1="44" x2="48" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      {/* Squircle base */}
      <rect x="2" y="2" width="60" height="60" rx="15" fill="url(#psm-bg)" />
      <rect
        x="2.75"
        y="2.75"
        width="58.5"
        height="58.5"
        rx="14.25"
        stroke="#ffffff"
        strokeOpacity="0.12"
        strokeWidth="1.5"
      />

      {/* Stash stack plate */}
      <rect
        x="14"
        y="14"
        width="36"
        height="36"
        rx="8"
        fill="#ffffff"
        fillOpacity="0.03"
        stroke="#ffffff"
        strokeOpacity="0.05"
        strokeWidth="1"
      />

      {/* Ambient glow */}
      <circle cx="43" cy="21" r="7" fill="#38bdf8" fillOpacity="0.25" />

      {/* Prompt Chevron > */}
      <path
        d="M21 20L34 32L21 44"
        stroke="url(#psm-chevron)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Stash Cursor _ */}
      <path
        d="M37 44H47"
        stroke="url(#psm-tray)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Spark Star */}
      <path
        d="M43 14C43 19 45 21 50 21C45 21 43 23 43 28C43 23 41 21 36 21C41 21 43 19 43 14Z"
        fill="#38bdf8"
      />
      <circle cx="43" cy="21" r="1.5" fill="#ffffff" />
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
