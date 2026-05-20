import { useState, useEffect } from 'react'
import { useAdminOrders, useAdminUpdateOrderStatus } from '@/features/admin/useAdmin'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { Search, Download } from 'lucide-react'
import type { OrderStatus } from '@/types/api'

async function downloadCsv(path: string, filename: string) {
  const token = sessionStorage.getItem('access_token')
  const response = await fetch(`/api/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) return
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function statusBadge(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    pending: 'pending',
    processing: 'processing',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
  }
  const labels: Record<OrderStatus, string> = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã huỷ',
  }
  return <Badge variant={map[status] as Parameters<typeof Badge>[0]['variant']}>{labels[status]}</Badge>
}

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
}

const PAGE_SIZE = 20

export function AdminOrders() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [page, setPage] = useState(1)
  const { data: orders, isLoading } = useAdminOrders()
  const updateStatus = useAdminUpdateOrderStatus()

  useEffect(() => { setPage(1) }, [search])
  useEffect(() => { setPage(1) }, [filter])

  const source = orders ?? []

  const filtered = source.filter((o) => {
    const matchSearch =
      String(o.id).includes(search) ||
      o.shipping_address.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || o.status === filter
    return matchSearch && matchFilter
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <PageHeader
        title="Quản lý đơn hàng"
        subtitle={`${source.length} đơn hàng`}
        actions={
          <button
            onClick={() => downloadCsv('/admin/orders/export', 'orders.csv')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-border text-ink-soft rounded-xl text-sm font-semibold hover:border-green hover:text-green transition-colors"
          >
            <Download size={15} />
            Xuất CSV
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            type="text"
            placeholder="Tìm đơn hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-green transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-green text-white'
                  : 'bg-white border border-border text-ink-soft hover:border-green hover:text-green'
              }`}
            >
              {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chờ' : f === 'processing' ? 'Xử lý' : f === 'shipped' ? 'Giao' : f === 'delivered' ? 'Xong' : 'Huỷ'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-cream-dark border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Mã đơn</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Khách hàng</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Quốc gia</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Giá trị</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Tracking</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Cập nhật</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Ngày đặt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-ink-mute text-sm">
                      Không tìm thấy đơn hàng
                    </td>
                  </tr>
                ) : (
                  paginated.map((o) => {
                    const nextStatuses = NEXT_STATUSES[o.status]
                    return (
                      <tr key={o.id} className="border-b border-border last:border-0 hover:bg-cream/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono font-semibold text-ink">
                          ORD-{o.id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-ink">{o.shipping_address.name}</div>
                          <div className="text-[11px] text-ink-mute">{o.shipping_address.city}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-ink-mute">{o.shipping_address.country}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-green" style={{ fontFamily: 'var(--font-display)' }}>
                          {(o.total_amount / 1000000).toFixed(1)}M₫
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-ink-mute">
                          {o.tracking_number ?? '—'}
                        </td>
                        <td className="px-4 py-3">{statusBadge(o.status)}</td>
                        <td className="px-4 py-3">
                          {nextStatuses.length > 0 ? (
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (!e.target.value) return
                                updateStatus.mutate({ orderId: o.id, status: e.target.value })
                                e.target.value = ''
                              }}
                              disabled={updateStatus.isPending}
                              className="px-2 py-1.5 border border-border rounded-xl text-xs text-ink-soft bg-white focus:outline-none focus:border-green disabled:opacity-50 cursor-pointer"
                            >
                              <option value="" disabled>Chuyển sang...</option>
                              {nextStatuses.map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[11px] text-ink-mute">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-mute font-mono">
                          {new Date(o.created_at).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
        </div>
      )}
    </div>
  )
}
