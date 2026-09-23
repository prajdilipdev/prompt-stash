import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const fieldClasses = cn(
  'w-full rounded-md border border-border bg-input px-3 text-base sm:text-sm text-foreground',
  'placeholder:text-muted-foreground/70',
  'transition-colors duration-150',
  'focus:outline-none focus:border-ring/70 focus:ring-2 focus:ring-ring/30',
  'disabled:cursor-not-allowed disabled:opacity-60',
)

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldClasses, 'h-9', invalid && 'border-danger/60 focus:border-danger/70 focus:ring-danger/25', className)}
      {...props}
    />
  )
})

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        fieldClasses,
        'min-h-[80px] resize-y py-2 leading-relaxed',
        invalid && 'border-danger/60 focus:border-danger/70 focus:ring-danger/25',
        className,
      )}
      {...props}
    />
  )
})

export function Label({
  className,
  children,
  htmlFor,
  required,
}: {
  className?: string
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('mb-1.5 block text-[13px] font-medium text-foreground/90', className)}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-danger" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
}

export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-danger">
      {children}
    </p>
  )
}
