import Link from "next/link";
import Image from "next/image";
import { Search, Bell } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0E16] text-[#F8FAFC] border-b border-[#242C3D]">
      <div className="h-16 max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Brand & Emblem */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/brand/ametheus-logo.svg"
              alt="AMETHEUS"
              width={160}
              height={38}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
          <span className="hidden lg:inline-flex px-2 py-0.5 bg-[#161A24] border border-[#242C3D] text-[#CBD5E1] text-[11px] font-bold tracking-wider rounded font-mono">
            TOURNAMENT PLATFORM
          </span>
        </div>

        {/* Global Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium text-[#CBD5E1]">
          <Link
            href="/games"
            className="px-3.5 py-1.5 rounded transition-colors hover:text-white hover:bg-[#161A24]"
          >
            Games
          </Link>
          <Link
            href="/tournaments"
            className="px-3.5 py-1.5 rounded transition-colors hover:text-white hover:bg-[#161A24]"
          >
            Tournaments
          </Link>
          <Link
            href="/leaderboard"
            className="px-3.5 py-1.5 rounded transition-colors hover:text-white hover:bg-[#161A24]"
          >
            Leaderboard
          </Link>
          <Link
            href="/matches"
            className="px-3.5 py-1.5 rounded transition-colors hover:text-white hover:bg-[#161A24]"
          >
            Matches
          </Link>
          <Link
            href="/about"
            className="px-3.5 py-1.5 rounded transition-colors hover:text-white hover:bg-[#161A24]"
          >
            About
          </Link>
          <Link
            href="/help"
            className="px-3.5 py-1.5 rounded transition-colors hover:text-white hover:bg-[#161A24]"
          >
            Support
          </Link>
        </nav>

        {/* Search, Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="hidden xl:flex items-center bg-[#161A24] border border-[#242C3D] px-3 py-1.5 rounded text-[#94A3B8] text-xs">
            <Search className="w-4 h-4 mr-2 text-[#94A3B8]" />
            <span className="mr-4">Search tournaments, teams...</span>
            <kbd className="px-1.5 py-0.5 bg-[#10131B] border border-[#242C3D] text-[10px] font-mono text-[#CBD5E1] rounded">
              Ctrl+K
            </kbd>
          </div>

          {/* Notifications */}
          <button
            type="button"
            className="relative p-2 bg-[#161A24] border border-[#242C3D] rounded text-[#CBD5E1] hover:text-white hover:border-[#CBD5E1] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 bg-[#E56A10] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              3
            </span>
          </button>

          {/* User Account / Captain Status Badge */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-[#242C3D]">
            <div className="w-8 h-8 rounded-full bg-[#161A24] border border-[#242C3D] flex items-center justify-center text-xs font-bold text-[#F59E0B]">
              VX
            </div>
            <div className="hidden sm:flex flex-col text-left text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-semibold">@vortex_lead</span>
                <span className="px-1 py-0.2 bg-[#161A24] border border-[#E56A10]/40 text-[#FFB68F] text-[9px] font-mono rounded">
                  CAPTAIN
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                <span>WINNINGS:</span>
                <span className="font-bold text-[#F59E0B] font-mono">₹12,450</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
