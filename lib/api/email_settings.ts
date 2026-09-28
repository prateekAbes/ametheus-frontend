import { apiClient } from "./client";

export interface EmailSettings {
  official_email: string;
  support_email: string;
  automated_email: string;
  updated_at?: string | null;
  updated_by?: string | null;
}

export interface EmailServiceStatusItem {
  service: string;
  email: string;
  display_name: string;
  smtp_host: string;
  smtp_port: number;
  use_tls: boolean;
  configured: boolean;
  status: string; // "Configured" | "Not Configured"
}

export interface EmailSystemStatusResponse {
  email_enabled: boolean;
  services: {
    support: EmailServiceStatusItem;
    noreply: EmailServiceStatusItem;
    official: EmailServiceStatusItem;
  };
}

export interface SmtpStatus {
  configured: boolean;
  connected: boolean;
  authenticated: boolean;
  sender: string;
  service?: string;
  host?: string | null;
  port?: number | null;
  secure?: boolean;
  status_code: string;
  message: string;
}

export interface SendTestEmailPayload {
  service: "support" | "noreply" | "official";
  to_email: string;
}

export interface SendTestEmailResult {
  success: boolean;
  service: string;
  message: string;
  message_id?: string | null;
  error_code?: string | null;
  error_details?: string | null;
  sender_used?: string | null;
}

export async function getEmailSettingsPublic(): Promise<EmailSettings> {
  return apiClient<EmailSettings>("/platform/email-settings");
}

export async function getEmailSystemStatusAdmin(): Promise<EmailSystemStatusResponse> {
  return apiClient<EmailSystemStatusResponse>("/admin/email/status");
}

export async function getEmailSettingsAdmin(): Promise<EmailSettings> {
  return apiClient<EmailSettings>("/admin/email/settings");
}

export async function getSmtpStatusAdmin(service: string = "support"): Promise<SmtpStatus> {
  return apiClient<SmtpStatus>(`/admin/email/smtp-status?service=${encodeURIComponent(service)}`);
}

export async function sendTestEmailAdmin(
  payload: SendTestEmailPayload
): Promise<SendTestEmailResult> {
  return apiClient<SendTestEmailResult>("/admin/email/send-test", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface OfficialEmailSendPayload {
  recipient_type: "ALL_USERS" | "SELECTED_USERS" | "SELECTED_TEAMS" | "CUSTOM_EMAILS";
  user_ids?: string[];
  team_ids?: string[];
  custom_emails?: string[];
  subject: string;
  message: string;
}

export interface OfficialEmailSendResult {
  success: boolean;
  message: string;
  recipient_count: number;
  log_id: string;
}

export interface OfficialEmailLogItem {
  id: string;
  sender: string;
  recipient_type: string;
  recipient_count: number;
  recipients_sample: string[];
  subject: string;
  status: string;
  created_at: string;
  operator_id?: string | null;
  error_summary?: string | null;
}

export interface OfficialEmailHistoryResponse {
  total: number;
  items: OfficialEmailLogItem[];
}

export async function sendOfficialEmailAdmin(
  payload: OfficialEmailSendPayload
): Promise<OfficialEmailSendResult> {
  return apiClient<OfficialEmailSendResult>("/admin/email/official/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getOfficialEmailHistoryAdmin(
  limit: number = 50
): Promise<OfficialEmailHistoryResponse> {
  return apiClient<OfficialEmailHistoryResponse>(
    `/admin/email/official/history?limit=${limit}`
  );
}

