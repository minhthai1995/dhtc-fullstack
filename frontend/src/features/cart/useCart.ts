import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as cartApi from './cart.api'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n/useT'

export const cartKeys = {
  cart: ['cart'] as const,
  list: ['cart'] as const,
}

export function useCart() {
  return useQuery({
    queryKey: cartKeys.cart,
    queryFn: cartApi.getCart,
    enabled: !!sessionStorage.getItem('access_token'),
  })
}

export function useAddToCart() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      cartApi.addToCart(productId, quantity),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartKeys.cart })
      toast(t('toasts.addedToCart'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useUpdateCartItem() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      cartApi.updateCartItem(productId, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.cart }),
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useRemoveFromCart() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: (productId: number) => cartApi.removeFromCart(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.cart }),
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: async () => { await cartApi.clearCart() },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.cart }),
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}
