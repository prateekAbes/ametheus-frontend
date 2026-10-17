import { apiClient } from './apiClient'

export interface LeaderboardEntry {
  id: string
  name: string
  tag: string
  type: string
  game_slug?: string
  game_name?: string
  captain?: string
  logo_url?: string
  avatar_url?: string
  username?: string
  display_name?: string
  win_rate: number
  matches_played: number
  wins: number
  losses: number
  rating: number
  earnings: number
  spending?: number
  streak?: number
  top3?: number
  form: string[]
  is_verified: boolean
  category: string
  rank: number
  created_at?: string
  is_disbanded?: boolean
  is_disqualified?: boolean
  status?: string
}

export type TimeRange = 'all_time' | 'season' | 'month' | 'week'

export const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: 'all_time', label: 'ALL TIME' },
  { id: 'season', label: 'SEASON' },
  { id: 'month', label: 'MONTH' },
  { id: 'week', label: 'WEEK' },
]


export type MetricId =
  | 'overall'
  | 'win_rate'
  | 'wins'
  | 'streak'
  | 'matches'
  | 'top3'
  | 'earnings'
  | 'spending'

export interface MetricItem {
  id: MetricId
  label: string
  unit: string
}

export interface MetricGroup {
  group: string
  items: MetricItem[]
}

export const METRIC_GROUPS: MetricGroup[] = [
  {
    group: 'PERFORMANCE',
    items: [
      { id: 'overall', label: 'Overall Standing', unit: 'Rating' },
      { id: 'win_rate', label: 'Win Rate', unit: 'Win Rate' },
      { id: 'wins', label: 'Match Wins', unit: 'Wins' },
      { id: 'streak', label: 'Win Streak', unit: 'Streak' },
    ],
  },
  {
    group: 'ACTIVITY',
    items: [
      { id: 'matches', label: 'Matches Played', unit: 'Matches' },
      { id: 'top3', label: 'Top 3 Finishes', unit: 'Top 3' },
    ],
  },
  {
    group: 'ECONOMY',
    items: [
      { id: 'earnings', label: 'Prize Earnings', unit: 'Prize' },
      { id: 'spending', label: 'Highest Spending', unit: 'Spent' },
    ],
  },
]

export const METRICS: MetricItem[] = METRIC_GROUPS.flatMap((g) => g.items)

export interface LeaderboardPlayer {
  id: string
  name: string
  username?: string
  displayName?: string
  rawName: string
  initials: string
  tone: number
  wins: number
  matches: number
  points: number
  spent: number
  earnings: number
  streak: number
  top3: number
  winRate: number
  form?: string[]
  avatarUrl?: string
  rank: number
  isCurrentUser: boolean
  isDisqualified: boolean
  tag?: string
}

export const getPlayerMetricValue = (p: LeaderboardPlayer, m: MetricId) => {
  switch (m) {
    case 'win_rate':
      return p.winRate
    case 'wins':
      return p.wins
    case 'streak':
      return p.streak
    case 'matches':
      return p.matches
    case 'top3':
      return p.top3
    case 'earnings':
      return p.earnings
    case 'spending':
      return p.spent
    case 'overall':
    default:
      return p.points
  }
}

export const showPlayerMetricValue = (p: LeaderboardPlayer, m: MetricId) => {
  switch (m) {
    case 'win_rate':
      return `${p.winRate}%`
    case 'streak':
      return p.streak > 0 ? `${p.streak}W` : '0'
    case 'earnings':
      return `₹${p.earnings.toLocaleString()}`
    case 'spending':
      return `₹${p.spent.toLocaleString()}`
    case 'matches':
      return p.matches.toLocaleString()
    case 'top3':
      return p.top3.toLocaleString()
    case 'wins':
      return p.wins.toLocaleString()
    case 'overall':
    default:
      return p.points.toLocaleString()
  }
}

export interface LeaderboardPlatformStats {
  ranked_players: number
  matches_played: number
  prize_paid_out: string
  active_streaks: number
}

