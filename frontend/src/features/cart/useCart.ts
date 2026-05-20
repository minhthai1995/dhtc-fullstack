import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as cartApi from './cart.api'

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
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      cartApi.addToCart(productId, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.cart }),
  })
}

export function useUpdateCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      cartApi.updateCartItem(productId, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.cart }),
  })
}

export function useRemoveFromCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (productId: number) => cartApi.removeFromCart(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.cart }),
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => { await cartApi.clearCart() },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.list }),
  })
}
