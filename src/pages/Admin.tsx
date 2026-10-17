import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router'
import { Container, Hud, Badge, Dot, Cta, SectionHead, Modal, Panel, Portal } from '../components/ui'
import { LiveMatchesManager } from '../components/admin/LiveMatchesManager'
import { RatingManager } from '../components/admin/RatingManager'
import { useAuthContext } from '../context/AuthContext'
import {
  getAdminStats,
  getAdminUsers,
  setUserRole,
  promoteUserToOrganizer,
  getPendingPayments,
  getAdminPayments,
  getAdminPaymentsSummary,
  type AdminPaymentsSummary,
  type AdminPaymentQueryParams,
  getRegistrationRevenueAnalytics,
  approvePayment,
  rejectPayment,
  getAdminUpiAccounts,
  createUpiAccount,
  updateUpiAccount,
  deleteUpiAccount,
  toggleUpiAccountStatus,
  uploadUpiAccountQr,
  getAdminPayouts,
  createWinningPayout,
  completePayout,
  rejectPayout,
  getAdminSupportTickets,
  getAdminSupportTicketCounts,
  updateSupportTicket,
  retrySupportTicketEmail,
  getRegulations,
  createRegulation,
  deleteRegulation,
  getEmailSystemStatusAdmin,
  sendTestEmailAdmin,
  sendOfficialEmailAdmin,
  sendPersonalEmailAdmin,
  getOfficialEmailHistoryAdmin,
  startLiveTournamentAdmin,
  completeTournamentAdmin,
  uploadMediaFile,
  getTournamentRegisteredRosters,
  getDisputes,
  resolveDispute,
  getAuditLogs,
  getAuditLogsCount,
  archivePayment,
  unarchivePayment,
  getAdminPlatformNotifications,
  sendAdminPlatformNotification,
  createGame,
  updateGame,
  deleteGame,
  publishGame,
  AdminStats,
  AdminUser,
  PendingPayment,
  RegistrationRevenueAnalytics,
  PayoutRecord,
  UpiAccount,
  SupportTicket,
  formatTicketStatus,
  SUPPORT_TICKET_STATUS_OPTIONS,
  GameRegulation,
  EmailSystemStatus,
  AuditLog,
  PlatformNotificationItem,
} from '../services/admin'
import { getGames, Game } from '../services/games'
import {
  getTournaments,
  getFeaturedTournament,
  setFeaturedTournament,
  normalizeTournament,
  Tournament,
} from '../services/tournaments'
import {
  getGenres,
  createGenre,
  updateGenre,
  deleteGenre,
  addGameToGenre,
  removeGameFromGenre,
  Genre,
  GenreCreatePayload,
} from '../services/genres'
import {
  getAdminReviews,
  moderateReview,
  deleteReview,
  ReviewItem,
} from '../services/reviews'
import {
  getAllCrestsAdmin,
  createCrestAdmin,
  updateCrestAdmin,
  deleteCrestAdmin,
  type Crest,
} from '../services/crests'
import {
  getMyOrganizedTournaments,
  createTournamentOrganizer,
  updateTournamentOrganizer,
  deleteTournamentOrganizer,
  publishTournamentOrganizer,
  closeRegistrationOrganizer,
  reopenRegistrationOrganizer,
  generateBracketOrganizer,
  cancelTournamentOrganizer,
} from '../services/organizer'
import { getMatches, updateMatch, ApiMatch } from '../services/matches'
import {
  getUsersWithSupportTickets,
  replyToSupportTicket,
  archiveSupportTicket,
  restoreSupportTicket,
  toggleArchiveSupportTicket,
  getSupportTicketDetails,
  UserSupportGroup,
} from '../services/support'
import {
  getAdminMatchRequests,
  actionAdminMatchRequest,
  MatchRequest,
  getAdminOrganizerEmails,
  replyAdminOrganizerEmail,
  updateAdminOrganizerEmailStatus,
  OrganizerEmailThread,
} from '../services/organizerComm'
import { CANONICAL_CATEGORIES } from '../lib/categories'
import { resolveMediaUrl, apiClient } from '../services/apiClient'
import { inr } from '../lib/data'
import { DynamicImage } from '../components/DynamicImage'
import { BannerImageUploader } from '../components/admin/BannerImageUploader'
import { MediaArtworkManager } from '../components/admin/MediaArtworkManager'

export function formatAuditTimestamp(raw?: string | null): string {
  if (!raw || raw === 'None' || raw === 'null' || raw === 'undefined' || raw.trim() === '') {
    return 'Timestamp unavailable'
  }
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return 'Timestamp unavailable'
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return 'Timestamp unavailable'
  }
}

