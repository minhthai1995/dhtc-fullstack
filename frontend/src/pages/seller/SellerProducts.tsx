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
import { useT } from '@/i18n/useT'

async function bulkUpdateStock(items: { id: number; stock: number }[]) {
  const { data } = await api.patch<{ updated: number }>('/seller/products/bulk-stock', items)
  return data
}

const STATUS_KEY: Record<ProductStatus, string> = {
  active: 'sellerProducts.statusActive',
  pending: 'sellerProducts.statusPending',
  inactive: 'sellerProducts.statusInactive',
}

export function SellerProducts() {
  const { t, lang } = useT()
  const { data: products, isLoading } = useSellerProducts()
  const deleteProduct = useDeleteProduct()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockEdits, setStockEdits] = useState<Record<number, number>>({})
  const qc = useQueryClient()
  const toast = useToast()

  const source = products ?? []
  const activeProducts = source.filter((p) => p.status === 'active')
  const localeStr = lang === 'vi' ? 'vi-VN' : 'en-US'

  const statusBadge = (status: ProductStatus) => {
    const variant = status === 'active' ? 'active' : status === 'pending' ? 'pending' : 'cancelled'
    return <Badge variant={variant}>{t(STATUS_KEY[status])}</Badge>
  }

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
      toast(t('sellerProducts.updateSuccess').replace('{n}', String(data.updated)), 'success')
      setStockModalOpen(false)
    },
    onError: () => toast(t('sellerProducts.updateFailed'), 'error'),
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
    if (confirm(t('sellerProducts.deleteConfirm'))) {
      setDeletingId(id)
      deleteProduct.mutate(id, {
        onSettled: () => setDeletingId(null),
      })
    }
  }

  return (
    <div>
      <PageHeader
        title={t('sellerProducts.title')}
        subtitle={t('sellerProducts.subtitle')
          .replace('{total}', String(source.length))
          .replace('{active}', String(activeProducts.length))}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={openStockModal}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-border text-ink-soft rounded-xl text-sm font-semibold hover:border-green hover:text-green transition-colors"
            >
              <Layers size={15} />
              {t('sellerProducts.bulkStock')}
            </button>
            <Link
              to="/seller/products/new"
              className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold hover:bg-green-soft transition-colors no-underline"
            >
              <Plus size={15} />
              {t('sellerProducts.addProduct')}
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
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('sellerProducts.thProduct')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('sellerProducts.thPrice')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('sellerProducts.thStock')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('sellerProducts.thSold')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('sellerProducts.thStatus')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('sellerProducts.thActions')}</th>
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
                      {p.price.toLocaleString(localeStr)}₫
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-mono ${p.stock === 0 ? 'text-danger' : 'text-ink-soft'}`}>
                        {p.stock === 0 ? t('sellerProducts.outOfStock') : p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-soft font-mono">{p.sold_count}</td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/seller/products/${p.id}/edit`}
                          className="text-ink-mute hover:text-green transition-colors"
                          title={t('sellerProducts.editTooltip')}
                        >
                          <Edit size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="text-ink-mute hover:text-danger transition-colors disabled:opacity-40"
                          title={t('sellerProducts.deleteTooltip')}
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
                {t('sellerProducts.bulkModalTitle')}
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
                    <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('sellerProducts.thProduct')}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('sellerProducts.thPrice')}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('sellerProducts.thCurrentStock')}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-ink-mute uppercase tracking-wider">{t('sellerProducts.thNewStock')}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeProducts.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-sm font-medium text-ink max-w-[180px] truncate">{p.name_vi}</td>
                      <td className="px-4 py-3 text-sm text-green font-mono">{p.price.toLocaleString(localeStr)}₫</td>
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
                {t('sellerPromotions.cancel')}
              </button>
              <button
                onClick={handleSaveBulkStock}
                disabled={bulkStock.isPending}
                className="px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold hover:bg-green-soft transition-colors disabled:opacity-60"
              >
                {bulkStock.isPending ? t('sellerProducts.savingBulk') : t('sellerProducts.saveBulk')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
