import { apiClient } from './apiClient'

export interface AdminStats {
  total_users: number
  total_tournaments: number
  total_matches: number
  total_teams: number
  active_tournaments: number
  live_matches: number
  pending_payments_count: number
  open_tickets_count: number
  platform_escrow_vault?: number
  pending_disputes?: number
}

export interface AdminUser {
  id: string
  _id?: string
  clerk_user_id?: string
  email: string
  username: string
  display_name?: string
  role: string
  inr_balance: string
  created_at: string
}

export interface AuditLog {
  id: string
  _id?: string
  operator: string
  role: string
  action: string
  target: string
  details?: string
  created_at: string
}

export interface PendingPayment {
  id: string
  _id?: string
  user_id: string
  user_email?: string
  tournament_id?: string
  amount_inr: number
  utr: string
  sender_upi_id?: string
  payment_status: string
  created_at: string
}

export interface PayoutRecord {
  id: string
  payout_type: string
  user_id: string
  user_name?: string
  amount_inr: number
  destination: string
  upi_id?: string
  game_name?: string
  status: 'PENDING' | 'PAID' | 'REJECTED'
  outgoing_utr?: string
  rejection_reason?: string
  created_at: string
}

export interface UpiAccount {
  id: string
  code: string
  upi_id: string
  payee_name: string
  display_name?: string
  status: 'ACTIVE' | 'INACTIVE'
  payment_count: number
  qr_url?: string
}

export interface SupportTicket {
  id: string
  ticket_id: string
  name: string
  email: string
  category: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED'
  internal_notes?: string
  created_at: string
}

export interface GameRegulation {
  id: string
  game_name: string
  chapter_code: string
  title: string
  format: string
  server: string
  map_pool: string[]
  rules: string[]
  is_active: boolean
}

export interface EmailSystemStatus {
  email_enabled: boolean
  services: {
    support: { status: string; email: string; configured: boolean; smtp_host: string }
    noreply: { status: string; email: string; configured: boolean; smtp_host: string }
    official: { status: string; email: string; configured: boolean; smtp_host: string }
  }
}

export interface PageMediaConfig {
  page_id: string
  title?: string
  media_type: 'gif' | 'image'
  media_url: string
  fallback_url?: string
  is_active: boolean
  opacity?: number
  is_locked?: boolean
}

// Stats & Users
export interface PublicPlatformStats {
  total_users: number
  total_tournaments: number
  total_games: number
  total_matches: number
  total_teams: number
  total_payout_inr: number
}

export async function getPublicPlatformStats(): Promise<PublicPlatformStats> {
  return apiClient<PublicPlatformStats>('/platform/stats')
}

export async function getAdminStats(): Promise<AdminStats> {
  return apiClient<AdminStats>('/admin/stats')
}

export async function getAdminUsers(limit: number = 100): Promise<AdminUser[]> {
  return apiClient<AdminUser[]>(`/admin/users?limit=${limit}`)
}

export async function setUserRole(userId: string, role: string): Promise<any> {
  return apiClient(`/admin/users/${userId}/set-role`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  })
}

export async function promoteUserToOrganizer(userId: string): Promise<any> {
  return apiClient(`/admin/users/${userId}/promote-organizer`, {
    method: 'POST',
  })
}

export async function getUserWalletSummary(userId: string): Promise<any> {
  return apiClient(`/admin/users/${userId}/wallet-summary`)
}

// Audit Logs
export async function getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  return apiClient<AuditLog[]>(`/admin/audit-logs?limit=${limit}`)
}

// Payments & UTR Verifications
export async function getPendingPayments(): Promise<PendingPayment[]> {
  return apiClient<PendingPayment[]>('/admin/payments?status_filter=PENDING')
}

export async function getAdminPayments(statusFilter?: string): Promise<PendingPayment[]> {
  const q = statusFilter && statusFilter !== 'ALL' ? `?status_filter=${statusFilter}` : ''
  return apiClient<PendingPayment[]>(`/admin/payments${q}`)
}

export async function approvePayment(paymentId: string): Promise<any> {
  return apiClient(`/admin/payments/${paymentId}/approve`, {
    method: 'POST',
  })
}

export async function rejectPayment(paymentId: string, notes?: string): Promise<any> {
  return apiClient(`/admin/payments/${paymentId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ notes, rejection_reason: notes }),
  })
}

// UPI Accounts
export async function getAdminUpiAccounts(): Promise<UpiAccount[]> {
  return apiClient<UpiAccount[]>('/admin/upi-accounts')
}

export async function createUpiAccount(payload: {
  code: string
  upi_id: string
  payee_name: string
  display_name?: string
  qr_url?: string
}): Promise<UpiAccount> {
  return apiClient<UpiAccount>('/admin/upi-accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function toggleUpiAccountStatus(id: string): Promise<any> {
  return apiClient(`/admin/upi-accounts/${id}/toggle-status`, {
    method: 'POST',
  })
}

export async function uploadUpiAccountQr(accountId: string, file: File): Promise<{
  status: string
  qr_url: string
  media_id?: string
  account?: UpiAccount
}> {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient<{
    status: string
    qr_url: string
    media_id?: string
    account?: UpiAccount
  }>(`/admin/upi-accounts/${accountId}/qr`, {
    method: 'POST',
    body: formData,
  })
}

// Payouts Ledger
export async function getAdminPayouts(statusFilter?: string): Promise<PayoutRecord[]> {
  const q = statusFilter && statusFilter !== 'ALL' ? `?status_filter=${statusFilter}` : ''
  return apiClient<PayoutRecord[]>(`/admin/payouts${q}`)
}

export async function createWinningPayout(payload: {
  user_id: string
  game_id: string
  rank_or_placement: string
  amount_inr: number
  destination: string
  upi_id?: string
}): Promise<any> {
  return apiClient('/admin/payouts/create-winning', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function completePayout(payoutId: string, outgoingUtr: string): Promise<any> {
  return apiClient(`/admin/payouts/${payoutId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ outgoing_utr: outgoingUtr }),
  })
}

