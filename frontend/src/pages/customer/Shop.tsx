import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProducts, useCategories } from '@/features/products/useProducts'
import { useAddToCart } from '@/features/cart/useCart'
import { Search, ShoppingCart, Star } from 'lucide-react'
import type { ProductRead } from '@/types/api'

const RECENTLY_VIEWED_KEY = 'dhtc_rv'
const MAX_RV = 8

type RVItem = { id: number; name: string; price: number; image: string | null }

function getRV(): RVItem[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]')
  } catch {
    return []
  }
}

export function addToRecentlyViewed(product: ProductRead) {
  const items = getRV().filter((i) => i.id !== product.id)
  const primaryImage = product.images?.find((i) => i.is_primary)?.url ?? null
  items.unshift({ id: product.id, name: product.name_vi, price: product.price, image: primaryImage })
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items.slice(0, MAX_RV)))
}

function useRecentlyViewed() {
  const [items, setItems] = useState<RVItem[]>(getRV)
  useEffect(() => {
    const handler = () => setItems(getRV())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])
  return items
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'best_seller', label: 'Bán chạy' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
]

const CERTIFICATIONS = [
  { key: 'OCOP', label: 'OCOP', count: 128 },
  { key: 'VietGAP', label: 'VietGAP', count: 94 },
  { key: 'Organic', label: 'Hữu cơ', count: 76 },
  { key: 'HACCP', label: 'HACCP', count: 42 },
]

const REGIONS = [
  { key: 'tayNguyen', label: 'Tây Nguyên' },
  { key: 'dbscl', label: 'ĐBSCL' },
  { key: 'bacBo', label: 'Bắc Bộ' },
  { key: 'trungBo', label: 'Trung Bộ' },
]

const REGION_ORIGIN_MAP: Record<string, string> = {
  tayNguyen: 'Tây Nguyên',
  dbscl: 'ĐBSCL',
  bacBo: 'Bắc',
  trungBo: 'Trung',
}

function ProductCard({ product }: { product: ProductRead }) {
  const addToCart = useAddToCart()
  const primaryImage = product.images?.find((i) => i.is_primary)?.url
  const hasOcop = product.certifications?.some((c) => c.includes('OCOP'))
  const hasOrganic = product.certifications?.some((c) => c.toLowerCase().includes('organic'))

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden flex flex-col group hover:-translate-y-1 hover:border-green hover:shadow-lg transition-all duration-200">
      <Link to={`/shop/products/${product.id}`} className="block relative">
        <div className="h-48 bg-cream flex items-center justify-center overflow-hidden">
          {primaryImage ? (
            <img src={primaryImage} alt={product.name_vi} className="w-full h-full object-cover" />
          ) : (
            <div className="text-4xl">🌿</div>
          )}
        </div>
        {(hasOcop || hasOrganic) && (
          <div className="absolute top-2.5 left-2.5 flex gap-1">
            {hasOcop && (
              <span className="px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide bg-vermillion text-white">
                ★ OCOP
              </span>
            )}
            {hasOrganic && (
              <span className="px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide bg-green" style={{ color: 'var(--color-gold)' }}>
                ORGANIC
              </span>
            )}
          </div>
        )}
      </Link>

      <div className="p-3.5 flex flex-col flex-1">
        <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-gold-deep)' }}>
          {product.origin}
        </div>
        <Link to={`/shop/products/${product.id}`} className="no-underline">
          <h3
            className="text-sm font-medium leading-tight mb-1 text-ink group-hover:text-green transition-colors"
            style={{ fontFamily: 'var(--font-display)', minHeight: '36px' }}
          >
            {product.name_vi}
          </h3>
        </Link>
        <div className="flex items-center gap-1 text-[11.5px] mb-2" style={{ color: 'var(--color-gold-deep)' }}>
          <Star size={11} fill="currentColor" />
          <span className="font-semibold">{product.rating?.toFixed(1)}</span>
          <span className="text-ink-mute text-[10.5px] ml-1.5">{product.sold_count?.toLocaleString()} đã bán</span>
        </div>
        <div className="mt-auto">
          <div
            className="text-lg font-semibold text-green tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {product.price.toLocaleString('vi-VN')}₫
          </div>
          <div className="text-[10px] text-ink-mute font-mono mt-0.5">
            ≈ ${(product.price / 25000).toFixed(2)} USD
          </div>
        </div>
        <button
          onClick={() => addToCart.mutate({ productId: product.id, quantity: 1 })}
          disabled={addToCart.isPending}
          className="mt-2.5 w-full py-2 bg-cream border border-green text-green rounded-[9px] text-xs font-medium hover:bg-green hover:text-cream transition-all flex items-center justify-center gap-1.5"
        >
          <ShoppingCart size={12} />
          Thêm vào giỏ
        </button>
      </div>
    </div>
  )
}

