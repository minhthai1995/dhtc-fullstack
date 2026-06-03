import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSellerOrders, useSellerUpdateOrderStatus } from '@/features/seller/useSeller'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { ChevronRight } from 'lucide-react'
import type { OrderStatus } from '@/types/api'
import { useT } from '@/i18n/useT'

const TAB_FILTERS: { key: 'all' | OrderStatus; labelKey: string }[] = [
  { key: 'all', labelKey: 'sellerOrders.tabAll' },
  { key: 'pending', labelKey: 'sellerOrders.tabPending' },
  { key: 'processing', labelKey: 'sellerOrders.tabProcessing' },
  { key: 'shipped', labelKey: 'sellerOrders.tabShipped' },
  { key: 'delivered', labelKey: 'sellerOrders.tabDelivered' },
  { key: 'cancelled', labelKey: 'sellerOrders.tabCancelled' },
]

const STATUS_KEY: Record<OrderStatus, string> = {
  pending: 'sellerOrders.statusPending',
  processing: 'sellerOrders.statusProcessing',
  shipped: 'sellerOrders.statusShipped',
  delivered: 'sellerOrders.statusDelivered',
  cancelled: 'sellerOrders.statusCancelled',
}

// Seller-appropriate next statuses: pending→processing, processing→shipped
const SELLER_NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['processing'],
  processing: ['shipped'],
}

export function SellerOrders() {
  const { t, lang } = useT()
  const [activeTab, setActiveTab] = useState<'all' | OrderStatus>('all')
  const [trackingInputs, setTrackingInputs] = useState<Record<number, string>>({})
  const { data: orders } = useSellerOrders()
  const updateStatus = useSellerUpdateOrderStatus()

  const source = orders ?? []
  const filtered = activeTab === 'all' ? source : source.filter((o) => o.status === activeTab)

  const statusBadge = (status: OrderStatus) => {
    const variants: Record<OrderStatus, Parameters<typeof Badge>[0]['variant']> = {
      pending: 'pending',
      processing: 'processing',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
    }
    return <Badge variant={variants[status]}>{t(STATUS_KEY[status])}</Badge>
  }

  return (
    <div>
      <PageHeader
        title={t('sellerOrders.title')}
        subtitle={t('sellerOrders.subtitle')
          .replace('{total}', String(source.length))
          .replace('{pending}', String(source.filter((o) => o.status === 'pending').length))}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto">
        {TAB_FILTERS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-green text-white'
                : 'bg-white border border-border text-ink-soft hover:border-green hover:text-green'
            }`}
          >
            {t(tab.labelKey)}
            {tab.key !== 'all' && (
              <span className={`ml-1.5 text-[10px] ${activeTab === tab.key ? 'opacity-80' : 'text-ink-mute'}`}>
                ({source.filter((o) => o.status === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-12 text-center text-ink-mute text-sm">
            {t('sellerOrders.noOrders')}
          </div>
        ) : (
          filtered.map((order) => {
            const nextStatuses = SELLER_NEXT_STATUSES[order.status] ?? []
            return (
              <div key={order.id} className="bg-white border border-border rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-ink text-sm font-mono">ORD-{order.id}</span>
                      {statusBadge(order.status)}
                    </div>
                    <div className="text-sm text-ink mb-0.5">{order.shipping_address.name}</div>
                    <div className="text-xs text-ink-mute mb-1">
                      {order.shipping_address.city}, {order.shipping_address.country}
                    </div>
                    {order.tracking_number && (
                      <div className="text-xs text-green font-mono mt-1">
                        {t('sellerOrders.trackingLabel')}: {order.tracking_number}
                      </div>
                    )}
                    {/* Status update buttons */}
                    {nextStatuses.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {nextStatuses.map((nextStatus) =>
                          nextStatus === 'shipped' ? (
                            <div key={nextStatus} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder={t('sellerOrders.awbPlaceholder')}
                                value={trackingInputs[order.id] ?? ''}
                                onChange={(e) =>
                                  setTrackingInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                                }
                                className="flex-1 px-2.5 py-1.5 border border-border rounded-lg text-xs font-mono focus:outline-none focus:border-green"
                              />
                              <button
                                onClick={() =>
                                  updateStatus.mutate({
                                    id: order.id,
                                    status: 'shipped',
                                    trackingNumber: trackingInputs[order.id],
                                  })
                                }
                                disabled={updateStatus.isPending || !trackingInputs[order.id]?.trim()}
                                className="text-xs px-3 py-1.5 bg-green text-white font-semibold rounded-lg hover:bg-green-soft transition-colors disabled:opacity-50"
                              >
                                {t('sellerOrders.deliverBtn')}
                              </button>
                            </div>
                          ) : (
                            <button
                              key={nextStatus}
                              onClick={() => updateStatus.mutate({ id: order.id, status: nextStatus })}
                              disabled={updateStatus.isPending}
                              className="px-3 py-1.5 text-xs font-semibold border border-green text-green rounded-lg hover:bg-green hover:text-white transition-all disabled:opacity-50"
                            >
                              {t(STATUS_KEY[nextStatus])}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className="text-base font-medium text-green mb-1"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {(order.total_amount / 1_000_000).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: 1 })}M₫
                    </div>
                    <div className="text-[11px] text-ink-mute font-mono">
                      {new Date(order.created_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                    </div>
                  </div>
                  <Link
                    to={`/seller/orders/${order.id}`}
                    className="flex items-center gap-1 px-3 py-2 border border-border rounded-xl text-sm text-ink-soft hover:border-green hover:text-green transition-colors no-underline flex-shrink-0"
                  >
                    {t('sellerOrders.detailsBtn')} <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
