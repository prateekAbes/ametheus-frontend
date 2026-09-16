import { apiClient } from "./client";

export interface UserProfile {
  id: string;
  clerk_user_id?: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  role: "PLAYER" | "ORGANIZER" | "SUPER_ADMIN";
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
