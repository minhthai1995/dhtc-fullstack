import { api } from '@/lib/axios'

export interface ConfigItem {
  key: string
  value: string
  description?: string
}

export async function getSettings(): Promise<ConfigItem[]> {
  const { data } = await api.get<ConfigItem[]>('/admin/settings')
  return data
}

export async function saveSettings(items: ConfigItem[]): Promise<ConfigItem[]> {
  const { data } = await api.put<ConfigItem[]>('/admin/settings', items)
  return data
}
