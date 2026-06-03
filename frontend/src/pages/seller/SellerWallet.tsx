import { useState } from 'react'
import { useWallet, useWalletTransactions, useRequestWithdrawal } from '@/features/seller/useSeller'
import { useToast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Wallet, Download, CreditCard, Clock, X } from 'lucide-react'
import type { WalletTransactionRead } from '@/types/api'
import { useT } from '@/i18n/useT'


function txTypeBadge(type: WalletTransactionRead['type'], t: (k: string) => string) {
  switch (type) {
    case 'income': return <Badge variant="active">{t('sellerWallet.txTypeIncome')}</Badge>
    case 'payout': return <Badge variant="pending">{t('sellerWallet.txTypePayout')}</Badge>
    case 'fee': return <Badge variant="pending">{t('sellerWallet.txTypeFee')}</Badge>
    case 'refund': return <Badge variant="cancelled">{t('sellerWallet.txTypeRefund')}</Badge>
    default: return <Badge>{type}</Badge>
  }
}

export function SellerWallet() {
  const { t, lang } = useT()
  const toast = useToast()
  const { data: wallet } = useWallet()
  const { data: transactions } = useWalletTransactions()
  const requestWithdrawal = useRequestWithdrawal()
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawBank, setWithdrawBank] = useState('')
  const [withdrawAccount, setWithdrawAccount] = useState('')

  const w = wallet ?? { available_balance: 0, pending_balance: 0, total_withdrawn: 0 }
  const txList = transactions ?? []
  const localeStr = lang === 'vi' ? 'vi-VN' : 'en-US'

  const openWithdraw = () => {
    setWithdrawAmount('')
    setWithdrawBank(wallet?.last_bank_name ?? '')
    setWithdrawAccount(wallet?.last_bank_account ?? '')
    setShowWithdraw(true)
  }

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(withdrawAmount)
    if (!Number.isFinite(amount) || amount < 500000) return
    if (amount > (w.available_balance ?? 0)) return
    requestWithdrawal.mutate({ amount, bankName: withdrawBank, bankAccount: withdrawAccount }, {
      onSuccess: () => {
        setShowWithdraw(false)
        setWithdrawAmount('')
        setWithdrawAccount('')
      },
      onError: (err: unknown) => {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        toast(t('toasts.errorWithMsg').replace('{msg}', detail ?? ''), 'error')
      },
    })
  }

  return (
    <div>
      <PageHeader
        title={t('sellerWallet.title')}
        subtitle={t('sellerWallet.subtitle')}
        actions={
          <button
            onClick={openWithdraw}
            className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold hover:bg-green-soft transition-colors"
          >
            <Download size={15} />
            {t('sellerWallet.requestWithdrawal')}
          </button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Available balance */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, var(--color-green) 0%, var(--color-green-soft) 100%)' }}
        >
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>
            {t('sellerWallet.available')}
          </div>
          <div
            className="text-4xl font-medium mt-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cream)' }}
          >
            {(w.available_balance ?? 0).toLocaleString(localeStr)}₫
          </div>
          <div className="text-xs mt-1.5" style={{ color: 'rgba(245,239,224,0.7)' }}>
            {t('sellerWallet.readyVcb')}
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-6">
          <div className="text-[10px] text-ink-mute uppercase tracking-wider mb-2">{t('sellerWallet.pendingT3')}</div>
          <div
            className="text-3xl font-medium"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
          >
            ₫{((w.pending_balance ?? 0) / 1_000_000).toLocaleString(localeStr, { maximumFractionDigits: 2 })}<small className="text-lg">M</small>
          </div>
          <div className="text-xs text-ink-mute mt-1">{t('sellerWallet.ordersFinalizing')}</div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-6">
          <div className="text-[10px] text-ink-mute uppercase tracking-wider mb-2">{t('sellerWallet.withdrawnMonth')}</div>
          <div
            className="text-3xl font-medium text-ink"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ₫{((w.total_withdrawn ?? 0) / 1_000_000).toLocaleString(localeStr, { maximumFractionDigits: 1 })}<small className="text-lg">M</small>
          </div>
          <div className="text-xs text-green mt-1">{t('sellerWallet.withdrawalsCount')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Transaction history */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
                {t('sellerWallet.transactionHistory')}
              </h3>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-mute border border-border rounded-lg hover:border-green hover:text-green transition-colors">
                <Download size={12} />
                {t('sellerWallet.exportCsv')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-cream">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-mute">{t('sellerWallet.thDate')}</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-mute">{t('sellerWallet.thDescription')}</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-mute">{t('sellerWallet.thType')}</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-ink-mute">{t('sellerWallet.thAmount')}</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-ink-mute">{t('sellerWallet.thBalance')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {txList.map((tx) => (
                    <tr key={tx.id} className="hover:bg-cream/50 transition-colors">
                      <td className="px-4 py-3 text-[11px] font-mono text-ink-mute whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString(localeStr, { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink max-w-[200px] truncate">{tx.description}</td>
                      <td className="px-4 py-3">{txTypeBadge(tx.type, t)}</td>
                      <td className={`px-4 py-3 text-sm font-semibold font-mono text-right ${tx.amount > 0 ? 'text-green' : 'text-danger'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString(localeStr)}₫
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-right text-ink-mute">
                        {tx.balance_after.toLocaleString(localeStr)}₫
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Receiving account */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              {t('sellerWallet.receivingAccount')}
            </h3>
            {wallet?.last_bank_name && wallet?.last_bank_account ? (
              <div
                className="p-4 bg-cream rounded-xl"
                style={{ borderLeft: '3px solid var(--color-gold)' }}
              >
                <div className="text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-gold-deep)' }}>
                  {t('sellerWallet.lastUsedAccount')}
                </div>
                <div className="text-base font-medium mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {wallet.last_bank_name}
                </div>
                <div className="text-sm font-mono text-ink">{wallet.last_bank_account}</div>
                <div className="text-xs text-ink-mute mt-0.5">{t('sellerWallet.fromLastWithdrawal')}</div>
              </div>
            ) : (
              <div className="p-4 bg-cream rounded-xl text-xs text-ink-mute italic">
                {t('sellerWallet.noReceivingAccount')}
              </div>
            )}
            <p className="mt-3 text-[11px] text-ink-mute leading-relaxed flex items-start gap-1.5">
              <CreditCard size={12} className="mt-0.5 flex-shrink-0" />
              {t('sellerWallet.bankPerWithdrawalHint')}
            </p>
          </div>

          {/* Payout cycle */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={15} className="text-green" />
              <h3 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
                {t('sellerWallet.payoutCycle')}
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-semibold text-ink">{t('sellerWallet.t3Auto')}</div>
                <div className="text-xs text-ink-mute mt-0.5">
                  {t('sellerWallet.t3Desc')}
                </div>
              </div>
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-ink-mute text-xs">{t('sellerWallet.minWithdraw')}</span>
                  <span className="font-semibold text-xs font-mono">₫500,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-mute text-xs">{t('sellerWallet.withdrawTime')}</span>
                  <span className="font-semibold text-xs">{t('sellerWallet.withdrawHours')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-mute text-xs">{t('sellerWallet.withdrawFee')}</span>
                  <span className="font-semibold text-xs text-green">{t('sellerWallet.feeFree')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-green" />
                <h3 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('sellerWallet.modalTitle')}
                </h3>
              </div>
              <button onClick={() => setShowWithdraw(false)} className="text-ink-mute hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleWithdraw} className="p-5 space-y-4">
              <div className="p-4 bg-green/5 rounded-xl border border-green/20">
                <div className="text-xs text-ink-mute mb-1">{t('sellerWallet.availableBalanceLabel')}</div>
                <div className="text-lg font-semibold text-green font-mono">
                  {(w.available_balance ?? 0).toLocaleString(localeStr)}₫
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  {t('sellerWallet.amountLabel')} <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                  min="500000"
                  max={(w.available_balance ?? 0)}
                  step="1000"
                  placeholder="500000"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
                />
                <p className="text-xs text-ink-mute mt-1">{t('sellerWallet.amountHint')}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  {t('sellerWallet.bankLabel')} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={withdrawBank}
                  onChange={(e) => setWithdrawBank(e.target.value)}
                  required
                  placeholder={t('sellerWallet.bankPlaceholder')}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  {t('sellerWallet.accountLabel')} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={withdrawAccount}
                  onChange={(e) => setWithdrawAccount(e.target.value)}
                  required
                  placeholder={t('sellerWallet.accountPlaceholder')}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-cream focus:outline-none focus:border-green transition-all font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={requestWithdrawal.isPending}
                  className="flex-1 py-2.5 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-soft disabled:opacity-60 transition-colors"
                >
                  {requestWithdrawal.isPending ? t('sellerWallet.processing') : t('sellerWallet.confirmBtn')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdraw(false)}
                  className="flex-1 py-2.5 border border-border rounded-xl font-semibold text-sm text-ink-mute hover:border-ink transition-colors"
                >
                  {t('sellerWallet.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
