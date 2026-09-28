"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Save,
  Server,
  KeyRound,
  Check,
  Clock,
  User,
  Info,
} from "lucide-react";
import {
  getEmailSettingsAdmin,
  updateEmailSettingsAdmin,
  getSmtpStatusAdmin,
  sendTestEmailAdmin,
  EmailSettings,
  SmtpStatus,
  SendTestEmailResult,
} from "@/lib/api/email_settings";
import { useEmailSettings } from "@/lib/hooks/useEmailSettings";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminEmailSettingsManager() {
  const { refresh: refreshGlobalCache } = useEmailSettings();

  // Settings State
  const [officialEmail, setOfficialEmail] = useState<string>("");
  const [supportEmail, setSupportEmail] = useState<string>("");
  const [automatedEmail, setAutomatedEmail] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);

  // Status & Feedback
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // SMTP Status State
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null);
  const [isCheckingSmtp, setIsCheckingSmtp] = useState<boolean>(false);

  // Send Test Email State
  const [testEmailInput, setTestEmailInput] = useState<string>("");
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<SendTestEmailResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Fetch initial email settings & SMTP status
  useEffect(() => {
    fetchSettings();
    checkSmtp();
  }, []);

  const fetchSettings = async () => {
    setIsLoadingSettings(true);
    setSaveError(null);
    try {
      const data = await getEmailSettingsAdmin();
      setOfficialEmail(data.official_email || "");
      setSupportEmail(data.support_email || "");
      setAutomatedEmail(data.automated_email || "");
      setLastUpdated(data.updated_at || null);
      setUpdatedBy(data.updated_by || null);
    } catch (err: any) {
      setSaveError(err?.message || "Failed to load email configuration.");
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const checkSmtp = async () => {
    setIsCheckingSmtp(true);
    try {
      const status = await getSmtpStatusAdmin();
      setSmtpStatus(status);
    } catch {
      setSmtpStatus({
        configured: false,
        connected: false,
        authenticated: false,
        sender: automatedEmail || "Not Configured",
        status_code: "CONNECTION_FAILED",
        message: "Failed to query backend SMTP service.",
      });
    } finally {
      setIsCheckingSmtp(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!officialEmail.trim() || !EMAIL_REGEX.test(officialEmail.trim())) {
      errors.officialEmail = "Please enter a valid official email address.";
    }
    if (!supportEmail.trim() || !EMAIL_REGEX.test(supportEmail.trim())) {
      errors.supportEmail = "Please enter a valid support email address.";
    }
    if (!automatedEmail.trim() || !EMAIL_REGEX.test(automatedEmail.trim())) {
      errors.automatedEmail = "Please enter a valid automated sender email address.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const updated = await updateEmailSettingsAdmin({
        official_email: officialEmail.trim(),
        support_email: supportEmail.trim(),
        automated_email: automatedEmail.trim(),
      });

      setOfficialEmail(updated.official_email);
      setSupportEmail(updated.support_email);
      setAutomatedEmail(updated.automated_email);
      setLastUpdated(updated.updated_at || new Date().toISOString());
      setUpdatedBy(updated.updated_by || "Super Admin");
      setSaveSuccess("Email configuration settings saved successfully! Values are live immediately.");

      // Refresh global hook cache across the whole frontend
      await refreshGlobalCache();
      // Re-check SMTP with updated sender identity
      await checkSmtp();
    } catch (err: any) {
      setSaveError(err?.message || "Failed to update email settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTo = testEmailInput.trim();
    if (!cleanTo || !EMAIL_REGEX.test(cleanTo)) {
      setTestError("Please enter a valid destination email address for testing.");
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);
    setTestError(null);

    try {
      const res = await sendTestEmailAdmin({ to_email: cleanTo });
      setTestResult(res);
      if (!res.success) {
        setTestError(res.error_details || `Delivery failed (${res.error_code || "UNKNOWN"})`);
      }
    } catch (err: any) {
      setTestError(err?.message || "Failed to dispatch test email.");
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="bg-[#111622] border border-[#242C3D] rounded-xl p-6 relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E56A10]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E56A10] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#E56A10] font-bold">
                Platform Administration Cockpit
              </span>
            </div>
            <h2 className="font-headline font-black text-xl md:text-2xl text-white tracking-wide uppercase flex items-center gap-2.5">
              <Mail className="w-6 h-6 text-[#E56A10]" />
              <span>Email &amp; SMTP Settings</span>
            </h2>
            <p className="text-xs font-mono text-[#94A3B8] max-w-2xl">
              Configure authoritative email identities used across public help pages, support tickets, and automated notifications.
              Changes persist directly in the database without frontend redeployment or server restarts.
            </p>
          </div>

          {lastUpdated && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161B26] border border-[#242C3D] rounded-lg text-xs font-mono text-[#94A3B8]">
              <Clock className="w-3.5 h-3.5 text-[#E56A10]" />
              <span>
                Updated: {new Date(lastUpdated).toLocaleDateString()} at{" "}
                {new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              {updatedBy && <span className="text-slate-500">by @{updatedBy}</span>}
            </div>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-600/70 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-rose-950/70 border border-rose-600/70 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 2-COLUMN GRID: IDENTITIES (LEFT) & SMTP DIAGNOSTICS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMN 1: EMAIL IDENTITIES CONFIGURATION (7 Cols) */}
        <div className="lg:col-span-7 bg-[#111622] border border-[#242C3D] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-[#161B26] border-b border-[#242C3D] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#E56A10]" />
              <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
                Email Identities (Database Source of Truth)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase bg-[#0B0E16] px-2 py-0.5 rounded border border-[#242C3D]">
              Super Admin Only
            </span>
          </div>

          <form onSubmit={handleSaveChanges} className="p-6 space-y-5">
            {/* 1. Official Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-[#CBD5E1] flex items-center justify-between">
                <span>Official Email:</span>
                <span className="text-[10px] font-normal text-slate-400">General business &amp; official inquiries</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={officialEmail}
                  onChange={(e) => {
                    setOfficialEmail(e.target.value);
                    if (fieldErrors.officialEmail) {
                      setFieldErrors((prev) => ({ ...prev, officialEmail: "" }));
                    }
                  }}
                  disabled={isLoadingSettings || isSaving}
                  placeholder="ametheus@gmail.com"
                  className={`w-full px-4 py-2.5 bg-[#0B0E16] border ${
                    fieldErrors.officialEmail ? "border-rose-500" : "border-[#242C3D] focus:border-[#E56A10]"
                  } rounded-xl text-xs font-mono text-white placeholder-slate-600 outline-none transition-colors`}
                />
              </div>
              {fieldErrors.officialEmail ? (
                <p className="text-[11px] font-mono text-rose-400">{fieldErrors.officialEmail}</p>
              ) : (
                <p className="text-[11px] font-mono text-slate-500">
                  Displayed for formal contact, sponsorship, and platform-level correspondence.
                </p>
              )}
            </div>

            {/* 2. Support Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-[#CBD5E1] flex items-center justify-between">
                <span>Support Email:</span>
                <span className="text-[10px] font-normal text-slate-400">User help desk &amp; ticket correspondence</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => {
                    setSupportEmail(e.target.value);
                    if (fieldErrors.supportEmail) {
                      setFieldErrors((prev) => ({ ...prev, supportEmail: "" }));
                    }
                  }}
                  disabled={isLoadingSettings || isSaving}
                  placeholder="ametheus.support@gmail.com"
                  className={`w-full px-4 py-2.5 bg-[#0B0E16] border ${
                    fieldErrors.supportEmail ? "border-rose-500" : "border-[#242C3D] focus:border-[#E56A10]"
                  } rounded-xl text-xs font-mono text-white placeholder-slate-600 outline-none transition-colors`}
                />
              </div>
              {fieldErrors.supportEmail ? (
                <p className="text-[11px] font-mono text-rose-400">{fieldErrors.supportEmail}</p>
              ) : (
                <p className="text-[11px] font-mono text-slate-500">
                  Appears in Contact Support, Help Center, Footer, and ticket escalation emails.
                </p>
              )}
            </div>

            {/* 3. Automated Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-[#CBD5E1] flex items-center justify-between">
                <span>Automated Email:</span>
                <span className="text-[10px] font-normal text-slate-400">Sender identity for automated notifications</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={automatedEmail}
                  onChange={(e) => {
                    setAutomatedEmail(e.target.value);
                    if (fieldErrors.automatedEmail) {
                      setFieldErrors((prev) => ({ ...prev, automatedEmail: "" }));
                    }
                  }}
                  disabled={isLoadingSettings || isSaving}
                  placeholder="ametheus.noreply@gmail.com"
                  className={`w-full px-4 py-2.5 bg-[#0B0E16] border ${
                    fieldErrors.automatedEmail ? "border-rose-500" : "border-[#242C3D] focus:border-[#E56A10]"
                  } rounded-xl text-xs font-mono text-white placeholder-slate-600 outline-none transition-colors`}
                />
              </div>
              {fieldErrors.automatedEmail ? (
                <p className="text-[11px] font-mono text-rose-400">{fieldErrors.automatedEmail}</p>
              ) : (
                <p className="text-[11px] font-mono text-slate-500">
                  Used as the From address for registration confirmations, match lobbies, and wallet alerts.
                </p>
              )}
            </div>

            {/* ACTION BUTTON */}
            <div className="pt-3 border-t border-[#242C3D] flex items-center justify-between">
              <button
                type="button"
                onClick={fetchSettings}
                disabled={isLoadingSettings || isSaving}
                className="px-3.5 py-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={isLoadingSettings || isSaving}
                className="px-6 py-2.5 bg-[#E56A10] hover:bg-[#D45900] disabled:opacity-50 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* COLUMN 2: SMTP STATUS & DIAGNOSTICS (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* SMTP STATUS CARD */}
          <div className="bg-[#111622] border border-[#242C3D] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-[#161B26] border-b border-[#242C3D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#E56A10]" />
                <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
                  SMTP Status
                </h3>
              </div>

              <button
                type="button"
                onClick={checkSmtp}
                disabled={isCheckingSmtp}
                className="px-2.5 py-1 bg-[#0B0E16] hover:bg-[#1E2538] text-slate-300 rounded border border-[#242C3D] text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingSmtp ? "animate-spin text-[#E56A10]" : ""}`} />
                <span>{isCheckingSmtp ? "Testing..." : "Test SMTP"}</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* STATUS INDICATOR BADGE */}
              <div className="p-3.5 bg-[#0B0E16] border border-[#242C3D] rounded-xl flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 uppercase font-bold">Relay Health:</span>
                <div className="flex items-center gap-2">
                  {smtpStatus?.status_code === "CONNECTED" ? (
                    <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Connected
                    </span>
                  ) : smtpStatus?.status_code === "NOT_CONFIGURED" ? (
                    <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Not Configured
                    </span>
                  ) : smtpStatus?.status_code === "AUTHENTICATION_FAILED" ? (
                    <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2.5 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Authentication Failed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2.5 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Connection Failed
                    </span>
                  )}
                </div>
              </div>

              {/* Status explanation */}
              {smtpStatus?.message && (
                <p className="text-[11px] font-mono text-slate-400 bg-[#0B0E16] p-3 rounded-lg border border-[#242C3D]">
                  {smtpStatus.message}
                </p>
              )}

              {/* Server Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg">
                  <div className="text-slate-500 uppercase text-[9px]">Server Host</div>
                  <div className="text-white font-bold truncate mt-0.5">
                    {smtpStatus?.host || "Not Configured"}
                  </div>
                </div>

                <div className="p-2.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg">
                  <div className="text-slate-500 uppercase text-[9px]">Relay Port / Mode</div>
                  <div className="text-white font-bold truncate mt-0.5">
                    {smtpStatus?.port || 587} {smtpStatus?.secure ? "(SSL)" : "(STARTTLS)"}
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#E56A10] shrink-0" />
                <span>
                  SMTP passwords remain in server environment variables and are never exposed via APIs.
                </span>
              </div>
            </div>
          </div>

          {/* SEND TEST EMAIL CARD */}
          <div className="bg-[#111622] border border-[#242C3D] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-[#161B26] border-b border-[#242C3D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#E56A10]" />
                <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
                  Send Test Email
                </h3>
              </div>
            </div>

            <form onSubmit={handleSendTestEmail} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase text-[#CBD5E1]">
                  Test Email Address:
                </label>
                <input
                  type="email"
                  value={testEmailInput}
                  onChange={(e) => {
                    setTestEmailInput(e.target.value);
                    setTestError(null);
                  }}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 bg-[#0B0E16] border border-[#242C3D] focus:border-[#E56A10] rounded-xl text-xs font-mono text-white placeholder-slate-600 outline-none"
                />
              </div>

              {testResult?.success && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px] font-mono rounded-lg space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Test message accepted by SMTP relay!</span>
                  </div>
                  {testResult.message_id && (
                    <div className="text-slate-400 text-[10px]">
                      Message ID: <span className="text-emerald-300">{testResult.message_id}</span>
                    </div>
                  )}
                  {testResult.sender_used && (
                    <div className="text-slate-400 text-[10px]">
                      Sender: <span className="text-emerald-300">{testResult.sender_used}</span>
                    </div>
                  )}
                </div>
              )}

              {testError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] font-mono rounded-lg">
                  <span className="font-bold">Error:</span> {testError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSendingTest || !testEmailInput.trim()}
                className="w-full py-2.5 bg-[#1F2637] hover:bg-[#283248] text-white border border-[#2E384D] hover:border-[#E56A10] rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSendingTest ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E56A10]" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-[#E56A10]" />
                )}
                <span>{isSendingTest ? "Sending Test Email..." : "Send Test Email"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
