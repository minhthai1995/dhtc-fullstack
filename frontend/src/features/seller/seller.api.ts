import { api } from '@/lib/axios'
import type {
  MerchantRead,
  OrderDetail,
  OrderRead,
  OrderStatus,
  ProductRead,
  PromotionRead,
  SellerDashboard,
  SellerStats,
  ShippingZoneRead,
  WalletSummary,
  WalletTransactionRead,
} from '@/types/api'

export interface SetupMerchantPayload {
  shop_name: string
  business_name: string
  slug: string
  description?: string
  region?: string
  phone?: string
  email?: string
}

export interface CreateProductPayload {
  name_vi: string
  name_en?: string
  price: number
  stock: number
  status?: 'active' | 'inactive' | 'pending_review'
  category_id?: number
  description_vi?: string
  description_en?: string
  origin?: string
  certifications?: string[]
  images?: (
    | { url: string; alt?: string; is_primary?: boolean }
    | { id: string; urls: { original: string; large: string; medium: string; thumb: string }; order: number }
  )[]
}

export interface CreatePromotionPayload {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order: number
  max_usage?: number
  expires_at?: string
  is_active?: boolean
}

export interface CreateShippingZonePayload {
  zone_name: string
  countries: string[]
  base_rate: number
  per_kg_rate: number
  estimated_days_min: number
  estimated_days_max: number
}

export async function getSellerDashboard(): Promise<SellerStats> {
  const { data } = await api.get<SellerStats>('/seller/dashboard')
  return data
}

export async function getSellerDashboardFull(): Promise<SellerDashboard> {
  const { data } = await api.get<SellerDashboard>('/seller/dashboard')
  return data
}

export async function getSellerProfile(): Promise<MerchantRead> {
  const { data } = await api.get<MerchantRead>('/seller/profile')
  return data
}

export async function setupMerchant(payload: SetupMerchantPayload): Promise<MerchantRead> {
  const { data } = await api.post<MerchantRead>('/seller/setup', payload)
  return data
}

export async function updateSellerProfile(payload: Partial<MerchantRead>): Promise<MerchantRead> {
  const { data } = await api.put<MerchantRead>('/seller/profile', payload)
  return data
}

export type UploadProgressHandler = (percent: number) => void

async function uploadMerchantAsset(
  path: '/seller/profile/logo' | '/seller/profile/banner',
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<MerchantRead> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<MerchantRead>(path, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total))
      }
    },
  })
  return data
}

export function uploadMerchantLogo(file: File, onProgress?: UploadProgressHandler) {
  return uploadMerchantAsset('/seller/profile/logo', file, onProgress)
}

export function uploadMerchantBanner(file: File, onProgress?: UploadProgressHandler) {
  return uploadMerchantAsset('/seller/profile/banner', file, onProgress)
}

export async function deleteMerchantLogo(): Promise<MerchantRead> {
  const { data } = await api.delete<MerchantRead>('/seller/profile/logo')
  return data
}

export async function deleteMerchantBanner(): Promise<MerchantRead> {
  const { data } = await api.delete<MerchantRead>('/seller/profile/banner')
  return data
}

export async function getSellerProducts(): Promise<ProductRead[]> {
  const { data } = await api.get<ProductRead[]>('/seller/products')
  return data
}

export async function createProduct(payload: CreateProductPayload): Promise<ProductRead> {
  const { data } = await api.post<ProductRead>('/seller/products', payload)
  return data
}

export async function updateProduct(id: number, payload: Partial<CreateProductPayload>): Promise<ProductRead> {
  const { data } = await api.put<ProductRead>(`/seller/products/${id}`, payload)
  return data
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/seller/products/${id}`)
}

export async function getSellerOrders(): Promise<OrderRead[]> {
  const { data } = await api.get<OrderRead[]>('/seller/orders')
  return data
}

export async function getSellerOrder(id: number): Promise<OrderDetail> {
  const { data } = await api.get<OrderDetail>(`/seller/orders/${id}`)
  return data
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus,
  note?: string,
  trackingNumber?: string
): Promise<OrderRead> {
  const { data } = await api.patch<OrderRead>(`/seller/orders/${id}/status`, {
    status,
    note,
    tracking_number: trackingNumber,
  })
  return data
}

export async function getWallet(): Promise<WalletSummary> {
  const { data } = await api.get<WalletSummary>('/seller/wallet')
  return data
}

export async function getWalletTransactions(): Promise<WalletTransactionRead[]> {
  const { data } = await api.get<WalletTransactionRead[]>('/seller/wallet/transactions')
  return data
}

export async function requestWithdrawal(amount: number, bankName: string, bankAccount: string): Promise<void> {
  await api.post('/seller/wallet/withdraw', { amount, bank_name: bankName, bank_account: bankAccount })
}

export async function getPromotions(): Promise<PromotionRead[]> {
  const { data } = await api.get<PromotionRead[]>('/seller/promotions')
  return data
}

export async function createPromotion(payload: CreatePromotionPayload): Promise<PromotionRead> {
  const { data } = await api.post<PromotionRead>('/seller/promotions', payload)
  return data
}

export async function updatePromotion(id: number, payload: Partial<CreatePromotionPayload>): Promise<PromotionRead> {
  const { data } = await api.patch<PromotionRead>(`/seller/promotions/${id}`, payload)
  return data
}

export async function deletePromotion(id: number): Promise<void> {
  await api.delete(`/seller/promotions/${id}`)
}

export async function getShippingZones(): Promise<ShippingZoneRead[]> {
  const { data } = await api.get<ShippingZoneRead[]>('/seller/shipping')
  return data
}

export async function createShippingZone(payload: CreateShippingZonePayload): Promise<ShippingZoneRead> {
  const { data } = await api.post<ShippingZoneRead>('/seller/shipping', payload)
  return data
}

export async function updateShippingZone(id: number, payload: Partial<CreateShippingZonePayload>): Promise<ShippingZoneRead> {
  const { data } = await api.put<ShippingZoneRead>(`/seller/shipping/${id}`, payload)
  return data
}

export async function deleteShippingZone(id: number): Promise<void> {
  await api.delete(`/seller/shipping/${id}`)
}

export interface TopProduct {
  id: number
  name_vi: string
  sold_count: number
  price: number
  stock: number
  status: string
}

export async function getTopProducts(): Promise<TopProduct[]> {
  const { data } = await api.get('/seller/analytics/top-products')
  return data
}

export interface LowStockProduct {
  id: number
  name_vi: string
  stock: number
  price: number
}

export async function getLowStockProducts(threshold = 10): Promise<LowStockProduct[]> {
  const { data } = await api.get('/seller/products/low-stock', { params: { threshold } })
  return data
}

export interface ProductAnalytics {
  product_id: number
  name_vi: string
  total_qty: number
  total_revenue: number
  revenue_pct: number
}

export async function getProductAnalytics(): Promise<ProductAnalytics[]> {
  const { data } = await api.get('/seller/analytics/products')
  return data
}
