import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as wishlistApi from './wishlist.api'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n/useT'

const wishlistKeys = {
  all: ['wishlist'] as const,
}

export function useWishlist() {
  return useQuery({ queryKey: wishlistKeys.all, queryFn: wishlistApi.getWishlist })
}

export function useAddToWishlist() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: (productId: number) => wishlistApi.addToWishlist(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: wishlistKeys.all }),
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useRemoveFromWishlist() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: (productId: number) => wishlistApi.removeFromWishlist(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: wishlistKeys.all }),
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}
