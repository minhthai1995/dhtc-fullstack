import { cn } from '@/lib/cn'
import { Star } from 'lucide-react'
import { productImageSrc, type ProductRead } from '@/types/api'

interface ProductCardProps {
  product: ProductRead
  onClick?: () => void
  className?: string
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `₫${(price / 1_000_000).toFixed(1)}M`
  }
  return `₫${price.toLocaleString('vi-VN')}`
}

export function ProductCard({ product, onClick, className }: ProductCardProps) {
  const primary = product.images?.find((i) => i.is_primary) ?? product.images?.[0]
  const image = productImageSrc(primary, 'medium')

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer',
        'hover:-translate-y-1 hover:shadow-[0_14px_36px_-10px_rgba(27,59,47,0.16)] hover:border-green',
        className
      )}
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-cream relative">
        {image ? (
          <img
            src={image}
            alt={product.name_vi}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-cream-dark flex items-center justify-center">
              <span className="text-3xl">📦</span>
            </div>
          </div>
        )}
        {product.certifications && product.certifications.length > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-gold text-green-deep text-[10px] font-bold px-2 py-0.5 rounded-full">
            {product.certifications[0]}
          </div>
        )}
        {product.status === 'pending' && (
          <div className="absolute top-2.5 right-2.5 bg-warning text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Chờ duyệt
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {product.origin && (
          <div className="text-[10px] text-ink-mute uppercase tracking-widest font-semibold mb-1.5">
            {product.origin}
          </div>
        )}
        <div className="flex items-start justify-between gap-1 mb-2">
          <div className="font-semibold text-sm text-ink leading-snug line-clamp-2 flex-1">
            {product.name_vi}
          </div>
          {product.stock === 0 && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-danger/10 text-danger flex-shrink-0">
              Hết hàng
            </span>
          )}
          {product.stock > 0 && product.stock <= 10 && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning flex-shrink-0">
              Còn {product.stock}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className="text-xl font-medium text-green"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Rating & sold */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={10}
                className={star <= 4 ? 'text-gold fill-gold' : 'text-border'}
              />
            ))}
          </div>
          <span className="text-[11px] text-ink-mute">({product.sold_count} đã bán)</span>
        </div>

        {/* Cert badges */}
        {product.certifications && product.certifications.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-2">
            {product.certifications.slice(0, 3).map((cert) => (
              <span
                key={cert}
                className="text-[10px] font-bold text-success bg-green/10 px-2 py-0.5 rounded-full"
              >
                {cert}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
