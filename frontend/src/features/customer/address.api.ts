import { api } from '@/lib/axios'
import type { UserAddress } from '@/types/api'

export interface AddressCreate {
  label?: string
  name: string
  phone: string
  address: string
  city: string
  country?: string
  is_default?: boolean
}

export async function getAddresses(): Promise<UserAddress[]> {
  const { data } = await api.get<UserAddress[]>('/customer/addresses')
  return data
}

export async function createAddress(payload: AddressCreate): Promise<UserAddress> {
  const { data } = await api.post<UserAddress>('/customer/addresses', payload)
  return data
}

export async function deleteAddress(id: number): Promise<void> {
  await api.delete(`/customer/addresses/${id}`)
}

export async function setDefaultAddress(id: number): Promise<UserAddress> {
  const { data } = await api.patch<UserAddress>(`/customer/addresses/${id}/default`)
  return data
}
