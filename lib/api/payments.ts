import { apiClient } from "./client";

export interface PaymentRecord {
  id: string;
  payment_type: string;
  user_id: string;
  game_id?: string;
  game_name?: string;
  team_id?: string;
  team_name?: string;
  amount_paise: number;
  amount_inr: number;
  payment_method: string;
  payment_account_code?: string;
  upi_id?: string;
  payee_name?: string;
  qr_url?: string;
  upi_uri?: string;
  utr?: string;
  screenshot_url?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason?: string;
  created_at: string;
  is_archived?: boolean;
  archived_at?: string;
  archived_by?: string;
  archive_reason?: string;
}

export async function submitPaymentUtr(
  paymentId: string,
  utr: string,
  screenshotUrl?: string
): Promise<{ status: string; message: string; payment_id: string; utr: string }> {
  return apiClient(`/payments/${paymentId}/submit-utr`, {
    method: "POST",
    body: JSON.stringify({
      utr,
      screenshot_url: screenshotUrl,
    }),
  });
}

export async function initiateWalletTopup(amountInr: number): Promise<{
  payment_id: string;
  amount_inr: number;
  amount_paise: number;
  payment_account_code: string;
  upi_id: string;
  payee_name: string;
  qr_url?: string;
  upi_uri: string;
}> {
  return apiClient("/payments/wallet/topup/initiate", {
    method: "POST",
    body: JSON.stringify({ amount_inr: amountInr }),
  });
}

export async function getMyPayments(): Promise<PaymentRecord[]> {
  return apiClient<PaymentRecord[]>("/payments/my");
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentRecord> {
  return apiClient<PaymentRecord>(`/payments/${paymentId}`);
}
