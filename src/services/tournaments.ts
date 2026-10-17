import { apiClient } from './apiClient'

export interface TournamentRoster {
  tag: string
  name: string
  captain: string
  members: string[]
}

export interface TournamentMatchSummary {
  id: string
  round: number
  round_name?: string
  team1_name?: string
  team2_name?: string
  winner_name?: string
  status: string
  scheduled_time?: string
}

export interface Tournament {
  id: string
  _id?: string
  slug: string
  title: string
  description?: string
  game_id: string
  game_name?: string
  game_title?: string
  format: string
  status: string
  max_teams: number
  registered_teams: number
  min_team_size: number
  max_team_size: number
  start_date: string
  end_date?: string
  registration_deadline?: string
  banner_url?: string
  hero_banner_url?: string
  banner_tablet_url?: string
  banner_mobile_url?: string
  logo_url?: string
  prize_pool_inr: number
  entry_fee_inr: number
  rules?: string[] | any
  schedule?: any[] | any
  prizes?: any[] | any
  bracket_rounds?: any[] | any
  registered_rosters?: TournamentRoster[]
  matches_summary?: TournamentMatchSummary[]
  is_registered?: boolean
  is_featured?: boolean
  live_stream_url?: string
  stream_url?: string
  registration_status?: string
  whatsapp_group_url?: string
  discord_url?: string
  community_link?: string
  starts_at?: string
  roster_lock_time?: string
  server_region?: string
  media_config?: Record<string, any>
}

export interface NormalizedTournament {
  id: string
  slug: string
  title: string
  description: string
  gameId: string
  gameName: string
  format: string
  status: string
  maxTeams: number
  registeredTeams: number
  confirmedTeams: number
  reservedTeams: number
  availableSlots: number
  minTeamSize: number
  maxTeamSize: number
  startDate: string
  endDate?: string
  registrationDeadline?: string
  startsAt?: string
  rosterLockTime?: string
  serverRegion?: string
  announcementText?: string
  whatsappGroupUrl?: string
  discordUrl?: string
  discord_url?: string
  communityLink?: string
  bannerUrl?: string
  heroBannerUrl?: string
  bannerTabletUrl?: string
  bannerMobileUrl?: string
  logoUrl?: string
  banner_url?: string
  hero_banner_url?: string
  banner_tablet_url?: string
  banner_mobile_url?: string
  logo_url?: string
  prizePoolInr: number
  entryFeeInr: number
  rules: string[]
  schedule: any[]
  prizes: any[]
  bracketRounds: any[]
  standings?: any[]
  registeredRosters: TournamentRoster[]
  matchesSummary: TournamentMatchSummary[]
  isRegistered?: boolean
  isFeatured?: boolean
  media_config?: Record<string, any>
  mediaConfig?: Record<string, any>
}

export function getRequiredTeamSizeDisplay(tour: NormalizedTournament | Tournament | null | undefined): string {
  if (!tour) return 'Squad Roster (4–5 Players)'
  const min = (tour as any).minTeamSize ?? (tour as any).min_team_size
  const max = (tour as any).maxTeamSize ?? (tour as any).max_team_size
  const fmt = ((tour as any).format || '').toLowerCase()
  const game = (((tour as any).gameId || (tour as any).game_slug || (tour as any).gameName || '') + '').toLowerCase()

  if (fmt.includes('solo') || fmt.includes('1v1') || game.includes('chess') || (min === 1 && max === 1)) {
    return '1 Player (Solo)'
  }
  if (fmt.includes('duo') || fmt.includes('2v2') || (min === 2 && max === 2)) {
    return '2 Players (Duo)'
  }
  if (fmt.includes('trio') || fmt.includes('3v3') || (min === 3 && max === 3)) {
    return '3 Players (Trio)'
  }

  // Determine game-specific squad defaults if min is missing or <= 0
  let defaultMin = 4
  let defaultMax = 5
  if (game.includes('valorant') || game.includes('cs2') || game.includes('counter-strike')) {
    defaultMin = 5
    defaultMax = 5
  } else if (game.includes('chess')) {
    defaultMin = 1
    defaultMax = 1
  }

  const safeMin = Math.max(1, Number(min && Number(min) > 0 ? min : defaultMin))
  const safeMax = Math.max(safeMin, Number(max && Number(max) >= safeMin ? max : defaultMax))

  if (safeMin === 1 && safeMax === 1) {
    return '1 Player (Solo)'
  }
  if (safeMin === safeMax) {
    return `${safeMin} Players (Squad)`
  }
  return `${safeMin}–${safeMax} Players (Squad)`
}

