import { useState } from 'react'
import { useAdminCustomers, useSuspendUser, useActivateUser } from '@/features/admin/useAdmin'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { Search, ShieldOff, ShieldCheck, Download } from 'lucide-react'

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

const PAGE_SIZE = 20

export function AdminCustomers() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data: customers = [], isLoading } = useAdminCustomers(search)
  const suspendUser = useSuspendUser()
  const activateUser = useActivateUser()

  const paginated = customers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <PageHeader
        title="Khách hàng"
        subtitle={`${customers.length} khách hàng`}
        actions={
          <button
            onClick={() => downloadCsv('/admin/customers/export', 'customers.csv')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-border text-ink-soft rounded-xl text-sm font-semibold hover:border-green hover:text-green transition-colors"
          >
            <Download size={15} />
            Xuất CSV
          </button>
        }
      />
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            type="text"
            placeholder="Tìm khách hàng..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-8 pr-4 py-2 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-green"
          />
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-cream-dark border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Tên</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">SĐT</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Đơn hàng</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Tổng chi</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Trạng thái</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Ngày đăng ký</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-ink-mute text-sm">
                    Không tìm thấy khách hàng
                  </td>
                </tr>
              ) : (
                paginated.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-cream/50">
                    <td className="px-4 py-3 text-sm font-mono text-ink-mute">#{c.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-ink">{c.full_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-ink-soft">{c.email}</td>
                    <td className="px-4 py-3 text-sm text-ink-mute">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-ink">{c.order_count}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-green">
                      {c.total_spend.toLocaleString('vi-VN')}₫
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.is_active ? 'bg-green/10 text-green' : 'bg-danger/10 text-danger'
                      }`}>
                        {c.is_active ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-mute font-mono">
                      {new Date(c.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      {c.is_active ? (
                        <button
                          onClick={() => suspendUser.mutate(c.id)}
                          disabled={suspendUser.isPending}
                          title="Tạm khóa tài khoản"
                          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-danger/10 text-danger font-semibold rounded-lg hover:bg-danger/20 transition-colors disabled:opacity-50"
                        >
                          <ShieldOff size={11} />
                          Khóa
                        </button>
                      ) : (
                        <button
                          onClick={() => activateUser.mutate(c.id)}
                          disabled={activateUser.isPending}
                          title="Kích hoạt tài khoản"
                          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-green/10 text-green font-semibold rounded-lg hover:bg-green/20 transition-colors disabled:opacity-50"
                        >
                          <ShieldCheck size={11} />
                          Kích hoạt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="p-4">
            <Pagination page={page} pageSize={PAGE_SIZE} total={customers.length} onPage={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
