import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as catApi from './categories.api'
import { useToast } from '@/components/ui/Toast'

export function useAdminCategories() {
  return useQuery({ queryKey: ['admin', 'categories'], queryFn: catApi.getAdminCategories })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: catApi.createCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast('Đã tạo danh mục', 'success') },
    onError: () => toast('Lỗi tạo danh mục', 'error'),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<catApi.CategoryCreate> }) => catApi.updateCategory(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast('Đã cập nhật', 'success') },
    onError: () => toast('Lỗi cập nhật', 'error'),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: catApi.deleteCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast('Đã xóa danh mục', 'success') },
    onError: (e: Error) => toast(e.message || 'Không thể xóa', 'error'),
  })
}
