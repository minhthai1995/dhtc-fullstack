import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '@/components/ui/Toast'
import { useAdminMerchants, useApproveMerchant, useSuspendMerchant, useActivateMerchant } from '@/features/admin/useAdmin'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { Search, ChevronRight } from 'lucide-react'
import type { MerchantStatus, MerchantTier } from '@/types/api'
import { useT } from '@/i18n/useT'

const TIER_KEY: Record<MerchantTier, string> = {
  gold: 'adminMerchants.tierGold',
  silver: 'adminMerchants.tierSilver',
  bronze: 'adminMerchants.tierBronze',
}

const STATUS_KEY: Record<MerchantStatus, string> = {
  active: 'adminMerchants.statusActive',
  pending: 'adminMerchants.statusPending',
  suspended: 'adminMerchants.statusSuspended',
  verified: 'adminMerchants.statusVerified',
}

const FILTER_KEY: Record<'all' | MerchantStatus, string> = {
  all: 'adminMerchants.filterAll',
  active: 'adminMerchants.filterActive',
  pending: 'adminMerchants.filterPending',
  suspended: 'adminMerchants.filterSuspended',
  verified: 'adminMerchants.filterVerified',
}

const PAGE_SIZE = 20

export function AdminMerchants() {
  const { t } = useT()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | MerchantStatus>('all')
  const [page, setPage] = useState(1)
  const { data: merchants, isLoading } = useAdminMerchants()
  const approve = useApproveMerchant()
  const suspend = useSuspendMerchant()
  const activate = useActivateMerchant()

  useEffect(() => { setPage(1) }, [search])
  useEffect(() => { setPage(1) }, [filter])

  const source = merchants ?? []

  const filtered = source.filter((m) => {
    const matchSearch = (m.shop_name ?? m.business_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || m.status === filter
    return matchSearch && matchFilter
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const tierBadge = (tier: MerchantTier) => (
    <Badge variant={tier}>{t(TIER_KEY[tier])}</Badge>
  )

  const statusBadge = (status: MerchantStatus) => (
    <Badge variant={status}>{t(STATUS_KEY[status])}</Badge>
  )

  return (
    <div>
      <PageHeader
        title={t('adminMerchants.title')}
        subtitle={t('adminMerchants.subtitle').replace('{n}', String(source.length))}
        actions={
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
            <span className="text-ink-mute">{t('adminMerchants.summaryTotal')}</span>
            <span className="text-green">
              {t('adminMerchants.summaryActive').replace('{n}', String(source.filter((m) => m.status === 'active').length))}
            </span>
            <span className="text-warning">
              {t('adminMerchants.summaryPending').replace('{n}', String(source.filter((m) => m.status === 'pending').length))}
            </span>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            type="text"
            placeholder={t('adminMerchants.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-green transition-all"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'pending', 'verified', 'suspended'] as const).map((f) => (
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
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminMerchants.thStoreName')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminMerchants.thRegion')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminMerchants.thTier')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminMerchants.thStatus')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminMerchants.thActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-ink-mute text-sm">
                      {t('adminMerchants.empty')}
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
                            {t('adminMerchants.viewDetails')} <ChevronRight size={12} />
                          </Link>
                          {m.status === 'pending' && (
                            <button
                              onClick={() => approve.mutate(m.id, { onError: () => toast(t('toasts.errorApproveMerchant'), 'error') })}
                              disabled={approve.isPending}
                              className="text-xs px-2.5 py-1 bg-green/10 text-green font-semibold rounded-lg hover:bg-green/20 transition-colors disabled:opacity-50"
                            >
                              {t('adminMerchants.btnApprove')}
                            </button>
                          )}
                          {m.status === 'active' && (
                            <button
                              onClick={() => suspend.mutate(m.id, { onError: () => toast(t('toasts.errorSuspendMerchant'), 'error') })}
                              disabled={suspend.isPending}
                              className="text-xs px-2.5 py-1 bg-danger/10 text-danger font-semibold rounded-lg hover:bg-danger/20 transition-colors disabled:opacity-50"
                            >
                              {t('adminMerchants.btnSuspend')}
                            </button>
                          )}
                          {m.status === 'suspended' && (
                            <button
                              onClick={() => activate.mutate(m.id, { onError: () => toast(t('toasts.errorActivateMerchant'), 'error') })}
                              disabled={activate.isPending}
                              className="text-xs px-2.5 py-1 bg-green/10 text-green font-semibold rounded-lg hover:bg-green/20 transition-colors disabled:opacity-50"
                            >
                              {t('adminMerchants.btnActivate')}
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
