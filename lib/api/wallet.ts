import { apiClient } from "./client";

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  amount: number;
  upi_id: string;
  account_holder_name?: string;
  notes?: string;
  status: "PENDING_APPROVAL" | "COMPLETED" | "REJECTED";
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  payout_reference?: string;
  admin_notes?: string;
}

export interface WithdrawalRequestPayload {
  amount: number;
  upi_id: string;
  account_holder_name?: string;
  notes?: string;
}

export interface WithdrawalResponse {
  status: string;
  message: string;
  request: {
    id: string;
    amount: number;
    upi_id: string;
    status: string;
    created_at: string;
  };
  new_balance: number;
}

export async function requestWithdrawal(payload: WithdrawalRequestPayload): Promise<WithdrawalResponse> {
  return apiClient<WithdrawalResponse>("/wallet/withdraw", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyWithdrawals(): Promise<WithdrawalRequest[]> {
  return apiClient<WithdrawalRequest[]>("/wallet/withdrawals/my");
}

export async function getAdminWithdrawals(status?: string): Promise<WithdrawalRequest[]> {
  const q = status ? `?status_filter=${encodeURIComponent(status)}` : "";
  return apiClient<WithdrawalRequest[]>(`/wallet/withdrawals/admin${q}`);
}

export async function approveWithdrawal(
  requestId: string,
  payload?: { payout_reference?: string; admin_notes?: string }
): Promise<{ status: string; message: string; request_id: string; payout_reference: string }> {
  return apiClient(`/wallet/withdrawals/${requestId}/approve`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function rejectWithdrawal(
  requestId: string,
  payload: { admin_notes: string }
): Promise<{ status: string; message: string; request_id: string }> {
  return apiClient(`/wallet/withdrawals/${requestId}/reject`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function depositFunds(amount: number): Promise<{ status: string; message: string; new_balance: number }> {
  return apiClient("/wallet/deposit", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}
