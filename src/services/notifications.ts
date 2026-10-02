import { apiClient } from './apiClient'

export interface NotificationItem {
  id: string
  _id?: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  link_url?: string
  created_at: string
}

export async function getNotifications(): Promise<NotificationItem[]> {
  return apiClient<NotificationItem[]>('/notifications')
}

export async function markNotificationAsRead(id: string): Promise<any> {
  return apiClient(`/notifications/${id}/read`, {
    method: 'POST',
  })
}

export async function markAllNotificationsAsRead(): Promise<any> {
  return apiClient('/notifications/read-all', {
    method: 'POST',
  })
}
