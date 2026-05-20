import { useAdminDashboardFull, useIntegrations, useRevenueReport, useRevenueByOrigin } from '@/features/admin/useAdmin'
import { KpiCard } from '@/components/ui/KpiCard'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Link } from 'react-router-dom'

function statusToBadge(status: string) {
  if (status === 'pending') return 'pending'
  if (status === 'processing') return 'processing'
  if (status === 'shipped') return 'shipped'
  if (status === 'delivered') return 'delivered'
  return 'default'
}

export function AdminDashboard() {
  const { data: dashboard, isLoading } = useAdminDashboardFull()
  const { data: integrations } = useIntegrations()
  const { data: revenueReport } = useRevenueReport()
  const { data: originData = [] } = useRevenueByOrigin()

  // Build chart data from revenue report; fall back to empty array while loading
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

  // Dynamic date/time label
  const now = new Date()
  const dateLabel = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeLabel = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  // GMV growth delta
  const gmvPrev = dashboard?.gmv_prev_month ?? 0
  const gmvCurr = dashboard?.gmv_total ?? 0
  const gmvGrowth = gmvPrev > 0 ? ((gmvCurr - gmvPrev) / gmvPrev * 100).toFixed(1) : null
  const gmvDelta = gmvGrowth !== null ? `${Number(gmvGrowth) >= 0 ? '+' : ''}${gmvGrowth}% so tháng trước` : 'Tháng đầu tiên'
  const gmvDeltaType: 'up' | 'down' = gmvGrowth !== null && Number(gmvGrowth) >= 0 ? 'up' : 'down'

  // Region chart data from API
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
        title="Dashboard tổng hợp"
        subtitle={`Cập nhật lúc ${timeLabel} · Hôm nay ${dateLabel}`}
        actions={
          <Link
            to="/admin/reports"
            className="px-4 py-2 text-sm font-semibold text-green border border-green/30 rounded-xl hover:bg-green/5 transition-colors no-underline"
          >
            Xem báo cáo →
          </Link>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="GMV tổng"
          value={
            isLoading
              ? '—'
              : `₫${((dashboard?.gmv_total ?? 0) / 1_000_000).toFixed(0)}M`
          }
          delta={gmvDelta}
          deltaType={gmvDeltaType}
        />
        <KpiCard
          label="Tổng đơn hàng"
          value={isLoading ? '—' : (dashboard?.total_orders ?? 0).toLocaleString()}
          delta={dashboard?.orders_yesterday !== undefined ? `${dashboard.orders_yesterday} đơn hôm qua` : 'Đang tải...'}
          deltaType="up"
        />
        <KpiCard
          label="Tiểu thương hoạt động"
          value={isLoading ? '—' : `${dashboard?.total_merchants ?? 0}`}
          delta={dashboard?.new_merchants_week !== undefined ? `${dashboard.new_merchants_week} mới tuần này` : '—'}
          deltaType="up"
        />
        <KpiCard
          label="Chờ phê duyệt"
          value={isLoading ? '—' : (dashboard?.pending_approvals ?? 0)}
          delta="Xử lý trước cuối ngày"
          deltaType="warn"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue bar chart */}
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              Doanh thu theo tháng
            </h2>
            <Link to="/admin/reports" className="text-xs text-green font-medium hover:underline no-underline">
              Xem báo cáo →
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
              {isLoading ? 'Đang tải...' : 'Chưa có dữ liệu'}
            </div>
          )}

          <div className="flex gap-4 mt-2.5 text-[11px] text-ink-mute">
            <span>
              <span className="inline-block w-2.5 h-2.5 rounded-[2px] mr-1 align-middle" style={{ background: 'var(--color-green)' }} />
              Thực tế
            </span>
            <span>
              <span className="inline-block w-2.5 h-2.5 rounded-[2px] mr-1 align-middle bg-gold/45" />
              Dự báo
            </span>
          </div>
        </div>

        {/* Today stats + Pending approvals */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              Hôm nay
            </h2>
            <Badge variant="processing">Trực tiếp</Badge>
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
              <div className="text-sm text-ink-mute text-center py-4">Chưa có dữ liệu vùng</div>
            )}
          </div>

          {/* Pending approvals mini */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">
                Chờ phê duyệt
              </div>
              {(dashboard?.pending_approvals ?? 0) > 0 && (
                <Link to="/admin/approvals" className="text-[10px] text-green font-semibold no-underline hover:underline">
                  {dashboard?.pending_approvals} mục →
                </Link>
              )}
            </div>
            {(dashboard?.pending_approvals ?? 0) === 0 ? (
              <div className="text-xs text-ink-mute">Không có mục nào chờ phê duyệt</div>
            ) : (
              <Link
                to="/admin/approvals"
                className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl no-underline hover:bg-amber-100 transition-colors"
              >
                <span className="text-amber-600 font-bold text-sm">{dashboard?.pending_approvals}</span>
                <span className="text-xs text-amber-700 font-medium">sản phẩm chờ phê duyệt</span>
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
              Top tiểu thương
            </h2>
            <Link to="/admin/merchants" className="text-xs text-green font-medium no-underline hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-2">
            {topMerchants.length === 0 ? (
              <div className="text-sm text-ink-mute text-center py-4">
                {isLoading ? 'Đang tải...' : 'Chưa có dữ liệu'}
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
                    <span className="text-[11px] text-ink-mute">{m.orders} đơn</span>
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
              Đơn hàng gần đây
            </h2>
            <Link to="/admin/orders" className="text-xs text-green font-medium no-underline hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <div className="text-sm text-ink-mute text-center py-4">
                {isLoading ? 'Đang tải...' : 'Chưa có đơn hàng'}
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
              Tích hợp API
            </h2>
            <Link to="/admin/integrations" className="text-xs text-green font-medium no-underline hover:underline">
              Chi tiết →
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
