import { apiClient } from './apiClient'

export interface UserProfile {
  id: string
  clerk_user_id?: string
  email: string
  username: string
  display_name?: string
  avatar_url?: string
  role: 'PLAYER' | 'ORGANIZER' | 'SUPER_ADMIN' | 'TOURNAMENT_ADMIN' | 'MATCH_ARBITER' | 'COMMUNITY_MODERATOR'
  inr_balance: string
  inr_balance_paise?: number
  inr_reserved_paise?: number
  riot_id?: string
  steam_id?: string
}

export interface UserSyncPayload {
  clerk_user_id: string
  email: string
  username: string
  display_name?: string
  avatar_url?: string
}

export async function syncUser(payload: UserSyncPayload, token?: string | null): Promise<UserProfile> {
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return apiClient<UserProfile>('/auth/sync', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

export async function getCurrentUserProfile(token?: string | null): Promise<UserProfile> {
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return apiClient<UserProfile>('/auth/me', {
    headers,
  })
}

export interface UserProfileUpdatePayload {
  display_name?: string
  username?: string
  riot_id?: string
  steam_id?: string
  avatar_url?: string
}

export async function updateUserProfile(payload: UserProfileUpdatePayload, token?: string | null): Promise<UserProfile> {
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return apiClient<UserProfile>('/auth/profile', {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  })
}

