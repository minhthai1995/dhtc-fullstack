import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as sellerApi from './seller.api'
import type { SetupMerchantPayload } from './seller.api'
import type { OrderStatus, SellerDashboard } from '@/types/api'
import { productKeys } from '@/features/products/useProducts'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n/useT'

export const sellerKeys = {
  dashboard: ['seller', 'dashboard'] as const,
  profile: ['seller', 'profile'] as const,
  products: ['seller', 'products'] as const,
  orders: ['seller', 'orders'] as const,
  order: (id: number) => ['seller', 'orders', id] as const,
  wallet: ['seller', 'wallet'] as const,
  transactions: ['seller', 'wallet', 'transactions'] as const,
  promotions: ['seller', 'promotions'] as const,
  shipping: ['seller', 'shipping'] as const,
}

export function useSellerDashboard() {
  return useQuery({ queryKey: sellerKeys.dashboard, queryFn: sellerApi.getSellerDashboard })
}

export function useSellerDashboardFull() {
  return useQuery<SellerDashboard>({
    queryKey: [...sellerKeys.dashboard, 'full'],
    queryFn: sellerApi.getSellerDashboardFull,
  })
}

export function useSellerUpdateOrderStatus() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({
      id,
      status,
      note,
      trackingNumber,
    }: {
      id: number
      status: OrderStatus
      note?: string
      trackingNumber?: string
    }) => sellerApi.updateOrderStatus(id, status, note, trackingNumber),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: sellerKeys.orders })
      qc.invalidateQueries({ queryKey: sellerKeys.order(variables.id) })
      qc.invalidateQueries({ queryKey: sellerKeys.dashboard })
      toast(t('toasts.statusUpdated'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useSetupMerchant() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: (payload: SetupMerchantPayload) => sellerApi.setupMerchant(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: sellerKeys.profile }),
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useSellerProfile() {
  return useQuery({ queryKey: sellerKeys.profile, queryFn: sellerApi.getSellerProfile })
}

export function useUpdateSellerProfile() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: sellerApi.updateSellerProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sellerKeys.profile })
      toast(t('toasts.updated'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useUploadMerchantLogo() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: sellerApi.UploadProgressHandler }) =>
      sellerApi.uploadMerchantLogo(file, onProgress),
    onSuccess: (data) => {
      qc.setQueryData(sellerKeys.profile, data)
      toast(t('toasts.uploadSuccess'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useUploadMerchantBanner() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: sellerApi.UploadProgressHandler }) =>
      sellerApi.uploadMerchantBanner(file, onProgress),
    onSuccess: (data) => {
      qc.setQueryData(sellerKeys.profile, data)
      toast(t('toasts.uploadSuccess'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useDeleteMerchantLogo() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: sellerApi.deleteMerchantLogo,
    onSuccess: (data) => {
      qc.setQueryData(sellerKeys.profile, data)
      toast(t('toasts.deleteSuccess'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useDeleteMerchantBanner() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: sellerApi.deleteMerchantBanner,
    onSuccess: (data) => {
      qc.setQueryData(sellerKeys.profile, data)
      toast(t('toasts.deleteSuccess'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useSellerProducts() {
  return useQuery({ queryKey: sellerKeys.products, queryFn: sellerApi.getSellerProducts })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: sellerApi.createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sellerKeys.products })
      qc.invalidateQueries({ queryKey: sellerKeys.dashboard })
      qc.invalidateQueries({ queryKey: productKeys.all })
      toast(t('toasts.updated'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<sellerApi.CreateProductPayload> }) =>
      sellerApi.updateProduct(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sellerKeys.products })
      qc.invalidateQueries({ queryKey: sellerKeys.dashboard })
      qc.invalidateQueries({ queryKey: productKeys.all })
      toast(t('toasts.updated'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: sellerApi.deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sellerKeys.products })
      qc.invalidateQueries({ queryKey: sellerKeys.dashboard })
      qc.invalidateQueries({ queryKey: productKeys.all })
      toast(t('toasts.deleteSuccess'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useSellerOrders() {
  return useQuery({ queryKey: sellerKeys.orders, queryFn: sellerApi.getSellerOrders })
}

export function useSellerOrder(id: number) {
  return useQuery({
    queryKey: sellerKeys.order(id),
    queryFn: () => sellerApi.getSellerOrder(id),
    enabled: id > 0,
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      sellerApi.updateOrderStatus(id, status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: sellerKeys.orders })
      qc.invalidateQueries({ queryKey: sellerKeys.order(id) })
      qc.invalidateQueries({ queryKey: sellerKeys.dashboard })
      toast(t('toasts.statusUpdated'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useWallet() {
  return useQuery({ queryKey: sellerKeys.wallet, queryFn: sellerApi.getWallet })
}

export function useWalletTransactions() {
  return useQuery({ queryKey: sellerKeys.transactions, queryFn: sellerApi.getWalletTransactions })
}

export function useRequestWithdrawal() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({ amount, bankName, bankAccount }: { amount: number; bankName: string; bankAccount: string }) =>
      sellerApi.requestWithdrawal(amount, bankName, bankAccount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sellerKeys.wallet })
      qc.invalidateQueries({ queryKey: sellerKeys.transactions })
      toast(t('toasts.updated'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function usePromotions() {
  return useQuery({ queryKey: sellerKeys.promotions, queryFn: sellerApi.getPromotions })
}

export function useCreatePromotion() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: sellerApi.createPromotion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sellerKeys.promotions })
      toast(t('toasts.updated'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useUpdatePromotion() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<sellerApi.CreatePromotionPayload> }) =>
      sellerApi.updatePromotion(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sellerKeys.promotions })
      toast(t('toasts.updated'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useDeletePromotion() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: sellerApi.deletePromotion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sellerKeys.promotions })
      toast(t('toasts.deleteSuccess'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useShippingZones() {
  return useQuery({ queryKey: sellerKeys.shipping, queryFn: sellerApi.getShippingZones })
}

export function useCreateShippingZone() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: sellerApi.createShippingZone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sellerKeys.shipping })
      toast(t('toasts.updated'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useUpdateShippingZone() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<sellerApi.CreateShippingZonePayload> }) =>
      sellerApi.updateShippingZone(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerKeys.shipping })
      toast(t('toasts.updated'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useDeleteShippingZone() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: sellerApi.deleteShippingZone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sellerKeys.shipping })
      toast(t('toasts.updated'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useTopProducts() {
  return useQuery({ queryKey: ['seller', 'top-products'], queryFn: sellerApi.getTopProducts })
}

export function useLowStockProducts(threshold = 10) {
  return useQuery({ queryKey: ['seller', 'low-stock', threshold], queryFn: () => sellerApi.getLowStockProducts(threshold) })
}

export function useProductAnalytics() {
  return useQuery({ queryKey: ['seller', 'analytics', 'products'], queryFn: sellerApi.getProductAnalytics })
}