export function formatPaymentDateTime(raw?: string | null): string {
  if (!raw || raw === 'None' || raw === 'null' || raw === 'undefined' || raw.trim() === '') {
    return 'N/A'
  }
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return 'N/A'
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    const parts = formatter.formatToParts(d)
    const day = parts.find((p) => p.type === 'day')?.value || ''
    const month = parts.find((p) => p.type === 'month')?.value || ''
    const year = parts.find((p) => p.type === 'year')?.value || ''
    const hour = parts.find((p) => p.type === 'hour')?.value || ''
    const minute = parts.find((p) => p.type === 'minute')?.value || ''
    const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value?.toUpperCase() || ''

    return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod} IST`
  } catch {
    return 'N/A'
  }
}

export function toLocalDatetimeInputString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function getDefaultStartLocal(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  d.setHours(18, 0, 0, 0)
  return toLocalDatetimeInputString(d)
}

export function getDefaultLockLocal(startLocal?: string): string {
  if (startLocal) {
    const d = new Date(startLocal)
    if (!isNaN(d.getTime())) {
      d.setHours(d.getHours() - 2)
      return toLocalDatetimeInputString(d)
    }
  }
  const d = new Date()
  d.setDate(d.getDate() + 7)
  d.setHours(16, 0, 0, 0)
  return toLocalDatetimeInputString(d)
}

export function isoToLocalDatetimeInputString(isoStr?: string | null): string {
  if (!isoStr || isoStr === 'TBD') return ''
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return ''
    return toLocalDatetimeInputString(d)
  } catch {
    return ''
  }
}

const TABS = [
  'OVERVIEW',
  'MEDIA & ARTWORK MANAGER',
  'TOURNAMENTS',
  'LIVE MATCHES',
  'RATING MANAGEMENT',
  'ORGANIZER MATCH REQUESTS',
  'ORGANIZER EMAILS',
  'FEATURED TOURNAMENT',
  'GAMES CATALOG',
  'GENRES & CATEGORIES',
  'REVIEWS MODERATION',
  'PLAYER CRESTS',
  'USERS & ROLES',
  'PENDING PAYMENTS',
  'UPI & QR ACCOUNTS',
  'PAYOUTS LEDGER',
  'SUPPORT TICKETS',
  'RULES & REGULATIONS',
  'EMAIL COMMUNICATIONS',
  'NOTIFICATION CMS',
  'DISPUTES & QUEUE',
  'AUDIT LOGS',
  'SMTP RELAY DIAGNOSTICS',
] as const

export default function Admin() {
  const { profile, isSuperAdmin, isLoading: authLoading } = useAuthContext()
  const [tab, setTab] = useState<(typeof TABS)[number]>('OVERVIEW')

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [payments, setPayments] = useState<PendingPayment[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [featuredTour, setFeaturedTour] = useState<Tournament | null>(null)
  const [selectedFeaturedId, setSelectedFeaturedId] = useState<string>('')
  const [isSavingFeatured, setIsSavingFeatured] = useState(false)

  // Additional Datasets
  const [upiAccounts, setUpiAccounts] = useState<UpiAccount[]>([])
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [regulations, setRegulations] = useState<GameRegulation[]>([])
  const [emailStatus, setEmailStatus] = useState<EmailSystemStatus | null>(null)
  const [disputes, setDisputes] = useState<any[]>([])

  // Player Crest Management
  const [adminCrests, setAdminCrests] = useState<Crest[]>([])
  const [crestSearch, setCrestSearch] = useState('')
  const [isCreateCrestModalOpen, setIsCreateCrestModalOpen] = useState(false)
  const [newCrestName, setNewCrestName] = useState('')
  const [newCrestDesc, setNewCrestDesc] = useState('')
  const [newCrestImageUrl, setNewCrestImageUrl] = useState('')
  const [newCrestIsActive, setNewCrestIsActive] = useState(true)
  const [isUploadingAdminCrest, setIsUploadingAdminCrest] = useState(false)
  const [adminCrestActionMsg, setAdminCrestActionMsg] = useState('')

  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  // Tournament Deletion Modal
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeletingTournament, setIsDeletingTournament] = useState(false)

  // Payment Rejection & Archive Modal
  const [rejectPaymentId, setRejectPaymentId] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [paymentViewMode, setPaymentViewMode] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE')
  const [archivedPayments, setArchivedPayments] = useState<PendingPayment[]>([])
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<PendingPayment | null>(null)
  const [revenueAnalytics, setRevenueAnalytics] = useState<RegistrationRevenueAnalytics | null>(null)
  const [revenueTimeRange, setRevenueTimeRange] = useState<string>('all')
  const [loadingRevenue, setLoadingRevenue] = useState(false)
  const [paymentFilterQuery, setPaymentFilterQuery] = useState('')

  // Advanced Payments Search & Filter States
  const [paymentSearch, setPaymentSearch] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('ALL')
  const [paymentDatePreset, setPaymentDatePreset] = useState('ALL')
  const [paymentStartDate, setPaymentStartDate] = useState('')
  const [paymentEndDate, setPaymentEndDate] = useState('')
  const [paymentMinAmount, setPaymentMinAmount] = useState('')
  const [paymentMaxAmount, setPaymentMaxAmount] = useState('')
  const [paymentSortBy, setPaymentSortBy] = useState('NEWEST')
  const [paymentSummary, setPaymentSummary] = useState<AdminPaymentsSummary | null>(null)
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)

  // Audit Logs Filtering & Pagination
  const [auditAction, setAuditAction] = useState<string>('ALL')
  const [auditSearch, setAuditSearch] = useState<string>('')
  const [auditDateRange, setAuditDateRange] = useState<string>('ALL')
  const [auditPage, setAuditPage] = useState<number>(1)
  const [auditLimit] = useState<number>(25)
  const [auditTotal, setAuditTotal] = useState<number>(0)
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false)

  // Notification CMS
  const [platformNotifications, setPlatformNotifications] = useState<PlatformNotificationItem[]>([])
  const [platformNotifTotal, setPlatformNotifTotal] = useState<number>(0)
  const [platformNotifFilterType, setPlatformNotifFilterType] = useState<string>('ALL')
  const [platformNotifSearch, setPlatformNotifSearch] = useState<string>('')
  const [platformNotifSelectedUserId, setPlatformNotifSelectedUserId] = useState<string>('')
  const [isDispatchingNotif, setIsDispatchingNotif] = useState<boolean>(false)
  const [newNotifAudience, setNewNotifAudience] = useState<'ALL_USERS' | 'SELECTED_USERS'>('ALL_USERS')
  const [newNotifUserIds, setNewNotifUserIds] = useState<string>('')
  const [newNotifType, setNewNotifType] = useState<string>('SYSTEM')
  const [newNotifTitle, setNewNotifTitle] = useState<string>('')
  const [newNotifMessage, setNewNotifMessage] = useState<string>('')
  const [newNotifLink, setNewNotifLink] = useState<string>('')

  // UPI Modal & QR States
  const [isNewUpiOpen, setIsNewUpiOpen] = useState(false)
  const [editingUpi, setEditingUpi] = useState<UpiAccount | null>(null)
  const [newUpi, setNewUpi] = useState({ code: '', upi_id: '', payee_name: '', display_name: '', qr_url: '', status: 'ACTIVE' })
  const [isSavingUpi, setIsSavingUpi] = useState(false)
  const [upiFormError, setUpiFormError] = useState('')
  const [uploadingQrAccId, setUploadingQrAccId] = useState<string | null>(null)
  const [isUploadingNewUpiQr, setIsUploadingNewUpiQr] = useState(false)

  // Payout Modals
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)
  const [newPayout, setNewPayout] = useState({ user_id: '', game_id: '', rank_or_placement: '1st Place', amount_inr: 5000, destination: 'WALLET' })
  const [completePayoutId, setCompletePayoutId] = useState<string | null>(null)
  const [outgoingUtr, setOutgoingUtr] = useState('')

  // Support Ticket Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketStatusVal, setTicketStatusVal] = useState('IN_PROGRESS')
  const [ticketNotes, setTicketNotes] = useState('')

  // Email System
  const [testEmailTo, setTestEmailTo] = useState('admin@ametheus.gg')
  const [isSendingTestMail, setIsSendingTestMail] = useState(false)
  const [isOfficialMailOpen, setIsOfficialMailOpen] = useState(false)
  const [officialMail, setOfficialMail] = useState({
    recipient_type: 'ALL_USERS',
    subject: '',
    message: '',
    custom_emails: '',
    user_ids: '',
    team_ids: '',
  })

  // Regulations Modal
  const [isNewRegOpen, setIsNewRegOpen] = useState(false)
  const [newReg, setNewReg] = useState({ game_name: 'VALORANT', chapter_code: 'VAL-SEC-01', title: 'Tournament Regulations', format: '5v5 Tactical', server: 'AWS Mumbai', rules: 'Anti-cheat verification mandatory.\nRespect referee rulings.' })

  interface NewTournamentFormState {
    title: string
    game_id: string
    format: string
    series_format?: string
    status: 'REGISTRATION_OPEN' | 'UPCOMING' | 'DRAFT'
    prize_pool_inr: number
    entry_fee_inr: number
    max_teams: number
    min_team_size: number
    max_team_size: number
    starts_at_local: string
    roster_lock_local: string
    banner_url: string
    banner_tablet_url: string
    banner_mobile_url: string
    logo_url: string
    whatsapp_group_url: string
    discord_url?: string
    community_link: string
    description: string
  }

  const getInitialNewTourState = (): NewTournamentFormState => ({
    title: '',
    game_id: 'valorant',
    format: 'Knockout',
    series_format: 'BO1',
    status: 'REGISTRATION_OPEN',
    prize_pool_inr: 25000,
    entry_fee_inr: 100,
    max_teams: 16,
    min_team_size: 5,
    max_team_size: 5,
    starts_at_local: getDefaultStartLocal(),
    roster_lock_local: getDefaultLockLocal(),
    banner_url: '',
    banner_tablet_url: '',
    banner_mobile_url: '',
    logo_url: '',
    whatsapp_group_url: '',
    discord_url: '',
    community_link: '',
    description: 'Official Sanctioned Competitive Esports Tournament on AMETHEUS.',
  })

  // TOURNAMENTS Interactive States
  const [tournamentFilter, setTournamentFilter] = useState('ALL')
  const [tournamentSearch, setTournamentSearch] = useState('')
  const [isCreateTourOpen, setIsCreateTourOpen] = useState(false)
  const [createTourError, setCreateTourError] = useState<string | null>(null)
  const [isSubmittingTour, setIsSubmittingTour] = useState(false)
  const [newTour, setNewTour] = useState<NewTournamentFormState>(() => {
    const defaults = getInitialNewTourState()
    try {
      const saved = sessionStorage.getItem('ametheus_admin_draft_new_tour')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.start_date && !parsed.starts_at_local) {
          parsed.starts_at_local = parsed.start_date
        }
        if (!parsed.roster_lock_local && parsed.starts_at_local) {
          parsed.roster_lock_local = getDefaultLockLocal(parsed.starts_at_local)
        }
        return { ...defaults, ...parsed }
      }
    } catch {}
    return defaults
  })

  useEffect(() => {
    try {
      sessionStorage.setItem('ametheus_admin_draft_new_tour', JSON.stringify(newTour))
    } catch {}
  }, [newTour])

  const [editingTour, setEditingTour] = useState<Tournament | null>(null)
  const [editTourError, setEditTourError] = useState<string | null>(null)
  const [isUpdatingTour, setIsUpdatingTour] = useState(false)
  const [rosterTour, setRosterTour] = useState<Tournament | null>(null)
  const [rostersList, setRostersList] = useState<any[]>([])
  const [loadingRosters, setLoadingRosters] = useState(false)

  // GAMES CATALOG Interactive States
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false)
  const [newGame, setNewGame] = useState(() => {
    try {
      const saved = sessionStorage.getItem('ametheus_admin_draft_new_game')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      slug: '',
      name: '',
      category: 'FPS',
      platform: 'PC',
      tag: 'TACTICAL',
      is_team_game: true,
      min_team_size: 5,
      max_team_size: 5,
      max_substitutes: 2,
      entry_fee_inr: 0,
      prize_pool_inr: 50000,
      play_url: '',
      poster_url: '',
      banner_url: '',
      banner_tablet_url: '',
      banner_mobile_url: '',
      logo_url: '',
      description: '',
      server_region: 'Mumbai, India',
      anti_cheat: 'Vanguard / EAC',
      match_protocol: 'Official Competitive Ruleset',
      accent_color: '#3ef2ff',
      status: 'ACTIVE',
      genre_id: '',
      genre_name: '',
    }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem('ametheus_admin_draft_new_game', JSON.stringify(newGame))
    } catch {}
  }, [newGame])
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [isUploadingGameLogo, setIsUploadingGameLogo] = useState(false)

  // GENRES & CATEGORIES Interactive States
  const [genres, setGenres] = useState<Genre[]>([])
  const [isCreateGenreOpen, setIsCreateGenreOpen] = useState(false)
  const [newGenre, setNewGenre] = useState<GenreCreatePayload>({
    name: '',
    slug: '',
    description: '',
    banner_url: '',
    icon_url: '',
    rotation_interval_seconds: 4,
    display_order: 0,
    is_active: true,
  })
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null)
  const [managingGenre, setManagingGenre] = useState<Genre | null>(null)
  const [selectedGameToAdd, setSelectedGameToAdd] = useState('')
  const [isAssigningGame, setIsAssigningGame] = useState(false)


  // REVIEWS MODERATION Interactive States
  const [adminReviews, setAdminReviews] = useState<ReviewItem[]>([])
  const [reviewStatusFilter, setReviewStatusFilter] = useState('ALL')
  const [reviewSearch, setReviewSearch] = useState('')
  const [selectedReviewForMod, setSelectedReviewForMod] = useState<ReviewItem | null>(null)
  const [modStatus, setModStatus] = useState<'APPROVED' | 'FEATURED' | 'PENDING' | 'HIDDEN'>('APPROVED')
  const [modNotes, setModNotes] = useState('')

  // LIVE MATCHES Interactive States
  const [adminMatches, setAdminMatches] = useState<ApiMatch[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [matchStatusFilter, setMatchStatusFilter] = useState('ALL')
  const [matchTourFilter, setMatchTourFilter] = useState('ALL')
  const [editingMatch, setEditingMatch] = useState<ApiMatch | null>(null)
  const [editMatchForm, setEditMatchForm] = useState({
    status: 'SCHEDULED',
    youtube_live_url: '',
    live_link: '',
    lobby_code: '',
    lobby_password: '',
    server_region: 'AWS Mumbai (ap-south-1)',
    score_a: 0,
    score_b: 0,
    winner_team_id: '',
  })

  const fetchAdminMatches = async () => {
    setMatchesLoading(true)
    try {
      const data = await getMatches()
      if (Array.isArray(data)) setAdminMatches(data)
    } catch (err) {
      console.warn('Failed to load matches:', err)
    } finally {
      setMatchesLoading(false)
    }
  }

  const handleQuickMatchStatus = async (matchId: string, newStatus: string) => {
    try {
      await updateMatch(matchId, { status: newStatus })
      setActionMsg(`Match status updated to ${newStatus}`)
      setTimeout(() => setActionMsg(null), 3000)
      fetchAdminMatches()
    } catch (err: any) {
      alert(err.message || 'Failed to update match status')
    }
  }

  const handleOpenEditMatch = (m: ApiMatch) => {
    setEditingMatch(m)
    setEditMatchForm({
      status: m.status || 'SCHEDULED',
      youtube_live_url: m.youtube_live_url || '',
      live_link: m.live_link || '',
      lobby_code: m.lobby_code || '',
      lobby_password: m.lobby_password || '',
      server_region: m.server_region || 'AWS Mumbai (ap-south-1)',
      score_a: m.team_a?.score ?? 0,
      score_b: m.team_b?.score ?? 0,
      winner_team_id: m.winner_team_id || '',
    })
  }

  const handleSaveMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMatch) return
    try {
      await updateMatch(editingMatch.id, {
        status: editMatchForm.status,
        youtube_live_url: editMatchForm.youtube_live_url,
        live_link: editMatchForm.live_link,
        lobby_code: editMatchForm.lobby_code,
        lobby_password: editMatchForm.lobby_password,
        server_region: editMatchForm.server_region,
        score_a: Number(editMatchForm.score_a),
        score_b: Number(editMatchForm.score_b),
        winner_team_id: editMatchForm.winner_team_id || undefined,
      })
      setActionMsg('Match credentials, stream & score updated successfully')
      setTimeout(() => setActionMsg(null), 3500)
      setEditingMatch(null)
      fetchAdminMatches()
    } catch (err: any) {
      alert(err.message || 'Failed to update match')
    }
  }

  // Formation jump state
  const [selectedFormationTourId, setSelectedFormationTourId] = useState<string>('')

  // Users Tab filtering & search
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'PLAYER' | 'ORGANIZER' | 'SUPER_ADMIN'>('ALL')
  const [userSearchTerm, setUserSearchTerm] = useState('')

  // Support Tickets User-Centric States
  const [supportUsers, setSupportUsers] = useState<UserSupportGroup[]>([])
  const [loadingSupportUsers, setLoadingSupportUsers] = useState(false)
  const [supportSearchTerm, setSupportSearchTerm] = useState('')
  const [supportShowArchived, setSupportShowArchived] = useState(false)
  const [supportTicketCounts, setSupportTicketCounts] = useState<{ active: number; archived: number; total: number }>({ active: 0, archived: 0, total: 0 })
  const [supportViewMode, setSupportViewMode] = useState<'ALL_TICKETS' | 'USER_GROUPS'>('ALL_TICKETS')
  const [expandedSupportUserId, setExpandedSupportUserId] = useState<string | null>(null)
  const [activeTicketThread, setActiveTicketThread] = useState<any | null>(null)
  const [ticketReplyText, setTicketReplyText] = useState('')
  const [ticketNextStatus, setTicketNextStatus] = useState('WAITING_FOR_USER')
  const [isSubmittingTicketReply, setIsSubmittingTicketReply] = useState(false)
  const threadMessagesEndRef = useRef<HTMLDivElement>(null)

  const loadSupportTicketsData = async (showArchived = supportShowArchived, searchTerm = supportSearchTerm) => {
    setLoadingSupportUsers(true)
    try {
      const [tixRes, uRes, countsRes] = await Promise.all([
        getAdminSupportTickets({ limit: 100, is_archived: showArchived, search: searchTerm || undefined }),
        getUsersWithSupportTickets(searchTerm || undefined, showArchived),
        getAdminSupportTicketCounts().catch(() => ({ active: 0, archived: 0, total: 0 })),
      ])
      setTickets(tixRes.tickets || [])
      setSupportUsers(uRes || [])
      if (countsRes) setSupportTicketCounts(countsRes)
    } catch (err) {
      console.warn('Failed to load support tickets:', err)
    } finally {
      setLoadingSupportUsers(false)
    }
  }

  // Live auto-polling for active support ticket thread every 5 seconds
  useEffect(() => {
    if (!activeTicketThread) return
    const threadTid = activeTicketThread.ticket_id || activeTicketThread.id
    if (!threadTid) return

    const timer = setInterval(async () => {
      try {
        const fresh = await getSupportTicketDetails(threadTid)
        if (fresh) {
          setActiveTicketThread((prev: any) => {
            if (!prev) return null
            const prevCount = prev.messages?.length || 0
            const freshCount = fresh.messages?.length || 0
            if (
              prevCount !== freshCount ||
              prev.status !== fresh.status ||
              prev.has_new_reply !== fresh.has_new_reply
            ) {
              return { ...prev, ...fresh }
            }
            return prev
          })
        }
      } catch {
        // Polling failure silent fallback
      }
    }, 5000)

    return () => clearInterval(timer)
  }, [activeTicketThread?.id, activeTicketThread?.ticket_id])

  // Auto-scroll when messages update in active ticket thread
  useEffect(() => {
    if (activeTicketThread?.messages?.length) {
      threadMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeTicketThread?.messages?.length])

  // Organizer Match Requests States
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([])
  const [loadingMatchRequests, setLoadingMatchRequests] = useState(false)
  const [matchRequestFilter, setMatchRequestFilter] = useState('ALL')
  const [actioningRequest, setActioningRequest] = useState<MatchRequest | null>(null)
  const [actionReqStatus, setActionReqStatus] = useState<'APPROVED' | 'REJECTED' | 'IN_REVIEW'>('APPROVED')
  const [actionReqNotes, setActionReqNotes] = useState('')
  const [actionReqMakeLive, setActionReqMakeLive] = useState(true)
  const [isSubmittingReqAction, setIsSubmittingReqAction] = useState(false)

  // Organizer Emails States
  const [organizerEmailThreads, setOrganizerEmailThreads] = useState<OrganizerEmailThread[]>([])
  const [loadingOrgEmails, setLoadingOrgEmails] = useState(false)
  const [orgEmailStatusFilter, setOrgEmailStatusFilter] = useState('ALL')
  const [activeOrgThread, setActiveOrgThread] = useState<OrganizerEmailThread | null>(null)
  const [orgThreadReplyText, setOrgThreadReplyText] = useState('')
  const [orgThreadNextStatus, setOrgThreadNextStatus] = useState('WAITING_FOR_ORGANIZER')
  const [isSubmittingOrgReply, setIsSubmittingOrgReply] = useState(false)

  // Email Communications States
  const [emailSubTab, setEmailSubTab] = useState<'PERSONAL' | 'TEAM' | 'SYSTEM'>('PERSONAL')
  const [personalEmailMode, setPersonalEmailMode] = useState<'USER' | 'CUSTOM'>('USER')
  const [selectedRecipientUserId, setSelectedRecipientUserId] = useState('')
  const [personalEmailCustomTo, setPersonalEmailCustomTo] = useState('')
  const [personalEmailSender, setPersonalEmailSender] = useState<'official' | 'support' | 'noreply'>('official')
  const [personalEmailSubject, setPersonalEmailSubject] = useState('')
  const [personalEmailMessage, setPersonalEmailMessage] = useState('')
  const [isSendingPersonalEmail, setIsSendingPersonalEmail] = useState(false)
  const [personalEmailResult, setPersonalEmailResult] = useState<any | null>(null)

  // Team Email Dispatch State
  const [teamsList, setTeamsList] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [teamEmailSubject, setTeamEmailSubject] = useState('')
  const [teamEmailMessage, setTeamEmailMessage] = useState('')
  const [isSendingTeamEmail, setIsSendingTeamEmail] = useState(false)
  const [teamEmailResult, setTeamEmailResult] = useState<any | null>(null)

  // Official Broadcast History
  const [officialHistory, setOfficialHistory] = useState<any[]>([])

  // SMTP Relay Diagnostic State
  const [diagnosticService, setDiagnosticService] = useState<'support' | 'noreply' | 'official'>('support')
  const [diagnosticResult, setDiagnosticResult] = useState<any | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [
        s,
        u,
        p,
        pArch,
        g,
        l,
        lCount,
        tList,
        fTour,
        upiList,
        payList,
        tixList,
        regList,
        eStat,
        dispList,
        mAll,
        genreList,
        revList,
        sUsers,
        mReqs,
        orgEmails,
        teams,
        offHist,
        notifs,
        crestList,
        sCounts,
        revAnalytics,
      ] = await Promise.all([
        getAdminStats().catch(() => null),
        getAdminUsers().catch(() => []),
        getPendingPayments().catch(() => []),
        getAdminPayments(undefined, true).catch(() => []),
        getGames().catch(() => []),
        getAuditLogs({ limit: auditLimit, skip: 0 }).catch(() => []),
        getAuditLogsCount().catch(() => ({ total: 0 })),
        getMyOrganizedTournaments().catch(() => getTournaments({ include_drafts: true, status: 'ALL' }).catch(() => [])),
        getFeaturedTournament().catch(() => null),
        getAdminUpiAccounts().catch(() => []),
        getAdminPayouts().catch(() => []),
        getAdminSupportTickets({ limit: 100, is_archived: false }).then((r) => r?.tickets || []).catch(() => []),
        getRegulations().catch(() => []),
        getEmailSystemStatusAdmin().catch(() => null),
        getDisputes().catch(() => []),
        getMatches().catch(() => []),
        getGenres(true).catch(() => []),
        getAdminReviews().catch(() => []),
        getUsersWithSupportTickets().catch(() => []),
        getAdminMatchRequests().catch(() => []),
        getAdminOrganizerEmails().catch(() => []),
        apiClient<any[]>('/teams').catch(() => []),
        getOfficialEmailHistoryAdmin().catch(() => ({ total: 0, items: [] })),
        getAdminPlatformNotifications({ limit: 50, skip: 0 }).catch(() => ({ items: [], total: 0 })),
        getAllCrestsAdmin().catch(() => []),
        getAdminSupportTicketCounts().catch(() => ({ active: 0, archived: 0, total: 0 })),
        getRegistrationRevenueAnalytics({ time_range: revenueTimeRange }).catch(() => null),
      ])

      if (s) setStats(s)
      setUsers(Array.isArray(u) ? u : ((u as any)?.users || []))
      setPayments(Array.isArray(p) ? p : ((p as any)?.payments || []))
      setArchivedPayments(Array.isArray(pArch) ? pArch : [])
      setGames(Array.isArray(g) ? g : ((g as any)?.games || []))
      setLogs(Array.isArray(l) ? l : [])
      setAuditTotal(lCount?.total || (Array.isArray(l) ? l.length : 0))
      setPlatformNotifications(notifs?.items || [])
      setPlatformNotifTotal(notifs?.total || 0)
      setTournaments(Array.isArray(tList) ? tList : ((tList as any)?.tournaments || []))
      setFeaturedTour(fTour)
      setUpiAccounts(Array.isArray(upiList) ? upiList : [])
      setPayouts(Array.isArray(payList) ? payList : [])
      setTickets(Array.isArray(tixList) ? tixList : ((tixList as any)?.tickets || []))
      if (sCounts) setSupportTicketCounts(sCounts)
      if (revAnalytics) setRevenueAnalytics(revAnalytics)
      setRegulations(Array.isArray(regList) ? regList : [])
      setEmailStatus(eStat)
      setDisputes(Array.isArray(dispList) ? dispList : [])
      if (Array.isArray(mAll)) setAdminMatches(mAll)
      setGenres(genreList)
      setAdminReviews(revList)
      setSupportUsers(sUsers)
      setMatchRequests(mReqs)
      setOrganizerEmailThreads(orgEmails)
      setTeamsList(teams || [])
      setOfficialHistory(offHist?.items || [])
      setAdminCrests(crestList || [])

      if (fTour) {
        setSelectedFeaturedId(fTour.id || fTour.slug)
      } else if (tList.length > 0) {
        setSelectedFeaturedId(tList[0].id || tList[0].slug)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTimeRangeChange = async (newRange: string) => {
    setRevenueTimeRange(newRange)
    setLoadingRevenue(true)
    try {
      const data = await getRegistrationRevenueAnalytics({ time_range: newRange })
      setRevenueAnalytics(data)
    } catch {
      // ignore
    } finally {
      setLoadingRevenue(false)
    }
  }

  const loadAdminCrests = useCallback(async (searchQuery?: string) => {
    try {
      const data = await getAllCrestsAdmin(searchQuery)
      setAdminCrests(data)
    } catch (err) {
      console.warn('Failed to load admin crests:', err)
    }
  }, [])

  const handleCreateCrest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCrestName.trim() || !newCrestImageUrl.trim()) {
      alert('Please provide crest name and image.')
      return
    }
    try {
      await createCrestAdmin({
        name: newCrestName.trim(),
        description: newCrestDesc.trim() || undefined,
        image_url: newCrestImageUrl.trim(),
        is_active: newCrestIsActive,
      })
      setIsCreateCrestModalOpen(false)
      setNewCrestName('')
      setNewCrestDesc('')
      setNewCrestImageUrl('')
      setNewCrestIsActive(true)
      setAdminCrestActionMsg('New player crest successfully created!')
      setTimeout(() => setAdminCrestActionMsg(''), 4000)
      loadAdminCrests()
    } catch (err: any) {
      alert(err.message || 'Failed to create crest.')
    }
  }

  const handleToggleCrestActive = async (crest: Crest) => {
    try {
      await updateCrestAdmin(crest.id, { is_active: !crest.is_active })
      loadAdminCrests(crestSearch)
    } catch (err: any) {
      alert(err.message || 'Failed to update crest status.')
    }
  }

  const handleDeleteCrest = async (crest: Crest) => {
    if (!confirm(`Are you sure you want to delete crest "${crest.name}"?`)) return
    try {
      await deleteCrestAdmin(crest.id)
      loadAdminCrests(crestSearch)
    } catch (err: any) {
      alert(err.message || 'Failed to delete crest.')
    }
  }

  const handleAdminCrestFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingAdminCrest(true)
    try {
      const res = await uploadMediaFile(file)
      if (res && res.url) {
        setNewCrestImageUrl(res.url)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload crest image.')
    } finally {
      setIsUploadingAdminCrest(false)
    }
  }

  useEffect(() => {
    if (isSuperAdmin) {
      loadData()
    }
  }, [isSuperAdmin])

  const showToast = (msg: string) => {
    setActionMsg(msg)
    setTimeout(() => setActionMsg(null), 4000)
  }

  const handleSetFeatured = async (idToSet?: string) => {
    const targetId = idToSet !== undefined ? idToSet : selectedFeaturedId
    if (!targetId) return
    setIsSavingFeatured(true)
    try {
      await setFeaturedTournament(targetId)
      showToast(`Homepage Featured Tournament set: ${targetId === 'none' ? 'None (Spotlight Cleared)' : targetId}`)
      const updated = await getFeaturedTournament()
      setFeaturedTour(updated)
      if (idToSet !== undefined) setSelectedFeaturedId(idToSet)
    } catch (err: any) {
      alert(err.message || 'Failed to update featured tournament')
    } finally {
      setIsSavingFeatured(false)
    }
  }

  const fetchFilteredPayments = useCallback(async () => {
    setIsLoadingPayments(true)
    try {
      const minAmt = paymentMinAmount ? parseFloat(paymentMinAmount) : undefined
      const maxAmt = paymentMaxAmount ? parseFloat(paymentMaxAmount) : undefined

      const queryParams: AdminPaymentQueryParams = {
        search: paymentSearch.trim() || undefined,
        statusFilter: paymentStatusFilter !== 'ALL' ? paymentStatusFilter : undefined,
        paymentType: paymentTypeFilter !== 'ALL' ? paymentTypeFilter : undefined,
        datePreset: paymentDatePreset !== 'ALL' ? paymentDatePreset : undefined,
        startDate: paymentDatePreset === 'CUSTOM' && paymentStartDate ? paymentStartDate : undefined,
        endDate: paymentDatePreset === 'CUSTOM' && paymentEndDate ? paymentEndDate : undefined,
        minAmount: minAmt,
        maxAmount: maxAmt,
        sortBy: paymentSortBy,
        isArchived: paymentViewMode === 'ARCHIVED',
      }

      const [paymentsData, summaryData] = await Promise.all([
        getAdminPayments(queryParams),
        getAdminPaymentsSummary(queryParams).catch(() => null),
      ])

      if (paymentViewMode === 'ACTIVE') {
        setPayments(Array.isArray(paymentsData) ? paymentsData : [])
      } else {
        setArchivedPayments(Array.isArray(paymentsData) ? paymentsData : [])
      }
      if (summaryData) {
        setPaymentSummary(summaryData)
      }
    } catch (err: any) {
      console.error('Failed to fetch filtered payments:', err)
    } finally {
      setIsLoadingPayments(false)
    }
  }, [
    paymentSearch,
    paymentStatusFilter,
    paymentTypeFilter,
    paymentDatePreset,
    paymentStartDate,
    paymentEndDate,
    paymentMinAmount,
    paymentMaxAmount,
    paymentSortBy,
    paymentViewMode,
  ])

  useEffect(() => {
    if (tab === 'PENDING PAYMENTS') {
      fetchFilteredPayments()
    }
  }, [fetchFilteredPayments, tab])

  const handleResetPaymentFilters = () => {
    setPaymentSearch('')
    setPaymentStatusFilter('ALL')
    setPaymentTypeFilter('ALL')
    setPaymentDatePreset('ALL')
    setPaymentStartDate('')
    setPaymentEndDate('')
    setPaymentMinAmount('')
    setPaymentMaxAmount('')
    setPaymentSortBy('NEWEST')
  }

  const handleConfirmDeleteTournament = async () => {
    if (!tournamentToDelete || deleteConfirmText.trim() !== 'DELETE') return
    setIsDeletingTournament(true)
    try {
      const targetId = tournamentToDelete.id || tournamentToDelete.slug
      await deleteTournamentOrganizer(targetId)
      showToast(`Tournament "${tournamentToDelete.title}" permanently deleted.`)
      setTournaments((prev) => prev.filter((t) => t.id !== tournamentToDelete.id && t.slug !== tournamentToDelete.slug))
      if (featuredTour && (featuredTour.id === tournamentToDelete.id || featuredTour.slug === tournamentToDelete.slug)) {
        setFeaturedTour(null)
      }
      setTournamentToDelete(null)
      setDeleteConfirmText('')
    } catch (err: any) {
      alert(err.message || 'Failed to delete tournament')
    } finally {
      setIsDeletingTournament(false)
    }
  }

  const handleApprovePayment = async (id: string) => {
    try {
      await approvePayment(id)
      showToast('Payment verified, approved, and moved to archive!')
      fetchFilteredPayments()
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to approve payment')
    }
  }

  const handleRejectPayment = async () => {
    if (!rejectPaymentId) return
    try {
      await rejectPayment(rejectPaymentId, rejectNotes)
      showToast('Payment rejected and moved to archive.')
      setRejectPaymentId(null)
      setRejectNotes('')
      fetchFilteredPayments()
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to reject payment')
    }
  }

  const handleArchivePayment = async (id: string) => {
    try {
      await archivePayment(id)
      showToast('Payment record archived.')
      fetchFilteredPayments()
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to archive payment')
    }
  }

  const handleUnarchivePayment = async (id: string) => {
    try {
      await unarchivePayment(id)
      showToast('Payment record restored from archive.')
      fetchFilteredPayments()
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to unarchive payment')
    }
  }

  const handleDeleteUpi = async (id: string, code: string) => {
    if (!window.confirm(`Permanently delete UPI account "${code}"? Historical payments using this account will retain their snapshotted data, but no new checkouts can use this account.`)) {
      return
    }
    try {
      await deleteUpiAccount(id)
      showToast(`UPI Account ${code} permanently deleted.`)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete UPI account')
    }
  }

  const fetchAuditLogs = async (newPage: number = auditPage) => {
    setIsLoadingLogs(true)
    try {
      const skip = (newPage - 1) * auditLimit
      const [fetchedLogs, countRes] = await Promise.all([
        getAuditLogs({
          limit: auditLimit,
          skip,
          search: auditSearch.trim() || undefined,
          action: auditAction !== 'ALL' ? auditAction : undefined,
          date_range: auditDateRange !== 'ALL' ? auditDateRange : undefined,
        }),
        getAuditLogsCount({
          search: auditSearch.trim() || undefined,
          action: auditAction !== 'ALL' ? auditAction : undefined,
          date_range: auditDateRange !== 'ALL' ? auditDateRange : undefined,
        }),
      ])
      setLogs(fetchedLogs)
      setAuditTotal(countRes.total)
      setAuditPage(newPage)
    } catch (err: any) {
      console.warn('Failed to fetch filtered audit logs:', err)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const fetchPlatformNotifications = async (userIdOverride?: string) => {
    try {
      const activeUserId = userIdOverride !== undefined ? userIdOverride : platformNotifSelectedUserId
      const res = await getAdminPlatformNotifications({
        limit: 50,
        skip: 0,
        search: platformNotifSearch.trim() || undefined,
        notification_type: platformNotifFilterType !== 'ALL' ? platformNotifFilterType : undefined,
        user_id: activeUserId.trim() || undefined,
      })
      setPlatformNotifications(res.items || [])
      setPlatformNotifTotal(res.total || 0)
    } catch (err) {
      console.warn('Failed to fetch platform notifications:', err)
    }
  }

  const handleSendPlatformNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNotifTitle.trim() || !newNotifMessage.trim()) return
    setIsDispatchingNotif(true)
    try {
      let targetUserIds: string[] = []
      if (newNotifAudience === 'SELECTED_USERS') {
        targetUserIds = newNotifUserIds.split(',').map((s) => s.trim()).filter(Boolean)
        if (targetUserIds.length === 0) {
          alert('Please specify at least one recipient user ID.')
          setIsDispatchingNotif(false)
          return
        }
      }
      await sendAdminPlatformNotification({
        user_ids: targetUserIds,
        title: newNotifTitle.trim(),
        message: newNotifMessage.trim(),
        notification_type: newNotifType,
        category: newNotifType,
        link: newNotifLink.trim() || undefined,
      })
      showToast('Platform notification dispatched successfully!')
      setNewNotifTitle('')
      setNewNotifMessage('')
      setNewNotifLink('')
      setNewNotifUserIds('')
      fetchPlatformNotifications()
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch notification')
    } finally {
      setIsDispatchingNotif(false)
    }
  }

  const handleOpenAddUpi = () => {
    setEditingUpi(null)
    setUpiFormError('')
    setNewUpi({ code: '', upi_id: '', payee_name: '', display_name: '', qr_url: '', status: 'ACTIVE' })
    setIsNewUpiOpen(true)
  }

  const handleOpenEditUpi = (acc: UpiAccount) => {
    setEditingUpi(acc)
    setUpiFormError('')
    setNewUpi({
      code: acc.code || '',
      upi_id: acc.upi_id || '',
      payee_name: acc.payee_name || '',
      display_name: acc.display_name || '',
      qr_url: acc.qr_url || '',
      status: acc.status || 'ACTIVE',
    })
    setIsNewUpiOpen(true)
  }

  const handleSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpiFormError('')

    const cleanUpiId = newUpi.upi_id.trim()
    const cleanPayee = newUpi.payee_name.trim()
    const cleanCode = newUpi.code.trim().toUpperCase()

    if (!cleanUpiId || !cleanUpiId.includes('@') || cleanUpiId.length < 3) {
      setUpiFormError('Please enter a valid UPI VPA handle containing "@" (e.g. company@bank).')
      return
    }
    if (!cleanPayee) {
      setUpiFormError('Payee Name cannot be empty.')
      return
    }

    setIsSavingUpi(true)
    try {
      if (editingUpi) {
        const updated = await updateUpiAccount(editingUpi.id, {
          upi_id: cleanUpiId,
          payee_name: cleanPayee,
          display_name: newUpi.display_name.trim() || undefined,
          status: newUpi.status,
          qr_url: newUpi.qr_url.trim() || undefined,
        })
        setUpiAccounts((prev) => prev.map((a) => (a.id === editingUpi.id ? { ...a, ...updated } : a)))
        showToast(`UPI Account ${editingUpi.code} updated successfully!`)
      } else {
        if (!cleanCode) {
          setUpiFormError('Account Code is required.')
          setIsSavingUpi(false)
          return
        }
        const created = await createUpiAccount({
          code: cleanCode,
          upi_id: cleanUpiId,
          payee_name: cleanPayee,
          display_name: newUpi.display_name.trim() || undefined,
          qr_url: newUpi.qr_url.trim() || undefined,
        })
        setUpiAccounts((prev) => [created, ...prev])
        showToast(`UPI Account ${cleanCode} registered successfully!`)
      }
      setIsNewUpiOpen(false)
      setEditingUpi(null)
      setNewUpi({ code: '', upi_id: '', payee_name: '', display_name: '', qr_url: '', status: 'ACTIVE' })
    } catch (err: any) {
      setUpiFormError(err.message || 'Failed to save UPI account')
    } finally {
      setIsSavingUpi(false)
    }
  }

  const handleToggleUpi = async (id: string) => {
    try {
      await toggleUpiAccountStatus(id)
      showToast('UPI Account status updated.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to toggle UPI account status')
    }
  }

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createWinningPayout(newPayout)
      showToast('Winning payout record created.')
      setIsPayoutModalOpen(false)
      setNewPayout({ user_id: '', game_id: '', rank_or_placement: '1st Place', amount_inr: 5000, destination: 'WALLET' })
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to create payout')
    }
  }

  const handleCompletePayout = async () => {
    if (!completePayoutId || !outgoingUtr) return
    try {
      await completePayout(completePayoutId, outgoingUtr)
      showToast('Payout marked COMPLETED with UTR reference.')
      setCompletePayoutId(null)
      setOutgoingUtr('')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to complete payout')
    }
  }

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return
    try {
      await updateSupportTicket(selectedTicket.id, {
        status: ticketStatusVal,
        internal_notes: ticketNotes,
      })
      showToast('Support ticket updated.')
      setSelectedTicket(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket')
    }
  }

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await updateSupportTicket(ticketId, { status: newStatus })
      const statusLabel = formatTicketStatus(newStatus).label
      showToast(`Ticket status updated to ${statusLabel}`)
      setTickets((prev) =>
        prev.map((t) => (t.ticket_id === ticketId || t.id === ticketId ? { ...t, status: newStatus } : t))
      )
      if (activeTicketThread && (activeTicketThread.id === ticketId || activeTicketThread.ticket_id === ticketId)) {
        setActiveTicketThread((prev: any) => (prev ? { ...prev, status: newStatus } : null))
      }
      const res = await getUsersWithSupportTickets(supportSearchTerm, supportShowArchived).catch(() => [])
      setSupportUsers(res)
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status')
    }
  }

  const handleSendTestMail = async () => {
    setIsSendingTestMail(true)
    setDiagnosticResult(null)
    try {
      const res = await sendTestEmailAdmin({ service: diagnosticService, to_email: testEmailTo.trim() })
      setDiagnosticResult({ success: true, detail: res?.message || 'SMTP handshake probe passed successfully.', timestamp: new Date().toLocaleTimeString() })
      showToast(`Diagnostic email dispatched to ${testEmailTo}!`)
    } catch (err: any) {
      setDiagnosticResult({ success: false, detail: err.message || 'SMTP probe handshake failed.', timestamp: new Date().toLocaleTimeString() })
      alert(err.message || 'Failed to send test email')
    } finally {
      setIsSendingTestMail(false)
    }
  }

  const handleSendTeamEmail = async () => {
    if (!selectedTeamId) {
      alert('Please select an active team.')
      return
    }
    if (!teamEmailSubject.trim() || !teamEmailMessage.trim()) {
      alert('Please enter both subject and message.')
      return
    }
    setIsSendingTeamEmail(true)
    setTeamEmailResult(null)
    try {
      const res = await sendOfficialEmailAdmin({
        recipient_type: 'SELECTED_TEAMS',
        team_ids: [selectedTeamId],
        subject: teamEmailSubject.trim(),
        message: teamEmailMessage.trim(),
      })
      setTeamEmailResult(res)
      if (res?.message) {
        showToast(res.message)
        setTeamEmailSubject('')
        setTeamEmailMessage('')
      }
    } catch (err: any) {
      setTeamEmailResult({
        success: false,
        error_detail: err.message || 'Failed to dispatch team email',
      })
      alert(err.message || 'Team email dispatch failed')
    } finally {
      setIsSendingTeamEmail(false)
    }
  }

  const handleSendOfficialMail = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: any = {
        recipient_type: officialMail.recipient_type,
        subject: officialMail.subject.trim(),
        message: officialMail.message.trim(),
      }
      if (officialMail.recipient_type === 'CUSTOM_EMAILS' && officialMail.custom_emails) {
        payload.custom_emails = officialMail.custom_emails.split(',').map((s) => s.trim()).filter(Boolean)
      }
      if (officialMail.recipient_type === 'SELECTED_USERS' && officialMail.user_ids) {
        payload.user_ids = officialMail.user_ids.split(',').map((s) => s.trim()).filter(Boolean)
      }
      if (officialMail.recipient_type === 'SELECTED_TEAMS' && officialMail.team_ids) {
        payload.team_ids = officialMail.team_ids.split(',').map((s) => s.trim()).filter(Boolean)
      }
      await sendOfficialEmailAdmin(payload)
      showToast('Official platform notification email dispatched successfully!')
      setIsOfficialMailOpen(false)
      setOfficialMail({ recipient_type: 'ALL_USERS', subject: '', message: '', custom_emails: '', user_ids: '', team_ids: '' })
    } catch (err: any) {
      alert(err.message || 'Failed to send official mail')
    }
  }

  const handleCreateReg = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRegulation({
        ...newReg,
        rules: newReg.rules.split('\n').filter(Boolean),
        map_pool: ['Haven', 'Bind', 'Ascent', 'Sunset'],
      })
      showToast('Game regulation chapter published!')
      setIsNewRegOpen(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to create regulation')
    }
  }

  const handleDeleteReg = async (id: string) => {
    if (!confirm('Are you sure you want to delete this regulation chapter?')) return
    try {
      await deleteRegulation(id)
      showToast('Regulation chapter removed.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete regulation')
    }
  }

  // Tournament Action Handlers
  const handlePublishTour = async (id: string) => {
    try {
      await publishTournamentOrganizer(id)
      showToast('Tournament published successfully!')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to publish tournament')
    }
  }

  const handleCloseRegTour = async (id: string) => {
    try {
      await closeRegistrationOrganizer(id)
      showToast('Registration locked and closed for tournament!')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to close registration')
    }
  }

  const handleReopenRegTour = async (id: string) => {
    try {
      await reopenRegistrationOrganizer(id)
      showToast('Registration reopened for tournament! Contenders can register.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to reopen registration')
    }
  }

  const handleGenerateBracketTour = async (id: string) => {
    try {
      await generateBracketOrganizer(id)
      showToast('Match bracket generated successfully!')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to generate bracket')
    }
  }

  const handleCancelTour = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this tournament? Registrations will be refunded.')) return
    try {
      await cancelTournamentOrganizer(id)
      showToast('Tournament cancelled.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to cancel tournament')
    }
  }

  const handleStartLiveTour = async (id: string) => {
    try {
      await startLiveTournamentAdmin(id)
      showToast('Tournament is now LIVE! Associated scheduled matches are active.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to start tournament live')
    }
  }

  const handleCompleteTour = async (id: string) => {
    if (!confirm('Mark this tournament as COMPLETED? All rounds and results will be finalized.')) return
    try {
      await completeTournamentAdmin(id)
      showToast('Tournament marked as COMPLETED.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to complete tournament')
    }
  }

  const handleViewRosters = async (t: Tournament) => {
    setRosterTour(t)
    setLoadingRosters(true)
    try {
      const res = await getTournamentRegisteredRosters(t.id || t.slug)
      const list = Array.isArray(res) ? res : res.teams || res.rosters || []
      setRostersList(list)
    } catch {
      setRostersList([])
    } finally {
      setLoadingRosters(false)
    }
  }

  const handleSelectGameForNewTour = (gameSlugOrId: string) => {
    const g = games.find((item) => item.slug === gameSlugOrId || item.id === gameSlugOrId)
    const nextMin = g?.min_team_size ?? 5
    const nextMax = g?.max_team_size ?? 5
    setNewTour((prev) => ({
      ...prev,
      game_id: gameSlugOrId,
      min_team_size: nextMin,
      max_team_size: nextMax,
    }))
  }

  const handleStartDateChange = (val: string) => {
    setNewTour((prev) => {
      const prevStart = new Date(prev.starts_at_local).getTime()
      const prevLock = new Date(prev.roster_lock_local).getTime()
      const nextStart = new Date(val).getTime()

      let nextLock = prev.roster_lock_local
      if (isNaN(prevLock) || prevLock > nextStart || (prevStart && prevStart - prevLock === 2 * 3600000)) {
        nextLock = getDefaultLockLocal(val)
      }
      return {
        ...prev,
        starts_at_local: val,
        roster_lock_local: nextLock,
      }
    })
  }

  const handleCreateTourSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateTourError(null)

    // Pre-submission validation
    const title = newTour.title?.trim()
    if (!title) {
      setCreateTourError('Tournament title is required.')
      return
    }
    if (!newTour.game_id) {
      setCreateTourError('Please select a sanctioned game discipline.')
      return
    }
    const format = newTour.format?.trim()
    if (!format) {
      setCreateTourError('Match format is required (e.g. Single Elimination · BO3).')
      return
    }
    if (!newTour.starts_at_local) {
      setCreateTourError('Tournament Start Date & Time is required.')
      return
    }
    if (!newTour.roster_lock_local) {
      setCreateTourError('Roster Lock Date & Time is required.')
      return
    }

    const startDate = new Date(newTour.starts_at_local)
    const lockDate = new Date(newTour.roster_lock_local)

    if (isNaN(startDate.getTime())) {
      setCreateTourError('Tournament Start Date & Time is invalid. Please select a valid date and time.')
      return
    }
    if (isNaN(lockDate.getTime())) {
      setCreateTourError('Roster Lock Date & Time is invalid. Please select a valid date and time.')
      return
    }
    if (lockDate.getTime() > startDate.getTime()) {
      setCreateTourError('Roster lock deadline must be at or before tournament start time.')
      return
    }

    const maxTeams = Number(newTour.max_teams)
    if (isNaN(maxTeams) || maxTeams < 2) {
      setCreateTourError('Maximum teams must be at least 2.')
      return
    }

    const minTeamSize = Number(newTour.min_team_size)
    const maxTeamSize = Number(newTour.max_team_size)
    if (isNaN(minTeamSize) || minTeamSize < 1) {
      setCreateTourError('Minimum team size must be at least 1 player.')
      return
    }
    if (isNaN(maxTeamSize) || maxTeamSize < minTeamSize) {
      setCreateTourError('Maximum team size cannot be less than minimum team size.')
      return
    }

    const prizePool = Number(newTour.prize_pool_inr)
    if (isNaN(prizePool) || prizePool < 0) {
      setCreateTourError('Prize pool cannot be negative.')
      return
    }

    const entryFee = Number(newTour.entry_fee_inr)
    if (isNaN(entryFee) || entryFee < 0) {
      setCreateTourError('Entry fee cannot be negative.')
      return
    }

    if (newTour.whatsapp_group_url && newTour.whatsapp_group_url.trim()) {
      const url = newTour.whatsapp_group_url.trim()
      if (!/^https?:\/\//i.test(url)) {
        setCreateTourError('Official WhatsApp group link must begin with http:// or https://')
        return
      }
    }

    if (newTour.community_link && newTour.community_link.trim()) {
      const url = newTour.community_link.trim()
      if (!/^https?:\/\//i.test(url)) {
        setCreateTourError('Community link must begin with http:// or https://')
        return
      }
    }

    setIsSubmittingTour(true)
    try {
      const created = await createTournamentOrganizer({
        title,
        game_id: newTour.game_id,
        format,
        series_format: newTour.series_format || 'BO1',
        status: newTour.status || 'REGISTRATION_OPEN',
        prize_pool_inr: prizePool,
        entry_fee_inr: entryFee,
        max_teams: maxTeams,
        min_team_size: minTeamSize,
        max_team_size: maxTeamSize,
        starts_at: startDate.toISOString(),
        roster_lock_time: lockDate.toISOString(),
        banner_url: newTour.banner_url || undefined,
        banner_tablet_url: newTour.banner_tablet_url || undefined,
        banner_mobile_url: newTour.banner_mobile_url || undefined,
        logo_url: newTour.logo_url || undefined,
        whatsapp_group_url: newTour.whatsapp_group_url.trim() || undefined,
        discord_url: (newTour.discord_url?.trim() || newTour.community_link?.trim()) || undefined,
        community_link: (newTour.discord_url?.trim() || newTour.community_link?.trim()) || undefined,
        description: newTour.description?.trim() || 'Official Sanctioned Competitive Esports Tournament on AMETHEUS.',
      })
      if (created && (created.id || (created as any).slug)) {
        setTournaments((prev) => {
          const exists = prev.some((t) => (t.id && t.id === created.id) || (t.slug && t.slug === created.slug))
          return exists ? prev : [created, ...prev]
        })
      }
      showToast('Tournament created successfully!')
      setIsCreateTourOpen(false)
      sessionStorage.removeItem('ametheus_admin_draft_new_tour')
      setNewTour(getInitialNewTourState())
      loadData()
    } catch (err: any) {
      setCreateTourError(err.message || 'Failed to create tournament. Please check server validation.')
    } finally {
      setIsSubmittingTour(false)
    }
  }

  const handleUpdateTourSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTour) return
    setEditTourError(null)

    const title = editingTour.title?.trim()
    if (!title) {
      setEditTourError('Tournament title cannot be empty.')
      return
    }

    setIsUpdatingTour(true)
    try {
      const regStatus = editingTour.status === 'REGISTRATION_CLOSED'
        ? 'CLOSED'
        : (editingTour.status === 'REGISTRATION_OPEN' ? 'OPEN' : editingTour.registration_status)
      await updateTournamentOrganizer(editingTour.id || editingTour.slug, {
        title,
        game_id: editingTour.game_id,
        format: editingTour.format,
        series_format: (editingTour as any).series_format || 'BO1',
        status: editingTour.status,
        registration_status: regStatus,
        prize_pool_inr: Number(editingTour.prize_pool_inr),
        entry_fee_inr: Number(editingTour.entry_fee_inr),
        max_teams: Number(editingTour.max_teams),
        starts_at: editingTour.starts_at,
        roster_lock_time: editingTour.roster_lock_time,
        banner_url: editingTour.banner_url,
        hero_banner_url: editingTour.hero_banner_url,
        banner_tablet_url: editingTour.banner_tablet_url,
        banner_mobile_url: editingTour.banner_mobile_url,
        logo_url: editingTour.logo_url,
        whatsapp_group_url: editingTour.whatsapp_group_url,
        discord_url: (editingTour as any).discord_url || editingTour.community_link,
        community_link: editingTour.community_link || (editingTour as any).discord_url,
        description: editingTour.description,
      })
      showToast('Tournament updated successfully!')
      setEditingTour(null)
      loadData()
    } catch (err: any) {
      setEditTourError(err.message || 'Failed to update tournament')
    } finally {
      setIsUpdatingTour(false)
    }
  }

  // Games Action Handlers
  const handleCreateGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createGame({
        ...newGame,
        poster_url: newGame.poster_url || undefined,
        genre_id: newGame.genre_id || undefined,
        genre_name: newGame.genre_name || undefined,
        min_team_size: Number(newGame.min_team_size),
        max_team_size: Number(newGame.max_team_size),
        max_substitutes: Number(newGame.max_substitutes),
        entry_fee_inr: Number(newGame.entry_fee_inr),
        prize_pool_inr: Number(newGame.prize_pool_inr),
      })
      showToast(`Game title ${newGame.name} created!`)
      setIsCreateGameOpen(false)
      sessionStorage.removeItem('ametheus_admin_draft_new_game')
      setNewGame({
        slug: '',
        name: '',
        category: 'FPS',
        platform: 'PC',
        tag: 'TACTICAL',
        is_team_game: true,
        min_team_size: 5,
        max_team_size: 5,
        max_substitutes: 2,
        entry_fee_inr: 0,
        prize_pool_inr: 50000,
        play_url: '',
        poster_url: '',
        banner_url: '',
        banner_tablet_url: '',
        banner_mobile_url: '',
        logo_url: '',
        description: '',
        server_region: 'Mumbai, India',
        anti_cheat: 'Vanguard / EAC',
        match_protocol: 'Official Competitive Ruleset',
        accent_color: '#3ef2ff',
        status: 'ACTIVE',
        genre_id: '',
        genre_name: '',
      })
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to create game')
    }
  }

  const handleUpdateGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGame) return
    try {
      await updateGame(editingGame.id || editingGame.slug, {
        name: editingGame.name,
        category: editingGame.category,
        genre_id: (editingGame as any).genre_id ?? '',
        genre_name: (editingGame as any).genre_name,
        platform: editingGame.platform,
        tag: editingGame.tag,
        is_team_game: editingGame.is_team_game,
        min_team_size: Number(editingGame.min_team_size),
        max_team_size: Number(editingGame.max_team_size),
        entry_fee_inr: Number(editingGame.entry_fee_inr || 0),
        prize_pool_inr: Number(editingGame.prize_pool_inr || 0),
        poster_url: editingGame.poster_url,
        banner_url: editingGame.banner_url,
        banner_tablet_url: editingGame.banner_tablet_url,
        banner_mobile_url: editingGame.banner_mobile_url,
        logo_url: editingGame.logo_url,
        description: editingGame.description,
        server_region: editingGame.server_region,
        anti_cheat: editingGame.anti_cheat,
        status: editingGame.status,
      })
      showToast(`Game title ${editingGame.name} updated!`)
      setEditingGame(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update game')
    }
  }

  const handleDeleteGameAction = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the game title "${name}"?`)) return
    try {
      await deleteGame(id)
      showToast(`Game title "${name}" deleted.`)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete game')
    }
  }

  const handlePublishGameAction = async (id: string) => {
    try {
      await publishGame(id)
      showToast('Game published as active.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to publish game')
    }
  }

  // Genres Action Handlers
  const handleCreateGenreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createGenre({
        ...newGenre,
        rotation_interval_seconds: Number(newGenre.rotation_interval_seconds || 4),
        display_order: Number(newGenre.display_order || 0),
      })
      showToast(`Genre category "${newGenre.name}" created!`)
      setIsCreateGenreOpen(false)
      setNewGenre({
        name: '',
        slug: '',
        description: '',
        banner_url: '',
        icon_url: '',
        rotation_interval_seconds: 4,
        display_order: 0,
        is_active: true,
      })
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to create genre')
    }
  }

  const handleUpdateGenreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGenre) return
    try {
      await updateGenre(editingGenre.id || (editingGenre as any)._id, {
        name: editingGenre.name,
        slug: editingGenre.slug,
        description: editingGenre.description,
        banner_url: editingGenre.banner_url,
        icon_url: editingGenre.icon_url,
        rotation_interval_seconds: Number(editingGenre.rotation_interval_seconds || 4),
        display_order: Number(editingGenre.display_order || 0),
        is_active: editingGenre.is_active,
      })
      showToast(`Genre category "${editingGenre.name}" updated!`)
      setEditingGenre(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update genre')
    }
  }

  const handleDeleteGenreAction = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the genre "${name}"?`)) return
    try {
      await deleteGenre(id)
      showToast(`Genre "${name}" removed.`)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete genre')
    }
  }

  const handleToggleGenreActive = async (g: Genre) => {
    try {
      await updateGenre(g.id || (g as any)._id, {
        is_active: !g.is_active,
      })
      showToast(`Genre "${g.name}" ${!g.is_active ? 'activated' : 'deactivated'}.`)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to toggle genre status')
    }
  }

  const handleAddGameToGenreAction = async (genreId: string, gameId: string) => {
    if (!gameId) return
    setIsAssigningGame(true)
    try {
      const updated = await addGameToGenre(genreId, gameId)
      showToast('Game assigned to genre category!')
      setManagingGenre(updated)
      setSelectedGameToAdd('')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to add game to genre')
    } finally {
      setIsAssigningGame(false)
    }
  }

  const handleRemoveGameFromGenreAction = async (genreId: string, gameId: string) => {
    setIsAssigningGame(true)
    try {
      const updated = await removeGameFromGenre(genreId, gameId)
      showToast('Game removed from genre category.')
      setManagingGenre(updated)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to remove game from genre')
    } finally {
      setIsAssigningGame(false)
    }
  }

  // Reviews Action Handlers
  const handleModerateReviewAction = async (
    id: string,
    status: 'APPROVED' | 'FEATURED' | 'PENDING' | 'HIDDEN',
    notes?: string
  ) => {
    try {
      await moderateReview(id, { status, admin_notes: notes })
      showToast(`Review updated to ${status}!`)
      setSelectedReviewForMod(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update review status')
    }
  }

  const handleDeleteReviewAction = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this contender review?')) return
    try {
      await deleteReview(id)
      showToast('Review permanently deleted.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete review')
    }
  }


  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <Hud className="text-cyan animate-pulse">CHECKING ADMIN AUTHORIZATION...</Hud>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-void px-6 text-center">
        <span className="font-mono text-5xl text-live">403</span>
        <h1 className="mt-4 font-display text-4xl font-black uppercase">Restricted Terminal</h1>
        <p className="mt-2 max-w-md text-dim">You must have Super Admin privileges to enter the command console.</p>
        <div className="mt-8">
          <Cta to="/">Return to Safety</Cta>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void pb-32 pt-28">
      <Container>
        {/* Terminal Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-live animate-pulse" />
              <Hud className="text-live">SUPER ADMIN TERMINAL</Hud>
              <span className="border border-live/40 bg-live/10 px-2 py-0.5 font-mono text-[9px] uppercase text-live">
                ROOT PRIVILEGES
              </span>
            </div>
            <h1 className="mt-2 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-black uppercase leading-none">
              Platform Command Center
            </h1>
            <p className="mt-2 text-dim">Master operations console: manage tournaments, games, users, verify payments, disburse payouts, arbitrate disputes, and configure platform media.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="border border-white/20 bg-surface px-4 py-2 font-mono text-xs uppercase hover:border-cyan hover:text-cyan transition-colors"
            >
              Sync Live State
            </button>
          </div>
        </div>

        {actionMsg && (
          <div className="mt-6 border border-ok/40 bg-ok/10 p-4 text-ok font-mono text-xs uppercase tracking-[0.16em]">
            ✓ {actionMsg}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="no-scrollbar mt-8 flex gap-1 overflow-x-auto border-b border-white/10 pb-px">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 border-b-2 px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
                tab === t
                  ? 'border-cyan bg-cyan/10 text-cyan'
                  : 'border-transparent text-dim hover:text-ink hover:bg-white/[0.02]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {tab === 'OVERVIEW' && (
          <div className="mt-8 space-y-8">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Panel className="p-5">
                <Hud className="text-dim">TOTAL USERS</Hud>
                <p className="mt-2 font-display text-4xl font-black">{stats?.total_users ?? users.length}</p>
              </Panel>
              <Panel className="p-5">
                <Hud className="text-cyan">ACTIVE TOURNAMENTS</Hud>
                <p className="mt-2 font-display text-4xl font-black text-cyan">{stats?.active_tournaments ?? tournaments.length}</p>
              </Panel>
              <Panel className="p-5">
                <Hud className="text-warn">PENDING PAYMENTS</Hud>
                <p className="mt-2 font-display text-4xl font-black text-warn">{payments.length}</p>
              </Panel>
              <Panel className="p-5">
                <Hud className="text-ok">AMETHEUS VAULT</Hud>
                <p className="mt-2 font-display text-4xl font-black text-ok">{inr(stats?.platform_escrow_vault ?? 0)}</p>
              </Panel>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              <Panel className="p-6">
                <Hud className="text-cyan">TOURNAMENTS HUB</Hud>
                <h3 className="mt-2 font-display text-2xl font-black uppercase truncate">
                  {tournaments.length} Tournaments
                </h3>
                <p className="text-xs text-dim mt-1 font-mono">Create, lock rosters, generate brackets, publish.</p>
                <div className="mt-4">
                  <button onClick={() => setTab('TOURNAMENTS')} className="border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs uppercase text-cyan hover:bg-cyan/20 transition-colors">
                    Manage Tournaments →
                  </button>
                </div>
              </Panel>

              <Panel className="p-6">
                <Hud className="text-warn">PAYMENT APPROVALS</Hud>
                <h3 className="mt-2 font-display text-2xl font-black uppercase text-warn">{payments.length} Pending</h3>
                <p className="text-xs text-dim mt-1 font-mono">UTRs requiring manual bank reconciliation.</p>
                <div className="mt-4">
                  <button onClick={() => setTab('PENDING PAYMENTS')} className="border border-warn/40 bg-warn/10 px-3 py-1.5 font-mono text-xs uppercase text-warn hover:bg-warn/20 transition-colors">
                    Review Transactions →
                  </button>
                </div>
              </Panel>

              <Panel className="p-6">
                <Hud className="text-ok">SUPPORT TICKETS</Hud>
                <h3 className="mt-2 font-display text-2xl font-black uppercase text-ok">{tickets?.length || 0} Active</h3>
                <p className="text-xs text-dim mt-1 font-mono">Customer inquiries and payment disputes.</p>
                <div className="mt-4">
                  <button onClick={() => setTab('SUPPORT TICKETS')} className="border border-ok/40 bg-ok/10 px-3 py-1.5 font-mono text-xs uppercase text-ok hover:bg-ok/20 transition-colors">
                    View Helpdesk →
                  </button>
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* TAB: MEDIA & ARTWORK MANAGER */}
        {tab === 'MEDIA & ARTWORK MANAGER' && (
          <MediaArtworkManager
            games={games}
            tournaments={tournaments}
            onRefresh={loadData}
            showToast={showToast}
          />
        )}

        {/* TAB: TOURNAMENTS */}
        {tab === 'TOURNAMENTS' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Tournaments Management</h2>
                <p className="text-xs text-dim">Authoritative control: create, edit, lock rosters, generate brackets, publish or cancel tournaments.</p>
              </div>
              <button
                onClick={() => { setCreateTourError(null); setIsCreateTourOpen(true); }}
                className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all shrink-0"
              >
                + Create Tournament
              </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED', 'DRAFT'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTournamentFilter(f)}
                    className={`px-3 py-1 font-mono text-[11px] uppercase border transition-colors ${
                      tournamentFilter === f ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/10 text-dim hover:text-ink'
                    }`}
                  >
                    {f.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Search tournaments..."
                value={tournamentSearch}
                onChange={(e) => setTournamentSearch(e.target.value)}
                className="w-full sm:w-64 border border-white/15 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan font-mono"
              />
            </div>

            {/* Tournaments Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tournaments
                .filter((t) => {
                  if (tournamentFilter !== 'ALL' && t.status !== tournamentFilter) return false
                  if (tournamentSearch && !t.title.toLowerCase().includes(tournamentSearch.toLowerCase())) return false
                  return true
                })
                .map((t) => {
                  const norm = normalizeTournament(t)
                  const isFeatured = featuredTour?.id === t.id || featuredTour?.slug === t.slug
                  return (
                    <Panel key={t.id || t.slug} className="p-5 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                          <span className="font-mono text-xs text-cyan font-bold uppercase">{norm.gameName}</span>
                          <span
                            className={`border px-2 py-0.5 font-mono text-[9px] uppercase ${
                              t.status === 'LIVE'
                                ? 'border-live bg-live/10 text-live'
                                : t.status === 'REGISTRATION_OPEN'
                                ? 'border-cyan bg-cyan/10 text-cyan'
                                : t.status === 'REGISTRATION_CLOSED'
                                ? 'border-warn bg-warn/10 text-warn'
                                : 'border-white/20 text-dim'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>

                        <h3 className="mt-3 font-display text-xl font-black uppercase text-ink line-clamp-1">{t.title}</h3>
                        <p className="mt-1 font-mono text-xs text-dim">Format: {t.format}</p>
                        <p className="font-mono text-xs text-dim">Prize Pool: {inr(norm.prizePoolInr)}</p>
                        <p className="font-mono text-xs text-dim">Entry Fee: {inr(norm.entryFeeInr)}</p>

                        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-xs font-mono">
                          <span className="text-dim">Registered Teams:</span>
                          <span className="text-cyan font-bold">
                            {norm.registeredTeams} / {norm.maxTeams}
                          </span>
                        </div>
                      </div>

                      {/* Tournament Operations */}
                      <div className="space-y-2 border-t border-white/10 pt-3">
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => handleViewRosters(t)}
                            className="border border-white/20 bg-surface px-2.5 py-1.5 font-mono text-[10px] uppercase text-ink hover:border-cyan hover:text-cyan transition-colors"
                          >
                            Rosters ({norm.registeredTeams})
                          </button>
                          <button
                            onClick={() => setEditingTour(t)}
                            className="border border-white/20 bg-surface px-2.5 py-1.5 font-mono text-[10px] uppercase text-ink hover:border-cyan hover:text-cyan transition-colors"
                          >
                            Edit
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {t.status === 'DRAFT' && (
                            <button
                              onClick={() => handlePublishTour(t.id || t.slug)}
                              className="border border-cyan bg-cyan/15 px-2 py-1 font-mono text-[10px] uppercase text-cyan hover:bg-cyan/30"
                            >
                              Publish
                            </button>
                          )}
                          {t.status === 'REGISTRATION_OPEN' && (
                            <button
                              onClick={() => handleCloseRegTour(t.id || t.slug)}
                              className="border border-warn bg-warn/15 px-2 py-1 font-mono text-[10px] uppercase text-warn hover:bg-warn/30"
                            >
                              Lock Rosters
                            </button>
                          )}
                          {t.status === 'REGISTRATION_CLOSED' && (
                            <>
                              <button
                                onClick={() => handleReopenRegTour(t.id || t.slug)}
                                className="border border-white/20 bg-surface px-2 py-1 font-mono text-[10px] uppercase text-dim hover:text-ink hover:border-cyan"
                              >
                                Reopen Reg
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedFormationTourId(t.id || t.slug)
                                  setTab('LIVE MATCHES')
                                }}
                                className="border border-cyan bg-cyan/15 px-2 py-1 font-mono text-[10px] uppercase text-cyan hover:bg-cyan/30"
                              >
                                Match Formation
                              </button>
                            </>
                          )}
                          {t.status === 'LIVE' && (
                            <>
                              <button
                                onClick={() => handleCompleteTour(t.id || t.slug)}
                                className="border border-ok bg-ok/20 px-2 py-1 font-mono text-[10px] uppercase text-ok hover:bg-ok/30 font-bold"
                              >
                                ✓ Complete Event
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedFormationTourId(t.id || t.slug)
                                  setTab('LIVE MATCHES')
                                }}
                                className="border border-cyan bg-cyan/15 px-2 py-1 font-mono text-[10px] uppercase text-cyan hover:bg-cyan/30"
                              >
                                View Matches
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleSetFeatured(isFeatured ? 'none' : t.id || t.slug)}
                            className={`border px-2 py-1 font-mono text-[10px] uppercase ${
                              isFeatured ? 'border-magenta bg-magenta/20 text-magenta' : 'border-white/15 text-dim hover:text-ink'
                            }`}
                          >
                            {isFeatured ? '★ Featured' : '☆ Spotlight'}
                          </button>
                          {t.status !== 'CANCELLED' && t.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => handleCancelTour(t.id || t.slug)}
                              className="border border-live/40 bg-live/10 px-2 py-1 font-mono text-[10px] uppercase text-live hover:bg-live/20"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setTournamentToDelete(t)
                              setDeleteConfirmText('')
                            }}
                            className="border border-red-500/50 bg-red-500/10 px-2 py-1 font-mono text-[10px] uppercase text-red-400 hover:bg-red-500/25 hover:text-red-300 transition-colors cursor-pointer"
                            title="Permanently delete tournament and all associated matches"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </Panel>
                  )
                })}
            </div>
          </div>
        )}

        {/* TAB: LIVE MATCHES */}
        {tab === 'LIVE MATCHES' && (
          <div className="mt-8">
            <LiveMatchesManager
              tournaments={tournaments}
              onMatchesUpdated={loadData}
              initialTournamentId={selectedFormationTourId}
            />
          </div>
        )}

        {/* TAB: RATING MANAGEMENT */}
        {tab === 'RATING MANAGEMENT' && (
          <div className="mt-8">
            <RatingManager onRatingUpdated={loadData} />
          </div>
        )}

        {/* TAB: ORGANIZER MATCH REQUESTS */}
        {tab === 'ORGANIZER MATCH REQUESTS' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-cyan animate-pulse" />
                  <Hud className="text-cyan">ORGANIZER MATCH ARBITRATION</Hud>
                </div>
                <h2 className="mt-1 font-display text-3xl font-black uppercase">Organizer Match Requests</h2>
                <p className="text-xs text-dim">Review requests from tournament organizers to set matches live, feature streams, and arbitrate fixtures.</p>
              </div>
              <div className="flex items-center gap-2">
                <Hud className="text-dim">{matchRequests.length} TOTAL REQUESTS</Hud>
                <button onClick={loadData} className="border border-white/15 bg-surface px-3 py-1 font-mono text-xs uppercase hover:border-cyan text-ink">
                  Refresh
                </button>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {['ALL', 'NEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'RESOLVED'].map((st) => {
                const count =
                  st === 'ALL'
                    ? matchRequests.length
                    : matchRequests.filter(
                        (r) =>
                          r.status === st ||
                          (st === 'NEW' && r.status === 'PENDING') ||
                          (st === 'UNDER_REVIEW' && r.status === 'IN_REVIEW')
                      ).length
                return (
                  <button
                    key={st}
                    onClick={() => setMatchRequestFilter(st)}
                    className={`border px-3 py-1.5 font-mono text-xs uppercase transition-colors ${
                      matchRequestFilter === st
                        ? 'border-cyan bg-cyan text-void font-bold'
                        : 'border-white/15 bg-surface text-dim hover:text-ink'
                    }`}
                  >
                    {st} ({count})
                  </button>
                )
              })}
            </div>

            {/* Request list */}
            {matchRequests.filter(
              (r) =>
                matchRequestFilter === 'ALL' ||
                r.status === matchRequestFilter ||
                (matchRequestFilter === 'NEW' && r.status === 'PENDING') ||
                (matchRequestFilter === 'UNDER_REVIEW' && r.status === 'IN_REVIEW')
            ).length === 0 ? (
              <div className="border border-dashed border-white/15 p-12 text-center font-mono text-xs text-dim">
                NO ORGANIZER MATCH REQUESTS IN THIS CATEGORY.
              </div>
            ) : (
              <div className="space-y-4">
                {matchRequests
                  .filter(
                    (r) =>
                      matchRequestFilter === 'ALL' ||
                      r.status === matchRequestFilter ||
                      (matchRequestFilter === 'NEW' && r.status === 'PENDING') ||
                      (matchRequestFilter === 'UNDER_REVIEW' && r.status === 'IN_REVIEW')
                  )
                  .map((req) => (
                    <Panel key={req.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-cyan">
                      <div className="space-y-2 font-mono text-xs flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
                            req.status === 'APPROVED' ? 'border-ok text-ok bg-ok/10' :
                            req.status === 'REJECTED' ? 'border-live text-live bg-live/10' :
                            req.status === 'IN_REVIEW' ? 'border-amber-400 text-amber-400 bg-amber-400/10' :
                            'border-cyan text-cyan bg-cyan/10'
                          }`}>
                            {req.status}
                          </span>
                          <span className={`px-2 py-0.5 border text-[10px] uppercase ${
                            req.urgency === 'URGENT' ? 'border-live text-live font-bold' :
                            req.urgency === 'HIGH' ? 'border-amber-400 text-amber-400 font-bold' :
                            'border-white/20 text-dim'
                          }`}>
                            {req.urgency} URGENCY
                          </span>
                          <span className="text-dim">Submitted: {new Date(req.created_at).toLocaleString()}</span>
                        </div>

                        <div className="text-sm font-bold text-ink">
                          {req.title || `${req.team_a_name || 'Team A'} vs ${req.team_b_name || 'Team B'}`}
                        </div>

                        <div className="text-dim flex flex-wrap gap-4 text-[11px]">
                          <span>Organizer: <strong className="text-ink">{req.organizer_name}</strong> ({req.organizer_email || 'No email'})</span>
                          <span>Tournament: <strong className="text-cyan">{req.tournament_name || req.tournament_id}</strong></span>
                          {req.round_name && <span>Round: <strong className="text-ink">{req.round_name}</strong></span>}
                          {req.scheduled_at && <span>Schedule: <strong className="text-ink">{req.scheduled_at}</strong></span>}
                        </div>

                        {req.youtube_live_url && (
                          <div className="text-[11px] text-cyan truncate">
                            Live Stream: <a href={req.youtube_live_url} target="_blank" rel="noreferrer" className="underline hover:text-white">{req.youtube_live_url}</a>
                          </div>
                        )}

                        {req.notes && (
                          <div className="text-dim bg-surface/50 border border-white/5 p-2 text-[11px] rounded">
                            Organizer Notes: {req.notes}
                          </div>
                        )}

                        {req.admin_notes && (
                          <div className="text-amber-400/90 bg-amber-500/5 border border-amber-500/20 p-2 text-[11px] rounded">
                            Admin Decision Notes: {req.admin_notes}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setActioningRequest(req)
                            setActionReqStatus('APPROVED')
                            setActionReqNotes(req.admin_notes || '')
                            setActionReqMakeLive(true)
                          }}
                          className="border border-cyan bg-cyan/15 px-3 py-1.5 font-mono text-xs uppercase text-cyan hover:bg-cyan/30"
                        >
                          Review & Action
                        </button>
                      </div>
                    </Panel>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: ORGANIZER EMAILS */}
        {tab === 'ORGANIZER EMAILS' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-magenta animate-pulse" />
                  <Hud className="text-magenta">ORGANIZER DIRECT CORRESPONDENCE</Hud>
                </div>
                <h2 className="mt-1 font-display text-3xl font-black uppercase">Organizer Inquiries & Email Threads</h2>
                <p className="text-xs text-dim">Respond to inquiries and personal correspondence from platform tournament organizers.</p>
              </div>
              <div className="flex items-center gap-2">
                <Hud className="text-dim">{organizerEmailThreads.length} ACTIVE THREADS</Hud>
                <button onClick={loadData} className="border border-white/15 bg-surface px-3 py-1 font-mono text-xs uppercase hover:border-cyan text-ink">
                  Refresh
                </button>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {['ALL', 'UNREAD', 'OPEN', 'WAITING_FOR_ADMIN', 'WAITING_FOR_ORGANIZER', 'RESOLVED', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrgEmailStatusFilter(st)}
                  className={`border px-3 py-1.5 font-mono text-xs uppercase transition-colors ${
                    orgEmailStatusFilter === st
                      ? 'border-magenta bg-magenta text-void font-bold'
                      : 'border-white/15 bg-surface text-dim hover:text-ink'
                  }`}
                >
                  {st} ({st === 'ALL' ? organizerEmailThreads.length : organizerEmailThreads.filter((t) => t.status === st).length})
                </button>
              ))}
            </div>

            {/* Thread list */}
            {organizerEmailThreads.filter((t) => orgEmailStatusFilter === 'ALL' || t.status === orgEmailStatusFilter).length === 0 ? (
              <div className="border border-dashed border-white/15 p-12 text-center font-mono text-xs text-dim">
                NO ORGANIZER EMAIL THREADS IN THIS CATEGORY.
              </div>
            ) : (
              <div className="space-y-4">
                {organizerEmailThreads
                  .filter((t) => orgEmailStatusFilter === 'ALL' || t.status === orgEmailStatusFilter)
                  .map((th) => (
                    <Panel key={th.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-magenta">
                      <div className="space-y-2 font-mono text-xs flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
                            th.status === 'RESOLVED' || th.status === 'CLOSED' ? 'border-ok text-ok bg-ok/10' :
                            th.status === 'WAITING_FOR_ADMIN' || th.status === 'UNREAD' ? 'border-live text-live bg-live/10' :
                            'border-magenta text-magenta bg-magenta/10'
                          }`}>
                            {th.status}
                          </span>
                          <span className="border border-white/20 px-2 py-0.5 text-[10px] text-dim uppercase">
                            {th.category}
                          </span>
                          <span className="text-dim">Messages: {th.messages?.length || 1}</span>
                          <span className="text-dim">Last update: {new Date(th.updated_at || th.created_at).toLocaleString()}</span>
                        </div>

                        <div className="text-sm font-bold text-ink">
                          {th.subject}
                        </div>

                        <div className="text-dim text-[11px]">
                          Organizer: <strong className="text-ink">{th.organizer_name}</strong> · <span className="text-cyan">{th.organizer_email}</span>
                        </div>

                        {th.messages && th.messages.length > 0 && (
                          <div className="text-dim/80 text-[11px] line-clamp-2 bg-surface/50 border border-white/5 p-2 rounded">
                            Latest: "{th.messages[th.messages.length - 1].message}"
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setActiveOrgThread(th)
                            setOrgThreadReplyText('')
                            setOrgThreadNextStatus('WAITING_FOR_ORGANIZER')
                          }}
                          className="border border-magenta bg-magenta/15 px-3 py-1.5 font-mono text-xs uppercase text-magenta hover:bg-magenta/30"
                        >
                          Open Dialogue
                        </button>
                      </div>
                    </Panel>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FEATURED TOURNAMENT */}
        {tab === 'FEATURED TOURNAMENT' && (
          <div className="mt-8 space-y-6">
            <Panel className="p-6 md:p-8">
              <Hud className="text-cyan">MAIN HOMEPAGE FEATURED SPOTLIGHT</Hud>
              <h2 className="mt-2 font-display text-3xl font-black uppercase">Main Homepage Featured Tournament</h2>
              <p className="mt-1 text-sm text-dim max-w-2xl">
                The tournament selected below receives the largest screen and visual allocation in the hero section on the homepage.
              </p>

              {featuredTour ? (
                <div className="mt-6 border border-cyan/40 bg-surface/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-cyan animate-pulse" />
                      <span className="font-mono text-xs uppercase text-cyan font-bold">Currently Featured on Homepage</span>
                    </div>
                    <h3 className="mt-2 font-display text-3xl font-black uppercase text-ink">{featuredTour.title}</h3>
                    <p className="mt-1 font-mono text-xs text-dim">
                      {featuredTour.game_name || featuredTour.game_id} · Prize: {inr(featuredTour.prize_pool_inr)} · Teams: {featuredTour.registered_teams ?? 0} / {featuredTour.max_teams}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSetFeatured('none')}
                    disabled={isSavingFeatured}
                    className="border border-live/50 bg-live/10 px-4 py-2 font-mono text-xs uppercase text-live hover:bg-live/20 transition-colors"
                  >
                    Clear Spotlight
                  </button>
                </div>
              ) : (
                <div className="mt-6 border border-dashed border-white/15 p-6 font-mono text-xs text-dim">
                  NO FEATURED TOURNAMENT CURRENTLY ACTIVE. SELECT ONE BELOW.
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-white/10">
                <Hud>Quick Spotlight Switcher</Hud>
                <div className="mt-3 flex flex-col sm:flex-row gap-3 max-w-xl">
                  <select
                    value={selectedFeaturedId}
                    onChange={(e) => setSelectedFeaturedId(e.target.value)}
                    className="w-full border border-white/15 bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-cyan font-mono"
                  >
                    <option value="none">-- None (Unset Spotlight) --</option>
                    {tournaments.map((t) => (
                      <option key={t.id || t.slug} value={t.id || t.slug}>
                        {t.title} ({t.game_name || t.game_id}) — {inr(t.prize_pool_inr)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleSetFeatured(selectedFeaturedId)}
                    disabled={isSavingFeatured || !selectedFeaturedId}
                    className="border border-cyan bg-cyan px-6 py-2.5 font-mono text-xs uppercase text-void font-bold hover:brightness-110 disabled:opacity-50 shrink-0"
                  >
                    {isSavingFeatured ? 'Saving...' : 'Apply Spotlight'}
                  </button>
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* TAB: GAMES CATALOG */}
        {tab === 'GAMES CATALOG' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Sanctioned Game Titles</h2>
                <p className="text-xs text-dim">Full title catalog with platform parameters, server locations, and anti-cheat credentials.</p>
              </div>
              <div className="flex items-center gap-3">
                <Hud className="text-cyan">{games.length} GAMES</Hud>
                <button
                  onClick={() => setIsCreateGameOpen(true)}
                  className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all"
                >
                  + Add Game Title
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {games.map((g) => (
                <Panel key={g.id || g.slug} className="p-5 flex flex-col justify-between space-y-4">
                  <div>
                    {g.banner_url && (
                      <div className="relative aspect-video w-full overflow-hidden border border-white/10 bg-surface mb-3">
                        <img
                          src={resolveMediaUrl(g.banner_url)}
                          alt={g.name}
                          className="size-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-mono text-xs text-cyan font-bold">{g.tag || 'ESPORTS'}</span>
                      <span className="border border-cyan/40 bg-cyan/10 px-2 py-0.5 font-mono text-[9px] uppercase text-cyan">{g.status || 'ACTIVE'}</span>
                    </div>
                    <h3 className="mt-2 font-display text-2xl font-black uppercase">{g.name}</h3>
                    <p className="font-mono text-xs text-dim">Slug: {g.slug}</p>
                    <p className="font-mono text-xs text-dim">Platform: {g.platform || 'PC'}</p>
                    <p className="font-mono text-xs text-dim">Team Size: {g.min_team_size || 1} - {g.max_team_size || 5} Players</p>
                    <p className="font-mono text-xs text-dim">Server: {g.server_region || 'India'}</p>
                    <p className="font-mono text-xs text-dim">Anti-Cheat: {g.anti_cheat || 'Verified'}</p>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-3">
                    <button
                      onClick={() => setEditingGame(g)}
                      className="border border-white/20 bg-surface px-3 py-1 font-mono text-xs uppercase text-ink hover:border-cyan hover:text-cyan"
                    >
                      Edit
                    </button>
                    {g.status !== 'ACTIVE' && (
                      <button
                        onClick={() => handlePublishGameAction(g.id || g.slug)}
                        className="border border-cyan bg-cyan/15 px-3 py-1 font-mono text-xs uppercase text-cyan hover:bg-cyan/25"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteGameAction(g.id || g.slug, g.name)}
                      className="border border-live/40 bg-live/10 px-3 py-1 font-mono text-xs uppercase text-live hover:bg-live/20"
                    >
                      Delete
                    </button>
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        )}

        {/* TAB: GENRES & CATEGORIES */}
        {tab === 'GENRES & CATEGORIES' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Dynamic Genres & Categories Hub</h2>
                <p className="text-xs text-dim">
                  Centralized genres aggregate multiple game titles. Public genre cards cycle member game logos automatically.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Hud className="text-cyan">{genres.length} REGISTERED GENRES</Hud>
                <button
                  onClick={() => setIsCreateGenreOpen(true)}
                  className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all shrink-0"
                >
                  + Add Genre Category
                </button>
              </div>
            </div>

            {/* Image Presets & Guidelines Panel */}
            <Panel className="p-5 border-cyan/30 bg-cyan/[0.03]">
              <div className="flex items-center gap-2 mb-2">
                <span className="size-2 bg-cyan rounded-full animate-pulse" />
                <span className="font-mono text-xs uppercase font-bold text-cyan tracking-wider">
                  Standardized Media Presets & Aspect Ratios
                </span>
              </div>
              <p className="text-xs text-dim mb-4">
                Genre artwork and rotating title assets dynamically adapt across responsive viewports. Use the official presets below for pristine sharpness and zero distortion:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-xs">
                <div className="border border-white/10 bg-surface/70 p-3">
                  <div className="text-cyan font-bold text-sm">16:9 DESKTOP</div>
                  <div className="text-ink font-semibold mt-0.5">1920 × 1080 px</div>
                  <div className="text-dim text-[10px] mt-1">Hero banners & widescreen cards</div>
                </div>
                <div className="border border-white/10 bg-surface/70 p-3">
                  <div className="text-cyan font-bold text-sm">4:3 TABLET</div>
                  <div className="text-ink font-semibold mt-0.5">1200 × 900 px</div>
                  <div className="text-dim text-[10px] mt-1">Medium grid tiles & catalog cards</div>
                </div>
                <div className="border border-white/10 bg-surface/70 p-3">
                  <div className="text-cyan font-bold text-sm">9:16 MOBILE</div>
                  <div className="text-ink font-semibold mt-0.5">1080 × 1920 px</div>
                  <div className="text-dim text-[10px] mt-1">Vertical feed cards & mobile stories</div>
                </div>
                <div className="border border-white/10 bg-surface/70 p-3">
                  <div className="text-cyan font-bold text-sm">1:1 SQUARE</div>
                  <div className="text-ink font-semibold mt-0.5">800 × 800 px</div>
                  <div className="text-dim text-[10px] mt-1">Genre badge icons & avatar marks</div>
                </div>
                <div className="border border-white/10 bg-surface/70 p-3">
                  <div className="text-cyan font-bold text-sm">VECTOR SVG</div>
                  <div className="text-ink font-semibold mt-0.5">Scale-Free</div>
                  <div className="text-dim text-[10px] mt-1">Infinitely sharp vector emblems</div>
                </div>
              </div>
            </Panel>

            {/* Genres Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {genres.map((g) => {
                const genreId = g.id || (g as any)._id
                const connectedGames = g.games || []
                return (
                  <Panel key={genreId || g.slug} className="p-5 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Banner / Media Preview */}
                      <div className="relative aspect-video w-full overflow-hidden border border-white/10 bg-surface mb-3">
                        {g.banner_url ? (
                          <img
                            src={resolveMediaUrl(g.banner_url)}
                            alt={g.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="grid size-full place-items-center font-mono text-xs text-dim">
                            NO BANNER ARTWORK
                          </div>
                        )}
                        {g.icon_url && (
                          <div className="absolute bottom-2 left-2 size-10 overflow-hidden border border-white/20 bg-void/85 p-1 backdrop-blur-sm">
                            <img
                              src={resolveMediaUrl(g.icon_url)}
                              alt={`${g.name} icon`}
                              className="size-full object-contain"
                            />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 border border-white/20 bg-void/85 px-2 py-0.5 font-mono text-[9px] uppercase backdrop-blur-sm text-cyan">
                          {g.rotation_interval_seconds}s CYCLE
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-mono text-xs text-cyan font-bold uppercase">{g.slug}</span>
                        <span
                          className={`border px-2 py-0.5 font-mono text-[9px] uppercase ${
                            g.is_active ? 'border-ok/40 bg-ok/10 text-ok' : 'border-white/20 text-dim'
                          }`}
                        >
                          {g.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      <h3 className="mt-2 font-display text-2xl font-black uppercase text-ink">{g.name}</h3>
                      {g.description && (
                        <p className="mt-1 font-mono text-xs text-dim line-clamp-2">{g.description}</p>
                      )}

                      {/* Member games connected */}
                      <div className="mt-4 border-t border-white/5 pt-3">
                        <div className="flex items-center justify-between font-mono text-[11px] mb-2">
                          <span className="text-dim">Connected Games:</span>
                          <span className="text-cyan font-bold">
                            {g.game_count ?? connectedGames.length} Titles
                          </span>
                        </div>
                        {connectedGames.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {connectedGames.map((gm) => (
                              <span
                                key={gm.id || gm.slug}
                                className="inline-flex items-center gap-1 border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-ink"
                              >
                                {gm.logo_url && (
                                  <img
                                    src={resolveMediaUrl(gm.logo_url)}
                                    alt=""
                                    className="size-3 object-contain"
                                  />
                                )}
                                {gm.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="font-mono text-[10px] text-dim/60 italic">
                            No games currently assigned to this category
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-3">
                      <button
                        onClick={() => {
                          setManagingGenre(g)
                          setSelectedGameToAdd('')
                        }}
                        className="border border-cyan/40 bg-cyan/10 px-2.5 py-1 font-mono text-xs uppercase text-cyan hover:bg-cyan/20 cursor-pointer"
                      >
                        Assign Games ({connectedGames.length})
                      </button>
                      <button
                        onClick={() => setEditingGenre(g)}
                        className="border border-white/20 bg-surface px-3 py-1 font-mono text-xs uppercase text-ink hover:border-cyan hover:text-cyan"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleGenreActive(g)}
                        className={`border px-2.5 py-1 font-mono text-xs uppercase ${
                          g.is_active
                            ? 'border-warn/40 bg-warn/10 text-warn hover:bg-warn/20'
                            : 'border-ok/40 bg-ok/10 text-ok hover:bg-ok/20'
                        }`}
                      >
                        {g.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteGenreAction(genreId, g.name)}
                        className="border border-live/40 bg-live/10 px-3 py-1 font-mono text-xs uppercase text-live hover:bg-live/20"
                      >
                        Delete
                      </button>
                    </div>
                  </Panel>
                )
              })}
            </div>
          </div>
        )}


        {/* TAB: REVIEWS MODERATION */}
        {tab === 'REVIEWS MODERATION' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Contender Reviews Moderation</h2>
                <p className="text-xs text-dim">
                  Audit, verify, feature, or remove community reviews submitted by registered platform players.
                </p>
              </div>
              <Hud className="text-cyan">{adminReviews.length} TOTAL REVIEWS</Hud>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Panel className="p-4">
                <Hud className="text-dim">TOTAL REVIEWS</Hud>
                <p className="mt-2 font-display text-3xl font-black">{adminReviews.length}</p>
              </Panel>
              <Panel className="p-4">
                <Hud className="text-ok">AVERAGE RATING</Hud>
                <p className="mt-2 font-display text-3xl font-black text-ok">
                  {adminReviews.length > 0
                    ? (adminReviews.reduce((acc, r) => acc + r.rating, 0) / adminReviews.length).toFixed(1)
                    : '5.0'}{' '}
                  ★
                </p>
              </Panel>
              <Panel className="p-4">
                <Hud className="text-warn">PENDING AUDIT</Hud>
                <p className="mt-2 font-display text-3xl font-black text-warn">
                  {adminReviews.filter((r) => r.status === 'PENDING').length}
                </p>
              </Panel>
              <Panel className="p-4">
                <Hud className="text-magenta">FEATURED SPOTLIGHTS</Hud>
                <p className="mt-2 font-display text-3xl font-black text-magenta">
                  {adminReviews.filter((r) => r.status === 'FEATURED').length}
                </p>
              </Panel>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'PENDING', 'APPROVED', 'FEATURED', 'HIDDEN'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setReviewStatusFilter(f)}
                    className={`px-3 py-1 font-mono text-[11px] uppercase border transition-colors ${
                      reviewStatusFilter === f
                        ? 'border-cyan bg-cyan/15 text-cyan'
                        : 'border-white/10 text-dim hover:text-ink'
                    }`}
                  >
                    {f} ({f === 'ALL' ? adminReviews.length : adminReviews.filter((r) => r.status === f).length})
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Search by reviewer or text..."
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                className="w-full sm:w-72 border border-white/15 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan font-mono"
              />
            </div>

            {/* Reviews List */}
            {adminReviews.length === 0 ? (
              <div className="border border-dashed border-white/15 p-12 text-center font-mono text-xs text-dim">
                NO REVIEWS FOUND IN DATABASE.
              </div>
            ) : (
              <div className="space-y-3">
                {adminReviews
                  .filter((r) => {
                    if (reviewStatusFilter !== 'ALL' && r.status !== reviewStatusFilter) return false
                    if (reviewSearch) {
                      const q = reviewSearch.toLowerCase()
                      const matchesUser = r.user_name?.toLowerCase().includes(q)
                      const matchesText = r.review_text?.toLowerCase().includes(q)
                      if (!matchesUser && !matchesText) return false
                    }
                    return true
                  })
                  .map((r) => (
                    <Panel key={r.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display font-black uppercase text-ink text-base">
                            {r.user_name || 'Anonymous Contender'}
                          </span>
                          <span className="border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-cyan">
                            {r.category || 'PLATFORM'}
                          </span>
                          <span
                            className={`border px-2 py-0.5 font-mono text-[10px] uppercase font-bold ${
                              r.status === 'FEATURED'
                                ? 'border-magenta bg-magenta/20 text-magenta'
                                : r.status === 'APPROVED'
                                ? 'border-ok/40 bg-ok/10 text-ok'
                                : r.status === 'PENDING'
                                ? 'border-warn/40 bg-warn/10 text-warn'
                                : 'border-white/20 text-dim'
                            }`}
                          >
                            {r.status}
                          </span>
                          <div className="flex text-cyan text-xs">
                            {'★'.repeat(r.rating)}
                            {'☆'.repeat(5 - r.rating)}
                          </div>
                        </div>

                        <p className="font-mono text-xs text-ink/90 italic">"{r.review_text}"</p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-dim">
                          <span>Submitted: {r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'}</span>
                          {r.admin_notes && (
                            <span className="text-warn">
                              Admin Notes: {r.admin_notes}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Moderation Controls */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {r.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleModerateReviewAction(r.id, 'APPROVED')}
                            className="border border-ok/40 bg-ok/10 px-2.5 py-1 font-mono text-[11px] uppercase text-ok hover:bg-ok/20 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {r.status !== 'FEATURED' && (
                          <button
                            onClick={() => handleModerateReviewAction(r.id, 'FEATURED')}
                            className="border border-magenta/40 bg-magenta/15 px-2.5 py-1 font-mono text-[11px] uppercase text-magenta hover:bg-magenta/25 transition-colors"
                          >
                            ★ Feature
                          </button>
                        )}
                        {r.status !== 'HIDDEN' && (
                          <button
                            onClick={() => handleModerateReviewAction(r.id, 'HIDDEN')}
                            className="border border-white/20 bg-surface px-2.5 py-1 font-mono text-[11px] uppercase text-dim hover:text-ink transition-colors"
                          >
                            Hide
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedReviewForMod(r)
                            setModStatus(r.status)
                            setModNotes(r.admin_notes || '')
                          }}
                          className="border border-cyan/40 bg-cyan/10 px-2.5 py-1 font-mono text-[11px] uppercase text-cyan hover:bg-cyan/20 transition-colors"
                        >
                          Notes
                        </button>
                        <button
                          onClick={() => handleDeleteReviewAction(r.id)}
                          className="border border-live/40 bg-live/10 px-2.5 py-1 font-mono text-[11px] uppercase text-live hover:bg-live/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </Panel>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: PLAYER CRESTS */}
        {tab === 'PLAYER CRESTS' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Player Crests & Avatars</h2>
                <p className="text-xs text-dim">
                  Curate, upload, and toggle operator crests selectable by players across the platform.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Hud className="text-cyan">
                  {adminCrests.filter((c) => c.is_active).length}/{adminCrests.length} ACTIVE
                </Hud>
                <button
                  onClick={() => setIsCreateCrestModalOpen(true)}
                  className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all shrink-0 cursor-pointer"
                >
                  + Add New Crest
                </button>
              </div>
            </div>

            {adminCrestActionMsg && (
              <div className="border border-cyan/40 bg-cyan/10 p-3 font-mono text-xs text-cyan">
                {adminCrestActionMsg}
              </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Filter crests by name or description..."
                  value={crestSearch}
                  onChange={(e) => {
                    setCrestSearch(e.target.value)
                    loadAdminCrests(e.target.value)
                  }}
                  className="w-full border border-white/15 bg-surface px-3 py-2 font-mono text-xs text-ink placeholder:text-dim outline-none focus:border-cyan"
                />
                {crestSearch && (
                  <button
                    onClick={() => {
                      setCrestSearch('')
                      loadAdminCrests('')
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-dim hover:text-ink cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="font-mono text-xs text-dim">
                Showing {adminCrests.length} {adminCrests.length === 1 ? 'crest' : 'crests'}
              </div>
            </div>

            {/* Crests Grid */}
            {adminCrests.length === 0 ? (
              <div className="border border-dashed border-white/15 p-12 text-center font-mono text-xs text-dim">
                NO PLAYER CRESTS FOUND. CLICK "+ ADD NEW CREST" TO CREATE ONE.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {adminCrests.map((crest) => (
                  <Panel
                    key={crest.id}
                    className="p-4 flex flex-col justify-between border-white/10 hover:border-white/20 transition-all"
                  >
                    <div>
                      {/* Crest Preview */}
                      <div className="relative aspect-square w-full rounded border border-white/10 bg-void/80 flex items-center justify-center p-4 mb-3 overflow-hidden group">
                        <img
                          src={resolveMediaUrl(crest.image_url)}
                          alt={crest.name}
                          className="w-20 h-20 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-2 right-2">
                          <span
                            className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase font-bold ${
                              crest.is_active
                                ? 'border-ok/40 bg-ok/10 text-ok'
                                : 'border-white/20 bg-white/5 text-dim'
                            }`}
                          >
                            {crest.is_active ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </div>
                        {crest.category && (
                          <div className="absolute bottom-2 left-2">
                            <span className="border border-white/10 bg-surface/80 px-1.5 py-0.5 font-mono text-[9px] text-cyan uppercase">
                              {crest.category}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <h4 className="font-display font-black text-sm uppercase text-ink tracking-wide">
                        {crest.name}
                      </h4>
                      {crest.description && (
                        <p className="mt-1 font-mono text-xs text-dim line-clamp-2 leading-relaxed">
                          {crest.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleCrestActive(crest)}
                        className={`flex-1 border px-2.5 py-1 font-mono text-[11px] uppercase transition-colors cursor-pointer ${
                          crest.is_active
                            ? 'border-warn/40 bg-warn/10 text-warn hover:bg-warn/20'
                            : 'border-ok/40 bg-ok/10 text-ok hover:bg-ok/20'
                        }`}
                      >
                        {crest.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete crest "${crest.name}"?`)) {
                            handleDeleteCrest(crest)
                          }
                        }}
                        className="border border-live/40 bg-live/10 px-2.5 py-1 font-mono text-[11px] uppercase text-live hover:bg-live/20 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE CREST MODAL */}
        {isCreateCrestModalOpen && (
          <Portal lockScroll>
            <div
              role="dialog"
              aria-modal
              className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none"
            >
              <div className="relative w-full max-w-lg max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-white/20 bg-graphite p-6 shadow-2xl select-text">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="font-display text-xl font-black uppercase text-cyan">
                      Create Player Crest
                    </h3>
                    <p className="text-xs text-dim mt-0.5">
                      Upload or link a vector emblem for player profiles.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateCrestModalOpen(false)}
                    className="font-mono text-sm text-dim hover:text-ink cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCrest} className="mt-4 space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-dim uppercase tracking-wider text-[11px] block mb-1">
                      Crest Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Predator, Neon Samurai"
                      value={newCrestName}
                      onChange={(e) => setNewCrestName(e.target.value)}
                      className="w-full border border-white/15 bg-surface p-2 text-xs text-ink outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <label className="text-dim uppercase tracking-wider text-[11px] block mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Short bio or unlock requirements"
                      value={newCrestDesc}
                      onChange={(e) => setNewCrestDesc(e.target.value)}
                      className="w-full border border-white/15 bg-surface p-2 text-xs text-ink outline-none focus:border-cyan"
                    />
                  </div>

                  {/* File Upload / Direct URL */}
                  <div className="space-y-2">
                    <label className="text-dim uppercase tracking-wider text-[11px] block">
                      Crest Emblem Image / SVG *
                    </label>

                    <div className="flex items-center gap-3">
                      <label className="border border-cyan/40 bg-cyan/10 hover:bg-cyan/20 px-3 py-1.5 text-cyan uppercase cursor-pointer text-xs transition-colors">
                        {isUploadingAdminCrest ? 'Uploading...' : 'Upload Image / SVG'}
                        <input
                          type="file"
                          accept="image/*,.svg"
                          disabled={isUploadingAdminCrest}
                          onChange={handleAdminCrestFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-dim">Supports SVG, PNG, WEBP</span>
                    </div>

                    <div className="pt-1">
                      <input
                        type="text"
                        required
                        placeholder="Or enter direct image URL / SVG path"
                        value={newCrestImageUrl}
                        onChange={(e) => setNewCrestImageUrl(e.target.value)}
                        className="w-full border border-white/15 bg-surface p-2 text-xs text-ink outline-none focus:border-cyan"
                      />
                    </div>

                    {/* Image Preview */}
                    {newCrestImageUrl && (
                      <div className="mt-2 p-3 border border-white/10 bg-void/60 flex items-center gap-4">
                        <div className="w-14 h-14 rounded border border-white/15 bg-void flex items-center justify-center p-2 shrink-0">
                          <img
                            src={resolveMediaUrl(newCrestImageUrl)}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="text-[11px] text-dim truncate">
                          <span className="text-ink font-bold block">Preview Ready</span>
                          <span className="truncate block">{newCrestImageUrl}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="newCrestActive"
                      checked={newCrestIsActive}
                      onChange={(e) => setNewCrestIsActive(e.target.checked)}
                      className="accent-cyan"
                    />
                    <label htmlFor="newCrestActive" className="text-dim text-xs cursor-pointer">
                      Make available immediately (Active)
                    </label>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateCrestModalOpen(false)}
                      className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploadingAdminCrest || !newCrestName.trim() || !newCrestImageUrl.trim()}
                      className="border border-cyan bg-cyan px-5 py-2 uppercase text-void font-bold hover:brightness-110 disabled:opacity-40 cursor-pointer transition-all"
                    >
                      Create Crest
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </Portal>
        )}

        {/* TAB 3: USERS & ROLES */}
        {tab === 'USERS & ROLES' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Directory & Role Delegation</h2>
                <p className="text-xs text-dim">Filter registered contenders, assign organizer privileges, and delegate administrator access.</p>
              </div>
              <Hud className="text-cyan">{users.length} REGISTERED USERS</Hud>
            </div>

            {/* Role Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'ALL', label: 'All Users', count: users.length },
                  { key: 'PLAYER', label: 'Players', count: users.filter((u) => u.role === 'PLAYER').length },
                  { key: 'ORGANIZER', label: 'Organizers', count: users.filter((u) => u.role === 'ORGANIZER').length },
                  { key: 'SUPER_ADMIN', label: 'Admins', count: users.filter((u) => u.role === 'SUPER_ADMIN').length },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setUserRoleFilter(f.key as any)}
                    className={`border px-3 py-1.5 font-mono text-xs uppercase transition-colors ${
                      userRoleFilter === f.key
                        ? 'border-cyan bg-cyan text-void font-bold'
                        : 'border-white/15 bg-surface text-dim hover:text-ink'
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>

              <div className="w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search user, name, or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full border border-white/15 bg-surface px-3 py-1.5 font-mono text-xs text-ink outline-none focus:border-cyan"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-white/15 bg-graphite">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-surface/50 text-dim">
                    <th className="p-4">USER / EMAIL</th>
                    <th className="p-4">ROLE</th>
                    <th className="p-4">BALANCE</th>
                    <th className="p-4">CREATED</th>
                    <th className="p-4 text-right">DELEGATION ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users
                    .filter((u) => {
                      if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false
                      if (userSearchTerm.trim()) {
                        const q = userSearchTerm.toLowerCase().trim()
                        const n = (u.display_name || u.username || '').toLowerCase()
                        const e = (u.email || '').toLowerCase()
                        return n.includes(q) || e.includes(q)
                      }
                      return true
                    })
                    .map((u) => (
                      <tr key={u.id}>
                        <td className="p-4">
                          <div className="font-bold text-ink">{u.display_name || u.username}</div>
                          <div className="text-dim text-[11px]">{u.email}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 border ${u.role === 'SUPER_ADMIN' ? 'border-magenta text-magenta bg-magenta/10' : u.role === 'ORGANIZER' ? 'border-cyan text-cyan bg-cyan/10' : 'border-white/20 text-dim'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-ink">{inr(Number(u.inr_balance || 0))}</td>
                        <td className="p-4 text-dim">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right space-x-2">
                          {u.role !== 'ORGANIZER' && u.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={async () => {
                                try {
                                  await promoteUserToOrganizer(u.id)
                                  showToast(`${u.display_name || u.username} promoted to ORGANIZER successfully!`)
                                  loadData()
                                } catch (err: any) {
                                  alert(err.message || 'Promotion failed')
                                }
                              }}
                              className="border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-[10px] text-cyan hover:bg-cyan/20 uppercase"
                            >
                              Promote Organizer
                            </button>
                          )}
                          <select
                            value={u.role}
                            onChange={async (e) => {
                              const newR = e.target.value
                              try {
                                await setUserRole(u.id, newR)
                                showToast(`${u.display_name || u.username} role updated to ${newR} successfully!`)
                                loadData()
                              } catch (err: any) {
                                alert(err.message || 'Role change failed')
                              }
                            }}
                            className="border border-white/15 bg-surface p-1 text-[10px] text-ink outline-none"
                          >
                            <option value="PLAYER">PLAYER</option>
                            <option value="ORGANIZER">ORGANIZER</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  {users.filter((u) => {
                    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false
                    if (userSearchTerm.trim()) {
                      const q = userSearchTerm.toLowerCase().trim()
                      return (u.display_name || u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
                    }
                    return true
                  }).length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-dim font-mono">
                        No contenders found matching current role and search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PENDING PAYMENTS */}
        {tab === 'PENDING PAYMENTS' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Pending Payment Reconciliations</h2>
                <p className="text-xs text-dim">Review player UTR deposits and authorize bank ledger deposits.</p>
              </div>
              <Hud className="text-warn">{payments.length} AWAITING APPROVAL</Hud>
            </div>

            {/* Revenue Analytics Dashboard Card */}
            <div className="border border-white/10 bg-graphite p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-cyan animate-pulse" />
                    <Hud className="text-cyan">Tournament Revenue & Registration Analytics</Hud>
                  </div>
                  <h3 className="mt-1 font-display text-2xl font-black uppercase text-ink">
                    Registration Financial Ledger
                  </h3>
                  <p className="text-xs text-dim">
                    Accurate revenue accounting: Distinguishes tournament entry fees from user wallet top-ups to prevent double counting.
                  </p>
                </div>

                {/* Time Range Filter Pills */}
                <div className="flex items-center gap-1.5 bg-void p-1 border border-white/10 font-mono text-[11px] uppercase">
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'this_week', label: 'This Week' },
                    { id: 'last_week', label: 'Last Week' },
                    { id: 'this_month', label: 'This Month' },
                  ].map((tr) => (
                    <button
                      key={tr.id}
                      type="button"
                      onClick={() => handleTimeRangeChange(tr.id)}
                      className={`px-3 py-1 transition-colors cursor-pointer ${
                        revenueTimeRange === tr.id
                          ? 'bg-cyan text-void font-bold shadow'
                          : 'text-dim hover:text-ink'
                      }`}
                    >
                      {tr.label}
                    </button>
                  ))}
                </div>
              </div>

              {loadingRevenue ? (
                <div className="py-8 text-center font-mono text-xs text-dim animate-pulse">
                  Aggregating ledger data and capacity metrics...
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Tile 1: Approved Tournament Revenue */}
                    <div className="border border-ok/30 bg-ok/5 p-4 space-y-1">
                      <Hud className="text-ok">Approved Entry Revenue</Hud>
                      <p className="font-display text-2xl md:text-3xl font-black text-ok tabular-nums">
                        {inr(revenueAnalytics?.approved_tournament_revenue_inr || 0)}
                      </p>
                      <p className="text-[10px] text-dim font-mono">Platform earned tournament fees</p>
                    </div>

                    {/* Tile 2: Pending Verification Volume */}
                    <div className="border border-warn/30 bg-warn/5 p-4 space-y-1">
                      <Hud className="text-warn">Pending Verification</Hud>
                      <p className="font-display text-2xl md:text-3xl font-black text-warn tabular-nums">
                        {inr(revenueAnalytics?.pending_verification_volume_inr || 0)}
                      </p>
                      <p className="text-[10px] text-dim font-mono">Awaiting admin UTR verification</p>
                    </div>

                    {/* Tile 3: Confirmed Registrations */}
                    <div className="border border-white/10 bg-void/50 p-4 space-y-1">
                      <Hud className="text-cyan">Confirmed Squads</Hud>
                      <p className="font-display text-2xl md:text-3xl font-black text-cyan tabular-nums">
                        {revenueAnalytics?.confirmed_registrations ?? 0}
                      </p>
                      <p className="text-[10px] text-dim font-mono">Paid or free verified entries</p>
                    </div>

                    {/* Tile 4: Reserved Seats */}
                    <div className="border border-white/10 bg-void/50 p-4 space-y-1">
                      <Hud className="text-dim">Reserved Seats</Hud>
                      <p className="font-display text-2xl md:text-3xl font-black text-ink tabular-nums">
                        {revenueAnalytics?.reserved_seats ?? 0}
                      </p>
                      <p className="text-[10px] text-dim font-mono">Held pending payment audit</p>
                    </div>

                    {/* Tile 5: Wallet Top-Up Volume (Separated) */}
                    <div className="border border-purple-500/30 bg-purple-950/15 p-4 space-y-1">
                      <Hud className="text-purple-400">Wallet Deposits</Hud>
                      <p className="font-display text-2xl md:text-3xl font-black text-purple-300 tabular-nums">
                        {inr(revenueAnalytics?.wallet_topup_volume_inr || 0)}
                      </p>
                      <p className="text-[10px] text-dim font-mono">User balance · Not direct entry revenue</p>
                    </div>
                  </div>

                  {/* Tournament-by-tournament breakdown table if exists */}
                  {revenueAnalytics?.tournaments && revenueAnalytics.tournaments.length > 0 && (
                    <div className="border border-white/10 bg-void/40 overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead className="border-b border-white/10 bg-void/70 uppercase text-dim text-[10px]">
                          <tr>
                            <th className="p-3">Tournament</th>
                            <th className="p-3">Slots (Max)</th>
                            <th className="p-3">Confirmed</th>
                            <th className="p-3">Available</th>
                            <th className="p-3">Entry Fee</th>
                            <th className="p-3 text-right">Approved Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {revenueAnalytics.tournaments.map((t) => (
                            <tr key={t.id} className="hover:bg-white/5">
                              <td className="p-3 font-display font-bold uppercase text-ink truncate max-w-[220px]">
                                {t.title}
                              </td>
                              <td className="p-3 text-dim">{t.max_teams}</td>
                              <td className="p-3 font-bold text-cyan">{t.confirmed_teams}</td>
                              <td className="p-3 font-bold text-ok">{t.available_slots}</td>
                              <td className="p-3 text-dim">{t.entry_fee_inr ? inr(t.entry_fee_inr) : 'FREE'}</td>
                              <td className="p-3 text-right font-bold text-ok">{inr(t.approved_revenue_inr)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* View Mode Switcher and Payment Summary Bar */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentViewMode('ACTIVE')
                    }}
                    className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                      paymentViewMode === 'ACTIVE'
                        ? 'border-b-2 border-cyan text-cyan font-bold bg-white/5'
                        : 'text-dim hover:text-ink'
                    }`}
                  >
                    Active Pending ({payments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentViewMode('ARCHIVED')
                    }}
                    className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                      paymentViewMode === 'ARCHIVED'
                        ? 'border-b-2 border-cyan text-cyan font-bold bg-white/5'
                        : 'text-dim hover:text-ink'
                    }`}
                  >
                    Archived Records ({archivedPayments.length})
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {isLoadingPayments && (
                    <span className="flex items-center gap-2 font-mono text-xs text-cyan animate-pulse">
                      <span className="size-2 rounded-full bg-cyan animate-ping" />
                      Loading payments...
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={fetchFilteredPayments}
                    className="border border-white/15 bg-surface px-3 py-1.5 font-mono text-xs uppercase text-dim hover:text-ink hover:border-cyan transition-colors cursor-pointer"
                  >
                    ↻ Refresh
                  </button>
                </div>
              </div>

              {/* Authoritative Financial Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="border border-white/10 bg-void/50 p-3 space-y-1">
                  <div className="font-mono text-[10px] uppercase text-dim">Matching Records</div>
                  <div className="font-display text-xl font-bold text-ink tabular-nums">
                    {paymentSummary?.matching_count ?? (paymentViewMode === 'ACTIVE' ? payments.length : archivedPayments.length)}
                  </div>
                  <div className="font-mono text-[9px] text-dim">Total records in filter</div>
                </div>

                <div className="border border-warn/30 bg-warn/5 p-3 space-y-1">
                  <div className="font-mono text-[10px] uppercase text-warn">Pending Volume</div>
                  <div className="font-display text-xl font-bold text-warn tabular-nums">
                    {inr(paymentSummary?.pending_volume_inr ?? 0)}
                  </div>
                  <div className="font-mono text-[9px] text-dim">{paymentSummary?.pending_count ?? 0} transactions</div>
                </div>

                <div className="border border-ok/30 bg-ok/5 p-3 space-y-1">
                  <div className="font-mono text-[10px] uppercase text-ok">Approved Volume</div>
                  <div className="font-display text-xl font-bold text-ok tabular-nums">
                    {inr(paymentSummary?.approved_volume_inr ?? 0)}
                  </div>
                  <div className="font-mono text-[9px] text-dim">{paymentSummary?.approved_count ?? 0} transactions</div>
                </div>

                <div className="border border-live/30 bg-live/5 p-3 space-y-1">
                  <div className="font-mono text-[10px] uppercase text-live">Rejected Volume</div>
                  <div className="font-display text-xl font-bold text-live tabular-nums">
                    {inr(paymentSummary?.rejected_volume_inr ?? 0)}
                  </div>
                  <div className="font-mono text-[9px] text-dim">{paymentSummary?.rejected_count ?? 0} transactions</div>
                </div>

                <div className="border border-cyan/30 bg-cyan/5 p-3 space-y-1 col-span-2 sm:col-span-1">
                  <div className="font-mono text-[10px] uppercase text-cyan">Total Filter Volume</div>
                  <div className="font-display text-xl font-bold text-cyan tabular-nums">
                    {inr(paymentSummary?.total_volume_inr ?? 0)}
                  </div>
                  <div className="font-mono text-[9px] text-dim">Cumulative gross INR</div>
                </div>
              </div>

              {/* Advanced Search & Filtering Controls */}
              <div className="border border-white/10 bg-graphite/40 p-4 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Search Query */}
                  <div className="lg:col-span-2 relative">
                    <label className="block text-[10px] uppercase text-dim mb-1 font-bold">Search Payments</label>
                    <input
                      type="text"
                      placeholder="UTR, user ID, email, name, tournament, team, VPA..."
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      className="w-full border border-white/15 bg-surface px-3 py-2 text-xs font-mono text-cyan placeholder:text-dim outline-none focus:border-cyan"
                    />
                    {paymentSearch && (
                      <button
                        type="button"
                        onClick={() => setPaymentSearch('')}
                        className="absolute right-2.5 top-7 text-xs text-dim hover:text-ink cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-[10px] uppercase text-dim mb-1 font-bold">Status</label>
                    <select
                      value={paymentStatusFilter}
                      onChange={(e) => setPaymentStatusFilter(e.target.value)}
                      className="w-full border border-white/15 bg-surface px-3 py-2 text-xs font-mono text-ink outline-none focus:border-cyan"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">Pending Verification</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  {/* Payment Type Filter */}
                  <div>
                    <label className="block text-[10px] uppercase text-dim mb-1 font-bold">Payment Type</label>
                    <select
                      value={paymentTypeFilter}
                      onChange={(e) => setPaymentTypeFilter(e.target.value)}
                      className="w-full border border-white/15 bg-surface px-3 py-2 text-xs font-mono text-ink outline-none focus:border-cyan"
                    >
                      <option value="ALL">All Types</option>
                      <option value="TOURNAMENT_ENTRY">Tournament Entry</option>
                      <option value="WALLET_TOPUP">Wallet Top-up</option>
                      <option value="GAME_ENTRY">Game Entry</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-[10px] uppercase text-dim mb-1 font-bold">Sort Order</label>
                    <select
                      value={paymentSortBy}
                      onChange={(e) => setPaymentSortBy(e.target.value)}
                      className="w-full border border-white/15 bg-surface px-3 py-2 text-xs font-mono text-ink outline-none focus:border-cyan"
                    >
                      <option value="NEWEST">Newest First</option>
                      <option value="OLDEST">Oldest First</option>
                      <option value="AMOUNT_DESC">Amount: High to Low</option>
                      <option value="AMOUNT_ASC">Amount: Low to High</option>
                      <option value="RECENTLY_PROCESSED">Recently Processed</option>
                      <option value="OLDEST_PENDING">Oldest Pending</option>
                    </select>
                  </div>
                </div>

                {/* Secondary Filters: Date Presets & Amount Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-white/5">
                  {/* Date Range Preset */}
                  <div>
                    <label className="block text-[10px] uppercase text-dim mb-1 font-bold">Date Range</label>
                    <select
                      value={paymentDatePreset}
                      onChange={(e) => setPaymentDatePreset(e.target.value)}
                      className="w-full border border-white/15 bg-surface px-3 py-2 text-xs font-mono text-ink outline-none focus:border-cyan"
                    >
                      <option value="ALL">All Time</option>
                      <option value="TODAY">Today (IST)</option>
                      <option value="YESTERDAY">Yesterday (IST)</option>
                      <option value="LAST_7_DAYS">Last 7 Days</option>
                      <option value="THIS_WEEK">This Week (IST)</option>
                      <option value="LAST_WEEK">Last Week (IST)</option>
                      <option value="THIS_MONTH">This Month (IST)</option>
                      <option value="LAST_MONTH">Last Month (IST)</option>
                      <option value="THIS_YEAR">This Year (IST)</option>
                      <option value="CUSTOM">Custom Date Range</option>
                    </select>
                  </div>

                  {/* Custom Date Pickers (if CUSTOM) */}
                  {paymentDatePreset === 'CUSTOM' ? (
                    <div className="lg:col-span-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase text-dim mb-1 font-bold">From Date</label>
                        <input
                          type="date"
                          value={paymentStartDate}
                          onChange={(e) => setPaymentStartDate(e.target.value)}
                          className="w-full border border-white/15 bg-surface px-2.5 py-1.5 text-xs font-mono text-ink outline-none focus:border-cyan"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-dim mb-1 font-bold">To Date</label>
                        <input
                          type="date"
                          value={paymentEndDate}
                          onChange={(e) => setPaymentEndDate(e.target.value)}
                          className="w-full border border-white/15 bg-surface px-2.5 py-1.5 text-xs font-mono text-ink outline-none focus:border-cyan"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="lg:col-span-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase text-dim mb-1 font-bold">Min Amount (₹)</label>
                        <input
                          type="number"
                          placeholder="Min INR"
                          value={paymentMinAmount}
                          onChange={(e) => setPaymentMinAmount(e.target.value)}
                          className="w-full border border-white/15 bg-surface px-3 py-2 text-xs font-mono text-ink placeholder:text-dim outline-none focus:border-cyan"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-dim mb-1 font-bold">Max Amount (₹)</label>
                        <input
                          type="number"
                          placeholder="Max INR"
                          value={paymentMaxAmount}
                          onChange={(e) => setPaymentMaxAmount(e.target.value)}
                          className="w-full border border-white/15 bg-surface px-3 py-2 text-xs font-mono text-ink placeholder:text-dim outline-none focus:border-cyan"
                        />
                      </div>
                    </div>
                  )}

                  {/* Min / Max when CUSTOM is chosen */}
                  {paymentDatePreset === 'CUSTOM' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase text-dim mb-1 font-bold">Min (₹)</label>
                        <input
                          type="number"
                          placeholder="Min"
                          value={paymentMinAmount}
                          onChange={(e) => setPaymentMinAmount(e.target.value)}
                          className="w-full border border-white/15 bg-surface px-2.5 py-1.5 text-xs font-mono text-ink placeholder:text-dim outline-none focus:border-cyan"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-dim mb-1 font-bold">Max (₹)</label>
                        <input
                          type="number"
                          placeholder="Max"
                          value={paymentMaxAmount}
                          onChange={(e) => setPaymentMaxAmount(e.target.value)}
                          className="w-full border border-white/15 bg-surface px-2.5 py-1.5 text-xs font-mono text-ink placeholder:text-dim outline-none focus:border-cyan"
                        />
                      </div>
                    </div>
                  )}

                  {/* Reset Filters Button */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleResetPaymentFilters}
                      className="w-full border border-white/15 bg-surface hover:bg-white/5 py-2 font-mono text-xs uppercase text-dim hover:text-ink transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Cards List (Active Pending or Archived Records) */}
            {(() => {
              const currentList = paymentViewMode === 'ACTIVE' ? payments : archivedPayments

              if (currentList.length === 0) {
                return (
                  <div className="border border-dashed border-white/15 p-12 text-center font-mono text-xs text-dim space-y-2">
                    <div>
                      {paymentViewMode === 'ACTIVE'
                        ? 'NO PENDING PAYMENTS MATCH CURRENT FILTERS. ALL PLAYER DEPOSITS ARE AUDITED & VERIFIED.'
                        : 'NO ARCHIVED PAYMENT RECORDS MATCH CURRENT FILTERS.'}
                    </div>
                    {(paymentSearch || paymentStatusFilter !== 'ALL' || paymentTypeFilter !== 'ALL' || paymentDatePreset !== 'ALL' || paymentMinAmount || paymentMaxAmount) && (
                      <button
                        type="button"
                        onClick={handleResetPaymentFilters}
                        className="border border-cyan/40 bg-cyan/10 px-3 py-1 font-mono text-xs text-cyan uppercase hover:bg-cyan/20 cursor-pointer"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                )
              }

              return (
                <div className="space-y-4">
                  {currentList.map((p) => {
                    const isArchived = Boolean(p.is_archived || p.status === 'APPROVED' || p.status === 'REJECTED')
                    const isPending = ['PENDING', 'PENDING_VERIFICATION', 'SUBMITTED', 'INITIATED'].includes(p.status)

                    return (
                      <Panel
                        key={p.id}
                        className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 ${
                          p.status === 'APPROVED'
                            ? 'border-l-ok'
                            : p.status === 'REJECTED'
                            ? 'border-l-live'
                            : isPending
                            ? 'border-l-warn'
                            : 'border-l-white/20'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
                          {/* Screenshot Proof Thumbnail */}
                          {(p.proof_url || p.screenshot_url) ? (
                            <div className="shrink-0 flex flex-col items-center gap-1">
                              <img
                                src={resolveMediaUrl(p.proof_url || p.screenshot_url)}
                                alt="Proof thumbnail"
                                onClick={() => setSelectedPaymentDetail(p)}
                                className="size-16 object-cover rounded border border-white/20 hover:border-cyan cursor-pointer transition-colors"
                              />
                              <span className="font-mono text-[9px] text-cyan uppercase font-bold">
                                📸 Proof
                              </span>
                            </div>
                          ) : (
                            <div className="size-16 shrink-0 grid place-items-center border border-dashed border-white/15 bg-void/50 text-[10px] text-dim font-mono text-center p-1">
                              No Proof
                            </div>
                          )}

                          <div className="space-y-1 font-mono text-xs min-w-0 flex-1">
                            {/* Badges Bar */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-ink">Payment #{p.id.slice(0, 8)}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 border font-bold uppercase ${
                                  p.status === 'APPROVED'
                                    ? 'border-ok bg-ok/10 text-ok'
                                    : p.status === 'REJECTED'
                                    ? 'border-live bg-live/10 text-live'
                                    : 'border-warn bg-warn/10 text-warn'
                                }`}
                              >
                                {p.status}
                              </span>

                              {isArchived && (
                                <span className="text-[10px] px-1.5 py-0.5 border border-white/20 text-dim uppercase">
                                  Archived
                                </span>
                              )}

                              {p.payment_type && (
                                <span className="text-[10px] px-1.5 py-0.5 border border-cyan/40 bg-cyan/10 text-cyan uppercase">
                                  {p.payment_type}
                                </span>
                              )}

                              {(p.tournament_title || p.tournament_id) && (
                                <span className="text-[10px] px-1.5 py-0.5 border border-white/20 text-ink uppercase truncate max-w-xs" title={p.tournament_title}>
                                  {p.tournament_title || `Tour #${(p.tournament_id || '').slice(0, 6)}`}
                                </span>
                              )}

                              {p.team_name && (
                                <span className="text-[10px] px-1.5 py-0.5 border border-purple-400/40 bg-purple-950/20 text-purple-300 uppercase truncate max-w-xs">
                                  Team: {p.team_name}
                                </span>
                              )}
                            </div>

                            {/* User & Financial Details */}
                            <div className="text-dim">
                              User: <span className="text-ink font-semibold">{p.user_email || p.user_id}</span>
                              {(p.user_username || p.username || p.user_name) && (
                                <span className="text-dim text-[11px] ml-1">
                                  (@{p.user_username || p.username || p.user_name})
                                </span>
                              )}
                            </div>
                            <div className="text-dim">
                              Amount: <span className="text-ok font-bold text-sm">{inr(p.amount_inr)}</span>
                            </div>
                            <div className="text-dim">
                              UTR Reference: <span className="text-cyan font-bold select-all tracking-wider">{p.utr}</span>
                            </div>
                            <div className="text-dim">
                              Sender VPA: <span className="text-ink">{p.sender_upi_id || 'Not Specified'}</span>
                            </div>

                            {/* Authoritative Timestamps in IST */}
                            <div className="pt-1.5 border-t border-white/5 space-y-0.5 text-[11px]">
                              <div className="text-dim">
                                Submitted:{' '}
                                <span className="text-ink font-mono font-medium">{formatPaymentDateTime(p.created_at)}</span>
                              </div>

                              {p.status === 'APPROVED' && (
                                <div className="text-ok">
                                  Approved:{' '}
                                  <span className="font-mono font-medium">
                                    {formatPaymentDateTime(p.approved_at || p.verified_at)}
                                  </span>
                                  {(p.approved_by || p.verified_by) && (
                                    <span className="text-dim ml-1">by {p.approved_by || p.verified_by}</span>
                                  )}
                                </div>
                              )}

                              {p.status === 'REJECTED' && (
                                <div className="text-live">
                                  Rejected:{' '}
                                  <span className="font-mono font-medium">
                                    {formatPaymentDateTime(p.rejected_at || p.verified_at)}
                                  </span>
                                  {(p.rejected_by || p.verified_by) && (
                                    <span className="text-dim ml-1">by {p.rejected_by || p.verified_by}</span>
                                  )}
                                  {p.rejection_reason && (
                                    <span className="text-dim ml-1 block sm:inline">
                                      · Reason: {p.rejection_reason}
                                    </span>
                                  )}
                                </div>
                              )}

                              {isArchived && p.archived_at && (
                                <div className="text-dim">
                                  Archived Record:{' '}
                                  <span className="text-ink font-mono font-medium">{formatPaymentDateTime(p.archived_at)}</span>
                                  {p.archived_by && <span className="text-dim ml-1">by {p.archived_by}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedPaymentDetail(p)}
                            className="border border-white/20 bg-white/5 px-3 py-2 font-mono text-xs uppercase text-ink hover:border-cyan hover:text-cyan transition-colors cursor-pointer"
                          >
                            View Details
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprovePayment(p.id)}
                                className="border border-ok bg-ok/20 px-4 py-2 font-mono text-xs uppercase text-ok hover:bg-ok/30 font-bold transition-colors cursor-pointer"
                              >
                                Approve & Credit
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectPaymentId(p.id)}
                                className="border border-live bg-live/20 px-4 py-2 font-mono text-xs uppercase text-live hover:bg-live/30 transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {!isArchived && (
                            <button
                              type="button"
                              onClick={() => handleArchivePayment(p.id)}
                              className="border border-white/20 px-3 py-2 font-mono text-xs uppercase text-dim hover:text-warn hover:border-warn transition-colors cursor-pointer"
                            >
                              Archive
                            </button>
                          )}

                          {isArchived && (
                            <button
                              type="button"
                              onClick={() => handleUnarchivePayment(p.id)}
                              className="border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs uppercase text-cyan hover:bg-cyan/20 transition-colors cursor-pointer"
                            >
                              Unarchive / Restore
                            </button>
                          )}
                        </div>
                      </Panel>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

        {/* TAB 5: UPI & QR ACCOUNTS */}
        {tab === 'UPI & QR ACCOUNTS' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Receiving UPI & QR Accounts</h2>
                <p className="text-xs text-dim">Corporate banking handles presented during tournament fee checkout.</p>
              </div>
              <button
                onClick={handleOpenAddUpi}
                className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all cursor-pointer"
              >
                + Add Account
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {upiAccounts.map((a) => (
                <Panel key={a.id} className="p-6 space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="font-bold text-ink">{a.code}</span>
                    <span className={`px-2 py-0.5 border ${a.status === 'ACTIVE' ? 'border-ok text-ok' : 'border-dim text-dim'}`}>
                      {a.status}
                    </span>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="size-24 shrink-0 border border-white/15 bg-white p-1 rounded flex items-center justify-center overflow-hidden">
                      {a.qr_url ? (
                        <img
                          src={resolveMediaUrl(a.qr_url)}
                          alt={`QR for ${a.code}`}
                          className="size-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-gray-500 font-sans text-center">No QR Uploaded</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div>UPI VPA: <span className="text-cyan font-bold break-all">{a.upi_id}</span></div>
                      <div>Payee Name: <span className="text-dim">{a.payee_name}</span></div>
                      {a.display_name && (
                        <div>Label: <span className="text-ink/80">{a.display_name}</span></div>
                      )}
                      <div>Usage Count: <span className="text-dim">{a.payment_count || 0} checkouts</span></div>
                      <div className="pt-2">
                        <label className="inline-block cursor-pointer border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-[10px] uppercase text-cyan hover:bg-cyan/20">
                          {uploadingQrAccId === a.id ? 'Uploading QR...' : a.qr_url ? 'Replace QR Image' : 'Upload QR Image'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingQrAccId === a.id}
                            onChange={async (e) => {
                              const f = e.target.files?.[0]
                              if (!f) return
                              setUploadingQrAccId(a.id)
                              try {
                                await uploadUpiAccountQr(a.id, f)
                                showToast(`QR uploaded for ${a.code}`)
                                loadData()
                              } catch (err: any) {
                                alert(err.message || 'QR upload failed')
                              } finally {
                                setUploadingQrAccId(null)
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditUpi(a)}
                      className="border border-cyan/40 bg-cyan/10 px-3 py-1 text-cyan hover:bg-cyan/20 transition-colors font-bold cursor-pointer"
                    >
                      ✎ Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleUpi(a.id)}
                      className="border border-white/20 px-3 py-1 text-dim hover:text-ink hover:border-cyan transition-colors cursor-pointer"
                    >
                      Toggle Active State
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUpi(a.id, a.code)}
                      className="border border-live/40 bg-live/10 px-3 py-1 text-live hover:bg-live/20 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: PAYOUTS LEDGER */}
        {tab === 'PAYOUTS LEDGER' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Tournament Winnings & Payouts</h2>
                <p className="text-xs text-dim">Track prize disbursement audit trail and certify bank outgoing IMPS UTRs.</p>
              </div>
              <button
                onClick={() => setIsPayoutModalOpen(true)}
                className="border border-ok bg-ok px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all"
              >
                + Issue Prize Payout
              </button>
            </div>

            <div className="overflow-x-auto border border-white/15 bg-graphite">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-surface/50 text-dim">
                    <th className="p-4">WINNER</th>
                    <th className="p-4">AMOUNT</th>
                    <th className="p-4">DESTINATION</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payouts.map((pay) => (
                    <tr key={pay.id}>
                      <td className="p-4">
                        <div className="font-bold text-ink">{pay.user_name || pay.user_id}</div>
                        <div className="text-dim text-[11px]">{pay.game_name || 'Tournament'}</div>
                      </td>
                      <td className="p-4 font-bold text-ok">{inr(pay.amount_inr)}</td>
                      <td className="p-4 text-dim">{pay.destination} {pay.upi_id ? `(${pay.upi_id})` : ''}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 border ${pay.status === 'PAID' ? 'border-ok text-ok' : pay.status === 'PENDING' ? 'border-warn text-warn' : 'border-live text-live'}`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {pay.status === 'PENDING' && (
                          <button
                            onClick={() => setCompletePayoutId(pay.id)}
                            className="border border-ok/50 bg-ok/10 px-3 py-1 font-mono text-xs text-ok hover:bg-ok/20 transition-colors uppercase"
                          >
                            Disburse IMPS
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: SUPPORT TICKETS */}
        {tab === 'SUPPORT TICKETS' && (() => {
          const filteredTickets = tickets.filter((t) => {
            const isTicketArchived = Boolean(
              t.is_archived === true ||
              String(t.is_archived).toLowerCase() === 'true' ||
              t.status === 'ARCHIVED'
            )
            if (supportShowArchived && !isTicketArchived) return false
            if (!supportShowArchived && isTicketArchived) return false
            if (!supportSearchTerm) return true
            const term = supportSearchTerm.toLowerCase()
            return (
              (t.ticket_id || t.id || '').toLowerCase().includes(term) ||
              (t.name || '').toLowerCase().includes(term) ||
              (t.email || '').toLowerCase().includes(term) ||
              (t.category || '').toLowerCase().includes(term) ||
              (t.payment_type || '').toLowerCase().includes(term) ||
              (t.description || '').toLowerCase().includes(term)
            )
          })

          return (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-cyan animate-pulse" />
                  <Hud className="text-cyan">HELPDESK & SUPPORT TICKETS OPERATIONS</Hud>
                </div>
                <h2 className="mt-1 font-display text-3xl font-black uppercase">Support Tickets Desk</h2>
                <p className="text-xs text-dim">Inspect inquiry threads, review category issues, dispatch email replies, and archive closed cases.</p>
              </div>
              <div className="flex items-center gap-3">
                <Hud className="text-dim">{filteredTickets.length} TICKETS DISPLAYED</Hud>
                <button
                  onClick={() => loadSupportTicketsData(supportShowArchived, supportSearchTerm)}
                  className="border border-white/15 bg-surface px-3 py-1 font-mono text-xs uppercase hover:border-cyan text-ink"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* View Mode Switcher and Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* View Mode Buttons */}
                <div className="flex border border-white/10 bg-surface/50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setSupportViewMode('ALL_TICKETS')}
                    className={`px-3 py-1 font-mono text-xs uppercase transition-colors ${
                      supportViewMode === 'ALL_TICKETS'
                        ? 'bg-cyan text-void font-bold shadow'
                        : 'text-dim hover:text-ink'
                    }`}
                  >
                    All Tickets Table ({filteredTickets.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupportViewMode('USER_GROUPS')}
                    className={`px-3 py-1 font-mono text-xs uppercase transition-colors ${
                      supportViewMode === 'USER_GROUPS'
                        ? 'bg-cyan text-void font-bold shadow'
                        : 'text-dim hover:text-ink'
                    }`}
                  >
                    Grouped by Contender ({supportUsers.length})
                  </button>
                </div>

                {/* Status Filter */}
                <button
                  onClick={() => {
                    setSupportShowArchived(false)
                    loadSupportTicketsData(false, supportSearchTerm)
                  }}
                  className={`border px-3 py-1 font-mono text-xs uppercase transition-colors ${
                    !supportShowArchived
                      ? 'border-cyan bg-cyan text-void font-bold'
                      : 'border-white/15 bg-surface text-dim hover:text-ink'
                  }`}
                >
                  Active Tickets ({supportTicketCounts.active})
                </button>
                <button
                  onClick={() => {
                    setSupportShowArchived(true)
                    loadSupportTicketsData(true, supportSearchTerm)
                  }}
                  className={`border px-3 py-1 font-mono text-xs uppercase transition-colors ${
                    supportShowArchived
                      ? 'border-cyan bg-cyan text-void font-bold'
                      : 'border-white/15 bg-surface text-dim hover:text-ink'
                  }`}
                >
                  Archived Tickets ({supportTicketCounts.archived})
                </button>
              </div>

              <div className="w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search user, email, ticket ID, category..."
                  value={supportSearchTerm}
                  onChange={(e) => {
                    const q = e.target.value
                    setSupportSearchTerm(q)
                    loadSupportTicketsData(supportShowArchived, q)
                  }}
                  className="w-full border border-white/15 bg-surface px-3 py-1.5 font-mono text-xs text-ink outline-none focus:border-cyan"
                />
              </div>
            </div>

            {/* TABULAR VIEW OF ALL TICKETS */}
            {supportViewMode === 'ALL_TICKETS' && (
              <div className="overflow-x-auto border border-white/10 bg-surface/40">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-white/10 bg-white/[0.02] text-dim uppercase text-[11px]">
                    <tr>
                      <th className="p-3">Ticket ID</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Payment Type</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Submitted</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-dim font-mono text-xs">
                          NO SUPPORT TICKETS FOUND MATCHING CRITERIA.
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((t) => {
                        const tid = t.ticket_id || t.id
                        const isArchived = Boolean(
                          t.is_archived === true ||
                          String(t.is_archived).toLowerCase() === 'true' ||
                          t.status === 'ARCHIVED'
                        )
                        return (
                          <tr key={tid} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-3 font-bold text-cyan">
                              <div className="flex items-center gap-1.5">
                                <span>[{tid}]</span>
                                {(t.has_new_reply || t.status === 'WAITING_FOR_ADMIN') && (
                                  <span className="bg-amber-400 text-void font-bold text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider animate-pulse">
                                    New Reply
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-ink font-semibold">{t.name || 'Contender'}</td>
                            <td className="p-3 text-dim">{t.email || '—'}</td>
                            <td className="p-3">
                              <span className="border border-white/20 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase text-ink">
                                {t.category}
                              </span>
                            </td>
                            <td className="p-3 text-dim">
                              {t.payment_type && t.payment_type !== 'NOT_APPLICABLE' ? (
                                <span className="text-amber-400 font-semibold">{t.payment_type}</span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="p-3 max-w-xs truncate text-ink/80" title={t.description}>
                              {t.description}
                            </td>
                            <td className="p-3 text-dim whitespace-nowrap">
                              {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <select
                                value={formatTicketStatus(t.status).value}
                                onChange={(e) => handleUpdateTicketStatus(tid, e.target.value)}
                                className={`px-2.5 py-1 border text-[10px] font-bold uppercase rounded-none bg-graphite outline-none cursor-pointer transition-colors ${
                                  formatTicketStatus(t.status).badgeClass
                                }`}
                                title="Change ticket status"
                              >
                                {SUPPORT_TICKET_STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value} className="bg-graphite text-ink">
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3 text-right whitespace-nowrap space-x-1">
                              <button
                                onClick={() => {
                                  setActiveTicketThread(t)
                                  setTicketReplyText('')
                                  setTicketNextStatus('WAITING_FOR_USER')
                                }}
                                className="border border-cyan bg-cyan/15 px-2.5 py-1 text-[11px] text-cyan hover:bg-cyan/30 uppercase"
                              >
                                Thread
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await retrySupportTicketEmail(tid)
                                    showToast(`Confirmation email resent for ticket ${tid}`)
                                  } catch (err: any) {
                                    alert(err.message || 'Retry email failed')
                                  }
                                }}
                                className="border border-white/10 px-2 py-1 text-[11px] text-dim hover:text-ink uppercase"
                                title="Retry Brevo email delivery"
                              >
                                Resend Email
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    if (isArchived) {
                                      await restoreSupportTicket(tid)
                                      showToast(`Ticket ${tid} restored to active queue.`)
                                    } else {
                                      await archiveSupportTicket(tid)
                                      showToast(`Ticket ${tid} archived.`)
                                    }
                                    await loadSupportTicketsData(supportShowArchived, supportSearchTerm)
                                  } catch (err: any) {
                                    alert(err.message || 'Archive operation failed')
                                  }
                                }}
                                className={`border px-2 py-1 text-[11px] uppercase transition-colors ${
                                  isArchived
                                    ? 'border-ok/30 bg-ok/10 text-ok hover:bg-ok/20'
                                    : 'border-white/10 text-dim hover:text-ink hover:border-white/30'
                                }`}
                                title={isArchived ? 'Restore ticket to active desk' : 'Archive closed/resolved ticket'}
                              >
                                {isArchived ? 'Restore' : 'Archive'}
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* User-Centric List */}
            {supportViewMode === 'USER_GROUPS' && (
              supportUsers.length === 0 ? (
                <div className="border border-dashed border-white/15 p-16 text-center font-mono text-xs text-dim">
                  NO USERS WITH SUPPORT TICKETS FOUND MATCHING CRITERIA.
                </div>
              ) : (
                <div className="space-y-4">
                {supportUsers.map((u) => {
                  const isExpanded = expandedSupportUserId === u._id
                  return (
                    <Panel key={u._id} className="p-6 space-y-4 border-l-4 border-l-cyan">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 font-mono">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display font-black uppercase text-ink text-lg">
                              {u.username || u.user_name || u.display_name || (u.email ? u.email.split('@')[0] : 'Contender')}
                            </span>
                            <span className="text-dim text-xs">({u.email || 'No email registered'})</span>
                            {u.open_tickets > 0 && (
                              <span className="border border-warn/40 bg-warn/10 text-warn px-2 py-0.5 text-[10px] font-bold uppercase animate-pulse">
                                {u.open_tickets} Actionable
                              </span>
                            )}
                          </div>
                          <div className="text-dim text-xs flex flex-wrap gap-4">
                            <span>Total Inquiries: <strong className="text-ink">{u.total_tickets}</strong></span>
                            <span>Latest Activity: <strong className="text-cyan">{new Date(u.latest_activity).toLocaleString()}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setExpandedSupportUserId(isExpanded ? null : u._id)}
                            className="border border-white/20 bg-surface px-3.5 py-1.5 font-mono text-xs uppercase text-ink hover:border-cyan transition-colors"
                          >
                            {isExpanded ? '▲ Collapse Inquiries' : `▼ View Inquiries (${u.tickets?.length || 0})`}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Ticket Cards */}
                      {isExpanded && (
                        <div className="pt-4 border-t border-white/10 space-y-3">
                          <Hud className="text-dim">ALL TICKETS FILED BY THIS USER</Hud>
                          <div className="space-y-2">
                            {u.tickets?.map((t: any) => {
                              const msgCount = t.messages?.length || 0
                              const isCurrentlyArchived = Boolean(
                                t.is_archived === true ||
                                String(t.is_archived).toLowerCase() === 'true' ||
                                t.status === 'ARCHIVED'
                              )
                              return (
                                <div
                                  key={t.id || t.ticket_id}
                                  className="border border-white/10 bg-surface/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/25 transition-colors"
                                >
                                  <div className="space-y-1 font-mono text-xs">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-cyan font-bold">[{t.ticket_id || t.id}]</span>
                                      {(t.has_new_reply || t.status === 'WAITING_FOR_ADMIN') && (
                                        <span className="bg-amber-400 text-void font-bold text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider animate-pulse">
                                          New Reply
                                        </span>
                                      )}
                                      <span className="border border-white/20 px-2 py-0.5 text-[10px] uppercase text-dim">
                                        {t.category}
                                      </span>
                                      <select
                                        value={formatTicketStatus(t.status).value}
                                        onChange={(e) => handleUpdateTicketStatus(t.id || t.ticket_id, e.target.value)}
                                        className={`px-2 py-0.5 border text-[10px] font-bold uppercase bg-graphite outline-none cursor-pointer ${
                                          formatTicketStatus(t.status).badgeClass
                                        }`}
                                        title="Change ticket status"
                                      >
                                        {SUPPORT_TICKET_STATUS_OPTIONS.map((opt) => (
                                          <option key={opt.value} value={opt.value} className="bg-graphite text-ink">
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                      <span className="text-dim text-[11px]">{new Date(t.created_at).toLocaleDateString()}</span>
                                      {msgCount > 0 && (
                                        <span className="text-cyan/80 text-[11px]">({msgCount} messages)</span>
                                      )}
                                    </div>
                                    <p className="text-ink/90 text-xs line-clamp-2 mt-1">{t.description}</p>
                                    {t.internal_notes && (
                                      <p className="text-amber-400/80 text-[11px]">Note: {t.internal_notes}</p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={() => {
                                        setActiveTicketThread(t)
                                        setTicketReplyText('')
                                        setTicketNextStatus('WAITING_FOR_USER')
                                      }}
                                      className="border border-cyan bg-cyan/15 px-3 py-1.5 font-mono text-xs uppercase text-cyan hover:bg-cyan/30"
                                    >
                                      Open Conversation Thread
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const tid = t.id || t.ticket_id
                                        try {
                                          if (isCurrentlyArchived) {
                                            await restoreSupportTicket(tid)
                                            showToast(`Ticket ${tid} restored to active queue.`)
                                          } else {
                                            await archiveSupportTicket(tid)
                                            showToast(`Ticket ${tid} archived.`)
                                          }
                                          await loadSupportTicketsData(supportShowArchived, supportSearchTerm)
                                        } catch (err: any) {
                                          alert(err.message || 'Archive operation failed')
                                        }
                                      }}
                                      className={`border px-2.5 py-1.5 font-mono text-xs uppercase transition-colors ${
                                        isCurrentlyArchived
                                          ? 'border-ok/30 bg-ok/10 text-ok hover:bg-ok/20'
                                          : 'border-white/10 text-dim hover:text-ink hover:border-white/30'
                                      }`}
                                    >
                                      {isCurrentlyArchived ? 'Restore' : 'Archive'}
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </Panel>
                  )
                })}
              </div>
            ))}
          </div>
        )
      })()}

        {/* TAB 8: RULES & REGULATIONS */}
        {tab === 'RULES & REGULATIONS' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Esports Rulebook & Sanctions</h2>
                <p className="text-xs text-dim">Define tournament rule chapters, anti-cheat terms, and official match protocols.</p>
              </div>
              <button
                onClick={() => setIsNewRegOpen(true)}
                className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all"
              >
                + Add Rule Chapter
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {regulations.map((r) => (
                <Panel key={r.id} className="p-6 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="font-mono text-xs text-cyan font-bold">{r.chapter_code}</span>
                    <button onClick={() => handleDeleteReg(r.id)} className="text-live text-xs hover:underline uppercase">Delete</button>
                  </div>
                  <h3 className="font-display text-xl font-black uppercase">{r.title}</h3>
                  <div className="font-mono text-xs text-dim">Game: {r.game_name} · Format: {r.format}</div>
                  <ul className="list-disc pl-4 space-y-1 font-mono text-xs text-ink/75">
                    {r.rules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </Panel>
              ))}
            </div>
          </div>
        )}

        {/* TAB: EMAIL COMMUNICATIONS */}
        {tab === 'EMAIL COMMUNICATIONS' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Email Communications Engine</h2>
                <p className="text-xs text-dim">Super Admin correspondence cockpit: dispatch individual messages to contenders, bulk notifications to active team rosters, or broadcast platform updates.</p>
              </div>
              <button
                onClick={() => setIsOfficialMailOpen(true)}
                className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-all shrink-0"
              >
                + Broadcast Platform Email
              </button>
            </div>

            {/* Sub-Navigation for Email Communications */}
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
              <button
                onClick={() => setEmailSubTab('PERSONAL')}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                  emailSubTab === 'PERSONAL'
                    ? 'border-b-2 border-cyan bg-cyan/10 text-cyan font-bold'
                    : 'text-dim hover:text-ink'
                }`}
              >
                Personal Email (Admin → User)
              </button>
              <button
                onClick={() => setEmailSubTab('TEAM')}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                  emailSubTab === 'TEAM'
                    ? 'border-b-2 border-cyan bg-cyan/10 text-cyan font-bold'
                    : 'text-dim hover:text-ink'
                }`}
              >
                Team Email (Admin → Active Roster)
              </button>
              <button
                onClick={() => setEmailSubTab('SYSTEM')}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                  emailSubTab === 'SYSTEM'
                    ? 'border-b-2 border-cyan bg-cyan/10 text-cyan font-bold'
                    : 'text-dim hover:text-ink'
                }`}
              >
                Automated & System Emails
              </button>
            </div>

            {/* SUB-PANEL 1: PERSONAL EMAIL (ADMIN -> USER) */}
            {emailSubTab === 'PERSONAL' && (
              <Panel className="p-6 space-y-4 border-l-4 border-l-cyan max-w-4xl">
                <Hud className="text-cyan">DIRECT CORRESPONDENCE COMPOSER</Hud>
                <h3 className="font-display text-2xl font-black uppercase">Send Personal Email</h3>
                <p className="text-xs text-dim">Send an official, authenticated direct email to a specific registered user, organizer, or external contact via Brevo SMTP relay.</p>

                <div className="space-y-4 font-mono text-xs mt-4">
                  {/* Recipient Destination Mode */}
                  <div>
                    <label className="text-dim uppercase text-[11px] tracking-wider">Recipient Destination</label>
                    <div className="mt-1.5 flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-ink">
                        <input
                          type="radio"
                          name="pEmailMode"
                          checked={personalEmailMode === 'USER'}
                          onChange={() => setPersonalEmailMode('USER')}
                        />
                        <span>Registered User / Organizer</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-ink">
                        <input
                          type="radio"
                          name="pEmailMode"
                          checked={personalEmailMode === 'CUSTOM'}
                          onChange={() => setPersonalEmailMode('CUSTOM')}
                        />
                        <span>Custom Email Address</span>
                      </label>
                    </div>
                  </div>

                  {personalEmailMode === 'USER' ? (
                    <div>
                      <label className="text-dim uppercase text-[11px] tracking-wider">Select Registered Contender</label>
                      <select
                        value={selectedRecipientUserId}
                        onChange={(e) => setSelectedRecipientUserId(e.target.value)}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                      >
                        <option value="">-- Choose a user or organizer ({users.length} available) --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            [{u.role}] {u.display_name || u.username} — {u.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-dim uppercase text-[11px] tracking-wider">Custom Destination Email</label>
                      <input
                        type="email"
                        placeholder="contender@example.com"
                        value={personalEmailCustomTo}
                        onChange={(e) => setPersonalEmailCustomTo(e.target.value)}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-dim uppercase text-[11px] tracking-wider">Sender Identity</label>
                      <select
                        value={personalEmailSender}
                        onChange={(e) => setPersonalEmailSender(e.target.value as any)}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-cyan font-bold outline-none focus:border-cyan uppercase"
                      >
                        <option value="official">Official (official@ametheus.games)</option>
                        <option value="support">Support (support@ametheus.games)</option>
                        <option value="noreply">Automated (noreply@ametheus.games)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-dim uppercase text-[11px] tracking-wider">Subject Line</label>
                      <input
                        type="text"
                        placeholder="Important update regarding..."
                        value={personalEmailSubject}
                        onChange={(e) => setPersonalEmailSubject(e.target.value)}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-dim uppercase text-[11px] tracking-wider">Message Body</label>
                    <textarea
                      rows={6}
                      placeholder="Compose message text to contender..."
                      value={personalEmailMessage}
                      onChange={(e) => setPersonalEmailMessage(e.target.value)}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>

                  <button
                    disabled={isSendingPersonalEmail || (!personalEmailSubject.trim()) || (!personalEmailMessage.trim())}
                    onClick={async () => {
                      let destEmail = ''
                      let destName = 'Contender'
                      if (personalEmailMode === 'USER') {
                        const targetUser = users.find((u) => u.id === selectedRecipientUserId)
                        if (!targetUser || !targetUser.email) {
                          alert('Please select a registered contender with a valid email address.')
                          return
                        }
                        destEmail = targetUser.email
                        destName = targetUser.display_name || targetUser.username
                      } else {
                        destEmail = personalEmailCustomTo.trim()
                        if (!destEmail) {
                          alert('Please enter a valid destination email address.')
                          return
                        }
                      }

                      setIsSendingPersonalEmail(true)
                      setPersonalEmailResult(null)
                      try {
                        const res = await sendPersonalEmailAdmin({
                          recipient_email: destEmail,
                          recipient_name: destName,
                          sender_identity: personalEmailSender,
                          subject: personalEmailSubject.trim(),
                          message: personalEmailMessage.trim(),
                        })
                        setPersonalEmailResult(res)
                        if (res.success) {
                          showToast(`Email delivered successfully to ${destEmail}!`)
                          setPersonalEmailSubject('')
                          setPersonalEmailMessage('')
                        } else {
                          alert(`Brevo SMTP relay returned error: ${res.error_detail || res.error_code || 'Delivery failed'}`)
                        }
                      } catch (err: any) {
                        setPersonalEmailResult({
                          success: false,
                          error_code: 'CLIENT_ERROR',
                          error_detail: err.message || 'Failed to dispatch email request',
                        })
                        alert(err.message || 'Email dispatch failed')
                      } finally {
                        setIsSendingPersonalEmail(false)
                      }
                    }}
                    className="border border-cyan bg-cyan px-5 py-2.5 uppercase text-void font-bold hover:brightness-110 disabled:opacity-40 transition-all font-mono text-xs"
                  >
                    {isSendingPersonalEmail ? 'Dispatching via Brevo...' : 'Dispatch Personal Email'}
                  </button>

                  {/* Real-time Brevo Delivery Status Feedback */}
                  {personalEmailResult && (
                    <div className={`mt-3 p-4 border font-mono text-[11px] ${
                      personalEmailResult.success
                        ? 'border-ok/40 bg-ok/10 text-ok'
                        : 'border-live/40 bg-live/10 text-live'
                    }`}>
                      <div className="font-bold uppercase tracking-wider">
                        {personalEmailResult.success ? '✓ Delivered via Brevo SMTP' : '✕ Brevo Relay Delivery Failure'}
                      </div>
                      {personalEmailResult.success ? (
                        <div className="mt-2 space-y-1 text-[10px] text-ink/80">
                          <div>Recipient: <strong className="text-ink">{personalEmailResult.recipient}</strong></div>
                          <div>Sender Identity: <span className="text-cyan">{personalEmailResult.sender}</span></div>
                          {personalEmailResult.message_id && <div>Message-ID: <span className="font-mono">{personalEmailResult.message_id}</span></div>}
                          <div>Dispatched at: {personalEmailResult.timestamp}</div>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1 text-[10px]">
                          <div>Error Code: <strong>{personalEmailResult.error_code || 'UNKNOWN'}</strong></div>
                          <div>Details: {personalEmailResult.error_detail || 'No diagnostic message returned.'}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Panel>
            )}

            {/* SUB-PANEL 2: TEAM EMAIL (ADMIN -> ACTIVE ROSTER MEMBERS) */}
            {emailSubTab === 'TEAM' && (
              <Panel className="p-6 space-y-4 border-l-4 border-l-ok max-w-4xl">
                <Hud className="text-ok">TEAM ROSTER BROADCAST COMPOSER</Hud>
                <h3 className="font-display text-2xl font-black uppercase">Send Team Roster Email</h3>
                <p className="text-xs text-dim">
                  Select an active squad from the database. A single official dispatch will automatically be delivered via Brevo SMTP to all active members (Captain, primary roster, and substitutes).
                </p>

                <div className="space-y-4 font-mono text-xs mt-4">
                  {/* Team Selection */}
                  <div>
                    <label className="text-dim uppercase text-[11px] tracking-wider">Target Team Squad</label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    >
                      <option value="">-- Choose an active team ({teamsList.length} registered) --</option>
                      {teamsList.map((tm) => (
                        <option key={tm.id} value={tm.id}>
                          {tm.name} [{tm.tag}] · {tm.game_slug?.toUpperCase()} · Captain: {tm.captain_username || 'Captain'} · {tm.members?.length || 0} member(s)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Team Roster Preview */}
                  {selectedTeamId && (() => {
                    const selTeam = teamsList.find((tm) => tm.id === selectedTeamId)
                    if (!selTeam) return null
                    const allRoster = [...(selTeam.members || []), ...(selTeam.substitutes || [])]
                    return (
                      <div className="border border-white/10 bg-graphite/60 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-ink uppercase text-sm">{selTeam.name} [{selTeam.tag}]</span>
                          <span className="border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-[10px] text-cyan font-bold uppercase">
                            {selTeam.game_slug}
                          </span>
                        </div>
                        <div className="text-[11px] text-dim">
                          Captain: <strong className="text-ink">{selTeam.captain_username}</strong>
                        </div>
                        <div className="border-t border-white/5 pt-2">
                          <div className="text-[10px] text-dim uppercase tracking-wider mb-1.5">
                            Roster Recipients ({allRoster.length} member{allRoster.length !== 1 ? 's' : ''}):
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {allRoster.map((m: any, idx: number) => (
                              <span key={m.id || idx} className="border border-white/15 bg-surface px-2 py-0.5 text-[10px] text-ink flex items-center gap-1">
                                <span className={m.role === 'CAPTAIN' ? 'text-amber-400 font-bold' : 'text-dim'}>[{m.role || 'MEMBER'}]</span>
                                {m.username}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  <div>
                    <label className="text-dim uppercase text-[11px] tracking-wider">Subject Line</label>
                    <input
                      type="text"
                      placeholder="Official Notice to Team..."
                      value={teamEmailSubject}
                      onChange={(e) => setTeamEmailSubject(e.target.value)}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <label className="text-dim uppercase text-[11px] tracking-wider">Message Body</label>
                    <textarea
                      rows={6}
                      placeholder="Enter official directives, schedule updates, or match requirements for this team..."
                      value={teamEmailMessage}
                      onChange={(e) => setTeamEmailMessage(e.target.value)}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>

                  <button
                    disabled={isSendingTeamEmail || (!selectedTeamId) || (!teamEmailSubject.trim()) || (!teamEmailMessage.trim())}
                    onClick={handleSendTeamEmail}
                    className="border border-ok bg-ok px-5 py-2.5 uppercase text-void font-bold hover:brightness-110 disabled:opacity-40 transition-all font-mono text-xs"
                  >
                    {isSendingTeamEmail ? 'Broadcasting to Roster...' : 'Dispatch Team Email to All Members'}
                  </button>

                  {/* Team Email Delivery Feedback */}
                  {teamEmailResult && (
                    <div className={`mt-3 p-4 border font-mono text-[11px] ${
                      teamEmailResult.success !== false
                        ? 'border-ok/40 bg-ok/10 text-ok'
                        : 'border-live/40 bg-live/10 text-live'
                    }`}>
                      <div className="font-bold uppercase tracking-wider">
                        {teamEmailResult.success !== false ? '✓ Dispatched to Team Roster' : '✕ Team Dispatch Failure'}
                      </div>
                      <div className="mt-1 text-[10px] text-ink/80">
                        {teamEmailResult.message || teamEmailResult.error_detail || 'Official broadcast request processed.'}
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            )}

            {/* SUB-PANEL 3: AUTOMATED & SYSTEM EMAILS */}
            {emailSubTab === 'SYSTEM' && (
              <div className="space-y-6 max-w-4xl">
                <Panel className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <Hud className="text-cyan">SYSTEM RELAY INFRASTRUCTURE</Hud>
                      <h3 className="font-display text-2xl font-black uppercase">Platform Mail Identities</h3>
                    </div>
                    <button
                      onClick={() => setIsOfficialMailOpen(true)}
                      className="border border-cyan bg-cyan/15 px-3 py-1.5 font-mono text-xs uppercase text-cyan hover:bg-cyan/30"
                    >
                      + Broadcast Email
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 font-mono text-xs">
                    <div className="border border-white/10 bg-graphite/40 p-3 space-y-1">
                      <div className="text-dim text-[10px] uppercase">Support Mail Relay</div>
                      <div className="text-ok font-bold">{emailStatus?.services.support.status || 'Configured'}</div>
                      <div className="text-ink text-[11px] truncate">{emailStatus?.services.support.email || 'support@ametheus.games'}</div>
                      <div className="text-[9px] text-dim pt-1">Ticketing receipts & user support responses</div>
                    </div>
                    <div className="border border-white/10 bg-graphite/40 p-3 space-y-1">
                      <div className="text-dim text-[10px] uppercase">Automated Noreply</div>
                      <div className="text-ok font-bold">{emailStatus?.services.noreply.status || 'Configured'}</div>
                      <div className="text-ink text-[11px] truncate">{emailStatus?.services.noreply.email || 'noreply@ametheus.games'}</div>
                      <div className="text-[9px] text-dim pt-1">Password resets & transactional notifications</div>
                    </div>
                    <div className="border border-white/10 bg-graphite/40 p-3 space-y-1">
                      <div className="text-dim text-[10px] uppercase">Official Dispatch</div>
                      <div className="text-ok font-bold">{emailStatus?.services.official.status || 'Configured'}</div>
                      <div className="text-ink text-[11px] truncate">{emailStatus?.services.official.email || 'official@ametheus.games'}</div>
                      <div className="text-[9px] text-dim pt-1">Platform announcements & competitive directives</div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between font-mono text-xs text-dim">
                    <span>SMTP Relay Host: <strong className="text-ink">{emailStatus?.services.official.smtp_host || 'smtp-relay.brevo.com:587'}</strong></span>
                    <span className="text-ok">✓ TLS 1.3 Active</span>
                  </div>
                </Panel>

                {/* Official Broadcast Logs / History */}
                <Panel className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <Hud className="text-dim">TRANSACTION AUDIT</Hud>
                      <h3 className="font-display text-2xl font-black uppercase">Official Broadcast History</h3>
                    </div>
                    <span className="font-mono text-xs text-dim">{officialHistory.length} BROADCASTS</span>
                  </div>

                  {officialHistory.length === 0 ? (
                    <div className="border border-dashed border-white/15 p-8 text-center font-mono text-xs text-dim">
                      NO BROADCAST HISTORY LOGGED IN SYSTEM YET.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-white/10 bg-graphite">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-surface/50 text-dim">
                            <th className="p-3">RECIPIENTS</th>
                            <th className="p-3">SUBJECT</th>
                            <th className="p-3">STATUS</th>
                            <th className="p-3">DISPATCHED AT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {officialHistory.map((item, idx) => (
                            <tr key={item.id || idx}>
                              <td className="p-3">
                                <span className="border border-cyan/30 bg-cyan/10 px-1.5 py-0.5 text-[10px] text-cyan font-bold">
                                  {item.recipient_type} ({item.recipient_count})
                                </span>
                              </td>
                              <td className="p-3 text-ink font-bold">{item.subject}</td>
                              <td className="p-3 text-ok font-bold">{item.status}</td>
                              <td className="p-3 text-dim">{item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              </div>
            )}
          </div>
        )}

        {/* TAB: NOTIFICATION CMS */}
        {tab === 'NOTIFICATION CMS' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Platform Notification CMS</h2>
                <p className="text-xs text-dim">Dispatch targeted or platform-wide user notifications and monitor in-app delivery history.</p>
              </div>
              <Hud className="text-cyan">{platformNotifTotal} DISPATCHED</Hud>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Compose & Dispatch Panel */}
              <Panel className="p-6 space-y-4 font-mono text-xs border-cyan/30">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="font-display text-xl font-bold uppercase text-ink">Compose In-App Notification</h3>
                  <p className="text-[11px] text-dim mt-0.5">Dispatches real-time bell notifications to player platform accounts.</p>
                </div>

                <form onSubmit={handleSendPlatformNotification} className="space-y-3">
                  <div>
                    <label className="block text-dim text-[10px] uppercase mb-1">Target Audience</label>
                    <select
                      value={newNotifAudience}
                      onChange={(e) => setNewNotifAudience(e.target.value as any)}
                      className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none"
                    >
                      <option value="ALL_USERS">All Platform Users (Broadcast)</option>
                      <option value="SELECTED_USERS">Specific User IDs</option>
                    </select>
                  </div>

                  {newNotifAudience === 'SELECTED_USERS' && (
                    <div>
                      <label className="block text-dim text-[10px] uppercase mb-1">Target User IDs (comma-separated)</label>
                      <input
                        required
                        placeholder="user_123, user_456, ..."
                        value={newNotifUserIds}
                        onChange={(e) => setNewNotifUserIds(e.target.value)}
                        className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-dim text-[10px] uppercase mb-1">Notification Category</label>
                    <select
                      value={newNotifType}
                      onChange={(e) => setNewNotifType(e.target.value)}
                      className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none"
                    >
                      <option value="SYSTEM">System Announcement</option>
                      <option value="TEAM">Team & Squad</option>
                      <option value="WALLET">Wallet & Payment</option>
                      <option value="REGISTRATION">Registration</option>
                      <option value="BATCHES">Batches & Broadcast</option>
                      <option value="TOURNAMENT">Tournament Alert</option>
                      <option value="MATCH">Match Schedule</option>
                      <option value="SUPPORT">Customer Support</option>
                      <option value="GENERAL">General Notice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-dim text-[10px] uppercase mb-1">Headline / Title</label>
                    <input
                      required
                      placeholder="e.g. Ascent Championship Bracket Revealed"
                      value={newNotifTitle}
                      onChange={(e) => setNewNotifTitle(e.target.value)}
                      className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <label className="block text-dim text-[10px] uppercase mb-1">Call-to-Action Link (Optional)</label>
                    <input
                      placeholder="/tournaments or /games or /profile"
                      value={newNotifLink}
                      onChange={(e) => setNewNotifLink(e.target.value)}
                      className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <label className="block text-dim text-[10px] uppercase mb-1">Notification Message</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Compose notification text..."
                      value={newNotifMessage}
                      onChange={(e) => setNewNotifMessage(e.target.value)}
                      className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isDispatchingNotif}
                    className="w-full border border-cyan bg-cyan px-4 py-2.5 uppercase text-void font-bold hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isDispatchingNotif ? 'Dispatching...' : 'Dispatch Notification'}
                  </button>
                </form>
              </Panel>

              {/* Notification History Feed */}
              <div className="lg:col-span-2 space-y-4">
                <Panel className="p-6 font-mono text-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div>
                      <h3 className="font-display text-xl font-bold uppercase text-ink">Dispatched Notifications History</h3>
                      {platformNotifSelectedUserId && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-cyan">
                            Filtered by User: {(() => {
                              const match = users.find((u) => u.id === platformNotifSelectedUserId || u.clerk_user_id === platformNotifSelectedUserId || (u as any)._id === platformNotifSelectedUserId)
                              return match ? `${match.username || match.display_name} (${match.email || match.id})` : platformNotifSelectedUserId
                            })()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPlatformNotifSelectedUserId('')
                              fetchPlatformNotifications('')
                            }}
                            className="text-[10px] text-dim hover:text-warn uppercase underline cursor-pointer"
                          >
                            Clear Filter
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Compact User Selector */}
                      <select
                        value={platformNotifSelectedUserId}
                        onChange={(e) => {
                          const uid = e.target.value
                          setPlatformNotifSelectedUserId(uid)
                          fetchPlatformNotifications(uid)
                        }}
                        className="border border-white/15 bg-surface p-1.5 text-ink outline-none text-[11px] max-w-[200px]"
                        title="Filter history by user"
                      >
                        <option value="">All Users (Global History)</option>
                        {users.map((u) => {
                          const uid = u.id || u.clerk_user_id || (u as any)._id
                          const name = u.username || u.display_name || u.email || uid
                          return (
                            <option key={uid} value={uid}>
                              {name} {u.email ? `(${u.email})` : ''}
                            </option>
                          )
                        })}
                      </select>

                      <select
                        value={platformNotifFilterType}
                        onChange={(e) => {
                          setPlatformNotifFilterType(e.target.value)
                        }}
                        className="border border-white/15 bg-surface p-1.5 text-ink outline-none text-[11px]"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="SYSTEM">System</option>
                        <option value="TEAM">Team</option>
                        <option value="WALLET">Wallet</option>
                        <option value="REGISTRATION">Registration</option>
                        <option value="BATCHES">Batches</option>
                        <option value="TOURNAMENT">Tournament</option>
                        <option value="MATCH">Match</option>
                        <option value="SUPPORT">Support</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => fetchPlatformNotifications()}
                        className="border border-white/20 px-2.5 py-1.5 text-[11px] uppercase hover:text-cyan hover:border-cyan transition-colors"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {platformNotifications.length === 0 ? (
                    <div className="border border-dashed border-white/15 p-8 text-center text-dim">
                      {platformNotifSelectedUserId
                        ? 'NO NOTIFICATIONS RECORDED FOR THE SELECTED USER.'
                        : 'NO PLATFORM NOTIFICATIONS RECORDED YET.'}
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {platformNotifications
                        .filter((n) => {
                          if (platformNotifFilterType === 'ALL') return true
                          const nCat = (n.category || n.type || '').toUpperCase()
                          if (platformNotifFilterType === 'WALLET') return nCat === 'WALLET' || nCat === 'PAYMENT'
                          if (platformNotifFilterType === 'BATCHES') return nCat === 'BATCHES' || nCat === 'BATCH'
                          return nCat === platformNotifFilterType
                        })
                        .map((n) => (
                          <div key={n.id} className="p-3 bg-surface/60 border border-white/10 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="border border-cyan/40 bg-cyan/10 px-1.5 py-0.5 text-[10px] text-cyan font-bold">
                                  {n.category || n.type}
                                </span>
                                <span className="font-bold text-ink">{n.title}</span>
                              </div>
                              <span className="text-[10px] text-dim">{formatAuditTimestamp(n.created_at)}</span>
                            </div>
                            <p className="text-dim text-[11px] leading-relaxed">{n.message}</p>
                            <div className="flex items-center justify-between text-[10px] text-dim pt-1 border-t border-white/5">
                              <span>
                                Recipient:{' '}
                                {n.user_id ? (() => {
                                  const u = users.find((usr) => usr.id === n.user_id || usr.clerk_user_id === n.user_id || (usr as any)._id === n.user_id)
                                  return u ? (
                                    <span className="text-ink font-semibold">
                                      {u.username || u.display_name} <span className="text-dim">({u.email || n.user_id})</span>
                                    </span>
                                  ) : (
                                    `User #${n.user_id.slice(0, 8)}`
                                  )
                                })() : (
                                  'Broadcast (All Users)'
                                )}
                              </span>
                              {n.link && <span className="text-cyan">Link: {n.link}</span>}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </Panel>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DISPUTES & QUEUE */}
        {tab === 'DISPUTES & QUEUE' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Disputes & Match Verification Queue</h2>
                <p className="text-xs text-dim">Arbitrate match results with contested evidence submissions.</p>
              </div>
              <Hud className="text-live">{disputes.length} DISPUTES</Hud>
            </div>

            {disputes.length === 0 ? (
              <div className="border border-dashed border-white/15 p-12 text-center font-mono text-xs text-dim">
                ALL MATCH RESULTS ARE FULLY CERTIFIED. NO ACTIVE DISPUTES IN QUEUE.
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((d, i) => (
                  <Panel key={d.id || i} className="p-6 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-ink">{d.title || `Dispute #${i + 1}`}</p>
                      <p className="font-mono text-xs text-dim">{d.reason || 'Evidence mismatch'}</p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await resolveDispute(d.id, { resolution: 'RESOLVED_BY_ADMIN' })
                          showToast('Dispute resolved!')
                          loadData()
                        } catch (err: any) {
                          alert(err.message || 'Resolution failed')
                        }
                      }}
                      className="border border-ok/50 bg-ok/10 px-3 py-1 font-mono text-xs text-ok hover:bg-ok/20 transition-colors uppercase"
                    >
                      Resolve Dispute
                    </button>
                  </Panel>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: AUDIT LOGS */}
        {tab === 'AUDIT LOGS' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">System Audit Trails</h2>
                <p className="text-xs text-dim">Immutable operational logs tracking administrative and financial mutations.</p>
              </div>
              <Hud className="text-dim">{auditTotal} TOTAL RECORDS</Hud>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-graphite p-4 border border-white/15 font-mono text-xs">
              <div>
                <label className="block text-dim text-[10px] uppercase mb-1">Search Keywords / Target / Operator</label>
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchAuditLogs(1)
                  }}
                  className="w-full border border-white/15 bg-surface p-2 text-ink outline-none focus:border-cyan"
                />
              </div>

              <div>
                <label className="block text-dim text-[10px] uppercase mb-1">Filter by Action</label>
                <select
                  value={auditAction}
                  onChange={(e) => {
                    setAuditAction(e.target.value)
                  }}
                  className="w-full border border-white/15 bg-surface p-2 text-ink outline-none focus:border-cyan"
                >
                  <option value="ALL">All Actions</option>
                  <option value="ROLE">Role / Permissions</option>
                  <option value="PAYMENT">Payments & UTR</option>
                  <option value="TOURNAMENT">Tournaments</option>
                  <option value="UPI">UPI Accounts</option>
                  <option value="NOTIFICATION">Notifications</option>
                  <option value="EMAIL">Email Dispatch</option>
                </select>
              </div>

              <div>
                <label className="block text-dim text-[10px] uppercase mb-1">Time Horizon</label>
                <select
                  value={auditDateRange}
                  onChange={(e) => {
                    setAuditDateRange(e.target.value)
                  }}
                  className="w-full border border-white/15 bg-surface p-2 text-ink outline-none focus:border-cyan"
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="YESTERDAY">Yesterday</option>
                  <option value="7_DAYS">Last 7 Days</option>
                  <option value="30_DAYS">Last 30 Days</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => fetchAuditLogs(1)}
                  disabled={isLoadingLogs}
                  className="flex-1 border border-cyan bg-cyan/20 p-2 text-cyan uppercase font-bold hover:bg-cyan/30 disabled:opacity-50 transition-colors"
                >
                  {isLoadingLogs ? 'Filtering...' : 'Apply Filters'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuditSearch('')
                    setAuditAction('ALL')
                    setAuditDateRange('ALL')
                    setIsLoadingLogs(true)
                    getAuditLogs({ limit: auditLimit, skip: 0 })
                      .then((data) => {
                        setLogs(data)
                        setAuditPage(1)
                      })
                      .finally(() => setIsLoadingLogs(false))
                    getAuditLogsCount().then((r) => setAuditTotal(r.total))
                  }}
                  className="border border-white/20 p-2 text-dim uppercase hover:text-ink transition-colors"
                  title="Reset Filters"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="overflow-x-auto border border-white/15 bg-graphite">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-surface/50 text-dim">
                    <th className="p-4">OPERATOR</th>
                    <th className="p-4">ACTION</th>
                    <th className="p-4">TARGET</th>
                    <th className="p-4">DETAILS</th>
                    <th className="p-4">TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-dim font-mono">
                        {isLoadingLogs ? 'Loading audit records...' : 'No audit records match the current filter criteria.'}
                      </td>
                    </tr>
                  ) : (
                    logs.map((l) => (
                      <tr key={l.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-bold text-ink">{l.operator}</td>
                        <td className="p-4 text-cyan">{l.action}</td>
                        <td className="p-4 text-dim">{l.target}</td>
                        <td className="p-4 text-dim max-w-xs truncate">
                          {l.details ? (
                            typeof l.details === 'object' ? (
                              <span title={JSON.stringify(l.details, null, 2)} className="cursor-help text-ink/70">
                                {Object.entries(l.details)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(', ')}
                              </span>
                            ) : (
                              String(l.details)
                            )
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-4 text-dim whitespace-nowrap">{formatAuditTimestamp(l.created_at || l.timestamp)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4 font-mono text-xs text-dim">
              <div>
                Showing page {auditPage} of {Math.max(1, Math.ceil(auditTotal / auditLimit))} ({auditTotal} total records)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={auditPage <= 1 || isLoadingLogs}
                  onClick={() => fetchAuditLogs(auditPage - 1)}
                  className="border border-white/20 px-3 py-1.5 uppercase hover:text-ink hover:border-cyan disabled:opacity-40 transition-colors"
                >
                  ← Previous
                </button>
                <span className="px-2 font-bold text-ink">{auditPage}</span>
                <button
                  type="button"
                  disabled={auditPage >= Math.ceil(auditTotal / auditLimit) || isLoadingLogs}
                  onClick={() => fetchAuditLogs(auditPage + 1)}
                  className="border border-white/20 px-3 py-1.5 uppercase hover:text-ink hover:border-cyan disabled:opacity-40 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SMTP RELAY DIAGNOSTICS (DIAGNOSTIC ONLY) */}
        {tab === 'SMTP RELAY DIAGNOSTICS' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-3xl font-black uppercase">SMTP Relay Diagnostics</h2>
                  <span className="border border-warn bg-warn/15 px-2 py-0.5 font-mono text-[10px] uppercase text-warn font-bold tracking-wider">
                    DIAGNOSTIC / RELAY TEST TOOL ONLY
                  </span>
                </div>
                <p className="text-xs text-dim mt-1">
                  Purely diagnostic testing cockpit for verifying Brevo SMTP relay connectivity, TLS socket handshakes, and diagnostic probes.
                </p>
              </div>
            </div>

            {/* Diagnostic Notice Banner */}
            <div className="border border-warn/40 bg-warn/10 p-4 font-mono text-xs text-warn flex items-start gap-3">
              <span className="text-base leading-none">⚠️</span>
              <div>
                <div className="font-bold uppercase tracking-wider">Diagnostic Relay Probe Tool Only</div>
                <div className="mt-1 text-[11px] text-ink/80">
                  This panel is strictly for testing Brevo SMTP relay connectivity and socket handshakes. It does not send operational member correspondence. All operational emails should be dispatched via the <strong>EMAIL COMMUNICATIONS</strong> tab.
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Panel className="p-6 space-y-4">
                <Hud className="text-cyan">BREVO SMTP SOCKET TELEMETRY</Hud>
                <h3 className="font-display text-2xl font-black uppercase">Socket Health Status</h3>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-dim">Support Socket:</span>
                    <span className="text-ok font-bold">{emailStatus?.services.support.status || 'Configured'} ({emailStatus?.services.support.email || 'support@ametheus.games'})</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-dim">Noreply Socket:</span>
                    <span className="text-ok font-bold">{emailStatus?.services.noreply.status || 'Configured'} ({emailStatus?.services.noreply.email || 'noreply@ametheus.games'})</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-dim">Official Socket:</span>
                    <span className="text-ok font-bold">{emailStatus?.services.official.status || 'Configured'} ({emailStatus?.services.official.email || 'official@ametheus.games'})</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-dim">Relay Host:</span>
                    <span className="text-ink font-mono">{emailStatus?.services.official.smtp_host || 'smtp-relay.brevo.com:587'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-dim">Security Protocol:</span>
                    <span className="text-ok font-mono">TLS 1.3 / STARTTLS Encrypted</span>
                  </div>
                </div>
              </Panel>

              {/* TEST PROBE SENDER */}
              <Panel className="p-6 space-y-4 border-l-4 border-l-cyan">
                <Hud className="text-cyan">DIAGNOSTIC TEST PROBE</Hud>
                <h3 className="font-display text-2xl font-black uppercase">Send Probe Ping</h3>
                <p className="text-xs text-dim">Send a test probe to verify TLS socket connectivity and deliverability to an inbox.</p>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="text-dim uppercase text-[10px]">Test Service Identity</label>
                    <select
                      value={diagnosticService}
                      onChange={(e) => setDiagnosticService(e.target.value as any)}
                      className="mt-1 w-full border border-white/15 bg-surface p-2 text-ink outline-none focus:border-cyan uppercase"
                    >
                      <option value="support">Support (support@ametheus.games)</option>
                      <option value="noreply">Automated Noreply (noreply@ametheus.games)</option>
                      <option value="official">Official Dispatch (official@ametheus.games)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-dim uppercase text-[10px]">Destination Email</label>
                    <input
                      type="email"
                      value={testEmailTo}
                      onChange={(e) => setTestEmailTo(e.target.value)}
                      placeholder="Recipient email address"
                      className="mt-1 w-full border border-white/15 bg-surface p-2 text-xs text-ink outline-none focus:border-cyan font-mono"
                    />
                  </div>

                  <button
                    onClick={handleSendTestMail}
                    disabled={isSendingTestMail || !testEmailTo.trim()}
                    className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 transition-colors disabled:opacity-50"
                  >
                    {isSendingTestMail ? 'Testing Socket Handshake...' : 'Send Diagnostic Probe'}
                  </button>

                  {/* Real-time Probe Feedback */}
                  {diagnosticResult && (
                    <div className={`mt-3 p-3 border font-mono text-[11px] ${
                      diagnosticResult.success
                        ? 'border-ok/40 bg-ok/10 text-ok'
                        : 'border-live/40 bg-live/10 text-live'
                    }`}>
                      <div className="font-bold uppercase">
                        {diagnosticResult.success ? '✓ Probe Dispatched Successfully' : '✕ Diagnostic Probe Failed'}
                      </div>
                      <div className="mt-1 text-[10px] text-ink/80">
                        <div>Response: {diagnosticResult.detail}</div>
                        <div>Timestamp: {diagnosticResult.timestamp}</div>
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          </div>
        )}
      </Container>

      {/* MODALS */}

      {/* Comprehensive Payment Record Modal */}
      {selectedPaymentDetail && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-2xl max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-white/20 bg-graphite p-6 shadow-2xl select-text font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-2xl font-black uppercase text-cyan">Payment Record Audit</h3>
                  <p className="text-[11px] text-dim mt-0.5">ID: {selectedPaymentDetail.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentDetail(null)}
                  className="border border-white/20 px-2.5 py-1 text-dim hover:text-ink uppercase cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2 p-3 bg-surface/50 border border-white/10">
                  <div className="text-dim uppercase text-[10px] font-bold tracking-wider">Transaction Data</div>
                  <div>Amount: <span className="text-ok font-bold text-sm">{inr(selectedPaymentDetail.amount_inr)}</span></div>
                  <div>Status: <span className={`font-bold ${selectedPaymentDetail.status === 'APPROVED' ? 'text-ok' : selectedPaymentDetail.status === 'REJECTED' ? 'text-live' : 'text-warn'}`}>{selectedPaymentDetail.status}</span></div>
                  <div>Payment Type: <span className="text-ink">{selectedPaymentDetail.payment_type || 'TOURNAMENT_ENTRY'}</span></div>
                  <div>UTR Reference: <span className="text-cyan font-bold break-all">{selectedPaymentDetail.utr}</span></div>
                  <div>Customer UPI / VPA: <span className="text-ink break-all">{selectedPaymentDetail.sender_upi_id || 'Not Specified'}</span></div>
                  <div>Archived: <span className={selectedPaymentDetail.is_archived ? 'text-warn font-bold' : 'text-dim'}>{selectedPaymentDetail.is_archived ? 'YES' : 'NO'}</span></div>
                </div>

                <div className="space-y-2 p-3 bg-surface/50 border border-white/10">
                  <div className="text-dim uppercase text-[10px] font-bold tracking-wider">User & Audit Metadata</div>
                  <div>User ID: <span className="text-ink break-all">{selectedPaymentDetail.user_id}</span></div>
                  <div>User Email: <span className="text-ink break-all">{selectedPaymentDetail.user_email || 'N/A'}</span></div>
                  <div>Username: <span className="text-ink">{selectedPaymentDetail.user_username || selectedPaymentDetail.username || selectedPaymentDetail.user_name || 'N/A'}</span></div>
                  <div>Processed By: <span className="text-dim">{selectedPaymentDetail.approved_by || selectedPaymentDetail.rejected_by || selectedPaymentDetail.audited_by || selectedPaymentDetail.verified_by || 'Pending verification'}</span></div>
                  <div>Submitted: <span className="text-ink font-bold">{formatPaymentDateTime(selectedPaymentDetail.created_at)}</span></div>
                  {selectedPaymentDetail.status === 'APPROVED' && (
                    <div>Approved At: <span className="text-ok font-bold">{formatPaymentDateTime(selectedPaymentDetail.approved_at || selectedPaymentDetail.verified_at)}</span></div>
                  )}
                  {selectedPaymentDetail.status === 'REJECTED' && (
                    <div>Rejected At: <span className="text-live font-bold">{formatPaymentDateTime(selectedPaymentDetail.rejected_at || selectedPaymentDetail.verified_at)}</span></div>
                  )}
                  {selectedPaymentDetail.archived_at && (
                    <div>Archived At: <span className="text-warn font-bold">{formatPaymentDateTime(selectedPaymentDetail.archived_at)}</span></div>
                  )}
                  <div>Last Updated: <span className="text-dim">{formatPaymentDateTime(selectedPaymentDetail.updated_at)}</span></div>
                </div>
              </div>

              {/* Snapshotted UPI & Payee info */}
              <div className="mt-4 p-3 bg-surface/50 border border-white/10 space-y-2">
                <div className="text-dim uppercase text-[10px] font-bold tracking-wider">Snapshotted Account at Checkout</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>Account Code: <span className="text-ink font-bold">{selectedPaymentDetail.payment_account_code || 'N/A'}</span></div>
                  <div>Receiving UPI: <span className="text-cyan font-bold break-all">{selectedPaymentDetail.upi_id || 'N/A'}</span></div>
                  <div>Payee Name: <span className="text-ink">{selectedPaymentDetail.payee_name || 'N/A'}</span></div>
                </div>
                {selectedPaymentDetail.qr_url && (
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-4">
                    <span className="text-[10px] text-dim">Snapshotted QR Image:</span>
                    <img
                      src={resolveMediaUrl(selectedPaymentDetail.qr_url)}
                      alt="Snapshotted QR"
                      className="size-20 object-contain bg-white p-1 rounded border border-white/10"
                    />
                  </div>
                )}
              </div>

              {/* Proof Screenshot */}
              {(selectedPaymentDetail.proof_url || selectedPaymentDetail.screenshot_url) && (
                <div className="mt-4 p-3 bg-surface/50 border border-white/10 space-y-2">
                  <div className="text-dim uppercase text-[10px] font-bold tracking-wider">Player Deposit Proof Screenshot</div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <a
                      href={resolveMediaUrl(selectedPaymentDetail.proof_url || selectedPaymentDetail.screenshot_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="block max-h-48 overflow-hidden rounded border border-white/20 hover:opacity-90"
                    >
                      <img
                        src={resolveMediaUrl(selectedPaymentDetail.proof_url || selectedPaymentDetail.screenshot_url)}
                        alt="Deposit proof screenshot"
                        className="max-h-48 object-contain"
                      />
                    </a>
                    <span className="text-[10px] text-dim">Click image to inspect full-resolution document in new tab.</span>
                  </div>
                </div>
              )}

              {/* Rejection / Admin Notes */}
              {(selectedPaymentDetail.rejection_reason || selectedPaymentDetail.notes) && (
                <div className="mt-4 p-3 bg-surface/50 border border-live/30 space-y-1">
                  <div className="text-live uppercase text-[10px] font-bold tracking-wider">Rejection / Audit Notes</div>
                  <p className="text-ink text-[11px]">{selectedPaymentDetail.rejection_reason || selectedPaymentDetail.notes}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
                {selectedPaymentDetail.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleApprovePayment(selectedPaymentDetail.id)
                        setSelectedPaymentDetail(null)
                      }}
                      className="border border-ok bg-ok px-4 py-2 font-mono text-xs uppercase text-void font-bold cursor-pointer"
                    >
                      Approve & Credit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const id = selectedPaymentDetail.id
                        setSelectedPaymentDetail(null)
                        setRejectPaymentId(id)
                      }}
                      className="border border-live bg-live/20 px-4 py-2 font-mono text-xs uppercase text-live cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentDetail(null)}
                  className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Permanent Tournament Deletion Confirmation Modal */}
      {tournamentToDelete && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-lg max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-red-500/50 bg-graphite p-6 shadow-2xl select-text font-mono text-xs space-y-5">
              <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-red-500 animate-ping" />
                  <h3 className="font-display text-2xl font-black uppercase text-red-400">Delete Tournament Permanently</h3>
                </div>
                <button
                  type="button"
                  disabled={isDeletingTournament}
                  onClick={() => {
                    setTournamentToDelete(null)
                    setDeleteConfirmText('')
                  }}
                  className="border border-white/20 px-2.5 py-1 text-dim hover:text-ink uppercase cursor-pointer disabled:opacity-50"
                >
                  ✕
                </button>
              </div>

              <div className="border border-red-500/30 bg-red-950/25 p-4 space-y-2 text-ink">
                <div className="font-bold text-red-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <span>⚠️ IRREVERSIBLE ACTION</span>
                </div>
                <p>
                  You are about to permanently delete tournament:{' '}
                  <strong className="text-red-200 underline font-bold select-all">
                    {tournamentToDelete.title}
                  </strong>{' '}
                  <span className="text-dim text-[10px]">({tournamentToDelete.id || tournamentToDelete.slug})</span>.
                </p>
                <p className="text-dim text-[11px] leading-relaxed">
                  This will completely remove the tournament, its bracket configurations, matches, and registrations from the platform. 
                  Financial receipts (player UPI entries and wallet ledgers) and participating player accounts will remain safely preserved for audit compliance.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] uppercase text-dim tracking-wider">
                  To confirm permanent deletion, type <span className="text-red-400 font-bold select-all">DELETE</span> below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full border border-red-500/50 bg-surface px-3 py-2 text-xs font-mono text-ink placeholder:text-dim outline-none focus:border-red-400"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={isDeletingTournament}
                  onClick={() => {
                    setTournamentToDelete(null)
                    setDeleteConfirmText('')
                  }}
                  className="border border-white/20 bg-white/5 px-4 py-2 uppercase text-dim hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmText.trim() !== 'DELETE' || isDeletingTournament}
                  onClick={handleConfirmDeleteTournament}
                  className="border border-red-500 bg-red-600/30 px-5 py-2 uppercase font-bold text-red-200 hover:bg-red-600/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeletingTournament && (
                    <span className="size-3 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                  )}
                  {isDeletingTournament ? 'Deleting Tournament...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Reject Payment Modal */}
      {rejectPaymentId && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-md max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-white/20 bg-graphite p-6 shadow-2xl select-text">
              <h3 className="font-display text-2xl font-black uppercase text-live">Reject Payment</h3>
              <p className="text-xs text-dim mt-1">Specify rejection reason to notify the player.</p>
              <textarea
                rows={3}
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="e.g. UTR not matching bank statement"
                className="mt-4 w-full border border-white/15 bg-surface p-3 text-xs text-ink outline-none focus:border-live"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setRejectPaymentId(null)} className="border border-white/20 px-3 py-1.5 font-mono text-xs uppercase text-dim cursor-pointer">Cancel</button>
                <button onClick={handleRejectPayment} className="border border-live bg-live px-4 py-1.5 font-mono text-xs uppercase text-white cursor-pointer">Confirm Rejection</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Add / Edit UPI Account Modal */}
      {isNewUpiOpen && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-md max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-white/20 bg-graphite p-6 shadow-2xl select-text">
              <h3 className="font-display text-2xl font-black uppercase text-ink">
                {editingUpi ? `Edit UPI Account (${editingUpi.code})` : 'New UPI Account'}
              </h3>

              {upiFormError && (
                <div className="mt-3 border border-live/40 bg-live/10 p-2.5 font-mono text-xs text-live">
                  {upiFormError}
                </div>
              )}

              <form onSubmit={handleSaveUpi} className="mt-4 space-y-3 font-mono text-xs">
                <div>
                  <label className="text-[10px] uppercase text-dim block mb-1">
                    Account Code {editingUpi && '(Permanent ID — Immutable)'}
                  </label>
                  {editingUpi ? (
                    <input
                      disabled
                      value={newUpi.code}
                      className="w-full border border-white/10 bg-white/5 p-2.5 text-dim cursor-not-allowed outline-none select-all"
                      title="Account code is immutable to preserve historical payments and audit integrity"
                    />
                  ) : (
                    <input
                      required
                      placeholder="Account Code (e.g. UPI_PRIMARY)"
                      value={newUpi.code}
                      onChange={(e) => setNewUpi({ ...newUpi, code: e.target.value })}
                      className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase text-dim block mb-1">UPI VPA Handle</label>
                  <input
                    required
                    placeholder="UPI VPA (e.g. company@kotak)"
                    value={newUpi.upi_id}
                    onChange={(e) => setNewUpi({ ...newUpi, upi_id: e.target.value })}
                    className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-dim block mb-1">Registered Payee Name</label>
                  <input
                    required
                    placeholder="Payee Name (e.g. AMETHEUS ESPORTS PRIVATE LIMITED)"
                    value={newUpi.payee_name}
                    onChange={(e) => setNewUpi({ ...newUpi, payee_name: e.target.value })}
                    className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-dim block mb-1">Display Name / Label (Optional)</label>
                  <input
                    placeholder="Display Label (e.g. Primary Corporate HDFC)"
                    value={newUpi.display_name || ''}
                    onChange={(e) => setNewUpi({ ...newUpi, display_name: e.target.value })}
                    className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-dim block mb-1">Status</label>
                  <select
                    value={newUpi.status || 'ACTIVE'}
                    onChange={(e) => setNewUpi({ ...newUpi, status: e.target.value })}
                    className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE (Receives Checkout Traffic)</option>
                    <option value="INACTIVE">INACTIVE (Disabled)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase text-dim block mb-1">QR Code Image (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      placeholder="QR image URL (or upload image)"
                      value={newUpi.qr_url || ''}
                      onChange={(e) => setNewUpi({ ...newUpi, qr_url: e.target.value })}
                      className="flex-1 border border-white/15 bg-surface p-2 text-ink outline-none focus:border-cyan"
                    />
                    <label className="cursor-pointer border border-cyan/40 bg-cyan/10 px-3 py-2 uppercase text-cyan hover:bg-cyan/20 shrink-0">
                      {isUploadingNewUpiQr ? '...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingNewUpiQr}
                        onChange={async (e) => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          setIsUploadingNewUpiQr(true)
                          try {
                            const res = await uploadMediaFile(f)
                            if (res?.url) setNewUpi((prev) => ({ ...prev, qr_url: res.url }))
                          } catch (err: any) {
                            alert(err.message || 'QR upload failed')
                          } finally {
                            setIsUploadingNewUpiQr(false)
                          }
                        }}
                      />
                    </label>
                  </div>
                  {newUpi.qr_url && (
                    <div className="mt-2 flex items-center justify-between bg-void p-2 border border-white/10">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveMediaUrl(newUpi.qr_url)}
                          alt="QR Preview"
                          className="size-12 object-contain bg-white p-0.5 rounded"
                        />
                        <span className="text-[10px] text-ok truncate">QR Code attached</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewUpi((prev) => ({ ...prev, qr_url: '' }))}
                        className="text-[10px] text-live hover:underline cursor-pointer"
                      >
                        Remove QR
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewUpiOpen(false)
                      setEditingUpi(null)
                    }}
                    className="border border-white/20 px-3 py-1.5 uppercase text-dim cursor-pointer hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUpi}
                    className="border border-cyan bg-cyan px-5 py-1.5 uppercase text-void font-bold cursor-pointer hover:brightness-110 disabled:opacity-50"
                  >
                    {isSavingUpi ? 'Saving...' : editingUpi ? 'Update Account' : 'Register Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Complete Payout Modal */}
      {completePayoutId && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-md max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-white/20 bg-graphite p-6 shadow-2xl select-text">
              <h3 className="font-display text-2xl font-black uppercase text-ok">Disburse Payout</h3>
              <p className="text-xs text-dim mt-1">Enter bank outgoing IMPS/UPI UTR reference number.</p>
              <input required placeholder="Outgoing UTR (e.g. 523412399999)" value={outgoingUtr} onChange={(e) => setOutgoingUtr(e.target.value)} className="mt-4 w-full border border-white/15 bg-surface p-2.5 font-mono text-xs text-ink outline-none focus:border-ok" />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setCompletePayoutId(null)} className="border border-white/20 px-3 py-1.5 font-mono text-xs uppercase text-dim cursor-pointer">Cancel</button>
                <button onClick={handleCompletePayout} className="border border-ok bg-ok px-4 py-1.5 font-mono text-xs uppercase text-void font-bold cursor-pointer">Certify Disbursed</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-lg max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-white/20 bg-graphite p-6 shadow-2xl select-text">
              <h3 className="font-display text-2xl font-black uppercase text-ink">Manage Ticket {selectedTicket.ticket_id}</h3>
              <p className="text-xs text-dim mt-1 font-mono">{selectedTicket.name} ({selectedTicket.email})</p>
              <div className="mt-4 space-y-3 font-mono text-xs">
                <select value={ticketStatusVal} onChange={(e) => setTicketStatusVal(e.target.value)} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none cursor-pointer uppercase">
                  {SUPPORT_TICKET_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <textarea rows={3} value={ticketNotes} onChange={(e) => setTicketNotes(e.target.value)} placeholder="Internal resolution notes..." className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setSelectedTicket(null)} className="border border-white/20 px-3 py-1.5 font-mono text-xs uppercase text-dim cursor-pointer">Cancel</button>
                <button onClick={handleUpdateTicket} className="border border-cyan bg-cyan px-4 py-1.5 font-mono text-xs uppercase text-void font-bold cursor-pointer">Save Ticket</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Dispatch Official Mail Modal */}
      {isOfficialMailOpen && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-lg max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-white/20 bg-graphite p-6 shadow-2xl select-text">
              <h3 className="font-display text-2xl font-black uppercase text-ink">Dispatch Official Platform Email</h3>
              <form onSubmit={handleSendOfficialMail} className="mt-4 space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-dim uppercase text-[10px] tracking-wider mb-1">Target Audience</label>
                  <select
                    value={officialMail.recipient_type}
                    onChange={(e) => setOfficialMail({ ...officialMail, recipient_type: e.target.value })}
                    className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none"
                  >
                    <option value="ALL_USERS">All Users</option>
                    <option value="ALL_ORGANIZERS">All Organizers</option>
                    <option value="SELECTED_USERS">Selected Users</option>
                    <option value="SELECTED_TEAMS">Selected Teams</option>
                    <option value="CUSTOM_EMAILS">Custom Audience</option>
                  </select>
                </div>

                {officialMail.recipient_type === 'CUSTOM_EMAILS' && (
                  <div>
                    <label className="block text-dim uppercase text-[10px] tracking-wider mb-1">Direct Email Addresses</label>
                    <input
                      required
                      placeholder="Comma-separated emails (e.g. org1@mail.com, org2@mail.com)"
                      value={officialMail.custom_emails}
                      onChange={(e) => setOfficialMail({ ...officialMail, custom_emails: e.target.value })}
                      className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>
                )}

                {officialMail.recipient_type === 'SELECTED_USERS' && (
                  <div>
                    <label className="block text-dim uppercase text-[10px] tracking-wider mb-1">Target User IDs</label>
                    <input
                      required
                      placeholder="Comma-separated user IDs (e.g. user_123, user_456)"
                      value={officialMail.user_ids}
                      onChange={(e) => setOfficialMail({ ...officialMail, user_ids: e.target.value })}
                      className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>
                )}

                {officialMail.recipient_type === 'SELECTED_TEAMS' && (
                  <div>
                    <label className="block text-dim uppercase text-[10px] tracking-wider mb-1">Target Team IDs</label>
                    <input
                      required
                      placeholder="Comma-separated team IDs (e.g. team_abc, team_xyz)"
                      value={officialMail.team_ids}
                      onChange={(e) => setOfficialMail({ ...officialMail, team_ids: e.target.value })}
                      className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>
                )}
                <input required placeholder="Subject Line" value={officialMail.subject} onChange={(e) => setOfficialMail({ ...officialMail, subject: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
                <textarea rows={4} required placeholder="Email message content..." value={officialMail.message} onChange={(e) => setOfficialMail({ ...officialMail, message: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsOfficialMailOpen(false)} className="border border-white/20 px-3 py-1.5 uppercase text-dim cursor-pointer">Cancel</button>
                  <button type="submit" className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-void font-bold cursor-pointer">Dispatch Email</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Add Regulation Chapter Modal */}
      {isNewRegOpen && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-lg max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-white/20 bg-graphite p-6 shadow-2xl select-text">
              <h3 className="font-display text-2xl font-black uppercase text-ink">New Regulation Chapter</h3>
              <form onSubmit={handleCreateReg} className="mt-4 space-y-3 font-mono text-xs">
                <input required placeholder="Game Title (e.g. VALORANT)" value={newReg.game_name} onChange={(e) => setNewReg({ ...newReg, game_name: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                <input required placeholder="Chapter Code (e.g. SEC-01-INTEGRITY)" value={newReg.chapter_code} onChange={(e) => setNewReg({ ...newReg, chapter_code: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                <input required placeholder="Chapter Title" value={newReg.title} onChange={(e) => setNewReg({ ...newReg, title: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                <textarea rows={4} required placeholder="Rule items (one per line)" value={newReg.rules} onChange={(e) => setNewReg({ ...newReg, rules: e.target.value })} className="w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsNewRegOpen(false)} className="border border-white/20 px-3 py-1.5 uppercase text-dim cursor-pointer">Cancel</button>
                  <button type="submit" className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-void font-bold cursor-pointer">Publish Chapter</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Issue Prize Payout Modal */}
      {isPayoutModalOpen && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-md max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-white/20 bg-graphite p-6 shadow-2xl select-text">
              <h3 className="font-display text-2xl font-black uppercase text-ink">Issue Prize Payout</h3>
              <form onSubmit={handleCreatePayout} className="mt-4 space-y-3 font-mono text-xs">
                <div>
                  <label className="text-dim">Player User ID / Username</label>
                  <input required placeholder="User ID" value={newPayout.user_id} onChange={(e) => setNewPayout({ ...newPayout, user_id: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Placement</label>
                  <input required placeholder="e.g. 1st Place Champion" value={newPayout.rank_or_placement} onChange={(e) => setNewPayout({ ...newPayout, rank_or_placement: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Prize Amount (₹)</label>
                  <input required type="number" min="1" value={newPayout.amount_inr} onChange={(e) => setNewPayout({ ...newPayout, amount_inr: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Disbursement Method</label>
                  <select value={newPayout.destination} onChange={(e) => setNewPayout({ ...newPayout, destination: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none">
                    <option value="WALLET">Player Platform Wallet</option>
                    <option value="UPI">Direct UPI IMPS</option>
                  </select>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsPayoutModalOpen(false)} className="border border-white/20 px-3 py-1.5 uppercase text-dim cursor-pointer">Cancel</button>
                  <button type="submit" className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-void font-bold cursor-pointer">Issue Payout</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* CREATE TOURNAMENT MODAL */}
      {isCreateTourOpen && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-xl max-h-[min(90vh,calc(100svh-2rem))] flex flex-col border border-white/20 bg-graphite shadow-2xl overflow-hidden select-text">
              <div className="flex items-center justify-between border-b border-white/10 p-6 pb-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-cyan">SANCTIONED OPERATIONS</span>
                  </div>
                  <h3 className="font-display text-2xl font-black uppercase text-ink mt-0.5">Create Sanctioned Tournament</h3>
                  <p className="text-xs text-dim mt-0.5">Configure competition parameters, schedule, rules, and entry structure.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsCreateTourOpen(false); setCreateTourError(null); }}
                  className="text-dim hover:text-ink font-mono text-xs uppercase border border-white/15 px-2.5 py-1 cursor-pointer transition-colors"
                >
                  ✕ Close
                </button>
              </div>

              {createTourError && (
                <div className="mx-6 mt-4 p-3 border border-red-500/50 bg-red-950/40 text-red-200 font-mono text-xs flex items-start gap-2.5 rounded-sm shrink-0">
                  <span className="text-red-400 font-bold shrink-0">✕ VALIDATION ERROR:</span>
                  <span className="flex-1 leading-relaxed">{createTourError}</span>
                  <button
                    type="button"
                    onClick={() => setCreateTourError(null)}
                    className="text-red-400 hover:text-white shrink-0 font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              <form onSubmit={handleCreateTourSubmit} className="flex flex-col min-h-0 flex-1">
                <div className="overflow-y-auto p-6 space-y-5 font-mono text-xs flex-1 pr-4">
                  {/* SECTION A: COMPETITION IDENTITY */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-1.5">
                      <span className="text-cyan font-bold">01 //</span>
                      <span className="text-ink font-bold uppercase tracking-wider text-[11px]">Competition Identity</span>
                    </div>
                    <div>
                      <label className="text-dim">Tournament Title <span className="text-cyan">*</span></label>
                      <input
                        required
                        placeholder="e.g. Ascent Championship Series 2026"
                        value={newTour.title}
                        onChange={(e) => { setNewTour({ ...newTour, title: e.target.value }); if (createTourError) setCreateTourError(null); }}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-dim">Sanctioned Game <span className="text-cyan">*</span></label>
                        <select
                          value={newTour.game_id}
                          onChange={(e) => handleSelectGameForNewTour(e.target.value)}
                          className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan text-xs"
                        >
                          {games.map((g) => (
                            <option key={g.id || g.slug} value={g.slug || g.id}>{g.name}</option>
                          ))}
                          {games.length === 0 && (
                            <>
                              <option value="valorant">VALORANT</option>
                              <option value="bgmi">BGMI</option>
                              <option value="free-fire">Free Fire</option>
                              <option value="codm">COD Mobile</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="text-dim">Competition Format <span className="text-cyan">*</span></label>
                        <select
                          required
                          value={newTour.format}
                          onChange={(e) => setNewTour({ ...newTour, format: e.target.value })}
                          className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan text-xs"
                        >
                          <option value="Knockout">Knockout</option>
                          <option value="Round Robin">Round Robin</option>
                          <option value="Battle Royale">Battle Royale</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-dim">Series Format <span className="text-cyan">*</span></label>
                        <select
                          required
                          value={newTour.series_format || 'BO1'}
                          onChange={(e) => setNewTour({ ...newTour, series_format: e.target.value })}
                          className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan text-xs"
                        >
                          <option value="BO1">Best of 1 (BO1)</option>
                          <option value="BO3">Best of 3 (BO3)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-dim">Initial Publication Status <span className="text-cyan">*</span></label>
                        <span className="text-[10px] text-cyan uppercase font-bold tracking-wider">Visibility & Enrollment</span>
                      </div>
                      <select
                        value={newTour.status}
                        onChange={(e) => setNewTour({ ...newTour, status: e.target.value as any })}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                      >
                        <option value="REGISTRATION_OPEN">Registration Open (Publicly Visible & Open for Squad Entries)</option>
                        <option value="UPCOMING">Upcoming (Publicly Visible Announcement - Registrations Pending)</option>
                        <option value="DRAFT">Draft (Admin Only - Staged & Hidden from Public)</option>
                      </select>
                      <p className="mt-1 text-[10px] text-dim font-mono">
                        {newTour.status === 'REGISTRATION_OPEN' && 'Tournament will be immediately visible on public listings and open for player and team registrations.'}
                        {newTour.status === 'UPCOMING' && 'Tournament will be visible as an upcoming event on public listings.'}
                        {newTour.status === 'DRAFT' && 'Tournament will be saved as a draft. Only admins can view and publish it.'}
                      </p>
                    </div>
                  </div>

                  {/* SECTION B: TOURNAMENT SCHEDULE */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-1.5">
                      <span className="text-cyan font-bold">02 //</span>
                      <span className="text-ink font-bold uppercase tracking-wider text-[11px]">Tournament Schedule</span>
                    </div>

                    {/* Start Date & Time */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-dim">Tournament Start Date & Time (UTC/Local) <span className="text-cyan">*</span></label>
                      </div>
                      <input
                        required
                        type="datetime-local"
                        value={newTour.starts_at_local}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                      />
                      <p className="mt-1 text-[10px] text-dim font-mono">
                        Target scheduled start time for Round 1 of the tournament.
                      </p>
                    </div>

                    {/* Roster Lock Date & Time - DIRECTLY BENEATH */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-dim">Roster Lock Date & Time (UTC/Local) <span className="text-cyan">*</span></label>
                        <span className="text-[10px] text-cyan uppercase font-bold tracking-wider">Registration Cutoff</span>
                      </div>
                      <input
                        required
                        type="datetime-local"
                        value={newTour.roster_lock_local}
                        onChange={(e) => setNewTour({ ...newTour, roster_lock_local: e.target.value })}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                      />
                      <p className="mt-1 text-[10px] text-dim font-mono">
                        Roster lock cutoff deadline. Squad registration and lineup changes lock permanently at this cutoff (must be at or before tournament start).
                      </p>
                    </div>
                  </div>

                  {/* SECTION C: TEAM & PLAYER STRUCTURE */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-1.5">
                      <span className="text-cyan font-bold">03 //</span>
                      <span className="text-ink font-bold uppercase tracking-wider text-[11px]">Roster & Team Structure</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-dim">Max Teams</label>
                        <input
                          required
                          type="number"
                          min="2"
                          max="128"
                          value={newTour.max_teams}
                          onChange={(e) => setNewTour({ ...newTour, max_teams: Number(e.target.value) })}
                          className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                        />
                      </div>
                      <div>
                        <label className="text-dim">Min Team Size</label>
                        <input
                          required
                          type="number"
                          min="1"
                          max="10"
                          value={newTour.min_team_size}
                          onChange={(e) => setNewTour({ ...newTour, min_team_size: Number(e.target.value) })}
                          className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                        />
                      </div>
                      <div>
                        <label className="text-dim">Max Team Size</label>
                        <input
                          required
                          type="number"
                          min="1"
                          max="10"
                          value={newTour.max_team_size}
                          onChange={(e) => setNewTour({ ...newTour, max_team_size: Number(e.target.value) })}
                          className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION D: FINANCIAL STRUCTURE */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-1.5">
                      <span className="text-cyan font-bold">04 //</span>
                      <span className="text-ink font-bold uppercase tracking-wider text-[11px]">Financial Structure</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-dim">Prize Pool (₹)</label>
                        <input
                          required
                          type="number"
                          min="0"
                          value={newTour.prize_pool_inr}
                          onChange={(e) => setNewTour({ ...newTour, prize_pool_inr: Number(e.target.value) })}
                          className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                        />
                      </div>
                      <div>
                        <label className="text-dim">Entry Fee per Squad (₹)</label>
                        <input
                          required
                          type="number"
                          min="0"
                          value={newTour.entry_fee_inr}
                          onChange={(e) => setNewTour({ ...newTour, entry_fee_inr: Number(e.target.value) })}
                          className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                        />
                        <p className="mt-1 text-[10px] text-dim font-mono">Set to 0 for Free-to-enter tournaments.</p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION E: COMMUNITY & OVERVIEW */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-1.5">
                      <span className="text-cyan font-bold">05 //</span>
                      <span className="text-ink font-bold uppercase tracking-wider text-[11px]">Communications & Information</span>
                    </div>
                    <div>
                      <label className="text-dim">Official WhatsApp Group Link</label>
                      <input
                        placeholder="https://chat.whatsapp.com/... (optional)"
                        value={newTour.whatsapp_group_url || ''}
                        onChange={(e) => setNewTour({ ...newTour, whatsapp_group_url: e.target.value })}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                      />
                      <p className="mt-1 text-[10px] text-dim font-mono">Enrolled squad captains receive this link upon registration confirmation.</p>
                    </div>
                    <div>
                      <label className="text-dim">Community Discord / Channel Link</label>
                      <input
                        placeholder="https://discord.gg/... (optional)"
                        value={newTour.community_link || ''}
                        onChange={(e) => setNewTour({ ...newTour, community_link: e.target.value })}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                      />
                      <p className="mt-1 text-[10px] text-dim font-mono">Public discord server or communication hub for general announcements.</p>
                    </div>
                    <div>
                      <label className="text-dim">Description</label>
                      <textarea
                        rows={3}
                        value={newTour.description}
                        onChange={(e) => setNewTour({ ...newTour, description: e.target.value })}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end items-center gap-3 border-t border-white/10 p-4 shrink-0 bg-graphite">
                  <button
                    type="button"
                    disabled={isSubmittingTour}
                    onClick={() => { setIsCreateTourOpen(false); setCreateTourError(null); }}
                    className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer disabled:opacity-50 text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTour}
                    className="border border-cyan bg-cyan hover:bg-cyan/90 text-void font-bold px-6 py-2 uppercase text-xs font-mono tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmittingTour ? (
                      <>
                        <span className="h-3 w-3 border-2 border-void border-t-transparent rounded-full animate-spin" />
                        <span>Creating Tournament...</span>
                      </>
                    ) : (
                      <span>Create Tournament</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* EDIT TOURNAMENT MODAL */}
      {editingTour && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-xl max-h-[min(90vh,calc(100svh-2rem))] flex flex-col border border-white/20 bg-graphite shadow-2xl overflow-hidden select-text">
              <div className="flex items-center justify-between border-b border-white/10 p-6 pb-4 shrink-0">
                <div>
                  <Hud className="text-cyan">TOURNAMENT CONFIGURATION</Hud>
                  <h3 className="font-display text-2xl font-black uppercase text-ink">Edit Tournament</h3>
                  <p className="font-mono text-xs text-dim truncate max-w-md">{editingTour.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTour(null)}
                  className="text-dim hover:text-ink font-mono text-xs uppercase border border-white/15 px-2.5 py-1 cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {editTourError && (
                <div className="mx-6 mt-4 p-3 border border-red-500/50 bg-red-950/40 text-red-200 font-mono text-xs flex items-start gap-2.5 rounded-sm shrink-0">
                  <span className="text-red-400 font-bold shrink-0">✕ ERROR:</span>
                  <span className="flex-1 leading-relaxed">{editTourError}</span>
                  <button
                    type="button"
                    onClick={() => setEditTourError(null)}
                    className="text-red-400 hover:text-white shrink-0 font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              <form onSubmit={handleUpdateTourSubmit} className="flex flex-col min-h-0 flex-1">
                <div className="overflow-y-auto p-6 space-y-4 font-mono text-xs flex-1">
                  <div>
                    <label className="text-dim uppercase font-bold text-cyan">Tournament Status Control</label>
                    <select
                      value={editingTour.status || 'REGISTRATION_OPEN'}
                      onChange={(e) => {
                        const newStatus = e.target.value
                        const newReg = newStatus === 'REGISTRATION_CLOSED' ? 'CLOSED' : (newStatus === 'REGISTRATION_OPEN' ? 'OPEN' : editingTour.registration_status)
                        setEditingTour({ ...editingTour, status: newStatus as any, registration_status: newReg })
                      }}
                      className="mt-1 w-full border border-cyan/40 bg-surface p-2.5 text-cyan font-bold uppercase outline-none focus:border-cyan"
                    >
                      <option value="REGISTRATION_OPEN">● REGISTRATION OPEN (ACCEPTING TEAMS)</option>
                      <option value="REGISTRATION_CLOSED">■ REGISTRATION CLOSED (LOCKED ROSTERS)</option>
                      <option value="LIVE">▲ LIVE NOW (MATCHES IN PROGRESS)</option>
                      <option value="COMPLETED">✓ COMPLETED (RESULTS CERTIFIED)</option>
                      <option value="CANCELLED">✕ CANCELLED</option>
                    </select>
                    <p className="mt-1 text-[10px] text-dim">
                      Setting to REGISTRATION CLOSED locks rosters and enables Match Formation.
                    </p>
                  </div>

                  <div>
                    <label className="text-dim">Title</label>
                    <input required value={editingTour.title} onChange={(e) => setEditingTour({ ...editingTour, title: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-dim">Competition Format</label>
                      <select
                        required
                        value={editingTour.format}
                        onChange={(e) => setEditingTour({ ...editingTour, format: e.target.value })}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan text-xs"
                      >
                        <option value="Knockout">Knockout</option>
                        <option value="Round Robin">Round Robin</option>
                        <option value="Battle Royale">Battle Royale</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-dim">Series Format</label>
                      <select
                        required
                        value={(editingTour as any).series_format || 'BO1'}
                        onChange={(e) => setEditingTour({ ...editingTour, series_format: e.target.value } as any)}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan text-xs"
                      >
                        <option value="BO1">Best of 1 (BO1)</option>
                        <option value="BO3">Best of 3 (BO3)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-dim">Max Teams</label>
                      <input required type="number" min="2" value={editingTour.max_teams} onChange={(e) => setEditingTour({ ...editingTour, max_teams: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-dim">Prize Pool (₹)</label>
                      <input required type="number" min="0" value={editingTour.prize_pool_inr} onChange={(e) => setEditingTour({ ...editingTour, prize_pool_inr: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
                    </div>
                    <div>
                      <label className="text-dim">Entry Fee (₹)</label>
                      <input required type="number" min="0" value={editingTour.entry_fee_inr} onChange={(e) => setEditingTour({ ...editingTour, entry_fee_inr: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-dim">Start Date & Time (UTC/Local)</label>
                      <input
                        type="datetime-local"
                        value={isoToLocalDatetimeInputString(editingTour.starts_at || editingTour.start_date)}
                        onChange={(e) => {
                          const d = new Date(e.target.value)
                          setEditingTour({
                            ...editingTour,
                            starts_at: isNaN(d.getTime()) ? undefined : d.toISOString(),
                          })
                        }}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                      />
                    </div>
                    <div>
                      <label className="text-dim">Roster Lock Date & Time (UTC/Local)</label>
                      <input
                        type="datetime-local"
                        value={isoToLocalDatetimeInputString(editingTour.roster_lock_time)}
                        onChange={(e) => {
                          const d = new Date(e.target.value)
                          setEditingTour({
                            ...editingTour,
                            roster_lock_time: isNaN(d.getTime()) ? undefined : d.toISOString(),
                          })
                        }}
                        className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-dim">Official WhatsApp Group Link</label>
                    <input
                      placeholder="https://chat.whatsapp.com/... (optional)"
                      value={editingTour.whatsapp_group_url || ''}
                      onChange={(e) => setEditingTour({ ...editingTour, whatsapp_group_url: e.target.value })}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                    <p className="mt-1 text-[10px] text-dim font-mono">Enrolled squad captains receive this link upon registration confirmation.</p>
                  </div>
                  <div>
                    <label className="text-dim">Official Community Link (Discord / Public)</label>
                    <input
                      placeholder="https://discord.gg/... (optional)"
                      value={editingTour.community_link || ''}
                      onChange={(e) => setEditingTour({ ...editingTour, community_link: e.target.value })}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                    <p className="mt-1 text-[10px] text-dim font-mono">Community channel for match disputes, announcements, and scheduling.</p>
                  </div>
                  <div>
                    <label className="text-dim">Description</label>
                    <textarea rows={3} value={editingTour.description || ''} onChange={(e) => setEditingTour({ ...editingTour, description: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-white/10 p-4 shrink-0 bg-graphite">
                  <button
                    type="button"
                    disabled={isUpdatingTour}
                    onClick={() => { setEditingTour(null); setEditTourError(null); }}
                    className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer disabled:opacity-50 text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingTour}
                    className="border border-cyan bg-cyan px-6 py-2 uppercase text-void font-bold hover:brightness-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs font-mono flex items-center gap-2"
                  >
                    {isUpdatingTour ? (
                      <>
                        <span className="h-3 w-3 border-2 border-void border-t-transparent rounded-full animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* VIEW REGISTERED ROSTERS MODAL */}
      {rosterTour && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-2xl max-h-[min(90vh,calc(100svh-2rem))] flex flex-col border border-white/20 bg-graphite p-6 shadow-2xl overflow-hidden select-text">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
                <div>
                  <h3 className="font-display text-2xl font-black uppercase text-ink">{rosterTour.title}</h3>
                  <p className="font-mono text-xs text-dim">Authoritative Registered Rosters & Squad Status</p>
                </div>
                <button onClick={() => setRosterTour(null)} className="font-mono text-xs uppercase text-dim hover:text-ink cursor-pointer">✕ Close</button>
              </div>

              <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
                {loadingRosters ? (
                  <div className="p-8 text-center font-mono text-xs text-cyan animate-pulse">
                    FETCHING REGISTERED ROSTERS FROM SECURE BACKEND...
                  </div>
                ) : rostersList.length === 0 ? (
                  <div className="border border-dashed border-white/15 p-8 text-center font-mono text-xs text-dim">
                    NO REGISTERED TEAMS (0 TEAMS REGISTERED FOR THIS TOURNAMENT).
                  </div>
                ) : (
                  rostersList.map((team, idx) => (
                    <div key={team.id || team.team_id || idx} className="border border-white/10 bg-surface p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-cyan font-bold">[{team.tag || 'TEAM'}]</span>
                          <span className="font-display text-lg font-black uppercase text-ink">{team.name || team.team_name}</span>
                        </div>
                        <span className={`px-2 py-0.5 font-mono text-[9px] uppercase border ${
                          team.payment_status === 'COMPLETED' || team.payment_status === 'PAID'
                            ? 'border-ok text-ok bg-ok/10'
                            : 'border-warn text-warn bg-warn/10'
                        }`}>
                          {team.payment_status || 'CONFIRMED'}
                        </span>
                      </div>

                      <div className="font-mono text-xs text-dim">
                        Captain: <span className="text-ink">{team.captain_username || team.captain_name || team.captain || 'N/A'}</span>
                      </div>

                      {team.members && team.members.length > 0 && (
                        <div className="font-mono text-xs text-dim">
                          <span>Squad: </span>
                          <span className="text-ink">
                            {team.members.map((m: any) => typeof m === 'string' ? m : m.username || m.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* CREATE GAME MODAL */}
      {isCreateGameOpen && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-xl max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-white/20 bg-graphite p-6 shadow-2xl select-text">
              <h3 className="font-display text-2xl font-black uppercase text-cyan">Add Sanctioned Game Title</h3>
              <form onSubmit={handleCreateGameSubmit} className="mt-4 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-dim">Game Slug (Unique ID)</label>
                    <input required placeholder="e.g. apex-legends" value={newGame.slug} onChange={(e) => setNewGame({ ...newGame, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
                  </div>
                  <div>
                    <label className="text-dim">Game Name</label>
                    <input required placeholder="e.g. Apex Legends" value={newGame.name} onChange={(e) => setNewGame({ ...newGame, name: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-dim">Category</label>
                    <select
                      value={newGame.category}
                      onChange={(e) => setNewGame({ ...newGame, category: e.target.value })}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none"
                    >
                      {CANONICAL_CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-dim">Genre Category</label>
                    <select
                      value={newGame.genre_id || ''}
                      onChange={(e) => {
                        const selId = e.target.value
                        const matchG = genres.find(g => (g.id || (g as any)._id) === selId || g.slug === selId)
                        setNewGame({
                          ...newGame,
                          genre_id: selId,
                          genre_name: matchG ? matchG.name : '',
                        })
                      }}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none"
                    >
                      <option value="">No Genre Assigned</option>
                      {genres.map((g) => (
                        <option key={g.id || (g as any)._id || g.slug} value={g.id || (g as any)._id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-dim">Platform</label>
                    <select value={newGame.platform} onChange={(e) => setNewGame({ ...newGame, platform: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none">
                      <option value="PC">PC</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Console">Console</option>
                      <option value="Cross-Platform">Cross-Platform</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-dim">Tag</label>
                    <input required placeholder="e.g. BATTLE ROYALE" value={newGame.tag} onChange={(e) => setNewGame({ ...newGame, tag: e.target.value.toUpperCase() })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-dim">Min Squad Size</label>
                    <input required type="number" min="1" max="10" value={newGame.min_team_size} onChange={(e) => setNewGame({ ...newGame, min_team_size: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                  </div>
                  <div>
                    <label className="text-dim">Max Squad Size</label>
                    <input required type="number" min="1" max="10" value={newGame.max_team_size} onChange={(e) => setNewGame({ ...newGame, max_team_size: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                  </div>
                  <div>
                    <label className="text-dim">Substitutes</label>
                    <input required type="number" min="0" max="5" value={newGame.max_substitutes} onChange={(e) => setNewGame({ ...newGame, max_substitutes: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-dim">Server Region</label>
                  <input required placeholder="e.g. Mumbai, India / Singapore" value={newGame.server_region} onChange={(e) => setNewGame({ ...newGame, server_region: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Anti-Cheat System</label>
                  <input required placeholder="e.g. Easy Anti-Cheat" value={newGame.anti_cheat} onChange={(e) => setNewGame({ ...newGame, anti_cheat: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Description</label>
                  <textarea rows={3} value={newGame.description} onChange={(e) => setNewGame({ ...newGame, description: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsCreateGameOpen(false)} className="border border-white/20 px-3 py-1.5 uppercase text-dim cursor-pointer">Cancel</button>
                  <button type="submit" className="border border-cyan bg-cyan px-5 py-1.5 uppercase text-void font-bold cursor-pointer">Register Game</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* EDIT GAME MODAL */}
      {editingGame && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-xl max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-white/20 bg-graphite p-6 shadow-2xl select-text">
              <h3 className="font-display text-2xl font-black uppercase text-cyan">Edit Game {editingGame.name}</h3>
              <form onSubmit={handleUpdateGameSubmit} className="mt-4 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-dim">Game Name</label>
                    <input required value={editingGame.name} onChange={(e) => setEditingGame({ ...editingGame, name: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                  </div>
                  <div>
                    <label className="text-dim">Tag</label>
                    <input required value={editingGame.tag} onChange={(e) => setEditingGame({ ...editingGame, tag: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-dim">Platform</label>
                    <input required value={editingGame.platform} onChange={(e) => setEditingGame({ ...editingGame, platform: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                  </div>
                  <div>
                    <label className="text-dim">Category</label>
                    <select
                      value={editingGame.category}
                      onChange={(e) => setEditingGame({ ...editingGame, category: e.target.value })}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none"
                    >
                      {CANONICAL_CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                      {!CANONICAL_CATEGORIES.some((c) => c.slug === editingGame.category) && (
                        <option value={editingGame.category}>{editingGame.category}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-dim">Genre Category</label>
                    <select
                      value={editingGame.genre_id || ''}
                      onChange={(e) => {
                        const selId = e.target.value
                        const matchG = genres.find(g => (g.id || (g as any)._id) === selId || g.slug === selId)
                        setEditingGame({
                          ...editingGame,
                          genre_id: selId,
                          genre_name: matchG ? matchG.name : undefined,
                        })
                      }}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none"
                    >
                      <option value="">No Genre Assigned</option>
                      {genres.map((g) => (
                        <option key={g.id || (g as any)._id || g.slug} value={g.id || (g as any)._id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-dim">Min Squad Size</label>
                    <input required type="number" value={editingGame.min_team_size} onChange={(e) => setEditingGame({ ...editingGame, min_team_size: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                  </div>
                  <div>
                    <label className="text-dim">Max Squad Size</label>
                    <input required type="number" value={editingGame.max_team_size} onChange={(e) => setEditingGame({ ...editingGame, max_team_size: Number(e.target.value) })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-dim">Server Region</label>
                  <input required value={editingGame.server_region} onChange={(e) => setEditingGame({ ...editingGame, server_region: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Anti-Cheat</label>
                  <input required value={editingGame.anti_cheat} onChange={(e) => setEditingGame({ ...editingGame, anti_cheat: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div>
                  <label className="text-dim">Description</label>
                  <textarea rows={3} value={editingGame.description || ''} onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })} className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none" />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingGame(null)} className="border border-white/20 px-3 py-1.5 uppercase text-dim cursor-pointer">Cancel</button>
                  <button type="submit" className="border border-cyan bg-cyan px-5 py-1.5 uppercase text-void font-bold cursor-pointer">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}


      {/* CREATE GENRE MODAL */}
      {isCreateGenreOpen && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-xl max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-white/20 bg-graphite p-6 shadow-2xl select-text">
              <h3 className="font-display text-2xl font-black uppercase text-cyan">Create Dynamic Genre</h3>
              <p className="text-xs text-dim mt-1">Configure parent genre category that will aggregate multiple game titles.</p>
              <form onSubmit={handleCreateGenreSubmit} className="mt-4 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-dim">Genre Name</label>
                    <input
                      required
                      placeholder="e.g. Battle Royale"
                      value={newGenre.name}
                      onChange={(e) => {
                        const name = e.target.value
                        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                        setNewGenre({ ...newGenre, name, slug: newGenre.slug ? newGenre.slug : slug })
                      }}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>
                  <div>
                    <label className="text-dim">Unique Slug</label>
                    <input
                      required
                      placeholder="e.g. battle-royale"
                      value={newGenre.slug || ''}
                      onChange={(e) => setNewGenre({ ...newGenre, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-dim">Rotation Interval (Seconds)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={newGenre.rotation_interval_seconds ?? 4}
                      onChange={(e) => setNewGenre({ ...newGenre, rotation_interval_seconds: Number(e.target.value) })}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                    <p className="text-[10px] text-dim mt-0.5">Speed for cycling logos on public card</p>
                  </div>
                  <div>
                    <label className="text-dim">Display Order</label>
                    <input
                      type="number"
                      min="0"
                      value={newGenre.display_order ?? 0}
                      onChange={(e) => setNewGenre({ ...newGenre, display_order: Number(e.target.value) })}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                    <p className="text-[10px] text-dim mt-0.5">Priority in public grid (lower = first)</p>
                  </div>
                </div>

                <div>
                  <label className="text-dim">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Tactical high-stakes survivals, battle zones and drop ins..."
                    value={newGenre.description || ''}
                    onChange={(e) => setNewGenre({ ...newGenre, description: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                </div>

                <BannerImageUploader
                  label="Genre Banner Art (16:9 Desktop 1920x1080 / 4:3 Tablet 1200x900)"
                  recommendedRatio="16:9"
                  recommendedRes="1920x1080"
                  value={newGenre.banner_url || ''}
                  onChange={(val) => setNewGenre({ ...newGenre, banner_url: val })}
                />

                <BannerImageUploader
                  label="Genre Badge / Icon (1:1 Square 800x800 or SVG)"
                  recommendedRatio="1:1"
                  recommendedRes="800x800"
                  value={newGenre.icon_url || ''}
                  onChange={(val) => setNewGenre({ ...newGenre, icon_url: val })}
                />

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateGenreOpen(false)}
                    className="border border-white/20 px-3 py-1.5 uppercase text-dim cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="border border-cyan bg-cyan px-5 py-1.5 uppercase text-void font-bold cursor-pointer"
                  >
                    Create Genre
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* EDIT GENRE MODAL */}
      {editingGenre && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-xl max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-white/20 bg-graphite p-6 shadow-2xl select-text">
              <h3 className="font-display text-2xl font-black uppercase text-cyan">Edit Genre: {editingGenre.name}</h3>
              <p className="text-xs text-dim mt-1">Update parameters, artwork presets, or public visibility.</p>
              <form onSubmit={handleUpdateGenreSubmit} className="mt-4 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-dim">Genre Name</label>
                    <input
                      required
                      value={editingGenre.name}
                      onChange={(e) => setEditingGenre({ ...editingGenre, name: e.target.value })}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>
                  <div>
                    <label className="text-dim">Unique Slug</label>
                    <input
                      required
                      value={editingGenre.slug}
                      onChange={(e) => setEditingGenre({ ...editingGenre, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-dim">Rotation Interval (Seconds)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={editingGenre.rotation_interval_seconds ?? 4}
                      onChange={(e) => setEditingGenre({ ...editingGenre, rotation_interval_seconds: Number(e.target.value) })}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>
                  <div>
                    <label className="text-dim">Display Order</label>
                    <input
                      type="number"
                      min="0"
                      value={editingGenre.display_order ?? 0}
                      onChange={(e) => setEditingGenre({ ...editingGenre, display_order: Number(e.target.value) })}
                      className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-dim">Visibility Status</label>
                  <select
                    value={editingGenre.is_active ? 'true' : 'false'}
                    onChange={(e) => setEditingGenre({ ...editingGenre, is_active: e.target.value === 'true' })}
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none"
                  >
                    <option value="true">Active & Visible in Catalog</option>
                    <option value="false">Inactive / Hidden</option>
                  </select>
                </div>

                <div>
                  <label className="text-dim">Description</label>
                  <textarea
                    rows={2}
                    value={editingGenre.description || ''}
                    onChange={(e) => setEditingGenre({ ...editingGenre, description: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                </div>

                <BannerImageUploader
                  label="Genre Banner Art (16:9 Desktop / 4:3 Tablet)"
                  recommendedRatio="16:9"
                  recommendedRes="1920x1080"
                  value={editingGenre.banner_url || ''}
                  onChange={(val) => setEditingGenre((prev) => prev ? { ...prev, banner_url: val } : null)}
                />

                <BannerImageUploader
                  label="Genre Badge / Icon (1:1 Square 800x800 or SVG)"
                  recommendedRatio="1:1"
                  recommendedRes="800x800"
                  value={editingGenre.icon_url || ''}
                  onChange={(val) => setEditingGenre((prev) => prev ? { ...prev, icon_url: val } : null)}
                />

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingGenre(null)}
                    className="border border-white/20 px-3 py-1.5 uppercase text-dim cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="border border-cyan bg-cyan px-5 py-1.5 uppercase text-void font-bold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* MANAGE GENRE GAMES MODAL */}
      {managingGenre && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-xl max-h-[min(90vh,calc(100svh-2rem))] flex flex-col border border-white/20 bg-graphite p-6 shadow-2xl overflow-hidden select-text">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
                <div>
                  <h3 className="font-display text-2xl font-black uppercase text-cyan">
                    Assign Games: {managingGenre.name}
                  </h3>
                  <p className="font-mono text-xs text-dim">
                    Manage member games aggregated under the "{managingGenre.name}" canonical genre.
                  </p>
                </div>
                <button
                  onClick={() => setManagingGenre(null)}
                  className="font-mono text-xs uppercase text-dim hover:text-ink cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {/* Current Connected Games */}
              <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="flex items-center justify-between font-mono text-xs text-dim">
                  <span className="uppercase font-bold text-ink">Connected Games ({managingGenre.games?.length || 0})</span>
                  <span>Cycling in public genre cards</span>
                </div>

                {(!managingGenre.games || managingGenre.games.length === 0) ? (
                  <div className="border border-dashed border-white/15 p-6 text-center font-mono text-xs text-dim">
                    No games currently assigned to this genre. Use the selector below to link games.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {managingGenre.games.map((g) => (
                      <div
                        key={g.id || g.slug}
                        className="border border-white/10 bg-surface p-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {g.logo_url ? (
                            <img
                              src={resolveMediaUrl(g.logo_url)}
                              alt=""
                              className="size-7 object-contain bg-void p-0.5 border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="size-7 bg-void border border-white/10 flex items-center justify-center font-mono text-[9px] text-dim shrink-0">
                              🎮
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-display font-black uppercase text-ink text-sm truncate">
                              {g.title}
                            </div>
                            <div className="font-mono text-[10px] text-dim">{g.slug}</div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleRemoveGameFromGenreAction(
                              managingGenre.id || (managingGenre as any)._id,
                              g.id
                            )
                          }
                          disabled={isAssigningGame}
                          className="border border-live/40 bg-live/10 px-2.5 py-1 font-mono text-[10px] uppercase text-live hover:bg-live/25 transition-colors cursor-pointer shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assign New Game to Genre */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <label className="font-mono text-xs uppercase font-bold text-ink block">
                    + Add Game Title to this Genre
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedGameToAdd}
                      onChange={(e) => setSelectedGameToAdd(e.target.value)}
                      className="flex-1 border border-white/15 bg-surface p-2 font-mono text-xs text-ink outline-none focus:border-cyan"
                    >
                      <option value="">-- Select Game to Add --</option>
                      {games
                        .filter(
                          (gm) =>
                            !managingGenre.games?.some(
                              (connected) =>
                                connected.id === gm.id ||
                                connected.id === (gm as any)._id ||
                                connected.slug === gm.slug
                            )
                        )
                        .map((gm) => (
                          <option key={gm.id || gm.slug} value={gm.id || (gm as any)._id || gm.slug}>
                            {gm.name} ({gm.category || gm.tag})
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedGameToAdd || isAssigningGame}
                      onClick={() =>
                        handleAddGameToGenreAction(
                          managingGenre.id || (managingGenre as any)._id,
                          selectedGameToAdd
                        )
                      }
                      className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs uppercase text-void font-bold hover:brightness-110 disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {isAssigningGame ? 'Linking...' : '+ Link Game'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setManagingGenre(null)}
                  className="border border-white/20 px-4 py-1.5 font-mono text-xs uppercase text-dim hover:text-ink cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODERATE REVIEW MODAL */}
      {selectedReviewForMod && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-lg max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto border border-white/20 bg-graphite p-6 shadow-2xl select-text">
              <h3 className="font-display text-2xl font-black uppercase text-cyan">
                Moderate Review: {selectedReviewForMod.user_name || 'Contender'}
              </h3>
              <p className="font-mono text-xs text-dim mt-1">
                Rating: {'★'.repeat(selectedReviewForMod.rating)} ({selectedReviewForMod.rating}/5) · Category: {selectedReviewForMod.category}
              </p>
              <div className="mt-3 p-3 border border-white/10 bg-surface/50 font-mono text-xs italic text-ink/90">
                "{selectedReviewForMod.review_text}"
              </div>

              <div className="mt-4 space-y-3 font-mono text-xs">
                <div>
                  <label className="text-dim">Moderation Status</label>
                  <select
                    value={modStatus}
                    onChange={(e) => setModStatus(e.target.value as any)}
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none"
                  >
                    <option value="APPROVED">APPROVED (Publicly Visible)</option>
                    <option value="FEATURED">FEATURED (Spotlight Hero Badge)</option>
                    <option value="PENDING">PENDING (Under Audit)</option>
                    <option value="HIDDEN">HIDDEN (Moderated Out)</option>
                  </select>
                </div>

                <div>
                  <label className="text-dim">Internal Admin Notes / Audit Rationale</label>
                  <textarea
                    rows={3}
                    value={modNotes}
                    onChange={(e) => setModNotes(e.target.value)}
                    placeholder="e.g. Verified champion feedback; featured on public reviews wall."
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReviewForMod(null)}
                    className="border border-white/20 px-3 py-1.5 uppercase text-dim cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModerateReviewAction(selectedReviewForMod.id, modStatus, modNotes)}
                    className="border border-cyan bg-cyan px-5 py-1.5 uppercase text-void font-bold cursor-pointer"
                  >
                    Apply Moderation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* SUPPORT TICKET CONVERSATION THREAD MODAL */}
      {activeTicketThread && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none">
            <div className="relative w-full max-w-2xl border border-white/20 bg-graphite max-h-[min(90vh,calc(100svh-2rem))] flex flex-col shadow-2xl overflow-hidden font-mono select-text">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 p-5 shrink-0 bg-surface/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan font-bold text-sm">[{activeTicketThread.ticket_id || activeTicketThread.id}]</span>
                    <span className="border border-white/20 px-2 py-0.5 text-[10px] text-dim uppercase">
                      {activeTicketThread.category}
                    </span>
                    <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${formatTicketStatus(activeTicketThread.status).badgeClass}`}>
                      {formatTicketStatus(activeTicketThread.status).label}
                    </span>
                    <span className="flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] text-emerald-400 font-bold uppercase tracking-wider rounded-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Live Sync</span>
                    </span>
                  </div>
                  <div className="text-xs text-ink font-bold mt-1">
                    {activeTicketThread.name || 'Contender'} · <span className="text-dim">{activeTicketThread.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={formatTicketStatus(activeTicketThread.status).value}
                    onChange={async (e) => {
                      const newSt = e.target.value
                      await handleUpdateTicketStatus(activeTicketThread.id || activeTicketThread.ticket_id, newSt)
                    }}
                    className={`border p-1 text-[11px] font-bold outline-none uppercase bg-graphite cursor-pointer ${
                      formatTicketStatus(activeTicketThread.status).badgeClass
                    }`}
                  >
                    {SUPPORT_TICKET_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-graphite text-ink">
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={async () => {
                      const tid = activeTicketThread.id || activeTicketThread.ticket_id
                      const isCurrentlyArchived = Boolean(
                        activeTicketThread.is_archived === true ||
                        String(activeTicketThread.is_archived).toLowerCase() === 'true' ||
                        activeTicketThread.status === 'ARCHIVED'
                      )
                      try {
                        if (isCurrentlyArchived) {
                          await restoreSupportTicket(tid)
                          showToast(`Ticket ${tid} restored to active queue.`)
                        } else {
                          await archiveSupportTicket(tid)
                          showToast(`Ticket ${tid} archived.`)
                        }
                        setActiveTicketThread((prev: any) => prev ? { ...prev, is_archived: !isCurrentlyArchived } : null)
                        await loadSupportTicketsData(supportShowArchived, supportSearchTerm)
                      } catch (err: any) {
                        alert(err.message || 'Archive operation failed')
                      }
                    }}
                    className={`border px-2.5 py-1 text-[11px] font-bold uppercase transition-colors ${
                      Boolean(
                        activeTicketThread.is_archived === true ||
                        String(activeTicketThread.is_archived).toLowerCase() === 'true' ||
                        activeTicketThread.status === 'ARCHIVED'
                      )
                        ? 'border-ok/40 bg-ok/10 text-ok hover:bg-ok/20'
                        : 'border-white/15 bg-surface text-dim hover:text-ink hover:border-white/30'
                    }`}
                  >
                    {Boolean(
                      activeTicketThread.is_archived === true ||
                      String(activeTicketThread.is_archived).toLowerCase() === 'true' ||
                      activeTicketThread.status === 'ARCHIVED'
                    )
                      ? 'Restore Ticket'
                      : 'Archive Ticket'}
                  </button>

                  <button
                    onClick={() => setActiveTicketThread(null)}
                    className="text-dim hover:text-ink text-xs uppercase border border-white/15 px-2.5 py-1 cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Conversation Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                {/* Initial Issue Card */}
                <div className="border border-white/10 bg-surface/30 p-4 rounded space-y-2">
                  <div className="flex justify-between text-[10px] text-dim">
                    <span>INITIAL SUBMISSION DETAILS</span>
                    <span>{new Date(activeTicketThread.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-ink/90 whitespace-pre-wrap">{activeTicketThread.description}</p>
                  {activeTicketThread.internal_notes && (
                    <div className="text-amber-400/90 text-[11px] pt-2 border-t border-white/5">
                      Internal Notes: {activeTicketThread.internal_notes}
                    </div>
                  )}
                </div>

                {/* Message Thread */}
                <div className="space-y-3 pt-2">
                  <Hud className="text-dim">CONVERSATION THREAD</Hud>
                  {(!activeTicketThread.messages || activeTicketThread.messages.length === 0) ? (
                    <p className="text-dim text-[11px] italic">No replies dispatched yet. Compose an administrative reply below.</p>
                  ) : (
                    activeTicketThread.messages.map((m: any, idx: number) => {
                      const isSystem = m.message_type === 'SYSTEM' || m.sender_role === 'SYSTEM'
                      const isAdmin = !isSystem && (m.message_type === 'ADMIN' || m.sender_role === 'ADMIN' || m.direction === 'outbound' || m.sender_name?.includes('Admin') || m.sender_name?.includes('Arbiter'))

                      if (isSystem) {
                        return (
                          <div key={m.id || idx} className="flex flex-col items-center my-3">
                            <div className="flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3.5 py-1.5 rounded-full text-[10px] text-dim font-mono shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan/70 animate-pulse"></span>
                              <span className="text-cyan font-bold uppercase tracking-wider">SYSTEM CONFIRMATION DISPATCHED</span>
                              <span>•</span>
                              <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="text-[11px] text-dim/80 text-center max-w-md mt-1.5 italic font-mono">
                              {m.message || m.body_text || 'Automated confirmation receipt dispatched.'}
                            </div>
                          </div>
                        )
                      }

                      if (isAdmin) {
                        return (
                          <div
                            key={m.id || idx}
                            className="flex flex-col items-end my-1"
                          >
                            <div className="flex items-center gap-2 text-[10px] text-dim mb-1">
                              <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-cyan font-bold uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan"></span>
                                {m.sender_name || 'Admin Arbiter'}
                              </span>
                            </div>
                            <div className="max-w-[85%] sm:max-w-[75%] p-3.5 rounded-lg text-xs whitespace-pre-wrap bg-cyan/10 border border-cyan/35 text-ink shadow-sm">
                              <p className="whitespace-pre-wrap">{m.message || m.body_text}</p>
                              {m.attachments && m.attachments.length > 0 && (
                                <div className="mt-2.5 pt-2 border-t border-cyan/20 space-y-1">
                                  <span className="text-[10px] text-cyan/70 font-bold uppercase tracking-wider block">Attachments:</span>
                                  {m.attachments.map((att: any, attIdx: number) => (
                                    <a
                                      key={att.id || attIdx}
                                      href={att.url || '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-[11px] text-cyan hover:underline bg-cyan/15 px-2.5 py-1 rounded border border-cyan/25"
                                    >
                                      <span>📎</span>
                                      <span className="truncate">{att.filename}</span>
                                      {att.size > 0 && <span className="text-dim text-[10px]">({Math.round(att.size / 1024)} KB)</span>}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }

                      // User message
                      return (
                        <div
                          key={m.id || idx}
                          className="flex flex-col items-start my-1"
                        >
                          <div className="flex items-center gap-2 text-[10px] text-dim mb-1">
                            <span className="text-ink font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              {m.sender_name || activeTicketThread.name || 'Contender'}
                            </span>
                            {m.sender_email && <span className="text-dim/70 text-[9px]">&lt;{m.sender_email}&gt;</span>}
                            <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {m.direction === 'inbound' && (
                              <span className="border border-white/20 bg-white/[0.04] px-1.5 py-0.2 text-[9px] text-dim uppercase">
                                Inbound Email
                              </span>
                            )}
                          </div>
                          <div className="max-w-[85%] sm:max-w-[75%] p-3.5 rounded-lg text-xs whitespace-pre-wrap bg-surface border border-white/15 text-ink shadow-sm">
                            <p className="whitespace-pre-wrap">{m.message || m.body_text}</p>
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1">
                                <span className="text-[10px] text-dim font-bold uppercase tracking-wider block">Attachments:</span>
                                {m.attachments.map((att: any, attIdx: number) => (
                                  <a
                                    key={att.id || attIdx}
                                    href={att.url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-[11px] text-ink hover:text-cyan bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded border border-white/10 transition-colors"
                                  >
                                    <span>📎</span>
                                    <span className="truncate">{att.filename}</span>
                                    {att.size > 0 && <span className="text-dim text-[10px]">({Math.round(att.size / 1024)} KB)</span>}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={threadMessagesEndRef} />
                </div>
              </div>

              {/* Reply Composer Footer */}
              <div className="border-t border-white/10 p-4 shrink-0 bg-surface/80 space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-dim text-[11px]">Next Status upon Reply:</span>
                  <select
                    value={formatTicketStatus(ticketNextStatus).value}
                    onChange={(e) => setTicketNextStatus(e.target.value)}
                    className="border border-white/15 bg-surface p-1 text-[11px] text-ink outline-none uppercase cursor-pointer"
                  >
                    {SUPPORT_TICKET_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} {opt.value === 'WAITING_FOR_USER' ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  rows={3}
                  placeholder="Write reply to contender (will be dispatched via email and in-app notification)..."
                  value={ticketReplyText}
                  onChange={(e) => setTicketReplyText(e.target.value)}
                  className="w-full border border-white/15 bg-surface p-2.5 text-xs text-ink outline-none focus:border-cyan"
                />

                <div className="flex justify-between items-center">
                  <button
                    onClick={async () => {
                      try {
                        await retrySupportTicketEmail(activeTicketThread.id || activeTicketThread.ticket_id)
                        showToast('Confirmation email redelivery triggered.')
                      } catch (err: any) {
                        alert(err.message || 'Email dispatch failed')
                      }
                    }}
                    className="border border-white/15 px-3 py-1.5 text-[10px] uppercase text-dim hover:text-cyan cursor-pointer"
                  >
                    Retry Initial Confirmation Email
                  </button>

                  <button
                    disabled={isSubmittingTicketReply || !ticketReplyText.trim()}
                    onClick={async () => {
                      setIsSubmittingTicketReply(true)
                      try {
                        const updated = await replyToSupportTicket(
                          activeTicketThread.id || activeTicketThread.ticket_id,
                          ticketReplyText.trim(),
                          ticketNextStatus
                        )
                        setActiveTicketThread(updated)
                        setTicketReplyText('')
                        showToast('Reply dispatched to contender!')
                        loadSupportTicketsData(supportShowArchived, supportSearchTerm)
                      } catch (err: any) {
                        alert(err.message || 'Failed to send reply')
                      } finally {
                        setIsSubmittingTicketReply(false)
                      }
                    }}
                    className="border border-cyan bg-cyan px-5 py-2 text-xs uppercase text-void font-bold hover:brightness-110 disabled:opacity-40 cursor-pointer"
                  >
                    {isSubmittingTicketReply ? 'Dispatching...' : 'Dispatch Reply & Email'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ORGANIZER MATCH REQUEST ACTION MODAL */}
      {actioningRequest && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden font-mono text-xs select-none">
            <div className="relative w-full max-w-lg border border-white/20 bg-graphite max-h-[min(90vh,calc(100svh-2rem))] flex flex-col shadow-2xl overflow-hidden select-text">
              <div className="flex items-center justify-between border-b border-white/10 p-5 shrink-0 bg-surface/50">
                <div>
                  <Hud className="text-cyan">MATCH REQUEST ARBITRATION</Hud>
                  <h3 className="font-display text-xl font-black uppercase text-ink">Action Live Match Request</h3>
                </div>
                <button
                  onClick={() => setActioningRequest(null)}
                  className="text-dim hover:text-ink text-xs uppercase border border-white/15 px-2.5 py-1 cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="border border-white/10 bg-surface/40 p-3 space-y-1 rounded text-[11px]">
                  <div>Match: <strong className="text-ink">{actioningRequest.title || `${actioningRequest.team_a_name} vs ${actioningRequest.team_b_name}`}</strong></div>
                  <div>Tournament: <strong className="text-cyan">{actioningRequest.tournament_name || actioningRequest.tournament_id}</strong></div>
                  <div>Organizer: <strong className="text-ink">{actioningRequest.organizer_name}</strong> ({actioningRequest.organizer_email})</div>
                  {actioningRequest.round_name && <div>Round: {actioningRequest.round_name}</div>}
                  {actioningRequest.youtube_live_url && <div>Stream: <a href={actioningRequest.youtube_live_url} target="_blank" rel="noreferrer" className="text-cyan underline">{actioningRequest.youtube_live_url}</a></div>}
                  {actioningRequest.notes && <div>Organizer Notes: {actioningRequest.notes}</div>}
                </div>

                <div>
                  <label className="text-dim font-bold uppercase">Decision Status</label>
                  <select
                    value={actionReqStatus}
                    onChange={(e) => setActionReqStatus(e.target.value as any)}
                    className="mt-1 w-full border border-cyan/40 bg-surface p-2.5 text-cyan font-bold outline-none uppercase"
                  >
                    <option value="APPROVED">APPROVE REQUEST</option>
                    <option value="UNDER_REVIEW">SET UNDER REVIEW</option>
                    <option value="REJECTED">REJECT REQUEST</option>
                    <option value="CANCELLED">CANCEL REQUEST</option>
                    <option value="RESOLVED">RESOLVE REQUEST</option>
                  </select>
                </div>

                {actionReqStatus === 'APPROVED' && (
                  <label className="flex items-center gap-2 cursor-pointer text-ink text-xs">
                    <input
                      type="checkbox"
                      checked={actionReqMakeLive}
                      onChange={(e) => setActionReqMakeLive(e.target.checked)}
                    />
                    <span>Automatically set target match to LIVE status now</span>
                  </label>
                )}

                <div>
                  <label className="text-dim">Administrative Rationale / Notes</label>
                  <textarea
                    rows={3}
                    value={actionReqNotes}
                    onChange={(e) => setActionReqNotes(e.target.value)}
                    placeholder="Notes explaining approval or rejection reason..."
                    className="mt-1 w-full border border-white/15 bg-surface p-2.5 text-ink outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div className="border-t border-white/10 p-4 shrink-0 bg-graphite flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActioningRequest(null)}
                  className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReqAction}
                  onClick={async () => {
                    setIsSubmittingReqAction(true)
                    try {
                      await actionAdminMatchRequest(actioningRequest.id, {
                        status: actionReqStatus,
                        admin_notes: actionReqNotes.trim() || undefined,
                        make_match_live: actionReqMakeLive,
                      })
                      showToast(`Match request updated to ${actionReqStatus}!`)
                      setActioningRequest(null)
                      loadData()
                    } catch (err: any) {
                      alert(err.message || 'Failed to action request')
                    } finally {
                      setIsSubmittingReqAction(false)
                    }
                  }}
                  className="border border-cyan bg-cyan px-5 py-2 uppercase text-void font-bold hover:brightness-110 disabled:opacity-40 cursor-pointer"
                >
                  {isSubmittingReqAction ? 'Saving...' : 'Apply Decision'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ORGANIZER EMAIL THREAD DIALOGUE MODAL */}
      {activeOrgThread && (
        <Portal lockScroll>
          <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden font-mono text-xs select-none">
            <div className="relative w-full max-w-2xl border border-white/20 bg-graphite max-h-[min(90vh,calc(100svh-2rem))] flex flex-col shadow-2xl overflow-hidden select-text">
              <div className="flex items-center justify-between border-b border-white/10 p-5 shrink-0 bg-surface/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink text-sm">{activeOrgThread.subject}</span>
                    <span className={`px-2 py-0.5 border text-[10px] uppercase font-bold ${
                      activeOrgThread.status === 'RESOLVED' || activeOrgThread.status === 'CLOSED' ? 'border-ok text-ok bg-ok/10' :
                      activeOrgThread.status === 'WAITING_FOR_ADMIN' || activeOrgThread.status === 'UNREAD' ? 'border-live text-live bg-live/10' :
                      'border-magenta text-magenta bg-magenta/10'
                    }`}>
                      {activeOrgThread.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-dim mt-0.5">
                    Organizer: <strong className="text-ink">{activeOrgThread.organizer_name}</strong> ({activeOrgThread.organizer_email}) · Category: {activeOrgThread.category}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={activeOrgThread.status}
                    onChange={async (e) => {
                      const newSt = e.target.value
                      try {
                        await updateAdminOrganizerEmailStatus(activeOrgThread.id, newSt)
                        setActiveOrgThread({ ...activeOrgThread, status: newSt })
                        showToast(`Thread status updated to ${newSt}`)
                        loadData()
                      } catch (err: any) {
                        alert(err.message || 'Status update failed')
                      }
                    }}
                    className="border border-white/15 bg-surface p-1 text-[10px] text-magenta font-bold outline-none uppercase"
                  >
                    <option value="UNREAD">UNREAD</option>
                    <option value="OPEN">OPEN</option>
                    <option value="WAITING_FOR_ADMIN">WAITING FOR ADMIN</option>
                    <option value="WAITING_FOR_ORGANIZER">WAITING FOR ORGANIZER</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>

                  <button
                    onClick={() => setActiveOrgThread(null)}
                    className="text-dim hover:text-ink text-xs uppercase border border-white/15 px-2.5 py-1 cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {(!activeOrgThread.messages || activeOrgThread.messages.length === 0) ? (
                  <p className="text-dim italic">No messages found in this dialogue.</p>
                ) : (
                  activeOrgThread.messages.map((m: any, idx: number) => {
                    const isAdmin = m.sender_role === 'ADMIN'
                    return (
                      <div key={m.id || idx} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 text-[10px] text-dim mb-1">
                          <span className={isAdmin ? 'text-cyan font-bold' : 'text-magenta font-bold'}>
                            {m.sender_name || (isAdmin ? 'Admin' : 'Organizer')}
                          </span>
                          <span>{new Date(m.created_at).toLocaleString()}</span>
                        </div>
                        <div
                          className={`max-w-[85%] p-3 rounded text-xs whitespace-pre-wrap ${
                            isAdmin
                              ? 'bg-cyan/15 border border-cyan/30 text-ink'
                              : 'bg-magenta/15 border border-magenta/30 text-ink'
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Reply Composer */}
              <div className="border-t border-white/10 p-4 shrink-0 bg-surface/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dim text-[11px]">Next Status upon Reply:</span>
                  <select
                    value={orgThreadNextStatus}
                    onChange={(e) => setOrgThreadNextStatus(e.target.value)}
                    className="border border-white/15 bg-surface p-1 text-[11px] text-ink outline-none uppercase"
                  >
                    <option value="WAITING_FOR_ORGANIZER">WAITING FOR ORGANIZER</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="OPEN">OPEN</option>
                  </select>
                </div>

                <textarea
                  rows={3}
                  placeholder="Compose reply to organizer (dispatched via Brevo email and organizer panel)..."
                  value={orgThreadReplyText}
                  onChange={(e) => setOrgThreadReplyText(e.target.value)}
                  className="w-full border border-white/15 bg-surface p-2.5 text-xs text-ink outline-none focus:border-cyan"
                />

                <div className="flex justify-end">
                  <button
                    disabled={isSubmittingOrgReply || !orgThreadReplyText.trim()}
                    onClick={async () => {
                      setIsSubmittingOrgReply(true)
                      try {
                        const updated = await replyAdminOrganizerEmail(
                          activeOrgThread.id,
                          orgThreadReplyText.trim(),
                          orgThreadNextStatus
                        )
                        setActiveOrgThread(updated)
                        setOrgThreadReplyText('')
                        showToast('Reply dispatched to organizer!')
                        loadData()
                      } catch (err: any) {
                        alert(err.message || 'Failed to dispatch reply')
                      } finally {
                        setIsSubmittingOrgReply(false)
                      }
                    }}
                    className="border border-magenta bg-magenta px-5 py-2 text-xs uppercase text-void font-bold hover:brightness-110 disabled:opacity-40 cursor-pointer"
                  >
                    {isSubmittingOrgReply ? 'Dispatching...' : 'Dispatch Reply to Organizer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}

