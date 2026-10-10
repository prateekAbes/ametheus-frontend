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
  server_region?: string
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
  minTeamSize: number
  maxTeamSize: number
  startDate: string
  endDate?: string
  registrationDeadline?: string
  bannerUrl?: string
  bannerTabletUrl?: string
  bannerMobileUrl?: string
  logoUrl?: string
  banner_url?: string
  banner_tablet_url?: string
  banner_mobile_url?: string
  logo_url?: string
  prizePoolInr: number
  entryFeeInr: number
  rules: string[]
  schedule: any[]
  prizes: any[]
  bracketRounds: any[]
  registeredRosters: TournamentRoster[]
  matchesSummary: TournamentMatchSummary[]
  isRegistered?: boolean
  isFeatured?: boolean
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

  const bannerUrl = t.banner_url || (t as any).bannerUrl || ''
  const bannerTabletUrl = t.banner_tablet_url || (t as any).bannerTabletUrl || bannerUrl
  const bannerMobileUrl = t.banner_mobile_url || (t as any).bannerMobileUrl || bannerUrl
  const logoUrl = t.logo_url || (t as any).logoUrl || ''

  return {
    id: t.id || t._id || t.slug,
    slug: t.slug || t.id,
    title: t.title,
    description: t.description || '',
    gameId: t.game_id,
    gameName: t.game_name || (t as any).game_slug || t.game_id || 'Esports',
    format: t.format,
    status: t.status,
    maxTeams: t.max_teams || 16,
    registeredTeams: regCount,
    minTeamSize: t.min_team_size || 1,
    maxTeamSize: t.max_team_size || 5,
    startDate: t.start_date,
    endDate: t.end_date,
    registrationDeadline: t.registration_deadline,
    bannerUrl,
    bannerTabletUrl,
    bannerMobileUrl,
    logoUrl,
    banner_url: bannerUrl,
    banner_tablet_url: bannerTabletUrl,
    banner_mobile_url: bannerMobileUrl,
    logo_url: logoUrl,
    prizePoolInr: t.prize_pool_inr || 0,
    entryFeeInr: t.entry_fee_inr || 0,
    rules: parseJsonField(t.rules),
    schedule: parseJsonField(t.schedule),
    prizes: parseJsonField(t.prizes),
    bracketRounds: parseJsonField(t.bracket_rounds),
    registeredRosters: t.registered_rosters || [],
    matchesSummary: t.matches_summary || [],
    isRegistered: t.is_registered,
    isFeatured: Boolean(t.is_featured ?? (t as any).isFeatured),
  }
}

export async function getTournaments(params?: {
  game?: string
  status?: string
}): Promise<Tournament[]> {
  const searchParams = new URLSearchParams()
  if (params?.game) searchParams.set('game', params.game)
  if (params?.status) searchParams.set('status', params.status)
  const q = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return apiClient<Tournament[]>(`/tournaments${q}`)
}

export async function getFeaturedTournament(): Promise<Tournament | null> {
  try {
    const res = await apiClient<Tournament>('/tournaments/featured')
    if (res && (res.id || res.slug)) return res
  } catch {
    // API endpoint might not be available or 404
  }
  // Check local stored configuration if set by admin
  try {
    const savedId = localStorage.getItem('ametheus_homepage_featured_tournament_id')
    if (savedId && savedId !== 'none') {
      return await getTournamentBySlug(savedId)
    }
  } catch {}
  return null
}

export async function setFeaturedTournament(id: string): Promise<any> {
  try {
    localStorage.setItem('ametheus_homepage_featured_tournament_id', id)
  } catch {}
  try {
    return await apiClient(`/tournaments/${id}/feature`, {
      method: 'POST',
    })
  } catch {
    // Return success if stored locally
    return { status: 'success', featured_tournament_id: id }
  }
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
  payload: { team_id: string; selected_roster_ids?: string[] }
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
    sender_upi_id?: string
    sender_name?: string
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
