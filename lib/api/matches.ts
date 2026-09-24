import { apiClient } from "./client";

export interface Match {
  id: string;
  tournament_id: string;
  tournament_title: string;
  game_slug: string;
  game_name: string;
  stage: string;
  format: string;
  scheduled_time: string;
  status: string;
  server_region: string;
  lobby_code: string;
  lobby_password: string;
  team_a?: { id?: string; name: string; tag: string; score?: number } | null;
  team_b?: { id?: string; name: string; tag: string; score?: number } | null;
  team_a_id?: string;
  team_b_id?: string;
  winner_team_id?: string;
  evidence_url?: string;
  dispute_notes?: string;
}

export interface MatchResultPayload {
  score_a: number;
  score_b: number;
  evidence_url?: string;
  captain_notes?: string;
}

export async function getMatches(): Promise<Match[]> {
  return apiClient<Match[]>("/matches");
}

export async function checkInMatch(matchId: string): Promise<{ status: string; message: string }> {
  return apiClient(`/matches/${matchId}/check-in`, { method: "POST" });
}

export async function submitMatchResult(
  matchId: string,
  payload: MatchResultPayload
): Promise<{ status: string; message: string }> {
  return apiClient(`/matches/${matchId}/submit-result`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
