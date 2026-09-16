import { apiClient } from "./client";

export interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  role: string;
  action: string;
  target: string;
  ip_address: string;
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

