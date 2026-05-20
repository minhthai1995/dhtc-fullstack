import { cn } from '@/lib/cn'

type BadgeVariant =
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'verified'
  | 'pending'
  | 'cancelled'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'active'
  | 'suspended'
  | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green/10 text-green border-green/20',
  verified: 'bg-green/10 text-green border-green/20',
  active: 'bg-green/10 text-green border-green/20',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  suspended: 'bg-red-50 text-red-600 border-red-200',
  gold: 'bg-gold/15 text-gold-deep border-gold/30',
  silver: 'bg-gray-100 text-gray-600 border-gray-200',
  bronze: 'bg-orange-50 text-orange-700 border-orange-200',
  default: 'bg-cream-dark text-ink-soft border-border',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wide',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
