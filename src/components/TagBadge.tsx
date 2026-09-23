import { Tag } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface TagBadgeProps {
  name: string
  onClick?: () => void
  active?: boolean
  className?: string
}

export function TagBadge({ name, onClick, active, className }: TagBadgeProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        className={cn(
          'inline-flex max-w-full items-center gap-1 rounded-[6px] border px-2 py-0.5 text-[11.5px] font-medium leading-4 transition-colors duration-150',
          active
            ? 'border-primary/30 bg-primary-soft text-primary'
            : 'border-transparent bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary',
          className,
        )}
      >
        {name}
      </button>
    )
  }
  return (
    <Badge className={className}>
      <Tag className="h-3 w-3 opacity-70" aria-hidden="true" />
      {name}
    </Badge>
  )
}
