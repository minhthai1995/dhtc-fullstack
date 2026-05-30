import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { useSellerReturns, useApproveReturn, useRejectReturn } from '@/features/returns/useReturns'
import { CheckCircle, XCircle } from 'lucide-react'
import { useT } from '@/i18n/useT'

const STATUS_BADGE: Record<string, 'pending' | 'active' | 'cancelled'> = {
  pending: 'pending',
  approved: 'active',
  rejected: 'cancelled',
}

const STATUS_KEY: Record<string, string> = {
  pending: 'sellerReturns.statusPending',
  approved: 'sellerReturns.statusApproved',
  rejected: 'sellerReturns.statusRejected',
}

export function SellerReturns() {
  const { t, lang } = useT()
  const { data: returns = [], isLoading } = useSellerReturns()
  const approve = useApproveReturn()
  const reject = useRejectReturn()
  const [noteModal, setNoteModal] = useState<{ returnId: number; action: 'approve' | 'reject' } | null>(null)
  const [note, setNote] = useState('')

  function handleAction() {
    if (!noteModal) return
    const fn = noteModal.action === 'approve' ? approve : reject
    fn.mutate({ returnId: noteModal.returnId, note: note || undefined }, {
      onSuccess: () => { setNoteModal(null); setNote('') }
    })
  }

  return (
    <div>
      <PageHeader title={t('sellerReturns.title')} subtitle={t('sellerReturns.subtitle').replace('{n}', String(returns.length))} />
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : returns.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-ink-mute text-sm">
          {t('sellerReturns.noReturns')}
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <div key={r.id} className="bg-white border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-green font-mono text-sm">{t('sellerReturns.orderPrefix')}{r.order_id}</span>
                    <Badge variant={STATUS_BADGE[r.status]}>{t(STATUS_KEY[r.status])}</Badge>
                  </div>
                  <p className="text-sm text-ink mt-1">{r.reason}</p>
                  {r.seller_note && (
                    <p className="text-xs text-ink-mute mt-1 italic">{t('sellerReturns.noteLabel')} {r.seller_note}</p>
                  )}
                  <p className="text-[10px] text-ink-mute font-mono mt-1">
                    {new Date(r.created_at).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                  </p>
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setNoteModal({ returnId: r.id, action: 'approve' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green text-white text-xs font-semibold rounded-xl hover:bg-green/90 transition-colors"
                    >
                      <CheckCircle size={13} /> {t('sellerReturns.approve')}
                    </button>
                    <button
                      onClick={() => setNoteModal({ returnId: r.id, action: 'reject' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 text-danger text-xs font-semibold rounded-xl hover:bg-danger/20 transition-colors"
                    >
                      <XCircle size={13} /> {t('sellerReturns.reject')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {noteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-ink mb-3">
              {noteModal.action === 'approve' ? t('sellerReturns.modalApprove') : t('sellerReturns.modalReject')}
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('sellerReturns.notePlaceholder')}
              className="w-full border border-border rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:border-green"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => { setNoteModal(null); setNote('') }}
                className="px-4 py-2 border border-border rounded-xl text-sm font-semibold text-ink-soft"
              >
                {t('sellerReturns.cancel')}
              </button>
              <button
                onClick={handleAction}
                disabled={approve.isPending || reject.isPending}
                className={`px-4 py-2 text-white rounded-xl text-sm font-semibold disabled:opacity-50 ${noteModal.action === 'approve' ? 'bg-green' : 'bg-danger'}`}
              >
                {t('sellerReturns.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
