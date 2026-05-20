import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, updateProfile, changePassword } from './profile.api'
import { useToast } from '@/components/ui/Toast'

export const profileKeys = {
  profile: ['customer', 'profile'] as const,
}

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.profile,
    queryFn: getProfile,
    enabled: !!sessionStorage.getItem('access_token'),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.profile }),
  })
}

export function useChangePassword() {
  const toast = useToast()
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      changePassword(currentPassword, newPassword),
    onSuccess: () => toast('Đã đổi mật khẩu thành công', 'success'),
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast(axiosErr?.response?.data?.detail || 'Không thể đổi mật khẩu', 'error')
    },
  })
}
