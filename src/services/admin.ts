import { apiClient } from './apiClient'
import { optimizeImageForUpload } from '../utils/imageOptimizer'

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
  timestamp?: string
  created_at?: string
  ip_address?: string
  prev_hash?: string
  record_hash?: string
  is_archived?: boolean
  archived_at?: string
  archived_by?: string
  archive_reason?: string
}

export interface PendingPayment {
  id: string
  _id?: string
  user_id: string
  user_name?: string
  username?: string
  user_username?: string
  user_email?: string
  tournament_id?: string
  tournament_title?: string
  team_name?: string
  amount_inr: number
  amount_paise?: number
  utr: string
  sender_upi_id?: string
  payment_method?: string
  payment_type?: string
  status: string
  payment_status?: string
  is_archived?: boolean
  archived_at?: string
  archived_by?: string
  archive_reason?: string
  verified_at?: string
  verified_by?: string
  approved_by?: string
  audited_by?: string
  rejection_reason?: string
  notes?: string
  payment_account_id?: string
  payment_account_code?: string
  upi_id?: string
  payee_name?: string
  qr_url?: string
  screenshot_url?: string
  proof_url?: string
  created_at: string
  updated_at?: string
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

export {
  type SupportTicketStatus,
  SUPPORT_TICKET_STATUS_OPTIONS,
  formatTicketStatus,
} from './support'
import type { SupportTicketStatus } from './support'

export interface SupportTicket {
  id: string
  ticket_id: string
  name: string
  email: string
  category: string
  payment_type?: string
  description: string
  status: SupportTicketStatus | string
  is_archived?: boolean
  archived_at?: string
  has_new_reply?: boolean
  last_message_at?: string
  last_message_by?: string
  messages?: any[]
  internal_notes?: string
  created_at: string
  updated_at?: string
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
export interface AuditLogQuery {
  limit?: number
  skip?: number
  search?: string
  action?: string
  operator?: string
  date_range?: string
  is_archived?: boolean
}

export async function getAuditLogs(params?: AuditLogQuery | number): Promise<AuditLog[]> {
  if (typeof params === 'number') {
    return apiClient<AuditLog[]>(`/admin/audit-logs?limit=${params}`)
  }
  const q = new URLSearchParams()
  if (params?.limit) q.append('limit', String(params.limit))
  if (params?.skip) q.append('skip', String(params.skip))
  if (params?.search) q.append('search', params.search)
  if (params?.action && params.action !== 'ALL') q.append('action', params.action)
  if (params?.operator) q.append('operator', params.operator)
  if (params?.date_range && params.date_range !== 'ALL') q.append('date_range', params.date_range)
  if (params?.is_archived) q.append('is_archived', 'true')
  return apiClient<AuditLog[]>(`/admin/audit-logs?${q.toString()}`)
}

export async function getAuditLogsCount(params?: AuditLogQuery): Promise<{ total: number }> {
  const q = new URLSearchParams()
  if (params?.search) q.append('search', params.search)
  if (params?.action && params.action !== 'ALL') q.append('action', params.action)
  if (params?.operator) q.append('operator', params.operator)
  if (params?.date_range && params.date_range !== 'ALL') q.append('date_range', params.date_range)
  if (params?.is_archived) q.append('is_archived', 'true')
  return apiClient<{ total: number }>(`/admin/audit-logs/count?${q.toString()}`)
}

// Payments & UTR Verifications
export async function getPendingPayments(): Promise<PendingPayment[]> {
  return apiClient<PendingPayment[]>('/admin/payments?status_filter=PENDING')
}

export async function getAdminPayments(statusFilter?: string, isArchived: boolean = false): Promise<PendingPayment[]> {
  const params = new URLSearchParams()
  if (statusFilter && statusFilter !== 'ALL') params.append('status_filter', statusFilter)
  if (isArchived) params.append('is_archived', 'true')
  return apiClient<PendingPayment[]>(`/admin/payments?${params.toString()}`)
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

export async function archivePayment(paymentId: string): Promise<any> {
  return apiClient(`/admin/payments/${paymentId}/archive`, {
    method: 'POST',
  })
}

export async function unarchivePayment(paymentId: string): Promise<any> {
  return apiClient(`/admin/payments/${paymentId}/unarchive`, {
    method: 'POST',
  })
}

export interface RegistrationRevenueAnalytics {
  time_range: string
  confirmed_registrations: number
  reserved_seats: number
  rejected_registrations: number
  approved_tournament_revenue_inr: number
  pending_verification_volume_inr: number
  wallet_topup_volume_inr: number
  tournaments: Array<{
    id: string
    title: string
    confirmed_teams: number
    max_teams: number
    available_slots: number
    entry_fee_inr: number
    approved_revenue_inr: number
  }>
}

export async function getRegistrationRevenueAnalytics(params?: {
  time_range?: string
  start_date?: string
  end_date?: string
}): Promise<RegistrationRevenueAnalytics> {
  const q = new URLSearchParams()
  if (params?.time_range) q.set('time_range', params.time_range)
  if (params?.start_date) q.set('start_date', params.start_date)
  if (params?.end_date) q.set('end_date', params.end_date)
  const qs = q.toString() ? `?${q.toString()}` : ''
  return apiClient<RegistrationRevenueAnalytics>(`/admin/registration-revenue-analytics${qs}`)
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

export async function updateUpiAccount(
  id: string,
  payload: {
    upi_id?: string
    payee_name?: string
    display_name?: string
    qr_url?: string
    status?: string
  }
): Promise<UpiAccount> {
  return apiClient<UpiAccount>(`/admin/upi-accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteUpiAccount(id: string): Promise<any> {
  return apiClient(`/admin/upi-accounts/${id}`, {
    method: 'DELETE',
  })
}

export async function toggleUpiAccountStatus(id: string): Promise<any> {
  return apiClient(`/admin/upi-accounts/${id}/toggle-status`, {
    method: 'POST',
  })
}

// Notification CMS
export interface PlatformNotificationItem {
  id: string
  user_id?: string
  type: string
  category?: string
  title: string
  message: string
  is_read: boolean
  link?: string
  is_archived?: boolean
  archived_at?: string
  archived_by?: string
  created_at: string
}

export async function getAdminPlatformNotifications(params?: {
  search?: string
  notification_type?: string
  category?: string
  is_archived?: boolean
  user_id?: string
  limit?: number
  skip?: number
}): Promise<{ items: PlatformNotificationItem[]; total: number }> {
  const q = new URLSearchParams()
  if (params?.search) q.append('search', params.search)
  if (params?.notification_type && params.notification_type !== 'ALL') q.append('notification_type', params.notification_type)
  if (params?.category && params.category !== 'ALL') q.append('category', params.category)
  if (params?.is_archived) q.append('is_archived', 'true')
  if (params?.user_id) q.append('user_id', params.user_id)
  if (params?.limit) q.append('limit', String(params.limit))
  if (params?.skip) q.append('skip', String(params.skip))
  return apiClient<{ items: PlatformNotificationItem[]; total: number }>(`/admin/notifications?${q.toString()}`)
}

export async function sendAdminPlatformNotification(payload: {
  user_ids: string[]
  title: string
  message: string
  notification_type?: string
  category?: string
  link?: string
}): Promise<any> {
  return apiClient('/admin/notifications/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}


export async function uploadUpiAccountQr(accountId: string, file: File): Promise<{
  status: string
  qr_url: string
  media_id?: string
  account?: UpiAccount
}> {
  const optimized = await optimizeImageForUpload(file, { maxDimension: 1200, maxSizeBytes: 850 * 1024 })
  const formData = new FormData()
  formData.append('file', optimized)
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
  search?: string
  is_archived?: boolean
  limit?: number
  skip?: number
}): Promise<{ tickets: SupportTicket[]; total: number }> {
  const q = new URLSearchParams()
  if (params?.status && params.status !== 'ALL') q.set('status', params.status)
  if (params?.category && params.category !== 'ALL') q.set('category', params.category)
  if (params?.search) q.set('search', params.search)
  if (params?.is_archived !== undefined) q.set('is_archived', String(params.is_archived))
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.skip) q.set('skip', String(params.skip))
  const qs = q.toString()
  return apiClient<{ tickets: SupportTicket[]; total: number }>(`/support/tickets${qs ? `?${qs}` : ''}`)
}

export async function getAdminSupportTicketCounts(): Promise<{ active: number; archived: number; total: number }> {
  return apiClient<{ active: number; archived: number; total: number }>('/support/tickets/counts')
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
  team_ids?: string[]
  user_ids?: string[]
  custom_emails?: string[]
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

export async function getOfficialEmailHistoryAdmin(): Promise<{ total: number; items: any[] }> {
  try {
    return await apiClient('/admin/email/official/history')
  } catch {
    return { total: 0, items: [] }
  }
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
  // If the file is within the 20MB platform limit, upload directly to preserve
  // exact original pixels, format (JPEG, PNG, WebP, SVG), and color fidelity.
  let uploadPayload: File = file
  if (file.size > 20 * 1024 * 1024) {
    uploadPayload = await optimizeImageForUpload(file, {
      maxDimension: 2560,
      maxSizeBytes: 18 * 1024 * 1024,
      preserveFormat: true,
    })
  }

  // Ensure file has appropriate MIME type if missing from the browser
  if (!uploadPayload.type || uploadPayload.type === 'application/octet-stream') {
    const fn = uploadPayload.name.toLowerCase()
    let inferredType = 'image/jpeg'
    if (fn.endsWith('.png')) inferredType = 'image/png'
    else if (fn.endsWith('.webp')) inferredType = 'image/webp'
    else if (fn.endsWith('.svg')) inferredType = 'image/svg+xml'
    else if (fn.endsWith('.gif')) inferredType = 'image/gif'

    uploadPayload = new File([uploadPayload], uploadPayload.name, {
      type: inferredType,
      lastModified: uploadPayload.lastModified || Date.now(),
    })
  }

  const formData = new FormData()
  formData.append('file', uploadPayload)
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

export async function startLiveTournamentAdmin(id: string): Promise<any> {
  return apiClient(`/admin/tournaments/${id}/start-live`, {
    method: 'POST',
  })
}

export async function completeTournamentAdmin(id: string): Promise<any> {
  return apiClient(`/admin/tournaments/${id}/complete`, {
    method: 'POST',
  })
}

// ============================================================================
// SITE & PAGE IMAGE PLACEMENTS SYSTEM
// ============================================================================

export interface PlacementConfig {
  id?: string
  placement_key: string
  page: string
  section: string
  slot_name: string
  asset_url?: string | null
  target_id?: string | null
  focal_x: number
  focal_y: number
  zoom: number
  fit_mode: 'cover' | 'contain' | 'ambient'
  target_aspect_ratio: string
  target_ratio_value?: number
  recommended_resolution: string
  min_width: number
  min_height: number
  description?: string
  is_active?: boolean
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface MediaReference {
  entity_type: 'game' | 'tournament'
  entity_id: string
  entity_name: string
  role: string
  field: string
}

export interface MediaLibraryItem {
  id: string
  url: string
  filename: string
  content_type: string
  size: number
  width?: number | null
  height?: number | null
  created_at?: string
  references?: MediaReference[]
  in_use?: boolean
}

export async function getPlacements(params?: { page?: string; section?: string }): Promise<PlacementConfig[]> {
  const q = new URLSearchParams()
  if (params?.page) q.append('page', params.page)
  if (params?.section) q.append('section', params.section)
  return apiClient<PlacementConfig[]>(`/placements?${q.toString()}`)
}

export async function getPlacement(placementKey: string): Promise<PlacementConfig> {
  return apiClient<PlacementConfig>(`/placements/${placementKey}`)
}

export async function updatePlacement(
  placementKey: string,
  payload: Partial<PlacementConfig>
): Promise<PlacementConfig> {
  return apiClient<PlacementConfig>(`/placements/${placementKey}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function clearPlacementAsset(placementKey: string): Promise<PlacementConfig> {
  return apiClient<PlacementConfig>(`/placements/${placementKey}/asset`, {
    method: 'DELETE',
  })
}

export async function listMediaFiles(params?: {
  search?: string
  entity_type?: string
  content_type?: string
  limit?: number
  skip?: number
}): Promise<{ items: MediaLibraryItem[]; total: number; skip: number; limit: number }> {
  const q = new URLSearchParams()
  if (params?.search) q.append('search', params.search)
  if (params?.entity_type) q.append('entity_type', params.entity_type)
  if (params?.content_type) q.append('content_type', params.content_type)
  if (params?.limit) q.append('limit', String(params.limit))
  if (params?.skip) q.append('skip', String(params.skip))
  return apiClient<{ items: MediaLibraryItem[]; total: number; skip: number; limit: number }>(
    `/media?${q.toString()}`
  )
}

export async function getMediaReferences(
  mediaId: string
): Promise<{ media_id: string; in_use: boolean; references: MediaReference[] }> {
  return apiClient<{ media_id: string; in_use: boolean; references: MediaReference[] }>(
    `/media/${mediaId}/references`
  )
}

export async function deleteMediaFile(
  mediaId: string,
  force: boolean = false
): Promise<{ status: string; message: string; cleared_references_count: number }> {
  const q = force ? '?force=true' : ''
  return apiClient<{ status: string; message: string; cleared_references_count: number }>(
    `/media/${mediaId}${q}`,
    {
      method: 'DELETE',
    }
  )
}

// --- RATING MANAGEMENT WORKFLOW ---

export interface RatingParticipant {
  player_id: string
  username: string
  display_name: string
  avatar_url?: string
  team_id?: string
  team_name?: string
  current_rating: number
}

export interface RatingMatchInfo {
  match_id: string
  title: string
  status: string
  round_id: string
  participants: RatingParticipant[]
}

export interface RatingRoundInfo {
  round_id: string
  round_name: string
  status: string
  matches: RatingMatchInfo[]
}

export interface RatingTournamentInfo {
  tournament_id: string
  title: string
  status: string
  rounds: RatingRoundInfo[]
}

export interface RatingGameHierarchy {
  game_id: string
  game_slug: string
  game_name: string
  tournaments: RatingTournamentInfo[]
}

export interface RatingAdjustmentPayloadItem {
  player_id: string
  game_id: string
  adjustment: number
  reason: string
  explanation: string
  tournament_id?: string
  round_id?: string
  match_id?: string
}

export async function getRatingManagementHierarchy(): Promise<{ status: string; hierarchy: RatingGameHierarchy[] }> {
  return apiClient<{ status: string; hierarchy: RatingGameHierarchy[] }>('/admin/rating-management/hierarchy')
}

export async function adjustRatingsBulk(adjustments: RatingAdjustmentPayloadItem[]): Promise<{ status: string; message: string; audit_logs: any[] }> {
  return apiClient<{ status: string; message: string; audit_logs: any[] }>('/admin/rating-management/adjust-bulk', {
    method: 'POST',
    body: JSON.stringify({ adjustments }),
  })
}

export async function reverseRatingAdjustment(logId: string, reason?: string): Promise<{ status: string; message: string; reversal_log: any }> {
  return apiClient<{ status: string; message: string; reversal_log: any }>(`/admin/rating-management/reverse/${logId}`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function getRatingAuditLogs(params?: {
  game_id?: string
  player_id?: string
  limit?: number
  skip?: number
}): Promise<{ status: string; total: number; logs: any[] }> {
  const q = new URLSearchParams()
  if (params?.game_id && params.game_id !== 'all') q.append('game_id', params.game_id)
  if (params?.player_id) q.append('player_id', params.player_id)
  if (params?.limit) q.append('limit', String(params.limit))
  if (params?.skip) q.append('skip', String(params.skip))
  return apiClient<{ status: string; total: number; logs: any[] }>(`/admin/rating-management/audit-logs?${q.toString()}`)
}


