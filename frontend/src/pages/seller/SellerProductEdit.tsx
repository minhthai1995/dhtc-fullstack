import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCreateProduct, useUpdateProduct } from '@/features/seller/useSeller'
import { useProduct } from '@/features/products/useProducts'
import { ImageUploader } from '@/features/products/ImageUploader'
import type { ProductImage } from '@/features/products/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { ArrowLeft, Plus, X } from 'lucide-react'

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
          onError: () => setError('Không thể cập nhật sản phẩm. Vui lòng thử lại.'),
        }
      )
    } else {
      createProduct.mutate(payload, {
        onSuccess: () => navigate('/seller/products'),
        onError: () => setError('Không thể tạo sản phẩm. Vui lòng thử lại.'),
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
          Danh sách sản phẩm
        </Link>
      </div>

      <PageHeader
        title={isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        subtitle={isEdit ? `Sản phẩm #${id}` : 'Điền đầy đủ thông tin sản phẩm'}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Thông tin cơ bản
              </h3>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">
                    Tên sản phẩm (Tiếng Việt) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name_vi}
                    onChange={(e) => handleChange('name_vi', e.target.value)}
                    required
                    placeholder="Cà phê chồn nguyên hạt 500g"
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">
                    Tên sản phẩm (English)
                  </label>
                  <input
                    type="text"
                    value={form.name_en}
                    onChange={(e) => handleChange('name_en', e.target.value)}
                    placeholder="Weasel Coffee 500g"
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-mute mb-1.5">
                    Ảnh sản phẩm
                  </label>
                  <ImageUploader value={images} onChange={setImages} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">
                      Giá (VND) <span className="text-danger">*</span>
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
                      Số lượng tồn kho <span className="text-danger">*</span>
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
                  <label className="block text-sm font-semibold text-ink mb-1.5">Xuất xứ</label>
                  <input
                    type="text"
                    value={form.origin}
                    onChange={(e) => handleChange('origin', e.target.value)}
                    placeholder="Đắk Lắk, Việt Nam"
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Mô tả sản phẩm
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Mô tả (Tiếng Việt)</label>
                  <textarea
                    value={form.description_vi}
                    onChange={(e) => handleChange('description_vi', e.target.value)}
                    rows={4}
                    placeholder="Mô tả chi tiết sản phẩm..."
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Description (English)</label>
                  <textarea
                    value={form.description_en}
                    onChange={(e) => handleChange('description_en', e.target.value)}
                    rows={4}
                    placeholder="Product description in English..."
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
                Chứng nhận
              </h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={form.newCert}
                  onChange={(e) => handleChange('newCert', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCert())}
                  placeholder="VD: Organic EU"
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
                VD: Organic EU, Fairtrade, VietGAP, GlobalG.A.P.
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
                    Đang lưu...
                  </>
                ) : isEdit ? (
                  'Cập nhật sản phẩm'
                ) : (
                  'Tạo sản phẩm'
                )}
              </button>
              <Link
                to="/seller/products"
                className="block w-full py-2.5 text-center text-sm font-semibold text-ink-mute hover:text-ink border border-border rounded-xl transition-colors no-underline"
              >
                Huỷ
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
