import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/features/admin/useCategories'
import type { CategoryCreate, CategoryWithCount } from '@/features/admin/categories.api'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const EMPTY_FORM: CategoryCreate = {
  name_vi: '',
  name_en: '',
  slug: '',
  parent_id: null,
  icon_url: null,
  sort_order: 0,
}

interface CategoryFormModalProps {
  title: string
  initial: CategoryCreate
  onSubmit: (data: CategoryCreate) => void
  onClose: () => void
  isPending: boolean
}

function CategoryFormModal({ title, initial, onSubmit, onClose, isPending }: CategoryFormModalProps) {
  const [form, setForm] = useState<CategoryCreate>(initial)

  function set<K extends keyof CategoryCreate>(key: K, value: CategoryCreate[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h3 className="font-semibold text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>{title}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute block mb-1">Tên (VI)</label>
            <input
              value={form.name_vi}
              onChange={(e) => set('name_vi', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green"
              placeholder="Tên tiếng Việt"
            />
          </div>
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute block mb-1">Tên (EN)</label>
            <input
              value={form.name_en}
              onChange={(e) => set('name_en', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green"
              placeholder="Name in English"
            />
          </div>
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute block mb-1">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-green"
              placeholder="ten-danh-muc"
            />
          </div>
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute block mb-1">Icon URL</label>
            <input
              value={form.icon_url ?? ''}
              onChange={(e) => set('icon_url', e.target.value || null)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute block mb-1">Thứ tự hiển thị</label>
            <input
              type="number"
              value={form.sort_order ?? 0}
              onChange={(e) => set('sort_order', Number(e.target.value))}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-xl text-sm font-semibold text-ink-soft hover:border-green transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={isPending || !form.name_vi.trim() || !form.slug.trim()}
            className="px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminCategories() {
  const { data: categories = [], isLoading } = useAdminCategories()
  const createCat = useCreateCategory()
  const updateCat = useUpdateCategory()
  const deleteCat = useDeleteCategory()

  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<CategoryWithCount | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  function handleCreate(data: CategoryCreate) {
    createCat.mutate(data, { onSuccess: () => setShowCreate(false) })
  }

  function handleUpdate(data: CategoryCreate) {
    if (!editTarget) return
    updateCat.mutate(
      { id: editTarget.id, body: data },
      { onSuccess: () => setEditTarget(null) }
    )
  }

  function handleDelete(id: number) {
    deleteCat.mutate(id, { onSuccess: () => setDeleteConfirm(null) })
  }

  return (
    <div>
      <PageHeader
        title="Danh mục sản phẩm"
        subtitle={`${categories.length} danh mục`}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-green text-white text-sm font-semibold rounded-xl hover:bg-green/90 transition-colors"
          >
            <Plus size={15} /> Thêm danh mục
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : categories.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-ink-mute text-sm">
          Chưa có danh mục nào
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-cream">
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">ID</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">Tên (VI)</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">Tên (EN)</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">Slug</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">Icon</th>
                <th className="text-center px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">Thứ tự</th>
                <th className="text-center px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">SP</th>
                <th className="text-center px-4 py-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr
                  key={cat.id}
                  className={`border-b border-border last:border-0 hover:bg-cream/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-cream/20'}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-ink-mute">{cat.id}</td>
                  <td className="px-4 py-3 font-medium text-ink">{cat.name_vi}</td>
                  <td className="px-4 py-3 text-ink-soft">{cat.name_en}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-mute">{cat.slug}</td>
                  <td className="px-4 py-3">
                    {cat.icon_url ? (
                      <img src={cat.icon_url} alt={cat.name_vi} className="w-6 h-6 object-contain rounded" />
                    ) : (
                      <span className="text-ink-mute/50 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs text-ink-mute">{cat.sort_order}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-green font-mono text-xs">{cat.product_count}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditTarget(cat)}
                        className="p-1.5 text-ink-mute hover:text-green transition-colors rounded-lg hover:bg-green/10"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(cat.id)}
                        className="p-1.5 text-ink-mute hover:text-danger transition-colors rounded-lg hover:bg-danger/10"
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CategoryFormModal
          title="Thêm danh mục mới"
          initial={EMPTY_FORM}
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
          isPending={createCat.isPending}
        />
      )}

      {editTarget && (
        <CategoryFormModal
          title="Chỉnh sửa danh mục"
          initial={{
            name_vi: editTarget.name_vi,
            name_en: editTarget.name_en,
            slug: editTarget.slug,
            parent_id: editTarget.parent_id ?? null,
            icon_url: editTarget.icon_url ?? null,
            sort_order: editTarget.sort_order,
          }}
          onSubmit={handleUpdate}
          onClose={() => setEditTarget(null)}
          isPending={updateCat.isPending}
        />
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-ink mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-ink-mute mb-5">
              Bạn có chắc muốn xóa danh mục này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-border rounded-xl text-sm font-semibold text-ink-soft hover:border-green transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteCat.isPending}
                className="px-4 py-2 bg-danger text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {deleteCat.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
