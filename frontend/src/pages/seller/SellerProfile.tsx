import { useState, useEffect, useRef } from 'react'
import {
  useSellerProfile,
  useUpdateSellerProfile,
  useUploadMerchantLogo,
  useUploadMerchantBanner,
  useDeleteMerchantLogo,
  useDeleteMerchantBanner,
} from '@/features/seller/useSeller'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Plus, X, Save, Upload, Trash2, ImageIcon } from 'lucide-react'
import { useT } from '@/i18n/useT'
import { useToast } from '@/components/ui/Toast'

const ENTITY_TYPES = ['cooperative', 'enterprise', 'household'] as const
type EntityType = (typeof ENTITY_TYPES)[number]

const ENTITY_TYPE_KEY: Record<EntityType, string> = {
  cooperative: 'sellerProfile.typeCoop',
  enterprise: 'sellerProfile.typeEnterprise',
  household: 'sellerProfile.typeHousehold',
}

export function SellerProfile() {
  const { t } = useT()
  const toast = useToast()
  const { data: profile, isLoading } = useSellerProfile()
  const updateProfile = useUpdateSellerProfile()
  const uploadLogo = useUploadMerchantLogo()
  const uploadBanner = useUploadMerchantBanner()
  const deleteLogo = useDeleteMerchantLogo()
  const deleteBanner = useDeleteMerchantBanner()

  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [logoProgress, setLogoProgress] = useState<number | null>(null)
  const [bannerProgress, setBannerProgress] = useState<number | null>(null)

  const handleLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoProgress(0)
    uploadLogo.mutate(
      { file, onProgress: (p) => setLogoProgress(p) },
      { onSettled: () => setLogoProgress(null) },
    )
    e.target.value = ''
  }

  const handleBannerPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerProgress(0)
    uploadBanner.mutate(
      { file, onProgress: (p) => setBannerProgress(p) },
      { onSettled: () => setBannerProgress(null) },
    )
    e.target.value = ''
  }

  const [form, setForm] = useState({
    shop_name: '',
    business_name: '',
    business_name_en: '',
    slug: '',
    description: '',
    description_en: '',
    entity_type: 'cooperative' as EntityType,
    tax_id: '',
    established_year: '',
    member_count: '',
    address: '',
    representative: '',
    cccd: '',
    email: '',
    phone: '',
    facebook: '',
    instagram: '',
    newCert: '',
    certifications: [] as string[],
  })

  useEffect(() => {
    if (profile) {
      const et = (profile.entity_type as EntityType | undefined) ?? 'cooperative'
      setForm({
        shop_name: profile.shop_name ?? '',
        business_name: profile.business_name ?? '',
        business_name_en: profile.business_name_en ?? '',
        slug: profile.slug ?? '',
        description: profile.description_vi ?? profile.description ?? '',
        description_en: profile.description_en ?? '',
        entity_type: ENTITY_TYPES.includes(et) ? et : 'cooperative',
        tax_id: profile.tax_id ?? '',
        established_year: profile.established_year != null ? String(profile.established_year) : '',
        member_count: profile.member_count != null ? String(profile.member_count) : '',
        address: profile.address ?? '',
        representative: profile.representative ?? '',
        cccd: profile.cccd ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        facebook: profile.facebook ?? '',
        instagram: profile.instagram ?? '',
        newCert: '',
        certifications: [...(profile.certifications ?? [])],
      })
    }
  }, [profile])
  const [saved, setSaved] = useState(false)

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addCert = () => {
    if (form.newCert.trim()) {
      setForm((prev) => ({
        ...prev,
        certifications: [...prev.certifications, prev.newCert.trim()],
        newCert: '',
      }))
    }
  }

  const removeCert = (index: number) => {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const yearNum = form.established_year ? parseInt(form.established_year, 10) : undefined
    const memberNum = form.member_count ? parseInt(form.member_count, 10) : undefined
    updateProfile.mutate(
      {
        shop_name: form.shop_name || undefined,
        business_name: form.business_name || undefined,
        business_name_en: form.business_name_en || undefined,
        slug: form.slug || undefined,
        description_vi: form.description || undefined,
        description_en: form.description_en || undefined,
        entity_type: form.entity_type,
        tax_id: form.tax_id || undefined,
        established_year: Number.isFinite(yearNum) ? yearNum : undefined,
        member_count: Number.isFinite(memberNum) ? memberNum : undefined,
        address: form.address || undefined,
        representative: form.representative || undefined,
        cccd: form.cccd || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        facebook: form.facebook || undefined,
        instagram: form.instagram || undefined,
        certifications: form.certifications.length > 0 ? form.certifications : undefined,
      },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 3000)
        },
        onError: () => toast(t('toasts.errorSaveProfile'), 'error'),
      }
    )
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  return (
    <div>
      <PageHeader
        title={t('sellerProfile.title')}
        subtitle={t('sellerProfile.subtitle')}
        actions={
          <button
            form="profile-form"
            type="submit"
            disabled={updateProfile.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold hover:bg-green-soft disabled:opacity-60 transition-colors"
          >
            <Save size={14} />
            {updateProfile.isPending ? t('sellerProfile.saving') : saved ? t('sellerProfile.saved') : t('sellerProfile.saveChanges')}
          </button>
        }
      />

      {saved && (
        <div className="mb-4 p-3 bg-green/10 border border-green/30 text-green text-sm rounded-xl font-medium">
          {t('sellerProfile.updateSuccess')}
        </div>
      )}

      <form id="profile-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Public info */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {t('sellerProfile.publicInfo')}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.shortNameVi')}</label>
                    <input
                      type="text"
                      value={form.shop_name}
                      onChange={(e) => handleChange('shop_name', e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.shortNameEn')}</label>
                    <input
                      type="text"
                      value={form.business_name_en}
                      onChange={(e) => handleChange('business_name_en', e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.slug')}</label>
                  <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden bg-cream">
                    <span className="px-3 py-2.5 text-sm text-ink-mute bg-cream-dark border-r border-border whitespace-nowrap">
                      dhtcdanang.com/store/
                    </span>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => handleChange('slug', e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm bg-cream focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.descVi')}</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.descEn')}</label>
                  <textarea
                    value={form.description_en}
                    onChange={(e) => handleChange('description_en', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Legal info */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {t('sellerProfile.legalInfo')}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.fullName')}</label>
                    <input
                      type="text"
                      value={form.business_name}
                      onChange={(e) => handleChange('business_name', e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.businessType')}</label>
                    <select
                      value={form.entity_type}
                      onChange={(e) => handleChange('entity_type', e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    >
                      {ENTITY_TYPES.map((et) => (
                        <option key={et} value={et}>{t(ENTITY_TYPE_KEY[et])}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.taxId')}</label>
                    <input
                      type="text"
                      value={form.tax_id}
                      onChange={(e) => handleChange('tax_id', e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.foundedYear')}</label>
                    <input
                      type="number"
                      min={1900}
                      max={2100}
                      step={1}
                      value={form.established_year}
                      onChange={(e) => handleChange('established_year', e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.memberCount')}</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={form.member_count}
                      onChange={(e) => handleChange('member_count', e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.hqAddress')}</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.representative')}</label>
                    <input
                      type="text"
                      value={form.representative}
                      onChange={(e) => handleChange('representative', e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.idNumber')}</label>
                    <input
                      type="text"
                      value={form.cccd}
                      onChange={(e) => handleChange('cccd', e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Brand assets */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {t('sellerProfile.brandAssets')}
              </h3>

              {/* Logo */}
              <div className="mb-5">
                <div className="aspect-square w-32 mx-auto rounded-xl border border-border bg-cream mb-3 flex items-center justify-center overflow-hidden">
                  {profile?.logo_url ? (
                    <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-ink-mute">
                      <ImageIcon size={28} />
                      <span className="text-[10px] mt-1">{t('sellerProfile.noLogo')}</span>
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-ink-mute text-center mb-2">{t('sellerProfile.logoHint')}</div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  onChange={handleLogoPick}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={uploadLogo.isPending}
                    onClick={() => logoInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-ink-mute border border-border rounded-xl hover:border-green hover:text-green disabled:opacity-50 transition-colors"
                  >
                    <Upload size={12} />
                    {logoProgress !== null
                      ? t('sellerProfile.uploading').replace('{percent}', String(logoProgress))
                      : t('sellerProfile.changeLogo')}
                  </button>
                  {profile?.logo_url && (
                    <button
                      type="button"
                      disabled={deleteLogo.isPending}
                      onClick={() => deleteLogo.mutate()}
                      aria-label={t('sellerProfile.removeLogo')}
                      className="px-2.5 py-2 text-xs font-semibold text-danger border border-border rounded-xl hover:border-danger disabled:opacity-50 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Banner */}
              <div>
                <div className="text-xs font-semibold text-ink mb-2">{t('sellerProfile.bannerLabel')}</div>
                <div className="aspect-[8/3] w-full rounded-xl border border-border bg-cream mb-3 flex items-center justify-center overflow-hidden">
                  {profile?.banner_url ? (
                    <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-ink-mute">
                      <ImageIcon size={28} />
                      <span className="text-[10px] mt-1">{t('sellerProfile.noBanner')}</span>
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-ink-mute text-center mb-2">{t('sellerProfile.bannerHint')}</div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  onChange={handleBannerPick}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={uploadBanner.isPending}
                    onClick={() => bannerInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-ink-mute border border-border rounded-xl hover:border-green hover:text-green disabled:opacity-50 transition-colors"
                  >
                    <Upload size={12} />
                    {bannerProgress !== null
                      ? t('sellerProfile.uploading').replace('{percent}', String(bannerProgress))
                      : t('sellerProfile.changeBanner')}
                  </button>
                  {profile?.banner_url && (
                    <button
                      type="button"
                      disabled={deleteBanner.isPending}
                      onClick={() => deleteBanner.mutate()}
                      aria-label={t('sellerProfile.removeBanner')}
                      className="px-2.5 py-2 text-xs font-semibold text-danger border border-border rounded-xl hover:border-danger disabled:opacity-50 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {t('sellerProfile.certifications')}
              </h3>
              <div className="space-y-2 mb-3">
                {form.certifications.map((cert, i) => (
                  <div key={cert} className="flex items-center justify-between p-2.5 bg-cream rounded-xl">
                    <div className="flex items-center gap-2">
                      <Badge variant="active">{t('sellerProfile.certActive')}</Badge>
                      <span className="text-sm font-semibold text-ink">{cert}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCert(i)}
                      className="text-ink-mute hover:text-danger transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.newCert}
                  onChange={(e) => handleChange('newCert', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCert())}
                  placeholder={t('sellerProfile.certPlaceholder')}
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-cream focus:outline-none focus:border-green transition-all"
                />
                <button
                  type="button"
                  onClick={addCert}
                  className="px-3 py-2 bg-green text-white rounded-lg hover:bg-green-soft transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Contact & Social */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {t('sellerProfile.contactSocial')}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.email')}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.phone')}</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.facebook')}</label>
                  <input
                    type="text"
                    value={form.facebook}
                    onChange={(e) => handleChange('facebook', e.target.value)}
                    placeholder="facebook.com/yourpage"
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProfile.instagram')}</label>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={(e) => handleChange('instagram', e.target.value)}
                    placeholder="@yourhandle"
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
