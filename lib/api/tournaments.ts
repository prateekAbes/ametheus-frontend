import { apiClient } from "./client";

export interface Tournament {
  id: string;
  slug: string;
  organizer_id?: string;
  title: string;
  game_slug: string;
  game_name: string;
  prize_pool: string;
  prize_pool_inr: number;
  entry_fee: string;
  entry_fee_inr: number;
  status: string;
  starts_at: string;
  roster_lock_time: string;
  server_region: string;
  registered_teams: number;
  max_teams: number;
  rank_requirement: string;
  format: string;
  banner_url: string;
  badge_color: string;
  description: string;
  rules: string[];
  schedule: Array<{ stage: string; time: string; details?: string }>;
  prizes: Array<{ place?: string; rank?: string; badge?: string; share?: string; amount?: string; prize?: string; distribution?: string }>;
  bracket_rounds: Record<string, unknown>[];
  registered_rosters: Record<string, unknown>[];
}

export interface NormalizedTournament {
  id: string;
  slug: string;
  organizerId?: string;
  title: string;
  gameSlug: string;
  gameName: string;
  prizePool: string;
  prizePoolNum: number;
  entryFee: string;
  entryFeeNum: number;
  status: string;
  statusLabel: string;
  startsAt: string;
  rosterLockTime: string;
  serverRegion: string;
  registeredTeams: number;
  maxTeams: number;
  rankRequirement: string;
  format: string;
  bannerUrl: string;
  badgeColor: string;
  description: string;
  rules: string[];
  schedule: Array<{ stage: string; time: string; details?: string }>;
  prizes: Array<{ place?: string; rank?: string; badge?: string; share?: string; amount: string; distribution?: string }>;
  bracketRounds: any[];
  registeredRosters: Array<{ tag: string; name: string; captain: string; members: string[] }>;
}

export function normalizeTournament(t: any): NormalizedTournament {
  const statusLabel =
    t.status === "REGISTRATION_OPEN"
      ? "REGISTRATION OPEN"
      : t.status === "LIVE"
      ? "BRACKET LIVE"
      : t.status === "COMPLETED"
      ? "FINAL RESULTS"
      : t.status === "DRAFT"
      ? "DRAFT MODE"
      : t.statusLabel || t.status || "UPCOMING";

  return {
    id: t.id || t.slug,
    slug: t.slug,
    organizerId: t.organizer_id || t.organizerId,
    title: t.title,
    gameSlug: t.game_slug || t.gameSlug || "valorant",
    gameName: t.game_name || t.gameName || "Valorant",
    prizePool: t.prize_pool || t.prizePool || "₹50,000",
    prizePoolNum: t.prize_pool_inr !== undefined ? Number(t.prize_pool_inr) : (t.prizePoolNum ?? 50000),
    entryFee: t.entry_fee || t.entryFee || "Free Entry",
    entryFeeNum: t.entry_fee_inr !== undefined ? Number(t.entry_fee_inr) : (t.entryFeeNum ?? 0),
    status: t.status || "REGISTRATION_OPEN",
    statusLabel,
    startsAt: t.starts_at || t.startsAt || "Today, 8:00 PM IST",
    rosterLockTime: t.roster_lock_time || t.rosterLockTime || "7:45 PM IST",
    serverRegion: t.server_region || t.serverRegion || "AWS Mumbai (ap-south-1)",
    registeredTeams: t.registered_teams !== undefined ? Number(t.registered_teams) : (t.registeredTeams ?? 0),
    maxTeams: t.max_teams !== undefined ? Number(t.max_teams) : (t.maxTeams ?? 16),
    rankRequirement: t.rank_requirement || t.rankRequirement || "Open to All Ranks",
    format: t.format || "Single Elimination Bracket",
    bannerUrl: t.banner_url || t.bannerUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuD-g0bK72p2tQe7b3Z3F5WzX8oV0h4vM1bX2m9x_banner",
    badgeColor: t.badge_color || t.badgeColor || "#E56A10",
    description: t.description || "Official Sanctioned Tournament",
    rules: t.rules || [],
    schedule: t.schedule || [],
    prizes: t.prizes || [],
    bracketRounds: t.bracket_rounds || t.bracketRounds || [],
    registeredRosters: t.registered_rosters || t.registeredRosters || [],
  };
}

export async function getTournaments(params?: {
  game?: string;
  status?: string;
}): Promise<Tournament[]> {
  const query = new URLSearchParams();
  if (params?.game) query.set("game", params.game);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return apiClient<Tournament[]>(`/tournaments${qs ? `?${qs}` : ""}`);
}

export async function getTournamentBySlug(slug: string): Promise<Tournament> {
  return apiClient<Tournament>(`/tournaments/${slug}`);
}

export async function registerForTournament(
  tournamentId: string,
  teamId: string
): Promise<{ status: string; message: string; order_id?: string; entry_fee_inr?: number }> {
  return apiClient(`/tournaments/${tournamentId}/register`, {
    method: "POST",
    body: JSON.stringify({ team_id: teamId }),
  });
}
