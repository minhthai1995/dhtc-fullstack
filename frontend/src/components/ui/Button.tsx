import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

const variants = {
  primary:   'bg-green text-white hover:bg-green-soft focus-visible:ring-green',
  secondary: 'bg-white text-ink-soft border border-border hover:bg-cream focus-visible:ring-border',
  ghost:     'text-ink-soft hover:bg-cream focus-visible:ring-border',
  danger:    'bg-danger text-white hover:opacity-90 focus-visible:ring-danger',
} as const

const sizes = {
  sm: 'h-8  px-3 text-sm gap-1.5',
  md: 'h-9  px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={loading || disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
