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

export async function uploadUpiAccountQr(
  id: string,
  file: File
): Promise<{ status: string; qr_url: string; media_id: string; account: UpiAccount }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient<{ status: string; qr_url: string; media_id: string; account: UpiAccount }>(
    `/admin/upi-accounts/${id}/qr`,
    {
      method: "POST",
      body: formData,
    }
  );
}

export async function uploadStandaloneUpiQr(
  file: File
): Promise<{ status: string; qr_url: string; media_id: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient<{ status: string; qr_url: string; media_id: string; filename: string }>(
    "/admin/upi-accounts/upload-qr",
    {
      method: "POST",
      body: formData,
    }
  );
}
