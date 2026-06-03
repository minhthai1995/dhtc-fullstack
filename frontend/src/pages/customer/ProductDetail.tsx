import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProduct, useMerchant, useReviews, useRelatedProducts, useCreateReview } from '@/features/products/useProducts'
import { useAddToCart } from '@/features/cart/useCart'
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/features/customer/useWishlist'
import { useCurrentUser } from '@/features/auth/useAuth'
import { Spinner } from '@/components/ui/Spinner'
import { RatingStars } from '@/components/ui/RatingStars'
import { Heart, Truck, CreditCard, RotateCcw, Minus, Plus, ShoppingCart, ChevronRight, Star, Package } from 'lucide-react'
import { addToRecentlyViewed } from '@/pages/customer/Shop'
import { useT } from '@/i18n/useT'

export function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const productId = parseInt(id ?? '0', 10)
  const { data: product, isLoading } = useProduct(productId)
  const { data: merchant } = useMerchant(product?.merchant_id ?? 0)
  const [reviewSort, setReviewSort] = useState<'newest' | 'rating_desc' | 'rating_asc'>('newest')
  const { data: reviews = [] } = useReviews(productId, reviewSort)
  const { data: relatedProducts } = useRelatedProducts(productId)
  const addToCart = useAddToCart()
  const { data: wishlist = [] } = useWishlist()
  const addToWishlist = useAddToWishlist()
  const removeFromWishlist = useRemoveFromWishlist()
  const isWishlisted = wishlist.some(w => w.product_id === productId)
  const { data: currentUser } = useCurrentUser()
  const createReview = useCreateReview(productId)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewDone, setReviewDone] = useState(false)
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const { t, lang } = useT()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US'
  const displayName = product ? (lang === 'en' && product.name_en ? product.name_en : product.name_vi) : ''
  const displayDescription = product ? (lang === 'en' && product.description_en ? product.description_en : (product.description_vi ?? '')) : ''

  useEffect(() => {
    if (product) addToRecentlyViewed(product)
  }, [product?.id])

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <div className="text-ink-mute text-sm">{t('product.notFound')}</div>
        <Link to="/shop" className="mt-4 text-sm text-green font-semibold hover:underline">
          {t('product.backToShop')}
        </Link>
      </div>
    )
  }

  const hasOcop = product.certifications?.some((c) => c.includes('OCOP'))
  const hasOrganic = product.certifications?.some((c) => c.toLowerCase().includes('organic'))

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-ink-mute mb-5">
        <Link to="/shop" className="hover:text-green transition-colors">{t('product.breadcrumbShop')}</Link>
        <ChevronRight size={10} />
        <span className="text-ink">{displayName}</span>
      </div>

      {/* Main product section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-9 mb-12">
        {/* Images */}
        <div>
          <div className="bg-white border border-border rounded-2xl overflow-hidden aspect-square flex items-center justify-center p-8 mb-3">
            {product.images?.[activeImage]?.url ? (
              <img
                src={product.images[activeImage].url}
                alt={displayName}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <Package size={64} className="text-ink-mute" />
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2.5">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`h-20 rounded-xl border-2 overflow-hidden bg-cream transition-all ${
                    i === activeImage ? 'border-green' : 'border-border hover:border-green/50'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          {/* Cert badges */}
          <div className="flex gap-2 mb-3">
            {hasOcop && (
              <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide bg-vermillion text-white">
                ★ OCOP 4★
              </span>
            )}
            {hasOrganic && (
              <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide bg-green" style={{ color: 'var(--color-gold)' }}>
                USDA ORGANIC
              </span>
            )}
          </div>

          <h1
            className="text-4xl font-medium leading-tight tracking-tight text-ink mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {displayName}
          </h1>

          {/* Merchant link */}
          <Link
            to={`/shop/merchants/${product.merchant_id}`}
            className="flex items-center gap-3 p-3 bg-cream rounded-xl mb-4 no-underline hover:bg-cream-dark transition-colors"
          >
            {merchant?.logo_url ? (
              <img
                src={merchant.logo_url}
                alt=""
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0"
                style={{ background: 'var(--color-green)', color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}
              >
                {((lang === 'en' && merchant?.business_name_en ? merchant.business_name_en : (merchant?.business_name ?? merchant?.shop_name)) || 'M').charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink">
                {(lang === 'en' && merchant?.business_name_en ? merchant.business_name_en : (merchant?.business_name ?? merchant?.shop_name)) || t('product.viewShopCta')}
              </div>
              <div className="text-xs text-ink-mute">{product.rating != null ? `${product.rating.toFixed(1)}★` : ''} · {product.origin}</div>
            </div>
            <span className="text-xs font-semibold text-green">{t('product.viewShopArrow')}</span>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-3.5 mb-5">
            {product.rating != null ? (
              <>
                <RatingStars rating={product.rating} size={16} />
                <div className="text-sm font-semibold text-ink">{product.rating.toFixed(1)}</div>
                <a href="#reviews" className="text-xs text-ink-mute underline">{t('product.reviewCount').replace('{count}', reviews.length.toLocaleString())}</a>
              </>
            ) : (
              <span className="text-xs text-ink-mute">{t('product.noReviews')}</span>
            )}
            <span className="text-border">·</span>
            <span className="text-xs text-ink-mute">{t('product.soldCount').replace('{count}', product.sold_count?.toLocaleString() ?? '0')}</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-4 py-5 border-y border-border mb-5">
            <div
              className="text-4xl font-semibold text-green tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {product.price.toLocaleString(locale)}₫
            </div>
            <div className="text-sm text-ink-mute font-mono">
              ≈ ${(product.price / 25000).toFixed(2)} USD
            </div>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed text-ink-soft mb-5">
            {displayDescription}
          </p>

          {/* Attributes */}
          <div className="flex flex-wrap gap-2 mb-5">
            {product.origin && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-cream rounded-lg text-xs font-medium">
                📍 {product.origin}
              </span>
            )}
            {product.certifications?.map((cert) => (
              <span key={cert} className="flex items-center gap-1.5 px-3 py-1.5 bg-cream rounded-lg text-xs font-medium">
                {cert}
              </span>
            ))}
          </div>

          {/* QTY + add to cart */}
          <div className="flex gap-3 mb-2">
            <div className="flex items-center border border-border rounded-xl bg-white">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-11 flex items-center justify-center text-green font-bold hover:bg-cream transition-colors rounded-l-xl"
              >
                <Minus size={15} />
              </button>
              <span className="px-4 text-base font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                disabled={product.stock === 0 || qty >= product.stock}
                className="w-10 h-11 flex items-center justify-center text-green font-bold hover:bg-cream transition-colors rounded-r-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={15} />
              </button>
            </div>
            {product.stock === 0 ? (
              <button
                disabled
                className="flex-1 py-3 bg-border text-ink-mute rounded-xl font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2"
              >
                {t('product.outOfStock')}
              </button>
            ) : (
              <button
                onClick={() => addToCart.mutate({ productId: product.id, quantity: qty })}
                disabled={addToCart.isPending}
                className="flex-1 py-3 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-soft disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={15} />
                {addToCart.isPending ? t('product.addingToCart') : t('product.addToCart')}
              </button>
            )}
            <button
              onClick={() => isWishlisted ? removeFromWishlist.mutate(productId) : addToWishlist.mutate(productId)}
              disabled={addToWishlist.isPending || removeFromWishlist.isPending}
              className={`p-3 border rounded-xl transition-colors ${
                isWishlisted
                  ? 'border-vermillion bg-vermillion/10 text-vermillion hover:bg-vermillion/20'
                  : 'border-border text-ink-mute hover:border-vermillion hover:text-vermillion'
              }`}
              title={isWishlisted ? t('product.wishlistRemove') : t('product.wishlistAdd')}
            >
              <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => {
                addToCart.mutate({ productId: product.id, quantity: qty }, {
                  onSuccess: () => navigate('/shop/checkout'),
                })
              }}
              disabled={addToCart.isPending || product.stock === 0}
              className="flex-1 py-3 border-2 border-green text-green rounded-xl font-semibold text-sm hover:bg-green/5 transition-colors flex items-center justify-center disabled:opacity-40"
            >
              {t('product.buyNow')}
            </button>
          </div>

          {/* Stock indicator */}
          <div className="mb-4 text-xs text-ink-mute">
            {product.stock === 0 ? (
              <span className="font-semibold text-danger">{t('product.stockSoldOut')}</span>
            ) : (
              <span>{t('product.stockRemaining')} <span className="font-semibold text-ink">{t('product.stockUnits').replace('{count}', String(product.stock))}</span></span>
            )}
          </div>

          {/* Shipping info */}
          <div className="p-4 border border-border rounded-xl bg-white space-y-2.5">
            <div className="flex items-center gap-3 text-[12.5px]">
              <Truck size={16} className="text-green flex-shrink-0" />
              <span><strong>{t('product.shipLine')}</strong> · {t('product.shipDuration')}</span>
            </div>
            <div className="flex items-center gap-3 text-[12.5px]">
              <CreditCard size={16} className="text-green flex-shrink-0" />
              <span><strong>{t('product.payLine')}</strong>{t('product.payDetail')}</span>
            </div>
            <div className="flex items-center gap-3 text-[12.5px]">
              <RotateCcw size={16} className="text-green flex-shrink-0" />
              <span><strong>{t('product.returnLine')}</strong> · {t('product.returnDetail')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description + Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {displayDescription && (
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>
                {t('product.descriptionTitle')}
              </h2>
              <div className="text-sm leading-relaxed text-ink-soft">
                <p>{displayDescription}</p>
              </div>
            </div>
          )}

          {/* Reviews */}
          <div id="reviews" className="bg-white border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>
                {t('product.reviewsTitle').replace('{count}', String(reviews.length))}
              </h2>
              {product.rating != null ? (
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-medium" style={{ fontFamily: 'var(--font-display)' }}>{product.rating.toFixed(1)}</div>
                  <div>
                    <RatingStars rating={product.rating} size={14} />
                    <div className="text-xs text-ink-mute mt-0.5">{t('product.reviewCount').replace('{count}', String(reviews.length))}</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-ink-mute">{t('product.noReviews')}</div>
              )}
            </div>
            {/* Sort tabs */}
            <div className="flex gap-2 mb-4">
              {(['newest', 'rating_desc', 'rating_asc'] as const).map((v) => {
                const label = v === 'newest' ? t('product.reviewSortNewest') : v === 'rating_desc' ? t('product.reviewSortHigh') : t('product.reviewSortLow')
                return (
                  <button
                    key={v}
                    onClick={() => setReviewSort(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      reviewSort === v
                        ? 'bg-green text-white'
                        : 'bg-white border border-border text-ink-soft hover:border-green hover:text-green'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Review submission form */}
            {(() => {
              if (!currentUser) return null
              const alreadyReviewed = reviewDone || reviews.some(r => Number(r.customer_id) === Number(currentUser.id))
              if (alreadyReviewed) {
                return (
                  <div className="mb-4 px-4 py-3 bg-cream rounded-xl text-xs text-ink-mute italic">
                    {t('product.reviewAlreadyLeft')}
                  </div>
                )
              }
              if (reviewDone) {
                return (
                  <div className="mb-4 px-4 py-3 bg-green/10 border border-green/20 rounded-xl text-xs font-semibold text-green">
                    {t('product.reviewSuccess')}
                  </div>
                )
              }
              return (
                <div className="mb-5 p-4 border border-border rounded-xl bg-cream/40">
                  <div className="text-sm font-semibold text-ink mb-3">{t('product.writeReview')}</div>
                  <div className="mb-3">
                    <div className="text-xs text-ink-mute mb-1.5">{t('product.reviewYourRating')}</div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setReviewHover(star)}
                          onMouseLeave={() => setReviewHover(0)}
                          className="p-0.5 transition-transform hover:scale-110"
                        >
                          <Star
                            size={22}
                            className={star <= (reviewHover || reviewRating) ? 'text-gold-deep' : 'text-border'}
                            fill={star <= (reviewHover || reviewRating) ? 'currentColor' : 'none'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-ink-mute mb-1.5">{t('product.reviewComment')}</div>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={t('product.reviewCommentPlaceholder')}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-green/30 placeholder:text-ink-mute/60"
                    />
                  </div>
                  {reviewError && (
                    <div className="mb-3 text-xs text-danger">{reviewError}</div>
                  )}
                  <button
                    disabled={reviewRating === 0 || createReview.isPending}
                    onClick={() => {
                      setReviewError(null)
                      createReview.mutate(
                        { rating: reviewRating, comment: reviewComment.trim() || undefined },
                        {
                          onSuccess: () => setReviewDone(true),
                          onError: (err: unknown) => {
                            setReviewDone(false)
                            const status = (err as { response?: { status?: number } })?.response?.status
                            if (status === 403) {
                              setReviewError(t('product.reviewNotPurchased'))
                            } else {
                              setReviewError(String(err))
                            }
                          },
                        },
                      )
                    }}
                    className="px-4 py-2 bg-green text-white text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-soft transition-colors"
                  >
                    {createReview.isPending ? t('product.reviewSubmitting') : t('product.reviewSubmit')}
                  </button>
                </div>
              )
            })()}

            {reviews.length === 0 ? (
              <div className="text-center text-ink-mute text-sm py-6">{t('product.noReviews')}</div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-cream rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm text-ink">{t('product.customerRef').replace('{id}', String(review.customer_id))}</span>
                      <div className="ml-auto"><RatingStars rating={review.rating} size={11} /></div>
                      <span className="text-xs text-ink-mute">{new Date(review.created_at).toLocaleDateString(locale)}</span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-ink-soft leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related products */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>
                {t('product.relatedTitle')}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedProducts.map((p) => {
                  const img = p.images?.[0]?.url
                  const pName = lang === 'en' && p.name_en ? p.name_en : p.name_vi
                  return (
                    <Link
                      key={p.id}
                      to={`/shop/product/${p.id}`}
                      className="group flex flex-col rounded-xl border border-border overflow-hidden hover:border-green hover:shadow-md transition-all no-underline"
                    >
                      <div className="h-28 bg-cream flex items-center justify-center overflow-hidden">
                        {img ? (
                          <img src={img} alt={pName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Package size={20} className="text-ink-mute" />
                        )}
                      </div>
                      <div className="p-2.5">
                        <div className="text-xs font-medium text-ink line-clamp-2 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                          {pName}
                        </div>
                        <div className="text-xs font-semibold text-green">{p.price.toLocaleString(locale)}₫</div>
                        {p.rating != null && (
                          <RatingStars rating={p.rating} size={10} className="mt-0.5" />
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: certifications + related products */}
        {product.certifications && product.certifications.length > 0 && (
          <div>
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {t('product.certsTitle')}
              </h3>
              <div className="space-y-2.5">
                {product.certifications.map((cert) => (
                  <div key={cert} className="flex items-center justify-between p-3 bg-cream rounded-xl">
                    <div>
                      <div className="font-semibold text-sm text-ink">{cert}</div>
                      <div className="text-xs text-ink-mute">{t('product.certValid')}</div>
                    </div>
                    <span className="text-[10px] font-bold text-green bg-green/10 px-2 py-0.5 rounded-full">
                      {t('product.certActiveBadge')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
