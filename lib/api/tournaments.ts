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
  start_date?: string;
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
  match_format?: string;
  series_format?: string;
  has_live_matches?: boolean;
  live_matches_count?: number;
  live_matches?: any[];
  community_platform?: "DISCORD" | "WHATSAPP" | null;
  community_link?: string | null;
  custom_rounds?: string[];
  registration_status?: string;
  is_registration_closed?: boolean;
  stream_url?: string;
  youtube_live_url?: string;
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
  matchFormat?: string;
  seriesFormat?: string;
  hasLiveMatches?: boolean;
  liveMatchesCount?: number;
  liveMatches?: any[];
  communityPlatform?: "DISCORD" | "WHATSAPP" | null;
  customRounds?: string[];
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
      : t.status === "REGISTRATION_CLOSED"
      ? "REGISTRATION CLOSED"
      : t.status === "COMPLETED"
      ? "FINAL RESULTS"
      : t.status === "CANCELLED"
      ? "CANCELLED"
      : t.status === "LIVE"
      ? "REGISTRATION CLOSED"
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
  let prizePoolNum = 0;
  if (t.prize_pool_inr !== undefined && t.prize_pool_inr !== null) {
    prizePoolNum = Number(t.prize_pool_inr) || 0;
  } else if (typeof t.prize_pool === "string") {
    const parsed = parseInt(t.prize_pool.replace(/[^0-9]/g, ""), 10);
    prizePoolNum = isNaN(parsed) ? 0 : parsed;
  } else if (typeof t.prizePoolNum === "number") {
    prizePoolNum = t.prizePoolNum;
  }

  const prizes = Array.isArray(rawPrizes) && rawPrizes.length > 0
    ? rawPrizes.map((p: any, idx: number) => ({
        rank: p.rank || p.place || (idx === 0 ? "1st Place" : idx === 1 ? "2nd Place" : `${idx + 1}th Place`),
        amount: p.amount || p.prize || `₹${p.prize_pool || "0"}`,
        share: p.share || (idx === 0 ? "60%" : idx === 1 ? "30%" : "10%"),
        badge: p.badge || (idx === 0 ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-slate-100 text-slate-800 border border-slate-200"),
      }))
    : [
        { rank: "1st Place", amount: `₹${Math.round(prizePoolNum * 0.6).toLocaleString("en-IN")}`, share: "60%", badge: "bg-amber-100 text-amber-900 border border-amber-300" },
        { rank: "2nd Place", amount: `₹${Math.round(prizePoolNum * 0.3).toLocaleString("en-IN")}`, share: "30%", badge: "bg-slate-100 text-slate-800 border border-slate-200" },
        { rank: "3rd Place", amount: `₹${Math.round(prizePoolNum * 0.1).toLocaleString("en-IN")}`, share: "10%", badge: "bg-slate-100 text-slate-800 border border-slate-200" },
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
          },
          teamB: {
            name: m.teamB?.name || m.team_b_name || "TBD",
            tag: m.teamB?.tag || m.team_b_tag || "TBD",
            score: m.teamB?.score ?? m.team_b_score ?? "-",
            isWinner: Boolean(m.teamB?.isWinner || m.team_b_winner),
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
    prizePool: t.prize_pool || t.prizePool || (prizePoolNum > 0 ? `₹${prizePoolNum.toLocaleString("en-IN")}` : "₹0"),
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
    bannerUrl: (() => {
      const b = t.banner_url || t.bannerUrl;
      if (!b || b.includes("aida") || b.includes("googleusercontent.com")) {
        return "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop";
      }
      return b;
    })(),
    badgeColor: t.badge_color || t.badgeColor || "#E56A10",
    description: t.description || "Official Sanctioned Tournament",
    rules,
    schedule,
    prizes,
    bracketRounds,
    registeredRosters: t.registered_rosters || t.registeredRosters || [],
    matchFormat: t.match_format || t.matchFormat || "SINGLE_ELIMINATION",
    seriesFormat: t.series_format || t.seriesFormat || "BO3",
    hasLiveMatches: Boolean(t.has_live_matches ?? t.hasLiveMatches ?? (Array.isArray(t.live_matches) && t.live_matches.length > 0)),
    liveMatchesCount: t.live_matches_count ?? t.liveMatchesCount ?? (Array.isArray(t.live_matches) ? t.live_matches.length : 0),
    communityPlatform: t.community_platform || t.communityPlatform || null,
    customRounds: t.custom_rounds || t.customRounds || [],
    liveMatches: t.live_matches || t.liveMatches || [],
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
  teamId?: string,
  gameId?: string
): Promise<{ status: string; message: string; order_id?: string; entry_fee_inr?: number }> {
  return apiClient(`/tournaments/${tournamentId}/register`, {
    method: "POST",
    body: JSON.stringify({
      ...(teamId ? { team_id: teamId } : {}),
      ...(gameId ? { game_id: gameId, in_game_id: gameId } : {}),
    }),
  });
}

export async function getMyTournamentRegistrations(): Promise<any[]> {
  return apiClient<any[]>("/tournaments/my-registrations");
}

export interface TournamentRegistrationStatus {
  is_registered: boolean;
  registration?: {
    id: string;
    tournament_id: string;
    team_id?: string;
    player_id?: string;
    payment_method: string;
    payment_status: string;
    payment_id?: string;
    utr?: string;
    registered_at?: string;
    check_in_status?: string;
  };
}

export interface TournamentRegisterUpiResponse {
  payment_id: string;
  registration_id: string;
  tournament_id: string;
  tournament_title: string;
  amount_inr: number;
  amount_paise: number;
  account_code: string;
  upi_id: string;
  payee_name: string;
  qr_url?: string;
  upi_uri: string;
  status: string;
}

export async function getTournamentRegistrationStatus(
  tournamentId: string,
  teamId?: string
): Promise<TournamentRegistrationStatus> {
  const query = teamId ? `?team_id=${encodeURIComponent(teamId)}` : "";
  return apiClient<TournamentRegistrationStatus>(`/tournaments/${tournamentId}/registration-status${query}`);
}

export async function registerForTournamentUpi(
  tournamentId: string,
  teamId?: string,
  gameId?: string
): Promise<TournamentRegisterUpiResponse> {
  return apiClient<TournamentRegisterUpiResponse>(`/tournaments/${tournamentId}/register-upi`, {
    method: "POST",
    body: JSON.stringify({
      ...(teamId ? { team_id: teamId } : {}),
      ...(gameId ? { game_id: gameId, in_game_id: gameId } : {}),
    }),
  });
}

export interface TournamentUpiDetails {
  tournament_id: string;
  tournament_title: string;
  entry_fee_inr: number;
  entry_fee_paise: number;
  account_code: string;
  upi_id: string;
  payee_name: string;
  qr_url?: string;
  upi_uri: string;
}

export async function getTournamentUpiDetails(
  tournamentId: string
): Promise<TournamentUpiDetails> {
  return apiClient<TournamentUpiDetails>(`/tournaments/${tournamentId}/upi-details`);
}

export async function submitTournamentUtr(
  tournamentId: string,
  payload: {
    payment_id?: string;
    utr: string;
    team_id?: string;
    account_code?: string;
    screenshot_url?: string;
    game_id?: string;
    in_game_id?: string;
  }
): Promise<{ status: string; message: string; payment_id: string; utr: string; payment_status?: string; registration_id?: string }> {
  return apiClient(`/tournaments/${tournamentId}/submit-upi-utr`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTournamentStageFormats(
  tournamentId: string,
  payload: {
    tournament_type?: string;
    match_format?: string;
    stage_formats?: Record<string, string>;
  }
): Promise<{ status: string; message: string; tournament_id: string }> {
  return apiClient(`/tournaments/admin/tournaments/${tournamentId}/stage-formats`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export interface TournamentHistoryResponse {
  tournament_id: string;
  tournament_name: string;
  tournament_status: string;
  live_stream_url?: string;
  stages: Array<{
    stage_id: string;
    stage_name: string;
    stage_order: number;
    stage_format: string;
    rounds: Array<{
      round_id: string;
      round_name: string;
      round_order: number;
      series_format: string;
      matches: Array<any>;
    }>;
  }>;
  matches: Array<any>;
}

export interface TeamJourneyStep {
  match_id: string;
  stage_id?: string;
  stage_name: string;
  round_id?: string;
  round_name: string;
  match_number: number;
  series_format: string;
  opponent_id?: string;
  opponent_name?: string;
  score: string;
  result: "WIN" | "LOSS" | "DRAW" | "PENDING";
  status: string;
  scheduled_time?: string;
  advancement?: any;
}

export interface TeamJourneyResponse {
  tournament_id: string;
  tournament_name: string;
  team_id: string;
  team_name: string;
  journey: TeamJourneyStep[];
}

export async function getTournamentHistory(tournamentId: string): Promise<TournamentHistoryResponse> {
  return apiClient<TournamentHistoryResponse>(`/tournaments/${tournamentId}/history`);
}

export async function getTeamJourney(tournamentId: string, teamId: string): Promise<TeamJourneyResponse> {
  return apiClient<TeamJourneyResponse>(`/tournaments/${tournamentId}/teams/${teamId}/journey`);
}

export interface TournamentCommunityInfo {
  community_platform: "DISCORD" | "WHATSAPP" | null;
  community_link: string | null;
}

export async function getTournamentCommunity(tournamentId: string): Promise<TournamentCommunityInfo> {
  return apiClient<TournamentCommunityInfo>(`/tournaments/${tournamentId}/community`);
}

export interface TournamentsSummary {
  total_prize_pool_inr: number;
  formatted_prize_pool: string;
  active_tournaments_count: number;
}

export async function getTournamentsSummary(): Promise<TournamentsSummary> {
  return apiClient<TournamentsSummary>("/tournaments/summary");
}


