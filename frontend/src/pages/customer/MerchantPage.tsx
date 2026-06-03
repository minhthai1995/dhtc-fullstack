import { useParams, Link } from 'react-router-dom'
import { useMerchant, useMerchantProducts } from '@/features/products/useProducts'
import { useAddToCart } from '@/features/cart/useCart'
import { Spinner } from '@/components/ui/Spinner'
import { Star, ShoppingCart } from 'lucide-react'
import { useT } from '@/i18n/useT'

export function MerchantPage() {
  const { id } = useParams<{ id: string }>()
  const merchantId = parseInt(id ?? '0')
  const { data: merchant, isLoading } = useMerchant(merchantId)
  const { data: products } = useMerchantProducts(merchantId)
  const addToCart = useAddToCart()
  const { t, lang } = useT()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US'

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }

  if (!merchant) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <div className="text-ink-mute text-sm">{t('merchant.notFound')}</div>
        <Link to="/shop" className="mt-4 text-sm text-green font-semibold hover:underline">
          {t('merchant.backToShop')}
        </Link>
      </div>
    )
  }

  const productList = products ?? []
  const merchantDisplayName = lang === 'en' && merchant.business_name_en ? merchant.business_name_en : (merchant.business_name ?? merchant.shop_name ?? '')

  return (
    <div>
      {/* Merchant hero banner */}
      <div
        className="relative rounded-3xl overflow-hidden p-8 mb-8"
        style={{
          background: merchant.banner_url
            ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${merchant.banner_url}) center/cover`
            : 'linear-gradient(135deg, var(--color-green) 0%, var(--color-green-soft) 100%)',
          color: 'var(--color-cream)',
          minHeight: '240px',
        }}
      >
        {/* Decorative orb (only when no banner photo) */}
        {!merchant.banner_url && (
          <div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.2), transparent 70%)' }}
          />
        )}

        <div className="relative flex items-start gap-6 flex-wrap">
          {/* Avatar — real logo when available */}
          {merchant.logo_url ? (
            <img
              src={merchant.logo_url}
              alt={merchantDisplayName}
              className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border-2 border-white/20"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-4xl flex-shrink-0"
              style={{ background: 'var(--color-gold)', color: 'var(--color-green)', fontFamily: 'var(--font-display)' }}
            >
              {(merchantDisplayName || 'M').charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-[240px]">
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {merchant.tier === 'gold' && (
                <span className="px-2.5 py-1 rounded text-[10px] font-bold" style={{ background: 'rgba(201,169,97,0.25)', color: 'var(--color-gold)' }}>
                  {t('merchant.goldTier')}
                </span>
              )}
              {merchant.status === 'verified' && (
                <span className="px-2.5 py-1 rounded text-[10px] font-bold" style={{ background: 'rgba(245,239,224,0.2)', color: 'var(--color-cream)' }}>
                  {t('merchant.verified')}
                </span>
              )}
              {merchant.certifications?.slice(0, 2).map((cert) => (
                <span key={cert} className="px-2.5 py-1 rounded text-[10px] font-bold" style={{ background: 'rgba(245,239,224,0.15)', color: 'var(--color-cream)' }}>
                  {cert}
                </span>
              ))}
            </div>

            <h1
              className="text-4xl font-medium leading-tight tracking-tight mb-1.5"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cream)' }}
            >
              {merchantDisplayName}
            </h1>
            {merchant.region && (
              <div className="text-sm mb-3" style={{ color: 'rgba(245,239,224,0.8)' }}>
                {merchant.region}
              </div>
            )}
            {merchant.description && (
              <p className="text-sm leading-relaxed max-w-xl" style={{ color: 'rgba(245,239,224,0.85)' }}>
                {merchant.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="text-right flex-shrink-0">
            {merchant.rating != null && (
              <div>
                <span
                  className="text-2xl font-semibold"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
                >
                  {merchant.rating}★
                </span>
              </div>
            )}
            {merchant.total_sales && (
              <div className="text-xs mt-1.5" style={{ color: 'rgba(245,239,224,0.7)' }}>
                {t('merchant.ordersCompleted').replace('{count}', merchant.total_sales.toLocaleString())}
              </div>
            )}
            <button
              className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-gold)', color: 'var(--color-green)' }}
            >
              {t('merchant.followShop')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 mb-8">
        {merchant.region && (
          <div className="bg-white border border-border rounded-2xl p-4 text-center">
            <div className="text-2xl font-semibold text-green" style={{ fontFamily: 'var(--font-display)' }}>
              {merchant.region}
            </div>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--color-gold-deep)' }}>
              {t('merchant.statOrigin')}
            </div>
          </div>
        )}
        <div className="bg-white border border-border rounded-2xl p-4 text-center">
          <div className="text-2xl font-semibold text-green" style={{ fontFamily: 'var(--font-display)' }}>
            {t('merchant.skuCount').replace('{count}', String(productList.length))}
          </div>
          <div className="text-[10.5px] font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--color-gold-deep)' }}>
            {t('merchant.statProducts')}
          </div>
        </div>
        {merchant.total_sales != null && (
          <div className="bg-white border border-border rounded-2xl p-4 text-center">
            <div className="text-2xl font-semibold text-green" style={{ fontFamily: 'var(--font-display)' }}>
              {merchant.total_sales.toLocaleString()}
            </div>
            <div className="text-[10.5px] font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--color-gold-deep)' }}>
              {t('merchant.statOrders')}
            </div>
          </div>
        )}
      </div>

      {/* Products */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-3xl font-medium tracking-tight text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            {t('merchant.productsTitle')}
          </h2>
          <Link to="/shop" className="text-sm text-green font-semibold hover:underline no-underline">
            {t('merchant.viewAll')}
          </Link>
        </div>

        {productList.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-12 text-center text-ink-mute text-sm">
            {t('merchant.noProducts')}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productList.map((product) => {
              const primaryImage = product.images?.find((img) => img.is_primary)?.url
              const pName = lang === 'en' && product.name_en ? product.name_en : product.name_vi
              return (
                <div
                  key={product.id}
                  className="bg-white border border-border rounded-2xl overflow-hidden flex flex-col group hover:-translate-y-1 hover:border-green hover:shadow-lg transition-all duration-200"
                >
                  <Link to={`/shop/products/${product.id}`} className="block h-44 bg-cream flex items-center justify-center overflow-hidden">
                    {primaryImage ? (
                      <img src={primaryImage} alt={pName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-4xl">🌿</div>
                    )}
                  </Link>
                  <div className="p-3.5 flex flex-col flex-1">
                    <Link to={`/shop/products/${product.id}`} className="no-underline">
                      <h3
                        className="text-sm font-medium text-ink mb-1 group-hover:text-green transition-colors"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {pName}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-ink-mute mb-2">
                      {product.rating != null && (
                        <>
                          <Star size={10} className="text-gold fill-gold" />
                          <span>{product.rating.toFixed(1)}</span>
                          <span>·</span>
                        </>
                      )}
                      <span>{t('shop.soldCount').replace('{count}', product.sold_count?.toLocaleString() ?? '0')}</span>
                    </div>
                    <div
                      className="mt-auto text-base font-semibold text-green"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {product.price.toLocaleString(locale)}₫
                    </div>
                    <button
                      onClick={() => addToCart.mutate({ productId: product.id, quantity: 1 })}
                      disabled={addToCart.isPending}
                      className="mt-2 w-full py-2 bg-cream border border-green text-green rounded-lg text-xs font-medium hover:bg-green hover:text-cream transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <ShoppingCart size={11} />
                      {t('merchant.addToCart')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
