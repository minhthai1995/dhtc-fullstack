import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { useAdminReturns } from '@/features/returns/useReturns'
import type { ReturnRequestRead } from '@/features/returns/returns.api'
import { useT } from '@/i18n/useT'

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'

const STATUS_KEY: Record<string, string> = {
  pending: 'adminReturns.statusPending',
  approved: 'adminReturns.statusApproved',
  rejected: 'adminReturns.statusRejected',
}

const STATUS_BADGE: Record<string, 'pending' | 'active' | 'cancelled'> = {
  pending: 'pending',
  approved: 'active',
  rejected: 'cancelled',
}

const FILTER_OPTIONS: { key: FilterStatus; labelKey: string }[] = [
  { key: 'all', labelKey: 'adminReturns.filterAll' },
  { key: 'pending', labelKey: 'adminReturns.filterPending' },
  { key: 'approved', labelKey: 'adminReturns.filterApproved' },
  { key: 'rejected', labelKey: 'adminReturns.filterRejected' },
]

export function AdminReturns() {
  const { t, lang } = useT()
  const { data: returns = [], isLoading } = useAdminReturns()
  const [filter, setFilter] = useState<FilterStatus>('all')
  const localeStr = lang === 'vi' ? 'vi-VN' : 'en-US'

  const filtered: ReturnRequestRead[] = filter === 'all'
    ? returns
    : returns.filter((r) => r.status === filter)

  return (
    <div>
      <PageHeader
        title={t('adminReturns.title')}
        subtitle={t('adminReturns.subtitle')
          .replace('{filtered}', String(filtered.length))
          .replace('{total}', String(returns.length))}
      />

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
            {t(opt.labelKey)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-ink-mute text-sm">
          {t('adminReturns.empty')}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-cream">
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thId')}</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thOrder')}</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thCustomerId')}</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thReason')}</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thStatus')}</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thSellerNote')}</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thCreatedAt')}</th>
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
                    <Badge variant={STATUS_BADGE[r.status]}>{t(STATUS_KEY[r.status])}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-mute max-w-[150px]">
                    {r.seller_note ? (
                      <span className="line-clamp-2 italic" title={r.seller_note}>{r.seller_note}</span>
                    ) : (
                      <span className="text-ink-mute/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[11px] font-mono text-ink-mute whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString(localeStr)}
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
