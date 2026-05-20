import { useEffect } from 'react'
import { useSellerDashboardFull, useTopProducts, useLowStockProducts, useProductAnalytics } from '@/features/seller/useSeller'
import { KpiCard } from '@/components/ui/KpiCard'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { PageHeader } from '@/components/ui/PageHeader'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, AlertTriangle } from 'lucide-react'

export function SellerDashboard() {
  const navigate = useNavigate()
  const { data: dashboard, error, isLoading } = useSellerDashboardFull()
  const topProducts = useTopProducts()
  const lowStock = useLowStockProducts()
  const analytics = useProductAnalytics()

  useEffect(() => {
    if (error && (error as { response?: { status?: number } }).response?.status === 404) {
      navigate('/seller/setup', { replace: true })
    }
  }, [error, navigate])

  const chartData = dashboard?.revenue_chart ?? []
  const maxVal = chartData.length > 0 ? Math.max(...chartData.map((d) => d.revenue)) : 1
  const pendingOrders = dashboard?.pending_orders ?? []
  const merchantName = dashboard?.merchant_name ?? '—'

  return (
    <div>
      <PageHeader
        title={isLoading ? 'Xin chào...' : `Xin chào, ${merchantName} 👋`}
        subtitle={isLoading ? '...' : `${merchantName} · Seller Dashboard`}
        actions={
          <Link
            to="/seller/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold hover:bg-green-soft transition-colors no-underline"
          >
            <Plus size={15} />
            Thêm sản phẩm
          </Link>
        }
      />

      {/* Low-stock alert */}
      {lowStock.data && lowStock.data.length > 0 && (
        <div className="bg-white border border-warning rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-warning flex-shrink-0" />
            <h2 className="font-semibold text-warning" style={{ fontFamily: 'var(--font-display)' }}>
              Sắp hết hàng ({lowStock.data.length})
            </h2>
          </div>
          <table className="w-full">
            <tbody>
              {lowStock.data.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="py-2 text-sm text-ink pr-4">{p.name_vi}</td>
                  <td className="py-2 text-sm text-right font-mono font-semibold">
                    <span className={p.stock <= 5 ? 'text-danger' : 'text-warning'}>
                      còn {p.stock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Doanh thu tháng này"
          value={
            dashboard
              ? `₫${(dashboard.total_revenue / 1_000_000).toFixed(1)}M`
              : isLoading ? '—' : '₫0M'
          }
          delta="12.4% so tháng trước"
          deltaType="up"
        />
        <KpiCard
          label="Tổng đơn hàng"
          value={dashboard?.total_orders ?? (isLoading ? '—' : 0)}
          delta="8.1%"
          deltaType="up"
        />
        <KpiCard
          label="Chờ xử lý"
          value={dashboard?.pending_count ?? (isLoading ? '—' : 0)}
          delta="Cần xác nhận"
          deltaType="warn"
        />
        <KpiCard
          label="Số dư ví"
          value="—"
          delta="Có thể rút"
          deltaType="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              Doanh thu theo tháng
            </h2>
            <Link to="/seller/orders" className="text-xs text-green font-medium no-underline hover:underline">
              Xem đơn hàng →
            </Link>
          </div>
          {chartData.length > 0 ? (
            <div className="flex items-end gap-2 h-[80px]">
              {chartData.map((d) => (
                <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full rounded-t-[4px] bg-green cursor-default hover:opacity-80 transition-opacity"
                    style={{ height: `${(d.revenue / maxVal) * 100}%` }}
                  />
                  <span className="text-[9px] text-ink-mute" style={{ fontFamily: 'var(--font-mono)' }}>
                    {d.month}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[80px] flex items-center justify-center text-ink-mute text-sm">
              {isLoading ? 'Đang tải...' : 'Chưa có dữ liệu'}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Top sản phẩm
          </h2>
          {topProducts.isLoading ? (
            <div className="flex justify-center py-6"><Spinner size="sm" /></div>
          ) : !topProducts.data || topProducts.data.length === 0 ? (
            <div className="text-sm text-ink-mute text-center py-6">Chưa có dữ liệu</div>
          ) : (() => {
            const maxSold = Math.max(...topProducts.data.map((p) => p.sold_count), 1)
            return (
              <div className="space-y-3">
                {topProducts.data.map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-ink truncate">{p.name_vi}</div>
                      <div className="flex-1 h-1.5 bg-cream-dark rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-green rounded-full"
                          style={{ width: `${(p.sold_count / maxSold) * 100}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-ink-mute mt-0.5">
                        {p.price.toLocaleString('vi-VN')}₫ · còn {p.stock}
                      </div>
                    </div>
                    <span className="text-[11px] text-ink-mute min-w-[50px] text-right" style={{ fontFamily: 'var(--font-mono)' }}>
                      {p.sold_count} đơn
                    </span>
                  </div>
                ))}
              </div>
            )
          })()}</div>
      </div>

      {/* Product revenue analytics */}
      {analytics.data && analytics.data.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-5 mb-5">
          <div className="text-xs font-bold uppercase tracking-widest text-ink-mute mb-4">
            Doanh thu theo sản phẩm
          </div>
          <div className="space-y-3">
            {analytics.data.map(p => (
              <div key={p.product_id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink truncate max-w-[200px]">{p.name_vi}</span>
                  <span className="text-ink-mute font-mono">
                    {p.total_revenue.toLocaleString('vi-VN')}₫ ({p.revenue_pct}%)
                  </span>
                </div>
                <div className="h-2 bg-cream rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green rounded-full transition-all"
                    style={{ width: `${Math.min(p.revenue_pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending orders */}
      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            Đơn hàng chờ xử lý
          </h2>
          <Link to="/seller/orders" className="text-xs text-green font-medium no-underline hover:underline">
            Xem tất cả →
          </Link>
        </div>
        <div className="space-y-2">
          {pendingOrders.length === 0 ? (
            <div className="text-sm text-ink-mute text-center py-4">
              {isLoading ? 'Đang tải...' : 'Không có đơn hàng chờ xử lý'}
            </div>
          ) : (
            pendingOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 p-3 bg-cream rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink">{order.customer_name}</div>
                  <div className="text-xs text-ink-mute">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium text-green" style={{ fontFamily: 'var(--font-display)' }}>
                    ₫{(order.total_amount / 1_000).toFixed(0)}K
                  </div>
                  <Badge variant="pending" className="text-[9px]">Chờ xác nhận</Badge>
                </div>
                <Link
                  to={`/seller/orders/${order.id}`}
                  className="px-3 py-1.5 bg-green text-white text-xs font-semibold rounded-lg hover:bg-green-soft transition-colors no-underline flex-shrink-0"
                >
                  Xử lý
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
