import { apiClient } from './apiClient'

export interface Genre {
  id: string
  _id?: string
  name: string
  slug: string
  description?: string
  banner_url?: string
  icon_url?: string
  rotation_interval_seconds: number
  display_order: number
  is_active: boolean
  game_count?: number
  games?: Array<{
    id: string
    title: string
    slug: string
    logo_url?: string
    banner_url?: string
    thumbnail_url?: string
    developer?: string
  }>
  created_at?: string
  updated_at?: string
}

export interface GenreCreatePayload {
  name: string
  slug?: string
  description?: string
  banner_url?: string
  icon_url?: string
  rotation_interval_seconds?: number
  display_order?: number
  is_active?: boolean
}

export interface GenreUpdatePayload {
  name?: string
  slug?: string
  description?: string
  banner_url?: string
  icon_url?: string
  rotation_interval_seconds?: number
  display_order?: number
  is_active?: boolean
}

export async function getGenres(includeInactive = false): Promise<Genre[]> {
  const q = includeInactive ? '?include_inactive=true' : ''
  return apiClient<Genre[]>(`/genres${q}`)
}

export async function getGenreBySlug(slugOrId: string): Promise<Genre> {
  return apiClient<Genre>(`/genres/${slugOrId}`)
}

export async function createGenre(payload: GenreCreatePayload): Promise<Genre> {
  return apiClient<Genre>('/admin/genres', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateGenre(genreId: string, payload: GenreUpdatePayload): Promise<Genre> {
  return apiClient<Genre>(`/admin/genres/${genreId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteGenre(genreId: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/admin/genres/${genreId}`, {
    method: 'DELETE',
  })
}
