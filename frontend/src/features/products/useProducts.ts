import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as productsApi from './products.api'
import type { ProductsParams, ReviewCreate } from './products.api'

export const productKeys = {
  all: ['products'] as const,
  list: (params?: ProductsParams) => ['products', 'list', params] as const,
  detail: (id: number) => ['products', id] as const,
  merchants: ['merchants'] as const,
  merchant: (id: number) => ['merchants', id] as const,
  merchantProducts: (id: number) => ['merchants', id, 'products'] as const,
  categories: ['categories'] as const,
}

export function useProducts(params?: ProductsParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsApi.getProducts(params),
  })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsApi.getProduct(id),
  })
}

export function useMerchants() {
  return useQuery({
    queryKey: productKeys.merchants,
    queryFn: productsApi.getMerchants,
  })
}

export function useMerchant(id: number) {
  return useQuery({
    queryKey: productKeys.merchant(id),
    queryFn: () => productsApi.getMerchant(id),
  })
}

export function useMerchantProducts(merchantId: number) {
  return useQuery({
    queryKey: productKeys.merchantProducts(merchantId),
    queryFn: () => productsApi.getMerchantProducts(merchantId),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: productsApi.getCategories,
  })
}

export function useReviews(productId: number, sortBy = 'newest') {
  return useQuery({
    queryKey: ['products', productId, 'reviews', sortBy],
    queryFn: () => productsApi.getReviews(productId, sortBy),
    enabled: !!productId,
  })
}

export function useRelatedProducts(productId: number) {
  return useQuery({
    queryKey: ['products', 'related', productId],
    queryFn: () => productsApi.getRelatedProducts(productId),
    enabled: !!productId,
  })
}

export function useCreateReview(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReviewCreate) => productsApi.createReview(productId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products', productId, 'reviews'] }),
  })
}
