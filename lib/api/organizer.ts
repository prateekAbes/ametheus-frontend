import { apiClient } from "./client";
import { Tournament } from "./tournaments";

export interface CreateTournamentPayload {
  game_id: string;
  title: string;
  slug?: string;
  prize_pool_inr: number;
  entry_fee_inr: number;
  starts_at: string;
  roster_lock_time: string;
  server_region?: string;
  max_teams?: number;
  min_team_size?: number;
  max_team_size?: number;
  rank_requirement?: string;
  format?: string;
  banner_url?: string;
  description: string;
  rules?: string[];
  schedule?: Array<{ stage: string; time: string; details?: string }>;
  prizes?: Array<{ place: string; prize: string; amount?: number }>;
  status?: string;
}

export interface UpdateTournamentPayload {
  game_id?: string;
  title?: string;
  prize_pool_inr?: number;
  entry_fee_inr?: number;
  starts_at?: string;
  roster_lock_time?: string;
  server_region?: string;
  max_teams?: number;
  min_team_size?: number;
  max_team_size?: number;
  rank_requirement?: string;
  format?: string;
  banner_url?: string;
  description?: string;
  rules?: string[];
  schedule?: Array<{ stage: string; time: string; details?: string }>;
  prizes?: Array<{ place: string; prize: string; amount?: number }>;
  status?: string;
}

export async function getMyOrganizedTournaments(): Promise<Tournament[]> {
  return apiClient<Tournament[]>("/organizer/my-tournaments");
}

export async function createTournament(payload: CreateTournamentPayload): Promise<Tournament> {
  return apiClient<Tournament>("/organizer/tournaments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTournament(tournamentId: string, payload: UpdateTournamentPayload): Promise<Tournament> {
  return apiClient<Tournament>(`/organizer/tournaments/${tournamentId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTournament(tournamentId: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/organizer/tournaments/${tournamentId}`, {
    method: "DELETE",
  });
}

export async function publishTournament(tournamentId: string): Promise<{ status: string; message: string }> {
  return apiClient(`/organizer/tournaments/${tournamentId}/publish`, {
    method: "POST",
  });
}

export async function generateBracket(tournamentId: string): Promise<{ status: string; message: string }> {
  return apiClient(`/organizer/tournaments/${tournamentId}/generate-bracket`, {
    method: "POST",
  });
}
