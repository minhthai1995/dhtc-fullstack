import { api } from '@/lib/axios'
import type { OrderDetail, OrderEvent, OrderRead, ShippingAddress } from '@/types/api'

export interface CreateOrderPayload {
  items: { product_id: number; quantity: number }[]
  shipping_address: ShippingAddress
  promotion_code?: string
  notes?: string
  payment_method?: string
  shipping_method?: string
  shipping_fee?: number
  shipping_zone_id?: number
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderRead> {
  const { data } = await api.post<OrderRead>('/customer/orders', payload)
  return data
}

export async function getMyOrders(): Promise<OrderRead[]> {
  const { data } = await api.get<OrderRead[]>('/customer/orders')
  return data
}

export async function getOrder(id: number): Promise<OrderDetail> {
  const { data } = await api.get<OrderDetail>(`/customer/orders/${id}`)
  return data
}

export async function getOrderEvents(orderId: number): Promise<OrderEvent[]> {
  const { data } = await api.get<OrderEvent[]>(`/customer/orders/${orderId}/events`)
  return data
}

export async function cancelOrder(orderId: number): Promise<OrderRead> {
  const { data } = await api.post<OrderRead>(`/customer/orders/${orderId}/cancel`)
  return data
}
