import { useState, useEffect } from 'react'
import { useSellerProfile, useUpdateSellerProfile } from '@/features/seller/useSeller'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Plus, X, Save } from 'lucide-react'

export function SellerProfile() {
  const { data: profile, isLoading } = useSellerProfile()
  const updateProfile = useUpdateSellerProfile()

  const [form, setForm] = useState({
    business_name: '',
    business_name_en: '',
    slug: '',
    description: '',
    description_en: '',
    tax_id: '',
    address: '',
    email: '',
    phone: '',
    facebook: '',
    instagram: '',
    newCert: '',
    certifications: [] as string[],
  })

  useEffect(() => {
    if (profile) {
      setForm({
        business_name: profile.business_name ?? '',
        business_name_en: profile.business_name_en ?? '',
        slug: profile.slug ?? '',
        description: profile.description ?? '',
        description_en: profile.description_en ?? '',
        tax_id: profile.tax_id ?? '',
        address: profile.address ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        facebook: '',
        instagram: '',
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
    updateProfile.mutate(
      {
        business_name: form.business_name,
        business_name_en: form.business_name_en || undefined,
        description: form.description || undefined,
        description_en: form.description_en || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        certifications: form.certifications.length > 0 ? form.certifications : undefined,
      },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 3000)
        },
      }
    )
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  return (
    <div>
      <PageHeader
        title="Hồ sơ gian hàng"
        subtitle="Đắk Lắk Coffee Co-op · Khách quốc tế thấy trang này khi click vào tên gian hàng"
        actions={
          <button
            form="profile-form"
            type="submit"
            disabled={updateProfile.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold hover:bg-green-soft disabled:opacity-60 transition-colors"
          >
            <Save size={14} />
            {updateProfile.isPending ? 'Đang lưu...' : saved ? 'Đã lưu!' : 'Lưu thay đổi'}
          </button>
        }
      />

      {saved && (
        <div className="mb-4 p-3 bg-green/10 border border-green/30 text-green text-sm rounded-xl font-medium">
          Cập nhật hồ sơ thành công!
        </div>
      )}

      <form id="profile-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Public info */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Thông tin công khai
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">Tên ngắn (Tiếng Việt)</label>
                    <input
                      type="text"
                      value={form.business_name}
                      onChange={(e) => handleChange('business_name', e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">Tên ngắn (English)</label>
                    <input
                      type="text"
                      value={form.business_name_en}
                      onChange={(e) => handleChange('business_name_en', e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">URL slug</label>
                  <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden bg-cream">
                    <span className="px-3 py-2.5 text-sm text-ink-mute bg-cream-dark border-r border-border whitespace-nowrap">
                      dhtc.vn/store/
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
                  <label className="block text-sm font-semibold text-ink mb-1.5">Mô tả gian hàng (Tiếng Việt)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Mô tả (English)</label>
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
                Pháp lý (riêng tư)
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">Tên đầy đủ</label>
                    <input
                      type="text"
                      defaultValue="HTX Sản Xuất & Kinh Doanh Cà Phê Hữu Cơ Đắk Lắk"
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">Loại hình</label>
                    <select className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all">
                      <option>Hợp tác xã</option>
                      <option>Doanh nghiệp</option>
                      <option>Hộ kinh doanh</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">MST · Tax ID</label>
                    <input
                      type="text"
                      value={form.tax_id}
                      onChange={(e) => handleChange('tax_id', e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">Năm thành lập</label>
                    <input
                      type="number"
                      defaultValue={2018}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">Số thành viên</label>
                    <input
                      type="number"
                      defaultValue={42}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Địa chỉ trụ sở</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">Đại diện</label>
                    <input
                      type="text"
                      defaultValue="Y Thol Êban"
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">CCCD · ID number</label>
                    <input
                      type="text"
                      defaultValue="066089012345"
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
                Hình ảnh thương hiệu
              </h3>
              <div className="text-center">
                <div className="h-36 rounded-xl border border-border bg-cream mb-3 flex items-center justify-center p-4">
                  <img
                    src="/img/market/Logo_Food-e1688828159579-1024x470.png"
                    alt="Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="text-[11px] text-ink-mute mb-2">Logo gian hàng · 1024×470px khuyến nghị</div>
                <button type="button" className="w-full py-2 text-xs font-semibold text-ink-mute border border-border rounded-xl hover:border-green hover:text-green transition-colors">
                  Thay logo
                </button>
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Chứng nhận
              </h3>
              <div className="space-y-2 mb-3">
                {form.certifications.map((cert, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-cream rounded-xl">
                    <div className="flex items-center gap-2">
                      <Badge variant="active">✓ ACTIVE</Badge>
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
                  placeholder="USDA Organic, Fairtrade..."
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
                Liên hệ & MXH
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Điện thoại</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Facebook</label>
                  <input
                    type="text"
                    value={form.facebook}
                    onChange={(e) => handleChange('facebook', e.target.value)}
                    placeholder="facebook.com/yourpage"
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Instagram</label>
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
