import { apiClient } from './apiClient'
import { Tournament } from './tournaments'

export async function getMyOrganizedTournaments(): Promise<Tournament[]> {
  return apiClient<Tournament[]>('/organizer/my-tournaments')
}

export async function createTournamentOrganizer(payload: any): Promise<Tournament> {
  return apiClient<Tournament>('/organizer/tournaments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateTournamentOrganizer(id: string, payload: any): Promise<Tournament> {
  return apiClient<Tournament>(`/organizer/tournaments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteTournamentOrganizer(id: string): Promise<any> {
  return apiClient(`/organizer/tournaments/${id}`, {
    method: 'DELETE',
  })
}

export async function publishTournamentOrganizer(id: string): Promise<any> {
  return apiClient(`/organizer/tournaments/${id}/publish`, {
    method: 'POST',
  })
}

export async function closeRegistrationOrganizer(id: string): Promise<any> {
  return apiClient(`/organizer/tournaments/${id}/close-registration`, {
    method: 'POST',
  })
}

export async function reopenRegistrationOrganizer(id: string): Promise<any> {
  return apiClient(`/organizer/tournaments/${id}/reopen-registration`, {
    method: 'POST',
  })
}

export async function generateBracketOrganizer(id: string): Promise<any> {
  return apiClient(`/organizer/tournaments/${id}/generate-bracket`, {
    method: 'POST',
  })
}

export async function cancelTournamentOrganizer(id: string): Promise<any> {
  return apiClient(`/organizer/tournaments/${id}/cancel`, {
    method: 'POST',
  })
}

export async function startLiveTournamentOrganizer(id: string): Promise<any> {
  return apiClient(`/organizer/tournaments/${id}/start-live`, {
    method: 'POST',
  })
}

export async function completeTournamentOrganizer(id: string): Promise<any> {
  return apiClient(`/organizer/tournaments/${id}/complete`, {
    method: 'POST',
  })
}
