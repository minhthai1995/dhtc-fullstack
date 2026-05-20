import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetupMerchant } from '@/features/seller/useSeller'
import { Store } from 'lucide-react'

export function SellerSetup() {
  const navigate = useNavigate()
  const setupMerchant = useSetupMerchant()

  const [form, setForm] = useState({
    shop_name: '',
    business_name: '',
    slug: '',
    description: '',
    region: '',
    phone: '',
    email: '',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setupMerchant.mutate(
      {
        shop_name: form.shop_name,
        business_name: form.business_name,
        slug: form.slug,
        description: form.description || undefined,
        region: form.region || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
      },
      {
        onSuccess: () => navigate('/seller/dashboard', { replace: true }),
      }
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-green/10 flex items-center justify-center mx-auto mb-4">
            <Store size={28} className="text-green" />
          </div>
          <h1
            className="text-2xl font-semibold text-ink mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Thiết lập gian hàng
          </h1>
          <p className="text-sm text-ink-mute">
            Điền thông tin để kích hoạt gian hàng của bạn trên DHTC
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                Tên gian hàng <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.shop_name}
                onChange={(e) => handleChange('shop_name', e.target.value)}
                required
                placeholder="HTX Cà Phê Đắk Lắk"
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                Tên doanh nghiệp <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => handleChange('business_name', e.target.value)}
                required
                placeholder="HTX Sản Xuất Cà Phê Hữu Cơ"
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              URL slug <span className="text-danger">*</span>
            </label>
            <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden bg-cream">
              <span className="px-3 py-2.5 text-sm text-ink-mute bg-cream-dark border-r border-border whitespace-nowrap">
                dhtc.vn/store/
              </span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                required
                placeholder="htx-ca-phe-dak-lak"
                className="flex-1 px-3 py-2.5 text-sm bg-cream focus:outline-none font-mono"
              />
            </div>
            <p className="text-xs text-ink-mute mt-1">Chỉ dùng chữ thường, số và dấu gạch ngang</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Mô tả gian hàng</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              placeholder="Giới thiệu ngắn về sản phẩm và gian hàng của bạn..."
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Khu vực</label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => handleChange('region', e.target.value)}
                placeholder="Đắk Lắk, Tây Nguyên..."
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Số điện thoại</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="0901 234 567"
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Email liên hệ</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contact@yourstore.vn"
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
            />
          </div>

          {setupMerchant.error && (
            <div className="p-3 bg-red-50 border border-red-200 text-danger text-sm rounded-xl">
              Không thể tạo gian hàng. Vui lòng thử lại.
            </div>
          )}

          <button
            type="submit"
            disabled={setupMerchant.isPending}
            className="w-full py-3 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-soft disabled:opacity-60 transition-colors"
          >
            {setupMerchant.isPending ? 'Đang thiết lập...' : 'Tạo gian hàng'}
          </button>
        </form>
      </div>
    </div>
  )
}
