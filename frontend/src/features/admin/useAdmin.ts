import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as adminApi from './admin.api'
import type { RevenueReport, WithdrawalItem, OriginRevenue, CRMStats, FunnelStage, SegmentCount, CustomerRow, CustomerDetail, CRMCustomersParams, Demographics, ConversationOverview, ConversationProfile, ConversationSummary, ChatMessageOut, BehaviorOverview, SessionSummary } from './admin.api'
import type { AdminDashboard, AdminMerchantDetail, ProductRead } from '@/types/api'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n/useT'

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: ['admin', 'dashboard'] as const,
  merchants: ['admin', 'merchants'] as const,
  merchant: (id: number) => ['admin', 'merchants', id] as const,
  products: ['admin', 'products'] as const,
  orders: ['admin', 'orders'] as const,
  revenue: ['admin', 'revenue'] as const,
  integrations: ['admin', 'integrations'] as const,
  withdrawals: ['admin', 'withdrawals'] as const,
}

export function useAdminDashboard() {
  return useQuery({ queryKey: adminKeys.dashboard, queryFn: adminApi.getDashboard })
}

export function useAdminDashboardFull() {
  return useQuery<AdminDashboard>({ queryKey: adminKeys.dashboard, queryFn: adminApi.getAdminDashboard })
}

export function useAdminUpdateOrderStatus() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: ({ orderId, status, note }: { orderId: number; status: string; note?: string }) =>
      adminApi.adminUpdateOrderStatus(orderId, status, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.orders })
      qc.invalidateQueries({ queryKey: adminKeys.dashboard })
      toast(t('toasts.statusUpdated'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useAdminMerchants() {
  return useQuery({ queryKey: adminKeys.merchants, queryFn: adminApi.getMerchants })
}

export function useAdminMerchant(id: number) {
  return useQuery({ queryKey: adminKeys.merchant(id), queryFn: () => adminApi.getMerchant(id) })
}

export function useAdminMerchantDetail(merchantId: number | null) {
  return useQuery<AdminMerchantDetail>({
    queryKey: ['admin', 'merchants', merchantId, 'detail'],
    queryFn: () => adminApi.getAdminMerchantDetail(merchantId!),
    enabled: !!merchantId,
  })
}

export function useAdminMerchantProducts(merchantId: number | null) {
  return useQuery<ProductRead[]>({
    queryKey: ['admin', 'merchants', merchantId, 'products'],
    queryFn: () => adminApi.getAdminMerchantProducts(merchantId!),
    enabled: !!merchantId,
  })
}

export function useApproveMerchant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminApi.approveMerchant,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.merchants }),
  })
}

export function useSuspendMerchant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminApi.suspendMerchant,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.merchants }),
  })
}

export function useAdminProducts() {
  return useQuery({ queryKey: adminKeys.products, queryFn: adminApi.getAdminProducts })
}

export function useApproveProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminApi.approveProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.products }),
  })
}

export function useAdminOrders() {
  return useQuery({ queryKey: adminKeys.orders, queryFn: adminApi.getAdminOrders })
}

export function useRevenueReport() {
  return useQuery<RevenueReport>({ queryKey: adminKeys.revenue, queryFn: adminApi.getRevenueReport })
}

export function useIntegrations() {
  return useQuery({ queryKey: adminKeys.integrations, queryFn: adminApi.getIntegrations })
}

export function useAdminWithdrawals() {
  return useQuery<WithdrawalItem[]>({
    queryKey: adminKeys.withdrawals,
    queryFn: adminApi.getAdminWithdrawals,
  })
}

export function useApproveWithdrawal() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: adminApi.approveWithdrawal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.withdrawals })
      toast(t('toasts.withdrawalApproved'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useRejectWithdrawal() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: adminApi.rejectWithdrawal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.withdrawals })
      toast(t('toasts.requestRejected'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useAdminCustomers(search = '') {
  return useQuery({ queryKey: ['admin', 'customers', search], queryFn: () => adminApi.getAdminCustomers(search) })
}

export function useBulkApproveProducts() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: adminApi.bulkApproveProducts,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: adminKeys.products })
      toast(t('toasts.productsApproved').replace('{n}', String(data.approved.length)), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useSuspendUser() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: adminApi.suspendUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'customers'] })
      toast(t('toasts.accountSuspended'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useActivateUser() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: adminApi.activateUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'customers'] })
      toast(t('toasts.accountActivated'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useRevenueByOrigin() {
  return useQuery<OriginRevenue[]>({
    queryKey: [...adminKeys.all, 'by-origin'],
    queryFn: adminApi.getRevenueByOrigin,
  })
}

export function useCRMStats() {
  return useQuery<CRMStats>({
    queryKey: ['admin', 'crm', 'stats'],
    queryFn: adminApi.getCRMStats,
  })
}

export function useCRMFunnel() {
  return useQuery<FunnelStage[]>({
    queryKey: ['admin', 'crm', 'funnel'],
    queryFn: adminApi.getCRMFunnel,
  })
}

export function useCRMSegments() {
  return useQuery<SegmentCount>({
    queryKey: ['admin', 'crm', 'segments'],
    queryFn: adminApi.getCRMSegments,
  })
}

export function useCRMCustomers(params: CRMCustomersParams = {}) {
  return useQuery<CustomerRow[]>({
    queryKey: ['admin', 'crm', 'customers', params],
    queryFn: () => adminApi.getCRMCustomers(params),
  })
}

export function useCRMCustomer(userId: number | null) {
  return useQuery<CustomerDetail>({
    queryKey: ['admin', 'crm', 'customers', userId],
    queryFn: () => adminApi.getCRMCustomer(userId!),
    enabled: !!userId,
  })
}

export function useCRMDemographics() {
  return useQuery<Demographics>({
    queryKey: ['admin', 'crm', 'demographics'],
    queryFn: adminApi.getCRMDemographics,
  })
}

export function useCRMConversationOverview() {
  return useQuery<ConversationOverview>({
    queryKey: ['admin', 'crm', 'conversation-overview'],
    queryFn: adminApi.getCRMConversationOverview,
  })
}

export function useCRMConversations() {
  return useQuery<ConversationSummary[]>({
    queryKey: ['admin', 'crm', 'conversations'],
    queryFn: adminApi.getCRMConversations,
  })
}

export function useCRMConversationMessages(sessionId: string | null) {
  return useQuery<ChatMessageOut[]>({
    queryKey: ['admin', 'crm', 'conversations', sessionId, 'messages'],
    queryFn: () => adminApi.getCRMConversationMessages(sessionId!),
    enabled: !!sessionId,
  })
}

export function useCRMConversationProfile(sessionId: string | null) {
  return useQuery<ConversationProfile>({
    queryKey: ['admin', 'crm', 'conversations', sessionId, 'profile'],
    queryFn: () => adminApi.getCRMConversationProfile(sessionId!),
    enabled: !!sessionId,
  })
}

export function useBehaviorOverview(date?: string) {
  return useQuery<BehaviorOverview>({
    queryKey: ['admin', 'behavior', 'overview', date ?? 'today'],
    queryFn: () => adminApi.getBehaviorOverview(date),
  })
}

export function useBehaviorSessions(params: { date?: string; limit?: number; offset?: number } = {}) {
  return useQuery<SessionSummary[]>({
    queryKey: ['admin', 'behavior', 'sessions', params],
    queryFn: () => adminApi.getBehaviorSessions(params),
  })
}
