import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAdminMerchants, useApproveMerchant, useSuspendMerchant } from '@/features/admin/useAdmin'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { Search, ChevronRight } from 'lucide-react'
import type { MerchantStatus, MerchantTier } from '@/types/api'

function tierBadge(tier: MerchantTier) {
  if (tier === 'gold') return <Badge variant="gold">★ Gold</Badge>
  if (tier === 'silver') return <Badge variant="silver">Silver</Badge>
  return <Badge variant="bronze">Bronze</Badge>
}

function statusBadge(status: MerchantStatus) {
  if (status === 'active') return <Badge variant="active">Hoạt động</Badge>
  if (status === 'pending') return <Badge variant="pending">Chờ duyệt</Badge>
  return <Badge variant="suspended">Đã khoá</Badge>
}

const PAGE_SIZE = 20

export function AdminMerchants() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | MerchantStatus>('all')
  const [page, setPage] = useState(1)
  const { data: merchants, isLoading } = useAdminMerchants()
  const approve = useApproveMerchant()
  const suspend = useSuspendMerchant()

  useEffect(() => { setPage(1) }, [search])
  useEffect(() => { setPage(1) }, [filter])

  const source = merchants ?? []

  const filtered = source.filter((m) => {
    const matchSearch = (m.shop_name ?? m.business_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || m.status === filter
    return matchSearch && matchFilter
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <PageHeader
        title="Quản lý tiểu thương"
        subtitle={`${source.length} tiểu thương đã đăng ký`}
        actions={
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
            <span className="text-ink-mute">Tổng:</span>
            <span className="text-green">{source.filter((m) => m.status === 'active').length} hoạt động</span>
            <span className="text-warning">{source.filter((m) => m.status === 'pending').length} chờ duyệt</span>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            type="text"
            placeholder="Tìm tiểu thương..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-green transition-all"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'pending', 'suspended'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-green text-white'
                  : 'bg-white border border-border text-ink-soft hover:border-green hover:text-green'
              }`}
            >
              {f === 'all' ? 'Tất cả' : f === 'active' ? 'Hoạt động' : f === 'pending' ? 'Chờ duyệt' : 'Đã khoá'}
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
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-cream-dark border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Tên gian hàng</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Khu vực</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Hạng</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-ink-mute text-sm">
                      Không tìm thấy tiểu thương
                    </td>
                  </tr>
                ) : (
                  paginated.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-cream/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cream-dark flex items-center justify-center text-sm font-bold text-ink-mute flex-shrink-0">
                            {(m.shop_name ?? m.business_name ?? 'M')[0]}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-ink">{m.shop_name ?? m.business_name}</div>
                            <div className="text-[11px] text-ink-mute">{m.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-soft">{m.region ?? '—'}</td>
                      <td className="px-4 py-3">{tierBadge(m.tier)}</td>
                      <td className="px-4 py-3">{statusBadge(m.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/merchants/${m.id}`}
                            className="text-xs text-green font-medium hover:underline no-underline flex items-center gap-1"
                          >
                            Chi tiết <ChevronRight size={12} />
                          </Link>
                          {m.status === 'pending' && (
                            <button
                              onClick={() => approve.mutate(m.id)}
                              disabled={approve.isPending}
                              className="text-xs px-2.5 py-1 bg-green/10 text-green font-semibold rounded-lg hover:bg-green/20 transition-colors disabled:opacity-50"
                            >
                              Phê duyệt
                            </button>
                          )}
                          {m.status === 'active' && (
                            <button
                              onClick={() => suspend.mutate(m.id)}
                              disabled={suspend.isPending}
                              className="text-xs px-2.5 py-1 bg-red-50 text-danger font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              Khoá
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
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
