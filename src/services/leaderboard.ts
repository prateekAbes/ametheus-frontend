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
  win_rate: number
  matches_played: number
  wins: number
  losses: number
  rating: number
  earnings: number
  form: string[]
  is_verified: boolean
  category: string
  rank: number
  created_at?: string
}

export interface LeaderboardStats {
  total_awarded_prizes: string
  active_contenders: string
  verified_squads: string
  top_team_earnings: string
  top_team_name: string
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
  game?: string
  search?: string
  limit?: number
  skip?: number
}): Promise<LeaderboardEntry[]> {
  const q = new URLSearchParams()
  if (params?.category) q.set('category', params.category)
  if (params?.game && params.game !== 'all') q.set('game', params.game)
  if (params?.search) q.set('search', params.search)
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.skip) q.set('skip', String(params.skip))

  const qs = q.toString()
  return apiClient<LeaderboardEntry[]>(`/leaderboard${qs ? `?${qs}` : ''}`)
}

export async function getLeaderboardStats(): Promise<LeaderboardStats> {
  return apiClient<LeaderboardStats>('/leaderboard/stats')
}

export async function getLeaderboardCategories(): Promise<LeaderboardCategory[]> {
  return apiClient<LeaderboardCategory[]>('/leaderboard/categories')
}
