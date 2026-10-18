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
  game_title?: string
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
  team_ids?: string[]
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
  room_id?: string
  room_password?: string
  credentials_released?: boolean
  credentials_released_at?: string
  custom_instructions?: string
  check_ins?: any
  alive_status?: Record<string, boolean>
  placements?: any[]
  scoring_matrix?: Record<string, number>
  participant_ratings?: any[]
  team_a?: { id?: string; name: string; tag?: string; score?: number }
  team_b?: { id?: string; name: string; tag?: string; score?: number }
  winner_team_id?: string
  check_in_status?: Record<string, boolean>
  evidence_url?: string
  dispute_notes?: string
  is_solo?: boolean
  match_message?: string
  match_order?: number
  squads_count?: number
  qualifier_team_ids?: string[]
  qualifiers_count?: number
  is_final_round?: boolean
  current_encounter_id?: string
  current_encounter_number?: number
  current_encounter_title?: string
  current_round_name?: string
  current_round_number?: number
  encounter_history?: any[]
}

export function mapApiMatchToUiMatch(m: ApiMatch) {
  const statusLower = (m.status || '').toLowerCase()
  const isLive = statusLower === 'live' || statusLower === 'in_progress'
  const isDone = statusLower === 'completed'
  const status = isLive ? ('live' as const) : isDone ? ('completed' as const) : ('upcoming' as const)

  const isBattleRoyale =
    (m.format || '').toLowerCase().includes('battle royale') ||
    (m.series_format || '').toLowerCase().includes('battle royale') ||
    (m.stage || '').toLowerCase().includes('battle royale') ||
    (m.match_type || '').toLowerCase().includes('battle_royale') ||
    (m.teams_details && m.teams_details.length > 2) ||
    (m.teams && m.teams.length > 2) ||
    (m.team_ids && m.team_ids.length > 2)

  const rawTeamA = m.team_a?.name || m.team_a_name
  const rawTeamB = m.team_b?.name || m.team_b_name
  const hasParticipants = Boolean(
    (rawTeamA && !rawTeamA.includes('(Team A)')) ||
    (rawTeamB && !rawTeamB.includes('(Team B)')) ||
    (m.teams && m.teams.length > 0) ||
    (m.teams_details && m.teams_details.length > 0)
  )

  const nameA = rawTeamA || (hasParticipants ? (m.team_a_placeholder || 'Participants TBD') : 'Participants TBD')
  const nameB = rawTeamB || (hasParticipants ? (m.team_b_placeholder || 'Participants TBD') : 'Participants TBD')

  const dateStr = m.scheduled_at
    ? new Date(m.scheduled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : m.scheduled_date || 'Not Scheduled'

  const timeStr = m.scheduled_time || (m.scheduled_at ? new Date(m.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Not Scheduled')

  return {
    id: String(m.id),
    tour: m.tournament_id || 'tour',
    tourName: m.tournament_title || 'Ametheus Tournament',
    game: m.game_slug || 'valorant',
    no: m.current_encounter_number ?? m.match_number ?? m.order ?? 1,
    round: m.current_round_name || m.current_encounter_title || m.round_name || m.stage || m.match_type || 'Match',
    a: nameA,
    b: nameB,
    hasParticipants,
    isBattleRoyale,
    isSolo: Boolean(
      m.is_solo ||
      (m as any).isSolo ||
      (m as any).tournament_is_solo ||
      (m as any).tournament?.is_solo ||
      (m as any).tournament?.min_team_size === 1
    ),
    squadsCount: m.squads_count || m.teams_details?.length || m.teams?.length || m.team_ids?.length || 0,
    squads: m.teams_details || m.teams || [],
    teamAId: m.team_a_id || m.team_a?.id,
    teamBId: m.team_b_id || m.team_b?.id,
    teamALogo: m.team_a_details?.logo_url,
    teamBLogo: m.team_b_details?.logo_url,
    date: dateStr,
    time: timeStr,
    status,
    score:
      m.team_a?.score !== undefined && m.team_b?.score !== undefined
        ? ([m.team_a.score, m.team_b.score] as [number, number])
        : m.score_a !== undefined && m.score_b !== undefined
        ? ([m.score_a, m.score_b] as [number, number])
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
  credentials_released?: boolean
  room_id?: string
  room_password?: string
  custom_instructions?: string
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
    stream_url?: string
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

export async function createTournamentRoundAdmin(
  tournamentId: string,
  roundName: string
): Promise<{ status: string; message: string; round_name: string; custom_rounds: string[] }> {
  return apiClient(`/admin/tournaments/${tournamentId}/rounds`, {
    method: 'POST',
    body: JSON.stringify({ round_name: roundName }),
  })
}

export async function deleteTournamentRoundAdmin(
  tournamentId: string,
  roundName: string
): Promise<{ status: string; message: string; custom_rounds: string[] }> {
  return apiClient(`/admin/tournaments/${tournamentId}/rounds/${encodeURIComponent(roundName)}`, {
    method: 'DELETE',
  })
}

export async function saveLiveMatchStructureAdmin(
  tournamentId: string,
  payload: {
    match_format: string
    series_format?: string
    formation_status?: string
    rounds?: Array<{ round_number?: number; round_name: string }>
    matches: Array<{
      id?: string
      round_number?: number
      match_number?: number
      stage?: string
      round_name?: string
      match_type?: string
      format?: string
      series_format?: string
      team_a_id?: string | null
      team_b_id?: string | null
      team_a_name?: string | null
      team_b_name?: string | null
      team_a_placeholder?: string | null
      team_b_placeholder?: string | null
      team_ids?: string[]
      teams?: any[]
      roster_status?: string
      scheduled_date?: string | null
      scheduled_time?: string | null
      scheduled_at?: string | null
      youtube_live_url?: string | null
      next_match_id?: string | null
      next_match_slot?: string | null
      advancement_label?: string | null
    }>
  }
): Promise<{ status: string; message: string; total_matches: number; bracket_rounds?: any[] }> {
  return apiClient(`/admin/tournaments/${tournamentId}/save-live-structure`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateRoundStreamAdmin(
  tournamentId: string,
  roundName: string,
  streamUrl: string
): Promise<{ status: string; message: string; round_name: string; stream_url: string; updated_matches_count: number }> {
  return apiClient(`/admin/tournaments/${tournamentId}/rounds/${encodeURIComponent(roundName)}/stream`, {
    method: 'PATCH',
    body: JSON.stringify({ stream_url: streamUrl }),
  })
}

export async function updateMatchCredentialsAdmin(
  matchId: string,
  payload: {
    room_id?: string
    room_password?: string
    lobby_code?: string
    lobby_password?: string
    custom_instructions?: string
    server_region?: string
  }
): Promise<{ status: string; message: string; match_id: string; credentials_released: boolean }> {
  return apiClient(`/admin/matches/${matchId}/credentials`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function releaseMatchCredentialsAdmin(
  matchId: string
): Promise<{ status: string; message: string; match_id: string; status_updated: string; credentials_released: boolean }> {
  return apiClient(`/admin/matches/${matchId}/release-credentials`, {
    method: 'POST',
  })
}

export interface QualifiedContender {
  id: string
  tournament_id: string
  team_id: string
  team_name: string
  team_tag?: string
  status: 'QUALIFIED' | 'ASSIGNED' | 'ELIMINATED'
  source_round?: string
  source_match_id?: string
  assigned_round?: string
}

export async function getQualifiedContendersAdmin(
  tournamentId: string,
  sourceRound?: string
): Promise<{ status: string; tournament_id: string; total_qualified: number; contenders: QualifiedContender[] }> {
  const query = sourceRound ? `?source_round=${encodeURIComponent(sourceRound)}` : ''
  return apiClient(`/admin/tournaments/${tournamentId}/qualified-contenders${query}`)
}

export async function updateMatchAliveStatusAdmin(
  matchId: string,
  teamId: string,
  isAlive: boolean
): Promise<{ status: string; message: string; team_id: string; is_alive: boolean }> {
  return apiClient(`/admin/matches/${matchId}/alive-status`, {
    method: 'PATCH',
    body: JSON.stringify({ team_id: teamId, is_alive: isAlive }),
  })
}

export interface BattleRoyaleTeamResultInput {
  team_id: string
  team_name: string
  placement?: number
  kills?: number
  placement_points?: number
  elimination_points?: number
  total_points?: number
  qualified?: boolean
}

export interface BattleRoyaleSubmitPayload {
  team_results?: BattleRoyaleTeamResultInput[]
  qualifier_team_ids?: string[]
  qualifiers_count?: number
  advance_to_next_round?: boolean
  next_round_name?: string
  is_final_round?: boolean
  scoring_matrix?: Record<string, any>
}

export async function submitBattleRoyaleResultsAdmin(
  matchId: string,
  payload: BattleRoyaleSubmitPayload
): Promise<{
  status: string
  message: string
  match_id: string
  winner_team_id: string
  winner_team_name?: string
  advancement?: {
    qualifiers_count: number
    next_round_name?: string
    next_match_id?: string
    tournament_completed: boolean
  }
}> {
  return apiClient(`/admin/matches/${matchId}/battle-royale-results`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface ParticipantRatingItem {
  user_id: string
  player_id?: string
  username?: string
  display_name?: string
  avatar_url?: string
  team_id?: string
  team_name?: string
  current_rating?: number
  rating: number
  skill_adjustment?: number
  adjustment_reason?: string
  adjustment_explanation?: string
  review?: string
  notes?: string
}

export async function getMatchRatingsAdmin(
  matchId: string
): Promise<{
  status: string
  match_id: string
  is_completed: boolean
  participants: ParticipantRatingItem[]
  ratings: ParticipantRatingItem[]
  rating_scale: string
}> {
  return apiClient(`/admin/matches/${matchId}/ratings`)
}

export async function submitMatchRatingsAdmin(
  matchId: string,
  ratings: ParticipantRatingItem[],
  submissionId?: string
): Promise<{ status: string; message: string; match_id: string; total_rated: number }> {
  return apiClient(`/admin/matches/${matchId}/ratings`, {
    method: 'POST',
    body: JSON.stringify({ ratings, submission_id: submissionId }),
  })
}

