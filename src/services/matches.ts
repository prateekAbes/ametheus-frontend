import { apiClient } from './apiClient'

export interface MatchScore {
  team1_score: number
  team2_score: number
  rounds?: any[]
}

export interface MatchLobbyInfo {
  room_id?: string
  room_password?: string
  custom_instructions?: string
  server_region?: string
}

export interface Match {
  id: string
  _id?: string
  tournament_id: string
  game_id: string
  round: number
  round_name?: string
  team1_id?: string
  team2_id?: string
  team1_name?: string
  team2_name?: string
  team1_tag?: string
  team2_tag?: string
  winner_id?: string
  winner_name?: string
  status: 'PENDING' | 'SCHEDULED' | 'READY' | 'LIVE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'
  scheduled_time?: string
  score?: MatchScore
  lobby_info?: MatchLobbyInfo
  stream_url?: string
}

export interface NormalizedMatch {
  id: string
  tournamentId: string
  gameId: string
  round: number
  roundName: string
  team1Id?: string
  team2Id?: string
  team1Name: string
  team2Name: string
  team1Tag: string
  team2Tag: string
  winnerId?: string
  winnerName?: string
  status: 'PENDING' | 'SCHEDULED' | 'READY' | 'LIVE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'
  scheduledTime?: string
  score?: { team1Score: number; team2Score: number }
  lobbyInfo?: MatchLobbyInfo
  streamUrl?: string
}

export function normalizeMatch(m: Match): NormalizedMatch {
  const mid = String(m.id || m._id || '')
  return {
    id: mid,
    tournamentId: m.tournament_id,
    gameId: m.game_id,
    round: m.round,
    roundName: m.round_name || `Round ${m.round}`,
    team1Id: m.team1_id,
    team2Id: m.team2_id,
    team1Name: m.team1_name || 'TBD',
    team2Name: m.team2_name || 'TBD',
    team1Tag: m.team1_tag || 'TEAM',
    team2Tag: m.team2_tag || 'TEAM',
    winnerId: m.winner_id,
    winnerName: m.winner_name,
    status: m.status || 'SCHEDULED',
    scheduledTime: m.scheduled_time,
    score: m.score
      ? {
          team1Score: m.score.team1_score ?? 0,
          team2Score: m.score.team2_score ?? 0,
        }
      : undefined,
    lobbyInfo: m.lobby_info,
    streamUrl: m.stream_url,
  }
}

export interface ApiMatch {
  id: string
  tournament_id: string
  tournament_title?: string
  game_slug?: string
  game_name?: string
  stage?: string
  match_type?: string
  format?: string
  series_format?: string
  scheduled_time?: string
  scheduled_at?: string
  live_link?: string
  youtube_live_url?: string
  round_number?: number
  round_name?: string
  match_number?: number
  scheduled_date?: string
  roster_status?: string
  team_a_id?: string
  team_b_id?: string
  team_a_name?: string
  team_b_name?: string
  team_a_placeholder?: string
  team_b_placeholder?: string
  next_match_id?: string
  next_match_slot?: string
  advancement_label?: string
  teams?: any[]
  tournament?: any
  team_a_details?: any
  team_b_details?: any
  teams_details?: any[]
  previous_matches?: any[]
  next_match?: any
  tournament_progression?: any[]
  order?: number
  score_a?: number
  score_b?: number
  captain_notes?: string
  status: string
  server_region?: string
  lobby_code?: string
  lobby_password?: string
  team_a?: { id?: string; name: string; tag?: string; score?: number }
  team_b?: { id?: string; name: string; tag?: string; score?: number }
  winner_team_id?: string
  check_in_status?: { team_a?: boolean; team_b?: boolean }
  evidence_url?: string
  dispute_notes?: string
}

