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
  win_rate: number
  matches_played: number
  wins: number
  losses: number
  rating: number
  earnings: number
  spending?: number
  form: string[]
  is_verified: boolean
  category: string
  rank: number
  created_at?: string
  is_disbanded?: boolean
  is_disqualified?: boolean
  status?: string
}

export const METRICS = [
  { id: 'overall', label: 'Overall Standing', unit: 'Rating' },
  { id: 'win_rate', label: 'Win Rate', unit: 'Win Rate' },
  { id: 'wins', label: 'Match Wins', unit: 'Wins' },
  { id: 'spending', label: 'Highest Spending', unit: 'Spent' },
] as const

export type MetricId = (typeof METRICS)[number]['id']

export interface LeaderboardPlayer {
  id: string
  name: string
  rawName: string
  initials: string
  tone: number
  wins: number
  matches: number
  points: number
  spent: number
  winRate: number
  avatarUrl?: string
  rank: number
  isCurrentUser: boolean
  isDisqualified: boolean
  tag?: string
}

export const getPlayerMetricValue = (p: LeaderboardPlayer, m: MetricId) =>
  m === 'win_rate' ? p.winRate : m === 'wins' ? p.wins : m === 'spending' ? p.spent : p.points

export const showPlayerMetricValue = (p: LeaderboardPlayer, m: MetricId) =>
  m === 'win_rate'
    ? `${p.winRate}%`
    : m === 'spending'
    ? `₹${p.spent.toLocaleString()}`
    : getPlayerMetricValue(p, m).toLocaleString()

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

