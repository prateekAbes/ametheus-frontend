"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Trophy,
  Swords,
  CreditCard,
  AlertTriangle,
  Info,
  ExternalLink,
  X,
  Archive,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationItem,
} from "@/lib/api/index";
import {
  archiveUserNotification,
  archiveAllReadUserNotifications,
} from "@/lib/api/archive";

export default function NotificationsDropdown() {
  const router = useRouter();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isArchiving, setIsArchiving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeNotifications = isSignedIn ? notifications : [];
  const activeUnreadCount = isSignedIn ? unreadCount : 0;

  const fetchNotifs = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getNotifications();
      setNotifications(data.items || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // Background notifications poll fails gracefully
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchNotifsRef = useRef(fetchNotifs);
  useEffect(() => {
    fetchNotifsRef.current = fetchNotifs;
  }, [fetchNotifs]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetchNotifsRef.current();
    const interval = setInterval(() => {
      fetchNotifsRef.current();
    }, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn]);

  // Handle click outside or global close event to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    const handleClose = () => setIsOpen(false);

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("ametheus:close_dropdowns", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("ametheus:close_dropdowns", handleClose);
    };
  }, []);

  const hasReadNotifications = activeNotifications.some((n) => n.is_read);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchiveAllRead = async () => {
    if (isArchiving) return;
    setIsArchiving(true);
    try {
      await archiveAllReadUserNotifications();
      setNotifications((prev) => prev.filter((n) => !n.is_read));
    } catch (e) {
      console.error("Failed to archive read notifications:", e);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleArchiveSingle = async (e: React.MouseEvent, notifId: string, isUnread: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await archiveUserNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      if (isUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Failed to archive notification:", e);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      try {
        await markNotificationAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {
        console.error(e);
      }
    }
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "TOURNAMENT":
        return <Trophy className="w-4 h-4 text-[#E56A10]" />;
      case "MATCH":
        return <Swords className="w-4 h-4 text-amber-400" />;
      case "PAYMENT":
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case "DISPUTE":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && isSignedIn) fetchNotifs();
        }}
        className="relative h-8 w-8 rounded-lg bg-[#161A24]/70 hover:bg-[#161A24] border border-[#242C3D] flex items-center justify-center text-[#CBD5E1] hover:text-white transition-colors cursor-pointer shrink-0"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {activeUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#E56A10] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
            {activeUnreadCount > 9 ? "9+" : activeUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        /* Responsive container:
           - On mobile (<sm / <640px): fixed overlay covering the area below the 64px header (top-16 bottom-0),
             centering the notification card within the available space below the header.
           - On desktop/tablet (>=sm): absolute dropdown anchored under notification bell */
        <div
          onClick={(e) => {
            // Close when tapping the backdrop overlay on mobile
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
          className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs sm:p-0 sm:bg-transparent sm:backdrop-blur-none sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:block sm:w-auto"
        >
          {/* Notification Card */}
          <div className="w-full max-w-sm sm:max-w-none sm:w-96 bg-[#10131B] border border-[#242C3D] rounded-2xl sm:rounded-xl shadow-2xl overflow-hidden text-left font-sans animate-in fade-in zoom-in-95 flex flex-col max-h-[calc(100dvh-6rem)] sm:max-h-none">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#242C3D] bg-[#161A24] shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono tracking-wider uppercase text-white">
                  Notifications
                </span>
                {activeUnreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#E56A10]/20 text-[#E56A10] border border-[#E56A10]/40 text-[10px] font-mono font-bold rounded">
                    {activeUnreadCount} NEW
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeUnreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#94A3B8] hover:text-[#E56A10] transition-colors flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Mark all read</span>
                  </button>
                )}

                {hasReadNotifications && (
                  <button
                    type="button"
                    disabled={isArchiving}
                    onClick={handleArchiveAllRead}
                    className="text-[11px] text-[#94A3B8] hover:text-[#CBD5E1] transition-colors flex items-center gap-1 font-medium cursor-pointer disabled:opacity-50"
                    title="Clear all read notifications"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Clear read</span>
                  </button>
                )}

                {/* Mobile Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden p-1 text-[#94A3B8] hover:text-white rounded hover:bg-[#242C3D]/60 transition-colors cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Notification List */}
            <div className="flex-1 min-h-0 max-h-[calc(100dvh-9.5rem)] sm:max-h-80 sm:flex-none overflow-y-auto divide-y divide-[#1D2330] scrollbar-thin">
              {!isSignedIn ? (
                <div className="p-6 text-center text-xs text-[#94A3B8]">
                  Please sign in to view your live tournament updates and notifications.
                </div>
              ) : activeNotifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#64748B]">
                  <Bell className="w-6 h-6 mx-auto mb-2 text-[#334155]" />
                  You&apos;re all caught up! No active notifications.
                </div>
              ) : (
                activeNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`group p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-[#161A24] ${
                      !n.is_read ? "bg-[#141822]" : ""
                    }`}
                  >
                    <div className="p-1.5 bg-[#0B0E16] border border-[#242C3D] rounded mt-0.5 shrink-0">
                      {renderIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs font-semibold truncate ${!n.is_read ? "text-white" : "text-[#CBD5E1]"}`}>
                          {n.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!n.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E56A10] shrink-0" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleArchiveSingle(e, n.id, !n.is_read)}
                            title="Archive notification"
                            className="opacity-40 group-hover:opacity-100 p-1 text-[#64748B] hover:text-white hover:bg-[#242C3D] rounded transition-all cursor-pointer"
                          >
                            <Archive className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed break-words line-clamp-3">
                        {n.message}
                      </p>
                      {n.link && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#E56A10] font-mono mt-1 hover:underline">
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
