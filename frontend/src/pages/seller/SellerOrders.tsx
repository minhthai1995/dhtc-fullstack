import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSellerOrders, useSellerUpdateOrderStatus } from '@/features/seller/useSeller'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { ChevronRight } from 'lucide-react'
import type { OrderStatus } from '@/types/api'

const TAB_FILTERS: { key: 'all' | OrderStatus; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'shipped', label: 'Đang giao' },
  { key: 'delivered', label: 'Đã giao' },
]

function statusBadge(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    pending: 'Chờ xác nhận',
    processing: 'Đang xử lý',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã huỷ',
  }
  const variants: Record<OrderStatus, Parameters<typeof Badge>[0]['variant']> = {
    pending: 'pending',
    processing: 'processing',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
  }
  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}

// Seller-appropriate next statuses: pending→processing, processing→shipped
const SELLER_NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['processing'],
  processing: ['shipped'],
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
}

export function SellerOrders() {
  const [activeTab, setActiveTab] = useState<'all' | OrderStatus>('all')
  const [trackingInputs, setTrackingInputs] = useState<Record<number, string>>({})
  const { data: orders } = useSellerOrders()
  const updateStatus = useSellerUpdateOrderStatus()

  const source = orders ?? []
  const filtered = activeTab === 'all' ? source : source.filter((o) => o.status === activeTab)

  return (
    <div>
      <PageHeader
        title="Đơn hàng"
        subtitle={`${source.length} đơn hàng · ${source.filter((o) => o.status === 'pending').length} chờ xác nhận`}
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
            {tab.label}
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
            Không có đơn hàng nào
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
                        Tracking: {order.tracking_number}
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
                                placeholder="AWB / Mã vận đơn"
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
                                disabled={updateStatus.isPending}
                                className="text-xs px-3 py-1.5 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                              >
                                Giao hàng →
                              </button>
                            </div>
                          ) : (
                            <button
                              key={nextStatus}
                              onClick={() => updateStatus.mutate({ id: order.id, status: nextStatus })}
                              disabled={updateStatus.isPending}
                              className="px-3 py-1.5 text-xs font-semibold border border-green text-green rounded-lg hover:bg-green hover:text-white transition-all disabled:opacity-50"
                            >
                              {STATUS_LABELS[nextStatus]}
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
                      {(order.total_amount / 1000).toFixed(0)}K₫
                    </div>
                    <div className="text-[11px] text-ink-mute font-mono">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <Link
                    to={`/seller/orders/${order.id}`}
                    className="flex items-center gap-1 px-3 py-2 border border-border rounded-xl text-sm text-ink-soft hover:border-green hover:text-green transition-colors no-underline flex-shrink-0"
                  >
                    Chi tiết <ChevronRight size={14} />
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
