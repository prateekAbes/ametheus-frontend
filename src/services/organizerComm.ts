import { apiClient } from './apiClient'

export interface MatchRequest {
  id: string
  _id?: string
  organizer_id: string
  organizer_name: string
  organizer_email?: string
  tournament_id: string
  tournament_name?: string
  tournament_title?: string
  match_id?: string
  title?: string
  team_a_name?: string
  team_b_name?: string
  round_name?: string
  scheduled_at?: string
  youtube_live_url?: string
  notes?: string
  urgency: 'NORMAL' | 'HIGH' | 'URGENT' | string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_REVIEW' | string
  admin_notes?: string
  created_at: string
  updated_at?: string
}

export interface OrganizerEmailMessage {
  id: string
  sender_id: string
  sender_name: string
  sender_role: 'ORGANIZER' | 'ADMIN' | string
  message: string
  created_at: string
}

export interface OrganizerEmailThread {
  id: string
  _id?: string
  organizer_id: string
  organizer_name: string
  organizer_email: string
  subject: string
  category: 'GENERAL' | 'TOURNAMENT' | 'MATCH_DISPUTE' | 'PAYOUT' | 'TECHNICAL' | string
  urgency: 'NORMAL' | 'HIGH' | 'URGENT' | string
  status: 'UNREAD' | 'OPEN' | 'WAITING_FOR_ORGANIZER' | 'WAITING_FOR_ADMIN' | 'RESOLVED' | 'CLOSED' | string
  messages: OrganizerEmailMessage[]
  created_at: string
  updated_at: string
}

// Organizer actions
export async function createMatchRequest(payload: {
  tournament_id: string
  match_id?: string
  title?: string
  team_a_name?: string
  team_b_name?: string
  round_name?: string
  scheduled_at?: string
  youtube_live_url?: string
  notes?: string
  urgency?: string
}): Promise<MatchRequest> {
  return apiClient<MatchRequest>('/organizer/match-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getMyMatchRequests(): Promise<MatchRequest[]> {
  return apiClient<MatchRequest[]>('/organizer/match-requests')
}

export async function sendOrganizerEmail(payload: {
  subject: string
  message: string
  category?: string
  urgency?: string
}): Promise<OrganizerEmailThread> {
  return apiClient<OrganizerEmailThread>('/organizer/emails', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getMyOrganizerEmails(): Promise<OrganizerEmailThread[]> {
  return apiClient<OrganizerEmailThread[]>('/organizer/emails')
}

export async function replyToOrganizerEmailThread(
  threadId: string,
  message: string
): Promise<OrganizerEmailThread> {
  return apiClient<OrganizerEmailThread>(`/organizer/emails/${threadId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

// Admin actions
export async function getAdminMatchRequests(params?: {
  status?: string
  urgency?: string
}): Promise<MatchRequest[]> {
  const q = new URLSearchParams()
  if (params?.status && params.status !== 'ALL') q.set('status', params.status)
  if (params?.urgency && params.urgency !== 'ALL') q.set('urgency', params.urgency)
  const qs = q.toString()
  return apiClient<MatchRequest[]>(`/admin/match-requests${qs ? `?${qs}` : ''}`)
}

export async function actionAdminMatchRequest(
  requestId: string,
  payload: {
    status: string
    admin_notes?: string
    make_match_live?: boolean
  }
): Promise<MatchRequest> {
  return apiClient<MatchRequest>(`/admin/match-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function getAdminOrganizerEmails(params?: {
  status?: string
  category?: string
}): Promise<OrganizerEmailThread[]> {
  const q = new URLSearchParams()
  if (params?.status && params.status !== 'ALL') q.set('status', params.status)
  if (params?.category && params.category !== 'ALL') q.set('category', params.category)
  const qs = q.toString()
  return apiClient<OrganizerEmailThread[]>(`/admin/organizer-emails${qs ? `?${qs}` : ''}`)
}

export async function replyAdminOrganizerEmail(
  threadId: string,
  message: string,
  status?: string
): Promise<OrganizerEmailThread> {
  return apiClient<OrganizerEmailThread>(`/admin/organizer-emails/${threadId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message, status }),
  })
}

export async function updateAdminOrganizerEmailStatus(
  threadId: string,
  status: string
): Promise<OrganizerEmailThread> {
  return apiClient<OrganizerEmailThread>(`/admin/organizer-emails/${threadId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
