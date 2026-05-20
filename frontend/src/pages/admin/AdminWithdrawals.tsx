import { useAdminWithdrawals, useApproveWithdrawal, useRejectWithdrawal } from '@/features/admin/useAdmin'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'

function statusBadge(status: string) {
  if (status === 'completed') return <Badge variant="delivered">Đã duyệt</Badge>
  if (status === 'rejected') return <Badge variant="cancelled">Từ chối</Badge>
  return <Badge variant="pending">Chờ duyệt</Badge>
}

export function AdminWithdrawals() {
  const { data: withdrawals = [], isLoading } = useAdminWithdrawals()
  const approve = useApproveWithdrawal()
  const reject = useRejectWithdrawal()

  const pending = withdrawals.filter(w => w.status === 'pending')

  return (
    <div>
      <PageHeader
        title="Yêu cầu rút tiền"
        subtitle={`${pending.length} yêu cầu chờ duyệt`}
      />
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : withdrawals.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-16 text-center text-ink-mute">
          Chưa có yêu cầu rút tiền nào
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-cream-dark border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Tiểu thương</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Số tiền</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Ghi chú</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Ngày</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id} className="border-b border-border last:border-0 hover:bg-cream/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-ink">{w.merchant_name}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green" style={{ fontFamily: 'var(--font-display)' }}>
                      {w.amount.toLocaleString('vi-VN')}₫
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-mute max-w-[200px] truncate">{w.note ?? '—'}</td>
                    <td className="px-4 py-3">{statusBadge(w.status)}</td>
                    <td className="px-4 py-3 text-xs text-ink-mute font-mono">
                      {new Date(w.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      {w.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approve.mutate(w.id)}
                            disabled={approve.isPending || reject.isPending}
                            className="text-xs px-2.5 py-1 bg-green/10 text-green font-semibold rounded-lg hover:bg-green/20 transition-colors disabled:opacity-50"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => reject.mutate(w.id)}
                            disabled={approve.isPending || reject.isPending}
                            className="text-xs px-2.5 py-1 bg-danger/10 text-danger font-semibold rounded-lg hover:bg-danger/20 transition-colors disabled:opacity-50"
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
