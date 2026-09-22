import { apiClient } from "./client";

export interface UpiAccount {
  id: string;
  code: string;
  upi_id: string;
  payee_name: string;
  qr_url?: string;
  display_name?: string;
  status: "ACTIVE" | "INACTIVE";
  payment_count: number;
  created_at?: string;
}

export interface UpiAccountCreatePayload {
  code: string;
  upi_id: string;
  payee_name: string;
  qr_url?: string;
  display_name?: string;
  status?: string;
}

export interface UpiAccountUpdatePayload {
  upi_id?: string;
  payee_name?: string;
  qr_url?: string;
  display_name?: string;
  status?: string;
}

export async function getAdminUpiAccounts(): Promise<UpiAccount[]> {
  return apiClient<UpiAccount[]>("/admin/upi-accounts");
}

export async function createUpiAccount(payload: UpiAccountCreatePayload): Promise<UpiAccount> {
  return apiClient<UpiAccount>("/admin/upi-accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUpiAccount(id: string, payload: UpiAccountUpdatePayload): Promise<UpiAccount> {
  return apiClient<UpiAccount>(`/admin/upi-accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function toggleUpiAccountStatus(id: string): Promise<{ status: string; new_status: string; code: string }> {
  return apiClient(`/admin/upi-accounts/${id}/toggle-status`, {
    method: "POST",
  });
}
