import { apiClient } from "./client";

export interface GameRegulation {
  id: string;
  game_name: string;
  chapter_code: string;
  title: string;
  format: string;
  server: string;
  map_pool: string[];
  rules: string[];
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameRegulationCreatePayload {
  game_name: string;
  chapter_code: string;
  title: string;
  format: string;
  server: string;
  map_pool: string[];
  rules: string[];
  order?: number;
  is_active?: boolean;
}

export interface GameRegulationUpdatePayload {
  game_name?: string;
  chapter_code?: string;
  title?: string;
  format?: string;
  server?: string;
  map_pool?: string[];
  rules?: string[];
  order?: number;
  is_active?: boolean;
}

export interface RegulationTable {
  id: string;
  title: string;
  description?: string;
  columns: string[];
  rows: string[][];
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegulationTableCreatePayload {
  title: string;
  description?: string;
  columns: string[];
  rows: string[][];
  order?: number;
  is_active?: boolean;
}

export interface RegulationTableUpdatePayload {
  title?: string;
  description?: string;
  columns?: string[];
  rows?: string[][];
  order?: number;
  is_active?: boolean;
}

export async function getRegulations(all?: boolean): Promise<GameRegulation[]> {
  const qs = all ? "?all=true" : "";
  return apiClient<GameRegulation[]>(`/regulations${qs}`);
}

export async function createRegulation(payload: GameRegulationCreatePayload): Promise<GameRegulation> {
  return apiClient<GameRegulation>("/regulations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRegulation(id: string, payload: GameRegulationUpdatePayload): Promise<GameRegulation> {
  return apiClient<GameRegulation>(`/regulations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteRegulation(id: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/regulations/${id}`, {
    method: "DELETE",
  });
}

export async function reorderRegulations(orderedIds: string[]): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>("/regulations/reorder", {
    method: "POST",
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
}

export async function getRegulationTables(all?: boolean): Promise<RegulationTable[]> {
  const qs = all ? "?all=true" : "";
  return apiClient<RegulationTable[]>(`/regulations/tables${qs}`);
}

export async function createRegulationTable(payload: RegulationTableCreatePayload): Promise<RegulationTable> {
  return apiClient<RegulationTable>("/regulations/tables", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRegulationTable(id: string, payload: RegulationTableUpdatePayload): Promise<RegulationTable> {
  return apiClient<RegulationTable>(`/regulations/tables/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteRegulationTable(id: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/regulations/tables/${id}`, {
    method: "DELETE",
  });
}