export function normalizeTournament(t: Tournament): NormalizedTournament {
  const parseJsonField = (field: any, fallback: any[] = []): any[] => {
    if (!field) return fallback
    if (Array.isArray(field)) return field
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field)
        return Array.isArray(parsed) ? parsed : fallback
      } catch {
        return fallback
      }
    }
    return fallback
  }

  // Exact registered teams count from API — zero stays zero!
  const regCount =
    t.registered_teams !== undefined && t.registered_teams !== null
      ? Number(t.registered_teams)
      : (t as any).registeredTeams !== undefined && (t as any).registeredTeams !== null
      ? Number((t as any).registeredTeams)
      : 0

  const confirmedTeams = (t as any).confirmed_teams !== undefined ? Number((t as any).confirmed_teams) : regCount
  const reservedTeams = (t as any).reserved_teams !== undefined ? Number((t as any).reserved_teams) : 0
  const maxTeams = t.max_teams || (t as any).maxTeams || 16
  const availableSlots = (t as any).available_slots !== undefined ? Number((t as any).available_slots) : Math.max(0, maxTeams - confirmedTeams - reservedTeams)

  const bannerUrl = t.banner_url || (t as any).bannerUrl || ''
  const heroBannerUrl = t.hero_banner_url || (t as any).heroBannerUrl || bannerUrl
  const bannerTabletUrl = t.banner_tablet_url || (t as any).bannerTabletUrl || bannerUrl
  const bannerMobileUrl = t.banner_mobile_url || (t as any).bannerMobileUrl || bannerUrl
  const logoUrl = t.logo_url || (t as any).logoUrl || ''
  const mediaConfig = t.media_config || (t as any).mediaConfig || {}

  const rawGameId = t.game_id || (t as any).game_slug || (t as any).gameId || (t as any).game || ''
  const rawGameName = t.game_name || (t as any).gameName || (t as any).game_slug || (t as any).game || t.game_id || 'Esports'

  const rawMin = t.min_team_size ?? (t as any).minTeamSize
  const rawMax = t.max_team_size ?? (t as any).maxTeamSize
  const formatLower = (t.format || '').toLowerCase()
  const gameLower = (rawGameId + ' ' + rawGameName).toLowerCase()

  const isSolo = formatLower.includes('solo') || formatLower.includes('1v1') || gameLower.includes('chess') || (rawMin === 1 && rawMax === 1)
  const isDuo = formatLower.includes('duo') || formatLower.includes('2v2') || (rawMin === 2 && rawMax === 2)
  const isTrio = formatLower.includes('trio') || formatLower.includes('3v3') || (rawMin === 3 && rawMax === 3)

  let gameDefaultMin = 4
  let gameDefaultMax = 5
  if (isSolo) {
    gameDefaultMin = 1
    gameDefaultMax = 1
  } else if (isDuo) {
    gameDefaultMin = 2
    gameDefaultMax = 2
  } else if (isTrio) {
    gameDefaultMin = 3
    gameDefaultMax = 3
  } else if (gameLower.includes('valorant') || gameLower.includes('cs2') || gameLower.includes('counter-strike')) {
    gameDefaultMin = 5
    gameDefaultMax = 5
  }

  const safeMin = Math.max(1, Number(rawMin && Number(rawMin) > 0 ? rawMin : gameDefaultMin))
  const safeMax = Math.max(safeMin, Number(rawMax && Number(rawMax) >= safeMin ? rawMax : gameDefaultMax))

  return {
    id: t.id || t._id || t.slug,
    slug: t.slug || t.id,
    title: t.title || (t as any).name || 'Tournament',
    description: t.description || '',
    gameId: rawGameId,
    gameName: rawGameName,
    format: t.format || (t as any).tournament_type || (t as any).match_format || 'Knockout',
    status: t.status,
    maxTeams,
    registeredTeams: regCount,
    confirmedTeams,
    reservedTeams,
    availableSlots,
    minTeamSize: safeMin,
    maxTeamSize: safeMax,
    startDate: t.start_date || (t as any).starts_at || (t as any).startsAt || '',
    endDate: t.end_date,
    registrationDeadline: t.registration_deadline,
    startsAt: t.starts_at || (t as any).startsAt || t.start_date,
    rosterLockTime: t.roster_lock_time || (t as any).rosterLockTime,
    serverRegion: t.server_region || (t as any).serverRegion || 'AWS Mumbai (ap-south-1)',
    announcementText: (t as any).announcement_text || (t as any).announcementText,
    whatsappGroupUrl: t.whatsapp_group_url || (t as any).whatsappGroupUrl,
    discordUrl: t.discord_url || (t as any).discordUrl,
    discord_url: t.discord_url || (t as any).discordUrl,
    communityLink: t.community_link || (t as any).communityLink,
    bannerUrl,
    heroBannerUrl,
    bannerTabletUrl,
    bannerMobileUrl,
    logoUrl,
    banner_url: bannerUrl,
    hero_banner_url: heroBannerUrl,
    banner_tablet_url: bannerTabletUrl,
    banner_mobile_url: bannerMobileUrl,
    logo_url: logoUrl,
    prizePoolInr: t.prize_pool_inr || 0,
    entryFeeInr: t.entry_fee_inr || 0,
    rules: parseJsonField(t.rules),
    schedule: parseJsonField(t.schedule),
    prizes: parseJsonField(t.prizes),
    bracketRounds: parseJsonField(t.bracket_rounds),
    standings: (t as any).standings || [],
    registeredRosters: t.registered_rosters || [],
    matchesSummary: t.matches_summary || [],
    isRegistered: t.is_registered,
    isFeatured: Boolean(t.is_featured ?? (t as any).isFeatured),
    media_config: mediaConfig,
    mediaConfig,
  }
}

