import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as catApi from './categories.api'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n/useT'

export function useAdminCategories() {
  return useQuery({ queryKey: ['admin', 'categories'], queryFn: catApi.getAdminCategories })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: catApi.createCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast(t('toasts.categoryCreated'), 'success') },
    onError: () => toast(t('toasts.errorCreateCategory'), 'error'),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<catApi.CategoryCreate> }) => catApi.updateCategory(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast(t('toasts.updated'), 'success') },
    onError: () => toast(t('toasts.errorUpdateCategory'), 'error'),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: catApi.deleteCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast(t('toasts.categoryDeleted'), 'success') },
    onError: (e: Error) => toast(e.message || t('toasts.errorDeleteCategory'), 'error'),
  })
}
