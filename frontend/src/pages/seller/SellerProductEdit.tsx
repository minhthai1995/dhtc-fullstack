import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCreateProduct, useUpdateProduct } from '@/features/seller/useSeller'
import { useProduct } from '@/features/products/useProducts'
import { ImageUploader } from '@/features/products/ImageUploader'
import type { ProductImage } from '@/features/products/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { useT } from '@/i18n/useT'

// Backend stores images as flexible list[dict]; we normalise both legacy
// `{url}` rows and the new `{id, urls, order}` rows into ProductImage so
// the uploader only ever deals with one shape.
function toProductImages(raw: unknown): ProductImage[] {
  if (!Array.isArray(raw)) return []
  return raw.map((entry, i) => {
    const item = entry as Record<string, unknown>
    if (item && typeof item === 'object' && 'urls' in item && 'id' in item) {
      return {
        id: String(item.id),
        urls: item.urls as ProductImage['urls'],
        order: typeof item.order === 'number' ? item.order : i,
      }
    }
    // Legacy shape: spread the single URL across all sizes so the UI works.
    const url = typeof item.url === 'string' ? item.url : ''
    return {
      id: `legacy-${i}-${url.slice(-12)}`,
      urls: { original: url, large: url, medium: url, thumb: url },
      order: i,
    }
  })
}

export function SellerProductEdit() {
  const { t } = useT()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const productId = id ? parseInt(id) : 0
  const navigate = useNavigate()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const { data: existingProduct, isLoading: loadingProduct } = useProduct(productId)

  const [form, setForm] = useState({
    name_vi: '',
    name_en: '',
    price: '',
    stock: '',
    origin: '',
    description_vi: '',
    description_en: '',
    certifications: [] as string[],
    newCert: '',
  })
  const [images, setImages] = useState<ProductImage[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit && existingProduct) {
      setForm({
        name_vi: existingProduct.name_vi ?? '',
        name_en: existingProduct.name_en ?? '',
        price: String(existingProduct.price ?? ''),
        stock: String(existingProduct.stock ?? ''),
        origin: existingProduct.origin ?? '',
        description_vi: existingProduct.description_vi ?? '',
        description_en: existingProduct.description_en ?? '',
        certifications: existingProduct.certifications ?? [],
        newCert: '',
      })
      setImages(toProductImages(existingProduct.images))
    }
  }, [isEdit, existingProduct])

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
    setError('')

    const payload = {
      name_vi: form.name_vi,
      name_en: form.name_en || undefined,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      origin: form.origin || undefined,
      description_vi: form.description_vi || undefined,
      description_en: form.description_en || undefined,
      certifications: form.certifications.length > 0 ? form.certifications : undefined,
      images: images.map((img, i) => ({ ...img, order: i })),
    }

    if (isEdit) {
      updateProduct.mutate(
        { id: parseInt(id!), payload },
        {
          onSuccess: () => navigate('/seller/products'),
          onError: () => setError(t('sellerProductEdit.errorUpdate')),
        }
      )
    } else {
      createProduct.mutate(payload, {
        onSuccess: () => navigate('/seller/products'),
        onError: () => setError(t('sellerProductEdit.errorCreate')),
      })
    }
  }

  const isPending = createProduct.isPending || updateProduct.isPending

  if (isEdit && loadingProduct) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/seller/products"
          className="inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink no-underline transition-colors"
        >
          <ArrowLeft size={14} />
          {t('sellerProductEdit.backToList')}
        </Link>
      </div>

      <PageHeader
        title={isEdit ? t('sellerProductEdit.titleEdit') : t('sellerProductEdit.titleNew')}
        subtitle={isEdit ? t('sellerProductEdit.subtitleEdit').replace('{id}', String(id)) : t('sellerProductEdit.subtitleNew')}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {t('sellerProductEdit.basicInfo')}
              </h3>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">
                    {t('sellerProductEdit.nameVi')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name_vi}
                    onChange={(e) => handleChange('name_vi', e.target.value)}
                    required
                    placeholder={t('sellerProductEdit.nameViPlaceholder')}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">
                    {t('sellerProductEdit.nameEn')}
                  </label>
                  <input
                    type="text"
                    value={form.name_en}
                    onChange={(e) => handleChange('name_en', e.target.value)}
                    placeholder={t('sellerProductEdit.nameEnPlaceholder')}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-mute mb-1.5">
                    {t('sellerProductEdit.productImages')}
                  </label>
                  <ImageUploader value={images} onChange={setImages} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">
                      {t('sellerProductEdit.priceVnd')} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => handleChange('price', e.target.value)}
                      required
                      min="0"
                      step="1000"
                      placeholder="680000"
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">
                      {t('sellerProductEdit.stock')} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) => handleChange('stock', e.target.value)}
                      required
                      min="0"
                      placeholder="100"
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProductEdit.origin')}</label>
                  <input
                    type="text"
                    value={form.origin}
                    onChange={(e) => handleChange('origin', e.target.value)}
                    placeholder={t('sellerProductEdit.originPlaceholder')}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {t('sellerProductEdit.descriptionSection')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProductEdit.descVi')}</label>
                  <textarea
                    value={form.description_vi}
                    onChange={(e) => handleChange('description_vi', e.target.value)}
                    rows={4}
                    placeholder={t('sellerProductEdit.descViPlaceholder')}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">{t('sellerProductEdit.descEn')}</label>
                  <textarea
                    value={form.description_en}
                    onChange={(e) => handleChange('description_en', e.target.value)}
                    rows={4}
                    placeholder={t('sellerProductEdit.descEnPlaceholder')}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Certifications */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {t('sellerProductEdit.certifications')}
              </h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={form.newCert}
                  onChange={(e) => handleChange('newCert', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCert())}
                  placeholder={t('sellerProductEdit.certPlaceholder')}
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-cream focus:outline-none focus:border-green transition-all"
                />
                <button
                  type="button"
                  onClick={addCert}
                  className="px-3 py-2 bg-green text-white rounded-lg hover:bg-green-soft transition-colors"
                >
                  <Plus size={15} />
                </button>
              </div>
              {form.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.certifications.map((cert, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 text-xs font-bold text-success bg-green/10 px-2.5 py-1 rounded-full"
                    >
                      {cert}
                      <button type="button" onClick={() => removeCert(i)} className="hover:text-danger transition-colors">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-ink-mute mt-2">
                {t('sellerProductEdit.certHint')}
              </p>
            </div>

            {/* Actions */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-soft disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mb-3"
              >
                {isPending ? (
                  <>
                    <Spinner className="w-4 h-4 border-2 border-white border-t-transparent" />
                    {t('sellerProductEdit.saving')}
                  </>
                ) : isEdit ? (
                  t('sellerProductEdit.updateBtn')
                ) : (
                  t('sellerProductEdit.createBtn')
                )}
              </button>
              <Link
                to="/seller/products"
                className="block w-full py-2.5 text-center text-sm font-semibold text-ink-mute hover:text-ink border border-border rounded-xl transition-colors no-underline"
              >
                {t('sellerProductEdit.cancel')}
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
