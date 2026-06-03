import { useState } from 'react'
import { useAdminCustomers, useSuspendUser, useActivateUser } from '@/features/admin/useAdmin'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { Search, ShieldOff, ShieldCheck, Download } from 'lucide-react'
import { useT } from '@/i18n/useT'

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
  const { t, lang } = useT()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data: customers = [], isLoading } = useAdminCustomers(search)
  const suspendUser = useSuspendUser()
  const activateUser = useActivateUser()
  const localeStr = lang === 'vi' ? 'vi-VN' : 'en-US'

  const paginated = customers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <PageHeader
        title={t('adminCustomers.title')}
        subtitle={t('adminCustomers.subtitle').replace('{n}', String(customers.length))}
        actions={
          <button
            onClick={() => downloadCsv('/admin/customers/export', 'customers.csv')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-border text-ink-soft rounded-xl text-sm font-semibold hover:border-green hover:text-green transition-colors"
          >
            <Download size={15} />
            {t('adminCustomers.exportCsv')}
          </button>
        }
      />
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            type="text"
            placeholder={t('adminCustomers.searchPlaceholder')}
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
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminCustomers.thId')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminCustomers.thName')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminCustomers.thEmail')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminCustomers.thPhone')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminCustomers.thOrders')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminCustomers.thTotalSpend')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminCustomers.thStatus')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminCustomers.thCreatedAt')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminCustomers.thActions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-ink-mute text-sm">
                    {t('adminCustomers.empty')}
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
                      {c.total_spend.toLocaleString(localeStr)}₫
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.is_active ? 'bg-green/10 text-green' : 'bg-danger/10 text-danger'
                      }`}>
                        {c.is_active ? t('adminCustomers.statusActive') : t('adminCustomers.statusLocked')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-mute font-mono">
                      {new Date(c.created_at).toLocaleDateString(localeStr)}
                    </td>
                    <td className="px-4 py-3">
                      {c.is_active ? (
                        <button
                          onClick={() => suspendUser.mutate(c.id)}
                          disabled={suspendUser.isPending}
                          title={t('adminCustomers.suspendTitle')}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-danger/10 text-danger font-semibold rounded-lg hover:bg-danger/20 transition-colors disabled:opacity-50"
                        >
                          <ShieldOff size={11} />
                          {t('adminCustomers.btnSuspend')}
                        </button>
                      ) : (
                        <button
                          onClick={() => activateUser.mutate(c.id)}
                          disabled={activateUser.isPending}
                          title={t('adminCustomers.activateTitle')}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-green/10 text-green font-semibold rounded-lg hover:bg-green/20 transition-colors disabled:opacity-50"
                        >
                          <ShieldCheck size={11} />
                          {t('adminCustomers.btnActivate')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {customers.length > PAGE_SIZE && (
            <div className="p-4">
              <Pagination page={page} pageSize={PAGE_SIZE} total={customers.length} onPage={setPage} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
