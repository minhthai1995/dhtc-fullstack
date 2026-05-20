import { useState } from 'react'
import { usePromotions, useCreatePromotion, useDeletePromotion } from '@/features/seller/useSeller'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Plus, Trash2, Tag, X } from 'lucide-react'

export function SellerPromotions() {
  const { data: promotions } = usePromotions()
  const createPromotion = useCreatePromotion()
  const deletePromotion = useDeletePromotion()
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    min_order: '',
    max_usage: '',
    expires_at: '',
  })

  const source = promotions ?? []

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createPromotion.mutate(
      {
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        min_order: parseFloat(form.min_order) || 0,
        max_usage: form.max_usage ? parseInt(form.max_usage) : undefined,
        expires_at: form.expires_at || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false)
          setForm({ code: '', type: 'percentage', value: '', min_order: '', max_usage: '', expires_at: '' })
        },
      }
    )
  }

  return (
    <div>
      <PageHeader
        title="Khuyến mãi"
        subtitle={`${source.length} mã giảm giá · ${source.filter((p) => p.is_active).length} đang hoạt động`}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold hover:bg-green-soft transition-colors"
          >
            <Plus size={15} />
            Tạo mã khuyến mãi
          </button>
        }
      />

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
                Tạo mã khuyến mãi
              </h3>
              <button onClick={() => setShowForm(false)} className="text-ink-mute hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Mã giảm giá</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  required
                  placeholder="SUMMER20"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Loại</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percentage' | 'fixed' }))}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (₫)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">
                    Giá trị {form.type === 'percentage' ? '(%)' : '(₫)'}
                  </label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    required
                    min="0"
                    placeholder={form.type === 'percentage' ? '20' : '50000'}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Đơn hàng tối thiểu (₫)</label>
                  <input
                    type="number"
                    value={form.min_order}
                    onChange={(e) => setForm((f) => ({ ...f, min_order: e.target.value }))}
                    placeholder="500000"
                    min="0"
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Số lần dùng tối đa</label>
                  <input
                    type="number"
                    value={form.max_usage}
                    onChange={(e) => setForm((f) => ({ ...f, max_usage: e.target.value }))}
                    placeholder="Không giới hạn"
                    min="1"
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Ngày hết hạn</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createPromotion.isPending}
                  className="flex-1 py-2.5 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-soft disabled:opacity-60 transition-colors"
                >
                  {createPromotion.isPending ? 'Đang tạo...' : 'Tạo mã'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-border rounded-xl font-semibold text-sm text-ink-mute hover:border-ink transition-colors"
                >
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promo cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {source.map((promo) => (
          <div key={promo.id} className="bg-white border border-border rounded-2xl p-5 relative overflow-hidden">
            {/* Decorative stripe */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{ background: promo.is_active ? 'var(--color-green)' : 'var(--color-border)' }}
            />

            <div className="flex items-start justify-between mb-3 pt-1">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${promo.is_active ? 'bg-green/10' : 'bg-cream-dark'}`}>
                  <Tag size={15} className={promo.is_active ? 'text-green' : 'text-ink-mute'} />
                </div>
                <div>
                  <div className="font-bold text-sm font-mono tracking-wider text-ink">{promo.code}</div>
                  <Badge variant={promo.is_active ? 'active' : 'cancelled'} className="text-[9px]">
                    {promo.is_active ? 'Hoạt động' : 'Tắt'}
                  </Badge>
                </div>
              </div>
              <button
                onClick={() => deletePromotion.mutate(promo.id)}
                className="text-ink-mute hover:text-danger transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div
              className="text-2xl font-medium text-green mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {promo.type === 'percentage' ? `-${promo.value}%` : `-${promo.value.toLocaleString('vi-VN')}₫`}
            </div>

            <div className="space-y-1.5 text-xs text-ink-mute">
              {promo.min_order > 0 && (
                <div>Đơn tối thiểu: <span className="text-ink font-medium">{promo.min_order.toLocaleString('vi-VN')}₫</span></div>
              )}
              <div>
                Đã dùng: <span className="text-ink font-medium font-mono">{promo.usage_count}{promo.max_usage ? `/${promo.max_usage}` : ''}</span>
              </div>
              {promo.expires_at && (
                <div>
                  Hết hạn: <span className="text-ink font-medium">{new Date(promo.expires_at).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
            </div>

            {promo.max_usage && (
              <div className="mt-3">
                <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green rounded-full"
                    style={{ width: `${(promo.usage_count / promo.max_usage) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
