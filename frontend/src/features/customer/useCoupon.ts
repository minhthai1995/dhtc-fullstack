import { useMutation } from '@tanstack/react-query'
import { validateCoupon } from './coupon.api'
import type { CouponValidateResponse } from '@/types/api'

export function useValidateCoupon() {
  return useMutation<CouponValidateResponse, Error, { code: string; orderTotal: number }>({
    mutationFn: ({ code, orderTotal }) => validateCoupon(code, orderTotal),
  })
}
