import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

interface RatingStarsProps {
  rating: number | null | undefined
  size?: number
  className?: string
}

export function RatingStars({ rating, size = 12, className }: RatingStarsProps) {
  const filled = rating == null ? 0 : Math.round(rating)
  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={rating == null ? 'unrated' : `rated ${rating} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= filled ? 'text-gold fill-gold' : 'text-border'}
        />
      ))}
    </div>
  )
}
