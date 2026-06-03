import { useQuery } from '@tanstack/react-query'
import { getMerchantShippingZones } from './shipping.api'
import type { ShippingZoneRead } from '@/types/api'

export function useMerchantShippingZones(
  merchantId: number | null | undefined,
  country?: string,
) {
  return useQuery<ShippingZoneRead[]>({
    queryKey: ['merchant-shipping-zones', merchantId, country ?? null],
    queryFn: () => getMerchantShippingZones(merchantId as number, country),
    enabled: typeof merchantId === 'number' && merchantId > 0,
    staleTime: 5 * 60 * 1000,
  })
}
