import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as addressApi from './address.api'
import type { AddressCreate } from './address.api'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n/useT'

const addressKeys = {
  all: ['addresses'] as const,
}

export function useAddresses() {
  return useQuery({ queryKey: addressKeys.all, queryFn: addressApi.getAddresses })
}

export function useCreateAddress() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: (data: AddressCreate) => addressApi.createAddress(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: addressKeys.all })
      toast(t('toasts.addressAdded'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useDeleteAddress() {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useT()
  return useMutation({
    mutationFn: (id: number) => addressApi.deleteAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: addressKeys.all })
      toast(t('toasts.addressRemoved'), 'success')
    },
    onError: (error: Error) => toast(t('toasts.errorWithMsg').replace('{msg}', error.message), 'error'),
  })
}

export function useSetDefaultAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => addressApi.setDefaultAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  })
}
