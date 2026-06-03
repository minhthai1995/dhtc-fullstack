import { api } from '@/lib/axios'
import type { ShippingZoneRead } from '@/types/api'

export async function getMerchantShippingZones(
  merchantId: number,
  country?: string,
): Promise<ShippingZoneRead[]> {
  const params: Record<string, string> = {}
  if (country) params.country = country
  const { data } = await api.get<ShippingZoneRead[]>(
    `/customer/merchants/${merchantId}/shipping`,
    { params },
  )
  return data
}
