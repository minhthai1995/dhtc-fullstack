import { useAdminWithdrawals, useApproveWithdrawal, useRejectWithdrawal } from '@/features/admin/useAdmin'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { useT } from '@/i18n/useT'

export function AdminWithdrawals() {
  const { t, lang } = useT()
  const { data: withdrawals = [], isLoading } = useAdminWithdrawals()
  const approve = useApproveWithdrawal()
  const reject = useRejectWithdrawal()

  const localeStr = lang === 'vi' ? 'vi-VN' : 'en-US'
  const pending = withdrawals.filter(w => w.status === 'pending')

  const statusBadge = (status: string) => {
    if (status === 'completed') return <Badge variant="delivered">{t('adminWithdrawals.statusApproved')}</Badge>
    if (status === 'rejected') return <Badge variant="cancelled">{t('adminWithdrawals.statusRejected')}</Badge>
    return <Badge variant="pending">{t('adminWithdrawals.statusPending')}</Badge>
  }

  return (
    <div>
      <PageHeader
        title={t('adminWithdrawals.title')}
        subtitle={t('adminWithdrawals.subtitle').replace('{n}', String(pending.length))}
      />
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : withdrawals.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-16 text-center text-ink-mute">
          {t('adminWithdrawals.empty')}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-cream-dark border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminWithdrawals.thMerchant')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminWithdrawals.thAmount')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminWithdrawals.thBank')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminWithdrawals.thStatus')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminWithdrawals.thDate')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminWithdrawals.thActions')}</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id} className="border-b border-border last:border-0 hover:bg-cream/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-ink">{w.merchant_name}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green" style={{ fontFamily: 'var(--font-display)' }}>
                      {w.amount.toLocaleString(localeStr)}₫
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[220px]">
                      {w.bank_name || w.bank_account ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-ink truncate">{w.bank_name ?? '—'}</div>
                          <div className="font-mono text-ink-mute truncate">{w.bank_account ?? '—'}</div>
                        </div>
                      ) : (
                        <span className="text-ink-mute">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{statusBadge(w.status)}</td>
                    <td className="px-4 py-3 text-xs text-ink-mute font-mono">
                      {new Date(w.created_at).toLocaleDateString(localeStr)}
                    </td>
                    <td className="px-4 py-3">
                      {w.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approve.mutate(w.id)}
                            disabled={approve.isPending || reject.isPending}
                            className="text-xs px-2.5 py-1 bg-green/10 text-green font-semibold rounded-lg hover:bg-green/20 transition-colors disabled:opacity-50"
                          >
                            {t('adminWithdrawals.btnApprove')}
                          </button>
                          <button
                            onClick={() => reject.mutate(w.id)}
                            disabled={approve.isPending || reject.isPending}
                            className="text-xs px-2.5 py-1 bg-danger/10 text-danger font-semibold rounded-lg hover:bg-danger/20 transition-colors disabled:opacity-50"
                          >
                            {t('adminWithdrawals.btnReject')}
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
