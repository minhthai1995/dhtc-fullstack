import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMe, login, logout, register, type LoginPayload, type RegisterPayload } from './auth.api'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: getMe,
    enabled: !!sessionStorage.getItem('access_token'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (data) => {
      sessionStorage.setItem('access_token', data.access_token)
      queryClient.invalidateQueries({ queryKey: authKeys.me })
      window.location.href = '/'
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear()
      window.location.href = '/login'
    },
  })
}

export function useIsAuthenticated(): boolean {
  return !!sessionStorage.getItem('access_token')
}
