import { apiClient } from "./client";
import { PaymentRecord } from "./payments";

export interface PayoutRecord {
  id: string;
  payout_type: "GAME_WINNING" | "WALLET_WITHDRAWAL";
  user_id: string;
  user_name?: string;
  amount_paise: number;
  amount_inr: number;
  destination: "UPI" | "WALLET";
  upi_id?: string;
  game_id?: string;
  game_name?: string;
  rank_or_placement?: string;
  status: "PENDING" | "PAID" | "REJECTED";
  outgoing_utr?: string;
  rejection_reason?: string;
  created_at: string;
  is_archived?: boolean;
  archived_at?: string;
  archived_by?: string;
  archive_reason?: string;
}

export async function getAdminPayments(
  statusFilter?: string,
  gameId?: string,
  isArchived: boolean = false
): Promise<PaymentRecord[]> {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== "ALL") params.set("status_filter", statusFilter);
  if (gameId) params.set("game_id", gameId);
  params.set("is_archived", String(isArchived));
  const q = params.toString();
  return apiClient<PaymentRecord[]>(`/admin/payments${q ? `?${q}` : ""}`);
}

export async function approvePayment(paymentId: string): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/payments/${paymentId}/approve`, {
    method: "POST",
  });
}

export async function rejectPayment(paymentId: string, reason?: string): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/payments/${paymentId}/reject`, {
    method: "POST",
    body: JSON.stringify({ rejection_reason: reason }),
  });
}

export async function getAdminPayouts(
  statusFilter?: string,
  isArchived: boolean = false
): Promise<PayoutRecord[]> {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== "ALL") params.set("status_filter", statusFilter);
  params.set("is_archived", String(isArchived));
  const q = params.toString();
  return apiClient<PayoutRecord[]>(`/admin/payouts?${q}`);
}

export async function createWinningPayout(payload: {
  user_id: string;
  game_id: string;
  rank_or_placement: string;
  amount_inr: number;
  destination: "WALLET" | "UPI";
  upi_id?: string;
}): Promise<{ status: string; message: string }> {
  return apiClient("/admin/payouts/create-winning", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function completePayout(payoutId: string, outgoingUtr: string): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/payouts/${payoutId}/complete`, {
    method: "POST",
    body: JSON.stringify({ outgoing_utr: outgoingUtr }),
  });
}

export async function rejectPayout(payoutId: string, reason: string): Promise<{ status: string; message: string }> {
  return apiClient(`/admin/payouts/${payoutId}/reject`, {
    method: "POST",
    body: JSON.stringify({ rejection_reason: reason }),
  });
}