const PAGE_SIZE = 12

export function Shop() {
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [selectedCerts, setSelectedCerts] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number | undefined>()
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [activeCategoryId])

  useEffect(() => {
    setPage(1)
  }, [sortBy, priceMin, priceMax, selectedCerts, minRating, selectedRegion])

  const { data: categories } = useCategories()
  const { data: products, isLoading } = useProducts({
    category_id: activeCategoryId,
    search: debouncedSearch || undefined,
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    sort_by: sortBy,
    min_price: priceMin ? Number(priceMin) : undefined,
    max_price: priceMax ? Number(priceMax) : undefined,
    min_rating: minRating,
    certification: selectedCerts[0],
    origin: selectedRegion ? REGION_ORIGIN_MAP[selectedRegion] : undefined,
  })
  const source = products ?? []
  const rv = useRecentlyViewed()

  const toggleCert = (cert: string) => {
    setSelectedCerts((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    )
  }

  return (
    <div>
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-3xl font-medium tracking-tight text-ink" style={{ fontFamily: 'var(--font-display)' }}>
          Tất cả sản phẩm
        </h1>
        <p className="text-ink-mute mt-1 text-sm">
          {isLoading ? 'Đang tải...' : `${source.length} sản phẩm trên trang này`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-7">
        {/* Filter sidebar */}
        <aside className="bg-white border border-border rounded-2xl p-5 h-fit lg:sticky lg:top-20">
          <h3 className="font-medium text-ink mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '16px' }}>
            Bộ lọc
          </h3>

          {/* Price */}
          <div className="py-3.5 border-t border-dashed border-border">
            <h4 className="text-[10.5px] font-bold uppercase tracking-widest text-ink-mute mb-2.5">
              Khoảng giá (₫)
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="0"
                className="flex-1 w-0 px-2.5 py-1.5 border border-border rounded-lg text-xs bg-cream focus:outline-none focus:border-green"
              />
              <span className="text-ink-mute">—</span>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="500K"
                className="flex-1 w-0 px-2.5 py-1.5 border border-border rounded-lg text-xs bg-cream focus:outline-none focus:border-green"
              />
            </div>
          </div>

          {/* Certifications */}
          <div className="py-3.5 border-t border-dashed border-border">
            <h4 className="text-[10.5px] font-bold uppercase tracking-widest text-ink-mute mb-2.5">Chứng nhận</h4>
            <ul className="space-y-0.5">
              {CERTIFICATIONS.map((cert) => (
                <li key={cert.key} className="flex items-center py-1.5 text-sm cursor-pointer" onClick={() => toggleCert(cert.key)}>
                  <input
                    type="checkbox"
                    checked={selectedCerts.includes(cert.key)}
                    onChange={() => toggleCert(cert.key)}
                    className="mr-2 accent-green"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {cert.label}
                  <span className="ml-auto text-[11px] text-ink-mute font-mono">{cert.count}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Regions */}
          <div className="py-3.5 border-t border-dashed border-border">
            <h4 className="text-[10.5px] font-bold uppercase tracking-widest text-ink-mute mb-2.5">Vùng miền</h4>
            <ul className="space-y-0.5">
              {REGIONS.map((r) => (
                <li
                  key={r.key}
                  className="flex items-center py-1.5 text-sm cursor-pointer"
                  onClick={() => setSelectedRegion(selectedRegion === r.key ? undefined : r.key)}
                >
                  <input
                    type="checkbox"
                    checked={selectedRegion === r.key}
                    onChange={() => setSelectedRegion(selectedRegion === r.key ? undefined : r.key)}
                    className="mr-2 accent-green"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {r.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Rating */}
          <div className="py-3.5 border-t border-dashed border-border">
            <h4 className="text-[10.5px] font-bold uppercase tracking-widest text-ink-mute mb-2.5">Đánh giá</h4>
            <ul className="space-y-0.5">
              {([5, 4, 3] as const).map((rating) => (
                <li
                  key={rating}
                  className="flex items-center py-1.5 text-sm cursor-pointer"
                  onClick={() => setMinRating(minRating === rating ? undefined : rating)}
                >
                  <input
                    type="checkbox"
                    checked={minRating === rating}
                    onChange={() => setMinRating(minRating === rating ? undefined : rating)}
                    className="mr-2 accent-green"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {'★'.repeat(rating)}{rating < 5 ? ' trở lên' : ''}
                </li>
              ))}
            </ul>
          </div>

          {/* Clear filters */}
          {(activeCategoryId !== undefined || debouncedSearch || priceMin || priceMax || selectedCerts.length > 0 || minRating !== undefined || selectedRegion !== undefined || sortBy !== 'newest') && (
            <div className="pt-3.5 border-t border-dashed border-border">
              <button
                onClick={() => {
                  setActiveCategoryId(undefined)
                  setSearch('')
                  setDebouncedSearch('')
                  setPriceMin('')
                  setPriceMax('')
                  setSelectedCerts([])
                  setMinRating(undefined)
                  setSelectedRegion(undefined)
                  setSortBy('newest')
                  setPage(1)
                }}
                className="w-full py-2 text-xs font-semibold text-danger border border-danger/30 rounded-xl hover:bg-danger/5 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </aside>

        {/* Product grid */}
        <div>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-border rounded-full px-3 py-2 min-w-[220px]">
              <Search size={14} className="text-ink-mute" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bánh dừa, cà phê, xoài sấy..."
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-mute">Hiển thị {source.length} sản phẩm</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border rounded-xl text-xs bg-white focus:outline-none focus:border-green"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategoryId(undefined)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategoryId === undefined
                  ? 'bg-green text-white'
                  : 'bg-white border border-border text-ink-soft hover:border-green hover:text-green'
              }`}
            >
              Tất cả
            </button>
            {(categories ?? []).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategoryId === cat.id
                    ? 'bg-green text-white'
                    : 'bg-white border border-border text-ink-soft hover:border-green hover:text-green'
                }`}
              >
                {cat.name_vi}
              </button>
            ))}
          </div>

          {source.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-16 text-center text-ink-mute">
              Không tìm thấy sản phẩm nào
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {source.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-ink-soft disabled:opacity-40 hover:border-green hover:text-green transition-colors disabled:cursor-not-allowed"
            >
              ← Trước
            </button>
            <span className="text-sm text-ink-mute">Trang {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(products ?? []).length < PAGE_SIZE}
              className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-ink-soft disabled:opacity-40 hover:border-green hover:text-green transition-colors disabled:cursor-not-allowed"
            >
              Tiếp →
            </button>
          </div>

          {/* Recently viewed */}
          {rv.length > 0 && !search && !activeCategoryId && (
            <div className="mt-12 pt-8 border-t border-border">
              <div className="text-[10.5px] font-bold uppercase tracking-widest text-ink-mute mb-4">Đã xem gần đây</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {rv.slice(0, 8).map((item) => (
                  <Link
                    key={item.id}
                    to={`/shop/products/${item.id}`}
                    className="bg-white border border-border rounded-xl p-3 flex items-center gap-3 hover:border-green hover:shadow-sm transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-cream flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🌿</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-ink truncate">{item.name}</div>
                      <div className="text-[11px] text-green font-mono mt-0.5">{item.price.toLocaleString('vi-VN')}₫</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