export function mapApiMatchToUiMatch(m: ApiMatch) {
  const statusLower = (m.status || '').toLowerCase()
  const isLive = statusLower === 'live' || statusLower === 'in_progress'
  const isDone = statusLower === 'completed'
  const status = isLive ? ('live' as const) : isDone ? ('completed' as const) : ('upcoming' as const)

  return {
    id: String(m.id),
    tour: m.tournament_id || 'tour',
    tourName: m.tournament_title || 'Ametheus Tournament',
    game: m.game_slug || 'valorant',
    no: m.order || 1,
    round: m.stage || m.match_type || 'Match',
    a: m.team_a?.name || 'TBD (Team A)',
    b: m.team_b?.name || 'TBD (Team B)',
    date: m.scheduled_at
      ? new Date(m.scheduled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      : 'TBD',
    time: m.scheduled_time || '18:00 IST',
    status,
    score:
      m.team_a?.score !== undefined && m.team_b?.score !== undefined
        ? ([m.team_a.score, m.team_b.score] as [number, number])
        : undefined,
    format: m.series_format || m.format || 'BO1',
    liveLink: m.youtube_live_url || m.live_link,
    lobbyCode: m.lobby_code,
    lobbyPassword: m.lobby_password,
    serverRegion: m.server_region,
    winnerTeamId: m.winner_team_id,
    checkInStatus: m.check_in_status,
    rawStatus: m.status,
  }
}

export async function getMatches(params?: {
  status?: string
  game_id?: string
  tournament_id?: string
}): Promise<ApiMatch[]> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.game_id) searchParams.set('game_id', params.game_id)
  if (params?.tournament_id) searchParams.set('tournament_id', params.tournament_id)
  const q = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return apiClient<ApiMatch[]>(`/matches${q}`)
}

export async function getMatchById(id: string): Promise<ApiMatch> {
  return apiClient<ApiMatch>(`/matches/${id}`)
}

export async function captainCheckIn(matchId: string): Promise<any> {
  return apiClient(`/matches/${matchId}/check-in`, {
    method: 'POST',
  })
}

