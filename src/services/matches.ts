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
  order?: number
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

