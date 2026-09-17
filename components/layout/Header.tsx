"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Shield,
  Trophy,
  Gamepad2,
  Swords,
  BarChart3,
  LayoutDashboard,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import NotificationsDropdown from "@/components/layout/NotificationsDropdown";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/nextjs";
import { getCurrentUserProfile, UserProfile } from "@/lib/api/auth";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync / fetch current user's profile for authoritative role
  useEffect(() => {
    if (isSignedIn) {
      getCurrentUserProfile()
        .then((profile) => setUserProfile(profile))
        .catch(() => {
          // If profile fetch fails, fallback to Clerk user metadata
        });
    } else {
      setUserProfile(null);
    }
  }, [isSignedIn, user]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle Ctrl+K shortcut for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tournaments?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsMobileMenuOpen(false);
    }
  };

  const role = userProfile?.role || "PLAYER";
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isOrganizer = role === "ORGANIZER" || isSuperAdmin;

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const navLinks = [
    { href: "/tournaments", label: "Tournaments", icon: Trophy },
    { href: "/matches", label: "Matches", icon: Swords },
    { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
    { href: "/games", label: "Games", icon: Gamepad2 },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0E16]/95 backdrop-blur-md text-[#F8FAFC] border-b border-[#242C3D]">
        <div className="h-16 max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between gap-3">
          {/* Brand Logo (Enlarged Stitch Brandmark) */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 group py-1">
              <Image
                src="/brand/ametheus-logo.svg"
                alt="AMETHEUS"
                width={175}
                height={34}
                className="h-8 md:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                priority
              />
            </Link>
            <span className="hidden xl:inline-flex px-2 py-0.5 bg-[#161A24] border border-[#242C3D] text-[#94A3B8] text-[10px] font-bold tracking-wider rounded font-mono uppercase">
              PRO ARENA
            </span>
          </div>

          {/* Desktop Global Navigation */}
          <nav className="hidden lg:flex items-center gap-1 text-[13px] font-medium text-[#CBD5E1]">
            {navLinks.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                    active
                      ? "text-white bg-[#161A24] border border-[#242C3D] shadow-xs font-semibold"
                      : "hover:text-white hover:bg-[#161A24]/60"
                  }`}
                >
                  <item.icon className={`w-3.5 h-3.5 ${active ? "text-[#E56A10]" : "text-[#94A3B8]"}`} />
                  {item.label}
                </Link>
              );
            })}

            {/* Dashboard Link for Authenticated Players */}
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  isActive("/dashboard")
                    ? "text-white bg-[#161A24] border border-[#242C3D] font-semibold"
                    : "hover:text-white hover:bg-[#161A24]/60"
                }`}
              >
                <LayoutDashboard className={`w-3.5 h-3.5 ${isActive("/dashboard") ? "text-[#E56A10]" : "text-[#94A3B8]"}`} />
                Dashboard
              </Link>
            </Show>

            {/* Operations & Admin Badges */}
            <div className="flex items-center gap-1 pl-2 border-l border-[#242C3D]/80">
              <Link
                href="/organizer"
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
                  isActive("/organizer")
                    ? "bg-[#E56A10]/20 text-[#E56A10] border border-[#E56A10]/40 font-bold"
                    : isOrganizer
                    ? "text-[#E56A10] hover:bg-[#161A24] font-semibold"
                    : "text-[#94A3B8] hover:text-[#CBD5E1] hover:bg-[#161A24]"
                }`}
                title="Organizer Tournament Creator & Lifecycle Manager"
              >
                Organizer
              </Link>

              <Link
                href="/admin"
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
                  isActive("/admin")
                    ? "bg-[#E56A10] text-white font-bold shadow-xs"
                    : isSuperAdmin
                    ? "bg-[#E56A10]/15 text-[#FFB68F] border border-[#E56A10]/40 font-bold hover:bg-[#E56A10]/25"
                    : "text-[#94A3B8] hover:text-[#CBD5E1] hover:bg-[#161A24]"
                }`}
                title="Super Admin Cockpit & Match Arbitration"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            </div>
          </nav>

          {/* Right Action Bar (Search, Notifications, Auth, Mobile Toggle) */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Quick Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
              <div className="flex items-center bg-[#161A24] border border-[#242C3D] hover:border-[#333C4D] transition-colors px-2.5 py-1.5 rounded text-xs text-[#94A3B8] w-44 lg:w-56 focus-within:w-64 focus-within:border-[#E56A10]/60">
                <Search className="w-3.5 h-3.5 mr-2 text-[#94A3B8] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search tournaments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-hidden text-xs text-white placeholder-[#64748B] w-full"
                />
                <kbd className="hidden lg:inline-block px-1 py-0.5 bg-[#0B0E16] border border-[#242C3D] text-[9px] font-mono text-[#94A3B8] rounded ml-1 shrink-0">
                  Ctrl+K
                </kbd>
              </div>
            </form>

            {/* Notifications Dropdown */}
            <NotificationsDropdown />

            {/* Clerk Auth Section */}
            <Show when="signed-out">
              <div className="flex items-center gap-2 pl-2 border-l border-[#242C3D]">
                <SignInButton mode="modal">
                  <button className="px-2.5 py-1.5 text-xs font-mono font-bold text-[#CBD5E1] hover:text-white transition-colors cursor-pointer">
                    SIGN IN
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-3 py-1.5 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded transition-colors shadow-xs cursor-pointer flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    JOIN LEAGUE
                  </button>
                </SignUpButton>
              </div>
            </Show>

            <Show when="signed-in">
              <div className="flex items-center gap-2.5 pl-2 border-l border-[#242C3D]">
                <Link
                  href="/dashboard"
                  className="hidden sm:flex flex-col text-right text-xs hover:opacity-80 transition-opacity"
                >
                  <span className="text-white font-medium text-xs truncate max-w-[120px]">
                    {userProfile?.display_name || user?.username || "My Account"}
                  </span>
                  <div className="flex items-center justify-end gap-1">
                    <span
                      className={`px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded border ${
                        isSuperAdmin
                          ? "bg-[#E56A10]/20 text-[#FFB68F] border-[#E56A10]/50"
                          : role === "ORGANIZER"
                          ? "bg-amber-950/40 text-amber-300 border-amber-500/40"
                          : "bg-[#161A24] text-[#94A3B8] border-[#242C3D]"
                      }`}
                    >
                      {role === "SUPER_ADMIN" ? "SUPER ADMIN" : role}
                    </span>
                  </div>
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 border border-[#242C3D] hover:border-[#E56A10] transition-colors",
                    },
                  }}
                />
              </div>
            </Show>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded text-[#CBD5E1] hover:text-white hover:bg-[#161A24] border border-[#242C3D]"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sliding Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          {/* Drawer Menu */}
          <div className="fixed top-16 right-0 bottom-0 w-4/5 max-w-sm bg-[#0E121B] border-l border-[#242C3D] p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              {/* Mobile Search Input */}
              <form onSubmit={handleSearchSubmit}>
                <div className="flex items-center bg-[#161A24] border border-[#242C3D] px-3 py-2 rounded text-xs text-[#94A3B8]">
                  <Search className="w-4 h-4 mr-2 text-[#94A3B8] shrink-0" />
                  <input
                    type="text"
                    placeholder="Search tournaments, games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-hidden text-xs text-white placeholder-[#64748B] w-full"
                  />
                </div>
              </form>

              {/* Navigation Links */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase text-[#64748B] px-3 py-1 font-bold">
                  Arena Navigation
                </div>
                {navLinks.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                        active
                          ? "bg-[#161A24] text-white border border-[#242C3D]"
                          : "text-[#CBD5E1] hover:bg-[#161A24]/60 hover:text-white"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${active ? "text-[#E56A10]" : "text-[#94A3B8]"}`} />
                      {item.label}
                    </Link>
                  );
                })}

                <Show when="signed-in">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                      isActive("/dashboard")
                        ? "bg-[#161A24] text-white border border-[#242C3D]"
                        : "text-[#CBD5E1] hover:bg-[#161A24]/60 hover:text-white"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#94A3B8]" />
                    Dashboard
                  </Link>
                </Show>
              </div>

              {/* Operations & Administration */}
              <div className="space-y-1 pt-3 border-t border-[#242C3D]">
                <div className="text-[10px] font-mono uppercase text-[#64748B] px-3 py-1 font-bold">
                  Operations &amp; Admin
                </div>
                <Link
                  href="/organizer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-mono font-medium transition-colors ${
                    isActive("/organizer")
                      ? "bg-[#E56A10]/20 text-[#E56A10] border border-[#E56A10]/40 font-bold"
                      : "text-[#CBD5E1] hover:bg-[#161A24]"
                  }`}
                >
                  <Trophy className="w-4 h-4 text-[#E56A10]" />
                  Organizer Portal
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-mono font-medium transition-colors ${
                    isActive("/admin")
                      ? "bg-[#E56A10] text-white font-bold"
                      : "text-[#CBD5E1] hover:bg-[#161A24]"
                  }`}
                >
                  <Shield className="w-4 h-4 text-[#E56A10]" />
                  Admin Cockpit
                </Link>
                <Link
                  href="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-[#94A3B8] hover:text-white transition-colors"
                >
                  About AMETHEUS
                </Link>
              </div>
            </div>

            {/* Mobile Footer Auth Section */}
            <div className="pt-4 border-t border-[#242C3D]">
              <Show when="signed-out">
                <div className="space-y-2">
                  <SignInButton mode="modal">
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-2 bg-[#161A24] border border-[#242C3D] hover:bg-[#202534] text-white text-xs font-mono font-bold uppercase rounded text-center transition-colors cursor-pointer"
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded text-center transition-colors shadow-xs cursor-pointer"
                    >
                      Join League
                    </button>
                  </SignUpButton>
                </div>
              </Show>
              <Show when="signed-in">
                <div className="bg-[#161A24] p-3 rounded border border-[#242C3D] flex items-center justify-between">
                  <div>
                    <div className="text-white text-xs font-bold truncate max-w-[140px]">
                      @{user?.username || user?.firstName || "Player"}
                    </div>
                    <span className="text-[10px] font-mono text-[#E56A10] font-bold">
                      {role}
                    </span>
                  </div>
                  <UserButton />
                </div>
              </Show>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
