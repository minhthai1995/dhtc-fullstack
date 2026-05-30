import { useRevenueReport, useAdminDashboardFull, useRevenueByOrigin } from '@/features/admin/useAdmin'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { Download, TrendingUp } from 'lucide-react'
import { useT } from '@/i18n/useT'

export function AdminReports() {
  const { t, lang } = useT()
  const { data: report } = useRevenueReport()
  const { data: dashboard } = useAdminDashboardFull()
  const { data: originData = [] } = useRevenueByOrigin()
  const localeStr = lang === 'vi' ? 'vi-VN' : 'en-US'

  const chartData = report
    ? report.months.map((month, i) => ({
        month,
        gmv: report.values[i],
        orders: report.orders[i] ?? 0,
      }))
    : []

  const maxGmv = Math.max(...chartData.map((d) => d.gmv), 1)

  const lastGmv = chartData.at(-1)?.gmv ?? 0
  const prevGmv = chartData.at(-2)?.gmv ?? 0
  const growthPct = prevGmv > 0 ? ((lastGmv - prevGmv) / prevGmv * 100).toFixed(1) : null
  const growthLabel = growthPct !== null
    ? t('adminReports.growthVsPrev')
        .replace('{sign}', Number(growthPct) >= 0 ? '+' : '')
        .replace('{pct}', growthPct)
    : t('adminReports.noGrowthData')
  const growthType: 'up' | 'down' = growthPct !== null && Number(growthPct) >= 0 ? 'up' : 'down'

  // KPI computations
  const totalGmv = report ? report.values.reduce((a, b) => a + b, 0) : 0
  const totalOrders = report?.orders.reduce((a, b) => a + b, 0) ?? 0
  const avgOrder = totalOrders > 0 ? totalGmv / totalOrders : 0

  const gmvDisplayValue = lastGmv >= 1_000_000_000
    ? t('adminReports.gmvBillion').replace('{n}', (lastGmv / 1_000_000_000).toFixed(2))
    : t('adminReports.gmvMillion').replace('{n}', (lastGmv / 1_000_000).toFixed(0))

  // Region data from API
  const maxOriginRevenue = Math.max(...originData.map((o) => o.revenue), 1)

  return (
    <div>
      <PageHeader
        title={t('adminReports.title')}
        subtitle={t('adminReports.subtitle').replace('{date}', new Date().toLocaleDateString(localeStr))}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-semibold text-ink-soft hover:border-green hover:text-green transition-colors">
            <Download size={15} />
            {t('adminReports.exportReport')}
          </button>
        }
      />

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={t('adminReports.kpiGmvLastMonth')}
          value={lastGmv > 0 ? gmvDisplayValue : '—'}
          delta={growthLabel}
          deltaType={growthType}
        />
        <KpiCard
          label={t('adminReports.kpiTotalOrders')}
          value={(dashboard?.total_orders ?? 0).toLocaleString(localeStr)}
          delta={dashboard?.orders_yesterday !== undefined
            ? t('adminReports.deltaOrdersYesterday').replace('{n}', String(dashboard.orders_yesterday))
            : '—'}
          deltaType="up"
        />
        <KpiCard
          label={t('adminReports.kpiAvgOrder')}
          value={avgOrder > 0 ? `₫${(avgOrder / 1_000).toFixed(0)}K` : '—'}
          delta={t('adminReports.deltaAvgAll')}
          deltaType="up"
        />
        <KpiCard
          label={t('adminReports.kpiMerchants')}
          value={dashboard?.total_merchants ?? '—'}
          delta={dashboard?.new_merchants_week !== undefined
            ? t('adminReports.deltaNewMerchantsWeek').replace('{n}', String(dashboard.new_merchants_week))
            : '—'}
          deltaType="up"
        />
      </div>

      {/* Main chart */}
      <div className="bg-white border border-border rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              {t('adminReports.chartTitle')}
            </h2>
            <p className="text-xs text-ink-mute mt-0.5">{t('adminReports.chartSubtitle')}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-success font-semibold">
            <TrendingUp size={14} />
            {growthLabel}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex items-end gap-2 h-[180px] min-w-[600px]">
            {chartData.map((d) => (
              <div key={d.month} className="flex flex-col items-center gap-1.5 flex-1 group">
                <span className="text-[9px] text-ink-mute opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: 'var(--font-mono)' }}>
                  {d.gmv}M
                </span>
                <div
                  className="w-full rounded-t-[4px] bg-green cursor-default hover:opacity-80 transition-opacity"
                  style={{ height: `${(d.gmv / maxGmv) * 100}%` }}
                  title={`${d.month}: ${d.gmv}M`}
                />
                <span className="text-[8px] text-ink-mute whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)' }}>
                  {d.month.replace('Tháng ', 'T').replace('/2025', '').replace('/2026', '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue by region */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            {t('adminReports.regionTitle')}
          </h2>
          <div className="space-y-4">
            {originData.length > 0 ? originData.map((r, i) => (
              <div key={r.origin} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-ink-mute w-4">{i + 1}</span>
                <span className="flex-1 text-sm font-medium">{r.origin}</span>
                <div className="flex-[2] h-2 bg-cream-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green rounded-full transition-all"
                    style={{ width: `${Math.round(r.revenue / maxOriginRevenue * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-ink-soft min-w-[64px] text-right">
                  ₫{(r.revenue / 1_000_000).toFixed(1)}M
                </span>
              </div>
            )) : (
              <div className="text-sm text-ink-mute text-center py-4">{t('adminReports.regionEmpty')}</div>
            )}
          </div>
        </div>

        {/* Monthly table */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            {t('adminReports.monthlyTitle')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-2 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminReports.thMonth')}</th>
                  <th className="text-right pb-2 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminReports.thGmv')}</th>
                  <th className="text-right pb-2 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('adminReports.thOrders')}</th>
                </tr>
              </thead>
              <tbody>
                {[...chartData].reverse().slice(0, 6).map((d) => (
                  <tr key={d.month} className="border-b border-border last:border-0">
                    <td className="py-2 text-ink-soft text-xs">{d.month}</td>
                    <td className="py-2 text-right font-mono text-sm text-green font-medium">
                      {d.gmv.toLocaleString(localeStr)}M
                    </td>
                    <td className="py-2 text-right text-xs text-ink-mute font-mono">{d.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
