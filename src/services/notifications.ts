import { apiClient } from './apiClient'

export interface NotificationItem {
  id: string
  _id?: string
  user_id: string
  title: string
  message: string
  type: string
  category?: string
  sender_role?: string
  sender_name?: string
  label?: string
  is_read: boolean
  is_cleared?: boolean
  link_url?: string
  created_at: string
}

export async function getNotifications(category?: string): Promise<NotificationItem[]> {
  const query = category && category.toUpperCase() !== 'ALL'
    ? `?category=${encodeURIComponent(category.toUpperCase())}`
    : ''
  const res = await apiClient<any>(`/notifications${query}`)
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.items)) return res.items
  return []
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

export async function clearNotification(id: string): Promise<any> {
  return apiClient(`/notifications/${id}/clear`, {
    method: 'POST',
  })
}

export async function clearAllNotifications(): Promise<any> {
  return apiClient('/notifications/clear-all', {
    method: 'POST',
  })
}

