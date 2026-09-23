import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-muted-foreground border-transparent',
  accent: 'bg-primary-soft text-primary border-primary/15',
  success: 'bg-success/12 text-success border-success/20',
  warning: 'bg-warning/12 text-warning border-warning/20',
  danger: 'bg-danger/12 text-danger border-danger/20',
  info: 'bg-info/12 text-info border-info/20',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  interactive?: boolean
}

export function Badge({ tone = 'neutral', interactive, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 truncate rounded-[6px] border px-2 py-0.5 text-[11.5px] font-medium leading-4',
        tones[tone],
        interactive &&
          'cursor-pointer transition-colors duration-150 hover:bg-primary/20 hover:text-primary',
        className,
      )}
      {...props}
    />
  )
}
