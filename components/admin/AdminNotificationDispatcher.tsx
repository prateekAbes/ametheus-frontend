"use client";

import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { sendAdminNotification, searchUsersAdmin, AdminUser } from "@/lib/api/admin";

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
  );
}

export { AdminNotificationDispatcher };
