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
  game_id: string
  game_handle?: string
}): Promise<Team> {
  return apiClient<Team>('/teams', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function joinTeamByCode(payload: {
  invite_code: string
  game_handle?: string
}): Promise<Team> {
  return apiClient<Team>('/teams/join', {
    method: 'POST',
    body: JSON.stringify(payload),
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
