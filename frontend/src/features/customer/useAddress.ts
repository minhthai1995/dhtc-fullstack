import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as addressApi from './address.api'
import type { AddressCreate } from './address.api'
import { useToast } from '@/components/ui/Toast'

const addressKeys = {
  all: ['addresses'] as const,
}

export function useAddresses() {
  return useQuery({ queryKey: addressKeys.all, queryFn: addressApi.getAddresses })
}

export function useCreateAddress() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (data: AddressCreate) => addressApi.createAddress(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: addressKeys.all })
      toast('Đã thêm địa chỉ', 'success')
    },
    onError: (error: Error) => toast('Lỗi: ' + error.message, 'error'),
  })
}

export function useDeleteAddress() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: number) => addressApi.deleteAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: addressKeys.all })
      toast('Đã xoá địa chỉ', 'success')
    },
    onError: (error: Error) => toast('Lỗi: ' + error.message, 'error'),
  })
}

export function useSetDefaultAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => addressApi.setDefaultAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  })
}
