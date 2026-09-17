"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Trophy,
  Swords,
  CreditCard,
  AlertTriangle,
  Info,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationItem,
} from "@/lib/api/index";

export default function NotificationsDropdown() {
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    if (!isSignedIn) return;
    try {
      const data = await getNotifications();
      setNotifications(data.items || []);
      setUnreadCount(data.unread_count || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [isSignedIn]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
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
        className="relative p-2 bg-[#161A24] border border-[#242C3D] rounded text-[#CBD5E1] hover:text-white hover:border-[#CBD5E1] transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#E56A10] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#10131B] border border-[#242C3D] rounded-lg shadow-2xl z-50 overflow-hidden text-left font-sans">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#242C3D] bg-[#161A24]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono tracking-wider uppercase text-white">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-[#E56A10]/20 text-[#E56A10] border border-[#E56A10]/40 text-[10px] font-mono font-bold rounded">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-[#94A3B8] hover:text-[#E56A10] transition-colors flex items-center gap-1 font-medium cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#1D2330]">
            {!isSignedIn ? (
              <div className="p-6 text-center text-xs text-[#94A3B8]">
                Please sign in to view your live tournament updates and notifications.
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                <Bell className="w-6 h-6 mx-auto mb-2 text-[#334155]" />
                You're all caught up! No active notifications.
              </div>
            ) : (
              notifications.map((n) => {
                const content = (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-[#161A24] ${
                      !n.is_read ? "bg-[#141822]" : ""
                    }`}
                  >
                    <div className="p-1.5 bg-[#0B0E16] border border-[#242C3D] rounded mt-0.5">
                      {renderIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs font-semibold truncate ${!n.is_read ? "text-white" : "text-[#CBD5E1]"}`}>
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E56A10] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      {n.link && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#E56A10] font-mono mt-1 hover:underline">
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );

                if (n.link) {
                  return (
                    <Link key={n.id} href={n.link} onClick={() => handleItemClick(n)}>
                      {content}
                    </Link>
                  );
                }
                return content;
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
