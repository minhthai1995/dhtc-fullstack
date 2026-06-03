import { api } from '@/lib/axios'

export type ConsentEventType =
  | 'cookie_accept'
  | 'cookie_reject'
  | 'privacy_accept'
  | 'marketing_opt_in'
  | 'marketing_opt_out'

export interface ConsentLogCreate {
  event_type: ConsentEventType
  user_id?: number
  session_id?: string
}

export interface ConsentLogRead {
  id: number
  event_type: ConsentEventType
  created_at: string
}

export async function logConsent(payload: ConsentLogCreate): Promise<ConsentLogRead> {
  const { data } = await api.post<ConsentLogRead>('/consent/log', payload)
  return data
}
