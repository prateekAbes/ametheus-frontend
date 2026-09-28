"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Users,
  UserCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
  X,
  FileText,
  Lock,
} from "lucide-react";
import {
  sendOfficialEmailAdmin,
  getOfficialEmailHistoryAdmin,
  OfficialEmailLogItem,
} from "@/lib/api/email_settings";
import { getAdminUsers, AdminUser } from "@/lib/api/admin";
import { getTeams, Team } from "@/lib/api/teams";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RecipientType = "ALL_USERS" | "SELECTED_USERS" | "SELECTED_TEAMS" | "CUSTOM_EMAILS";

export default function AdminOfficialMailManager() {
  const [recipientType, setRecipientType] = useState<RecipientType>("ALL_USERS");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Target Selections
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [customEmailsInput, setCustomEmailsInput] = useState("");

  // Loading states
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Confirmation Modal & Sending
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<OfficialEmailLogItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
    loadEntities();
  }, []);

  const loadEntities = async () => {
    setIsLoadingEntities(true);
    try {
      const [usersData, teamsData] = await Promise.all([
        getAdminUsers().catch(() => []),
        getTeams({ limit: 100 }).catch(() => []),
      ]);
      setUsers(usersData);
      setTeams(teamsData);
    } finally {
      setIsLoadingEntities(false);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await getOfficialEmailHistoryAdmin(50);
      setHistory(res.items || []);
    } catch {
      // silently ignore history fetch failure
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const parseCustomEmails = (): string[] => {
    return customEmailsInput
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => EMAIL_REGEX.test(e));
  };

  // Estimate recipient count
  const calculateEstimatedRecipientCount = (): number => {
    if (recipientType === "ALL_USERS") {
      return users.length > 0 ? users.filter((u) => !!u.email).length : 0;
    }
    if (recipientType === "SELECTED_USERS") {
      return selectedUserIds.length;
    }
    if (recipientType === "SELECTED_TEAMS") {
      const selected = teams.filter((t) => selectedTeamIds.includes(t.id));
      const emails = new Set<string>();
      selected.forEach((t) => {
        // Find team members
        t.members?.forEach((m) => {
          const userObj = users.find((u) => u.id === m.user_id || u.username === m.username);
          if (userObj?.email) emails.add(userObj.email.toLowerCase());
        });
      });
      return emails.size > 0 ? emails.size : selectedTeamIds.length;
    }
    if (recipientType === "CUSTOM_EMAILS") {
      return parseCustomEmails().length;
    }
    return 0;
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setSendErrorMessage(null);
    setSendSuccessMessage(null);

    if (!subject.trim()) {
      setSendErrorMessage("Please provide an email subject line.");
      return;
    }
    if (!message.trim()) {
      setSendErrorMessage("Please provide email body message content.");
      return;
    }

    if (recipientType === "SELECTED_USERS" && selectedUserIds.length === 0) {
      setSendErrorMessage("Please select at least one recipient user.");
      return;
    }
    if (recipientType === "SELECTED_TEAMS" && selectedTeamIds.length === 0) {
      setSendErrorMessage("Please select at least one recipient team.");
      return;
    }
    if (recipientType === "CUSTOM_EMAILS") {
      const parsed = parseCustomEmails();
      if (parsed.length === 0) {
        setSendErrorMessage("Please enter at least one valid custom email address.");
        return;
      }
    }

    setIsConfirmOpen(true);
  };

  const handleSendBroadcast = async () => {
    setIsSending(true);
    setSendErrorMessage(null);
    setSendSuccessMessage(null);

    try {
      const payload: any = {
        recipient_type: recipientType,
        subject: subject.trim(),
        message: message.trim(),
      };

      if (recipientType === "SELECTED_USERS") {
        payload.user_ids = selectedUserIds;
      } else if (recipientType === "SELECTED_TEAMS") {
        payload.team_ids = selectedTeamIds;
      } else if (recipientType === "CUSTOM_EMAILS") {
        payload.custom_emails = parseCustomEmails();
      }

      const res = await sendOfficialEmailAdmin(payload);
      if (res.success) {
        setSendSuccessMessage(
          `Official broadcast queued successfully for ${res.recipient_count} recipient(s). (Ref: ${res.log_id})`
        );
        setIsConfirmOpen(false);
        setSubject("");
        setMessage("");
        setSelectedUserIds([]);
        setSelectedTeamIds([]);
        setCustomEmailsInput("");
        fetchHistory();
      } else {
        setSendErrorMessage(res.message || "Failed to dispatch official email.");
      }
    } catch (err: any) {
      setSendErrorMessage(err?.message || "Error dispatching official broadcast.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="bg-[#111622] border border-[#242C3D] rounded-xl p-6 relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E56A10]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E56A10] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#E56A10] font-bold">
                Super Admin Exclusive Communications
              </span>
            </div>
            <h2 className="font-headline font-black text-xl md:text-2xl text-white tracking-wide uppercase flex items-center gap-2.5">
              <Mail className="w-6 h-6 text-[#E56A10]" />
              <span>Official Mail Dispatch</span>
            </h2>
            <p className="text-xs font-mono text-[#94A3B8] max-w-2xl">
              Dispatch high-priority official communications representing Ametheus Operations.
              All messages are fixed to originate exclusively from{" "}
              <strong className="text-white">official@ametheus.games</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161B26] border border-[#242C3D] rounded-lg text-xs font-mono text-slate-300">
            <Lock className="w-3.5 h-3.5 text-[#E56A10]" />
            <span>Sender: official@ametheus.games</span>
          </div>
        </div>
      </div>

      {sendSuccessMessage && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-600/70 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{sendSuccessMessage}</span>
        </div>
      )}

      {sendErrorMessage && (
        <div className="p-4 bg-rose-950/70 border border-rose-600/70 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{sendErrorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COMPOSE FORM (COLUMNS 1 & 2) */}
        <div className="lg:col-span-2 bg-[#111622] border border-[#242C3D] rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-[#242C3D] pb-3">
            <h3 className="font-headline font-bold text-base text-white uppercase flex items-center gap-2">
              <Send className="w-4 h-4 text-[#E56A10]" />
              Compose Official Broadcast
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Select audience, compose message, and confirm delivery scope.
            </p>
          </div>

          <form onSubmit={handleOpenConfirm} className="space-y-5">
            {/* SENDER IDENTITY (READ-ONLY) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-slate-300">
                From (Authoritative Sender)
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-[#0B0E16] border border-[#242C3D] rounded-lg text-xs font-mono text-slate-300 select-none">
                <ShieldAlert className="w-4 h-4 text-[#E56A10]" />
                <span className="font-bold text-white">Ametheus Official</span>
                <span className="text-slate-500">&lt;official@ametheus.games&gt;</span>
                <span className="ml-auto text-[10px] text-[#E56A10] bg-[#E56A10]/10 px-2 py-0.5 rounded border border-[#E56A10]/30 uppercase">
                  Fixed Identity
                </span>
              </div>
            </div>

            {/* AUDIENCE SELECTOR */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase text-slate-300">
                Audience Selection
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "ALL_USERS", label: "All Users", icon: Users },
                  { id: "SELECTED_USERS", label: "Selected Users", icon: UserCheck },
                  { id: "SELECTED_TEAMS", label: "Selected Teams", icon: Users },
                  { id: "CUSTOM_EMAILS", label: "Custom Emails", icon: Mail },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = recipientType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRecipientType(item.id as RecipientType)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#E56A10]/10 border-[#E56A10] text-[#E56A10]"
                          : "bg-[#0B0E16] border-[#242C3D] text-slate-400 hover:text-white hover:border-slate-600"
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CONDITIONAL AUDIENCE CONFIGURATIONS */}
            {recipientType === "ALL_USERS" && (
              <div className="p-3 bg-[#0B0E16] border border-[#242C3D] rounded-lg text-xs font-mono text-slate-300 flex items-center justify-between">
                <span>Total Registered Platform Users with Email:</span>
                <span className="font-bold text-white text-sm">
                  {users.filter((u) => !!u.email).length} users
                </span>
              </div>
            )}

            {recipientType === "SELECTED_USERS" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Select Users ({selectedUserIds.length} chosen):</span>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 bg-[#0B0E16] border border-[#242C3D] rounded text-[11px] font-mono text-white focus:outline-none focus:border-[#E56A10]"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto bg-[#0B0E16] border border-[#242C3D] rounded-lg p-2 space-y-1">
                  {users
                    .filter((u) => {
                      const q = searchQuery.toLowerCase();
                      return (
                        u.username.toLowerCase().includes(q) ||
                        (u.email && u.email.toLowerCase().includes(q))
                      );
                    })
                    .map((u) => {
                      const isChecked = selectedUserIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-[#161B26] rounded cursor-pointer text-xs font-mono text-slate-300"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUserIds((prev) => [...prev, u.id]);
                              } else {
                                setSelectedUserIds((prev) => prev.filter((id) => id !== u.id));
                              }
                            }}
                            className="rounded border-[#242C3D] text-[#E56A10] focus:ring-0"
                          />
                          <span className="text-white font-bold">{u.username}</span>
                          <span className="text-slate-500 text-[11px]">({u.email || "No email"})</span>
                          <span className="ml-auto text-[10px] text-slate-400">{u.role}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}

            {recipientType === "SELECTED_TEAMS" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Select Teams ({selectedTeamIds.length} chosen):</span>
                  <span>Emails will be delivered to captains &amp; active roster</span>
                </div>
                <div className="max-h-48 overflow-y-auto bg-[#0B0E16] border border-[#242C3D] rounded-lg p-2 space-y-1">
                  {teams.map((t) => {
                    const isChecked = selectedTeamIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#161B26] rounded cursor-pointer text-xs font-mono text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTeamIds((prev) => [...prev, t.id]);
                            } else {
                              setSelectedTeamIds((prev) => prev.filter((id) => id !== t.id));
                            }
                          }}
                          className="rounded border-[#242C3D] text-[#E56A10] focus:ring-0"
                        />
                        <span className="text-white font-bold">[{t.tag}] {t.name}</span>
                        <span className="text-slate-500 text-[11px]">(Captain: {t.captain_username})</span>
                        <span className="ml-auto text-[10px] text-[#E56A10]">{t.game_slug}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {recipientType === "CUSTOM_EMAILS" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase text-slate-300">
                  Custom Recipient Email Addresses
                </label>
                <textarea
                  rows={3}
                  value={customEmailsInput}
                  onChange={(e) => setCustomEmailsInput(e.target.value)}
                  placeholder="partner@example.com, sponsor@tournament.com (comma, space, or newline separated)"
                  className="w-full px-3 py-2 bg-[#0B0E16] border border-[#242C3D] focus:border-[#E56A10] rounded-lg text-xs font-mono text-white placeholder-slate-600 outline-none"
                />
                <div className="text-[11px] font-mono text-slate-400">
                  Detected valid emails:{" "}
                  <span className="text-emerald-400 font-bold">{parseCustomEmails().length}</span>
                </div>
              </div>
            )}

            {/* SUBJECT */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-slate-300">
                Subject Line *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Official Update: Seasonal Tournament Schedule & Regulatory Changes"
                className="w-full px-3 py-2 bg-[#0B0E16] border border-[#242C3D] focus:border-[#E56A10] rounded-lg text-xs font-mono text-white placeholder-slate-600 outline-none"
              />
            </div>

            {/* MESSAGE BODY */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-slate-300">
                Message Body *
              </label>
              <textarea
                required
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write official announcement content here..."
                className="w-full px-3 py-2 bg-[#0B0E16] border border-[#242C3D] focus:border-[#E56A10] rounded-lg text-xs font-mono text-white placeholder-slate-600 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 bg-[#E56A10] hover:bg-[#D45900] disabled:opacity-50 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4 text-white" />
              <span>Review Broadcast &amp; Send</span>
            </button>
          </form>
        </div>

        {/* GUIDELINES & ESTIMATE CARD (COLUMN 3) */}
        <div className="space-y-6">
          <div className="bg-[#111622] border border-[#242C3D] rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-headline font-bold text-sm text-white uppercase flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#E56A10]" />
              Official Mail Guidelines
            </h3>

            <div className="space-y-3 text-xs font-mono text-slate-300">
              <p>
                <strong className="text-white">Strict Identity Separation:</strong> Official Mail
                is reserved for administrative decisions, sponsorship updates, and formal announcements.
              </p>
              <p>
                <strong className="text-white">Rate Limit Protected:</strong> Dispatches are
                throttled through Gmail SMTP to prevent server blocks.
              </p>
              <p>
                <strong className="text-white">Audit Trail:</strong> Every sent message is
                permanently logged with recipient counts, timestamps, and operator IDs.
              </p>
            </div>

            <div className="p-3 bg-[#0B0E16] border border-[#242C3D] rounded-lg space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400 uppercase font-bold">
                Target Estimated Reach:
              </div>
              <div className="text-xl font-bold font-mono text-[#E56A10]">
                ~{calculateEstimatedRecipientCount()} recipient(s)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DISPATCH HISTORY TABLE */}
      <div className="bg-[#111622] border border-[#242C3D] rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
          <div>
            <h3 className="font-headline font-bold text-base text-white uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E56A10]" />
              Broadcast History
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Log of past official broadcasts dispatched by platform administrators.
            </p>
          </div>
          <button
            onClick={fetchHistory}
            disabled={isLoadingHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161B26] hover:bg-[#1E2638] border border-[#242C3D] text-slate-300 rounded-lg text-xs font-mono cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? "animate-spin text-[#E56A10]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">
            No official broadcasts recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0B0E16] text-slate-400 border-b border-[#242C3D]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Audience</th>
                  <th className="py-2.5 px-3">Recipients</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242C3D]">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-[#161B26]/50">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-white font-medium max-w-xs truncate">
                      {item.subject}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{item.recipient_type}</td>
                    <td className="py-2.5 px-3 text-[#E56A10] font-bold">
                      {item.recipient_count}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.status === "COMPLETED"
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                            : item.status === "QUEUED"
                            ? "bg-amber-950/80 text-amber-400 border border-amber-800"
                            : "bg-rose-950/80 text-rose-400 border border-rose-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111622] border border-[#242C3D] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#E56A10]" />
                <h3 className="font-headline font-bold text-base text-white uppercase">
                  Confirm Official Broadcast
                </h3>
              </div>
              <button
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSending}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-[#0B0E16] border border-[#242C3D] rounded-lg space-y-1">
                <div>
                  <span className="text-slate-500">Sender: </span>
                  <span className="text-white font-bold">official@ametheus.games</span>
                </div>
                <div>
                  <span className="text-slate-500">Subject: </span>
                  <span className="text-[#E56A10] font-bold">{subject}</span>
                </div>
                <div>
                  <span className="text-slate-500">Target Audience: </span>
                  <span className="text-white font-bold">{recipientType}</span>
                </div>
                <div>
                  <span className="text-slate-500">Estimated Recipients: </span>
                  <span className="text-emerald-400 font-bold">
                    ~{calculateEstimatedRecipientCount()}
                  </span>
                </div>
              </div>

              <p className="text-slate-400">
                Are you sure you want to broadcast this message? Emails will be queued and delivered directly to users&apos; inboxes.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSending}
                className="px-4 py-2 bg-[#161B26] hover:bg-[#1E2638] border border-[#242C3D] text-slate-300 rounded-lg text-xs font-mono font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendBroadcast}
                disabled={isSending}
                className="px-5 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isSending ? "Broadcasting..." : "Confirm & Send"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
