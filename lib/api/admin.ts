import { apiClient } from "./client";

export interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  role: string;
  action: string;
  target: string;
  ip_address: string;
  prev_hash?: string;
  record_hash?: string;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return apiClient<AuditLog[]>("/admin/audit-logs");
}

export async function assignTournamentAdmin(
  tournamentId: string,
  adminUserId: string
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/tournaments/${tournamentId}/assign-admin`, {
    method: "POST",
    body: JSON.stringify({ admin_user_id: adminUserId, tournament_id: tournamentId }),
  });
}

export async function verifyMatchResult(
  matchId: string
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/matches/${matchId}/verify-result`, {
    method: "POST",
  });
}

export async function promoteUserToOrganizer(
  userId: string
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/users/${userId}/promote-organizer`, {
    method: "POST",
  });
}

export type PlatformRole =
  | "PLAYER"
  | "ORGANIZER"
  | "SUPER_ADMIN"
  | "TOURNAMENT_ADMIN"
  | "MATCH_ARBITER"
  | "COMMUNITY_MODERATOR";

export interface AdminUser {
  id: string;
  clerk_user_id?: string;
  username: string;
  display_name?: string;
  email: string;
  role: PlatformRole;
  inr_balance: string;
  created_at: string;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return apiClient<AdminUser[]>("/admin/users");
}

export interface AdminStats {
  total_users: number;
  total_tournaments: number;
  active_tournaments: number;
  total_teams: number;
  total_games: number;
  pending_disputes: number;
  active_matches: number;
  platform_escrow_vault: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  return apiClient<AdminStats>("/admin/stats");
}

export interface Dispute {
  id: string;
  tournament_id: string;
  match_id: string;
  submitted_by: string;
  reason: string;
  description: string;
  evidence_url?: string;
  status: string;
  created_at: string;
}

export async function getDisputes(): Promise<Dispute[]> {
  return apiClient<Dispute[]>("/admin/disputes");
}

export type DisputeDecision =
  | "RESOLVED_UPHELD"
  | "RESOLVED_OVERTURNED"
  | "DISMISSED"
  | "FORCE_FORFEIT_A"
  | "FORCE_FORFEIT_B"
  | "REFUND_ENTRY_FEES"
  | "ORDER_REMATCH";

export async function resolveDispute(
  disputeId: string,
  decision: DisputeDecision,
  resolutionNotes: string
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/disputes/${disputeId}/resolve`, {
    method: "POST",
    body: JSON.stringify({
      decision,
      resolution_notes: resolutionNotes,
    }),
  });
}

export async function setUserRole(
  userId: string,
  role: PlatformRole
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/users/${userId}/set-role`, {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

export async function forceMatchForfeit(
  matchId: string,
  forfeitedTeamId: string,
  reason: string
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/matches/${matchId}/forfeit`, {
    method: "POST",
    body: JSON.stringify({ forfeited_team_id: forfeitedTeamId, reason }),
  });
}

