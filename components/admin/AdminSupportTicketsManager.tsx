"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LifeBuoy,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  FileText,
  User,
  Mail,
  CreditCard,
  Send,
  Save,
  ShieldAlert,
} from "lucide-react";
import {
  getAdminSupportTickets,
  getSupportTicketDetails,
  updateSupportTicket,
  getSupportSettings,
  retrySupportTicketEmail,
  SupportTicket,
  SupportLog,
} from "@/lib/api/support";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  OPEN: {
    label: "Open / New",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-500/50",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-blue-950/40",
    text: "text-blue-400",
    border: "border-blue-500/50",
  },
  WAITING_FOR_USER: {
    label: "Waiting for User",
    bg: "bg-purple-950/40",
    text: "text-purple-400",
    border: "border-purple-500/50",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-emerald-950/40",
    text: "text-emerald-400",
    border: "border-emerald-500/50",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-slate-900",
    text: "text-slate-400",
    border: "border-slate-700",
  },
};

const CATEGORIES = [
  { id: "ALL", label: "All Categories" },
  { id: "PAYMENT", label: "Payment & UTR" },
  { id: "WALLET", label: "Wallet & Withdrawals" },
  { id: "TOURNAMENT", label: "Tournaments" },
  { id: "REGISTRATION", label: "Registration" },
  { id: "TEAM", label: "Teams & Squads" },
  { id: "MATCH", label: "Matches & Disputes" },
  { id: "ACCOUNT", label: "Account & Profile" },
  { id: "TECHNICAL_ISSUE", label: "Technical Issues" },
  { id: "GAME_ISSUE", label: "Game Anti-Cheat" },
  { id: "OTHER", label: "Other Inquiries" },
];

