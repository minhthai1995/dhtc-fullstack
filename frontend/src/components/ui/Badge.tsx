import { cn } from '@/lib/cn'

export type BadgeVariant =
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
  processing: 'bg-gold/10 text-gold-deep border-gold/20',
  shipped: 'bg-ink/10 text-ink-soft border-border',
  delivered: 'bg-green/10 text-green border-green/20',
  verified: 'bg-green/10 text-green border-green/20',
  active: 'bg-green/10 text-green border-green/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  cancelled: 'bg-danger/10 text-danger border-danger/20',
  suspended: 'bg-danger/10 text-danger border-danger/20',
  gold: 'bg-gold/15 text-gold-deep border-gold/30',
  silver: 'bg-cream-dark text-ink-mute border-border',
  bronze: 'bg-gold/8 text-gold-deep border-gold/15',
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
