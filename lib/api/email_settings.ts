import { apiClient } from "./client";

export interface EmailSettings {
  official_email: string;
  support_email: string;
  automated_email: string;
  updated_at?: string | null;
  updated_by?: string | null;
}

export interface EmailSettingsUpdatePayload {
  official_email: string;
  support_email: string;
  automated_email: string;
}

export interface SmtpStatus {
  configured: boolean;
  connected: boolean;
  authenticated: boolean;
  sender: string;
  host?: string | null;
  port?: number | null;
  secure?: boolean;
  status_code: string;
  message: string;
}

export interface SendTestEmailPayload {
  to_email: string;
}

export interface SendTestEmailResult {
  success: boolean;
  message_id?: string | null;
  error_code?: string | null;
  error_details?: string | null;
  sender_used?: string | null;
}

export async function getEmailSettingsPublic(): Promise<EmailSettings> {
  return apiClient<EmailSettings>("/platform/email-settings");
}

export async function getEmailSettingsAdmin(): Promise<EmailSettings> {
  return apiClient<EmailSettings>("/admin/email/settings");
}

export async function updateEmailSettingsAdmin(
  payload: EmailSettingsUpdatePayload
): Promise<EmailSettings> {
  return apiClient<EmailSettings>("/admin/email/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getSmtpStatusAdmin(): Promise<SmtpStatus> {
  return apiClient<SmtpStatus>("/admin/email/smtp-status");
}

export async function sendTestEmailAdmin(
  payload: SendTestEmailPayload
): Promise<SendTestEmailResult> {
  return apiClient<SendTestEmailResult>("/admin/email/send-test", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
