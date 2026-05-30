import { useState, useEffect } from 'react'
import { useAdminProducts, useApproveProduct, useBulkApproveProducts } from '@/features/admin/useAdmin'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { Search, Package, CheckSquare } from 'lucide-react'
import type { ProductStatus } from '@/types/api'
import { useT } from '@/i18n/useT'

const STATUS_KEY: Record<ProductStatus, string> = {
  active: 'adminProducts.statusActive',
  pending: 'adminProducts.statusPending',
  inactive: 'adminProducts.statusInactive',
}

const FILTER_KEY: Record<'all' | ProductStatus, string> = {
  all: 'adminProducts.filterAll',
  active: 'adminProducts.filterActive',
  pending: 'adminProducts.filterPending',
  inactive: 'adminProducts.filterInactive',
}

const PAGE_SIZE = 20

export function AdminProducts() {
  const { t, lang } = useT()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | ProductStatus>('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const { data: products, isLoading } = useAdminProducts()
  const approveProduct = useApproveProduct()
  const bulkApprove = useBulkApproveProducts()
  const localeStr = lang === 'vi' ? 'vi-VN' : 'en-US'

  useEffect(() => { setPage(1) }, [search])
  useEffect(() => { setPage(1); setSelected(new Set()) }, [filter])

  const source = products ?? []

  const filtered = source.filter((p) => {
    const matchSearch = p.name_vi.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.status === filter
    return matchSearch && matchFilter
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pendingOnPage = paginated.filter((p) => p.status === 'pending')
  const allPagePendingSelected = pendingOnPage.length > 0 && pendingOnPage.every((p) => selected.has(p.id))

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allPagePendingSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        pendingOnPage.forEach((p) => next.delete(p.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        pendingOnPage.forEach((p) => next.add(p.id))
        return next
      })
    }
  }

  function handleBulkApprove() {
    if (selected.size === 0) return
    bulkApprove.mutate([...selected], {
      onSuccess: () => setSelected(new Set()),
    })
  }

  const statusBadge = (status: ProductStatus) => {
    const variant = status === 'active' ? 'active' : status === 'pending' ? 'pending' : 'cancelled'
    return <Badge variant={variant}>{t(STATUS_KEY[status])}</Badge>
  }

  return (
    <div>
      <PageHeader
        title={t('adminProducts.title')}
        subtitle={t('adminProducts.subtitle')
          .replace('{n}', String(source.length))
          .replace('{pending}', String(source.filter((p) => p.status === 'pending').length))}
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            type="text"
            placeholder={t('adminProducts.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-green transition-all"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'pending', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-green text-white'
                  : 'bg-white border border-border text-ink-soft hover:border-green hover:text-green'
              }`}
            >
              {t(FILTER_KEY[f])}
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <button
            onClick={handleBulkApprove}
            disabled={bulkApprove.isPending}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-green text-white text-sm font-semibold rounded-xl hover:bg-green-soft transition-colors disabled:opacity-50"
          >
            <CheckSquare size={14} />
            {t('adminProducts.bulkApprove').replace('{n}', String(selected.size))}
          </button>
        )}
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
                  <th className="px-4 py-3 w-10">
                    {pendingOnPage.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allPagePendingSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-green cursor-pointer"
                        title={t('adminProducts.selectAllTitle')}
                      />
                    )}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminProducts.thProduct')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminProducts.thOrigin')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminProducts.thPrice')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminProducts.thStock')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminProducts.thSold')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminProducts.thStatus')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminProducts.thActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-ink-mute text-sm">
                      {t('adminProducts.empty')}
                    </td>
                  </tr>
                ) : (
                  paginated.map((p) => (
                    <tr key={p.id} className={`border-b border-border last:border-0 hover:bg-cream/50 transition-colors ${selected.has(p.id) ? 'bg-green/5' : ''}`}>
                      <td className="px-4 py-3">
                        {p.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="w-4 h-4 accent-green cursor-pointer"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cream-dark flex items-center justify-center flex-shrink-0">
                            <Package size={16} className="text-ink-mute" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-ink truncate max-w-[180px]">{p.name_vi}</div>
                            {p.certifications && p.certifications.length > 0 && (
                              <div className="flex gap-1 mt-0.5">
                                {p.certifications.slice(0, 2).map((c) => (
                                  <span key={c} className="text-[9px] text-success bg-green/10 px-1.5 py-0.5 rounded-full font-bold">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-soft">{p.origin ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-green font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                        {p.price.toLocaleString(localeStr)}₫
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-soft font-mono">{p.stock}</td>
                      <td className="px-4 py-3 text-sm text-ink-soft font-mono">{p.sold_count}</td>
                      <td className="px-4 py-3">{statusBadge(p.status)}</td>
                      <td className="px-4 py-3">
                        {p.status === 'pending' && (
                          <button
                            onClick={() => approveProduct.mutate(p.id)}
                            disabled={approveProduct.isPending}
                            className="text-xs px-2.5 py-1 bg-green/10 text-green font-semibold rounded-lg hover:bg-green/20 transition-colors disabled:opacity-50"
                          >
                            {t('adminProducts.btnApprove')}
                          </button>
                        )}
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
