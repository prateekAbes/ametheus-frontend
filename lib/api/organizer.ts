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
  rank_requirement?: string;
  format?: string;
  banner_url?: string;
  description: string;
  rules?: string[];
  schedule?: Array<{ stage: string; time: string; details?: string }>;
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
