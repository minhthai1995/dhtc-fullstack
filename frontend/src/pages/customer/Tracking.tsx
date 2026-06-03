import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useMyOrders, useOrderEvents, useCancelOrder } from '@/features/orders/useOrders'
import { useAddToCart } from '@/features/cart/useCart'
import { useMyReturns, useRequestReturn } from '@/features/returns/useReturns'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import type { OrderStatus } from '@/types/api'
import { useT } from '@/i18n/useT'

const STATUS_KEY: Record<OrderStatus, string> = {
  pending: 'tracking.statusPending',
  processing: 'tracking.statusProcessing',
  shipped: 'tracking.statusShipped',
  delivered: 'tracking.statusDelivered',
  cancelled: 'tracking.statusCancelled',
}

const STATUS_BADGE: Record<OrderStatus, 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'> = {
  pending: 'pending',
  processing: 'processing',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-warning',
  processing: 'bg-gold',
  shipped: 'bg-green-soft',
  delivered: 'bg-green',
  cancelled: 'bg-danger',
}

function OrderTimeline({ orderId }: { orderId: number }) {
  const { data: events = [], isLoading } = useOrderEvents(orderId)
  const { t, lang } = useT()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US'
  if (isLoading) return <div className="py-3 pl-4"><Spinner size="sm" /></div>
  if (events.length === 0) return <div className="py-3 pl-4 text-xs text-ink-mute">{t('tracking.noEvents')}</div>
  return (
    <div className="pt-4 border-t border-border mt-4">
      <div className="text-[10.5px] font-bold uppercase tracking-widest text-ink-mute mb-3">{t('tracking.historyLabel')}</div>
      <div className="space-y-3">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${STATUS_COLOR[ev.status]}`} />
            <div className="flex-1">
              <div className="text-xs font-semibold text-ink">{t(STATUS_KEY[ev.status])}</div>
              {ev.note && <div className="text-[11px] text-ink-mute">{ev.note}</div>}
              <div className="text-[10px] text-ink-mute font-mono mt-0.5">
                {new Date(ev.created_at).toLocaleString(locale)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Tracking() {
  const [searchParams] = useSearchParams()
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())
  const addToCart = useAddToCart()
  const cancelOrder = useCancelOrder()
  const { data: myReturns = [] } = useMyReturns()
  const requestReturn = useRequestReturn()
  const [returnModal, setReturnModal] = useState<{ orderId: number } | null>(null)
  const [returnReason, setReturnReason] = useState('')
  const { t, lang } = useT()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US'

  const toggleExpand = (id: number) => setExpandedOrders(prev => {
    const next = new Set(prev)
    if (next.has(id)) { next.delete(id) } else { next.add(id) }
    return next
  })
  const highlightedOrderId = searchParams.get('order')
  const { data: orders = [], isLoading } = useMyOrders()

  function getReturnForOrder(orderId: number) {
    return myReturns.find(r => r.order_id === orderId)
  }

  return (
    <div>
      <h1 className="text-3xl font-medium tracking-tight text-ink mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        {t('tracking.title')}
      </h1>
      <p className="text-ink-mute text-sm mb-7">
        {t('tracking.subtitle')}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-16 text-center text-ink-mute">
          {t('tracking.empty')}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isHighlighted = highlightedOrderId !== null && String(order.id) === highlightedOrderId
            const returnRequest = getReturnForOrder(order.id)
            return (
              <div
                key={order.id}
                className={`bg-white border rounded-2xl p-5 transition-all ${
                  isHighlighted ? 'border-green ring-2 ring-green/20' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-semibold text-green"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        #{order.id}
                      </span>
                      {isHighlighted && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 bg-green/10 text-green rounded-full">
                          {t('tracking.newBadge')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-mute">
                      {new Date(order.created_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                  <Badge variant={STATUS_BADGE[order.status]}>
                    {t(STATUS_KEY[order.status])}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute mb-1">{t('tracking.recipient')}</div>
                    <div className="font-semibold text-ink">{order.shipping_address.name}</div>
                    <div className="text-xs text-ink-mute">{order.shipping_address.phone}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute mb-1">{t('tracking.shipAddress')}</div>
                    <div className="text-ink text-xs leading-relaxed">
                      {order.shipping_address.address}<br />
                      {order.shipping_address.city}, {order.shipping_address.country}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute mb-1">{t('tracking.totalLabel')}</div>
                    <div
                      className="text-xl font-semibold text-green"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {order.total_amount.toLocaleString(locale)}₫
                    </div>
                    {order.tracking_number && (
                      <div className="text-[11px] font-mono text-ink-mute mt-1">
                        AWB: {order.tracking_number}
                      </div>
                    )}
                  </div>
                </div>
                {/* Order items */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-[10.5px] font-bold uppercase tracking-widest text-ink-mute mb-2">
                      {t('tracking.itemsLabel').replace('{count}', String(order.items.length))}
                    </div>
                    <div className="space-y-1.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-ink-mute shrink-0">×{item.quantity}</span>
                            <span className="text-xs text-ink truncate">{item.product_name}</span>
                          </div>
                          <span className="text-xs font-medium text-ink shrink-0 font-mono">
                            {(item.unit_price * item.quantity).toLocaleString(locale)}₫
                          </span>
                          {order.status === 'delivered' && (
                            <Link
                              to={`/shop/products/${item.product_id}#reviews`}
                              className="shrink-0 text-[10px] font-semibold text-green border border-green/30 rounded-md px-2 py-0.5 hover:bg-green hover:text-white transition-colors"
                            >
                              {t('tracking.review')}
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center flex-wrap gap-2">
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="text-xs text-green font-semibold hover:underline"
                  >
                    {expandedOrders.has(order.id) ? t('tracking.hideHistory') : t('tracking.showHistory')}
                  </button>
                  <div className="flex items-center gap-3 flex-wrap">
                    {(order.status === 'pending' || order.status === 'processing') && (
                      <button
                        onClick={() => cancelOrder.mutate(order.id)}
                        disabled={cancelOrder.isPending}
                        className="text-xs text-danger font-semibold hover:underline transition-colors disabled:opacity-50"
                      >
                        {t('tracking.cancel')}
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      returnRequest ? (
                        returnRequest.status === 'pending' ? (
                          <span className="text-xs font-semibold text-ink-mute bg-cream-dark border border-border rounded-lg px-2.5 py-1">
                            {t('tracking.returnPending')}
                          </span>
                        ) : returnRequest.status === 'approved' ? (
                          <span className="text-xs font-semibold text-green bg-green/10 border border-green/20 rounded-lg px-2.5 py-1">
                            {t('tracking.returnApproved')}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-danger bg-danger/10 border border-danger/20 rounded-lg px-2.5 py-1">
                            {t('tracking.returnRejected')}
                          </span>
                        )
                      ) : (
                        <button
                          onClick={() => { setReturnModal({ orderId: order.id }); setReturnReason('') }}
                          className="text-xs text-ink-soft font-semibold hover:text-green hover:underline transition-colors"
                        >
                          {t('tracking.requestReturn')}
                        </button>
                      )
                    )}
                    {(order.status === 'delivered' || order.status === 'cancelled') && order.items && (
                      <button
                        onClick={async () => {
                          for (const item of order.items!) {
                            await addToCart.mutateAsync(
                              { productId: item.product_id, quantity: item.quantity },
                            ).catch(() => {})
                          }
                        }}
                        className="text-xs text-ink-mute font-semibold hover:text-green hover:underline transition-colors"
                      >
                        {t('tracking.reorder')}
                      </button>
                    )}
                  </div>
                </div>
                {expandedOrders.has(order.id) && <OrderTimeline orderId={order.id} />}
              </div>
            )
          })}
        </div>
      )}

      {returnModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-semibold text-ink mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {t('tracking.returnModalTitle')}
            </h3>
            <p className="text-xs text-ink-mute mb-4">{t('tracking.returnOrderRef').replace('{id}', String(returnModal.orderId))}</p>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder={t('tracking.returnReasonPlaceholder')}
              className="w-full border border-border rounded-xl p-3 text-sm resize-none h-28 focus:outline-none focus:border-green"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => { setReturnModal(null); setReturnReason('') }}
                className="px-4 py-2 border border-border rounded-xl text-sm font-semibold text-ink-soft hover:border-green transition-colors"
              >
                {t('tracking.cancelBtn')}
              </button>
              <button
                disabled={!returnReason.trim() || requestReturn.isPending}
                onClick={() => {
                  requestReturn.mutate(
                    { orderId: returnModal.orderId, reason: returnReason },
                    { onSuccess: () => { setReturnModal(null); setReturnReason('') } }
                  )
                }}
                className="px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {t('tracking.sendRequest')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
