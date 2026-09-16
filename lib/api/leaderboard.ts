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

export async function getLeaderboard(category?: string): Promise<LeaderboardEntry[]> {
  const qs = category && category !== "all" ? `?category=${category}` : "";
  return apiClient<LeaderboardEntry[]>(`/leaderboard${qs}`);
}
