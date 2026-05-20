import { api } from '@/lib/axios'
import type { CartItemRead } from '@/types/api'

export async function getCart(): Promise<CartItemRead[]> {
  const { data } = await api.get<CartItemRead[]>('/customer/cart')
  return data
}

export async function addToCart(productId: number, quantity: number): Promise<CartItemRead> {
  const { data } = await api.post<CartItemRead>('/customer/cart', { product_id: productId, quantity })
  return data
}

export async function updateCartItem(productId: number, quantity: number): Promise<CartItemRead> {
  const { data } = await api.patch<CartItemRead>(`/customer/cart/${productId}`, { quantity })
  return data
}

export async function removeFromCart(productId: number): Promise<void> {
  await api.delete(`/customer/cart/${productId}`)
}

export async function clearCart(): Promise<void> {
  await api.delete('/customer/cart')
}
