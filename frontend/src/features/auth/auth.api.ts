import { api } from '@/lib/axios'
import type { TokenResponse } from '@/types/api'

export interface LoginPayload {
  username: string
  password: string
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  // FastAPI OAuth2PasswordRequestForm expects form data, not JSON
  const form = new URLSearchParams()
  form.append('username', payload.username)
  form.append('password', payload.password)
  const { data } = await api.post<TokenResponse>('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}