export async function getTournaments(params?: {
  game?: string
  status?: string
  search?: string
  include_drafts?: boolean
}): Promise<Tournament[]> {
  const searchParams = new URLSearchParams()
  if (params?.game) searchParams.set('game', params.game)
  if (params?.status) searchParams.set('status', params.status)
  if (params?.search) searchParams.set('search', params.search.trim())
  if (params?.include_drafts) searchParams.set('include_drafts', 'true')
  const q = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return apiClient<Tournament[]>(`/tournaments${q}`)
}

export async function getFeaturedTournament(): Promise<Tournament | null> {
  try {
    // Authoritative backend API is the single source of truth across all browsers
    const res = await apiClient<Tournament>('/tournaments/featured')
    if (res && (res.id || res.slug)) return res
  } catch {
    // API endpoint might not be available or 404
  }
  return null
}

export async function setFeaturedTournament(id: string): Promise<any> {
  try {
    localStorage.removeItem('ametheus_homepage_featured_tournament_id')
  } catch {}
  return await apiClient(`/tournaments/${id}/feature`, {
    method: 'POST',
  })
}

export async function getTournamentBySlug(slugOrId: string): Promise<Tournament> {
  return apiClient<Tournament>(`/tournaments/${slugOrId}`)
}

export async function registerTeamForTournament(
  tournamentId: string,
  payload: { team_id?: string; selected_roster_ids?: string[] }
): Promise<any> {
  return apiClient(`/tournaments/${tournamentId}/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface DirectUpiInitResponse {
  payment_id: string
  tournament_id: string
  team_id: string
  amount_inr: number
  upi_id: string
  payee_name: string
  upi_intent_url: string
  qr_code_data: string
  instructions: string[]
  expires_in_minutes: number
}

export async function registerTournamentDirectUpi(
  tournamentId: string,
  payload: { team_id?: string; selected_roster_ids?: string[] }
): Promise<DirectUpiInitResponse> {
  return apiClient<DirectUpiInitResponse>(`/tournaments/${tournamentId}/register/upi`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function submitTournamentUpiUtr(
  tournamentId: string,
  payload: {
    payment_id: string
    utr: string
    screenshot_url?: string
    sender_upi_id?: string
    sender_name?: string
    game_id?: string
    in_game_id?: string
  }
): Promise<any> {
  return apiClient(`/tournaments/${tournamentId}/submit-upi-utr`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getTournamentMatches(slugOrId: string): Promise<any[]> {
  return apiClient<any[]>(`/tournaments/${slugOrId}/matches`)
}

export async function getTournamentRegistrations(tournamentId: string): Promise<any[]> {
  return apiClient<any[]>(`/tournaments/${tournamentId}/registrations`)
}

export interface UserRegistrationItem {
  registration_id: string
  tournament_id: string
  tournament_title: string
  tournament_slug: string
  tournament_status: string
  starts_at: string
  game_slug: string
  game_name: string
  banner_url?: string
  prize_pool_inr: number
  entry_fee_inr: number
  payment_status: string
  check_in_status: string
  registered_at: string
  team_id?: string
  team_name?: string
  team_tag?: string
}

export async function getMyRegistrations(): Promise<UserRegistrationItem[]> {
  return apiClient<UserRegistrationItem[]>('/tournaments/my-registrations')
}

export async function closeTournamentRegistration(tournamentId: string): Promise<any> {
  return apiClient(`/admin/tournaments/${tournamentId}/close-registration`, {
    method: 'POST',
  })
}

export async function reopenTournamentRegistration(tournamentId: string): Promise<any> {
  return apiClient(`/admin/tournaments/${tournamentId}/reopen-registration`, {
    method: 'POST',
  })
}

export interface TournamentRosterMember {
  user_id: string
  username: string
  full_name?: string
  display_name?: string
  avatar_url?: string
  equipped_avatar_url?: string
  role?: string
}

export interface TournamentTeamDetails {
  id?: string
  name: string
  tag?: string
  logo_url?: string
  captain_id?: string
  captain_handle?: string
  captain_name?: string
  my_role?: 'CAPTAIN' | 'PLAYER' | string
  roster?: TournamentRosterMember[]
  members?: TournamentRosterMember[]
}

export interface TournamentRegistrationDetails {
  id?: string
  tournament_id?: string
  team_id?: string
  team_name?: string
  payment_status: 'PAID' | 'FREE' | 'PENDING' | 'PENDING_VERIFICATION' | 'REJECTED' | string
  status?: string
  registered_at?: string
  fee_paid?: number
  utr?: string
  screenshot_url?: string
  rejection_reason?: string
  [key: string]: any
}

export interface TournamentRegistrationStatusResponse {
  is_registered: boolean
  status?: string | null
  payment_status?: string | null
  registration?: TournamentRegistrationDetails | null
  team?: TournamentTeamDetails | null
  position?: number | null
  rejection_reason?: string | null
}

export interface TournamentCommunityLinkResponse {
  community_link?: string
  whatsapp_group_url?: string
  discord_url?: string
  instructions?: string
  tournament_title?: string
}

export async function getTournamentRegistrationStatus(
  slugOrId: string
): Promise<TournamentRegistrationStatusResponse> {
  return apiClient<TournamentRegistrationStatusResponse>(`/tournaments/${slugOrId}/registration-status`)
}

export async function getTournamentCommunityLink(
  slugOrId: string
): Promise<TournamentCommunityLinkResponse> {
  return apiClient<TournamentCommunityLinkResponse>(`/tournaments/${slugOrId}/community`)
}
