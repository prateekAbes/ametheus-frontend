import { apiClient } from "./client";

export interface TeamMember {
  id: string;
  user_id: string;
  username: string;
  role: string;
  game_handle: string;
}

export interface Team {
  id: string;
  game_slug: string;
  name: string;
  tag: string;
  invite_code: string;
  captain_id: string;
  captain_username: string;
  max_members: number;
  max_substitutes: number;
  payment_status: "UNPAID" | "PAYMENT_PENDING" | "PAID" | "PAYMENT_REJECTED";
  payment_id?: string;
  members: TeamMember[];
  substitutes: TeamMember[];
}

export interface CreateTeamPayload {
  game_slug: string;
  name: string;
  tag: string;
  captain_handle: string;
}

export interface JoinTeamPayload {
  invite_code: string;
  player_handle: string;
  is_substitute?: boolean;
}

export async function createTeam(payload: CreateTeamPayload): Promise<Team> {
  return apiClient<Team>("/teams", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function joinTeam(payload: JoinTeamPayload): Promise<Team> {
  return apiClient<Team>("/teams/join", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyTeams(gameSlug?: string): Promise<Team[]> {
  const q = gameSlug ? `?game_slug=${encodeURIComponent(gameSlug)}` : "";
  return apiClient<Team[]>(`/teams/my-teams${q}`);
}

export async function getTeamByCode(code: string): Promise<Team> {
  return apiClient<Team>(`/teams/code/${code}`);
}

export async function getTeamById(id: string): Promise<Team> {
  return apiClient<Team>(`/teams/${id}`);
}

export async function leaveTeam(id: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/teams/${id}/leave`, {
    method: "POST",
  });
}

export async function kickTeamMember(id: string, userId: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/teams/${id}/kick/${userId}`, {
    method: "POST",
  });
}

export async function deleteTeam(id: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/teams/${id}`, {
    method: "DELETE",
  });
}

export const disbandTeam = deleteTeam;
