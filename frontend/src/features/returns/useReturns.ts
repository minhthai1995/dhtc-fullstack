import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as returnsApi from './returns.api'
import { useToast } from '@/components/ui/Toast'

export function useMyReturns() {
  return useQuery({ queryKey: ['customer', 'returns'], queryFn: returnsApi.getMyReturns })
}

export function useRequestReturn() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason: string }) =>
      returnsApi.requestReturn(orderId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', 'returns'] })
      toast('Đã gửi yêu cầu đổi trả', 'success')
    },
    onError: (error: Error) => toast(error.message || 'Lỗi gửi yêu cầu', 'error'),
  })
}

export function useSellerReturns() {
  return useQuery({ queryKey: ['seller', 'returns'], queryFn: returnsApi.getSellerReturns })
}

export function useApproveReturn() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ returnId, note }: { returnId: number; note?: string }) =>
      returnsApi.approveReturn(returnId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller', 'returns'] })
      toast('Đã chấp nhận yêu cầu đổi trả', 'success')
    },
    onError: () => toast('Lỗi xử lý yêu cầu', 'error'),
  })
}

export function useRejectReturn() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ returnId, note }: { returnId: number; note?: string }) =>
      returnsApi.rejectReturn(returnId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller', 'returns'] })
      toast('Đã từ chối yêu cầu đổi trả', 'success')
    },
    onError: () => toast('Lỗi xử lý yêu cầu', 'error'),
  })
}

export function useAdminReturns() {
  return useQuery({ queryKey: ['admin', 'returns'], queryFn: returnsApi.getAdminReturns })
}
