import { useState } from 'react'
import { usePromotions, useCreatePromotion, useDeletePromotion, useUpdatePromotion } from '@/features/seller/useSeller'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Plus, Trash2, Tag, X, Pause, Play } from 'lucide-react'
import { useT } from '@/i18n/useT'

export function SellerPromotions() {
  const { t, lang } = useT()
  const { data: promotions } = usePromotions()
  const createPromotion = useCreatePromotion()
  const updatePromotion = useUpdatePromotion()
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
    const numValue = parseFloat(form.value)
    if (!form.code.trim() || isNaN(numValue) || numValue <= 0) return
    const minOrder = parseFloat(form.min_order)
    const maxUsage = form.max_usage ? parseInt(form.max_usage, 10) : undefined
    if (isNaN(minOrder) && form.min_order !== '') return
    createPromotion.mutate(
      {
        code: form.code.toUpperCase(),
        type: form.type,
        value: numValue,
        min_order: form.min_order ? minOrder : 0,
        max_usage: maxUsage,
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
        title={t('sellerPromotions.title')}
        subtitle={t('sellerPromotions.subtitle')
          .replace('{total}', String(source.length))
          .replace('{active}', String(source.filter((p) => p.is_active).length))}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold hover:bg-green-soft transition-colors"
          >
            <Plus size={15} />
            {t('sellerPromotions.createBtn')}
          </button>
        }
      />

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
                {t('sellerPromotions.modalTitle')}
              </h3>
              <button onClick={() => { setShowForm(false); setForm({ code: '', type: 'percentage', value: '', min_order: '', max_usage: '', expires_at: '' }) }} className="text-ink-mute hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerPromotions.codeLabel')}</label>
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
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerPromotions.typeLabel')}</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percentage' | 'fixed' }))}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  >
                    <option value="percentage">{t('sellerPromotions.typePercentage')}</option>
                    <option value="fixed">{t('sellerPromotions.typeFixed')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">
                    {form.type === 'percentage' ? t('sellerPromotions.valueLabelPct') : t('sellerPromotions.valueLabelVnd')}
                  </label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    required
                    min="0"
                    step={form.type === 'fixed' ? 1 : 0.01}
                    placeholder={form.type === 'percentage' ? '20' : '50000'}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerPromotions.minOrderLabel')}</label>
                  <input
                    type="number"
                    value={form.min_order}
                    onChange={(e) => setForm((f) => ({ ...f, min_order: e.target.value }))}
                    placeholder="500000"
                    min="0"
                    step={1}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerPromotions.maxUsageLabel')}</label>
                  <input
                    type="number"
                    value={form.max_usage}
                    onChange={(e) => setForm((f) => ({ ...f, max_usage: e.target.value }))}
                    placeholder={t('sellerPromotions.maxUsagePlaceholder')}
                    min="1"
                    step="1"
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerPromotions.expiresLabel')}</label>
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
                  {createPromotion.isPending ? t('sellerPromotions.creating') : t('sellerPromotions.createPromo')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm({ code: '', type: 'percentage', value: '', min_order: '', max_usage: '', expires_at: '' }) }}
                  className="flex-1 py-2.5 border border-border rounded-xl font-semibold text-sm text-ink-mute hover:border-ink transition-colors"
                >
                  {t('sellerPromotions.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promo cards */}
      {source.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-ink-mute text-sm">
          {t('sellerPromotions.empty')}
        </div>
      ) : (
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
                    {promo.is_active ? t('sellerPromotions.statusActive') : t('sellerPromotions.statusInactive')}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updatePromotion.mutate({ id: promo.id, payload: { is_active: !promo.is_active } })}
                  disabled={updatePromotion.isPending}
                  title={promo.is_active ? t('sellerPromotions.deactivate') : t('sellerPromotions.activate')}
                  className="text-ink-mute hover:text-green transition-colors disabled:opacity-50"
                >
                  {promo.is_active ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  onClick={() => deletePromotion.mutate(promo.id)}
                  disabled={deletePromotion.isPending}
                  className="text-ink-mute hover:text-danger transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div
              className="text-2xl font-medium text-green mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {promo.type === 'percentage' ? `-${promo.value}%` : `-${promo.value.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}₫`}
            </div>

            <div className="space-y-1.5 text-xs text-ink-mute">
              {promo.min_order > 0 && (
                <div>{t('sellerPromotions.minOrderShow')} <span className="text-ink font-medium">{promo.min_order.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}₫</span></div>
              )}
              <div>
                {t('sellerPromotions.usedLabel')} <span className="text-ink font-medium font-mono">{promo.usage_count}{promo.max_usage ? `/${promo.max_usage}` : ''}</span>
              </div>
              {promo.expires_at && (
                <div>
                  {t('sellerPromotions.expiresShow')} <span className="text-ink font-medium">{new Date(promo.expires_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</span>
                </div>
              )}
            </div>

            {promo.max_usage != null && promo.max_usage > 0 && (
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
      )}
    </div>
  )
}