export async function rejectPayout(payoutId: string, reason: string): Promise<any> {
  return apiClient(`/admin/payouts/${payoutId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejection_reason: reason }),
  })
}

// Disputes & Verification
export async function getDisputes(): Promise<any[]> {
  return apiClient<any[]>('/admin/disputes')
}

export async function resolveDispute(disputeId: string, payload: any): Promise<any> {
  return apiClient(`/admin/disputes/${disputeId}/resolve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function verifyMatchResult(matchId: string): Promise<any> {
  return apiClient(`/admin/matches/${matchId}/verify-result`, {
    method: 'POST',
  })
}

// Games Catalog
export async function createGame(payload: any): Promise<any> {
  return apiClient('/games', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateGame(gameId: string, payload: any): Promise<any> {
  return apiClient(`/games/${gameId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteGame(gameId: string): Promise<any> {
  return apiClient(`/games/${gameId}`, {
    method: 'DELETE',
  })
}

export async function publishGame(gameId: string): Promise<any> {
  return apiClient(`/games/${gameId}/publish`, {
    method: 'POST',
  })
}

// Support Tickets
export async function getAdminSupportTickets(params?: {
  status?: string
  category?: string
  limit?: number
}): Promise<{ tickets: SupportTicket[]; total: number }> {
  const q = new URLSearchParams()
  if (params?.status && params.status !== 'ALL') q.set('status', params.status)
  if (params?.category && params.category !== 'ALL') q.set('category', params.category)
  if (params?.limit) q.set('limit', String(params.limit))
  const qs = q.toString()
  return apiClient<{ tickets: SupportTicket[]; total: number }>(`/support/tickets${qs ? `?${qs}` : ''}`)
}

export async function updateSupportTicket(
  ticketId: string,
  payload: { status?: string; internal_notes?: string }
): Promise<any> {
  return apiClient(`/support/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function retrySupportTicketEmail(ticketId: string): Promise<any> {
  return apiClient(`/support/tickets/${ticketId}/retry-email`, {
    method: 'POST',
    body: JSON.stringify({ target: 'ALL' }),
  })
}

// Regulations & Rules
export async function getRegulations(): Promise<GameRegulation[]> {
  return apiClient<GameRegulation[]>('/regulations?all=true')
}

export async function createRegulation(payload: any): Promise<GameRegulation> {
  return apiClient<GameRegulation>('/regulations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateRegulation(id: string, payload: any): Promise<GameRegulation> {
  return apiClient<GameRegulation>(`/regulations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteRegulation(id: string): Promise<any> {
  return apiClient(`/regulations/${id}`, {
    method: 'DELETE',
  })
}

// Email Settings
export async function getEmailSystemStatusAdmin(): Promise<EmailSystemStatus> {
  return apiClient<EmailSystemStatus>('/admin/email/status')
}

export async function sendTestEmailAdmin(payload: { service: string; to_email: string }): Promise<any> {
  return apiClient('/admin/email/send-test', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function sendOfficialEmailAdmin(payload: {
  recipient_type: string
  subject: string
  message: string
}): Promise<any> {
  return apiClient('/admin/email/official/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function sendPersonalEmailAdmin(payload: {
  recipient_email: string
  recipient_name?: string
  sender_identity?: string
  subject: string
  message: string
}): Promise<{
  success: boolean
  error_code?: string
  error_detail?: string
  message_id?: string
  sender?: string
  recipient?: string
  timestamp?: string
}> {
  return apiClient('/admin/email/send-personal', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}


// Page Media
export async function getAllPageMedia(): Promise<PageMediaConfig[]> {
  try {
    return await apiClient<PageMediaConfig[]>('/media/pages')
  } catch {
    return []
  }
}

export async function getPageMedia(pageId: string): Promise<PageMediaConfig | null> {
  try {
    return await apiClient<PageMediaConfig>(`/media/pages/${pageId}`)
  } catch {
    return null
  }
}

export async function updatePageMedia(pageId: string, payload: Partial<PageMediaConfig>): Promise<any> {
  return apiClient(`/media/pages/${pageId}`, {
    method: 'PUT',
    body: JSON.stringify({ ...payload, page_id: pageId }),
  })
}

// Notifications Dispatcher
export async function sendAdminNotification(payload: {
  user_id?: string
  title: string
  message: string
  notification_type?: string
}): Promise<any> {
  return apiClient('/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Media Upload
export async function uploadMediaFile(file: File): Promise<{
  status: string
  id: string
  url: string
  data_url: string
  filename: string
}> {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient<{
    status: string
    id: string
    url: string
    data_url: string
    filename: string
  }>('/media/upload', {
    method: 'POST',
    body: formData,
  })
}

// Tournament Registered Rosters
export async function getTournamentRegisteredRosters(tournamentId: string): Promise<any> {
  return apiClient(`/admin/tournaments/${tournamentId}/registered-rosters`)
}
