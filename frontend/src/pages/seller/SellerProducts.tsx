import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSellerProducts, useDeleteProduct, sellerKeys } from '@/features/seller/useSeller'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Plus, Edit, Trash2, Package, Layers } from 'lucide-react'
import type { ProductStatus } from '@/types/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { useToast } from '@/components/ui/Toast'

async function bulkUpdateStock(items: { id: number; stock: number }[]) {
  const { data } = await api.patch<{ updated: number }>('/seller/products/bulk-stock', items)
  return data
}

function statusBadge(status: ProductStatus) {
  if (status === 'active') return <Badge variant="active">Hoạt động</Badge>
  if (status === 'pending') return <Badge variant="pending">Chờ duyệt</Badge>
  return <Badge variant="cancelled">Ngừng bán</Badge>
}

export function SellerProducts() {
  const { data: products, isLoading } = useSellerProducts()
  const deleteProduct = useDeleteProduct()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockEdits, setStockEdits] = useState<Record<number, number>>({})
  const qc = useQueryClient()
  const toast = useToast()

  const source = products ?? []
  const activeProducts = source.filter((p) => p.status === 'active')

  const openStockModal = () => {
    const initial: Record<number, number> = {}
    activeProducts.forEach((p) => { initial[p.id] = p.stock })
    setStockEdits(initial)
    setStockModalOpen(true)
  }

  const bulkStock = useMutation({
    mutationFn: bulkUpdateStock,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: sellerKeys.products })
      toast(`Đã cập nhật ${data.updated} sản phẩm`, 'success')
      setStockModalOpen(false)
    },
    onError: () => toast('Cập nhật thất bại', 'error'),
  })

  const handleSaveBulkStock = () => {
    const changed = activeProducts
      .filter((p) => stockEdits[p.id] !== p.stock)
      .map((p) => ({ id: p.id, stock: stockEdits[p.id] ?? p.stock }))
    if (changed.length === 0) {
      setStockModalOpen(false)
      return
    }
    bulkStock.mutate(changed)
  }

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc muốn xoá sản phẩm này?')) {
      setDeletingId(id)
      deleteProduct.mutate(id, {
        onSettled: () => setDeletingId(null),
      })
    }
  }

  return (
    <div>
      <PageHeader
        title="Sản phẩm của tôi"
        subtitle={`${source.length} sản phẩm · ${activeProducts.length} hoạt động`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={openStockModal}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-border text-ink-soft rounded-xl text-sm font-semibold hover:border-green hover:text-green transition-colors"
            >
              <Layers size={15} />
              Cập nhật tồn kho
            </button>
            <Link
              to="/seller/products/new"
              className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold hover:bg-green-soft transition-colors no-underline"
            >
              <Plus size={15} />
              Thêm sản phẩm
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-cream-dark border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Sản phẩm</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Giá</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Tồn kho</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Đã bán</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {source.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-cream/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cream-dark flex items-center justify-center flex-shrink-0">
                          <Package size={16} className="text-ink-mute" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-ink truncate max-w-[200px]">{p.name_vi}</div>
                          {p.certifications && p.certifications.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                              {p.certifications.slice(0, 2).map((c) => (
                                <span key={c} className="text-[9px] text-success bg-green/10 px-1.5 py-0.5 rounded-full font-bold">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-green font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                      {p.price.toLocaleString('vi-VN')}₫
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-mono ${p.stock === 0 ? 'text-danger' : 'text-ink-soft'}`}>
                        {p.stock === 0 ? 'Hết hàng' : p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-soft font-mono">{p.sold_count}</td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/seller/products/${p.id}/edit`}
                          className="text-ink-mute hover:text-green transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="text-ink-mute hover:text-danger transition-colors disabled:opacity-40"
                          title="Xoá"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk stock update modal */}
      {stockModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-border w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="text-base font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
                Cập nhật tồn kho hàng loạt
              </h2>
              <button
                onClick={() => setStockModalOpen(false)}
                className="text-ink-mute hover:text-ink transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-cream-dark">
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Sản phẩm</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Giá</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Tồn kho hiện tại</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">Tồn kho mới</th>
                  </tr>
                </thead>
                <tbody>
                  {activeProducts.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-sm font-medium text-ink max-w-[180px] truncate">{p.name_vi}</td>
                      <td className="px-4 py-3 text-sm text-green font-mono">{p.price.toLocaleString('vi-VN')}₫</td>
                      <td className="px-4 py-3 text-sm font-mono text-ink-mute">{p.stock}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          value={stockEdits[p.id] ?? p.stock}
                          onChange={(e) =>
                            setStockEdits((prev) => ({ ...prev, [p.id]: Math.max(0, parseInt(e.target.value) || 0) }))
                          }
                          className="w-24 px-2.5 py-1.5 border border-border rounded-lg text-sm bg-cream focus:outline-none focus:border-green font-mono"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
              <button
                onClick={() => setStockModalOpen(false)}
                className="px-4 py-2 border border-border rounded-xl text-sm font-semibold text-ink-soft hover:border-green hover:text-green transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveBulkStock}
                disabled={bulkStock.isPending}
                className="px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold hover:bg-green-soft transition-colors disabled:opacity-60"
              >
                {bulkStock.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
