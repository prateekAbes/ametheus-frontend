import { apiClient } from './apiClient'

export interface SupportTicketMessage {
  id?: string
  sender_id: string
  sender_name: string
  message: string
  created_at: string
}

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED'

export const SUPPORT_TICKET_STATUS_OPTIONS: { value: SupportTicketStatus; label: string; badgeClass: string }[] = [
  { value: 'OPEN', label: 'Open', badgeClass: 'border-cyan text-cyan bg-cyan/10' },
  { value: 'IN_PROGRESS', label: 'In Progress', badgeClass: 'border-amber-400 text-amber-400 bg-amber-400/10' },
  { value: 'WAITING_FOR_USER', label: 'Waiting for User', badgeClass: 'border-warn text-warn bg-warn/10' },
  { value: 'RESOLVED', label: 'Resolved', badgeClass: 'border-ok text-ok bg-ok/10' },
  { value: 'CLOSED', label: 'Closed', badgeClass: 'border-dim text-dim bg-white/5' },
]

export function formatTicketStatus(status?: string): { label: string; badgeClass: string; value: SupportTicketStatus } {
  const norm = (status || 'OPEN').toUpperCase().replace(/\s+/g, '_')
  if (norm === 'IN_PROGRESS' || norm === 'INPROGRESS' || norm === 'WAITING_FOR_ADMIN' || norm === 'ON_HOLD') {
    return { label: 'In Progress', badgeClass: 'border-amber-400 text-amber-400 bg-amber-400/10', value: 'IN_PROGRESS' }
  }
  if (norm === 'WAITING_FOR_USER' || norm === 'WAITINGFORUSER') {
    return { label: 'Waiting for User', badgeClass: 'border-warn text-warn bg-warn/10', value: 'WAITING_FOR_USER' }
  }
  if (norm === 'RESOLVED') {
    return { label: 'Resolved', badgeClass: 'border-ok text-ok bg-ok/10', value: 'RESOLVED' }
  }
  if (norm === 'CLOSED' || norm === 'ARCHIVED') {
    return { label: 'Closed', badgeClass: 'border-dim text-dim bg-white/5', value: 'CLOSED' }
  }
  // Default to Open (guarantees tournament/legacy statuses never leak)
  return { label: 'Open', badgeClass: 'border-cyan text-cyan bg-cyan/10', value: 'OPEN' }
}

export interface SupportTicket {
  id: string
  _id?: string
  ticket_id?: string
  name?: string
  email?: string
  subject?: string
  category: string
  payment_type?: string
  description?: string
  message?: string
  status: SupportTicketStatus | string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string
  user_id?: string
  created_at: string
  updated_at?: string
  messages?: SupportTicketMessage[]
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
  try {
    return await apiClient<SupportTicket[]>('/support/my-tickets')
  } catch {
    try {
      const res = await apiClient<{ tickets: SupportTicket[] }>('/support/tickets')
      return res.tickets || []
    } catch {
      return []
    }
  }
}

export async function createSupportTicket(payload: {
  name?: string
  email?: string
  subject?: string
  category: string
  payment_type?: string
  description?: string
  message?: string
  priority?: string
}): Promise<any> {
  const desc = payload.description || payload.message || payload.subject || 'Support Request'
  const body: any = {
    ...payload,
    name: payload.name || 'Contender',
    email: payload.email || 'support@ametheus.games',
    description: desc,
    message: payload.message || desc,
    subject: payload.subject || desc.slice(0, 50),
  }
  return apiClient('/support/tickets', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function replyToSupportTicket(
  ticketId: string,
  message: string,
  status?: string
): Promise<SupportTicket> {
  return apiClient<SupportTicket>(`/support/tickets/${ticketId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message, status }),
  })
}

export interface UserSupportGroup {
  _id: string
  email?: string
  user_name?: string
  user_id?: string
  total_tickets: number
  open_tickets: number
  latest_activity: string
  tickets: SupportTicket[]
}

export async function getUsersWithSupportTickets(search?: string, isArchived: boolean = false): Promise<UserSupportGroup[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (isArchived) params.set('is_archived', 'true')
  const qs = params.toString()
  return apiClient<UserSupportGroup[]>(`/support/users-with-tickets${qs ? `?${qs}` : ''}`)
}

export async function toggleArchiveSupportTicket(ticketId: string): Promise<SupportTicket> {
  return apiClient<SupportTicket>(`/support/tickets/${ticketId}/archive`, {
    method: 'POST',
  })
}