export default function AdminSupportTicketsManager() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Detail Modal State
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [modalStatus, setModalStatus] = useState<string>("OPEN");
  const [internalNotes, setInternalNotes] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Support Email Destination (Read-Only from Server Environment)
  const [supportEmailConfig, setSupportEmailConfig] = useState<string>("support@ametheus.games");

  // Email Retry State
  const [isRetryingEmail, setIsRetryingEmail] = useState<string | null>(null);

  useEffect(() => {
    getSupportSettings()
      .then((res) => {
        if (res?.support_email) setSupportEmailConfig(res.support_email);
      })
      .catch((err) => console.warn("Could not load support email settings:", err));
  }, []);

  const handleRetryEmail = async (target: "USER" | "SUPPORT" | "ALL") => {
    if (!activeTicket) return;
    setIsRetryingEmail(target);
    setActionMsg(null);
    try {
      const updated = await retrySupportTicketEmail(activeTicket.ticket_id, target);
      setActiveTicket(updated);
      setTickets((prev) => prev.map((t) => (t.ticket_id === updated.ticket_id ? updated : t)));
      setActionMsg({
        type: "success",
        text: `Email retry dispatched (${target === "USER" ? "User Confirmation" : target === "SUPPORT" ? "Admin Notification" : "Both"}). Current Status: ${updated.email_status}`,
      });
    } catch (err: any) {
      setActionMsg({
        type: "error",
        text: err?.message || "Failed to retry email delivery.",
      });
    } finally {
      setIsRetryingEmail(null);
    }
  };


  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminSupportTickets({
        status: selectedStatus === "ALL" ? undefined : selectedStatus,
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
        search: searchQuery.trim() || undefined,
        limit: 100,
      });
      setTickets(data.tickets || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.warn("Failed to load admin support tickets:", err);
      setTickets([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedCategory, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTickets]);

  const handleOpenTicket = async (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setModalStatus(ticket.status);
    setInternalNotes(ticket.internal_notes || "");
    setActionMsg(null);
    setIsLoadingDetails(true);

    try {
      const fresh = await getSupportTicketDetails(ticket.ticket_id);
      setActiveTicket(fresh);
      setModalStatus(fresh.status);
      setInternalNotes(fresh.internal_notes || "");
    } catch (err) {
      console.warn("Could not fetch latest ticket details:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    setIsUpdating(true);
    setActionMsg(null);

    try {
      const updated = await updateSupportTicket(activeTicket.ticket_id, {
        status: modalStatus,
        internal_notes: internalNotes.trim(),
      });
      setActiveTicket(updated);
      setActionMsg({ type: "success", text: `Ticket ${updated.ticket_id} updated successfully!` });
      fetchTickets();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      setActionMsg({
        type: "error",
        text: err?.message || "Failed to update ticket. Check permissions.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#121622] border border-[#242C3D] rounded-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A2234] border border-[#242C3D] rounded text-[#E56A10] font-mono text-xs font-bold uppercase tracking-wider mb-2">
            <LifeBuoy className="w-3.5 h-3.5" />
            Centralized Support Desk &amp; Ticketing
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-headline text-white uppercase tracking-tight">
            Support Tickets &amp; User Inquiries
          </h2>
          <p className="text-sm text-[#94A3B8] max-w-2xl mt-1">
            Arbitrate customer support tickets, manage payment and wallet disputes, record internal operator notes, and inspect audit logs.
          </p>
        </div>
        <button
          onClick={fetchTickets}
          disabled={isLoading}
          className="px-4 py-2 bg-[#1A2234] hover:bg-[#232D42] border border-[#242C3D] rounded-lg text-xs font-mono font-bold uppercase text-[#CBD5E1] flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#E56A10]" : ""}`} />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {/* Configurable Support Email Setting */}
      <div className="bg-[#121622] border border-[#242C3D] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#E56A10]/15 text-[#E56A10] border border-[#E56A10]/30 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
              Support Notification Email
              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.2 rounded">
                Admin Target
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#94A3B8]">
              Automated admin copies of all user support tickets are dispatched to this address.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg text-xs font-mono text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold text-slate-200">{supportEmailConfig || "support@ametheus.games"}</span>
            <span className="text-[10px] text-slate-500 font-mono">(Server Environment)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-[#121622] border border-[#242C3D] rounded-xl">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "OPEN", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                selectedStatus === st
                  ? "bg-[#E56A10] text-white shadow-xs"
                  : "bg-[#0B0E16] border border-[#242C3D] text-[#94A3B8] hover:text-white"
              }`}
            >
              {st === "ALL" ? "All Statuses" : STATUS_CONFIG[st]?.label || st}
            </button>
          ))}
        </div>

        {/* Category & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#0B0E16] border border-[#242C3D] rounded-lg text-xs font-mono text-white outline-none cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Ticket ID, email, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0B0E16] border border-[#242C3D] focus:border-[#E56A10] rounded-lg text-xs font-mono text-white placeholder-[#64748B] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tickets Table / List */}
      <div className="bg-[#121622] border border-[#242C3D] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#242C3D] flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase text-[#94A3B8] tracking-wider">
            Total Tickets: <span className="text-white font-bold">{totalCount}</span>
          </span>
          <span className="text-[11px] font-mono text-[#64748B]">
            Automated email confirmations enabled via {supportEmailConfig || "configured support desk"}
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-[#E56A10]" />
            <span className="text-xs font-mono uppercase tracking-wider">Loading Tickets...</span>
          </div>
        ) : tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#242C3D] bg-[#0B0E16]/80 text-[#94A3B8] font-mono uppercase text-[11px]">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Contender / User</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242C3D]/60 font-sans">
                {tickets.map((t) => {
                  const statusInfo = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;
                  return (
                    <tr
                      key={t.ticket_id}
                      className="hover:bg-[#1A2234]/50 transition-colors"
                    >
                      {/* Ticket ID */}
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#E56A10]">{t.ticket_id}</span>
                          <button
                            onClick={() => handleCopy(t.ticket_id)}
                            className="text-[#64748B] hover:text-white transition-colors cursor-pointer"
                            title="Copy Ticket ID"
                          >
                            {copiedId === t.ticket_id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white truncate max-w-[180px]">
                          {t.name}
                        </div>
                        <div className="text-[11px] font-mono text-[#94A3B8] truncate max-w-[180px]">
                          {t.email}
                        </div>
                        {t.user_id && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1 rounded">
                            Registered
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 font-mono uppercase text-[#CBD5E1]">
                        <span className="px-2 py-0.5 bg-[#1A2234] border border-[#242C3D] rounded text-[11px]">
                          {t.category}
                        </span>
                      </td>

                      {/* Payment Type */}
                      <td className="py-3 px-4 font-mono text-[#94A3B8]">
                        {t.payment_type ? (
                          <span className="px-2 py-0.5 bg-amber-950/30 text-amber-300 border border-amber-800/40 rounded text-[10px]">
                            {t.payment_type}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-[#94A3B8] whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenTicket(t)}
                          className="px-3 py-1.5 bg-[#1A2234] hover:bg-[#E56A10] hover:text-white border border-[#242C3D] rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer text-[#CBD5E1]"
                        >
                          Arbitrate →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-[#64748B] space-y-2">
            <LifeBuoy className="w-8 h-8 mx-auto text-[#64748B]" />
            <div className="text-sm font-headline font-bold uppercase text-white">
              No Support Tickets Found
            </div>
            <div className="text-xs font-mono">
              No tickets matched the current status or category filter.
            </div>
          </div>
        )}
      </div>

      {/* Ticket Details & Arbitration Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121622] border border-[#242C3D] rounded-2xl max-w-3xl w-full p-6 space-y-6 text-white max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#242C3D] gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase text-[#94A3B8]">
                    Support Ticket Details
                  </span>
                  <span className="px-2 py-0.5 bg-[#1A2234] border border-[#242C3D] text-[#E56A10] font-mono text-xs font-bold rounded">
                    {activeTicket.ticket_id}
                  </span>
                </div>
                <h3 className="text-xl font-headline font-bold text-white uppercase mt-1">
                  {activeTicket.name} — {activeTicket.category}
                </h3>
              </div>
              <button
                onClick={() => setActiveTicket(null)}
                className="text-[#94A3B8] hover:text-white text-lg font-mono px-2 py-1"
              >
                ✕
              </button>
            </div>

            {actionMsg && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-mono ${
                  actionMsg.type === "success"
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                    : "bg-red-950/60 border-red-500 text-red-300"
                }`}
              >
                {actionMsg.type === "success" ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                )}
                <span>{actionMsg.text}</span>
              </div>
            )}

            {/* Ticket Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#0B0E16] border border-[#242C3D] rounded-xl text-xs font-mono">
              <div>
                <span className="text-[#64748B] block uppercase text-[10px]">Contender Name</span>
                <span className="font-bold text-white text-sm">{activeTicket.name}</span>
              </div>
              <div>
                <span className="text-[#64748B] block uppercase text-[10px]">Email Address</span>
                <span className="font-bold text-white text-sm break-all">{activeTicket.email}</span>
              </div>
              <div>
                <span className="text-[#64748B] block uppercase text-[10px]">Payment Issue Type</span>
                <span className="font-bold text-amber-300 text-sm">
                  {activeTicket.payment_type || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block uppercase text-[10px]">Created At</span>
                <span className="text-white">
                  {new Date(activeTicket.created_at).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block uppercase text-[10px]">Email Notification</span>
                <span
                  className={
                    activeTicket.email_status === "SENT"
                      ? "text-emerald-400 font-bold"
                      : "text-amber-400"
                  }
                >
                  {activeTicket.email_status}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block uppercase text-[10px]">Account Association</span>
                <span className="text-white">
                  {activeTicket.user_id ? "Authenticated Contender" : "Guest Request"}
                </span>
              </div>
            </div>

            {/* Full User Description */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase text-[#CBD5E1]">
                Contender Description &amp; Details:
              </label>
              <div className="p-4 bg-[#0B0E16] border border-[#242C3D] rounded-xl text-xs sm:text-sm text-[#E2E8F0] whitespace-pre-wrap font-sans leading-relaxed">
                {activeTicket.description}
              </div>
            </div>

            {/* Status & Operator Actions */}
            <form onSubmit={handleSaveTicket} className="space-y-4 pt-2 border-t border-[#242C3D]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase text-[#CBD5E1]">
                    Arbitration Status:
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0E16] border border-[#242C3D] focus:border-[#E56A10] rounded-xl text-xs font-mono text-white outline-none cursor-pointer"
                  >
                    <option value="OPEN">OPEN / NEW</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="WAITING_FOR_USER">WAITING FOR USER</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                {/* Status indicator badge */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase text-[#94A3B8]">
                    Current State:
                  </label>
                  <div className="py-2">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase border ${
                        STATUS_CONFIG[modalStatus]?.bg
                      } ${STATUS_CONFIG[modalStatus]?.text} ${STATUS_CONFIG[modalStatus]?.border}`}
                    >
                      {STATUS_CONFIG[modalStatus]?.label || modalStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase text-[#CBD5E1] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#E56A10]" />
                  <span>Internal Operator Notes (Appended to Audit Trail):</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Record arbitration decisions, transaction verification details, or communications..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0B0E16] border border-[#242C3D] focus:border-[#E56A10] rounded-xl text-xs font-mono text-white placeholder-[#64748B] outline-none"
                />
              </div>

              {/* Email Delivery Status & Retry Controls */}
              <div className="p-3.5 bg-[#0B0E16] border border-[#242C3D] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-[#CBD5E1] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#E56A10]" />
                    <span>Email Delivery Status:</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      activeTicket.email_status === "SENT"
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
                        : activeTicket.email_status === "PARTIAL"
                        ? "bg-amber-950/60 text-amber-400 border border-amber-800"
                        : "bg-rose-950/60 text-rose-400 border border-rose-800"
                    }`}
                  >
                    {activeTicket.email_status}
                  </span>
                </div>

                {activeTicket.email_error && (
                  <p className="text-[11px] font-mono text-rose-400 bg-rose-950/30 border border-rose-900/50 p-2 rounded">
                    {activeTicket.email_error}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isRetryingEmail !== null}
                    onClick={() => handleRetryEmail("USER")}
                    className="px-3 py-1.5 bg-[#1A2234] hover:bg-[#283248] text-white border border-[#242C3D] rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3 h-3 text-[#E56A10]" />
                    <span>{isRetryingEmail === "USER" ? "Sending..." : "Retry User Email"}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isRetryingEmail !== null}
                    onClick={() => handleRetryEmail("SUPPORT")}
                    className="px-3 py-1.5 bg-[#1A2234] hover:bg-[#283248] text-white border border-[#242C3D] rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3 h-3 text-amber-400" />
                    <span>{isRetryingEmail === "SUPPORT" ? "Sending..." : "Retry Support Notification"}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isRetryingEmail !== null}
                    onClick={() => handleRetryEmail("ALL")}
                    className="px-3 py-1.5 bg-[#1A2234] hover:bg-[#283248] text-white border border-[#242C3D] rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3 text-emerald-400" />
                    <span>{isRetryingEmail === "ALL" ? "Retrying..." : "Retry Both"}</span>
                  </button>
                </div>
              </div>

              {/* Event / Audit Timeline */}
              {activeTicket.logs && activeTicket.logs.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-mono font-bold uppercase text-[#94A3B8]">
                    Event &amp; Audit Trail:
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {activeTicket.logs.map((log, idx) => (
                      <div
                        key={log.id || idx}
                        className="p-2.5 bg-[#0B0E16] border border-[#242C3D] rounded-lg text-[11px] font-mono flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E56A10] shrink-0" />
                          <span className="font-bold text-[#E56A10]">{log.action}:</span>
                          <span className="text-[#CBD5E1] truncate">{log.details}</span>
                        </div>
                        <div className="shrink-0 text-[10px] text-[#64748B]">
                          {new Date(log.timestamp).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="px-4 py-2 text-xs font-mono text-[#94A3B8] hover:text-white"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`} />
                  <span>{isUpdating ? "Saving..." : "Save Updates & Status"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
