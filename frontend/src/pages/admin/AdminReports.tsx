import { useRevenueReport, useAdminDashboardFull, useRevenueByOrigin } from '@/features/admin/useAdmin'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { Download, TrendingUp } from 'lucide-react'

export function AdminReports() {
  const { data: report } = useRevenueReport()
  const { data: dashboard } = useAdminDashboardFull()
  const { data: originData = [] } = useRevenueByOrigin()

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
    ? `${Number(growthPct) >= 0 ? '+' : ''}${growthPct}% so tháng trước`
    : 'Chưa có dữ liệu'
  const growthType: 'up' | 'down' = growthPct !== null && Number(growthPct) >= 0 ? 'up' : 'down'

  // KPI computations
  const totalGmv = report ? report.values.reduce((a, b) => a + b, 0) : 0
  const totalOrders = report?.orders.reduce((a, b) => a + b, 0) ?? 0
  const avgOrder = totalOrders > 0 ? totalGmv / totalOrders : 0

  const gmvDisplayValue = lastGmv >= 1_000_000_000
    ? `₫${(lastGmv / 1_000_000_000).toFixed(2)} tỷ`
    : `₫${(lastGmv / 1_000_000).toFixed(0)} triệu`

  // Region data from API
  const maxOriginRevenue = Math.max(...originData.map((o) => o.revenue), 1)

  return (
    <div>
      <PageHeader
        title="Báo cáo doanh thu"
        subtitle={`Dữ liệu cập nhật đến ${new Date().toLocaleDateString('vi-VN')}`}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-semibold text-ink-soft hover:border-green hover:text-green transition-colors">
            <Download size={15} />
            Xuất báo cáo
          </button>
        }
      />

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="GMV tháng gần nhất"
          value={lastGmv > 0 ? gmvDisplayValue : '—'}
          delta={growthLabel}
          deltaType={growthType}
        />
        <KpiCard
          label="Tổng đơn hàng"
          value={(dashboard?.total_orders ?? 0).toLocaleString('vi-VN')}
          delta={dashboard?.orders_yesterday !== undefined ? `${dashboard.orders_yesterday} đơn hôm qua` : '—'}
          deltaType="up"
        />
        <KpiCard
          label="Giá trị TB/đơn"
          value={avgOrder > 0 ? `₫${(avgOrder / 1_000).toFixed(0)}K` : '—'}
          delta="Trung bình tất cả đơn"
          deltaType="up"
        />
        <KpiCard
          label="Tiểu thương"
          value={dashboard?.total_merchants ?? '—'}
          delta={dashboard?.new_merchants_week !== undefined ? `${dashboard.new_merchants_week} mới tuần này` : '—'}
          deltaType="up"
        />
      </div>

      {/* Main chart */}
      <div className="bg-white border border-border rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              GMV 12 tháng gần nhất
            </h2>
            <p className="text-xs text-ink-mute mt-0.5">Đơn vị: triệu VND</p>
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
            Doanh thu theo khu vực
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
              <div className="text-sm text-ink-mute text-center py-4">Chưa có dữ liệu vùng</div>
            )}
          </div>
        </div>

        {/* Monthly table */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Chi tiết theo tháng
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-2 text-xs font-bold text-ink-mute uppercase tracking-wider">Tháng</th>
                  <th className="text-right pb-2 text-xs font-bold text-ink-mute uppercase tracking-wider">GMV</th>
                  <th className="text-right pb-2 text-xs font-bold text-ink-mute uppercase tracking-wider">Đơn</th>
                </tr>
              </thead>
              <tbody>
                {[...chartData].reverse().slice(0, 6).map((d) => (
                  <tr key={d.month} className="border-b border-border last:border-0">
                    <td className="py-2 text-ink-soft text-xs">{d.month}</td>
                    <td className="py-2 text-right font-mono text-sm text-green font-medium">
                      {d.gmv.toLocaleString()}M
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
