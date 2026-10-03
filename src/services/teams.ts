import { apiClient } from './apiClient'

export interface TeamMember {
  user_id: string
  username: string
  display_name?: string
  role: 'CAPTAIN' | 'MEMBER' | 'SUBSTITUTE'
  game_handle?: string
  avatar_url?: string
}

export interface Team {
  id: string
  _id?: string
  name: string
  tag: string
  game_id: string
  captain_id: string
  invite_code?: string
  members: TeamMember[]
  logo_url?: string
  banner_url?: string
  is_active: boolean
  created_at?: string
}

export async function getMyTeams(): Promise<Team[]> {
  return apiClient<Team[]>('/teams')
}

export async function getTeamById(id: string): Promise<Team> {
  return apiClient<Team>(`/teams/${id}`)
}

export async function createTeam(payload: {
  name: string
  tag: string
  game_id?: string
  game_slug?: string
  captain_handle?: string
  game_handle?: string
}): Promise<Team> {
  const slug = (payload.game_slug || payload.game_id || '').trim()
  const handle = (payload.captain_handle || payload.game_handle || 'Contender').trim()
  return apiClient<Team>('/teams', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name.trim(),
      tag: payload.tag.trim().toUpperCase(),
      game_slug: slug,
      game_id: slug,
      captain_handle: handle,
      game_handle: handle,
    }),
  })
}

export async function joinTeamByCode(payload: {
  invite_code: string
  player_handle?: string
  game_handle?: string
}): Promise<Team> {
  const code = payload.invite_code.trim().toUpperCase()
  const handle = (payload.player_handle || payload.game_handle || 'Contender').trim()
  return apiClient<Team>('/teams/join', {
    method: 'POST',
    body: JSON.stringify({
      invite_code: code,
      player_handle: handle,
      game_handle: handle,
    }),
  })
}

export async function leaveTeam(teamId: string): Promise<any> {
  return apiClient(`/teams/${teamId}/leave`, {
    method: 'POST',
  })
}

export async function deleteTeam(teamId: string): Promise<any> {
  return apiClient(`/teams/${teamId}`, {
    method: 'DELETE',
  })
}
