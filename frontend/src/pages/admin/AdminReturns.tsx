import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { useAdminReturns } from '@/features/returns/useReturns'
import type { ReturnRequestRead } from '@/features/returns/returns.api'

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xử lý',
  approved: 'Đã chấp nhận',
  rejected: 'Đã từ chối',
}

const STATUS_BADGE: Record<string, 'pending' | 'active' | 'cancelled'> = {
  pending: 'pending',
  approved: 'active',
  rejected: 'cancelled',
}

const FILTER_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'approved', label: 'Đã chấp nhận' },
  { key: 'rejected', label: 'Đã từ chối' },
]

export function AdminReturns() {
  const { data: returns = [], isLoading } = useAdminReturns()
  const [filter, setFilter] = useState<FilterStatus>('all')

  const filtered: ReturnRequestRead[] = filter === 'all'
    ? returns
    : returns.filter((r) => r.status === filter)

  return (
    <div>
      <PageHeader title="Yêu cầu đổi trả" subtitle={`${filtered.length} / ${returns.length} yêu cầu`} />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === opt.key
                ? 'bg-green text-white'
                : 'bg-white border border-border text-ink-soft hover:border-green hover:text-green'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-ink-mute text-sm">
          Không có yêu cầu đổi trả nào
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-cream">
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">ID</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">Đơn hàng</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">KH ID</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">Lý do</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">Trạng thái</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">Ghi chú NB</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr
                  key={r.id}
                  className={`border-b border-border last:border-0 hover:bg-cream/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-cream/20'}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-ink-mute">#{r.id}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-green font-mono text-xs">#{r.order_id}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-mute">{r.customer_id}</td>
                  <td className="px-4 py-3 text-xs text-ink max-w-[200px]">
                    <span className="line-clamp-2" title={r.reason}>{r.reason}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-mute max-w-[150px]">
                    {r.seller_note ? (
                      <span className="line-clamp-2 italic" title={r.seller_note}>{r.seller_note}</span>
                    ) : (
                      <span className="text-ink-mute/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[11px] font-mono text-ink-mute whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
