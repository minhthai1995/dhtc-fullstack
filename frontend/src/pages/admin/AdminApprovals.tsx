import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useAdminMerchants, useAdminProducts, useApproveMerchant, useApproveProduct } from '@/features/admin/useAdmin'
import { CheckCircle, Clock, Package, Store } from 'lucide-react'
import { useT } from '@/i18n/useT'

type ApprovalType = 'product' | 'merchant'

const FILTER_LABELS: Record<'all' | ApprovalType, string> = {
  all: 'adminApprovals.filterAll',
  product: 'adminApprovals.filterProduct',
  merchant: 'adminApprovals.filterMerchant',
}

export function AdminApprovals() {
  const { t, lang } = useT()
  const [filter, setFilter] = useState<'all' | ApprovalType>('all')
  const localeStr = lang === 'vi' ? 'vi-VN' : 'en-US'

  const { data: merchants, isLoading: loadingMerchants } = useAdminMerchants()
  const { data: products, isLoading: loadingProducts } = useAdminProducts()
  const approveMerchant = useApproveMerchant()
  const approveProduct = useApproveProduct()

  const isLoading = loadingMerchants || loadingProducts

  const pendingMerchants = (merchants ?? []).filter((m) => m.status === 'pending')
  const pendingProducts = (products ?? []).filter((p) => p.status === 'pending')

  const totalCount = pendingMerchants.length + pendingProducts.length

  const filteredMerchants = filter === 'product' ? [] : pendingMerchants
  const filteredProducts = filter === 'merchant' ? [] : pendingProducts
  const filteredCount = filteredMerchants.length + filteredProducts.length

  return (
    <div>
      <PageHeader
        title={t('adminApprovals.title')}
        subtitle={t('adminApprovals.subtitle')
          .replace('{total}', String(totalCount))
          .replace('{filtered}', String(filteredCount))}
        actions={
          <div className="flex items-center gap-2 text-[11px] font-bold text-ink-mute">
            <Clock size={14} />
            {t('adminApprovals.processBefore')}
          </div>
        }
      />

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Package size={18} className="text-warning" />
          </div>
          <div>
            <div className="text-xl font-medium text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              {pendingProducts.length}
            </div>
            <div className="text-xs text-ink-mute">{t('adminApprovals.productsPending')}</div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
            <Store size={18} className="text-gold-deep" />
          </div>
          <div>
            <div className="text-xl font-medium text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              {pendingMerchants.length}
            </div>
            <div className="text-xs text-ink-mute">{t('adminApprovals.merchantsPending')}</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 mb-5">
        {(['all', 'product', 'merchant'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f
                ? 'bg-green text-white'
                : 'bg-white border border-border text-ink-soft hover:border-green hover:text-green'
            }`}
          >
            {t(FILTER_LABELS[f])}
          </button>
        ))}
      </div>

      {/* Approval cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : filteredCount === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <CheckCircle size={48} className="text-success mx-auto mb-3 opacity-50" />
          <div className="text-ink-mute text-sm">{t('adminApprovals.empty')}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMerchants.map((m) => (
            <div key={`merchant-${m.id}`} className="bg-white border border-border rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0">
                  <Store size={18} className="text-gold-deep" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-ink">{m.shop_name ?? m.business_name}</span>
                    <Badge variant="gold" className="text-[9px]">{t('adminApprovals.badgeMerchant')}</Badge>
                    <Badge variant="pending" className="text-[9px]">{t('adminApprovals.badgePending')}</Badge>
                  </div>
                  <div className="text-xs text-ink-mute">{m.region ?? '—'} · {m.slug}</div>
                  <div className="text-[11px] text-ink-mute mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                    {new Date(m.created_at).toLocaleString(localeStr)}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approveMerchant.mutate(m.id)}
                    disabled={approveMerchant.isPending}
                    className="px-4 py-2 bg-green text-white text-sm font-semibold rounded-xl hover:bg-green-soft transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle size={14} />
                    {t('adminApprovals.btnApprove')}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredProducts.map((p) => (
            <div key={`product-${p.id}`} className="bg-white border border-border rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center flex-shrink-0">
                  <Package size={18} className="text-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-ink">{p.name_vi}</span>
                    <Badge variant="active" className="text-[9px]">{t('adminApprovals.badgeProduct')}</Badge>
                    <Badge variant="pending" className="text-[9px]">{t('adminApprovals.badgePending')}</Badge>
                  </div>
                  <div className="text-xs text-ink-mute">
                    {t('adminApprovals.priceStock')
                      .replace('{price}', p.price.toLocaleString(localeStr))
                      .replace('{stock}', String(p.stock))}
                    {p.certifications && p.certifications.length > 0 && ` · ${p.certifications.join(', ')}`}
                  </div>
                  <div className="text-[11px] text-ink-mute mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                    {new Date(p.created_at).toLocaleString(localeStr)}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approveProduct.mutate(p.id)}
                    disabled={approveProduct.isPending}
                    className="px-4 py-2 bg-green text-white text-sm font-semibold rounded-xl hover:bg-green-soft transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle size={14} />
                    {t('adminApprovals.btnApprove')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
