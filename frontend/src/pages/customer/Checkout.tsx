import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateOrder } from '@/features/orders/useOrders'
import { useCart, useClearCart } from '@/features/cart/useCart'
import { useAddresses } from '@/features/customer/useAddress'
import type { UserAddress } from '@/types/api'
import { Check, Lock } from 'lucide-react'

type ShippingMethod = 'dhl_express' | 'dhl_economy'
type PaymentMethod = 'vietqr' | 'card'

const SHIPPING_OPTIONS = [
  { id: 'dhl_express' as ShippingMethod, name: 'DHL Express Worldwide', desc: '4-7 ngày · Theo dõi real-time · Bảo hiểm', price: 135000, usd: '~$5.40' },
  { id: 'dhl_economy' as ShippingMethod, name: 'DHL eCommerce', desc: '7-12 ngày · Tiết kiệm hơn', price: 68000, usd: '~$2.72' },
]

export function Checkout() {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()
  const clearCart = useClearCart()
  const { data: cartItems } = useCart()
  const { data: addresses = [] } = useAddresses()
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('dhl_express')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vietqr')
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)

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

  const selectedShipping = SHIPPING_OPTIONS.find((s) => s.id === shippingMethod)!
  const subtotal = (cartItems ?? []).reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0)
  const total = subtotal + selectedShipping.price

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const items = (cartItems ?? []).map((item) => ({ product_id: item.product_id, quantity: item.quantity }))
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
      },
      {
        onSuccess: (order) => {
          clearCart.mutate()
          navigate(`/shop/tracking?order=${order.id}`)
        },
      }
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-medium tracking-tight text-ink mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        Thanh toán
      </h1>
      <p className="text-ink-mute text-sm mb-6">Bước 2 trong 3 · Địa chỉ và thanh toán</p>

      {/* Steps */}
      <div className="flex items-center gap-3.5 mb-6 text-xs text-ink-mute overflow-x-auto">
        <div className="flex items-center gap-1.5 text-green font-semibold">
          <div className="w-6 h-6 rounded-full bg-green flex items-center justify-center">
            <Check size={11} className="text-white" />
          </div>
          Giỏ hàng
        </div>
        <div className="flex-1 h-px bg-green min-w-[20px]" />
        <div className="flex items-center gap-1.5 font-bold text-green">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
            style={{ background: 'var(--color-green)', color: 'var(--color-gold)' }}
          >
            2
          </div>
          Thanh toán
        </div>
        <div className="flex-1 h-px bg-border min-w-[20px]" />
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-border text-ink-mute flex items-center justify-center text-[11px]">3</div>
          Hoàn tất
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
          <div className="space-y-4">
            {/* Shipping address */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Địa chỉ giao hàng
              </h3>

              {/* Saved address picker */}
              {addresses.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10.5px] font-bold uppercase tracking-widest text-ink-mute mb-2">
                    Địa chỉ đã lưu
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
                            {addr.label || `Địa chỉ ${addr.id}`}
                          </span>
                          {addr.is_default && (
                            <span className="text-[9px] font-bold text-green bg-green/10 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-ink truncate">{addr.name}</div>
                        <div className="text-[11px] text-ink-mute font-mono truncate">{addr.phone}</div>
                        <div className="text-[11px] text-ink-mute truncate">{addr.city}</div>
                        {selectedAddressId === addr.id && (
                          <div className="mt-1.5 text-[10px] font-bold text-green">Đã chọn ✓</div>
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
                      <span className="text-[11px] font-semibold text-ink-mute text-center">Nhập địa chỉ mới</span>
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
                  <div className="text-xs font-semibold mt-1.5" style={{ color: 'var(--color-gold-deep)' }}>★ Mặc định</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Họ tên</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Điện thoại</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-ink mb-1.5">Địa chỉ</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Thành phố</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Quốc gia</label>
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
                Phương thức vận chuyển
              </h3>
              <div className="space-y-2.5">
                {SHIPPING_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                      shippingMethod === option.id
                        ? 'border-green bg-green/5'
                        : 'border-border hover:border-green/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === option.id}
                      onChange={() => setShippingMethod(option.id)}
                      className="accent-green"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-ink">{option.name}</div>
                      <div className="text-xs text-ink-mute mt-0.5">{option.desc}</div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-base font-semibold text-green"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {option.price.toLocaleString('vi-VN')}₫
                      </div>
                      <div className="text-[10px] text-ink-mute font-mono">{option.usd}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Phương thức thanh toán
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
                    <div className="font-semibold text-sm">VietQR · Vietcombank</div>
                    <div className="text-xs text-ink-mute">Quét mã QR · Hỗ trợ 30 ngân hàng VN</div>
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
                    style={{ background: 'linear-gradient(135deg, #1a237e, #0d47a1)' }}
                  >
                    VISA
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Visa / Mastercard</div>
                    <div className="text-xs text-ink-mute">Thẻ quốc tế · Bảo mật 3D Secure</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Note */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <label className="block font-semibold text-ink mb-2">Ghi chú cho gian hàng</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
                placeholder="VD: Đóng gói quà tặng, để ý giờ giao..."
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all resize-none"
              />
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="bg-white border border-border rounded-2xl p-5 lg:sticky lg:top-24">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Tóm tắt đơn hàng
              </h3>

              <div className="space-y-2 mb-4">
                {(cartItems ?? []).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-ink-soft flex-1 mr-2 truncate">
                      {item.product?.name_vi ?? `Product #${item.product_id}`} × {item.quantity}
                    </span>
                    <span className="font-mono font-semibold flex-shrink-0">
                      {((item.product?.price ?? 0) * item.quantity).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 text-sm border-t border-dashed border-border pt-3">
                <div className="flex justify-between py-1">
                  <span className="text-ink-mute">Tạm tính</span>
                  <span className="font-mono">{subtotal.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-mute">Phí ship</span>
                  <span className="font-mono">{selectedShipping.price.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between py-3 border-t border-dashed border-border mt-1">
                  <span className="font-semibold text-green" style={{ fontFamily: 'var(--font-display)' }}>Tổng cộng</span>
                  <span className="font-semibold text-green font-mono" style={{ fontFamily: 'var(--font-display)' }}>
                    {total.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={createOrder.isPending}
                className="w-full py-3.5 bg-green text-white rounded-xl font-semibold hover:bg-green-soft disabled:opacity-60 transition-colors mt-2"
              >
                {createOrder.isPending ? 'Đang xử lý...' : 'Xác nhận & Thanh toán'}
              </button>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-dashed border-border">
                <Lock size={15} className="text-green flex-shrink-0" />
                <span className="text-xs text-ink-mute">Thanh toán an toàn · SSL · PCI DSS</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
