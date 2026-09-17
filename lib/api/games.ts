import { apiClient } from "./client";

export interface Game {
  id: string;
  slug: string;
  name: string;
  category: string;
  platform: string;
  tag: string;
  is_team_game: boolean;
  min_team_size: number;
  max_team_size: number;
  banner_url: string;
  logo_url: string;
  description: string;
  server_region: string;
  anti_cheat: string;
  match_protocol: string;
  accent_color: string;
  active_tournaments_count: number;
}

export interface NormalizedGame {
  id: string;
  slug: string;
  name: string;
  category: string;
  platform: string;
  tag: string;
  isTeamGame: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  bannerUrl: string;
  logoUrl: string;
  description: string;
  serverRegion: string;
  antiCheat: string;
  matchProtocol: string;
  accentColor: string;
  activeTournaments: number;
  upcomingTournaments: number;
  activePool: string;
}

export function normalizeGame(g: any): NormalizedGame {
  return {
    id: g.id || g.slug,
    slug: g.slug,
    name: g.name,
    category: g.category || "pc",
    platform: g.platform || "PC",
    tag: g.tag || "ESPORTS",
    isTeamGame: g.is_team_game !== undefined ? Boolean(g.is_team_game) : (g.isTeamGame ?? true),
    minTeamSize: g.min_team_size !== undefined ? Number(g.min_team_size) : (g.minTeamSize ?? 1),
    maxTeamSize: g.max_team_size !== undefined ? Number(g.max_team_size) : (g.maxTeamSize ?? 5),
    bannerUrl: g.banner_url || g.bannerUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuD-g0bK72p2tQe7b3Z3F5WzX8oV0h4vM1bX2m9x_banner",
    logoUrl: g.logo_url || g.logoUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuD-g0bK72p2tQe7b3Z3F5WzX8oV0h4vM1bX2m9x_banner",
    description: g.description || "",
    serverRegion: g.server_region || g.serverRegion || "AWS Mumbai (ap-south-1)",
    antiCheat: g.anti_cheat || g.antiCheat || "Hardware Vanguard TPM 2.0",
    matchProtocol: g.match_protocol || g.matchProtocol || "Competitive MR12",
    accentColor: g.accent_color || g.accentColor || "#E56A10",
    activeTournaments: g.active_tournaments_count !== undefined ? Number(g.active_tournaments_count) : (g.activeTournaments ?? 1),
    upcomingTournaments: g.upcomingTournaments ?? 2,
    activePool: g.activePool || "₹50,000",
  };
}

export async function getGames(): Promise<Game[]> {
  return apiClient<Game[]>("/games");
}

export async function getGameBySlug(slug: string): Promise<Game> {
  return apiClient<Game>(`/games/${slug}`);
}

export interface GameCreatePayload {
  slug: string;
  name: string;
  category?: string;
  platform: string;
  tag: string;
  is_team_game?: boolean;
  min_team_size?: number;
  max_team_size?: number;
  banner_url: string;
  logo_url: string;
  description?: string;
  server_region?: string;
  anti_cheat?: string;
  match_protocol?: string;
  accent_color?: string;
}

export interface GameUpdatePayload {
  name?: string;
  category?: string;
  platform?: string;
  tag?: string;
  is_team_game?: boolean;
  min_team_size?: number;
  max_team_size?: number;
  banner_url?: string;
  logo_url?: string;
  description?: string;
  server_region?: string;
  anti_cheat?: string;
  match_protocol?: string;
  accent_color?: string;
}

export async function createGame(payload: GameCreatePayload): Promise<Game> {
  return apiClient<Game>("/games", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateGame(id: string, payload: GameUpdatePayload): Promise<Game> {
  return apiClient<Game>(`/games/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteGame(id: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/games/${id}`, {
    method: "DELETE",
  });
}