export async function submitMatchResult(
  matchId: string,
  payload: { score_a: number; score_b: number; evidence_url?: string; winner_team_id?: string }
): Promise<any> {
  return apiClient(`/matches/${matchId}/submit-result`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function submitMatchDispute(
  matchId: string,
  payload: { reason: string; evidence_url?: string }
): Promise<any> {
  return apiClient(`/matches/${matchId}/dispute`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface RegisteredRosterMember {
  user_id: string
  username: string
  game_id?: string
  role?: string
}

export interface RegisteredRosterTeam {
  team_id: string
  team_name: string
  team_tag: string
  captain?: {
    user_id: string
    username: string
    game_id?: string
  }
  captain_username?: string
  members?: RegisteredRosterMember[]
  is_paired?: boolean
  is_solo?: boolean
}

export interface TournamentRegisteredRostersResponse {
  tournament_id: string
  tournament_title: string
  game_name: string
  game_slug: string
  match_format: string
  series_format: string
  status?: string
  total_registered?: number
  teams: RegisteredRosterTeam[]
}

export interface LiveDashboardData {
  ready_for_match_creation: any[]
  scheduled: ApiMatch[]
  live_now: ApiMatch[]
  completed: ApiMatch[]
}

export interface AdminMatchCreatePayload {
  tournament_id: string
  team_a_id?: string
  team_b_id?: string
  team_a_name?: string
  team_b_name?: string
  team_a_placeholder?: string
  team_b_placeholder?: string
  round_name?: string
  round_number?: number
  match_number?: number
  match_type?: string
  stage?: string
  series_format?: string
  match_format?: string
  scheduled_at?: string
  scheduled_date?: string
  scheduled_time?: string
  youtube_live_url?: string
  status?: string
  roster_status?: string
  next_match_id?: string
  next_match_slot?: string
  advancement_label?: string
}

export interface AdminMatchUpdatePayload {
  team_a_id?: string
  team_b_id?: string
  team_a_name?: string
  team_b_name?: string
  team_a_placeholder?: string
  team_b_placeholder?: string
  round_name?: string
  round_number?: number
  match_number?: number
  match_type?: string
  stage?: string
  series_format?: string
  match_format?: string
  scheduled_at?: string
  scheduled_date?: string
  scheduled_time?: string
  youtube_live_url?: string
  status?: string
  roster_status?: string
  next_match_id?: string
  next_match_slot?: string
  advancement_label?: string
  score_a?: number
  score_b?: number
  winner_team_id?: string
  lobby_code?: string
  lobby_password?: string
  server_region?: string
}

export interface MatchJoinInfo {
  join_info_enabled: boolean
  join_info?: {
    join_code?: string
    party_id?: string
    room_id?: string
    lobby_id?: string
    password?: string
    join_link?: string
    [key: string]: string | undefined
  } | null
  match_message?: string | null
}

export async function updateMatch(
  matchId: string,
  payload: {
    lobby_code?: string
    lobby_password?: string
    youtube_live_url?: string
    live_link?: string
    server_region?: string
    status?: string
    score_a?: number
    score_b?: number
    winner_team_id?: string
  }
): Promise<any> {
  return apiClient(`/matches/${matchId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function getLiveMatchesDashboard(): Promise<LiveDashboardData> {
  return apiClient<LiveDashboardData>('/admin/matches/live-dashboard')
}

export async function getTournamentRegisteredRosters(
  tournamentId: string
): Promise<TournamentRegisteredRostersResponse> {
  return apiClient<TournamentRegisteredRostersResponse>(
    `/admin/tournaments/${tournamentId}/registered-rosters`
  )
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

export async function updateTournamentStream(
  tournamentId: string,
  streamUrl: string
): Promise<any> {
  return apiClient(`/admin/tournaments/${tournamentId}/stream`, {
    method: 'PATCH',
    body: JSON.stringify({ stream_url: streamUrl }),
  })
}

export async function createMatchAdmin(
  payload: AdminMatchCreatePayload
): Promise<{ status: string; message: string; match_id: string }> {
  return apiClient('/admin/matches', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateMatchDetailsAdmin(
  matchId: string,
  payload: AdminMatchUpdatePayload
): Promise<{ status: string; message: string; match_id: string }> {
  return apiClient(`/admin/matches/${matchId}/update`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteMatchAdmin(
  matchId: string
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/matches/${matchId}`, {
    method: 'DELETE',
  })
}

export async function markMatchLiveAdmin(
  matchId: string,
  youtube_live_url: string
): Promise<{ status: string; message: string; match_id: string; youtube_live_url: string }> {
  return apiClient(`/admin/matches/${matchId}/mark-live`, {
    method: 'POST',
    body: JSON.stringify({ youtube_live_url }),
  })
}

export async function completeMatchAdmin(
  matchId: string,
  payload: { score_a: number; score_b: number; winner_team_id?: string }
): Promise<{ status: string; message: string; match_id: string; winner_id: string }> {
  return apiClient(`/admin/matches/${matchId}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function swapTeamsAdmin(
  matchId: string
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/matches/${matchId}/swap`, {
    method: 'POST',
  })
}

export async function updateMatchStatus(
  matchId: string,
  status: string,
  stream_url?: string
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/matches/${matchId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, stream_url }),
  })
}

export async function updateMatchScore(
  matchId: string,
  payload: { team1_score: number; team2_score: number; winner_team_id?: string }
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/matches/${matchId}/score`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getMatchJoinInfo(matchId: string): Promise<MatchJoinInfo> {
  return apiClient<MatchJoinInfo>(`/matches/${matchId}/join-info`)
}

export async function updateMatchJoinInfo(
  matchId: string,
  payload: any
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/matches/${matchId}/join-info`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export interface TournamentRoundsRostersResponse {
  status: string
  tournament: {
    id: string
    title: string
    slug?: string
    format: string
    status: string
    registration_status?: string
    live_stream_url?: string
    community_platform?: string
    community_link?: string
    server_region?: string
    custom_rounds?: string[]
  }
  registered_teams: Array<{
    id: string
    name: string
    tag: string
    captain_name: string
    captain_handle: string
    member_count: number
    logo_url?: string
  }>
  unpaired_teams: Array<{
    id: string
    name: string
    tag: string
    captain_name: string
    captain_handle: string
    member_count: number
    logo_url?: string
  }>
  rounds: Array<{
    round_number: number
    round_name: string
    matches: ApiMatch[]
  }>
  total_matches: number
}

export async function getTournamentRoundsRosters(tournamentId: string): Promise<TournamentRoundsRostersResponse> {
  return apiClient<TournamentRoundsRostersResponse>(`/admin/tournaments/${tournamentId}/rounds-rosters`)
}

export async function publishRosterAdmin(
  matchId: string,
  payload?: { notify_leaders?: boolean; match_notes?: string }
): Promise<{ status: string; message: string; match_id: string; roster_status: string; notified_count: number }> {
  return apiClient(`/admin/matches/${matchId}/publish-roster`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  })
}

export async function publishAllRostersAdmin(
  tournamentId: string,
  roundName?: string
): Promise<{ status: string; message: string; published_matches: number; notified_leaders: number }> {
  const query = roundName && roundName !== 'ALL' ? `?round_name=${encodeURIComponent(roundName)}` : ''
  return apiClient(`/admin/tournaments/${tournamentId}/publish-all-rosters${query}`, {
    method: 'POST',
  })
}



