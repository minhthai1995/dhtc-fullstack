import { api } from '@/lib/axios'
import type { UserProfile } from '@/types/api'

export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/customer/profile')
  return data
}

export async function updateProfile(payload: { full_name?: string; phone?: string }): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>('/customer/profile', payload)
  return data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.patch('/auth/password', { current_password: currentPassword, new_password: newPassword })
}