export async function getLeaderboardStats(timeRange?: string): Promise<LeaderboardPlatformStats> {
  const qs = timeRange && timeRange !== 'all_time' ? `?time_range=${timeRange}` : ''
  return apiClient<LeaderboardPlatformStats>(`/leaderboard/stats${qs}`)
}

export interface LeaderboardDisqualification {
  id: string
  entity_id: string
  entity_name: string
  entity_tag?: string
  reason: string
  notes?: string
  disqualified_by?: string
  disqualified_at?: string
}

export interface LeaderboardCategory {
  id: string
  name: string
  slug: string
  description?: string
  game_slug: string
  sort_metric: string
  min_matches: number
  is_system: boolean
}

export async function getLeaderboardEntries(params?: {
  category?: string
  metric?: string
  platform?: string
  game?: string
  search?: string
  time_range?: string
  limit?: number
  skip?: number
  include_disqualified?: boolean
}): Promise<LeaderboardEntry[]> {
  const q = new URLSearchParams()
  if (params?.category) q.set('category', params.category)
  if (params?.metric) q.set('metric', params.metric)
  if (params?.platform && params.platform !== 'all') q.set('platform', params.platform)
  if (params?.game && params.game !== 'all') q.set('game', params.game)
  if (params?.search) q.set('search', params.search)
  if (params?.time_range && params.time_range !== 'all_time') q.set('time_range', params.time_range)
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.skip) q.set('skip', String(params.skip))
  if (params?.include_disqualified) q.set('include_disqualified', 'true')

  const qs = q.toString()
  return apiClient<LeaderboardEntry[]>(`/leaderboard${qs ? `?${qs}` : ''}`)
}

export async function getLeaderboardDisqualifications(): Promise<LeaderboardDisqualification[]> {
  return apiClient<LeaderboardDisqualification[]>('/leaderboard/disqualifications')
}

export async function getLeaderboardCategories(): Promise<LeaderboardCategory[]> {
  return apiClient<LeaderboardCategory[]>('/leaderboard/categories')
}

/**
 * Checks whether a given leaderboard entry belongs to the currently signed-in user.
 */
export function isEntryCurrentUser(
  entry: LeaderboardEntry | null | undefined,
  currentUserId?: string,
  currentUsername?: string
): boolean {
  if (!entry) return false
  const uid = currentUserId?.toLowerCase()
  const uname = currentUsername?.toLowerCase()
  const eId = (entry.id || '').toLowerCase()
  const eName = (entry.name || '').toLowerCase()
  const eCap = (entry.captain || '').replace('@', '').toLowerCase()
  return (
    (!!uid && (eId === uid || eName === uid)) ||
    (!!uname && (eName === uname || eCap === uname))
  )
}

/**
 * Checks whether a leaderboard entry has been marked as disqualified.
 */
export function isEntryDisqualified(
  entry: LeaderboardEntry | null | undefined,
  disqualifiedIds?: Set<string>
): boolean {
  if (!entry) return false
  if (entry.is_disqualified) return true
  if ((entry.status || '').toUpperCase() === 'DISQUALIFIED') return true
  if (!disqualifiedIds || disqualifiedIds.size === 0) return false
  const id = (entry.id || '').toLowerCase()
  const name = (entry.name || '').toLowerCase()
  return disqualifiedIds.has(id) || disqualifiedIds.has(name)
}

export interface RatingAuditLogItem {
  id: string
  player_id: string
  player_username?: string
  player_display_name?: string
  game_id: string
  game_slug?: string
  game_name?: string
  previous_rating: number
  adjustment: number
  new_rating: number
  reason: string
  explanation: string
  admin_id: string
  admin_username: string
  tournament_id?: string
  tournament_name?: string
  round_id?: string
  round_name?: string
  match_id?: string
  is_reversal: boolean
  original_log_id?: string
  created_at: string
}

export async function getMyRatingHistory(
  game?: string
): Promise<{ status: string; user_id: string; history: RatingAuditLogItem[] }> {
  const qs = game && game !== 'all' ? `?game=${game}` : ''
  return apiClient<{ status: string; user_id: string; history: RatingAuditLogItem[] }>(
    `/leaderboard/ratings/me${qs}`
  )
}


