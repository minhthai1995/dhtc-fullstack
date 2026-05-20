// Auth
export interface UserRead {
  id: number
  email: string
  role: 'admin' | 'seller' | 'customer'
  is_active: boolean
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface ApiError {
  detail: string
}

// Merchant
export type MerchantTier = 'bronze' | 'silver' | 'gold'
export type MerchantStatus = 'pending' | 'active' | 'suspended' | 'verified'

export interface MerchantRead {
  id: number
  user_id: number
  shop_name?: string
  // Bilingual names used in seller profile and merchant page
  business_name?: string
  business_name_en?: string
  slug: string
  description_vi?: string
  description_en?: string
  // Alias: some pages reference `description` directly
  description?: string
  logo_url?: string
  banner_url?: string
  region?: string
  tier: MerchantTier
  status: MerchantStatus
  established_year?: number
  // Extended merchant fields
  rating?: number
  total_sales?: number
  tax_id?: string
  address?: string
  certifications?: string[]
  email?: string
  phone?: string
  facebook?: string
  instagram?: string
  representative?: string
  cccd?: string
  member_count?: number
  entity_type?: string
  created_at: string
  updated_at?: string
}

// Category
export interface CategoryRead {
  id: number
  name_vi: string
  name_en: string
  slug: string
  parent_id?: number
  icon_url?: string
  sort_order: number
}

// Product
export type ProductStatus = 'active' | 'pending' | 'inactive'

export interface ProductImage {
  id?: number | string
  url?: string
  alt?: string
  is_primary?: boolean
  // New P3 shape — populated when the seller uploaded via ImageUploader.
  urls?: { original: string; large: string; medium: string; thumb: string }
  order?: number
}

export function productImageSrc(img: ProductImage | undefined, size: 'thumb' | 'medium' | 'large' = 'medium'): string {
  if (!img) return ''
  return img.urls?.[size] ?? img.url ?? ''
}

export interface ProductRead {
  id: number
  merchant_id: number
  category_id?: number
  name_vi: string
  name_en?: string
  slug?: string
  price: number
  stock: number
  sold_count?: number
  status: ProductStatus
  description_vi?: string
  description_en?: string
  origin?: string
  certifications?: string[]
  images?: ProductImage[]
  rating?: number
  created_at: string
  updated_at?: string
}

// Order
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface ShippingAddress {
  name: string
  phone: string
  address: string
  city: string
  country: string
}

export interface OrderItemRead {
  id: number
  product_id: number
  quantity: number
  unit_price: number
}

export interface OrderItemSummary {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
}

export interface OrderRead {
  id: number
  customer_id: number
  merchant_id: number
  status: OrderStatus
  total_amount: number
  shipping_address: ShippingAddress
  tracking_number?: string
  created_at: string
  updated_at: string
  items?: OrderItemSummary[]
}

export interface OrderDetail extends Omit<OrderRead, 'items'> {
  items: OrderItemRead[]
}

export interface OrderEvent {
  id: number
  order_id: number
  status: OrderStatus
  note?: string
  created_at: string
}

export interface UserAddress {
  id: number
  user_id: number
  label: string
  name: string
  phone: string
  address: string
  city: string
  country: string
  is_default: boolean
  created_at: string
}

export interface WishlistItem {
  id: number
  user_id: number
  product_id: number
  product: ProductRead
  created_at: string
}

// Cart
export interface CartItemRead {
  id: number
  product_id: number
  customer_id?: number
  quantity: number
  // Populated when fetched with product details
  product?: ProductRead
}

// Promotion
export type PromotionType = 'percentage' | 'fixed'

export interface PromotionRead {
  id: number
  merchant_id: number
  code: string
  type: PromotionType
  value: number
  min_order: number
  usage_count: number
  max_usage?: number
  expires_at?: string
  is_active: boolean
}

// Wallet
export type TransactionType = 'sale' | 'withdrawal' | 'fee' | 'adjustment' | 'income' | 'payout' | 'refund'

export interface WalletTransactionRead {
  id: number
  merchant_id?: number
  type: TransactionType
  amount: number
  balance_after: number
  description?: string
  created_at: string
}

export interface WalletSummary {
  // Standard API fields
  balance?: number
  total_sales?: number
  total_withdrawals?: number
  pending_orders?: number
  // Extended fields used by SellerWallet page
  available_balance?: number
  pending_balance?: number
  total_withdrawn?: number
}

// Shipping
export interface ShippingZoneRead {
  id: number
  merchant_id: number
  zone_name: string
  countries: string[]
  base_rate: number
  per_kg_rate: number
  estimated_days_min: number
  estimated_days_max: number
}

// Admin
export interface DashboardStats {
  total_merchants: number
  total_products: number
  total_orders: number
  orders_today: number
  gmv_today: number
  pending_approvals: number
}

export interface AdminDashboard {
  total_merchants: number
  total_products: number
  total_orders: number
  pending_approvals: number
  gmv_total: number
  gmv_prev_month: number
  orders_yesterday: number
  new_merchants_week: number
  top_merchants: { id: number; name: string; revenue: number; orders: number }[]
  recent_orders: { id: number; customer_name: string; total_amount: number; status: string; created_at: string }[]
}

export interface SellerDashboard {
  merchant_name: string
  total_revenue: number
  total_orders: number
  pending_count: number
  revenue_chart: { month: string; revenue: number }[]
  pending_orders: { id: number; customer_name: string; total_amount: number; created_at: string }[]
}

export interface UserProfile {
  id: number
  full_name: string
  email: string
  phone: string | null
}

export interface IntegrationHealth {
  name: string
  status: 'online' | 'degraded' | 'offline'
  uptime: number
}

// Seller
export interface SellerStats {
  total_products: number
  active_products: number
  pending_orders: number
  completed_orders: number
  revenue_this_month: number
  wallet_balance: number
}

// Customer
export interface CustomerMerchantRead {
  id: number
  shop_name?: string
  business_name?: string
  slug: string
  tier: MerchantTier
  status: MerchantStatus
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// Coupon / Promotion validation
export interface CouponValidateResponse {
  valid: boolean
  discount_pct: number
  discount_amount: number
  message: string
  promotion_id: number | null
}

// Admin merchant detail (enriched)
export interface AdminMerchantDetail {
  id: number
  user_id: number
  store_name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  status: string
  tier: string
  created_at: string
  product_count: number
  order_count: number
  monthly_revenue: number
  avg_rating: number | null
}
