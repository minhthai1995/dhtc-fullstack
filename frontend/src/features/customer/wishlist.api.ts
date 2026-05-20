import { api } from '@/lib/axios'
import type { WishlistItem } from '@/types/api'

export async function getWishlist(): Promise<WishlistItem[]> {
  const { data } = await api.get<WishlistItem[]>('/customer/wishlist')
  return data
}

export async function addToWishlist(productId: number): Promise<WishlistItem> {
  const { data } = await api.post<WishlistItem>(`/customer/wishlist/${productId}`)
  return data
}

export async function removeFromWishlist(productId: number): Promise<void> {
  await api.delete(`/customer/wishlist/${productId}`)
}
