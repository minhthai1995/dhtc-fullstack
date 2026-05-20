import { api } from '@/lib/axios'

export interface NotificationItem {
  id: number
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  reference_id: number | null
  created_at: string
}

export async function getNotifications(unreadOnly = false): Promise<NotificationItem[]> {
  const { data } = await api.get('/notifications', { params: unreadOnly ? { unread_only: true } : {} })
  return data
}

export async function getUnreadCount(): Promise<{ unread: number }> {
  const { data } = await api.get('/notifications/unread-count')
  return data
}

export async function markRead(id: number): Promise<NotificationItem> {
  const { data } = await api.patch(`/notifications/${id}/read`)
  return data
}

export async function markAllRead(): Promise<void> {
  await api.patch('/notifications/read-all')
}
