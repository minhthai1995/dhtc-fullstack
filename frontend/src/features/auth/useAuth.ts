import { useMutation } from '@tanstack/react-query'
import { login, logout, type LoginPayload } from './auth.api'

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (data) => {
      sessionStorage.setItem('access_token', data.access_token)
      window.location.href = '/'
    },
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      sessionStorage.removeItem('access_token')
      window.location.href = '/login'
    },
  })
}

export function useIsAuthenticated(): boolean {
  return !!sessionStorage.getItem('access_token')
}
