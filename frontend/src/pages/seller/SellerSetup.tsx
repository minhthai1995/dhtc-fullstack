import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetupMerchant } from '@/features/seller/useSeller'
import { Store } from 'lucide-react'
import { useT } from '@/i18n/useT'

export function SellerSetup() {
  const { t } = useT()
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
            {t('sellerSetup.title')}
          </h1>
          <p className="text-sm text-ink-mute">
            {t('sellerSetup.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                {t('sellerSetup.shopName')} <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.shop_name}
                onChange={(e) => handleChange('shop_name', e.target.value)}
                required
                placeholder={t('sellerSetup.shopNamePlaceholder')}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                {t('sellerSetup.businessName')} <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => handleChange('business_name', e.target.value)}
                required
                placeholder={t('sellerSetup.businessNamePlaceholder')}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              {t('sellerSetup.slug')} <span className="text-danger">*</span>
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
                placeholder={t('sellerSetup.slugPlaceholder')}
                className="flex-1 px-3 py-2.5 text-sm bg-cream focus:outline-none font-mono"
              />
            </div>
            <p className="text-xs text-ink-mute mt-1">{t('sellerSetup.slugHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerSetup.description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              placeholder={t('sellerSetup.descPlaceholder')}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerSetup.region')}</label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => handleChange('region', e.target.value)}
                placeholder={t('sellerSetup.regionPlaceholder')}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerSetup.phone')}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder={t('sellerSetup.phonePlaceholder')}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerSetup.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder={t('sellerSetup.emailPlaceholder')}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
            />
          </div>

          {setupMerchant.error && (
            <div className="p-3 bg-red-50 border border-red-200 text-danger text-sm rounded-xl">
              {t('sellerSetup.errorMsg')}
            </div>
          )}

          <button
            type="submit"
            disabled={setupMerchant.isPending}
            className="w-full py-3 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-soft disabled:opacity-60 transition-colors"
          >
            {setupMerchant.isPending ? t('sellerSetup.submitting') : t('sellerSetup.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
