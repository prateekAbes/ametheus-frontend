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
  max_substitutes?: number;
  entry_fee_inr?: number;
  prize_pool_inr?: number;
  play_url?: string;
  banner_url: string;
  logo_url: string;
  description: string;
  server_region: string;
  anti_cheat: string;
  match_protocol: string;
  accent_color: string;
  status: string;
  expected_release_date?: string;
  announcement_text?: string;
  hero_media_url?: string;
  hero_media_type?: string;
  hero_media_enabled?: boolean;
  gallery?: Array<{ id: string; url: string; caption?: string; order?: number }>;
  teams_count?: number;
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
  maxSubstitutes: number;
  entryFeeInr: number;
  prizePoolInr: number;
  playUrl?: string;
  bannerUrl: string;
  logoUrl: string;
  description: string;
  serverRegion: string;
  antiCheat: string;
  matchProtocol: string;
  accentColor: string;
  status: string;
  expectedReleaseDate?: string;
  announcementText?: string;
  heroMediaUrl?: string;
  heroMediaType?: string;
  heroMediaEnabled: boolean;
  gallery: Array<{ id: string; url: string; caption?: string; order?: number }>;
  teamsCount: number;
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
    maxSubstitutes: g.max_substitutes !== undefined ? Number(g.max_substitutes) : (g.maxSubstitutes ?? 1),
    entryFeeInr: g.entry_fee_inr !== undefined ? Number(g.entry_fee_inr) : (g.entryFeeInr ?? 0),
    prizePoolInr: g.prize_pool_inr !== undefined ? Number(g.prize_pool_inr) : (g.prizePoolInr ?? 0),
    playUrl: g.play_url || g.playUrl,
    status: g.status || "ACTIVE",
    expectedReleaseDate: g.expected_release_date || g.expectedReleaseDate,
    announcementText: g.announcement_text || g.announcementText,
    heroMediaUrl: g.hero_media_url || g.heroMediaUrl,
    heroMediaType: g.hero_media_type || g.heroMediaType || "gif",
    heroMediaEnabled: g.hero_media_enabled !== undefined ? Boolean(g.hero_media_enabled) : (g.heroMediaEnabled ?? true),
    gallery: Array.isArray(g.gallery) ? g.gallery : [],
    bannerUrl: (() => {
      const b = g.banner_url || g.bannerUrl;
      if (!b || b.includes("aida-public") || b.includes("googleusercontent.com")) {
        return "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop";
      }
      return b;
    })(),
    logoUrl: (() => {
      const l = g.logo_url || g.logoUrl;
      if (!l || l.includes("aida-public") || l.includes("googleusercontent.com")) {
        return "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&auto=format&fit=crop";
      }
      return l;
    })(),
    description: g.description || "",
    serverRegion: g.server_region || g.serverRegion || "AWS Mumbai (ap-south-1)",
    antiCheat: g.anti_cheat || g.antiCheat || "Hardware Vanguard TPM 2.0",
    matchProtocol: g.match_protocol || g.matchProtocol || "Competitive MR12",
    accentColor: g.accent_color || g.accentColor || "#E56A10",
    teamsCount: g.teams_count !== undefined ? Number(g.teams_count) : (g.teamsCount ?? 0),
  };
}

export async function getGames(params?: { status?: string }): Promise<Game[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return apiClient<Game[]>(`/games${qs ? `?${qs}` : ""}`);
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
  max_substitutes?: number;
  entry_fee_inr?: number;
  prize_pool_inr?: number;
  play_url?: string;
  banner_url: string;
  logo_url: string;
  description?: string;
  server_region?: string;
  anti_cheat?: string;
  match_protocol?: string;
  accent_color?: string;
  status?: string;
  expected_release_date?: string;
  announcement_text?: string;
  hero_media_url?: string;
  hero_media_type?: string;
  hero_media_enabled?: boolean;
  gallery?: Array<{ id: string; url: string; caption?: string; order?: number }>;
}

export interface GameUpdatePayload {
  name?: string;
  category?: string;
  platform?: string;
  tag?: string;
  is_team_game?: boolean;
  min_team_size?: number;
  max_team_size?: number;
  max_substitutes?: number;
  entry_fee_inr?: number;
  prize_pool_inr?: number;
  play_url?: string;
  banner_url?: string;
  logo_url?: string;
  description?: string;
  server_region?: string;
  anti_cheat?: string;
  match_protocol?: string;
  accent_color?: string;
  status?: string;
  expected_release_date?: string;
  announcement_text?: string;
  hero_media_url?: string;
  hero_media_type?: string;
  hero_media_enabled?: boolean;
  gallery?: Array<{ id: string; url: string; caption?: string; order?: number }>;
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

export async function publishGame(id: string): Promise<Game> {
  return apiClient<Game>(`/games/${id}/publish`, {
    method: "POST",
  });
}

export async function deleteGame(id: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/games/${id}`, {
    method: "DELETE",
  });
}
