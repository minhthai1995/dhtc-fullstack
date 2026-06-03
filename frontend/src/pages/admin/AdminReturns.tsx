import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { useAdminReturns, useAdminApproveReturn, useAdminRejectReturn } from '@/features/returns/useReturns'
import type { ReturnRequestRead } from '@/features/returns/returns.api'
import { useT } from '@/i18n/useT'

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'

interface ActionState {
  type: 'approve' | 'reject'
  returnId: number
}

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
  const approve = useAdminApproveReturn()
  const reject = useAdminRejectReturn()
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [action, setAction] = useState<ActionState | null>(null)
  const [note, setNote] = useState('')
  const localeStr = lang === 'vi' ? 'vi-VN' : 'en-US'

  const filtered: ReturnRequestRead[] = filter === 'all'
    ? returns
    : returns.filter((r) => r.status === filter)

  const isPending = approve.isPending || reject.isPending

  function openAction(type: 'approve' | 'reject', returnId: number) {
    setNote('')
    setAction({ type, returnId })
  }

  function closeAction() {
    setAction(null)
    setNote('')
  }

  function confirmAction() {
    if (!action) return
    const vars = { returnId: action.returnId, note: note.trim() || undefined }
    if (action.type === 'approve') {
      approve.mutate(vars, { onSuccess: closeAction })
    } else {
      reject.mutate(vars, { onSuccess: closeAction })
    }
  }

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
        <div className="bg-white border border-border rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-cream">
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thId')}</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thOrder')}</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thCustomerId')}</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thReason')}</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thStatus')}</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thSellerNote')}</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thCreatedAt')}</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">{t('adminReturns.thActions')}</th>
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
                  <td className="px-4 py-3">
                    {r.status === 'pending' ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openAction('approve', r.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-green/10 text-green hover:bg-green/20 transition-colors"
                        >
                          {t('adminReturns.approve')}
                        </button>
                        <button
                          onClick={() => openAction('reject', r.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          {t('adminReturns.reject')}
                        </button>
                      </div>
                    ) : (
                      <span className="text-ink-mute/40 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action confirmation modal */}
      {action && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) closeAction() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <p className="text-sm font-semibold text-ink mb-4">
              {t(action.type === 'approve' ? 'adminReturns.confirmApprove' : 'adminReturns.confirmReject')}
              <span className="font-mono text-green">{action.returnId}</span>
            </p>
            <label className="block text-xs text-ink-mute mb-1">{t('adminReturns.noteLabel')}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-ink placeholder-ink-mute/50 focus:outline-none focus:border-green resize-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={closeAction}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-border text-ink-soft hover:bg-cream transition-colors"
              >
                {t('adminReturns.cancel')}
              </button>
              <button
                onClick={confirmAction}
                disabled={isPending}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors ${
                  action.type === 'approve'
                    ? 'bg-green hover:bg-green/90'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {isPending ? <Spinner /> : t('adminReturns.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
