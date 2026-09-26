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
  scheduled_at?: string;
  live_link?: string;
  order?: number;
  status: string;
  server_region: string;
  lobby_code: string;
  lobby_password: string;
  team_a?: { id?: string; name: string; tag: string; score?: number } | null;
  team_b?: { id?: string; name: string; tag: string; score?: number } | null;
  team_a_id?: string;
  team_b_id?: string;
  winner_team_id?: string;
  check_in_status?: Record<string, string>;
  evidence_url?: string;
  dispute_notes?: string;
}

export interface MatchResultPayload {
  score_a: number;
  score_b: number;
  evidence_url?: string;
  captain_notes?: string;
}

export interface LiveDashboardTournament {
  tournament_id: string;
  tournament_title: string;
  game_name: string;
  tournament_type: string;
  match_format: string;
  stage_formats: Record<string, string>;
  confirmed_teams_count: number;
  teams: Array<{ id: string; name: string; tag: string }>;
}

/** Shape returned by GET /admin/matches/live-dashboard */
export interface LiveDashboardData {
  /** Tournaments (or teams) ready for match creation */
  ready_for_match_creation: any[];
  /** Matches in SCHEDULED / CHECK_IN_OPEN state */
  scheduled: Match[];
  /** Matches currently LIVE / IN_PROGRESS */
  live_now: Match[];
  /** Completed matches */
  completed: Match[];
  // Legacy field names kept for compat — back-end may use either naming
  ready_tournaments?: LiveDashboardTournament[];
  scheduled_matches?: Match[];
  live_matches?: Match[];
  completed_matches?: Match[];
}

export interface PairMatchTeamsPayload {
  tournament_id: string;
  /** Team A identifier */
  team_a_id: string;
  /** Team B identifier */
  team_b_id: string;
  stage?: string;
  format?: string;
  scheduled_at?: string;
  live_link?: string;
}

export interface UpdateMatchSchedulePayload {
  scheduled_at: string;
  live_link?: string;
}

export interface UpdateMatchStatusPayload {
  status: string;
  stream_url?: string;
}

export interface UpdateMatchScorePayload {
  team1_score: number;
  team2_score: number;
  winner_team_id?: string;
  is_completed?: boolean;
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

export async function getLiveMatchesDashboard(): Promise<LiveDashboardData> {
  return apiClient<LiveDashboardData>("/admin/matches/live-dashboard");
}

export async function pairMatchTeams(payload: PairMatchTeamsPayload): Promise<{ status: string; message: string; match_id: string }> {
  return apiClient("/admin/matches/pair", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMatchSchedule(matchId: string, payload: UpdateMatchSchedulePayload): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/matches/${matchId}/schedule`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Update match status and optionally a live stream URL.
 * Accepts either a plain status string (shorthand) or a full UpdateMatchStatusPayload.
 */
export async function updateMatchStatus(
  matchId: string,
  statusOrPayload: string | UpdateMatchStatusPayload,
  liveLink?: string
): Promise<{ status: string; message: string }> {
  const payload: UpdateMatchStatusPayload =
    typeof statusOrPayload === "string"
      ? { status: statusOrPayload, stream_url: liveLink }
      : statusOrPayload;
  return apiClient(`/admin/matches/${matchId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Update match score.
 * Accepts either a score pair (scoreA, scoreB) or a full UpdateMatchScorePayload.
 */
export async function updateMatchScore(
  matchId: string,
  scoreAOrPayload: number | UpdateMatchScorePayload,
  scoreB?: number
): Promise<{ status: string; message: string; winner_team_id?: string }> {
  const payload: UpdateMatchScorePayload =
    typeof scoreAOrPayload === "number"
      ? { team1_score: scoreAOrPayload, team2_score: scoreB ?? 0 }
      : scoreAOrPayload;
  return apiClient(`/admin/matches/${matchId}/score`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
