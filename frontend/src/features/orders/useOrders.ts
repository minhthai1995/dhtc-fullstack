import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as ordersApi from './orders.api'
import type { CreateOrderPayload } from './orders.api'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n/useT'

export const orderKeys = {
  all: ['orders'] as const,
  list: ['orders', 'list'] as const,
  detail: (id: number) => ['orders', id] as const,
}

export function useMyOrders() {
  return useQuery({
    queryKey: orderKeys.list,
    queryFn: ordersApi.getMyOrders,
    enabled: !!sessionStorage.getItem('access_token'),
  })
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersApi.getOrder(id),
    enabled: id > 0,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersApi.createOrder(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.list })
      qc.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useOrderEvents(orderId: number) {
  return useQuery({
    queryKey: ['orders', orderId, 'events'],
    queryFn: () => ordersApi.getOrderEvents(orderId),
    enabled: !!orderId,
  })
}

export function useCancelOrder() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ordersApi.cancelOrder,
    onSuccess: (_data, orderId) => {
      toast(t('toasts.orderCancelled'), 'success')
      qc.invalidateQueries({ queryKey: orderKeys.list })
      qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
      qc.invalidateQueries({ queryKey: ['seller', 'orders'] })
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast(message || t('toasts.errorCancelOrder'), 'error')
    },
  })
}
