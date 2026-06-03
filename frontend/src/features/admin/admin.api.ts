import { api } from '@/lib/axios'
import type { AdminDashboard, AdminMerchantDetail, DashboardStats, IntegrationHealth, MerchantRead, OrderRead, ProductRead } from '@/types/api'

export async function getDashboard(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/admin/dashboard')
  return data
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const { data } = await api.get<AdminDashboard>('/admin/dashboard')
  return data
}

export async function adminUpdateOrderStatus(orderId: number, status: string, note?: string): Promise<OrderRead> {
  const { data } = await api.patch<OrderRead>(`/admin/orders/${orderId}/status`, { status, note })
  return data
}

export async function getMerchants(): Promise<MerchantRead[]> {
  const { data } = await api.get<MerchantRead[]>('/admin/merchants')
  return data
}

export async function getMerchant(id: number): Promise<MerchantRead> {
  const { data } = await api.get<MerchantRead>(`/admin/merchants/${id}`)
  return data
}

export async function getAdminMerchantDetail(merchantId: number): Promise<AdminMerchantDetail> {
  const { data } = await api.get<AdminMerchantDetail>(`/admin/merchants/${merchantId}`)
  return data
}

export async function getAdminMerchantProducts(merchantId: number): Promise<ProductRead[]> {
  const { data } = await api.get<ProductRead[]>(`/admin/merchants/${merchantId}/products`)
  return data
}

export async function approveMerchant(id: number): Promise<void> {
  await api.patch(`/admin/merchants/${id}/approve`)
}

export async function suspendMerchant(id: number): Promise<void> {
  await api.patch(`/admin/merchants/${id}/suspend`)
}

export async function activateMerchant(id: number): Promise<void> {
  await api.patch(`/admin/merchants/${id}/activate`)
}

export async function getAdminProducts(): Promise<ProductRead[]> {
  const { data } = await api.get<ProductRead[]>('/admin/products')
  return data
}

export async function approveProduct(id: number): Promise<void> {
  await api.patch(`/admin/products/${id}/approve`)
}

export async function suspendProduct(id: number): Promise<void> {
  await api.patch(`/admin/products/${id}/suspend`)
}

export async function getAdminOrders(): Promise<OrderRead[]> {
  const { data } = await api.get<OrderRead[]>('/admin/orders')
  return data
}

export interface RevenueReport {
  months: string[]
  values: number[]
  orders: number[]
  currency: string
}

interface RevenueRow { year: number; month: number; revenue: number; orders: number }

export async function getRevenueReport(): Promise<RevenueReport> {
  const { data } = await api.get<RevenueRow[]>('/admin/reports/revenue')
  return {
    months: data.map((d) => `T${d.month}/${String(d.year).slice(2)}`),
    values: data.map((d) => d.revenue),
    orders: data.map((d) => d.orders),
    currency: 'VND',
  }
}

export async function getIntegrations(): Promise<IntegrationHealth[]> {
  const { data } = await api.get<IntegrationHealth[]>('/admin/integrations')
  return data
}

export interface WithdrawalItem {
  id: number
  merchant_id: number
  merchant_name: string
  amount: number
  status: string
  description: string | null
  bank_name: string | null
  bank_account: string | null
  created_at: string
}

export async function getAdminWithdrawals(): Promise<WithdrawalItem[]> {
  const res = await api.get('/admin/withdrawals')
  return res.data
}

export async function approveWithdrawal(txnId: number): Promise<WithdrawalItem> {
  const res = await api.patch(`/admin/withdrawals/${txnId}/approve`)
  return res.data
}

export async function rejectWithdrawal(txnId: number): Promise<{ ok: boolean }> {
  const res = await api.patch(`/admin/withdrawals/${txnId}/reject`)
  return res.data
}

export interface AdminCustomer {
  id: number
  email: string
  full_name: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  order_count: number
  total_spend: number
}

export async function getAdminCustomers(search = ''): Promise<AdminCustomer[]> {
  const { data } = await api.get('/admin/customers', { params: search ? { search, limit: 200 } : { limit: 200 } })
  return data
}

export async function bulkApproveProducts(productIds: number[]): Promise<{ approved: number; total: number }> {
  const { data } = await api.post('/admin/products/bulk-approve', { product_ids: productIds })
  return data
}

export async function suspendUser(userId: number): Promise<void> {
  await api.patch(`/admin/users/${userId}/suspend`)
}

export async function activateUser(userId: number): Promise<void> {
  await api.patch(`/admin/users/${userId}/activate`)
}

export interface OriginRevenue {
  origin: string
  revenue: number
  orders: number
}

export async function getRevenueByOrigin(): Promise<OriginRevenue[]> {
  const { data } = await api.get<OriginRevenue[]>('/admin/reports/by-origin')
  return data
}

// ── CRM Analytics ─────────────────────────────────────────────────────────────

export interface CRMStats {
  messenger_contacts: number
  total_customers: number
  new_this_month: number
  buyers: number
  repeat_buyers: number
  avg_order_value: number
}

export interface FunnelStage {
  stage: string
  key: string
  count: number
}

export interface SegmentCount {
  new_customers: number
  returning: number
  at_risk: number
  no_order: number
}

