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
  min_team_size?: number;
  max_team_size?: number;
  minTeamSize?: number;
  maxTeamSize?: number;
  rank_requirement: string;
  format: string;
  banner_url: string;
  badge_color: string;
  description: string;
  expected_start_date?: string;
  registration_open_date?: string;
  announcement_text?: string;
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
  minTeamSize: number;
  maxTeamSize: number;
  expectedStartDate?: string;
  registrationOpenDate?: string;
  announcementText?: string;
  rankRequirement: string;
  format: string;
  bannerUrl: string;
  badgeColor: string;
  description: string;
  rules: string[];
  schedule: Array<{ stage: string; time: string; details?: string }>;
  prizes: Array<{ place?: string; rank: string; badge: string; share: string; amount: string; distribution?: string }>;
  bracketRounds: any[];
  registeredRosters: Array<{ tag: string; name: string; captain: string; members: string[] }>;
}

export function normalizeTournament(t: any): NormalizedTournament {
  const statusLabel =
    t.status === "COMING_SOON"
      ? "COMING SOON"
      : t.status === "REGISTRATION_OPEN"
      ? "REGISTRATION OPEN"
      : t.status === "LIVE"
      ? "BRACKET LIVE"
      : t.status === "COMPLETED"
      ? "FINAL RESULTS"
      : t.status === "DRAFT"
      ? "DRAFT MODE"
      : t.statusLabel || t.status || "UPCOMING";

  const rawRules = t.rules || [];
  const rules = Array.isArray(rawRules)
    ? rawRules
    : typeof rawRules === "string"
    ? [rawRules]
    : ["Official platform tournament regulations apply"];

  const rawSchedule = t.schedule || [];
  const schedule = Array.isArray(rawSchedule) && rawSchedule.length > 0
    ? rawSchedule
    : [
        { stage: "Check-in Phase", time: t.roster_lock_time || t.rosterLockTime || "TBD", details: "Lobby check-in & ID verification" },
        { stage: "Opening Round", time: t.starts_at || t.startsAt || "TBD", details: "Single Elimination progression" },
      ];

  const rawPrizes = t.prizes || [];
  const prizePoolNum = t.prize_pool_inr !== undefined ? Number(t.prize_pool_inr) : (t.prizePoolNum ?? 50000);
  const prizes = Array.isArray(rawPrizes) && rawPrizes.length > 0
    ? rawPrizes.map((p: any, idx: number) => ({
        rank: p.rank || p.place || (idx === 0 ? "1st Place" : idx === 1 ? "2nd Place" : `${idx + 1}th Place`),
        amount: p.amount || p.prize || `₹${p.prize_pool || "0"}`,
        share: p.share || (idx === 0 ? "60%" : idx === 1 ? "30%" : "10%"),
        badge: p.badge || (idx === 0 ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-slate-100 text-slate-800 border border-slate-200"),
      }))
    : [
        { rank: "1st Place", amount: `₹${Math.round(prizePoolNum * 0.6).toLocaleString()}`, share: "60%", badge: "bg-amber-100 text-amber-900 border border-amber-300" },
        { rank: "2nd Place", amount: `₹${Math.round(prizePoolNum * 0.3).toLocaleString()}`, share: "30%", badge: "bg-slate-100 text-slate-800 border border-slate-200" },
        { rank: "3rd Place", amount: `₹${Math.round(prizePoolNum * 0.1).toLocaleString()}`, share: "10%", badge: "bg-slate-100 text-slate-800 border border-slate-200" },
      ];

  const rawRounds = Array.isArray(t.bracket_rounds) ? t.bracket_rounds : Array.isArray(t.bracketRounds) ? t.bracketRounds : [];
  const bracketRounds = rawRounds.map((round: any, rIdx: number) => ({
    name: round.name || round.round_name || `Round ${rIdx + 1}`,
    matches: Array.isArray(round.matches)
      ? round.matches.map((m: any, mIdx: number) => ({
          id: m.id || `match_${rIdx}_${mIdx}`,
          matchNumber: m.matchNumber ?? m.match_number ?? (mIdx + 1),
          scheduledTime: m.scheduledTime || m.scheduled_time || "TBD",
          status: m.status || "UPCOMING",
          teamA: {
            name: m.teamA?.name || m.team_a_name || "TBD",
            tag: m.teamA?.tag || m.team_a_tag || "TBD",
            score: m.teamA?.score ?? m.team_a_score ?? "-",
            isWinner: Boolean(m.teamA?.isWinner || m.team_a_winner),
            seed: m.teamA?.seed ?? m.team_a_seed,
          },
          teamB: {
            name: m.teamB?.name || m.team_b_name || "TBD",
            tag: m.teamB?.tag || m.team_b_tag || "TBD",
            score: m.teamB?.score ?? m.team_b_score ?? "-",
            isWinner: Boolean(m.teamB?.isWinner || m.team_b_winner),
            seed: m.teamB?.seed ?? m.team_b_seed,
          },
        }))
      : [],
  }));

  return {
    id: t.id || t.slug || "tournament",
    slug: t.slug || t.id || "tournament",
    organizerId: t.organizer_id || t.organizerId,
    title: t.title || "Championship Tournament",
    gameSlug: t.game_slug || t.gameSlug || "valorant",
    gameName: t.game_name || t.gameName || "Valorant",
    prizePool: t.prize_pool || t.prizePool || `₹${prizePoolNum.toLocaleString()}`,
    prizePoolNum,
    entryFee: t.entry_fee || t.entryFee || "Free Entry",
    entryFeeNum: t.entry_fee_inr !== undefined ? Number(t.entry_fee_inr) : (t.entryFeeNum ?? 0),
    status: t.status || "REGISTRATION_OPEN",
    statusLabel,
    startsAt: t.starts_at || t.startsAt || "Today, 8:00 PM IST",
    rosterLockTime: t.roster_lock_time || t.rosterLockTime || "7:45 PM IST",
    serverRegion: t.server_region || t.serverRegion || "AWS Mumbai (ap-south-1)",
    registeredTeams: t.registered_teams !== undefined ? Number(t.registered_teams) : (t.registeredTeams ?? 0),
    maxTeams: t.max_teams !== undefined ? Number(t.max_teams) : (t.maxTeams ?? 16),
    minTeamSize: t.min_team_size !== undefined ? Number(t.min_team_size) : (t.minTeamSize ?? 1),
    maxTeamSize: t.max_team_size !== undefined ? Number(t.max_team_size) : (t.maxTeamSize ?? 5),
    expectedStartDate: t.expected_start_date || t.expectedStartDate,
    registrationOpenDate: t.registration_open_date || t.registrationOpenDate,
    announcementText: t.announcement_text || t.announcementText,
    rankRequirement: t.rank_requirement || t.rankRequirement || "Open to All Ranks",
    format: t.format || "Single Elimination Bracket",
    bannerUrl: t.banner_url || t.bannerUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200",
    badgeColor: t.badge_color || t.badgeColor || "#E56A10",
    description: t.description || "Official Sanctioned Tournament",
    rules,
    schedule,
    prizes,
    bracketRounds,
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

export async function getTournamentMatches(slugOrId: string): Promise<any[]> {
  return apiClient<any[]>(`/tournaments/${slugOrId}/matches`);
}

export async function registerForTournament(
  tournamentId: string,
  teamId?: string
): Promise<{ status: string; message: string; order_id?: string; entry_fee_inr?: number }> {
  return apiClient(`/tournaments/${tournamentId}/register`, {
    method: "POST",
    body: JSON.stringify(teamId ? { team_id: teamId } : {}),
  });
}
