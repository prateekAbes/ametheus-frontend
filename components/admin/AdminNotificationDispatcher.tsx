"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Bell,
  Search,
  User,
  Check,
  X,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  Layers,
  Sparkles,
  Users,
  Archive,
  RotateCcw,
  RefreshCw,
  History,
} from "lucide-react";
import {
  sendAdminNotification,
  searchUsersAdmin,
  getAdminNotifications,
  AdminUser,
  AdminNotification,
} from "@/lib/api/admin";
import { ArchiveViewToggle } from "./ArchiveViewToggle";
import { AdminArchiveModal } from "./AdminArchiveModal";
import { archiveSingleRecord, restoreSingleRecord } from "@/lib/api/archive";

interface Props {
  initialUsers?: AdminUser[];
  onNotificationSent?: () => void;
  preselectedUserId?: string;
}

export default function AdminNotificationDispatcher({
  initialUsers = [],
  onNotificationSent,
  preselectedUserId,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<AdminUser[]>(initialUsers);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<AdminUser[]>([]);

  // Form Fields
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState<string>("ADMIN");
  const [linkUrl, setLinkUrl] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Platform Notification History & Archive State
  const [historyNotifs, setHistoryNotifs] = useState<AdminNotification[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [notifView, setNotifView] = useState<"active" | "archived">("active");
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyTypeFilter, setHistoryTypeFilter] = useState("ALL");
  const [historyActionMsg, setHistoryActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadHistoryNotifications = useCallback(
    async (view?: "active" | "archived") => {
      setIsHistoryLoading(true);
      try {
        const currentView = view !== undefined ? view : notifView;
        const res = await getAdminNotifications({
          is_archived: currentView === "archived",
          type: historyTypeFilter !== "ALL" ? historyTypeFilter : undefined,
          search: historySearch.trim() || undefined,
          limit: 50,
        });
        setHistoryNotifs(res.items || []);
        setHistoryTotal(res.total || 0);
      } catch (err: any) {
        console.error("Failed to load platform notification history:", err);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [notifView, historyTypeFilter, historySearch]
  );

  useEffect(() => {
    loadHistoryNotifications();
  }, [loadHistoryNotifications]);

  const handleArchiveNotification = async (notifId: string) => {
    try {
      await archiveSingleRecord("notifications", notifId);
      setHistoryActionMsg({ type: "success", text: "Notification archived." });
      loadHistoryNotifications();
      setTimeout(() => setHistoryActionMsg(null), 4000);
    } catch (err: any) {
      setHistoryActionMsg({ type: "error", text: err?.message || "Failed to archive notification." });
    }
  };

  const handleRestoreNotification = async (notifId: string) => {
    try {
      await restoreSingleRecord("notifications", notifId);
      setHistoryActionMsg({ type: "success", text: "Notification restored to active view." });
      loadHistoryNotifications();
      setTimeout(() => setHistoryActionMsg(null), 4000);
    } catch (err: any) {
      setHistoryActionMsg({ type: "error", text: err?.message || "Failed to restore notification." });
    }
  };

  // Sync initial users when passed
  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      setSearchedUsers(initialUsers);
    }
  }, [initialUsers]);

  // Pre-select user if provided
  useEffect(() => {
    if (preselectedUserId && initialUsers.length > 0) {
      const match = initialUsers.find((u) => u.id === preselectedUserId);
      if (match && !selectedUsers.some((u) => u.id === match.id)) {
        setSelectedUsers([match]);
      }
    }
  }, [preselectedUserId, initialUsers]);

  // Live search debounced
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchedUsers(initialUsers);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsersAdmin(searchQuery.trim());
        setSearchedUsers(results);
      } catch {
        // Fallback filter local initial users
        const q = searchQuery.toLowerCase();
        const filtered = initialUsers.filter(
          (u) =>
            u.username.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.display_name && u.display_name.toLowerCase().includes(q))
        );
        setSearchedUsers(filtered);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, initialUsers]);

  const toggleSelectUser = (user: AdminUser) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSelectAllSearched = () => {
    setSelectedUsers((prev) => {
      const existingIds = new Set(prev.map((u) => u.id));
      const newlyAdded = searchedUsers.filter((u) => !existingIds.has(u.id));
      return [...prev, ...newlyAdded];
    });
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      setStatusMessage({ type: "error", text: "Please select at least one recipient user." });
      return;
    }
    if (!title.trim() || !message.trim()) {
      setStatusMessage({ type: "error", text: "Both Title and Message are required." });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await sendAdminNotification({
        user_ids: selectedUsers.map((u) => u.id),
        title: title.trim(),
        message: message.trim(),
        notification_type: notificationType,
        link: linkUrl.trim() || undefined,
      });

      setStatusMessage({
        type: "success",
        text: `Successfully broadcasted notification to ${res.sent_count} user(s)!`,
      });

      // Reset form
      setTitle("");
      setMessage("");
      setLinkUrl("");
      setSelectedUsers([]);
      loadHistoryNotifications();
      if (onNotificationSent) onNotificationSent();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to dispatch notification. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] rounded-xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-[#242C3D] bg-slate-50 dark:bg-[#161B26] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#E56A10]" /> Admin-to-User Notification Dispatcher
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Search platform players, organizers, or captains to dispatch targeted system announcements, match alerts, or instructions.
          </p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Recipient Search & Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-4 border-r-0 lg:border-r border-slate-200 dark:border-[#242C3D] lg:pr-6">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Select Recipient(s)</span>
              <span className="text-[11px] text-[#E56A10] lowercase">
                {selectedUsers.length} selected
              </span>
            </label>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username, email, or name..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#E56A10]"
              />
              {isSearching && (
                <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-3 top-3 text-[#E56A10]" />
              )}
            </div>
          </div>

          {/* Quick Action Buttons for Search */}
          <div className="flex items-center justify-between text-[11px] font-mono">
            <button
              type="button"
              onClick={handleSelectAllSearched}
              className="text-[#E56A10] hover:underline font-bold cursor-pointer"
            >
              + Select All ({searchedUsers.length})
            </button>
            {selectedUsers.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-slate-400 hover:text-rose-500 cursor-pointer"
              >
                Clear Selected
              </button>
            )}
          </div>

          {/* Selected Chips */}
          {selectedUsers.length > 0 && (
            <div className="p-2.5 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-lg max-h-28 overflow-y-auto flex flex-wrap gap-1.5">
              {selectedUsers.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#E56A10]/10 border border-[#E56A10]/30 text-[#E56A10] text-[11px] font-mono font-bold"
                >
                  <span>@{u.username}</span>
                  <button
                    type="button"
                    onClick={() => toggleSelectUser(u)}
                    className="hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* User List Scrollable */}
          <div className="border border-slate-200 dark:border-[#242C3D] rounded-lg divide-y divide-slate-100 dark:divide-[#242C3D] max-h-80 overflow-y-auto bg-white dark:bg-[#121622]">
            {searchedUsers.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-slate-400">
                No users found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              searchedUsers.map((u) => {
                const isSelected = selectedUsers.some((sel) => sel.id === u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleSelectUser(u)}
                    className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#E56A10]/10 dark:bg-[#E56A10]/15"
                        : "hover:bg-slate-50 dark:hover:bg-[#161B26]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                          isSelected
                            ? "bg-[#E56A10] text-white"
                            : "bg-slate-200 dark:bg-[#242C3D] text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : u.username[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold font-mono text-slate-900 dark:text-white truncate">
                          @{u.username}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {u.email}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1F2637] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2E384D] shrink-0 uppercase">
                      {u.role || "PLAYER"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Message Composer Form (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSendNotification} className="space-y-4">
            {statusMessage && (
              <div
                className={`p-3.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Notification Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule Update: Quarterfinals at 7:00 PM"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                >
                  <option value="ADMIN">Admin Notice</option>
                  <option value="MATCH">Match Alert</option>
                  <option value="TOURNAMENT">Tournament Notice</option>
                  <option value="PAYMENT">Payment Notice</option>
                  <option value="SYSTEM">System Alert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Notification Message *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter the notification message. It will be delivered to the recipient's notification bell and broadcasted over live WebSockets..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10] leading-relaxed"
              />
              <div className="flex justify-end text-[10px] text-slate-400 font-mono mt-1">
                {message.length} characters
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" /> Action Target URL (Optional)
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="e.g. /matches or /tournaments/valorant-cup-2026"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-[#242C3D] flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Targeting: <strong className="text-slate-900 dark:text-white">{selectedUsers.length}</strong> recipient(s)
              </span>

              <button
                type="submit"
                disabled={isSending || selectedUsers.length === 0 || !title.trim() || !message.trim()}
                className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#D45900] text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{isSending ? "Dispatching..." : "Send Notification"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

      {/* ─── Platform Notification History & Archive Management ─── */}
      <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] rounded-xl shadow-xs overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-200 dark:border-[#242C3D] bg-slate-50 dark:bg-[#161B26] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase flex items-center gap-2">
              <History className="w-5 h-5 text-[#E56A10]" /> Platform Notification History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Review dispatched system notices, track read receipts, and manage historical archives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadHistoryNotifications()}
              disabled={isHistoryLoading}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2234] dark:hover:bg-[#232D42] border border-slate-300 dark:border-[#242C3D] text-slate-700 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isHistoryLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-[#E56A10]" />
              )}
              <span>Refresh History</span>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Action Message */}
          {historyActionMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 ${
                historyActionMsg.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800"
              }`}
            >
              {historyActionMsg.type === "success" ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              )}
              <span>{historyActionMsg.text}</span>
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadHistoryNotifications();
                }}
                placeholder="Search by title, message, or user ID..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
              />
            </div>

            <div className="w-full sm:w-48">
              <select
                value={historyTypeFilter}
                onChange={(e) => {
                  setHistoryTypeFilter(e.target.value);
                  loadHistoryNotifications();
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs font-mono text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#E56A10]"
              >
                <option value="ALL">All Types</option>
                <option value="ADMIN">Admin Notice</option>
                <option value="MATCH">Match Alert</option>
                <option value="TOURNAMENT">Tournament Notice</option>
                <option value="PAYMENT">Payment Notice</option>
                <option value="SYSTEM">System Alert</option>
              </select>
            </div>

            <button
              onClick={() => loadHistoryNotifications()}
              className="w-full sm:w-auto px-4 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer"
            >
              Filter
            </button>
          </div>

          {/* Archive View Toggle */}
          <ArchiveViewToggle
            activeView={notifView}
            onViewChange={(v) => {
              setNotifView(v);
              loadHistoryNotifications(v);
            }}
            activeCount={notifView === "active" ? historyTotal : undefined}
            archivedCount={notifView === "archived" ? historyTotal : undefined}
            sectionName="Notifications"
            onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
          />

          {/* Table */}
          <div className="border border-slate-200 dark:border-[#242C3D] rounded-xl overflow-hidden shadow-xs">
            {isHistoryLoading ? (
              <div className="p-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#E56A10]" />
                <span>Loading notification logs...</span>
              </div>
            ) : historyNotifs.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="font-headline font-bold text-slate-900 dark:text-white text-sm">
                  {notifView === "archived"
                    ? "No Archived Notifications"
                    : "No Dispatched Notifications"}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  {notifView === "archived"
                    ? "No notifications have been archived under these filters."
                    : "Broadcast notifications will appear here once dispatched."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#161B26] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#242C3D]">
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Title &amp; Message</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Dispatched At</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#242C3D] text-slate-800 dark:text-slate-200">
                    {historyNotifs.map((n) => (
                      <tr key={n.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181F2E]/60 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          <div>@{n.user_name || "user"}</div>
                          <div className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]">
                            {n.user_id}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            {n.type}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-[280px]">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {n.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {n.message}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              n.is_read
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                            }`}
                          >
                            {n.is_read ? "Read" : "Unread"}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          {n.created_at ? new Date(n.created_at).toLocaleString("en-IN") : "Recent"}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {notifView === "active" ? (
                            <button
                              onClick={() => handleArchiveNotification(n.id)}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-500 hover:text-amber-600 rounded text-[10px] font-mono transition-colors cursor-pointer"
                              title="Archive notification"
                            >
                              <Archive className="w-3 h-3 inline mr-1" />
                              Archive
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestoreNotification(n.id)}
                              className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded border border-amber-200 dark:border-amber-800 text-[10px] font-mono transition-colors cursor-pointer"
                              title="Restore notification to active view"
                            >
                              <RotateCcw className="w-3 h-3 inline mr-1" />
                              Restore
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Archive Modal */}
        <AdminArchiveModal
          isOpen={isArchiveModalOpen}
          onClose={() => setIsArchiveModalOpen(false)}
          section="notifications"
          sectionTitle="Platform Notifications"
          onArchiveSuccess={(count) => {
            setHistoryActionMsg({
              type: "success",
              text: `Successfully archived ${count} platform notification(s).`,
            });
            loadHistoryNotifications();
            setTimeout(() => setHistoryActionMsg(null), 5000);
          }}
        />
      </div>
    </div>
  );
}

export { AdminNotificationDispatcher };
