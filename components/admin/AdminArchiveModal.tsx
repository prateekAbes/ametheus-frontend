'use client';

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Archive,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Filter,
  Loader2,
  CheckCircle2,
  Info,
} from "lucide-react";
import {
  AdminArchiveSection,
  ArchiveFilterRequest,
  previewArchive,
  executeArchive,
} from "@/lib/api/archive";

interface AdminArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: AdminArchiveSection;
  sectionTitle: string;
  onArchiveSuccess: (count: number) => void;
}

export const AdminArchiveModal: React.FC<AdminArchiveModalProps> = ({
  isOpen,
  onClose,
  section,
  sectionTitle,
  onArchiveSuccess,
}) => {
  // Filter States
  const [datePreset, setDatePreset] = useState<
    "older_7_days" | "older_30_days" | "older_90_days" | "custom" | "all"
  >("older_30_days");
  const [dateBefore, setDateBefore] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Section-specific filter states
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [txnTypeFilter, setTxnTypeFilter] = useState("ALL");
  const [directionFilter, setDirectionFilter] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");
  const [actionFilter, setActionFilter] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("");
  const [isReadFilter, setIsReadFilter] = useState<"ALL" | "READ" | "UNREAD">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [reason, setReason] = useState(`Admin ${sectionTitle} cleanup`);

  // Preview & execution states
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Construct current filters payload
  const buildFilters = useCallback((): ArchiveFilterRequest => {
    const filters: ArchiveFilterRequest = {
      date_preset: datePreset,
      reason: reason.trim() || `Admin ${sectionTitle} cleanup`,
    };

    if (datePreset === "custom") {
      if (dateBefore) filters.date_before = dateBefore;
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
    }

    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }

    // Section specific mappings
    if (section === "payments") {
      if (selectedStatuses.length > 0) {
        filters.statuses = selectedStatuses;
      } else if (statusFilter !== "ALL") {
        filters.status = statusFilter;
      }
    } else if (section === "wallet") {
      if (txnTypeFilter !== "ALL") filters.txn_type = txnTypeFilter;
      if (directionFilter !== "ALL") filters.direction = directionFilter;
    } else if (section === "audit") {
      if (actionFilter.trim()) filters.action = actionFilter.trim();
      if (operatorFilter.trim()) filters.operator = operatorFilter.trim();
    } else if (section === "tickets") {
      if (selectedStatuses.length > 0) {
        filters.statuses = selectedStatuses;
      } else if (statusFilter !== "ALL") {
        filters.status = statusFilter;
      }
      if (categoryFilter !== "ALL") filters.category = categoryFilter;
    } else if (section === "payouts") {
      if (statusFilter !== "ALL") filters.status = statusFilter;
    } else if (section === "notifications") {
      if (isReadFilter === "READ") filters.is_read = true;
      if (isReadFilter === "UNREAD") filters.is_read = false;
      if (categoryFilter !== "ALL") filters.category = categoryFilter;
    }

    return filters;
  }, [
    datePreset,
    dateBefore,
    dateFrom,
    dateTo,
    searchQuery,
    reason,
    section,
    sectionTitle,
    selectedStatuses,
    statusFilter,
    txnTypeFilter,
    directionFilter,
    actionFilter,
    operatorFilter,
    isReadFilter,
    categoryFilter,
  ]);

  // Run preview
  const fetchPreview = useCallback(async () => {
    setIsPreviewLoading(true);
    setPreviewError(null);
    try {
      const filters = buildFilters();
      const res = await previewArchive(section, filters);
      setPreviewCount(res.matching_count);
    } catch (err: any) {
      setPreviewError(err?.message || "Failed to preview matching records.");
      setPreviewCount(null);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [buildFilters, section]);

  // Trigger preview on modal open and filter updates
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchPreview();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fetchPreview]);

  // Handle execution
  const handleExecute = async () => {
    if (previewCount === 0 || previewCount === null) return;
    setIsExecuting(true);
    setExecutionError(null);
    try {
      const filters = buildFilters();
      const res = await executeArchive(section, filters);
      if (res.success) {
        onArchiveSuccess(res.archived_count);
        onClose();
      } else {
        setExecutionError(res.message || "Failed to execute archive.");
      }
    } catch (err: any) {
      setExecutionError(err?.message || "An error occurred while archiving records.");
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Clear & Archive {sectionTitle}
              </h3>
              <p className="text-xs text-slate-400">
                Safely archive historical records with section-specific filters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Important safety banner */}
          <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Clear ≠ Delete Policy</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Archived records are <strong>never permanently removed</strong>. They are safely kept in
              the database and can be reviewed or restored at any time via the{" "}
              <span className="text-amber-400 font-medium">Archived</span> tab.
            </p>
            {(section === "payments" || section === "wallet" || section === "payouts") && (
              <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Financial Safety: Balances, ledgers, and transaction integrity are strictly preserved.</span>
              </div>
            )}
            {section === "audit" && (
              <div className="flex items-center gap-2 pt-1 text-[11px] text-cyan-400">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>An active ARCHIVE_AUDIT_LOGS entry is automatically logged for transparency.</span>
              </div>
            )}
          </div>

          {/* Date Filter Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Date Scope</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: "older_7_days", label: "> 7 Days" },
                { id: "older_30_days", label: "> 30 Days" },
                { id: "older_90_days", label: "> 90 Days" },
                { id: "all", label: "All Time" },
                { id: "custom", label: "Custom" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDatePreset(preset.id as any)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                    datePreset === preset.id
                      ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            {datePreset === "custom" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">To Date (or Before)</label>
                  <input
                    type="date"
                    value={dateTo || dateBefore}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setDateBefore(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section Specific Filter Options */}
          {/* 1. PAYMENTS */}
          {section === "payments" && (
            <div className="space-y-3 pt-1 border-t border-slate-800/60">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>Payment Status Filter</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["ALL", "APPROVED", "REJECTED", "PENDING"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st);
                      setSelectedStatuses([]);
                    }}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      statusFilter === st && selectedStatuses.length === 0
                        ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setSelectedStatuses(["APPROVED", "REJECTED"]);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded border ${
                    selectedStatuses.includes("APPROVED") && selectedStatuses.includes("REJECTED")
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  ⚡ Preset: Approved & Rejected Only
                </button>
              </div>
            </div>
          )}

          {/* 2. WALLET */}
          {section === "wallet" && (
            <div className="space-y-3 pt-1 border-t border-slate-800/60">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>Transaction & Direction Filter</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Direction</label>
                  <select
                    value={directionFilter}
                    onChange={(e) => setDirectionFilter(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="ALL">All Directions (Credit & Debit)</option>
                    <option value="CREDIT">Credits Only (+)</option>
                    <option value="DEBIT">Debits Only (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Transaction Type</label>
                  <select
                    value={txnTypeFilter}
                    onChange={(e) => setTxnTypeFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="ALL">All Transaction Types</option>
                    <option value="WALLET_TOPUP">Wallet Topups</option>
                    <option value="TOURNAMENT_ENTRY">Tournament Entry</option>
                    <option value="PRIZE_WINNING">Prize Winnings</option>
                    <option value="ADMIN_ADJUSTMENT">Admin Adjustments</option>
                    <option value="WITHDRAWAL">Withdrawals</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 3. AUDIT LOGS */}
          {section === "audit" && (
            <div className="space-y-3 pt-1 border-t border-slate-800/60">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>Action & Operator Scope</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Action (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ROLE_CHANGE, VERIFY_MATCH"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Operator Email/ID</label>
                  <input
                    type="text"
                    placeholder="e.g. admin@ametheus.com"
                    value={operatorFilter}
                    onChange={(e) => setOperatorFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. SUPPORT TICKETS */}
          {section === "tickets" && (
            <div className="space-y-3 pt-1 border-t border-slate-800/60">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>Ticket Status & Category</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["ALL", "RESOLVED", "CLOSED", "WAITING_FOR_USER", "IN_PROGRESS", "OPEN"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st);
                      setSelectedStatuses([]);
                    }}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      statusFilter === st && selectedStatuses.length === 0
                        ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setSelectedStatuses(["RESOLVED", "CLOSED"]);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded border ${
                    selectedStatuses.includes("RESOLVED") && selectedStatuses.includes("CLOSED")
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  ⚡ Preset: Resolved & Closed Only
                </button>
              </div>
            </div>
          )}

          {/* 5. PAYOUTS */}
          {section === "payouts" && (
            <div className="space-y-3 pt-1 border-t border-slate-800/60">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>Payout Status</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["ALL", "PAID", "REJECTED"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      statusFilter === st
                        ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. NOTIFICATIONS */}
          {section === "notifications" && (
            <div className="space-y-3 pt-1 border-t border-slate-800/60">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>Read Status</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "ALL", label: "All" },
                  { id: "READ", label: "Read Only" },
                  { id: "UNREAD", label: "Unread Only" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setIsReadFilter(st.id as any)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      isReadFilter === st.id
                        ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search query (Optional) */}
          <div className="pt-1">
            <label className="block text-[11px] text-slate-400 mb-1">
              Text Search / Keyword (Optional)
            </label>
            <input
              type="text"
              placeholder="Search by ID, User, Details, etc."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Archive Reason */}
          <div className="pt-1">
            <label className="block text-[11px] text-slate-400 mb-1">
              Archival Reason (Recorded in audit trail)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Preview Result Box */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPreviewLoading ? (
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              ) : previewCount !== null && previewCount > 0 ? (
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
              ) : (
                <Info className="w-5 h-5 text-slate-500" />
              )}
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {isPreviewLoading
                    ? "Calculating matching records..."
                    : previewCount !== null
                    ? `${previewCount} matching record${previewCount === 1 ? "" : "s"} found`
                    : "Ready to preview"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {previewCount === 0
                    ? "No records currently match these specific filters."
                    : "Records will be moved to the Archived view."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchPreview}
              disabled={isPreviewLoading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            >
              Recalculate
            </button>
          </div>

          {previewError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              {previewError}
            </div>
          )}

          {executionError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              {executionError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isExecuting}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={isExecuting || isPreviewLoading || previewCount === 0 || previewCount === null}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-amber-950/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Archiving...</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5" />
                <span>
                  Archive {previewCount !== null && previewCount > 0 ? previewCount : ""}{" "}
                  {sectionTitle}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
