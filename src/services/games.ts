import { apiClient } from './apiClient'

export interface Game {
  id: string
  slug: string
  name: string
  category: string
  platform: string
  tag: string
  is_team_game: boolean
  min_team_size: number
  max_team_size: number
  max_substitutes?: number
  entry_fee_inr?: number
  prize_pool_inr?: number
  play_url?: string
  poster_url?: string
  banner_url: string
  banner_tablet_url?: string
  banner_mobile_url?: string
  logo_url: string
  description: string
  server_region: string
  anti_cheat: string
  match_protocol: string
  accent_color: string
  status: string
  expected_release_date?: string
  announcement_text?: string
  hero_media_url?: string
  hero_media_type?: string
  hero_media_enabled?: boolean
  gallery?: Array<{ id: string; url: string; caption?: string; order?: number }>
  teams_count?: number
  genre_id?: string
  genre_name?: string
}

export interface NormalizedGame {
  id: string
  slug: string
  name: string
  category: string
  platform: string
  tag: string
  isTeamGame: boolean
  minTeamSize: number
  maxTeamSize: number
  maxSubstitutes: number
  entryFeeInr: number
  prizePoolInr: number
  playUrl?: string
  posterUrl?: string
  poster_url?: string
  bannerUrl: string
  bannerTabletUrl?: string
  bannerMobileUrl?: string
  logoUrl: string
  banner_url?: string
  banner_tablet_url?: string
  banner_mobile_url?: string
  logo_url?: string
  description: string
  serverRegion: string
  antiCheat: string
  matchProtocol: string
  accentColor: string
  status: string
  expectedReleaseDate?: string
  announcementText?: string
  heroMediaUrl?: string
  heroMediaType?: string
  heroMediaEnabled: boolean
  gallery: Array<{ id: string; url: string; caption?: string; order?: number }>
  teamsCount?: number
  genreId?: string
  genreName?: string
}

export function normalizeGame(game: Game): NormalizedGame {
  const posterUrl = game.poster_url || (game as any).posterUrl || ''
  const bannerUrl = game.banner_url || (game as any).bannerUrl || ''
  const bannerTabletUrl = game.banner_tablet_url || (game as any).bannerTabletUrl || bannerUrl
  const bannerMobileUrl = game.banner_mobile_url || (game as any).bannerMobileUrl || bannerUrl
  const logoUrl = game.logo_url || (game as any).logoUrl || ''

  return {
    id: game.id || (game as any)._id,
    slug: game.slug,
    name: game.name,
    category: game.category,
    genreId: game.genre_id,
    genreName: game.genre_name,
    platform: game.platform,
    tag: game.tag,
    isTeamGame: game.is_team_game,
    minTeamSize: game.min_team_size,
    maxTeamSize: game.max_team_size,
    maxSubstitutes: game.max_substitutes || 0,
    entryFeeInr: game.entry_fee_inr || 0,
    prizePoolInr: game.prize_pool_inr || 0,
    playUrl: game.play_url,
    posterUrl,
    poster_url: posterUrl,
    bannerUrl,
    bannerTabletUrl,
    bannerMobileUrl,
    logoUrl,
    banner_url: bannerUrl,
    banner_tablet_url: bannerTabletUrl,
    banner_mobile_url: bannerMobileUrl,
    logo_url: logoUrl,
    description: game.description,
    serverRegion: game.server_region,
    antiCheat: game.anti_cheat,
    matchProtocol: game.match_protocol,
    accentColor: game.accent_color || '#3ef2ff',
    status: game.status,
    expectedReleaseDate: game.expected_release_date,
    announcementText: game.announcement_text,
    heroMediaUrl: game.hero_media_url,
    heroMediaType: game.hero_media_type,
    heroMediaEnabled: game.hero_media_enabled ?? false,
    gallery: game.gallery || [],
    teamsCount: game.teams_count,
  }
}

export async function getGames(activeOnly: boolean = false): Promise<Game[]> {
  const query = activeOnly ? '?active_only=true' : ''
  return apiClient<Game[]>(`/games${query}`)
}

export async function getGameBySlug(slug: string): Promise<Game> {
  return apiClient<Game>(`/games/${slug}`)
}
