import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  chevron?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, options, chevron = true, value, ...props },
  ref,
) {
  return (
    <div className={cn('relative inline-flex', className)}>
      <select
        ref={ref}
        value={value}
        className={cn(
          'h-9 w-full appearance-none rounded-md border border-border bg-input pl-3 pr-8 text-base sm:text-sm text-foreground',
          'transition-colors duration-150 focus:outline-none focus:border-ring/70 focus:ring-2 focus:ring-ring/30',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {chevron && (
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </div>
  )
})
