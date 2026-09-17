import { apiClient } from "./client";

export interface PersonaAvatar {
  id: string;
  name: string;
  url: string;
}

export interface PersonaPool {
  names: string[];
  avatars: PersonaAvatar[];
}

export async function getPersonaPool(): Promise<PersonaPool> {
  return apiClient<PersonaPool>("/admin/persona-pool");
}

export async function addPersonaName(name: string): Promise<{ status: string; message: string }> {
  return apiClient("/admin/persona-pool/names", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function removePersonaName(name: string): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/persona-pool/names/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}

export async function addPersonaAvatar(name: string, url: string): Promise<{ status: string; message: string; avatar: PersonaAvatar }> {
  return apiClient("/admin/persona-pool/avatars", {
    method: "POST",
    body: JSON.stringify({ name, url }),
  });
}

export async function removePersonaAvatar(avatarId: string): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/persona-pool/avatars/${encodeURIComponent(avatarId)}`, {
    method: "DELETE",
  });
}
