import { apiClient } from "./client";

export interface NotificationItem {
  id: string;
  type: "SYSTEM" | "TOURNAMENT" | "MATCH" | "PAYMENT" | "DISPUTE" | string;
  title: string;
  message: string;
  is_read: boolean;
  link?: string | null;
  created_at?: string | null;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unread_count: number;
}

export async function getNotifications(): Promise<NotificationListResponse> {
  try {
    return await apiClient<NotificationListResponse>("/notifications");
  } catch {
    return { items: [], unread_count: 0 };
  }
}

export async function markNotificationAsRead(id: string): Promise<NotificationItem> {
  return apiClient<NotificationItem>(`/notifications/${id}/read`, {
    method: "POST",
  });
}

export async function markAllNotificationsAsRead(): Promise<{ status: string; updated: number }> {
  return apiClient<{ status: string; updated: number }>("/notifications/read-all", {
    method: "POST",
  });
}
