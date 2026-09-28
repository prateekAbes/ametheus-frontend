"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Server,
  Lock,
  Check,
  Info,
  Radio,
  ExternalLink,
} from "lucide-react";
import {
  getEmailSystemStatusAdmin,
  getSmtpStatusAdmin,
  sendTestEmailAdmin,
  EmailSystemStatusResponse,
  SmtpStatus,
  SendTestEmailResult,
} from "@/lib/api/email_settings";
import AdminOfficialMailManager from "./AdminOfficialMailManager";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type IdentityType = "support" | "noreply" | "official";

export default function AdminEmailSettingsManager() {
  const [activeSubTab, setActiveSubTab] = useState<"architecture" | "official_mail">("architecture");

  // System Status State
  const [systemStatus, setSystemStatus] = useState<EmailSystemStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Diagnostic Test State (SMTP connectivity check)
  const [diagService, setDiagService] = useState<IdentityType>("support");
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null);
  const [isCheckingSmtp, setIsCheckingSmtp] = useState<boolean>(false);

  // Send Test Email State
  const [testService, setTestService] = useState<IdentityType>("support");
  const [testEmailInput, setTestEmailInput] = useState<string>("");
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<SendTestEmailResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemStatus();
    checkSmtp("support");
  }, []);

  const fetchSystemStatus = async () => {
    setIsLoadingStatus(true);
    setStatusError(null);
    try {
      const data = await getEmailSystemStatusAdmin();
      setSystemStatus(data);
    } catch (err: any) {
      setStatusError(err?.message || "Failed to query email service status.");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const checkSmtp = async (service: IdentityType = diagService) => {
    setIsCheckingSmtp(true);
    try {
      const status = await getSmtpStatusAdmin(service);
      setSmtpStatus(status);
    } catch {
      setSmtpStatus({
        configured: false,
        connected: false,
        authenticated: false,
        sender: `${service}@ametheus.games`,
        status_code: "CONNECTION_FAILED",
        message: "Failed to communicate with backend diagnostic service.",
      });
    } finally {
      setIsCheckingSmtp(false);
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
      const res = await sendTestEmailAdmin({
        service: testService,
        to_email: cleanTo,
      });
      setTestResult(res);
      if (!res.success) {
        setTestError(res.error_details || res.message || "Failed to deliver test email.");
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
                Infrastructure Status &amp; Diagnostics
              </span>
            </div>
            <h2 className="font-headline font-black text-xl md:text-2xl text-white tracking-wide uppercase flex items-center gap-2.5">
              <Mail className="w-6 h-6 text-[#E56A10]" />
              <span>Email &amp; SMTP Architecture</span>
            </h2>
            <p className="text-xs font-mono text-[#94A3B8] max-w-2xl">
              Ametheus routes outgoing mail through Brevo SMTP relay for Support, Automated notifications, and Official communications.
              Identities and credentials are fixed via the server environment and cannot be mutated from the dashboard.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161B26] border border-[#242C3D] rounded-lg text-xs font-mono text-slate-300">
            <Lock className="w-3.5 h-3.5 text-[#E56A10]" />
            <span>Environment Source of Truth</span>
          </div>
        </div>
      </div>

      {statusError && (
        <div className="p-4 bg-rose-950/70 border border-rose-600/70 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{statusError}</span>
        </div>
      )}

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#242C3D] pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab("architecture")}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "architecture"
              ? "bg-[#E56A10] text-white shadow-xs"
              : "bg-[#111622] border border-[#242C3D] text-slate-400 hover:text-white hover:border-slate-600"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>SMTP Architecture &amp; Health</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("official_mail")}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "official_mail"
              ? "bg-[#E56A10] text-white shadow-xs"
              : "bg-[#111622] border border-[#242C3D] text-slate-400 hover:text-white hover:border-slate-600"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Official Mail Dispatch</span>
        </button>
      </div>

      {activeSubTab === "official_mail" ? (
        <AdminOfficialMailManager />
      ) : (
        <>
          {/* 3 EMAIL SERVICES CARDS (READ-ONLY AS PER SPECIFICATION) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. SUPPORT EMAIL */}
        <div className="bg-[#111622] border border-[#242C3D] rounded-xl p-5 relative overflow-hidden shadow-xs">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">Identity 01</span>
              <h3 className="font-headline font-bold text-base text-white uppercase mt-0.5">Support Desk</h3>
            </div>
            {systemStatus?.services?.support?.configured ? (
              <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Configured
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Not Configured
              </span>
            )}
          </div>

          <div className="p-3 bg-[#0B0E16] border border-[#242C3D] rounded-lg mb-3">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Sender Address</div>
            <div className="text-xs font-mono font-bold text-[#E56A10] truncate mt-0.5">
              {systemStatus?.services?.support?.email || "support@ametheus.games"}
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-400 leading-relaxed mb-3">
            Used when users submit contact inquiries, support tickets, help desk requests, and direct customer service communications.
          </p>

          <div className="text-[10px] font-mono text-slate-500 border-t border-[#242C3D] pt-2.5 flex items-center justify-between">
            <span>Relay: smtp-relay.brevo.com:587</span>
            <span>TLS: Enabled</span>
          </div>
        </div>

        {/* 2. AUTOMATED / NO-REPLY EMAIL */}
        <div className="bg-[#111622] border border-[#242C3D] rounded-xl p-5 relative overflow-hidden shadow-xs">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">Identity 02</span>
              <h3 className="font-headline font-bold text-base text-white uppercase mt-0.5">No-Reply / Automated</h3>
            </div>
            {systemStatus?.services?.noreply?.configured ? (
              <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Configured
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Not Configured
              </span>
            )}
          </div>

          <div className="p-3 bg-[#0B0E16] border border-[#242C3D] rounded-lg mb-3">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Sender Address</div>
            <div className="text-xs font-mono font-bold text-[#E56A10] truncate mt-0.5">
              {systemStatus?.services?.noreply?.email || "noreply@ametheus.games"}
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-400 leading-relaxed mb-3">
            Used for automated system alerts, registration receipts, tournament match notifications, password resets, and transactional updates.
          </p>

          <div className="text-[10px] font-mono text-slate-500 border-t border-[#242C3D] pt-2.5 flex items-center justify-between">
            <span>Relay: smtp-relay.brevo.com:587</span>
            <span>Reply-To: Support</span>
          </div>
        </div>

        {/* 3. OFFICIAL EMAIL */}
        <div className="bg-[#111622] border border-[#242C3D] rounded-xl p-5 relative overflow-hidden shadow-xs">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">Identity 03</span>
              <h3 className="font-headline font-bold text-base text-white uppercase mt-0.5">Official Ametheus</h3>
            </div>
            {systemStatus?.services?.official?.configured ? (
              <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Configured
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Not Configured
              </span>
            )}
          </div>

          <div className="p-3 bg-[#0B0E16] border border-[#242C3D] rounded-lg mb-3">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Sender Address</div>
            <div className="text-xs font-mono font-bold text-[#E56A10] truncate mt-0.5">
              {systemStatus?.services?.official?.email || "official@ametheus.games"}
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-400 leading-relaxed mb-3">
            Used for official announcements, sponsorships, partnership inquiries, and platform-level business communications.
          </p>

          <div className="text-[10px] font-mono text-slate-500 border-t border-[#242C3D] pt-2.5 flex items-center justify-between">
            <span>Relay: smtp-relay.brevo.com:587</span>
            <span>TLS: Enabled</span>
          </div>
        </div>
      </div>

      {/* 2-COLUMN GRID: SMTP CONNECTION HEALTH (LEFT) & TEST EMAIL DISPATCHER (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMN 1: LIVE SMTP HEALTH DIAGNOSTICS (6 Cols) */}
        <div className="lg:col-span-6 bg-[#111622] border border-[#242C3D] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-[#161B26] border-b border-[#242C3D] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#E56A10]" />
              <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
                SMTP Relay Health Check
              </h3>
            </div>

            <button
              type="button"
              onClick={() => checkSmtp(diagService)}
              disabled={isCheckingSmtp}
              className="px-2.5 py-1 bg-[#0B0E16] hover:bg-[#1E2538] text-slate-300 rounded border border-[#242C3D] text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingSmtp ? "animate-spin text-[#E56A10]" : ""}`} />
              <span>{isCheckingSmtp ? "Testing..." : "Test Connection"}</span>
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Identity Selector Tabs for Diagnostic */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-[#CBD5E1]">
                Select Service Identity to Test:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["support", "noreply", "official"] as IdentityType[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setDiagService(id);
                      checkSmtp(id);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${
                      diagService === id
                        ? "bg-[#E56A10]/15 text-[#E56A10] border-[#E56A10]"
                        : "bg-[#0B0E16] text-slate-400 border-[#242C3D] hover:border-slate-600"
                    }`}
                  >
                    {id === "support" ? "Support" : id === "noreply" ? "No-Reply" : "Official"}
                  </button>
                ))}
              </div>
            </div>

            {/* STATUS INDICATOR BADGE */}
            <div className="p-3.5 bg-[#0B0E16] border border-[#242C3D] rounded-xl flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">Handshake Status:</span>
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
              <p className="text-[11px] font-mono text-slate-300 bg-[#0B0E16] p-3 rounded-lg border border-[#242C3D]">
                {smtpStatus.message}
              </p>
            )}

            {/* Server Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg">
                <div className="text-slate-500 uppercase text-[9px]">Tested Identity</div>
                <div className="text-white font-bold truncate mt-0.5">
                  {smtpStatus?.sender || `${diagService}@ametheus.games`}
                </div>
              </div>

              <div className="p-2.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg">
                <div className="text-slate-500 uppercase text-[9px]">Relay Port / Protocol</div>
                <div className="text-white font-bold truncate mt-0.5">
                  smtp-relay.brevo.com:587 (TLS)
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 pt-1">
              <Lock className="w-3.5 h-3.5 text-[#E56A10] shrink-0" />
              <span>
                Brevo SMTP credentials reside securely in server environment variables and are never transmitted to the browser.
              </span>
            </div>
          </div>
        </div>

        {/* COLUMN 2: EMAIL TEST SYSTEM (6 Cols) */}
        <div className="lg:col-span-6 bg-[#111622] border border-[#242C3D] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-[#161B26] border-b border-[#242C3D] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-[#E56A10]" />
              <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
                Email Service Test
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#E56A10] bg-[#0B0E16] px-2 py-0.5 rounded border border-[#242C3D]">
              Fixed Service Relay
            </span>
          </div>

          <form onSubmit={handleSendTestEmail} className="p-5 space-y-4">
            {/* Service dropdown / selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-[#CBD5E1]">
                Service:
              </label>
              <select
                value={testService}
                onChange={(e) => {
                  setTestService(e.target.value as IdentityType);
                  setTestResult(null);
                  setTestError(null);
                }}
                disabled={isSendingTest}
                className="w-full px-3 py-2 bg-[#0B0E16] border border-[#242C3D] focus:border-[#E56A10] rounded-xl text-xs font-mono text-white outline-none cursor-pointer"
              >
                <option value="support">Support — support@ametheus.games</option>
                <option value="noreply">No-Reply — noreply@ametheus.games</option>
                <option value="official">Official — official@ametheus.games</option>
              </select>
            </div>

            {/* Recipient Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-[#CBD5E1]">
                Recipient:
              </label>
              <input
                type="email"
                required
                value={testEmailInput}
                onChange={(e) => {
                  setTestEmailInput(e.target.value);
                  setTestError(null);
                }}
                disabled={isSendingTest}
                placeholder="admin@example.com"
                className="w-full px-4 py-2 bg-[#0B0E16] border border-[#242C3D] focus:border-[#E56A10] rounded-xl text-xs font-mono text-white placeholder-slate-600 outline-none"
              />
            </div>

            {testResult?.success && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px] font-mono rounded-lg space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Test email sent successfully!</span>
                </div>
                {testResult.sender_used && (
                  <div className="text-slate-400 text-[10px]">
                    Sender: <span className="text-emerald-300">{testResult.sender_used}</span>
                  </div>
                )}
                {testResult.message_id && (
                  <div className="text-slate-400 text-[10px]">
                    Message ID: <span className="text-emerald-300">{testResult.message_id}</span>
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
              className="w-full py-2.5 bg-[#E56A10] hover:bg-[#D45900] disabled:opacity-50 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              {isSendingTest ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Send className="w-3.5 h-3.5 text-white" />
              )}
              <span>{isSendingTest ? "Sending Test Email..." : "Send Test Email"}</span>
            </button>
          </form>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
