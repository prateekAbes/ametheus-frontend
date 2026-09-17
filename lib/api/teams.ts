import { apiClient } from "./client";

export interface TeamMember {
  id: string;
  user_id: string;
  username: string;
  role: "CAPTAIN" | "MEMBER";
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
  members: TeamMember[];
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
}

export async function getMyTeams(): Promise<Team[]> {
  return apiClient<Team[]>("/teams/my-teams");
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

export async function getTeam(teamId: string): Promise<Team> {
  return apiClient<Team>(`/teams/${teamId}`);
}

export async function getTeamByCode(code: string): Promise<Team> {
  return apiClient<Team>(`/teams/code/${encodeURIComponent(code)}`);
}

export async function leaveTeam(teamId: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/teams/${teamId}/leave`, {
    method: "POST",
  });
}

export async function kickTeamMember(teamId: string, userId: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/teams/${teamId}/kick/${userId}`, {
    method: "POST",
  });
}

export async function disbandTeam(teamId: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/teams/${teamId}`, {
    method: "DELETE",
  });
}


