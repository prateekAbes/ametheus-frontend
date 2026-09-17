import { apiClient } from "./client";

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  tag: string;
  type: string;
  game_slug: string;
  game_name: string;
  captain: string;
  logo_url: string;
  win_rate: number;
  matches_played: number;
  wins: number;
  losses: number;
  rating: number;
  earnings: number;
  form: string[];
  is_verified: boolean;
  category: string;
}

export interface LeaderboardCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  game_slug: string;
  sort_metric: string;
  min_matches: number;
  is_system: boolean;
  created_at: string;
}

export interface LeaderboardCategoryCreatePayload {
  name: string;
  slug?: string;
  description?: string;
  game_slug?: string;
  sort_metric?: "rating" | "win_rate" | "earnings" | "wins" | "matches_played";
  min_matches?: number;
}

export async function getLeaderboard(category?: string, game?: string): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams();
  if (category && category !== "all") params.append("category", category);
  if (game && game !== "all") params.append("game", game);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiClient<LeaderboardEntry[]>(`/leaderboard${qs}`);
}

export async function getLeaderboardCategories(): Promise<LeaderboardCategory[]> {
  return apiClient<LeaderboardCategory[]>("/leaderboard/categories");
}

export async function createLeaderboardCategory(payload: LeaderboardCategoryCreatePayload): Promise<LeaderboardCategory> {
  return apiClient<LeaderboardCategory>("/leaderboard/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteLeaderboardCategory(slug: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/leaderboard/categories/${slug}`, {
    method: "DELETE",
  });
}

export interface LeaderboardDisqualification {
  id: string;
  entity_id: string;
  entity_name: string;
  entity_tag?: string;
  reason: string;
  notes?: string;
  disqualified_by: string;
  disqualified_at: string;
}

export async function getDisqualifiedEntries(): Promise<LeaderboardDisqualification[]> {
  return apiClient<LeaderboardDisqualification[]>("/leaderboard/disqualifications");
}

export async function disqualifyLeaderboardEntry(payload: {
  entity_id: string;
  entity_name: string;
  entity_tag?: string;
  reason: string;
  notes?: string;
}): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>("/leaderboard/disqualify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function reinstateLeaderboardEntry(entityId: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/leaderboard/disqualify/${entityId}`, {
    method: "DELETE",
  });
}

export interface LeaderboardStats {
  total_awarded_prizes: string;
  active_contenders: string;
  verified_squads: string;
  top_team_earnings: string;
  top_team_name: string;
}

export interface CustomLeaderboardEntryPayload {
  name: string;
  tag: string;
  type?: string;
  game_slug?: string;
  game_name?: string;
  captain?: string;
  logo_url?: string;
  win_rate?: number;
  matches_played?: number;
  wins?: number;
  losses?: number;
  rating?: number;
  earnings?: number;
  category?: string;
}

export async function getLeaderboardStats(): Promise<LeaderboardStats> {
  return apiClient<LeaderboardStats>("/leaderboard/stats");
}

export async function updateLeaderboardStats(payload: Partial<LeaderboardStats>): Promise<LeaderboardStats> {
  return apiClient<LeaderboardStats>("/leaderboard/stats", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createLeaderboardEntry(payload: CustomLeaderboardEntryPayload): Promise<LeaderboardEntry> {
  return apiClient<LeaderboardEntry>("/leaderboard/entries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function removeLeaderboardEntry(entityId: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/leaderboard/entries/${entityId}`, {
    method: "DELETE",
  });
}
