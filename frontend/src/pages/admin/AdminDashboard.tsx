import { useAdminDashboardFull, useIntegrations, useRevenueReport, useRevenueByOrigin } from '@/features/admin/useAdmin'
import { KpiCard } from '@/components/ui/KpiCard'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Link } from 'react-router-dom'
import { useT } from '@/i18n/useT'

function statusToBadge(status: string) {
  if (status === 'pending') return 'pending'
  if (status === 'processing') return 'processing'
  if (status === 'shipped') return 'shipped'
  if (status === 'delivered') return 'delivered'
  return 'default'
}

export function AdminDashboard() {
  const { t, lang } = useT()
  const { data: dashboard, isLoading } = useAdminDashboardFull()
  const { data: integrations } = useIntegrations()
  const { data: revenueReport } = useRevenueReport()
  const { data: originData = [] } = useRevenueByOrigin()

  const localeStr = lang === 'vi' ? 'vi-VN' : 'en-US'

  const chartData: { month: string; val: number; projected?: boolean }[] =
    revenueReport
      ? revenueReport.months.map((m, i) => ({
          month: m,
          val: (revenueReport.values[i] ?? 0) / 1_000_000,
        }))
      : []
  const maxVal = chartData.length > 0 ? Math.max(...chartData.map((d) => d.val)) : 1

  const topMerchants = dashboard?.top_merchants ?? []
  const recentOrders = dashboard?.recent_orders ?? []

  const now = new Date()
  const dateLabel = now.toLocaleDateString(localeStr, { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeLabel = now.toLocaleTimeString(localeStr, { hour: '2-digit', minute: '2-digit' })

  const gmvPrev = dashboard?.gmv_prev_month ?? 0
  const gmvCurr = dashboard?.gmv_total ?? 0
  const gmvGrowth = gmvPrev > 0 ? ((gmvCurr - gmvPrev) / gmvPrev * 100).toFixed(1) : null
  const gmvDelta = gmvGrowth !== null
    ? t('adminDashboard.gmvGrowthLabel').replace('{n}', `${Number(gmvGrowth) >= 0 ? '+' : ''}${gmvGrowth}`)
    : t('adminDashboard.gmvFirstMonth')
  const gmvDeltaType: 'up' | 'down' = gmvGrowth !== null && Number(gmvGrowth) >= 0 ? 'up' : 'down'

  const maxOriginRevenue = Math.max(...originData.map((o) => o.revenue), 1)
  const regionRows = originData.length > 0
    ? originData.slice(0, 5).map((o) => ({
        name: o.origin,
        pct: Math.round((o.revenue / maxOriginRevenue) * 100),
        val: `₫${(o.revenue / 1_000_000).toFixed(1)}M`,
      }))
    : []

  return (
    <div>
      <PageHeader
        title={t('adminDashboard.title')}
        subtitle={t('adminDashboard.subtitle').replace('{time}', timeLabel).replace('{date}', dateLabel)}
        actions={
          <Link
            to="/admin/reports"
            className="px-4 py-2 text-sm font-semibold text-green border border-green/30 rounded-xl hover:bg-green/5 transition-colors no-underline"
          >
            {t('adminDashboard.viewReport')}
          </Link>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={t('adminDashboard.kpiGmv')}
          value={
            isLoading
              ? '—'
              : `₫${((dashboard?.gmv_total ?? 0) / 1_000_000).toFixed(0)}M`
          }
          delta={gmvDelta}
          deltaType={gmvDeltaType}
        />
        <KpiCard
          label={t('adminDashboard.kpiOrders')}
          value={isLoading ? '—' : (dashboard?.total_orders ?? 0).toLocaleString(localeStr)}
          delta={
            dashboard?.orders_yesterday !== undefined
              ? t('adminDashboard.ordersYesterday').replace('{n}', String(dashboard.orders_yesterday))
              : t('adminDashboard.loading')
          }
          deltaType="up"
        />
        <KpiCard
          label={t('adminDashboard.kpiMerchants')}
          value={isLoading ? '—' : `${dashboard?.total_merchants ?? 0}`}
          delta={
            dashboard?.new_merchants_week !== undefined
              ? t('adminDashboard.merchantsNew').replace('{n}', String(dashboard.new_merchants_week))
              : '—'
          }
          deltaType="up"
        />
        <KpiCard
          label={t('adminDashboard.kpiPending')}
          value={isLoading ? '—' : (dashboard?.pending_approvals ?? 0)}
          delta={t('adminDashboard.pendingProcess')}
          deltaType="warn"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue bar chart */}
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              {t('adminDashboard.revenueChart')}
            </h2>
            <Link to="/admin/reports" className="text-xs text-green font-medium hover:underline no-underline">
              {t('adminDashboard.viewReport')}
            </Link>
          </div>

          {chartData.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="flex items-end gap-1.5 h-[140px] px-1 min-w-[360px]">
                {chartData.map((d) => (
                  <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[9px] text-ink-mute" style={{ fontFamily: 'var(--font-mono)' }}>
                      {d.val.toFixed(0)}M
                    </span>
                    <div
                      className="w-full rounded-t-[5px] transition-opacity hover:opacity-80 cursor-default"
                      style={{
                        height: `${(d.val / maxVal) * 100}%`,
                        background: d.projected ? 'rgba(201,169,97,0.45)' : 'var(--color-green)',
                      }}
                    />
                    <span
                      className="text-[9px] text-ink-mute whitespace-nowrap"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {d.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[140px] flex items-center justify-center text-ink-mute text-sm">
              {isLoading ? t('adminDashboard.loading') : t('adminDashboard.noData')}
            </div>
          )}

          <div className="flex gap-4 mt-2.5 text-[11px] text-ink-mute">
            <span>
              <span className="inline-block w-2.5 h-2.5 rounded-[2px] mr-1 align-middle" style={{ background: 'var(--color-green)' }} />
              {t('adminDashboard.actual')}
            </span>
            <span>
              <span className="inline-block w-2.5 h-2.5 rounded-[2px] mr-1 align-middle bg-gold/45" />
              {t('adminDashboard.projected')}
            </span>
          </div>
        </div>

        {/* Today stats + Pending approvals */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              {t('adminDashboard.today')}
            </h2>
            <Badge variant="processing">{t('adminDashboard.live')}</Badge>
          </div>

          <div className="space-y-3">
            {regionRows.length > 0 ? (
              regionRows.map((r) => (
                <div key={r.name} className="flex items-center gap-2.5">
                  <span className="text-[12.5px] font-medium flex-1 truncate">{r.name}</span>
                  <div className="flex-[2] h-1.5 bg-cream-dark rounded-full overflow-hidden">
                    <div className="h-full bg-green rounded-full" style={{ width: `${r.pct}%` }} />
                  </div>
                  <span
                    className="text-[11px] text-ink-soft min-w-[60px] text-right"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {r.val}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-ink-mute text-center py-4">{t('adminDashboard.noRegion')}</div>
            )}
          </div>

          {/* Pending approvals mini */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">
                {t('adminDashboard.pendingApprovals')}
              </div>
              {(dashboard?.pending_approvals ?? 0) > 0 && (
                <Link to="/admin/approvals" className="text-[10px] text-green font-semibold no-underline hover:underline">
                  {t('adminDashboard.pendingItems').replace('{n}', String(dashboard?.pending_approvals))}
                </Link>
              )}
            </div>
            {(dashboard?.pending_approvals ?? 0) === 0 ? (
              <div className="text-xs text-ink-mute">{t('adminDashboard.noPending')}</div>
            ) : (
              <Link
                to="/admin/approvals"
                className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl no-underline hover:bg-amber-100 transition-colors"
              >
                <span className="text-amber-600 font-bold text-sm">{dashboard?.pending_approvals}</span>
                <span className="text-xs text-amber-700 font-medium">{t('adminDashboard.pendingLabel')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top merchants */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              {t('adminDashboard.topMerchants')}
            </h2>
            <Link to="/admin/merchants" className="text-xs text-green font-medium no-underline hover:underline">
              {t('adminDashboard.viewAll')}
            </Link>
          </div>
          <div className="space-y-2">
            {topMerchants.length === 0 ? (
              <div className="text-sm text-ink-mute text-center py-4">
                {isLoading ? t('adminDashboard.loading') : t('adminDashboard.noData')}
              </div>
            ) : (
              topMerchants.map((m, idx) => (
                <Link
                  key={m.id}
                  to={`/admin/merchants`}
                  className="flex items-center gap-2.5 p-2.5 bg-cream rounded-xl hover:bg-cream-dark transition-colors no-underline text-ink"
                >
                  <span
                    className="text-[18px] font-medium text-border w-6 text-center"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <strong className="block text-[12.5px] font-semibold truncate">{m.name}</strong>
                    <span className="text-[11px] text-ink-mute">
                      {t('adminDashboard.ordersCount').replace('{n}', String(m.orders))}
                    </span>
                  </div>
                  <div className="text-right">
                    <strong
                      className="block text-sm text-green"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      ₫{(m.revenue / 1_000_000).toFixed(0)}M
                    </strong>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              {t('adminDashboard.recentOrders')}
            </h2>
            <Link to="/admin/orders" className="text-xs text-green font-medium no-underline hover:underline">
              {t('adminDashboard.viewAll')}
            </Link>
          </div>
          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <div className="text-sm text-ink-mute text-center py-4">
                {isLoading ? t('adminDashboard.loading') : t('adminDashboard.noOrders')}
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-ink">ORD-{order.id}</div>
                    <div className="text-[11px] text-ink-mute">{order.customer_name}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-sm font-medium text-green"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      ₫{(order.total_amount / 1_000_000).toFixed(1)}M
                    </div>
                    <Badge variant={statusToBadge(order.status) as Parameters<typeof Badge>[0]['variant']} className="text-[9px]">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Integration health */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              {t('adminDashboard.integrationsTitle')}
            </h2>
            <Link to="/admin/integrations" className="text-xs text-green font-medium no-underline hover:underline">
              {t('adminDashboard.viewDetails')}
            </Link>
          </div>
          {integrations ? (
            <div className="space-y-2.5">
              {integrations.map((int) => (
                <div key={int.name} className="flex items-center gap-2.5 text-[12.5px]">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      int.status === 'online'
                        ? 'bg-success'
                        : int.status === 'degraded'
                        ? 'bg-warning'
                        : 'bg-danger'
                    }`}
                  />
                  <span className="flex-1 font-medium">{int.name}</span>
                  <span
                    className="text-[11px] text-ink-mute"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {int.uptime}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {[
                { name: 'Vietcombank VietQR', status: 'online', uptime: 99.9 },
                { name: 'DHL Express API', status: 'online', uptime: 99.7 },
                { name: 'Messenger Webhook', status: 'online', uptime: 98.5 },
                { name: 'Zalo OA API', status: 'degraded', uptime: 95.2 },
                { name: 'AI Chatbot', status: 'online', uptime: 99.1 },
              ].map((int) => (
                <div key={int.name} className="flex items-center gap-2.5 text-[12.5px]">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      int.status === 'online' ? 'bg-success' : 'bg-warning'
                    }`}
                  />
                  <span className="flex-1 font-medium">{int.name}</span>
                  <span
                    className="text-[11px] text-ink-mute"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {int.uptime}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
