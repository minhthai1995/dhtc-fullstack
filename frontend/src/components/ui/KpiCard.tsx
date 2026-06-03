import { cn } from '@/lib/cn'

interface KpiCardProps {
  label: string
  value: string | number
  delta?: string
  deltaType?: 'up' | 'down' | 'warn' | 'neutral'
  className?: string
}

export function KpiCard({ label, value, delta, deltaType = 'neutral', className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-border rounded-2xl p-5',
        className
      )}
    >
      <div className="text-xs font-semibold text-ink-mute uppercase tracking-wider mb-3">
        {label}
      </div>
      <div
        className="text-3xl font-medium text-ink leading-none mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </div>
      {delta && (
        <div
          className={cn(
            'text-xs font-medium',
            deltaType === 'up' && 'text-success',
            deltaType === 'down' && 'text-danger',
            deltaType === 'warn' && 'text-warning',
            deltaType === 'neutral' && 'text-ink-mute'
          )}
        >
          {deltaType === 'up' && '▲ '}
          {deltaType === 'down' && '▼ '}
          {deltaType === 'warn' && '⚠ '}
          {delta}
        </div>
      )}
    </div>
  )
}
