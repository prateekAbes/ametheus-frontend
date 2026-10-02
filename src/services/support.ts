import { apiClient } from './apiClient'

export interface SupportTicketMessage {
  id?: string
  sender_id: string
  sender_name: string
  message: string
  created_at: string
}

export interface SupportTicket {
  id: string
  _id?: string
  ticket_number?: string
  subject: string
  category: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  user_id: string
  created_at: string
  updated_at: string
  messages: SupportTicketMessage[]
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
  return apiClient<SupportTicket[]>('/support/tickets')
}

export async function createSupportTicket(payload: {
  subject: string
  category: string
  message: string
  priority?: string
}): Promise<SupportTicket> {
  return apiClient<SupportTicket>('/support/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function replyToSupportTicket(
  ticketId: string,
  message: string
): Promise<SupportTicket> {
  return apiClient<SupportTicket>(`/support/tickets/${ticketId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}