export async function overrideMatchScore(
  matchId: string,
  scoreA: number,
  scoreB: number,
  reason: string
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/matches/${matchId}/override-score`, {
    method: "POST",
    body: JSON.stringify({ score_a: scoreA, score_b: scoreB, reason }),
  });
}

export async function rejectMatchProof(
  matchId: string,
  reason: string
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/matches/${matchId}/reject-proof`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export interface UserWalletSummary {
  user_id: string;
  username: string;
  email: string;
  available_balance_inr: number;
  reserved_balance_inr: number;
  total_balance_inr: number;
  total_deposited_inr: number;
  total_withdrawn_inr: number;
  total_spent_inr: number;
  ledger: Array<{
    id: string;
    txn_type: string;
    direction: string;
    amount_inr: number;
    amount_paise: number;
    balance_after_inr: number;
    reference_id?: string;
    description: string;
    created_at: string;
  }>;
}

export async function getUserWalletSummary(userId: string): Promise<UserWalletSummary> {
  return apiClient<UserWalletSummary>(`/admin/users/${userId}/wallet-summary`);
}

export interface RegisteredRosterMember {
  user_id: string;
  username: string;
  game_id?: string;
  role?: string;
}

export interface RegisteredRosterTeam {
  id?: string;
  team_id: string;
  name?: string;
  team_name: string;
  tag?: string;
  team_tag: string;
  captain: {
    user_id: string;
    username: string;
    game_id?: string;
  };
  captain_username?: string;
  members: RegisteredRosterMember[];
  member_handles?: string[];
  is_paired?: boolean;
  is_solo?: boolean;
}

export interface TournamentRegisteredRostersResponse {
  tournament_id: string;
  tournament_title: string;
  game_name: string;
  game_slug: string;
  match_format: string;
  series_format: string;
  status?: string;
  tournament_status?: string;
  total_registered?: number;
  total_teams?: number;
  teams: RegisteredRosterTeam[];
  rosters?: RegisteredRosterTeam[];
}

export interface AdminMatchSetupItem {
  id?: string;
  round_number?: number;
  match_number?: number;
  stage: string;
  match_type: string;
  series_format: string;
  team_a_id?: string | null;
  team_b_id?: string | null;
  team_a_name?: string | null;
  team_b_name?: string | null;
  scheduled_date?: string;
  scheduled_time?: string;
  scheduled_at?: string | null;
  youtube_live_url?: string;
  status?: string;
}

export interface AdminSaveLiveStructurePayload {
  match_format: string;
  series_format: string;
  matches: AdminMatchSetupItem[];
}

export interface AdminMatchCreatePayload {
  tournament_id: string;
  team_a_id?: string;
  team_b_id?: string;
  team_a_name?: string;
  team_b_name?: string;
  team_a_placeholder?: string;
  team_b_placeholder?: string;
  round_name?: string;
  round_number?: number;
  match_number?: number;
  match_type?: string;
  stage?: string;
  series_format?: string;
  match_format?: string;
  scheduled_at?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  youtube_live_url?: string;
  status?: string;
  score_a?: number;
  score_b?: number;
  winner_team_id?: string;
  games?: any[];
  // Backwards compatibility
  team1_id?: string;
  team2_id?: string;
}

export interface AdminMatchUpdatePayload {
  team_a_id?: string;
  team_b_id?: string;
  team_a_name?: string;
  team_b_name?: string;
  team_a_placeholder?: string;
  team_b_placeholder?: string;
  round_name?: string;
  round_number?: number;
  match_number?: number;
  match_type?: string;
  stage?: string;
  series_format?: string;
  match_format?: string;
  scheduled_at?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  youtube_live_url?: string;
  status?: string;
  score_a?: number;
  score_b?: number;
  winner_team_id?: string;
  games?: any[];
  // Backwards compatibility
  team1_id?: string;
  team2_id?: string;
}

export async function updateTournamentFormat(
  tournamentId: string,
  format: string
): Promise<{ status: string; message: string; format: string }> {
  return apiClient(`/admin/tournaments/${tournamentId}/format`, {
    method: "PATCH",
    body: JSON.stringify({ format }),
  });
}

export async function sendAdminNotification(payload: {
  user_ids: string[];
  title: string;
  message: string;
  notification_type?: string;
  link?: string;
}): Promise<{ status: string; message: string; sent_count: number }> {
  return apiClient("/admin/notifications/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function searchUsersAdmin(search?: string): Promise<AdminUser[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiClient<AdminUser[]>(`/admin/users${q}`);
}

export interface AdminMarkMatchLivePayload {
  youtube_live_url: string;
}

export interface AdminCompleteMatchPayload {
  team1_score: number;
  team2_score: number;
  winner_id: string;
}

export async function closeTournamentRegistration(
  tournamentId: string
): Promise<{ status: string; message: string; tournament_id: string; tournament_status: string }> {
  return apiClient(`/admin/tournaments/${tournamentId}/close-registration`, {
    method: "POST",
  });
}

export async function getTournamentRegisteredRosters(
  tournamentId: string
): Promise<TournamentRegisteredRostersResponse> {
  return apiClient<TournamentRegisteredRostersResponse>(`/admin/tournaments/${tournamentId}/registered-rosters`);
}

export async function generateMatchStructure(
  tournamentId: string,
  payload: { match_format: string; series_format?: string }
): Promise<{
  status: string;
  message: string;
  bracket?: any[];
  matches?: AdminMatchSetupItem[];
}> {
  return apiClient(`/admin/tournaments/${tournamentId}/generate-match-structure`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function saveLiveMatchStructure(
  tournamentId: string,
  payload: AdminSaveLiveStructurePayload
): Promise<{ status: string; message: string; total_matches: number; bracket_rounds: any[] }> {
  return apiClient(`/admin/tournaments/${tournamentId}/save-live-structure`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createMatchAdmin(
  payload: AdminMatchCreatePayload
): Promise<{ status: string; message: string; match_id: string }> {
  return apiClient("/admin/matches", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMatchDetailsAdmin(
  matchId: string,
  payload: AdminMatchUpdatePayload
): Promise<{ status: string; message: string; match_id: string }> {
  return apiClient(`/admin/matches/${matchId}/update`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteMatchAdmin(
  matchId: string
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/matches/${matchId}`, {
    method: "DELETE",
  });
}

export async function markMatchLiveAdmin(
  matchId: string,
  payload: AdminMarkMatchLivePayload
): Promise<{ status: string; message: string; match_id: string; youtube_live_url: string }> {
  return apiClient(`/admin/matches/${matchId}/mark-live`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function completeMatchAdmin(
  matchId: string,
  payload: AdminCompleteMatchPayload
): Promise<{ status: string; message: string; match_id: string; winner_id: string }> {
  return apiClient(`/admin/matches/${matchId}/complete`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface AdminStageRound {
  id: string;
  round_id: string;
  stage_id?: string;
  round_number: number;
  round_order: number;
  name: string;
  round_name: string;
  status: string;
  series_format: string;
  scheduled_date?: string;
  scheduled_time?: string;
  match_ids: string[];
}

export interface AdminTournamentStage {
  id: string;
  stage_id: string;
  stage_number: number;
  stage_order: number;
  name: string;
  stage_name: string;
  format: string;
  stage_format: string;
  status: string;
  series_format: string;
  advancing_teams_count?: number;
  qualified_team_ids: string[];
  eliminated_team_ids: string[];
  rounds: AdminStageRound[];
}

export interface WalletAuditLogItem {
  id: string;
  user_id: string;
  username: string;
  user_email: string;
  txn_type: string;
  amount_paise: number;
  amount_inr: number;
  balance_before_paise: number;
  balance_before_inr: number;
  balance_after_paise: number;
  balance_after_inr: number;
  reference_id?: string;
  description: string;
  admin_id?: string;
  created_at: string;
}

export interface WalletAuditSummary {
  status: string;
  system_aggregate_balance: number;
  total_users: number;
  total_transactions: number;
  total_credited_inr: number;
  total_debited_inr: number;
  transactions: WalletAuditLogItem[];
}

export async function getTournamentStages(tournamentId: string): Promise<{
  status: string;
  stages: AdminTournamentStage[];
  live_stream_url?: string;
}> {
  return apiClient(`/admin/tournaments/${tournamentId}/stages`);
}

export async function createTournamentStage(
  tournamentId: string,
  payload: { name: string; format: string; series_format: string; advancing_teams_count?: number }
): Promise<{ status: string; message: string; stage: AdminTournamentStage }> {
  return apiClient(`/admin/tournaments/${tournamentId}/stages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTournamentStage(
  tournamentId: string,
  stageId: string,
  payload: Partial<{ name: string; format: string; series_format: string; advancing_teams_count?: number; status: string }>
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/tournaments/${tournamentId}/stages/${stageId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteTournamentStage(
  tournamentId: string,
  stageId: string
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/tournaments/${tournamentId}/stages/${stageId}`, {
    method: "DELETE",
  });
}

export async function reorderTournamentStages(
  tournamentId: string,
  stageIds: string[]
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/tournaments/${tournamentId}/stages/reorder`, {
    method: "POST",
    body: JSON.stringify({ stage_ids: stageIds }),
  });
}

export async function createStageRound(
  tournamentId: string,
  stageId: string,
  payload: { name: string; series_format?: string; scheduled_date?: string; scheduled_time?: string; round_number?: number }
): Promise<{ status: string; message: string; round: AdminStageRound }> {
  return apiClient(`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateStageRound(
  tournamentId: string,
  stageId: string,
  roundId: string,
  payload: Partial<{ name: string; series_format?: string; scheduled_date?: string; scheduled_time?: string; status: string }>
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds/${roundId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteStageRound(
  tournamentId: string,
  stageId: string,
  roundId: string
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds/${roundId}`, {
    method: "DELETE",
  });
}

export async function createStageMatch(
  tournamentId: string,
  stageId: string,
  roundId: string,
  payload: {
    team_a_id?: string;
    team_b_id?: string;
    team_a_name?: string;
    team_b_name?: string;
    series_format: string;
    scheduled_date?: string;
    scheduled_time?: string;
    youtube_live_url?: string;
    match_number?: number;
  }
): Promise<{ status: string; message: string; match: any }> {
  return apiClient(`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds/${roundId}/matches`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function swapMatchTeams(matchId: string): Promise<{ status: string; message: string; match: any }> {
  return apiClient(`/admin/matches/${matchId}/swap`, {
    method: "POST",
  });
}

export async function getMatchAdvancementOptions(matchId: string): Promise<{
  source_match: any;
  suggested: {
    stage_id: string;
    stage_name: string;
    round_id: string;
    round_name: string;
    match_id?: string;
    match_number: number;
    slot: "team_a" | "team_b";
  };
  available_destinations: Array<{
    stage_id: string;
    stage_name: string;
    stage_order: number;
    rounds: Array<{
      round_id: string;
      round_name: string;
      round_order: number;
      matches: Array<{
        match_id: string;
        match_number: number;
        team_a_id?: string;
        team_a_name?: string;
        team_b_id?: string;
        team_b_name?: string;
        status: string;
      }>;
    }>;
  }>;
}> {
  return apiClient(`/admin/matches/${matchId}/advancement-options`);
}

export async function advanceMatchWinner(
  matchId: string,
  payload: {
    winner_team_id?: string;
    destination_stage_id: string;
    destination_round_id: string;
    destination_match_id: string;
    destination_slot: string;
  }
): Promise<{ status: string; message: string; destination_match: any; source_match: any }> {
  return apiClient(`/admin/matches/${matchId}/advance`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function revertMatchAdvancement(matchId: string): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/matches/${matchId}/revert-advancement`, {
    method: "POST",
  });
}

export async function updateTournamentStream(
  tournamentId: string,
  liveStreamUrl: string
): Promise<{ status: string; message: string; live_stream_url: string }> {
  return apiClient(`/admin/tournaments/${tournamentId}/stream`, {
    method: "PATCH",
    body: JSON.stringify({ live_stream_url: liveStreamUrl }),
  });
}

export async function getWalletAuditLogs(params?: {
  search?: string;
  txn_type?: string;
  limit?: number;
  skip?: number;
}): Promise<WalletAuditSummary> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.txn_type && params.txn_type !== "ALL") query.set("txn_type", params.txn_type);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.skip) query.set("skip", String(params.skip));
  const qs = query.toString();
  return apiClient<WalletAuditSummary>(`/admin/wallet-audit-logs${qs ? `?${qs}` : ""}`);
}



