import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateOrder } from '@/features/orders/useOrders'
import { useCart, useClearCart } from '@/features/cart/useCart'
import { useAddresses } from '@/features/customer/useAddress'
import { useValidateCoupon } from '@/features/customer/useCoupon'
import { useMerchantShippingZones } from '@/features/customer/useShipping'
import type { CouponValidateResponse, UserAddress } from '@/types/api'
import { Check, Lock, Tag, X } from 'lucide-react'
import { useT } from '@/i18n/useT'

type PaymentMethod = 'vietqr' | 'card'

const VN_COUNTRY_NAMES = ['việt nam', 'viet nam', 'vietnam', 'vn']
function toCountryCode(country: string): string {
  const lower = country.trim().toLowerCase()
  if (VN_COUNTRY_NAMES.includes(lower)) return 'VN'
  if (lower.length === 2) return lower.toUpperCase()
  return country.trim().toUpperCase()
}

export function Checkout() {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()
  const clearCart = useClearCart()
  const { data: cartItems } = useCart()
  const { data: addresses = [] } = useAddresses()
  const { t, lang } = useT()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US'
  const validateCoupon = useValidateCoupon()
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vietqr')
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [couponResult, setCouponResult] = useState<CouponValidateResponse | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    country: 'Việt Nam',
    note: '',
  })

  const handleSelectAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id)
    setForm((f) => ({
      ...f,
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      country: addr.country,
    }))
  }

  const handleClearAddress = () => {
    setSelectedAddressId(null)
    setForm({ name: '', phone: '', address: '', city: '', country: 'Việt Nam', note: form.note })
  }

  useEffect(() => {
    const defaultAddr = addresses.find((a) => a.is_default)
    if (defaultAddr && selectedAddressId === null) {
      handleSelectAddress(defaultAddr)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses])

  const subtotal = (cartItems ?? []).reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0)
  const merchantId =
    (cartItems ?? []).find((it) => it.product?.merchant_id != null)?.product?.merchant_id ?? null
  const countryCode = toCountryCode(form.country)
  const { data: shippingZones = [], isLoading: zonesLoading } = useMerchantShippingZones(
    merchantId,
    countryCode,
  )
  const selectedZone = shippingZones.find((z) => z.id === selectedZoneId) ?? null
  const shippingFee = selectedZone ? selectedZone.base_rate : 0
  const discount = couponResult?.discount_amount ?? 0
  const total = Math.max(0, subtotal - discount) + shippingFee

  // Auto-select first zone when zones load or change
  useEffect(() => {
    if (shippingZones.length === 0) {
      if (selectedZoneId !== null) setSelectedZoneId(null)
      return
    }
    if (selectedZoneId === null || !shippingZones.some((z) => z.id === selectedZoneId)) {
      setSelectedZoneId(shippingZones[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingZones])

  const applyCoupon = (rawCode: string) => {
    const code = rawCode.trim().toUpperCase()
    if (!code) return
    setCouponError(null)
    validateCoupon.mutate(
      { code, orderTotal: subtotal },
      {
        onSuccess: (data) => {
          if (data.valid) {
            setAppliedCode(code)
            setCouponInput(code)
            setCouponResult(data)
            setCouponError(null)
          } else {
            setAppliedCode(null)
            setCouponResult(null)
            setCouponError(data.message)
          }
        },
        onError: () => {
          setAppliedCode(null)
          setCouponResult(null)
          setCouponError(t('checkout.couponErrFail'))
        },
      }
    )
  }

  const removeCoupon = () => {
    setAppliedCode(null)
    setCouponResult(null)
    setCouponError(null)
    setCouponInput('')
  }

  // Auto-apply coupon carried from Cart once cart items are loaded and subtotal is known
  useEffect(() => {
    const stored = sessionStorage.getItem('dhtc.checkout.coupon')
    if (stored && appliedCode === null && subtotal > 0 && cartItems && cartItems.length > 0) {
      applyCoupon(stored)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, cartItems])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const items = (cartItems ?? []).map((item) => ({ product_id: item.product_id, quantity: item.quantity }))
    if (items.length === 0) return
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) return
    createOrder.mutate(
      {
        shipping_address: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          country: form.country,
        },
        items,
        notes: form.note || undefined,
        payment_method: paymentMethod,
        shipping_zone_id: selectedZone?.id,
        shipping_method: selectedZone ? `zone:${selectedZone.zone_name}` : undefined,
        shipping_fee: shippingFee,
        promotion_code: appliedCode ?? undefined,
      },
      {
        onSuccess: (order) => {
          sessionStorage.removeItem('dhtc.checkout.coupon')
          clearCart.mutate()
          navigate(`/shop/tracking?order=${order.id}`)
        },
      }
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-medium tracking-tight text-ink mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        {t('checkout.title')}
      </h1>
      <p className="text-ink-mute text-sm mb-6">{t('checkout.steps')}</p>

      {/* Steps */}
      <div className="flex items-center gap-3.5 mb-6 text-xs text-ink-mute overflow-x-auto">
        <div className="flex items-center gap-1.5 text-green font-semibold">
          <div className="w-6 h-6 rounded-full bg-green flex items-center justify-center">
            <Check size={11} className="text-white" />
          </div>
          {t('checkout.step1')}
        </div>
        <div className="flex-1 h-px bg-green min-w-[20px]" />
        <div className="flex items-center gap-1.5 font-bold text-green">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
            style={{ background: 'var(--color-green)', color: 'var(--color-gold)' }}
          >
            2
          </div>
          {t('checkout.step2')}
        </div>
        <div className="flex-1 h-px bg-border min-w-[20px]" />
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-border text-ink-mute flex items-center justify-center text-[11px]">3</div>
          {t('checkout.step3')}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
          <div className="space-y-4">
            {/* Shipping address */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {t('checkout.addressTitle')}
              </h3>

              {/* Saved address picker */}
              {addresses.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10.5px] font-bold uppercase tracking-widest text-ink-mute mb-2">
                    {t('checkout.savedAddresses')}
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
                    {addresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectAddress(addr)}
                        className={`flex-shrink-0 w-48 text-left p-3 border-2 rounded-xl transition-all ${
                          selectedAddressId === addr.id
                            ? 'border-green bg-green/5'
                            : 'border-border hover:border-green/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-ink-mute truncate">
                            {addr.label || t('checkout.addressLabel').replace('{id}', String(addr.id))}
                          </span>
                          {addr.is_default && (
                            <span className="text-[9px] font-bold text-green bg-green/10 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                              {t('checkout.default')}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-ink truncate">{addr.name}</div>
                        <div className="text-[11px] text-ink-mute font-mono truncate">{addr.phone}</div>
                        <div className="text-[11px] text-ink-mute truncate">{addr.city}</div>
                        {selectedAddressId === addr.id && (
                          <div className="mt-1.5 text-[10px] font-bold text-green">{t('checkout.selected')}</div>
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleClearAddress}
                      className={`flex-shrink-0 w-40 text-left p-3 border-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${
                        selectedAddressId === null
                          ? 'border-green bg-green/5'
                          : 'border-dashed border-border hover:border-green/40'
                      }`}
                    >
                      <span className="text-xl text-ink-mute">+</span>
                      <span className="text-[11px] font-semibold text-ink-mute text-center">{t('checkout.newAddress')}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="p-4 border-2 border-green rounded-xl bg-green/5 flex gap-3">
                <div className="w-4 h-4 rounded-full border-[5px] border-green flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm text-ink">
                    {form.name} <span className="font-normal text-ink-mute">· {form.phone}</span>
                  </div>
                  <div className="text-sm text-ink-soft mt-1">{form.address}</div>
                  <div className="text-sm text-ink-soft">{form.city}, {form.country}</div>
                  <div className="text-xs font-semibold mt-1.5" style={{ color: 'var(--color-gold-deep)' }}>{t('checkout.defaultStar')}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('checkout.name')}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('checkout.phone')}</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('checkout.address')}</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('checkout.city')}</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('checkout.country')}</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Shipping method */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {t('checkout.shippingTitle')}
              </h3>
              {zonesLoading && (
                <div className="text-xs text-ink-mute italic">{t('checkout.shippingLoading')}</div>
              )}
              {!zonesLoading && shippingZones.length === 0 && (
                <div className="text-xs text-ink-mute italic">
                  {t('checkout.shippingNoneAvailable').replace('{country}', form.country || '—')}
                </div>
              )}
              {shippingZones.length > 0 && (
                <div className="space-y-2.5">
                  {shippingZones.map((zone) => (
                    <label
                      key={zone.id}
                      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                        selectedZoneId === zone.id
                          ? 'border-green bg-green/5'
                          : 'border-border hover:border-green/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        checked={selectedZoneId === zone.id}
                        onChange={() => setSelectedZoneId(zone.id)}
                        className="accent-green"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-ink">{zone.zone_name}</div>
                        <div className="text-xs text-ink-mute mt-0.5">
                          {t('checkout.shippingEta')
                            .replace('{min}', String(zone.estimated_days_min))
                            .replace('{max}', String(zone.estimated_days_max))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-base font-semibold text-green"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {zone.base_rate.toLocaleString(locale)}₫
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {t('checkout.paymentTitle')}
              </h3>
              <div className="space-y-2.5">
                <label
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    paymentMethod === 'vietqr' ? 'border-green bg-green/5' : 'border-border'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'vietqr'}
                    onChange={() => setPaymentMethod('vietqr')}
                    className="accent-green"
                  />
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'var(--color-green)', color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}
                  >
                    QR
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{t('checkout.paymentVietqrTitle')}</div>
                    <div className="text-xs text-ink-mute">{t('checkout.paymentVietqrDesc')}</div>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    paymentMethod === 'card' ? 'border-green bg-green/5' : 'border-border'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="accent-green"
                  />
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--color-ink), var(--color-ink-soft))' }}
                  >
                    VISA
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{t('checkout.paymentCardTitle')}</div>
                    <div className="text-xs text-ink-mute">{t('checkout.paymentCardDesc')}</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Note */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <label className="block font-semibold text-ink mb-2">{t('checkout.noteLabel')}</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
                placeholder={t('checkout.notePlaceholder')}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all resize-none"
              />
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="bg-white border border-border rounded-2xl p-5 lg:sticky lg:top-24">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {t('checkout.summaryTitle')}
              </h3>

              <div className="space-y-2 mb-4">
                {(cartItems ?? []).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-ink-soft flex-1 mr-2 truncate">
                      {item.product?.name_vi ?? `Product #${item.product_id}`} × {item.quantity}
                    </span>
                    <span className="font-mono font-semibold flex-shrink-0">
                      {((item.product?.price ?? 0) * item.quantity).toLocaleString(locale)}₫
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon input */}
              <div className="border-t border-dashed border-border pt-3 mb-3">
                <label className="block text-[10.5px] font-bold uppercase tracking-widest text-ink-mute mb-2">
                  {t('checkout.couponLabel')}
                </label>
                {appliedCode ? (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-green/5 border-2 border-green rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag size={14} className="text-green flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-green font-mono truncate">{appliedCode}</div>
                        {couponResult?.message && (
                          <div className="text-[11px] text-ink-mute truncate">{couponResult.message}</div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-ink-mute hover:text-ink flex-shrink-0"
                      aria-label={t('checkout.couponRemove')}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder={t('checkout.couponPlaceholder')}
                      className="flex-1 min-w-0 px-3 py-2 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => applyCoupon(couponInput)}
                      disabled={validateCoupon.isPending || !couponInput.trim()}
                      className="px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-green-soft transition-colors flex-shrink-0"
                    >
                      {validateCoupon.isPending ? t('checkout.couponChecking') : t('checkout.couponApply')}
                    </button>
                  </div>
                )}
                {couponError && (
                  <div className="mt-1.5 text-[11px] text-danger">{couponError}</div>
                )}
              </div>

              <div className="space-y-1.5 text-sm border-t border-dashed border-border pt-3">
                <div className="flex justify-between py-1">
                  <span className="text-ink-mute">{t('checkout.subtotal')}</span>
                  <span className="font-mono">{subtotal.toLocaleString(locale)}₫</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between py-1 text-green">
                    <span>
                      {t('checkout.discountLine').replace('{code}', appliedCode ?? '')}
                    </span>
                    <span className="font-mono font-semibold">−{discount.toLocaleString(locale)}₫</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-ink-mute">{t('checkout.shippingLine')}</span>
                  <span className="font-mono">{shippingFee.toLocaleString(locale)}₫</span>
                </div>
                <div className="flex justify-between py-3 border-t border-dashed border-border mt-1">
                  <span className="font-semibold text-green" style={{ fontFamily: 'var(--font-display)' }}>{t('checkout.total')}</span>
                  <span className="font-semibold text-green font-mono" style={{ fontFamily: 'var(--font-display)' }}>
                    {total.toLocaleString(locale)}₫
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={createOrder.isPending || zonesLoading || shippingZones.length === 0}
                className="w-full py-3.5 bg-green text-white rounded-xl font-semibold hover:bg-green-soft disabled:opacity-60 transition-colors mt-2"
              >
                {createOrder.isPending ? t('checkout.submitting') : t('checkout.submit')}
              </button>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-dashed border-border">
                <Lock size={15} className="text-green flex-shrink-0" />
                <span className="text-xs text-ink-mute">{t('checkout.secure')}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
