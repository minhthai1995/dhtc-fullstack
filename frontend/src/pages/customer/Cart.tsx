import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart, useUpdateCartItem, useRemoveFromCart } from '@/features/cart/useCart'
import { useMerchants } from '@/features/products/useProducts'
import { useValidateCoupon } from '@/features/customer/useCoupon'
import type { CartItemRead, CouponValidateResponse } from '@/types/api'
import { Minus, Plus, Trash2, ShoppingBag, Lock } from 'lucide-react'
import { useT } from '@/i18n/useT'

const SUGGESTED_CODES = [
  { code: 'FRESH15', desc: '−15%' },
  { code: 'FREESHIP500', desc: 'free ship' },
  { code: 'COMBO18', desc: '−18%' },
]

export function Cart() {
  const { data: cart } = useCart()
  const { data: merchantList } = useMerchants()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveFromCart()
  const navigate = useNavigate()
  const { t } = useT()
  const [couponCode, setCouponCode] = useState('')
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [couponResult, setCouponResult] = useState<CouponValidateResponse | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const validateCoupon = useValidateCoupon()

  const items: CartItemRead[] = cart ?? []

  const subtotal = items.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0)
  const shipping = 135000
  const discount = couponResult?.discount_amount ?? 0
  const vat = Math.round((subtotal + shipping - discount) * 0.1)
  const total = subtotal + shipping - discount + vat

  // Group by merchant_id
  const byMerchant = items.reduce<Record<number, CartItemRead[]>>((acc, item) => {
    const mid = item.product?.merchant_id ?? 0
    if (!acc[mid]) acc[mid] = []
    acc[mid].push(item)
    return acc
  }, {})

  // Build merchant lookup from API data
  const merchantNames = useMemo<Record<number, string>>(() => {
    if (!merchantList) return {}
    return Object.fromEntries(
      merchantList.map((m) => [m.id, m.shop_name ?? m.business_name ?? `Merchant #${m.id}`])
    )
  }, [merchantList])

  const merchantTiers = useMemo<Record<number, string>>(() => {
    if (!merchantList) return {}
    return Object.fromEntries(merchantList.map((m) => [m.id, (m.tier ?? 'MERCHANT').toUpperCase()]))
  }, [merchantList])

  const merchantAvatars = useMemo<Record<number, string>>(() => {
    if (!merchantList) return {}
    return Object.fromEntries(
      merchantList.map((m) => {
        const name = m.shop_name ?? m.business_name ?? String(m.id)
        return [m.id, name.charAt(0).toUpperCase()]
      })
    )
  }, [merchantList])

  const applyCode = () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    setCouponError(null)
    validateCoupon.mutate(
      { code, orderTotal: subtotal },
      {
        onSuccess: (data) => {
          if (data.valid) {
            setAppliedCode(code)
            setCouponResult(data)
            setCouponError(null)
          } else {
            setCouponError(data.message)
          }
        },
        onError: () => {
          setCouponError(t('cart.couponErrFail'))
        },
      }
    )
  }

  const removeCode = () => {
    setAppliedCode(null)
    setCouponResult(null)
    setCouponError(null)
    setCouponCode('')
  }

  return (
    <div>
      <h1 className="text-3xl font-medium tracking-tight text-ink mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        {t('cart.title')}
      </h1>
      <p className="text-ink-mute text-sm mb-7">
        {t('cart.summary')
          .replace('{count}', String(items.length))
          .replace('{merchants}', String(Object.keys(byMerchant).length))}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* Cart items */}
        <div className="space-y-4">
          {Object.entries(byMerchant).map(([merchantIdStr, merchantItems]) => {
            const mid = parseInt(merchantIdStr)
            return (
              <div key={mid} className="bg-white border border-border rounded-2xl p-5">
                {/* Merchant header */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'var(--color-green)', color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}
                  >
                    {merchantAvatars[mid] ?? mid}
                  </div>
                  <span className="font-semibold text-sm text-ink">{merchantNames[mid] ?? `Merchant #${mid}`}</span>
                  <span
                    className="text-[9.5px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: merchantTiers[mid] === 'GOLD' ? 'var(--color-gold)' : '#E0E0E0',
                      color: merchantTiers[mid] === 'GOLD' ? 'var(--color-green)' : '#555',
                    }}
                  >
                    {merchantTiers[mid] ?? 'MERCHANT'}
                  </span>
                  <Link
                    to={`/shop/merchants/${mid}`}
                    className="ml-auto text-xs text-green font-semibold no-underline hover:underline"
                  >
                    {t('cart.viewShop')}
                  </Link>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  {merchantItems.map((item) => {
                    const img = item.product?.images?.find((img) => img.is_primary)?.url
                    return (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-cream flex-shrink-0 overflow-hidden">
                          {img ? (
                            <img src={img} alt={item.product?.name_vi} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🌿</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/shop/products/${item.product_id}`}
                            className="text-sm font-semibold text-ink no-underline hover:text-green transition-colors"
                          >
                            {item.product?.name_vi ?? `Product #${item.product_id}`}
                          </Link>
                          <div className="text-xs text-ink-mute mt-0.5">
                            {(item.product?.price ?? 0).toLocaleString('vi-VN')}₫ {t('cart.unitSuffix')}
                          </div>
                        </div>
                        {/* QTY */}
                        <div className="flex items-center border border-border rounded-lg bg-white">
                          <button
                            onClick={() => updateItem.mutate({ productId: item.product_id, quantity: Math.max(1, item.quantity - 1) })}
                            className="w-8 h-9 flex items-center justify-center text-green hover:bg-cream transition-colors rounded-l-lg"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => {
                              if (item.quantity < (item.product?.stock ?? 999)) {
                                updateItem.mutate({ productId: item.product_id, quantity: item.quantity + 1 })
                              }
                            }}
                            disabled={item.quantity >= (item.product?.stock ?? 999)}
                            className={`w-8 h-9 flex items-center justify-center text-green hover:bg-cream transition-colors rounded-r-lg${item.quantity >= (item.product?.stock ?? 999) ? ' opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        {/* Subtotal */}
                        <div className="text-sm font-semibold text-green font-mono min-w-[80px] text-right" style={{ fontFamily: 'var(--font-display)' }}>
                          {((item.product?.price ?? 0) * item.quantity).toLocaleString('vi-VN')}₫
                        </div>
                        {/* Remove */}
                        <button
                          onClick={() => removeItem.mutate(item.product_id)}
                          className="text-ink-mute hover:text-danger transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Coupon */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-ink mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              {t('cart.couponTitle')}
            </h3>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase())
                  setCouponError(null)
                }}
                placeholder={t('cart.couponPlaceholder')}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono uppercase"
                disabled={!!appliedCode}
              />
              {appliedCode ? (
                <button
                  onClick={removeCode}
                  className="px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-danger hover:border-danger transition-colors"
                >
                  {t('cart.couponRemove')}
                </button>
              ) : (
                <button
                  onClick={applyCode}
                  disabled={validateCoupon.isPending || !couponCode.trim()}
                  className="px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-ink-mute hover:border-green hover:text-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validateCoupon.isPending ? t('cart.couponChecking') : t('cart.couponApply')}
                </button>
              )}
            </div>
            {appliedCode && couponResult && (
              <div className="mt-2 text-xs text-green font-semibold">
                {couponResult.message}
              </div>
            )}
            {couponError && (
              <div className="mt-2 text-xs text-danger font-semibold">
                {couponError}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {SUGGESTED_CODES.map((sc) => (
                <button
                  key={sc.code}
                  onClick={() => {
                    if (!appliedCode) setCouponCode(sc.code)
                  }}
                  disabled={!!appliedCode}
                  className="px-2.5 py-1 bg-cream rounded-lg text-xs hover:bg-cream-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-mono font-bold">{sc.code}</span>
                  <span className="text-ink-mute ml-1">{sc.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div>
          <div className="bg-white border border-border rounded-2xl p-5 lg:sticky lg:top-24">
            <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              {t('cart.summaryTitle')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5">
                <span className="text-ink-mute">{t('cart.subtotal')}</span>
                <span className="font-mono font-semibold">{subtotal.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-ink-mute">{t('cart.shipping')}</span>
                <span className="font-mono font-semibold">{shipping.toLocaleString('vi-VN')}₫</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between py-1.5 text-green">
                  <span>{t('cart.couponLabel').replace('{code}', appliedCode ?? '')}</span>
                  <span className="font-mono font-semibold">−{discount.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-ink-mute">{t('cart.vat')}</span>
                <span className="font-mono font-semibold">{vat.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between py-4 border-t border-dashed border-border mt-2">
                <span className="text-lg font-semibold text-green" style={{ fontFamily: 'var(--font-display)' }}>{t('cart.total')}</span>
                <span className="text-lg font-semibold text-green font-mono" style={{ fontFamily: 'var(--font-display)' }}>
                  {total.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/shop/checkout')}
              className="w-full py-3.5 bg-green text-white rounded-xl font-semibold hover:bg-green-soft transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <ShoppingBag size={16} />
              {t('cart.checkout')}
            </button>

            <div className="mt-3 p-3 bg-cream rounded-xl text-xs text-ink-soft text-center leading-relaxed">
              {t('cart.payInfoL1')}<br />
              {t('cart.payInfoL2')}
            </div>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-dashed border-border">
              <Lock size={16} className="text-green flex-shrink-0" />
              <span className="text-xs text-ink-mute">{t('cart.secure')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
