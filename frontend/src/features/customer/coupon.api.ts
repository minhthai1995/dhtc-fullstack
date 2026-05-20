import { api } from '@/lib/axios'
import type { CouponValidateResponse } from '@/types/api'

export async function validateCoupon(code: string, orderTotal: number): Promise<CouponValidateResponse> {
  const { data } = await api.post<CouponValidateResponse>('/customer/promotions/validate', {
    code,
    order_total: orderTotal,
  })
  return data
}
