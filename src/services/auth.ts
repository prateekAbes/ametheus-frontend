import { apiClient } from './apiClient'

export interface UserProfile {
  id: string
  clerk_user_id?: string
  email: string
  username: string
  display_name?: string
  avatar_url?: string
  avatar_source?: 'DEFAULT' | 'CREST' | 'GOOGLE' | 'UPLOADED' | string
  google_avatar_url?: string
  role: 'PLAYER' | 'ORGANIZER' | 'SUPER_ADMIN' | 'TOURNAMENT_ADMIN' | 'MATCH_ARBITER' | 'COMMUNITY_MODERATOR'
  inr_balance: string
  inr_balance_paise?: number
  inr_reserved_paise?: number
  riot_id?: string
  steam_id?: string
  rating?: number
  elo?: number
  preferences?: Record<string, any>
  privacy_settings?: Record<string, any>
  has_chosen_username?: boolean
  needs_username?: boolean
}

export interface UserSyncPayload {
  clerk_user_id: string
  email: string
  username: string
  display_name?: string
  avatar_url?: string
  avatar_source?: string
  google_avatar_url?: string
  has_chosen_username?: boolean
}

export interface UsernameCheckResponse {
  available: boolean
  username: string
  message: string
}

export async function checkUsernameAvailability(username: string): Promise<UsernameCheckResponse> {
  return apiClient<UsernameCheckResponse>(`/auth/check-username?username=${encodeURIComponent(username)}`)
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
  avatar_source?: string
  google_avatar_url?: string
  preferences?: Record<string, any>
  privacy_settings?: Record<string, any>
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

export async function deleteAccount(token?: string | null): Promise<{ status: string; message: string }> {
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return apiClient<{ status: string; message: string }>('/auth/me', {
    method: 'DELETE',
    headers,
  })
}
