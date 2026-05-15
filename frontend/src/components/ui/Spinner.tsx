import { cn } from '@/lib/cn'

const sizes = { sm: 'size-4', md: 'size-8', lg: 'size-12' } as const

interface SpinnerProps {
  className?: string
  size?: keyof typeof sizes
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'block animate-spin rounded-full border-2 border-gray-200 border-t-brand',
        sizes[size],
        className,
      )}
    />
  )
}
