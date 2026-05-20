import { useParams, Link } from 'react-router-dom'
import { useSellerOrder, useUpdateOrderStatus } from '@/features/seller/useSeller'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { ArrowLeft, Package, MapPin, Phone, Printer } from 'lucide-react'
import type { OrderDetail, OrderStatus } from '@/types/api'

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'shipped', label: 'Đang giao' },
  { key: 'delivered', label: 'Đã giao' },
]

export function SellerOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const orderId = parseInt(id ?? '0')
  const { data: order, isLoading } = useSellerOrder(orderId)
  const updateStatus = useUpdateOrderStatus()

  const o = order as OrderDetail | undefined

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === o?.status)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (!o) {
    return <div className="p-8 text-ink-mute text-sm text-center">Chưa có dữ liệu</div>
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/seller/orders"
          className="inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink no-underline transition-colors"
        >
          <ArrowLeft size={14} />
          Danh sách đơn hàng
        </Link>
      </div>

      <PageHeader
        title={`Đơn hàng #ORD-${o.id}`}
        subtitle={`Đặt lúc ${new Date(o.created_at).toLocaleString('vi-VN')}`}
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm text-ink-soft hover:border-green hover:text-green transition-colors">
              <Printer size={14} />
              In waybill DHL
            </button>
            <Badge
              variant={
                o.status === 'pending'
                  ? 'pending'
                  : o.status === 'processing'
                  ? 'processing'
                  : o.status === 'shipped'
                  ? 'shipped'
                  : 'delivered'
              }
            >
              {STATUS_STEPS.find((s) => s.key === o.status)?.label}
            </Badge>
          </div>
        }
      />

      {/* Status stepper */}
      <div className="bg-white border border-border rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i <= currentStepIndex
                      ? 'bg-green text-white'
                      : 'bg-cream-dark text-ink-mute'
                  }`}
                >
                  {i < currentStepIndex ? '✓' : i + 1}
                </div>
                <span className="text-[10px] text-ink-mute mt-1 text-center max-w-[60px]">
                  {step.label}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded-full ${
                    i < currentStepIndex ? 'bg-green' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Order items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Sản phẩm trong đơn
            </h3>
            <div className="space-y-3">
              {o.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-cream rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-cream-dark flex items-center justify-center flex-shrink-0">
                    <Package size={20} className="text-ink-mute" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-ink">Product #{item.product_id}</div>
                    <div className="text-xs text-ink-mute">Số lượng: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-ink-mute">
                      {item.unit_price.toLocaleString('vi-VN')}₫ × {item.quantity}
                    </div>
                    <div className="text-sm font-semibold text-green" style={{ fontFamily: 'var(--font-display)' }}>
                      {(item.unit_price * item.quantity).toLocaleString('vi-VN')}₫
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink-mute">Tạm tính</span>
                <span className="text-sm text-ink">{o.total_amount.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-ink-mute">Phí vận chuyển</span>
                <span className="text-sm text-ink">DHL Express</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                <span className="font-semibold text-ink">Tổng cộng</span>
                <span
                  className="font-semibold text-lg text-green"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {o.total_amount.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {o.status === 'pending' && (
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Xác nhận đơn hàng
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    updateStatus.mutate({ id: o.id, status: 'processing' })
                  }
                  disabled={updateStatus.isPending}
                  className="flex-1 py-2.5 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-soft disabled:opacity-60 transition-colors"
                >
                  Xác nhận & Xử lý đơn
                </button>
                <button
                  onClick={() => updateStatus.mutate({ id: o.id, status: 'cancelled' })}
                  disabled={updateStatus.isPending}
                  className="px-4 py-2.5 bg-red-50 text-danger rounded-xl font-semibold text-sm hover:bg-red-100 disabled:opacity-60 transition-colors"
                >
                  Huỷ đơn
                </button>
              </div>
            </div>
          )}

          {o.status === 'processing' && (
            <div className="bg-white border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                In vận đơn & Giao hàng
              </h3>
              <div className="flex gap-3">
                <button className="flex-1 py-2.5 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-soft transition-colors flex items-center justify-center gap-2">
                  <Printer size={15} />
                  In DHL Waybill
                </button>
                <button
                  onClick={() => updateStatus.mutate({ id: o.id, status: 'shipped' })}
                  disabled={updateStatus.isPending}
                  className="flex-1 py-2.5 border border-green text-green rounded-xl font-semibold text-sm hover:bg-green/5 disabled:opacity-60 transition-colors"
                >
                  Đánh dấu đã giao DHL
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Shipping info */}
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Thông tin giao hàng
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-ink-mute mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-sm text-ink">{o.shipping_address.name}</div>
                  <div className="text-xs text-ink-mute">{o.shipping_address.address}</div>
                  <div className="text-xs text-ink-mute">{o.shipping_address.city}, {o.shipping_address.country}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-ink-mute flex-shrink-0" />
                <div className="text-sm text-ink-soft">{o.shipping_address.phone}</div>
              </div>
            </div>
            {o.tracking_number && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs text-ink-mute mb-1">Mã tracking</div>
                <div className="text-sm font-mono font-semibold text-green">{o.tracking_number}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
