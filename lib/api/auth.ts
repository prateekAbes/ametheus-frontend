import { apiClient } from "./client";

export interface UserProfile {
  id: string;
  clerk_user_id?: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  role: "PLAYER" | "ORGANIZER" | "SUPER_ADMIN" | "TOURNAMENT_ADMIN" | "MATCH_ARBITER" | "COMMUNITY_MODERATOR";
  inr_balance: string;
  riot_id?: string;
  steam_id?: string;
}

export interface UserSyncPayload {
  clerk_user_id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

export async function syncUser(payload: UserSyncPayload): Promise<UserProfile> {
  return apiClient<UserProfile>("/auth/sync", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  return apiClient<UserProfile>("/auth/me");
}

export interface UserProfileUpdatePayload {
  display_name?: string;
  riot_id?: string;
  steam_id?: string;
  avatar_url?: string;
}

export async function updateUserProfile(payload: UserProfileUpdatePayload): Promise<UserProfile> {
  return apiClient<UserProfile>("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

