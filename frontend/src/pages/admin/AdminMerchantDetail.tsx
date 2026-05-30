import { useParams, Link } from 'react-router-dom'
import { useAdminMerchantDetail, useAdminMerchantProducts } from '@/features/admin/useAdmin'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { ArrowLeft, Calendar, Star } from 'lucide-react'
import type { MerchantTier, ProductStatus } from '@/types/api'
import { useT } from '@/i18n/useT'

const TIER_KEY: Record<string, string> = {
  gold: 'adminMerchantDetail.tierGold',
  silver: 'adminMerchantDetail.tierSilver',
  bronze: 'adminMerchantDetail.tierBronze',
}

const PRODUCT_STATUS_KEY: Record<ProductStatus, string> = {
  active: 'adminMerchantDetail.prodStatusActive',
  pending: 'adminMerchantDetail.prodStatusPending',
  inactive: 'adminMerchantDetail.prodStatusSuspended',
}

const MERCHANT_STATUS_KEY: Record<string, string> = {
  active: 'adminMerchantDetail.statusActive',
  pending: 'adminMerchantDetail.statusPending',
  suspended: 'adminMerchantDetail.statusLocked',
}

export function AdminMerchantDetail() {
  const { t, lang } = useT()
  const { id } = useParams<{ id: string }>()
  const merchantId = parseInt(id ?? '0')
  const { data: merchant, isLoading } = useAdminMerchantDetail(merchantId || null)
  const { data: merchantProducts = [], isLoading: productsLoading } = useAdminMerchantProducts(merchant?.id ?? null)
  const localeStr = lang === 'vi' ? 'vi-VN' : 'en-US'

  const statusBadge = (status: ProductStatus) => {
    const variant = status === 'active' ? 'active' : status === 'pending' ? 'pending' : 'cancelled'
    return <Badge variant={variant}>{t(PRODUCT_STATUS_KEY[status])}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (!merchant) {
    return <div className="p-8 text-ink-mute text-sm text-center">{t('adminMerchantDetail.noData')}</div>
  }

  const m = merchant
  const displayName = m.store_name || `Merchant #${m.id}`
  const tierAsMerchantTier = m.tier as MerchantTier
  const registeredDate = new Date(m.created_at).toLocaleDateString(localeStr)

  const stats = [
    {
      label: t('adminMerchantDetail.totalProducts'),
      value: t('adminMerchantDetail.totalProductsValue').replace('{n}', String(m.product_count)),
    },
    {
      label: t('adminMerchantDetail.completedOrders'),
      value: m.order_count.toLocaleString(localeStr),
    },
    {
      label: t('adminMerchantDetail.monthlyRevenue'),
      value: `${(m.monthly_revenue / 1_000_000).toFixed(1)}M₫`,
    },
    {
      label: t('adminMerchantDetail.avgRating'),
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
          {t('adminMerchantDetail.backToList')}
        </Link>
      </div>

      <PageHeader
        title={displayName}
        subtitle={t('adminMerchantDetail.subtitle')
          .replace('{id}', String(m.id).padStart(3, '0'))
          .replace('{date}', registeredDate)}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={tierAsMerchantTier}>{t(TIER_KEY[m.tier] ?? 'adminMerchantDetail.tierBronze')}</Badge>
            <Badge variant={m.status as 'active' | 'pending' | 'suspended'}>
              {t(MERCHANT_STATUS_KEY[m.status] ?? 'adminMerchantDetail.statusLocked')}
            </Badge>
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
              {m.description ?? t('adminMerchantDetail.noDescription')}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-ink-soft">
                <Calendar size={14} className="text-ink-mute flex-shrink-0" />
                {t('adminMerchantDetail.registered').replace('{date}', registeredDate)}
              </div>
              {m.avg_rating != null && (
                <div className="flex items-center gap-2 text-ink-soft">
                  <Star size={14} className="text-gold flex-shrink-0" />
                  {t('adminMerchantDetail.ratingLine').replace('{rating}', m.avg_rating.toFixed(2))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              {t('adminMerchantDetail.statsTitle')}
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
              {t('adminMerchantDetail.productsTitle')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminMerchantDetail.thProduct')}</th>
                    <th className="text-left pb-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminMerchantDetail.thPrice')}</th>
                    <th className="text-left pb-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminMerchantDetail.thStock')}</th>
                    <th className="text-left pb-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminMerchantDetail.thSold')}</th>
                    <th className="text-left pb-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminMerchantDetail.thStatus')}</th>
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
                        {t('adminMerchantDetail.emptyProducts')}
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
                            {product.price.toLocaleString(localeStr)}₫
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
