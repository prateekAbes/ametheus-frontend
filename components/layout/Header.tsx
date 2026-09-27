"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AmetheusLogo from "@/components/ui/AmetheusLogo";
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
  ArrowRight,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Wallet,
} from "lucide-react";
import NotificationsDropdown from "@/components/layout/NotificationsDropdown";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  Show,
  SignInButton,
  SignUpButton,
  useUser,
  useAuth,
  useClerk,
} from "@clerk/nextjs";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { getTournaments, normalizeTournament, NormalizedTournament } from "@/lib/api/tournaments";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, toggleTheme } = useTheme();
  const { profile: userProfile, isLoading: isProfileLoading } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tournaments, setTournaments] = useState<NormalizedTournament[]>([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Silently load tournament catalog for instant search autocomplete
  useEffect(() => {
    getTournaments()
      .then((data) => {
        if (Array.isArray(data)) {
          setTournaments(data.map(normalizeTournament));
        }
      })
      .catch(() => {
        setTournaments([]);
      });
  }, []);

  // Close search and profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSearchDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeAllDropdowns = () => {
    setIsSearchDropdownOpen(false);
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ametheus:close_dropdowns"));
    }
  };

  // Close menus and dropdowns on route change or global close event
  useEffect(() => {
    closeAllDropdowns();
  }, [pathname]);

  useEffect(() => {
    const handleClose = () => {
      setIsSearchDropdownOpen(false);
      setIsProfileDropdownOpen(false);
      setIsMobileMenuOpen(false);
    };
    window.addEventListener("ametheus:close_dropdowns", handleClose);
    return () => window.removeEventListener("ametheus:close_dropdowns", handleClose);
  }, []);

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);


  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tournaments?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchDropdownOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const isHardcodedAdmin = userEmail === "pk.4081988@gmail.com" || userEmail === "admin@ametheus.gg";
  const role = isHardcodedAdmin ? "SUPER_ADMIN" : (userProfile?.role || "PLAYER");
  const isSuperAdmin = isHardcodedAdmin || role === "SUPER_ADMIN";
  const isOrganizer = isHardcodedAdmin || role === "ORGANIZER" || isSuperAdmin;

  const isActive = (path: string) => {
    const current = pathname;
    if (path === "/") return current === "/";
    return current.startsWith(path);
  };

  const navLinks = [
    { href: "/tournaments", label: "Tournaments", icon: Trophy },
    { href: "/matches", label: "Matches", icon: Swords },
    { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
    { href: "/games", label: "Games", icon: Gamepad2 },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0B0E16]/95 backdrop-blur-md text-[#F8FAFC] border-b border-[#242C3D]">
        <div className="h-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 lg:gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/"
              onClick={closeAllDropdowns}
              className="flex items-center gap-1.5 group py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E56A10] rounded"
            >
              <AmetheusLogo className="h-7 sm:h-8 md:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]" />
            </Link>
            <span className="hidden sm:inline-flex px-1.5 py-0.5 bg-[#161A24] border border-[#242C3D] text-[#94A3B8] text-[10px] font-bold tracking-wider rounded font-mono uppercase whitespace-nowrap">
              PRO ARENA
            </span>
          </div>

          {/* Desktop Global Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 text-xs xl:text-[13px] font-medium text-[#CBD5E1]">
            {navLinks.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeAllDropdowns}
                  className={`px-2 xl:px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 border font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E56A10] ${
                    active
                      ? "text-white bg-[#161A24] border-[#242C3D] shadow-xs"
                      : "text-[#CBD5E1] border-transparent hover:text-white hover:bg-[#161A24]/60"
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
                onClick={closeAllDropdowns}
                className={`px-2 xl:px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 border font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E56A10] ${
                  isActive("/dashboard")
                    ? "text-white bg-[#161A24] border-[#242C3D] shadow-xs"
                    : "text-[#CBD5E1] border-transparent hover:text-white hover:bg-[#161A24]/60"
                }`}
              >
                <LayoutDashboard className={`w-3.5 h-3.5 ${isActive("/dashboard") ? "text-[#E56A10]" : "text-[#94A3B8]"}`} />
                Dashboard
              </Link>
            </Show>

            {/* Operations & Admin Badges - Strictly restricted to authorized users */}
            {(isOrganizer || isSuperAdmin) && (
              <div className="flex items-center gap-1 pl-1.5 xl:pl-2 border-l border-[#242C3D]/80">
                <Link
                  href="/organizer"
                  onClick={closeAllDropdowns}
                  className={`px-2 xl:px-2.5 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1.5 border font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E56A10] ${
                    isActive("/organizer")
                      ? "bg-[#E56A10]/20 text-[#E56A10] border-[#E56A10]/40 font-bold"
                      : "text-[#E56A10] border-transparent hover:bg-[#161A24]"
                  }`}
                  title="Organizer Tournament Creator & Lifecycle Manager"
                >
                  Organizer
                </Link>

                {isSuperAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeAllDropdowns}
                    className={`px-2 xl:px-2.5 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1.5 border font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E56A10] ${
                      isActive("/admin")
                        ? "bg-[#E56A10] text-white border-transparent shadow-xs"
                        : "bg-[#E56A10]/15 text-[#FFB68F] border-[#E56A10]/40 hover:bg-[#E56A10]/25"
                    }`}
                    title="Super Admin Cockpit & Match Arbitration"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}
              </div>
            )}
          </nav>

          {/* Right Action Bar (Search, Notifications, Theme Toggle, Auth, Mobile Toggle) */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0 mr-1 sm:mr-2">
            {/* Quick Search Bar with Live Autocomplete */}
            <div className="relative hidden md:block" ref={searchDropdownRef}>
              <form onSubmit={handleSearchSubmit} className="flex items-center relative">
                <div className="flex items-center bg-[#161A24] border border-[#242C3D] hover:border-[#333C4D] transition-colors px-2 py-1.5 rounded text-xs text-[#94A3B8] w-36 lg:w-44 xl:w-52 focus-within:border-[#E56A10]/60">
                  <Search className="w-3.5 h-3.5 mr-1.5 text-[#94A3B8] shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search tournaments..."
                    value={searchQuery}
                    onFocus={() => setIsSearchDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchDropdownOpen(true);
                    }}
                    className="bg-transparent border-none outline-hidden text-xs text-white placeholder-[#64748B] w-full"
                  />
                </div>
              </form>

              {/* Autocomplete Dropdown */}
              {isSearchDropdownOpen && searchQuery.trim().length > 0 && (() => {
                const q = searchQuery.toLowerCase().trim();
                const matched = tournaments.filter(t =>
                  t.title.toLowerCase().includes(q) ||
                  t.gameName.toLowerCase().includes(q) ||
                  t.gameSlug.toLowerCase().includes(q) ||
                  t.serverRegion.toLowerCase().includes(q)
                );
                return (
                  <div className="absolute top-full right-0 mt-2 w-72 lg:w-80 bg-[#1E293B] border border-[#334155] rounded-xl shadow-2xl overflow-hidden z-50 font-mono text-xs animate-in fade-in">
                    <div className="p-2.5 bg-[#0F172A] border-b border-[#334155] flex items-center justify-between text-[10px] text-[#94A3B8] uppercase font-bold">
                      <span>Tournament Suggestions</span>
                      <span className="text-[#E56A10] font-bold">{matched.length} Results</span>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-[#334155]/60">
                      {matched.slice(0, 5).map((t) => (
                        <Link
                          key={t.id}
                          href={`/tournaments/${t.slug || t.id}`}
                          onClick={() => {
                            setIsSearchDropdownOpen(false);
                            setSearchQuery("");
                          }}
                          className="p-3 hover:bg-[#334155]/60 transition-colors block group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-white font-bold truncate group-hover:text-[#E56A10] transition-colors">
                              {t.title}
                            </span>
                            <span className="text-[10px] text-[#E56A10] font-bold shrink-0">
                              ₹{t.prizePoolNum?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-[#94A3B8]">
                            <span className="px-1.5 py-0.5 bg-[#0F172A] rounded border border-[#334155] uppercase text-white font-semibold">
                              {t.gameName}
                            </span>
                            <span className="truncate">{t.serverRegion}</span>
                          </div>
                        </Link>
                      ))}

                      {matched.length === 0 && (
                        <div className="p-4 text-center text-[#94A3B8] text-xs">
                          No tournaments matching &quot;{searchQuery}&quot;
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSearchSubmit}
                      className="w-full p-2.5 bg-[#0F172A] hover:bg-[#334155] text-[#E56A10] text-[11px] font-bold text-center border-t border-[#334155] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>View all {matched.length} matching tournaments</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Notifications Dropdown */}
            <NotificationsDropdown />

            {/* Theme Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="h-8 w-8 rounded-lg border border-[#242C3D] bg-[#161A24]/70 hover:bg-[#161A24] text-[#CBD5E1] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Color Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-blue-400 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Clerk Auth Section */}
            <Show when="signed-out">
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-[#242C3D] shrink-0">
                <SignInButton mode="modal">
                  <button className="px-2 sm:px-2.5 py-1.5 text-xs font-mono font-bold text-[#CBD5E1] hover:text-white transition-colors cursor-pointer">
                    SIGN IN
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-2.5 sm:px-3 py-1.5 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded transition-colors shadow-xs cursor-pointer flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    JOIN LEAGUE
                  </button>
                </SignUpButton>
              </div>
            </Show>

            <Show when="signed-in">
              <div className="relative flex items-center pl-2 sm:pl-2.5 border-l border-[#242C3D] shrink-0" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-2 xl:px-2.5 py-1 rounded-lg bg-[#161A24]/70 hover:bg-[#161A24] border border-[#242C3D] hover:border-[#E56A10]/50 transition-all cursor-pointer group shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E56A10]"
                  aria-expanded={isProfileDropdownOpen}
                  aria-label="User profile menu"
                >
                  {/* Custom Esports Avatar */}
                  <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden border border-[#242C3D] group-hover:border-[#E56A10] bg-slate-900 shrink-0">
                    <img
                      src={userProfile?.avatar_url || user?.imageUrl || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop"}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-[#0B0E16]" />
                  </div>

                  {/* Gamer Tag & Distinct Role Badge */}
                  <div className="hidden sm:flex flex-col text-left">
                    {isProfileLoading ? (
                      <div className="space-y-1">
                        <div className="w-16 h-3 bg-slate-700/60 rounded animate-pulse" />
                        <div className="w-10 h-2 bg-slate-800 rounded animate-pulse" />
                      </div>
                    ) : (
                      <>
                        <span className="text-white font-headline font-bold text-xs tracking-wide group-hover:text-[#E56A10] transition-colors truncate max-w-[100px] xl:max-w-[140px]">
                          {userProfile?.username || userProfile?.display_name || "Gamer"}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded border w-fit whitespace-nowrap ${
                            isSuperAdmin
                              ? "bg-[#E56A10]/20 text-[#FFB68F] border-[#E56A10]/50"
                              : role === "ORGANIZER"
                              ? "bg-amber-950/40 text-amber-300 border-amber-500/40"
                              : "bg-slate-800/80 text-slate-300 border-slate-700"
                          }`}
                        >
                          {role === "SUPER_ADMIN" ? "SUPER ADMIN" : role}
                        </span>
                      </>
                    )}
                  </div>

                  <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Interactive Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-[#0E121B] border border-[#242C3D] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in-50 zoom-in-95">
                    {/* Header: Avatar, Name, Email, Role */}
                    <div className="p-4 bg-[#161A24]/90 border-b border-[#242C3D] flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#242C3D] bg-slate-900 shrink-0">
                        <img
                          src={userProfile?.avatar_url || user?.imageUrl || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop"}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-headline font-bold text-sm truncate">
                            {userProfile?.username || userProfile?.display_name || "Gamer"}
                          </span>
                          <span className="px-1.5 py-0.2 bg-[#E56A10]/20 text-[#E56A10] border border-[#E56A10]/30 text-[9px] font-mono font-bold rounded">
                            {role === "SUPER_ADMIN" ? "SUPER ADMIN" : role}
                          </span>
                        </div>
                        <span className="text-[#94A3B8] text-[11px] font-mono truncate">
                          {userEmail || user?.id}
                        </span>
                      </div>
                    </div>

                    {/* Wallet Balance */}
                    <div className="p-3 bg-[#121622] border-b border-[#242C3D] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-[#E56A10]" />
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Wallet Balance</span>
                      </div>
                      <span className="font-mono font-bold text-white text-xs">
                        ₹{Number(userProfile?.inr_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Quick Portal Navigation Links */}
                    <div className="p-2 space-y-1">
                      <Link
                        href="/dashboard"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#CBD5E1] hover:text-white hover:bg-[#161A24] rounded-lg transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#E56A10]" />
                        <span>Gamer Dashboard</span>
                      </Link>

                      {(isOrganizer || isSuperAdmin) && (
                        <Link
                          href="/organizer"
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#CBD5E1] hover:text-white hover:bg-[#161A24] rounded-lg transition-colors"
                        >
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <span>Organizer Hub</span>
                        </Link>
                      )}

                      {isSuperAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#CBD5E1] hover:text-white hover:bg-[#161A24] rounded-lg transition-colors"
                        >
                          <Shield className="w-4 h-4 text-[#E56A10]" />
                          <span>Admin Console</span>
                        </Link>
                      )}
                    </div>

                    {/* Sign Out Action */}
                    <div className="p-2 border-t border-[#242C3D] bg-[#121622]/50">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsProfileDropdownOpen(false);
                          await signOut();
                          router.push("/");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>SIGN OUT</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Show>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded text-[#CBD5E1] hover:text-white hover:bg-[#161A24] border border-[#242C3D] shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sliding Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div
            onClick={closeAllDropdowns}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Menu */}
          <div className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-[#0E121B] border-l border-[#242C3D] p-5 flex flex-col justify-between overflow-y-auto shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#242C3D]">
                <span className="text-xs font-mono font-bold uppercase text-[#CBD5E1] tracking-wider">
                  Arena Navigation
                </span>
                <button
                  type="button"
                  onClick={closeAllDropdowns}
                  className="p-1 rounded-lg border border-[#242C3D] text-[#CBD5E1] hover:text-white hover:bg-[#161A24] cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

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
                      onClick={closeAllDropdowns}
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
                    onClick={closeAllDropdowns}
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

              {/* Operations & Administration - Only visible if authorized */}
              {(isOrganizer || isSuperAdmin) && (
                <div className="space-y-1 pt-3 border-t border-[#242C3D]">
                  <div className="text-[10px] font-mono uppercase text-[#64748B] px-3 py-1 font-bold">
                    Operations &amp; Admin
                  </div>
                  <Link
                    href="/organizer"
                    onClick={closeAllDropdowns}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-mono font-medium transition-colors ${
                      isActive("/organizer")
                        ? "bg-[#E56A10]/20 text-[#E56A10] border border-[#E56A10]/40 font-bold"
                        : "text-[#CBD5E1] hover:bg-[#161A24]"
                    }`}
                  >
                    <Trophy className="w-4 h-4 text-[#E56A10]" />
                    Organizer Portal
                  </Link>
                  {isSuperAdmin && (
                    <Link
                      href="/admin"
                      onClick={closeAllDropdowns}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-mono font-medium transition-colors ${
                        isActive("/admin")
                          ? "bg-[#E56A10] text-white font-bold"
                          : "text-[#CBD5E1] hover:bg-[#161A24]"
                      }`}
                    >
                      <Shield className="w-4 h-4 text-[#E56A10]" />
                      Admin Cockpit
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#161A24] border border-[#242C3D] text-xs font-mono text-[#CBD5E1] hover:text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 font-bold">
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-blue-400" />
                  )}
                  <span>THEME MODE</span>
                </span>
                <span className="text-[11px] font-bold uppercase text-[#E56A10] bg-[#E56A10]/10 px-2 py-0.5 rounded border border-[#E56A10]/30">
                  {theme}
                </span>
              </button>
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
                <div className="bg-[#161A24] p-3.5 rounded-xl border border-[#242C3D] flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#242C3D] bg-slate-900 shrink-0">
                      <img
                        src={userProfile?.avatar_url || user?.imageUrl || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop"}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="text-white text-xs font-bold truncate">
                        {userProfile?.display_name || user?.username || user?.firstName || "Player"}
                      </div>
                      <span className="text-[10px] font-mono text-[#E56A10] font-bold">
                        {role === "SUPER_ADMIN" ? "SUPER ADMIN" : role}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] font-mono truncate">
                        {userEmail}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-[#0E121B] px-3 py-2 rounded-lg border border-[#242C3D] text-xs font-mono">
                    <span className="text-[#94A3B8]">Wallet Balance</span>
                    <span className="text-white font-bold">
                      ₹{Number(userProfile?.inr_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await signOut();
                      router.push("/");
                    }}
                    className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>SIGN OUT</span>
                  </button>
                </div>
              </Show>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