export interface CustomerRow {
  id: number
  email: string
  full_name: string | null
  phone: string | null
  created_at: string
  order_count: number
  last_order_date: string | null
  total_spent: number
  segment: string
}

export interface OrderSummary {
  id: number
  status: string
  total_amount: number
  created_at: string
}

export interface CustomerDetail {
  id: number
  email: string
  full_name: string | null
  phone: string | null
  created_at: string
  order_count: number
  total_spent: number
  segment: string
  orders: OrderSummary[]
}

export interface CRMCustomersParams {
  segment?: string
  q?: string
  skip?: number
  limit?: number
}

export async function getCRMStats(): Promise<CRMStats> {
  const { data } = await api.get<CRMStats>('/admin/crm/stats')
  return data
}

export async function getCRMFunnel(): Promise<FunnelStage[]> {
  const { data } = await api.get<FunnelStage[]>('/admin/crm/funnel')
  return data
}

export async function getCRMSegments(): Promise<SegmentCount> {
  const { data } = await api.get<SegmentCount>('/admin/crm/segments')
  return data
}

export async function getCRMCustomers(params: CRMCustomersParams = {}): Promise<CustomerRow[]> {
  const { data } = await api.get<CustomerRow[]>('/admin/crm/customers', { params })
  return data
}

export async function getCRMCustomer(userId: number): Promise<CustomerDetail> {
  const { data } = await api.get<CustomerDetail>(`/admin/crm/customers/${userId}`)
  return data
}

// ── CRM Demographics + Conversation analytics ─────────────────────────────────

export interface DemographicBucket {
  label: string
  key: string
  count: number
}

export interface Demographics {
  by_source: DemographicBucket[]
  by_country: DemographicBucket[]
  by_device: DemographicBucket[]
}

export async function getCRMDemographics(): Promise<Demographics> {
  const { data } = await api.get<Demographics>('/admin/crm/demographics')
  return data
}

export interface ConversationStats {
  total_today: number
  total_messages_today: number
  response_time_avg: number | null
  conversion_rate: number | null
}

export interface IntentBucket {
  key: string
  label: string
  count: number
}

export interface TrendPoint {
  date: string
  count: number
}

export interface ConversationOverview {
  stats: ConversationStats
  intent_breakdown: IntentBucket[]
  trend_7d: TrendPoint[]
  funnel: FunnelStage[]
}

export async function getCRMConversationOverview(): Promise<ConversationOverview> {
  const { data } = await api.get<ConversationOverview>('/admin/crm/conversation-overview')
  return data
}

export interface LinkedUser {
  id: number
  full_name: string | null
  phone: string | null
  email: string
  total_spent: number
  order_count: number
}

export interface IntentHistoryItem {
  key: string
  label: string
  count: number
}

export interface ConversationProfile {
  session_id: string
  fb_user_id: string
  linked_user: LinkedUser | null
  first_seen: string
  last_seen: string
  message_count: number
  intent_history: IntentHistoryItem[]
}

export async function getCRMConversationProfile(sessionId: string): Promise<ConversationProfile> {
  const { data } = await api.get<ConversationProfile>(`/admin/crm/conversations/${sessionId}/profile`)
  return data
}

export interface ConversationSummary {
  fb_user_id: string
  session_id: string
  message_count: number
  last_message: string
  last_activity: string
}

export async function getCRMConversations(): Promise<ConversationSummary[]> {
  const { data } = await api.get<ConversationSummary[]>('/admin/crm/conversations')
  return data
}

export interface ChatMessageOut {
  id: number
  direction: 'inbound' | 'outbound'
  content: string
  created_at: string
}

export async function getCRMConversationMessages(sessionId: string): Promise<ChatMessageOut[]> {
  const { data } = await api.get<ChatMessageOut[]>(`/admin/crm/conversations/${sessionId}`)
  return data
}

// ── Behavior analytics (page tracking P2) ─────────────────────────────────────

export interface BehaviorStats {
  total_sessions: number
  bounce_rate: number | null
  avg_duration_sec: number | null
  pages_per_session: number | null
}

export interface BehaviorBucket {
  key: string
  count: number
}

export interface TopPage {
  path: string
  count: number
}

export interface BehaviorFunnelStage {
  key: 'view_product' | 'add_to_cart' | 'checkout' | 'complete'
  count: number
}

export interface HourlyBucket {
  hour: number
  count: number
}

export interface BehaviorOverview {
  stats: BehaviorStats
  by_device: BehaviorBucket[]
  by_source: BehaviorBucket[]
  top_pages: TopPage[]
  funnel: BehaviorFunnelStage[]
  hourly_24h: HourlyBucket[]
}

export interface SessionSummary {
  session_id: string
  visitor_id: string
  user_id: number | null
  page_count: number
  duration_sec: number
  first_seen: string
  last_seen: string
}

export async function getBehaviorOverview(date?: string): Promise<BehaviorOverview> {
  const { data } = await api.get<BehaviorOverview>('/admin/behavior/overview', {
    params: date ? { date } : undefined,
  })
  return data
}

export async function getBehaviorSessions(params: { date?: string; limit?: number; offset?: number } = {}): Promise<SessionSummary[]> {
  const { data } = await api.get<SessionSummary[]>('/admin/behavior/sessions', { params })
  return data
}
