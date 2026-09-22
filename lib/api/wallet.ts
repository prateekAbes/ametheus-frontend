import { apiClient } from "./client";

export interface WalletBalances {
  available_paise: number;
  available_inr: number;
  reserved_paise: number;
  reserved_inr: number;
  total_paise: number;
  total_inr: number;
}

export interface WalletLedgerItem {
  id: string;
  user_id: string;
  txn_type: "WALLET_TOPUP" | "GAME_ENTRY_PAYMENT" | "GAME_WINNING" | "WALLET_WITHDRAWAL" | "ADMIN_ADJUSTMENT";
  amount_paise: number;
  amount_inr: number;
  balance_before_paise: number;
  balance_after_paise: number;
  balance_after_inr: number;
  reference_id?: string;
  description: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  account_holder_name?: string;
  amount: number;
  amount_paise?: number;
  amount_inr?: number;
  destination?: string;
  upi_id: string;
  notes?: string;
  payout_reference?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  status: "PENDING" | "PAID" | "REJECTED" | "PENDING_APPROVAL" | "COMPLETED";
  outgoing_utr?: string;
  rejection_reason?: string;
  created_at: string;
}

export async function getWallet(): Promise<WalletBalances> {
  return apiClient<WalletBalances>("/wallet");
}

export async function getWalletLedger(limit = 50, offset = 0): Promise<WalletLedgerItem[]> {
  return apiClient<WalletLedgerItem[]>(`/wallet/ledger?limit=${limit}&offset=${offset}`);
}

export async function requestWithdrawal(
  amountOrPayload: number | { amount?: number; amount_inr?: number; upi_id: string; [k: string]: any },
  upiId?: string
): Promise<{
  status: string;
  message: string;
  payout_id: string;
  available_inr: number;
  reserved_inr: number;
  new_balance?: number;
}> {
  let amount_inr = 0;
  let final_upi_id = "";

  if (typeof amountOrPayload === "number") {
    amount_inr = amountOrPayload;
    final_upi_id = upiId || "";
  } else {
    amount_inr = amountOrPayload.amount_inr ?? amountOrPayload.amount ?? 0;
    final_upi_id = amountOrPayload.upi_id || upiId || "";
  }

  const res = await apiClient<{
    status: string;
    message: string;
    payout_id: string;
    available_inr: number;
    reserved_inr: number;
  }>("/wallet/withdraw", {
    method: "POST",
    body: JSON.stringify({
      amount_inr: amount_inr,
      upi_id: final_upi_id,
    }),
  });

  return {
    ...res,
    new_balance: res.available_inr,
  };
}

export async function getMyWithdrawals(): Promise<WithdrawalRequest[]> {
  return apiClient<WithdrawalRequest[]>("/wallet/withdrawals/my");
}

export async function getAdminWithdrawals(): Promise<WithdrawalRequest[]> {
  return apiClient<WithdrawalRequest[]>("/admin/payouts");
}

export async function approveWithdrawal(id: string, payload?: any): Promise<{ status: string; message: string }> {
  const outgoingUtr = typeof payload === "string" ? payload : payload?.payout_reference || payload?.outgoing_utr || "APPROVED_BY_ADMIN";
  return apiClient(`/admin/payouts/${id}/complete`, {
    method: "POST",
    body: JSON.stringify({ outgoing_utr: outgoingUtr }),
  });
}

export async function rejectWithdrawal(id: string, payload?: any): Promise<{ status: string; message: string }> {
  const reason = typeof payload === "string" ? payload : payload?.reason || payload?.rejection_reason || "Declined by admin";
  return apiClient(`/admin/payouts/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ rejection_reason: reason }),
  });
}

export async function depositFunds(amountInr: number): Promise<{
  payment_id: string;
  amount_inr: number;
  amount_paise: number;
  payment_account_code: string;
  upi_id: string;
  payee_name: string;
  qr_url?: string;
  upi_uri: string;
  new_balance?: number;
}> {
  return apiClient("/payments/wallet/topup/initiate", {
    method: "POST",
    body: JSON.stringify({ amount_inr: amountInr }),
  });
}
