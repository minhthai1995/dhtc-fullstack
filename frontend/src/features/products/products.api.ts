import { api } from '@/lib/axios'
import type { CategoryRead, MerchantRead, ProductRead } from '@/types/api'

export interface ProductsParams {
  skip?: number
  limit?: number
  category_id?: number
  merchant_id?: number
  search?: string
  sort_by?: string
  min_price?: number
  max_price?: number
  min_rating?: number
  certification?: string
  origin?: string
}

export async function getProducts(params?: ProductsParams): Promise<ProductRead[]> {
  const { data } = await api.get<ProductRead[]>('/customer/products', { params })
  return data
}

export async function getProduct(id: number): Promise<ProductRead> {
  const { data } = await api.get<ProductRead>(`/customer/products/${id}`)
  return data
}

export async function getMerchants(): Promise<MerchantRead[]> {
  const { data } = await api.get<MerchantRead[]>('/customer/merchants')
  return data
}

export async function getMerchant(id: number): Promise<MerchantRead> {
  const { data } = await api.get<MerchantRead>(`/customer/merchants/${id}`)
  return data
}

export async function getMerchantProducts(merchantId: number): Promise<ProductRead[]> {
  const { data } = await api.get<ProductRead[]>('/customer/products', { params: { merchant_id: merchantId } })
  return data
}

export async function getCategories(): Promise<CategoryRead[]> {
  const { data } = await api.get<CategoryRead[]>('/customer/categories')
  return data
}

export interface ReviewCreate {
  rating: number
  comment?: string
}

export interface ReviewRead {
  id: number
  product_id: number
  customer_id: number
  rating: number
  comment?: string
  created_at: string
}

export async function getReviews(productId: number, sortBy = 'newest'): Promise<ReviewRead[]> {
  const { data } = await api.get<ReviewRead[]>(`/customer/products/${productId}/reviews`, { params: { sort_by: sortBy } })
  return data
}

export async function getRelatedProducts(productId: number): Promise<ProductRead[]> {
  const { data } = await api.get<ProductRead[]>(`/customer/products/${productId}/related`)
  return data
}

export async function createReview(productId: number, payload: ReviewCreate): Promise<ReviewRead> {
  const { data } = await api.post<ReviewRead>(`/customer/products/${productId}/reviews`, payload)
  return data
}
