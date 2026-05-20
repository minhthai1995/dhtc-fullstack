import { useParams, Link } from 'react-router-dom'
import { useAdminMerchantDetail, useAdminMerchantProducts } from '@/features/admin/useAdmin'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { ArrowLeft, Calendar, Star } from 'lucide-react'
import type { MerchantTier, ProductStatus } from '@/types/api'

function tierLabel(tier: string) {
  if (tier === 'gold') return '★ Gold Tier'
  if (tier === 'silver') return 'Silver Tier'
  return 'Bronze Tier'
}

function statusBadge(status: ProductStatus) {
  if (status === 'active') return <Badge variant="active">Hoạt động</Badge>
  if (status === 'pending') return <Badge variant="pending">Chờ duyệt</Badge>
  return <Badge variant="cancelled">Ngừng bán</Badge>
}

export function AdminMerchantDetail() {
  const { id } = useParams<{ id: string }>()
  const merchantId = parseInt(id ?? '0')
  const { data: merchant, isLoading } = useAdminMerchantDetail(merchantId || null)
  const { data: merchantProducts = [], isLoading: productsLoading } = useAdminMerchantProducts(merchant?.id ?? null)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (!merchant) {
    return <div className="p-8 text-ink-mute text-sm text-center">Chưa có dữ liệu</div>
  }

  const m = merchant
  const displayName = m.store_name || `Merchant #${m.id}`
  const tierAsMerchantTier = m.tier as MerchantTier
  const statusLabel =
    m.status === 'active' ? 'Hoạt động' : m.status === 'pending' ? 'Chờ duyệt' : 'Đã khoá'

  const stats = [
    { label: 'Tổng sản phẩm', value: `${m.product_count} SKU` },
    { label: 'Đơn hoàn thành', value: m.order_count.toLocaleString('vi-VN') },
    {
      label: 'Doanh thu tháng',
      value: `${(m.monthly_revenue / 1_000_000).toFixed(1)}M₫`,
    },
    {
      label: 'Đánh giá TB',
      value: m.avg_rating != null ? `${m.avg_rating.toFixed(2)} ★` : '—',
    },
  ]

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/admin/merchants"
          className="inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink no-underline transition-colors"
        >
          <ArrowLeft size={14} />
          Danh sách tiểu thương
        </Link>
      </div>

      <PageHeader
        title={displayName}
        subtitle={`ID: M${String(m.id).padStart(3, '0')} · Đăng ký ${new Date(m.created_at).toLocaleDateString('vi-VN')}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={tierAsMerchantTier}>{tierLabel(m.tier)}</Badge>
            <Badge variant={m.status as 'active' | 'pending' | 'suspended'}>{statusLabel}</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Merchant info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile card */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="w-16 h-16 rounded-2xl bg-cream-dark flex items-center justify-center text-2xl font-bold text-ink-mute mb-4">
              {displayName[0]}
            </div>
            <h3 className="font-semibold text-ink mb-1">{displayName}</h3>
            <p className="text-sm text-ink-mute leading-relaxed mb-4">
              {m.description ?? 'Chưa có mô tả'}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-ink-soft">
                <Calendar size={14} className="text-ink-mute flex-shrink-0" />
                Đăng ký {new Date(m.created_at).toLocaleDateString('vi-VN')}
              </div>
              {m.avg_rating != null && (
                <div className="flex items-center gap-2 text-ink-soft">
                  <Star size={14} className="text-gold flex-shrink-0" />
                  Đánh giá {m.avg_rating.toFixed(2)} / 5.0
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Thống kê
            </h3>
            <div className="space-y-3">
              {stats.map((stat) => (
                <div key={stat.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-sm text-ink-soft">{stat.label}</span>
                  <span
                    className="text-sm font-semibold text-ink"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Products list */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Sản phẩm
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Sản phẩm</th>
                    <th className="text-left pb-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Giá</th>
                    <th className="text-left pb-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Tồn kho</th>
                    <th className="text-left pb-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Đã bán</th>
                    <th className="text-left pb-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {productsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center">
                        <Spinner />
                      </td>
                    </tr>
                  ) : merchantProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-ink-mute text-sm">
                        Chưa có sản phẩm nào
                      </td>
                    </tr>
                  ) : (
                    merchantProducts.map((product) => (
                      <tr key={product.id} className="border-b border-border last:border-0 hover:bg-cream transition-colors">
                        <td className="py-3 pr-4">
                          <span className="text-sm font-medium text-ink">{product.name_vi}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm font-mono text-ink">
                            {product.price.toLocaleString('vi-VN')}₫
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-ink-soft">{product.stock}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-ink-soft">{product.sold_count ?? 0}</span>
                        </td>
                        <td className="py-3">
                          {statusBadge(product.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
