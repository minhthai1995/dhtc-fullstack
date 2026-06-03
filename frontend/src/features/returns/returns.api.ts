import { api } from '@/lib/axios'

export interface ReturnRequestRead {
  id: number
  order_id: number
  customer_id: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  seller_note: string | null
  created_at: string
}

export async function requestReturn(orderId: number, reason: string): Promise<ReturnRequestRead> {
  const { data } = await api.post<ReturnRequestRead>(`/customer/orders/${orderId}/return`, { reason })
  return data
}

export async function getMyReturns(): Promise<ReturnRequestRead[]> {
  const { data } = await api.get<ReturnRequestRead[]>('/customer/returns')
  return data
}

export async function getSellerReturns(): Promise<ReturnRequestRead[]> {
  const { data } = await api.get<ReturnRequestRead[]>('/seller/returns')
  return data
}

export async function approveReturn(returnId: number, note?: string): Promise<ReturnRequestRead> {
  const { data } = await api.patch<ReturnRequestRead>(`/seller/returns/${returnId}/approve`, { note })
  return data
}

export async function rejectReturn(returnId: number, note?: string): Promise<ReturnRequestRead> {
  const { data } = await api.patch<ReturnRequestRead>(`/seller/returns/${returnId}/reject`, { note })
  return data
}

export async function getAdminReturns(): Promise<ReturnRequestRead[]> {
  const { data } = await api.get<ReturnRequestRead[]>('/admin/returns')
  return data
}

export async function adminApproveReturn(returnId: number, note?: string): Promise<ReturnRequestRead> {
  const { data } = await api.patch<ReturnRequestRead>(`/admin/returns/${returnId}/approve`, { note })
  return data
}

export async function adminRejectReturn(returnId: number, note?: string): Promise<ReturnRequestRead> {
  const { data } = await api.patch<ReturnRequestRead>(`/admin/returns/${returnId}/reject`, { note })
  return data
}
