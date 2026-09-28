import { apiClient } from "./client";

export type AdminArchiveSection =
  | "payments"
  | "wallet"
  | "audit"
  | "notifications"
  | "tickets"
  | "payouts";

export interface ArchiveFilterRequest {
  status?: string;
  statuses?: string[];
  category?: string;
  txn_type?: string;
  payment_type?: string;
  direction?: "CREDIT" | "DEBIT";
  action?: string;
  operator?: string;
  user_id?: string;
  is_read?: boolean;
  date_preset?: "older_7_days" | "older_30_days" | "older_90_days" | "custom" | "all";
  date_before?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  target_ids?: string[];
  reason?: string;
}

export interface ArchivePreviewResponse {
  section: string;
  matching_count: intNumber;
  filters_applied: Record<string, any>;
}

type intNumber = number;

export interface ArchiveExecutionResponse {
  success: boolean;
  section: string;
  archived_count: number;
  message: string;
}

export interface UnarchiveResponse {
  success: boolean;
  section: string;
  unarchived_count: number;
  message: string;
}

/**
 * Preview how many records match the given section archive filters
 */
export async function previewArchive(
  section: AdminArchiveSection,
  filters: ArchiveFilterRequest
): Promise<ArchivePreviewResponse> {
  return apiClient<ArchivePreviewResponse>(`/admin/archive/${section}/preview`, {
    method: "POST",
    body: JSON.stringify(filters),
  });
}

/**
 * Execute archival on matching records for a section
 */
export async function executeArchive(
  section: AdminArchiveSection,
  filters: ArchiveFilterRequest
): Promise<ArchiveExecutionResponse> {
  return apiClient<ArchiveExecutionResponse>(`/admin/archive/${section}/execute`, {
    method: "POST",
    body: JSON.stringify(filters),
  });
}

/**
 * Archive a single record in a section
 */
export async function archiveSingleRecord(
  section: AdminArchiveSection,
  recordId: string,
  reason?: string
): Promise<ArchiveExecutionResponse> {
  return apiClient<ArchiveExecutionResponse>(`/admin/archive/${section}/${recordId}`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

/**
 * Restore / unarchive a single record in a section
 */
export async function restoreSingleRecord(
  section: AdminArchiveSection,
  recordId: string
): Promise<UnarchiveResponse> {
  return apiClient<UnarchiveResponse>(`/admin/archive/${section}/${recordId}/restore`, {
    method: "POST",
  });
}

/**
 * Bulk restore / unarchive multiple records in a section
 */
export async function restoreBulkRecords(
  section: AdminArchiveSection,
  targetIds: string[]
): Promise<UnarchiveResponse> {
  return apiClient<UnarchiveResponse>(`/admin/archive/${section}/restore-bulk`, {
    method: "POST",
    body: JSON.stringify({ target_ids: targetIds }),
  });
}

/**
 * User-facing notification archive helpers
 */
export async function archiveUserNotification(notificationId: string) {
  return apiClient(`/notifications/${notificationId}/archive`, {
    method: "POST",
  });
}

export async function unarchiveUserNotification(notificationId: string) {
  return apiClient(`/notifications/${notificationId}/unarchive`, {
    method: "POST",
  });
}

export async function archiveAllReadUserNotifications(): Promise<{ status: string; archived_count: number }> {
  return apiClient("/notifications/archive-read", {
    method: "POST",
  });
}
