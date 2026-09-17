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

export interface AdminUser {
  id: string;
  clerk_user_id?: string;
  username: string;
  display_name?: string;
  email: string;
  role: "PLAYER" | "ORGANIZER" | "SUPER_ADMIN";
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

export async function resolveDispute(
  disputeId: string,
  decision: "RESOLVED_UPHELD" | "RESOLVED_OVERTURNED" | "DISMISSED",
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
  role: "PLAYER" | "ORGANIZER" | "SUPER_ADMIN"
): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/users/${userId}/set-role`, {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

export async function triggerSeedCatalog(): Promise<{ status: string; message: string }> {
  return apiClient("/admin/seed-catalog", {
    method: "POST",
  });
}

