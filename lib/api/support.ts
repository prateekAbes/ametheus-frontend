import { apiClient } from "./client";

export interface SupportLog {
  id: string;
  ticket_id: string;
  action: string;
  timestamp: string;
  actor: string;
  actor_role: string;
  details: string;
}

export interface SupportTicket {
  id: string;
  ticket_id: string;
  name: string;
  email: string;
  user_id?: string | null;
  user_handle?: string | null;
  category: string;
  payment_type?: string | null;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_USER" | "RESOLVED" | "CLOSED";
  internal_notes?: string | null;
  email_status: "PENDING" | "SENT" | "FAILED";
  email_error?: string | null;
  logs: SupportLog[];
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface SupportTicketCreatePayload {
  name: string;
  email: string;
  category: string;
  payment_type?: string | null;
  description: string;
}

export interface SupportTicketUpdatePayload {
  status?: string;
  internal_notes?: string;
}

export interface SupportTicketPublicResponse {
  id: string;
  ticket_id: string;
  name: string;
  category: string;
  payment_type?: string | null;
  status: string;
  created_at: string;
  email_status?: string;
  email_error?: string | null;
  message: string;
}

export interface SupportTicketListResponse {
  tickets: SupportTicket[];
  total: number;
}

export async function createSupportTicket(
  payload: SupportTicketCreatePayload
): Promise<SupportTicketPublicResponse> {
  return apiClient<SupportTicketPublicResponse>("/support/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminSupportTickets(params?: {
  status?: string;
  category?: string;
  search?: string;
  limit?: number;
  skip?: number;
}): Promise<SupportTicketListResponse> {
  const q = new URLSearchParams();
  if (params?.status && params.status !== "ALL") q.set("status", params.status);
  if (params?.category && params.category !== "ALL") q.set("category", params.category);
  if (params?.search) q.set("search", params.search);
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.skip) q.set("skip", String(params.skip));

  const qs = q.toString();
  return apiClient<SupportTicketListResponse>(`/support/tickets${qs ? `?${qs}` : ""}`);
}

export async function getSupportTicketDetails(ticketId: string): Promise<SupportTicket> {
  return apiClient<SupportTicket>(`/support/tickets/${ticketId}`);
}

export async function updateSupportTicket(
  ticketId: string,
  payload: SupportTicketUpdatePayload
): Promise<SupportTicket> {
  return apiClient<SupportTicket>(`/support/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getMySupportTickets(): Promise<SupportTicket[]> {
  return apiClient<SupportTicket[]>("/support/my-tickets");
}
