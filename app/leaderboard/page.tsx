'use client';

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { LEADERBOARD_ENTRIES } from "@/lib/data/leaderboard";
import {
  getLeaderboard,
  getLeaderboardCategories,
  createLeaderboardCategory,
  deleteLeaderboardCategory,
  LeaderboardEntry,
  LeaderboardCategory,
  LeaderboardCategoryCreatePayload,
} from "@/lib/api/leaderboard";
import { getCurrentUserProfile, UserProfile } from "@/lib/api/auth";
import {
  Trophy,
  Shield,
  Search,
  Download,
  CheckCircle,
  Flame,
  Award,
  TrendingUp,
  Users,
  Wallet,
  ArrowRight,
  Plus,
  Trash2,
  Filter,
  Sparkles,
  Gamepad2,
  X,
  Loader2,
} from "lucide-react";

export default function LeaderboardPage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<any[]>(LEADERBOARD_ENTRIES);
  const [categories, setCategories] = useState<LeaderboardCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("overall");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"teams" | "players">("teams");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeframe, setTimeframe] = useState<"all" | "season" | "month" | "weekly">("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [isSubmittingCat, setIsSubmittingCat] = useState<boolean>(false);
  const [catActionMsg, setCatActionMsg] = useState<string>("");

  const [categoryForm, setCategoryForm] = useState<LeaderboardCategoryCreatePayload>({
    name: "",
    game_slug: "all",
    sort_metric: "rating",
    min_matches: 0,
    description: "",
  });

  const userEmail = (user?.primaryEmailAddress?.emailAddress || profile?.email || "").toLowerCase();
  const isSuperAdmin = userEmail === "pk.4081988@gmail.com" || userEmail === "admin@ametheus.gg" || profile?.role === "SUPER_ADMIN";

  // Load Categories & User Profile
  useEffect(() => {
    getLeaderboardCategories()
      .then((cats) => {
        if (cats && cats.length > 0) {
          setCategories(cats);
        }
      })
      .catch((err) => console.warn("Failed to load categories:", err));

    getCurrentUserProfile()
      .then((p) => setProfile(p))
      .catch(() => {});
  }, []);

  // Fetch Leaderboard Entries based on active category & discipline
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getLeaderboard(selectedCategory, selectedDiscipline);
      if (data && data.length > 0) {
        const mapped = data.map((d) => ({
          rank: d.rank,
          id: d.id,
          name: d.name,
          tag: d.tag,
          type: d.type || "team",
          gameSlug: d.game_slug,
          gameName: d.game_name,
          captain: d.captain,
          logoUrl: d.logo_url,
          winRate: d.win_rate,
          matchesPlayed: d.matches_played,
          wins: d.wins,
          losses: d.losses,
          rating: d.rating,
          earnings: d.earnings,
          form: d.form || ["W", "W", "W", "W", "W"],
          isVerified: d.is_verified,
          category: d.category || "pc",
        }));
        setEntries(mapped);
      }
    } catch (e) {
      console.warn("Leaderboard live API fetch fallback:", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedDiscipline]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    setIsSubmittingCat(true);
    try {
      const created = await createLeaderboardCategory(categoryForm);
      setCatActionMsg(`Category "${created.name}" created and standings calculated!`);
      const cats = await getLeaderboardCategories();
      setCategories(cats);
      setSelectedCategory(created.slug);
      setIsAddingCategory(false);
      setCategoryForm({ name: "", game_slug: "all", sort_metric: "rating", min_matches: 0, description: "" });
      setTimeout(() => setCatActionMsg(""), 4000);
    } catch (err: any) {
      setCatActionMsg(err?.message || "Failed to create category");
      setTimeout(() => setCatActionMsg(""), 4000);
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async (slug: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await deleteLeaderboardCategory(slug);
      setCatActionMsg(`Category "${name}" deleted.`);
      const cats = await getLeaderboardCategories();
      setCategories(cats);
      if (selectedCategory === slug) {
        setSelectedCategory("overall");
      }
      setTimeout(() => setCatActionMsg(""), 4000);
    } catch (err: any) {
      setCatActionMsg(err?.message || "Failed to delete category");
      setTimeout(() => setCatActionMsg(""), 4000);
    }
  };

  const disciplines = [
    { id: "all", name: "All Games" },
    { id: "valorant", name: "Valorant" },
    { id: "counter-strike-2", name: "CS2" },
    { id: "bgmi", name: "BGMI" },
    { id: "chess", name: "Chess" },
    { id: "smash-karts", name: "Smash Karts" },
    { id: "mini-militia", name: "Mini Militia" },
  ];

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesDiscipline = selectedDiscipline === "all" || entry.gameSlug === selectedDiscipline;
    const matchesType = selectedType === "teams" ? entry.type === "team" : entry.type === "player";
    const matchesSearch =
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.captain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDiscipline && matchesType && matchesSearch;
  });

  const topThree = entries.slice(0, 3);

  const exportCsv = () => {
    const header = "Rank,Team,Tag,Game,WinRate,Wins,Losses,Rating,Earnings\n";
    const rows = filteredEntries
      .map(
        (e) =>
          `${e.rank},"${e.name}","${e.tag}","${e.gameName}",${e.winRate}%,${e.wins},${e.losses},${e.rating},${e.earnings}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ametheus-leaderboard-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col w-full bg-[#0B0E16] min-h-screen text-white">
      {/* Action Notification Toast */}
      {catActionMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161A24] border border-[#E56A10] text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-2 font-mono text-xs animate-bounce">
          <Sparkles className="w-4 h-4 text-[#E56A10]" />
          <span>{catActionMsg}</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <section className="w-full bg-[#10141F] py-10 md:py-12 border-b border-[#242C3D]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161A24] border border-[#242C3D] rounded text-[#E56A10] text-xs font-bold font-mono tracking-wider uppercase mb-3">
                <span className="w-2 h-2 rounded-full bg-[#E56A10] animate-ping" />
                SEASON 2026 // LIVE ARENA RATINGS
              </div>
              <h1 className="text-3xl md:text-5xl font-bold font-headline text-white tracking-tight uppercase">
                AMETHEUS Global Leaderboard
              </h1>
              <p className="mt-2 text-sm md:text-base text-[#94A3B8] max-w-2xl leading-relaxed">
                Track competitive performance, championship standings, and verified prize pool earnings across all sanctioned AMETHEUS tournaments.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isSuperAdmin && (
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="px-4 py-2.5 bg-[#161A24] border border-[#E56A10]/50 hover:border-[#E56A10] text-[#FFB68F] hover:text-white rounded font-headline font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#E56A10]" />
                  Add Category
                </button>
              )}
              <button
                onClick={exportCsv}
                className="px-4 py-2.5 bg-[#161A24] border border-[#242C3D] hover:border-[#333C4D] rounded text-[#CBD5E1] font-headline font-bold text-xs uppercase tracking-wider hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#94A3B8]" />
                Export CSV
              </button>
              <Link
                href="/tournaments"
                className="px-4 py-2.5 bg-[#E56A10] hover:bg-[#D45900] text-white rounded font-headline font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                Join Tournaments
              </Link>
            </div>
          </div>

          {/* Telemetry Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#161A24] p-5 rounded-xl border border-[#242C3D] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider mb-1 font-bold">
                  Total Awarded Prizes
                </div>
                <div className="text-2xl font-bold font-headline text-white">₹14,50,000+</div>
                <span className="text-[11px] text-[#E56A10] font-mono flex items-center gap-1 mt-1 font-bold">
                  <Shield className="w-3.5 h-3.5" /> Prize Vault Verified
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#E56A10]/15 border border-[#E56A10]/30 flex items-center justify-center text-[#E56A10]">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#161A24] p-5 rounded-xl border border-[#242C3D] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider mb-1 font-bold">
                  Active Contenders
                </div>
                <div className="text-2xl font-bold font-headline text-white">24,800+</div>
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 mt-1 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" /> +3,120 This Month
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#10141F] border border-[#242C3D] flex items-center justify-center text-white">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#161A24] p-5 rounded-xl border border-[#242C3D] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider mb-1 font-bold">
                  Verified Squads
                </div>
                <div className="text-2xl font-bold font-headline text-white">1,120+</div>
                <span className="text-[11px] text-[#94A3B8] font-mono flex items-center gap-1 mt-1 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Verified & Squad Locked
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#10141F] border border-[#242C3D] flex items-center justify-center text-white">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#161A24] p-5 rounded-xl border border-[#242C3D] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider mb-1 font-bold">
                  Top Team Earnings
                </div>
                <div className="text-2xl font-bold font-headline text-[#E56A10]">₹1,85,000</div>
                <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1 mt-1 font-bold">
                  <Trophy className="w-3.5 h-3.5" /> Team Solaris X
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Flame className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content Area */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full space-y-6">
        {/* Dynamic Categories Tab Bar */}
        <div className="bg-[#10141F] p-4 rounded-xl border border-[#242C3D] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#E56A10]" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Leaderboard Criteria:
              </span>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setIsAddingCategory(true)}
                className="text-[11px] font-mono text-[#E56A10] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New Criteria
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {categories.map((cat) => {
              const active = selectedCategory === cat.slug;
              return (
                <div key={cat.slug} className="relative group flex items-center">
                  <button
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? "bg-[#E56A10] text-white shadow-xs"
                        : "bg-[#161A24] text-[#94A3B8] border border-[#242C3D] hover:text-white hover:border-[#333C4D]"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.sort_metric !== "rating" && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded ${active ? "bg-black/25 text-white" : "bg-[#0B0E16] text-[#E56A10]"}`}>
                        {cat.sort_metric.replace("_", " ")}
                      </span>
                    )}
                  </button>
                  {isSuperAdmin && !cat.is_system && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.slug, cat.name);
                      }}
                      className="ml-1 p-1 text-[#64748B] hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete category"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter Controls Card */}
        <div className="bg-[#10141F] p-5 rounded-xl border border-[#242C3D] space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#242C3D]">
            {/* Teams vs Players */}
            <div className="flex items-center gap-1 bg-[#161A24] p-1 rounded-lg border border-[#242C3D]">
              <button
                onClick={() => setSelectedType("teams")}
                className={`px-4 py-1.5 font-headline text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                  selectedType === "teams"
                    ? "bg-[#E56A10] text-white shadow-xs"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                Franchise Squads
              </button>
              <button
                onClick={() => setSelectedType("players")}
                className={`px-4 py-1.5 font-headline text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                  selectedType === "players"
                    ? "bg-[#E56A10] text-white shadow-xs"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                Individual Soloists
              </button>
            </div>

            {/* Timeframe */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All Time" },
                { id: "season", label: "Season 2026" },
                { id: "month", label: "This Month" },
                { id: "weekly", label: "Weekly Blitz" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeframe(t.id as any)}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
                    timeframe === t.id
                      ? "bg-[#E56A10]/20 text-[#FFB68F] border border-[#E56A10]/40"
                      : "text-[#94A3B8] bg-[#161A24] border border-[#242C3D] hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search squad tag, handle, player..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#161A24] border border-[#242C3D] text-xs rounded-lg text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#E56A10]"
              />
            </div>
          </div>

          {/* Discipline Selector Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider font-bold shrink-0 mr-1">
              Game Title:
            </span>
            {disciplines.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDiscipline(d.id)}
                className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-md shrink-0 transition-all cursor-pointer ${
                  selectedDiscipline === d.id
                    ? "bg-[#E56A10] text-white"
                    : "bg-[#161A24] text-[#94A3B8] border border-[#242C3D] hover:text-white"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* Championship Podium (Top 3) */}
        {selectedDiscipline === "all" && selectedType === "teams" && !searchQuery && topThree.length >= 3 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#E56A10]" />
                <h2 className="text-xl font-bold font-headline text-white uppercase tracking-tight">
                  Championship Podium
                </h2>
              </div>
              <span className="text-xs font-mono text-[#94A3B8] uppercase font-bold">
                Top 3 Competitive Franchises
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* #2 Rank */}
              <div className="bg-[#10141F] p-6 rounded-xl border border-[#242C3D] shadow-lg relative overflow-hidden order-2 md:order-1 transform transition hover:-translate-y-1">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#94A3B8]" />
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#161A24] border border-[#242C3D] text-white font-headline font-bold text-base">
                    #2
                  </span>
                  <span className="px-2 py-0.5 bg-[#161A24] rounded text-[10px] font-mono uppercase text-[#94A3B8] font-bold border border-[#242C3D]">
                    {topThree[1].gameName}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-lg bg-[#161A24] overflow-hidden shrink-0 border border-[#242C3D]">
                    <Image
                      src={topThree[1].logoUrl}
                      alt={topThree[1].name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-headline text-lg font-bold text-white">{topThree[1].name}</h3>
                      <CheckCircle className="w-4 h-4 text-[#E56A10]" />
                    </div>
                    <p className="text-xs text-[#94A3B8] font-mono">[{topThree[1].tag}] • {topThree[1].captain}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-[#161A24] p-3 rounded-lg mb-4 text-center font-mono border border-[#242C3D]">
                  <div>
                    <div className="text-[10px] text-[#94A3B8]">WIN RATE</div>
                    <div className="text-sm font-bold text-white mt-0.5">{topThree[1].winRate}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#94A3B8]">W / L</div>
                    <div className="text-sm font-bold text-white mt-0.5">{topThree[1].wins} / {topThree[1].losses}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#94A3B8]">RATING</div>
                    <div className="text-sm font-bold text-[#E56A10] mt-0.5">{topThree[1].rating}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#242C3D]">
                  <span className="text-xs text-[#94A3B8] font-mono uppercase">Prize Earnings</span>
                  <span className="text-lg font-bold font-headline text-white">₹{topThree[1].earnings.toLocaleString()}</span>
                </div>
              </div>

              {/* #1 Rank (Center Champion) */}
              <div className="bg-[#10141F] p-7 rounded-xl border-2 border-[#E56A10] shadow-2xl relative overflow-hidden order-1 md:order-2 -mt-4 transform transition hover:-translate-y-1">
                <div className="absolute top-0 left-0 right-0 h-2 bg-[#E56A10]" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#E56A10] text-white font-headline font-bold text-lg shadow-sm">
                      #1
                    </span>
                    <Trophy className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="px-2.5 py-1 bg-[#E56A10]/20 border border-[#E56A10]/40 text-[#FFB68F] text-[10px] font-mono uppercase tracking-wider rounded font-bold">
                    PREMIER CHAMPION
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-20 h-20 rounded-lg bg-[#161A24] overflow-hidden shrink-0 border border-[#242C3D]">
                    <Image
                      src={topThree[0].logoUrl}
                      alt={topThree[0].name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-headline text-2xl font-bold text-white uppercase">
                        {topThree[0].name}
                      </h3>
                      <CheckCircle className="w-5 h-5 text-[#E56A10]" />
                    </div>
                    <p className="text-xs text-[#94A3B8] font-mono">[{topThree[0].tag}] • {topThree[0].captain}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-[#161A24] p-3 rounded-lg mb-4 text-center font-mono border border-[#242C3D]">
                  <div>
                    <div className="text-[10px] text-[#94A3B8]">WIN RATE</div>
                    <div className="text-lg font-bold text-[#E56A10] mt-0.5">{topThree[0].winRate}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#94A3B8]">W / L</div>
                    <div className="text-lg font-bold text-white mt-0.5">{topThree[0].wins} / {topThree[0].losses}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#94A3B8]">RATING</div>
                    <div className="text-lg font-bold text-white mt-0.5">{topThree[0].rating}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#242C3D]">
                  <span className="text-xs text-[#94A3B8] font-mono uppercase">Prize Earnings</span>
                  <span className="text-2xl font-bold font-headline text-[#E56A10]">₹{topThree[0].earnings.toLocaleString()}</span>
                </div>
              </div>

              {/* #3 Rank */}
              <div className="bg-[#10141F] p-6 rounded-xl border border-[#242C3D] shadow-lg relative overflow-hidden order-3 transform transition hover:-translate-y-1">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-600" />
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#161A24] border border-[#242C3D] text-white font-headline font-bold text-base">
                    #3
                  </span>
                  <span className="px-2 py-0.5 bg-[#161A24] rounded text-[10px] font-mono uppercase text-[#94A3B8] font-bold border border-[#242C3D]">
                    {topThree[2].gameName}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-lg bg-[#161A24] overflow-hidden shrink-0 border border-[#242C3D]">
                    <Image
                      src={topThree[2].logoUrl}
                      alt={topThree[2].name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-headline text-lg font-bold text-white">{topThree[2].name}</h3>
                      <CheckCircle className="w-4 h-4 text-[#E56A10]" />
                    </div>
                    <p className="text-xs text-[#94A3B8] font-mono">[{topThree[2].tag}] • {topThree[2].captain}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-[#161A24] p-3 rounded-lg mb-4 text-center font-mono border border-[#242C3D]">
                  <div>
                    <div className="text-[10px] text-[#94A3B8]">WIN RATE</div>
                    <div className="text-sm font-bold text-white mt-0.5">{topThree[2].winRate}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#94A3B8]">W / L</div>
                    <div className="text-sm font-bold text-white mt-0.5">{topThree[2].wins} / {topThree[2].losses}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#94A3B8]">RATING</div>
                    <div className="text-sm font-bold text-[#E56A10] mt-0.5">{topThree[2].rating}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#242C3D]">
                  <span className="text-xs text-[#94A3B8] font-mono uppercase">Prize Earnings</span>
                  <span className="text-lg font-bold font-headline text-white">₹{topThree[2].earnings.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Standings Matrix Table */}
        <div className="bg-[#10141F] rounded-xl border border-[#242C3D] shadow-sm overflow-hidden mb-12">
          <div className="p-4 bg-[#161A24] border-b border-[#242C3D] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-headline text-base font-bold text-white uppercase tracking-tight">
                Standings Matrix
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Competitive ranking and rating breakdown ({filteredEntries.length} squads matched)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E56A10]" />}
              <span className="text-[11px] font-mono text-[#94A3B8]">Live Rating Sync Active</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0B0E16] border-b border-[#242C3D] text-[#94A3B8] font-mono uppercase text-[11px]">
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Squad / Captain</th>
                  <th className="py-3 px-4">Game Title</th>
                  <th className="py-3 px-4 text-center">Matches</th>
                  <th className="py-3 px-4 text-center">Win Rate</th>
                  <th className="py-3 px-4 text-center">Form Streak</th>
                  <th className="py-3 px-4 text-right">Rating ELO</th>
                  <th className="py-3 px-4 text-right">Prize Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242C3D]">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#94A3B8] font-mono">
                      No squads matched your current criteria or game filter.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-[#161A24]/60 transition-colors font-medium text-white"
                    >
                      {/* Rank */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded font-mono font-bold text-xs ${
                            entry.rank === 1
                              ? "bg-[#E56A10] text-white"
                              : entry.rank === 2
                              ? "bg-[#242C3D] text-[#CBD5E1]"
                              : entry.rank === 3
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : "bg-[#161A24] text-[#94A3B8] border border-[#242C3D]"
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      </td>

                      {/* Team Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[#161A24] border border-[#242C3D] flex items-center justify-center font-bold text-xs text-white shrink-0 overflow-hidden relative">
                            {entry.logoUrl ? (
                              <Image
                                src={entry.logoUrl}
                                alt={entry.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              entry.tag
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold">
                              <span>{entry.name}</span>
                              {entry.isVerified && (
                                <CheckCircle className="w-3.5 h-3.5 text-[#E56A10]" />
                              )}
                            </div>
                            <div className="text-[11px] text-[#94A3B8] font-mono">
                              [{entry.tag}] • {entry.captain}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Discipline */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-[#161A24] border border-[#242C3D] rounded text-[11px] font-mono text-[#CBD5E1] uppercase">
                          {entry.gameName}
                        </span>
                      </td>

                      {/* Matches */}
                      <td className="py-3 px-4 text-center font-mono text-[#94A3B8]">
                        {entry.matchesPlayed} ({entry.wins}W / {entry.losses}L)
                      </td>

                      {/* Win Rate */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#E56A10]">
                        {entry.winRate}%
                      </td>

                      {/* Form Streak */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 font-mono text-[10px] font-bold">
                          {entry.form.map((res: string, i: number) => (
                            <span
                              key={i}
                              className={`w-4 h-4 rounded flex items-center justify-center ${
                                res === "W"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {res}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-white">
                        {entry.rating.toLocaleString()}
                      </td>

                      {/* Earnings */}
                      <td className="py-3 px-4 text-right font-headline font-bold text-sm text-[#E56A10]">
                        ₹{entry.earnings.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 4. Add Leaderboard Category Modal (Admin Privileges) */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#10141F] border border-[#242C3D] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#E56A10]" />
                <h3 className="font-headline font-bold text-lg text-white uppercase">
                  Add Leaderboard Category
                </h3>
              </div>
              <button
                onClick={() => setIsAddingCategory(false)}
                className="text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#94A3B8] uppercase font-bold mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Valorant Sharpshooters, Top Earners"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#161A24] border border-[#242C3D] rounded-lg text-xs text-white focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#94A3B8] uppercase font-bold mb-1">
                    Target Game
                  </label>
                  <select
                    value={categoryForm.game_slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, game_slug: e.target.value })}
                    className="w-full px-3 py-2 bg-[#161A24] border border-[#242C3D] rounded-lg text-xs text-white focus:outline-none focus:border-[#E56A10]"
                  >
                    <option value="all">All Games</option>
                    <option value="valorant">Valorant</option>
                    <option value="counter-strike-2">Counter-Strike 2</option>
                    <option value="bgmi">BGMI</option>
                    <option value="chess">Chess</option>
                    <option value="smash-karts">Smash Karts</option>
                    <option value="mini-militia">Mini Militia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#94A3B8] uppercase font-bold mb-1">
                    Ranking Metric *
                  </label>
                  <select
                    value={categoryForm.sort_metric}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_metric: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#161A24] border border-[#242C3D] rounded-lg text-xs text-white focus:outline-none focus:border-[#E56A10]"
                  >
                    <option value="rating">Rating / ELO</option>
                    <option value="win_rate">Highest Win Rate %</option>
                    <option value="earnings">Total Prize Earnings (₹)</option>
                    <option value="wins">Total Match Wins</option>
                    <option value="matches_played">Most Matches Played</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#94A3B8] uppercase font-bold mb-1">
                  Minimum Matches Threshold
                </label>
                <input
                  type="number"
                  min={0}
                  value={categoryForm.min_matches}
                  onChange={(e) => setCategoryForm({ ...categoryForm, min_matches: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-[#161A24] border border-[#242C3D] rounded-lg text-xs text-white focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#94A3B8] uppercase font-bold mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Short description for leaderboard tooltip"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#161A24] border border-[#242C3D] rounded-lg text-xs text-white focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-4 py-2 bg-[#161A24] border border-[#242C3D] text-[#CBD5E1] hover:text-white rounded-lg text-xs font-mono uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCat}
                  className="px-5 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmittingCat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create &amp; Calculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

