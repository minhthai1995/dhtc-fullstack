import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as returnsApi from './returns.api'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n/useT'

export function useMyReturns() {
  return useQuery({ queryKey: ['customer', 'returns'], queryFn: returnsApi.getMyReturns })
}

export function useRequestReturn() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason: string }) =>
      returnsApi.requestReturn(orderId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', 'returns'] })
      toast(t('toasts.returnSubmitted'), 'success')
    },
    onError: (error: Error) => toast(error.message || t('toasts.errorSubmitReturn'), 'error'),
  })
}

export function useSellerReturns() {
  return useQuery({ queryKey: ['seller', 'returns'], queryFn: returnsApi.getSellerReturns })
}

export function useApproveReturn() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({ returnId, note }: { returnId: number; note?: string }) =>
      returnsApi.approveReturn(returnId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller', 'returns'] })
      toast(t('toasts.returnApproved'), 'success')
    },
    onError: () => toast(t('toasts.errorProcessReturn'), 'error'),
  })
}

export function useRejectReturn() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({ returnId, note }: { returnId: number; note?: string }) =>
      returnsApi.rejectReturn(returnId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller', 'returns'] })
      toast(t('toasts.returnRejected'), 'success')
    },
    onError: () => toast(t('toasts.errorProcessReturn'), 'error'),
  })
}

export function useAdminReturns() {
  return useQuery({ queryKey: ['admin', 'returns'], queryFn: returnsApi.getAdminReturns })
}
