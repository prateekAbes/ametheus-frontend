'use client';

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  getLeaderboard,
  getLeaderboardCategories,
  createLeaderboardCategory,
  deleteLeaderboardCategory,
  getLeaderboardStats,
  updateLeaderboardStats,
  createLeaderboardEntry,
  removeLeaderboardEntry,
  LeaderboardEntry,
  LeaderboardCategory,
  LeaderboardCategoryCreatePayload,
  LeaderboardStats,
  CustomLeaderboardEntryPayload,
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
  Ban,
  UserX,
  RotateCcw,
  AlertTriangle,
  Settings,
  Save,
} from "lucide-react";
import {
  getDisqualifiedEntries,
  disqualifyLeaderboardEntry,
  reinstateLeaderboardEntry,
  LeaderboardDisqualification,
} from "@/lib/api/leaderboard";

export default function LeaderboardPage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
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

  // Disqualification Management State
  const [disqualifiedList, setDisqualifiedList] = useState<LeaderboardDisqualification[]>([]);
  const [viewMode, setViewMode] = useState<"standings" | "disqualified">("standings");
  const [disqualifyingEntry, setDisqualifyingEntry] = useState<any | null>(null);
  const [dqReason, setDqReason] = useState("Cheating / Third-Party Tool Detected");
  const [dqNotes, setDqNotes] = useState("");
  const [isSubmittingDq, setIsSubmittingDq] = useState(false);

  const [categoryForm, setCategoryForm] = useState<LeaderboardCategoryCreatePayload>({
    name: "",
    game_slug: "all",
    sort_metric: "rating",
    min_matches: 0,
    description: "",
  });

  const [stats, setStats] = useState<LeaderboardStats>({
    total_awarded_prizes: "₹0",
    active_contenders: "0",
    verified_squads: "0",
    top_team_earnings: "₹0",
    top_team_name: "-",
  });
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [statsForm, setStatsForm] = useState<LeaderboardStats>({
    total_awarded_prizes: "₹0",
    active_contenders: "0",
    verified_squads: "0",
    top_team_earnings: "₹0",
    top_team_name: "-",
  });
  const [isSubmittingStats, setIsSubmittingStats] = useState(false);

  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [entryForm, setEntryForm] = useState<CustomLeaderboardEntryPayload>({
    name: "",
    tag: "",
    type: "team",
    game_slug: "valorant",
    game_name: "Valorant",
    captain: "",
    rating: 2000,
    wins: 8,
    losses: 2,
    matches_played: 10,
    win_rate: 80.0,
    earnings: 25000,
    category: "pc",
  });
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);

  const userEmail = (user?.primaryEmailAddress?.emailAddress || profile?.email || "").toLowerCase();
  const isSuperAdmin = userEmail === "pk.4081988@gmail.com" || userEmail === "admin@ametheus.gg" || profile?.role === "SUPER_ADMIN";

  const loadDisqualified = useCallback(async () => {
    try {
      const list = await getDisqualifiedEntries();
      if (Array.isArray(list)) {
        setDisqualifiedList(list);
      }
    } catch (e) {
      console.warn("Failed to load disqualified list", e);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      loadDisqualified();
    }
  }, [isSuperAdmin, loadDisqualified]);

  const handleConfirmDisqualification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disqualifyingEntry) return;
    setIsSubmittingDq(true);
    try {
      await disqualifyLeaderboardEntry({
        entity_id: disqualifyingEntry.id,
        entity_name: disqualifyingEntry.name,
        entity_tag: disqualifyingEntry.tag,
        reason: dqReason,
        notes: dqNotes,
      });
      setCatActionMsg(`"${disqualifyingEntry.name}" has been disqualified and removed.`);
      setDisqualifyingEntry(null);
      setDqNotes("");
      await Promise.all([fetchEntries(), loadDisqualified()]);
      setTimeout(() => setCatActionMsg(""), 4000);
    } catch (err: any) {
      setCatActionMsg(err?.message || "Failed to disqualify entry");
      setTimeout(() => setCatActionMsg(""), 4000);
    } finally {
      setIsSubmittingDq(false);
    }
  };

  const handleReinstateEntry = async (entityId: string, name: string) => {
    try {
      await reinstateLeaderboardEntry(entityId);
      setCatActionMsg(`"${name}" reinstated to leaderboard standings!`);
      await Promise.all([fetchEntries(), loadDisqualified()]);
      setTimeout(() => setCatActionMsg(""), 4000);
    } catch (err: any) {
      setCatActionMsg(err?.message || "Failed to reinstate entity");
      setTimeout(() => setCatActionMsg(""), 4000);
    }
  };

  // Load Categories & User Profile
  useEffect(() => {
    getLeaderboardCategories()
      .then((cats) => {
        if (cats && cats.length > 0) {
          setCategories(cats);
        }
      })
      .catch((err) => console.warn("Failed to load categories:", err));

    getLeaderboardStats()
      .then((st) => {
        if (st) {
          setStats(st);
          setStatsForm(st);
        }
      })
      .catch((err) => console.warn("Failed to load leaderboard stats:", err));

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
        const mapped = data.map((d) => {
          const rawLogo = d.logo_url;
          const safeLogo = (!rawLogo || rawLogo.includes("aida") || rawLogo.includes("googleusercontent.com"))
            ? "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&auto=format&fit=crop"
            : rawLogo;
          return {
            rank: d.rank,
            id: d.id,
            name: d.name,
            tag: d.tag,
            type: d.type || "team",
            gameSlug: d.game_slug,
            gameName: d.game_name,
            captain: d.captain,
            logoUrl: safeLogo,
            winRate: d.win_rate,
            matchesPlayed: d.matches_played,
            wins: d.wins,
            losses: d.losses,
            rating: d.rating,
            earnings: d.earnings,
            form: d.form || ["W", "W", "W", "W", "W"],
            isVerified: d.is_verified,
            category: d.category || "pc",
          };
        });
        setEntries(mapped);
      } else {
        setEntries([]);
      }
    } catch (e) {
      console.warn("Leaderboard live API fetch error:", e);
      setEntries([]);
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

  const handleUpdateStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingStats(true);
    try {
      const updated = await updateLeaderboardStats(statsForm);
      setStats(updated);
      setIsEditingStats(false);
      setCatActionMsg("Leaderboard overview metrics updated successfully!");
      setTimeout(() => setCatActionMsg(""), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to update overview metrics");
    } finally {
      setIsSubmittingStats(false);
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryForm.name.trim() || !entryForm.tag.trim()) return;
    setIsSubmittingEntry(true);
    try {
      await createLeaderboardEntry(entryForm);
      setCatActionMsg(`"${entryForm.name}" successfully added to leaderboard standings!`);
      setIsAddingEntry(false);
      setEntryForm({
        name: "",
        tag: "",
        type: "team",
        game_slug: "valorant",
        game_name: "Valorant",
        captain: "",
        rating: 2000,
        wins: 8,
        losses: 2,
        matches_played: 10,
        win_rate: 80.0,
        earnings: 25000,
        category: "pc",
      });
      await fetchEntries();
      setTimeout(() => setCatActionMsg(""), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to add contender");
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  const handleDirectRemove = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the leaderboard?`)) return;
    try {
      await removeLeaderboardEntry(id);
      setCatActionMsg(`"${name}" removed from leaderboard.`);
      await Promise.all([fetchEntries(), loadDisqualified()]);
      setTimeout(() => setCatActionMsg(""), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to remove entry");
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
    <div className="flex flex-col w-full bg-[#F8F9FF] dark:bg-[#0B0E16] min-h-screen text-[#0B1C30] dark:text-slate-100 transition-colors">
      {/* Action Notification Toast */}
      {catActionMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-[#E56A10] text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-2 font-mono text-xs animate-bounce">
          <Sparkles className="w-4 h-4 text-[#E56A10]" />
          <span>{catActionMsg}</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <section className="w-full bg-[#EFF4FF] dark:bg-[#0F131D] py-10 md:py-12 border-b border-slate-200 dark:border-[#242C3D] transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] rounded text-[#E56A10] text-xs font-bold font-mono tracking-wider uppercase mb-3 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#E56A10] animate-ping" />
                SEASON 2026 // LIVE ARENA RATINGS
              </div>
              <h1 className="text-3xl md:text-5xl font-bold font-headline text-slate-900 dark:text-white tracking-tight uppercase">
                AMETHEUS Global Leaderboard
              </h1>
              <p className="mt-2 text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Track competitive performance, championship standings, and verified prize pool earnings across all sanctioned AMETHEUS tournaments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isSuperAdmin && (
                <>
                  <button
                    onClick={() => {
                      setStatsForm(stats);
                      setIsEditingStats(true);
                    }}
                    className="px-4 py-2.5 bg-slate-900 dark:bg-[#1A2234] hover:bg-slate-800 dark:hover:bg-[#232D42] text-white rounded font-headline font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-transparent dark:border-[#242C3D]"
                  >
                    <Settings className="w-4 h-4 text-[#E56A10]" />
                    Edit Stats
                  </button>
                  <button
                    onClick={() => setIsAddingEntry(true)}
                    className="px-4 py-2.5 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] hover:border-[#E56A10] dark:hover:border-[#E56A10] text-slate-800 dark:text-slate-200 hover:text-[#E56A10] rounded font-headline font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-[#E56A10]" />
                    Add Contender
                  </button>
                  <button
                    onClick={() => setIsAddingCategory(true)}
                    className="px-4 py-2.5 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] hover:border-[#E56A10] dark:hover:border-[#E56A10] text-slate-800 dark:text-slate-200 hover:text-[#E56A10] rounded font-headline font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Filter className="w-4 h-4 text-[#E56A10]" />
                    Add Category
                  </button>
                </>
              )}
              <button
                onClick={exportCsv}
                className="px-4 py-2.5 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] hover:bg-slate-50 dark:hover:bg-[#1A2234] rounded text-slate-700 dark:text-slate-300 font-headline font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
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
            <div className="bg-white dark:bg-[#121622] p-5 rounded-xl border border-slate-200 dark:border-[#242C3D] shadow-xs flex items-center justify-between transition-colors">
              <div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">
                  Total Awarded Prizes
                </div>
                <div className="text-2xl font-bold font-headline text-slate-900 dark:text-white">{stats.total_awarded_prizes}</div>
                <span className="text-[11px] text-[#E56A10] font-mono flex items-center gap-1 mt-1 font-bold">
                  <Shield className="w-3.5 h-3.5" /> Prize Vault Verified
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 flex items-center justify-center text-[#E56A10]">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#121622] p-5 rounded-xl border border-slate-200 dark:border-[#242C3D] shadow-xs flex items-center justify-between transition-colors">
              <div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">
                  Active Contenders
                </div>
                <div className="text-2xl font-bold font-headline text-slate-900 dark:text-white">{stats.active_contenders}</div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 mt-1 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" /> +3,120 This Month
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] flex items-center justify-center text-slate-700 dark:text-slate-300">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#121622] p-5 rounded-xl border border-slate-200 dark:border-[#242C3D] shadow-xs flex items-center justify-between transition-colors">
              <div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">
                  Verified Squads
                </div>
                <div className="text-2xl font-bold font-headline text-slate-900 dark:text-white">{stats.verified_squads}</div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-1 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Verified &amp; Squad Locked
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] flex items-center justify-center text-slate-700 dark:text-slate-300">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#121622] p-5 rounded-xl border border-slate-200 dark:border-[#242C3D] shadow-xs flex items-center justify-between transition-colors">
              <div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">
                  Top Team Earnings
                </div>
                <div className="text-2xl font-bold font-headline text-[#E56A10]">{stats.top_team_earnings}</div>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1 mt-1 font-bold">
                  <Trophy className="w-3.5 h-3.5" /> {stats.top_team_name}
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Flame className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content Area */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full space-y-6">
        {/* Dynamic Categories Tab Bar */}
        <div className="bg-white dark:bg-[#121622] p-4 rounded-xl border border-slate-200 dark:border-[#242C3D] shadow-xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#E56A10]" />
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Leaderboard Criteria:
              </span>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setIsAddingCategory(true)}
                className="text-[11px] font-mono text-[#E56A10] hover:underline flex items-center gap-1 cursor-pointer font-bold"
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer border ${
                      active
                        ? "bg-[#E56A10] text-white border-transparent shadow-xs"
                        : "bg-slate-100 dark:bg-[#161A24] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#242C3D] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1E2538]"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.sort_metric !== "rating" && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded ${active ? "bg-black/25 text-white" : "bg-white dark:bg-[#0B0E16] text-[#E56A10] border border-slate-200 dark:border-[#242C3D] font-bold"}`}>
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
                      className="ml-1 p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
        <div className="bg-white dark:bg-[#121622] p-5 rounded-xl border border-slate-200 dark:border-[#242C3D] shadow-xs space-y-4 transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#242C3D]">
            {/* Teams vs Players */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#161A24] p-1 rounded-lg border border-slate-200 dark:border-[#242C3D]">
              <button
                onClick={() => setSelectedType("teams")}
                className={`px-4 py-1.5 font-headline text-xs font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer border ${
                  selectedType === "teams"
                    ? "bg-[#E56A10] text-white border-transparent shadow-xs"
                    : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Franchise Squads
              </button>
              <button
                onClick={() => setSelectedType("players")}
                className={`px-4 py-1.5 font-headline text-xs font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer border ${
                  selectedType === "players"
                    ? "bg-[#E56A10] text-white border-transparent shadow-xs"
                    : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Individual Athletes
              </button>
            </div>

            {/* Discipline Quick Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
              {disciplines.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDiscipline(d.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors whitespace-nowrap cursor-pointer border ${
                    selectedDiscipline === d.id
                      ? "bg-slate-900 dark:bg-[#E56A10] text-white border-transparent shadow-xs"
                      : "bg-slate-100 dark:bg-[#161A24] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#242C3D] hover:bg-slate-200 dark:hover:bg-[#1E2538] hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Secondary Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search squad name, tag, or captain..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E56A10] font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Sorted by:{" "}
                <strong className="text-slate-900 dark:text-white uppercase">
                  {categories.find((c) => c.slug === selectedCategory)?.name || "Rating ELO"}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Championship Podium (Top 3) */}
        {selectedDiscipline === "all" && selectedType === "teams" && !searchQuery && topThree.length >= 3 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#E56A10]" />
                <h2 className="text-xl font-bold font-headline text-slate-900 dark:text-white uppercase tracking-tight">
                  Championship Podium
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold">
                Top 3 Competitive Franchises
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* #2 Rank */}
              <div className="bg-white dark:bg-[#121622] p-6 rounded-xl border border-slate-200 dark:border-[#242C3D] shadow-xs relative overflow-hidden order-2 md:order-1 transform transition hover:-translate-y-1">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-400" />
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] text-slate-800 dark:text-slate-200 font-headline font-bold text-base">
                    #2
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#161A24] rounded text-[10px] font-mono uppercase text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-[#242C3D]">
                    {topThree[1].gameName}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-lg bg-slate-100 dark:bg-[#161A24] overflow-hidden shrink-0 border border-slate-200 dark:border-[#242C3D]">
                    <Image
                      src={topThree[1].logoUrl}
                      alt={topThree[1].name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-headline text-lg font-bold text-slate-900 dark:text-white">{topThree[1].name}</h3>
                      <CheckCircle className="w-4 h-4 text-[#E56A10]" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">[{topThree[1].tag}] • {topThree[1].captain}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-[#161A24] p-3 rounded-lg mb-4 text-center font-mono border border-slate-200 dark:border-[#242C3D]">
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">WIN RATE</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{topThree[1].winRate}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">W / L</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{topThree[1].wins} / {topThree[1].losses}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">RATING</div>
                    <div className="text-sm font-bold text-[#E56A10] mt-0.5">{topThree[1].rating}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#242C3D]">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase font-bold">Prize Earnings</span>
                  <span className="text-lg font-bold font-headline text-slate-900 dark:text-white">₹{topThree[1].earnings.toLocaleString()}</span>
                </div>
              </div>

              {/* #1 Rank (Center Champion) */}
              <div className="bg-white dark:bg-[#121622] p-7 rounded-xl border-2 border-[#E56A10] shadow-md relative overflow-hidden order-1 md:order-2 -mt-4 transform transition hover:-translate-y-1">
                <div className="absolute top-0 left-0 right-0 h-2 bg-[#E56A10]" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#E56A10] text-white font-headline font-bold text-lg shadow-sm">
                      #1
                    </span>
                    <Trophy className="w-6 h-6 text-amber-500" />
                  </div>
                  <span className="px-2.5 py-1 bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50 text-[#E56A10] text-[10px] font-mono uppercase tracking-wider rounded font-bold">
                    PREMIER CHAMPION
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-20 h-20 rounded-lg bg-slate-100 dark:bg-[#161A24] overflow-hidden shrink-0 border border-slate-200 dark:border-[#242C3D]">
                    <Image
                      src={topThree[0].logoUrl}
                      alt={topThree[0].name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-headline text-2xl font-bold text-slate-900 dark:text-white uppercase">
                        {topThree[0].name}
                      </h3>
                      <CheckCircle className="w-5 h-5 text-[#E56A10]" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">[{topThree[0].tag}] • {topThree[0].captain}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-[#161A24] p-3 rounded-lg mb-4 text-center font-mono border border-slate-200 dark:border-[#242C3D]">
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">WIN RATE</div>
                    <div className="text-lg font-bold text-[#E56A10] mt-0.5">{topThree[0].winRate}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">W / L</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{topThree[0].wins} / {topThree[0].losses}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">RATING</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{topThree[0].rating}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#242C3D]">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase font-bold">Prize Earnings</span>
                  <span className="text-2xl font-bold font-headline text-[#E56A10]">₹{topThree[0].earnings.toLocaleString()}</span>
                </div>
              </div>

              {/* #3 Rank */}
              <div className="bg-white dark:bg-[#121622] p-6 rounded-xl border border-slate-200 dark:border-[#242C3D] shadow-xs relative overflow-hidden order-3 transform transition hover:-translate-y-1">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] text-slate-800 dark:text-slate-200 font-headline font-bold text-base">
                    #3
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#161A24] rounded text-[10px] font-mono uppercase text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-[#242C3D]">
                    {topThree[2].gameName}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-lg bg-slate-100 dark:bg-[#161A24] overflow-hidden shrink-0 border border-slate-200 dark:border-[#242C3D]">
                    <Image
                      src={topThree[2].logoUrl}
                      alt={topThree[2].name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-headline text-lg font-bold text-slate-900 dark:text-white">{topThree[2].name}</h3>
                      <CheckCircle className="w-4 h-4 text-[#E56A10]" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">[{topThree[2].tag}] • {topThree[2].captain}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-[#161A24] p-3 rounded-lg mb-4 text-center font-mono border border-slate-200 dark:border-[#242C3D]">
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">WIN RATE</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{topThree[2].winRate}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">W / L</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{topThree[2].wins} / {topThree[2].losses}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">RATING</div>
                    <div className="text-sm font-bold text-[#E56A10] mt-0.5">{topThree[2].rating}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#242C3D]">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase font-bold">Prize Earnings</span>
                  <span className="text-lg font-bold font-headline text-slate-900 dark:text-white">₹{topThree[2].earnings.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Standings Matrix Table */}
        <div className="bg-white dark:bg-[#121622] rounded-xl border border-slate-200 dark:border-[#242C3D] shadow-xs overflow-hidden mb-12 transition-colors">
          <div className="p-4 bg-white dark:bg-[#121622] border-b border-slate-200 dark:border-[#242C3D] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-headline text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                Standings Matrix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Competitive ranking and rating breakdown ({filteredEntries.length} squads matched)
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E56A10]" />}
              {isSuperAdmin && (
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-[#161A24] p-0.5 rounded-lg border border-slate-200 dark:border-[#242C3D]">
                  <button
                    onClick={() => setViewMode("standings")}
                    className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase rounded-md transition-all cursor-pointer ${
                      viewMode === "standings" ? "bg-[#E56A10] text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Active Standings
                  </button>
                  <button
                    onClick={() => setViewMode("disqualified")}
                    className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                      viewMode === "disqualified" ? "bg-rose-600 text-white" : "text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                    }`}
                  >
                    <Ban className="w-3 h-3" /> Banned ({disqualifiedList.length})
                  </button>
                </div>
              )}
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Live Rating Sync Active</span>
            </div>
          </div>

          {/* DISQUALIFIED LIST VIEW */}
          {isSuperAdmin && viewMode === "disqualified" ? (
            <div className="divide-y divide-slate-100 dark:divide-[#242C3D]">
              {disqualifiedList.length === 0 ? (
                <div className="py-10 text-center text-slate-500 dark:text-slate-400 font-mono text-xs space-y-2">
                  <Ban className="w-8 h-8 mx-auto text-slate-400" />
                  <div className="text-slate-900 dark:text-white font-bold text-sm mt-2">No Disqualified Entries</div>
                  <p>No squads or players have been removed from leaderboard standings.</p>
                </div>
              ) : (
                disqualifiedList.map((dq) => (
                  <div key={dq.entity_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50 dark:hover:bg-[#161A24]/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <UserX className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-bold text-slate-900 dark:text-white">{dq.entity_name}</span>
                        {dq.entity_tag && <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">[{dq.entity_tag}]</span>}
                        <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-[10px] font-mono rounded font-bold uppercase">DQ</span>
                      </div>
                      <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        <span className="text-rose-600 font-bold">Reason: </span>{dq.reason}
                      </p>
                      {dq.notes && <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Arbiter Notes: {dq.notes}</p>}
                      <p className="text-[11px] font-mono text-slate-400">
                        Removed: {dq.disqualified_at ? new Date(dq.disqualified_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleReinstateEntry(dq.entity_id, dq.entity_name)}
                      className="shrink-0 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold uppercase rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reinstate to Standings
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#161A24] border-b border-slate-200 dark:border-[#242C3D] text-slate-600 dark:text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Squad / Captain</th>
                  <th className="py-3 px-4">Game Title</th>
                  <th className="py-3 px-4 text-center">Matches</th>
                  <th className="py-3 px-4 text-center">Win Rate</th>
                  <th className="py-3 px-4 text-center">Form Streak</th>
                  <th className="py-3 px-4 text-right">Rating ELO</th>
                  <th className="py-3 px-4 text-right">Prize Earnings</th>
                  {isSuperAdmin && <th className="py-3 px-4 text-center text-rose-600">Remove</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#242C3D]">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 9 : 8} className="py-8 text-center text-slate-500 dark:text-slate-400 font-mono">
                      No squads matched your current criteria or game filter.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#161A24]/60 transition-colors font-medium text-slate-900 dark:text-slate-100"
                    >
                      {/* Rank */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded font-mono font-bold text-xs ${
                            entry.rank === 1
                              ? "bg-[#E56A10] text-white"
                              : entry.rank === 2
                              ? "bg-slate-200 dark:bg-[#1A2234] text-slate-800 dark:text-slate-200"
                              : entry.rank === 3
                              ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800/50"
                              : "bg-slate-100 dark:bg-[#161A24] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#242C3D]"
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      </td>

                      {/* Team Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-100 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0 overflow-hidden relative">
                            {entry.logoUrl ? (
                              <Image
                                src={entry.logoUrl}
                                alt={entry.name}
                                fill
                                unoptimized
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
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              [{entry.tag}] • {entry.captain}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Discipline */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] rounded text-[11px] font-mono text-slate-700 dark:text-slate-300 uppercase">
                          {entry.gameName}
                        </span>
                      </td>

                      {/* Matches */}
                      <td className="py-3 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
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
                                  ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60"
                                  : "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60"
                              }`}
                            >
                              {res}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {entry.rating.toLocaleString()}
                      </td>

                      {/* Earnings */}
                      <td className="py-3 px-4 text-right font-headline font-bold text-sm text-[#E56A10]">
                        ₹{entry.earnings.toLocaleString()}
                      </td>

                      {/* Admin: Disqualify */}
                      {isSuperAdmin && (
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setDisqualifyingEntry(entry)}
                            className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 text-[10px] font-mono font-bold uppercase rounded flex items-center gap-1 transition-all cursor-pointer mx-auto"
                            title={`Remove ${entry.name} from leaderboard`}
                          >
                            <Ban className="w-3 h-3" /> Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </main>


      {/* Disqualification Modal */}
      {disqualifyingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121622] border border-rose-200 dark:border-rose-900/50 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">
                  Remove from Leaderboard
                </h3>
              </div>
              <button
                onClick={() => { setDisqualifyingEntry(null); setDqNotes(""); }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-600" />
                <span className="font-bold text-slate-900 dark:text-white">{disqualifyingEntry.name}</span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">[{disqualifyingEntry.tag}]</span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                Rank #{disqualifyingEntry.rank} • {disqualifyingEntry.gameName} • Captain: {disqualifyingEntry.captain}
              </p>
            </div>

            <form onSubmit={handleConfirmDisqualification} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 uppercase font-bold mb-1">
                  Removal Reason *
                </label>
                <select
                  value={dqReason}
                  onChange={(e) => setDqReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-mono"
                >
                  <option>Cheating / Third-Party Tool Detected</option>
                  <option>Match Manipulation / Score Fixing</option>
                  <option>Toxic Behavior / Code of Conduct Violation</option>
                  <option>Smurf Account / Identity Fraud</option>
                  <option>Disqualified by Tournament Arbitration</option>
                  <option>Administrative Removal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 uppercase font-bold mb-1">
                  Arbitrator Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={dqNotes}
                  onChange={(e) => setDqNotes(e.target.value)}
                  placeholder="Additional context, evidence references, or ruling notes..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-mono resize-none"
                />
              </div>

              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-lg text-[11px] font-mono text-rose-700 dark:text-rose-400 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                This will immediately remove the squad from all visible leaderboard standings. The record will be preserved in the Disqualified archive for auditing.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setDisqualifyingEntry(null); setDqNotes(""); }}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#1E2538] border border-slate-300 dark:border-[#242C3D] text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDq}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isSubmittingDq ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                  Confirm Removal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Leaderboard Category Modal (Admin Privileges) */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#242C3D] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#E56A10]" />
                <h3 className="font-headline font-bold text-lg text-slate-900 dark:text-white uppercase">
                  Add Leaderboard Category
                </h3>
              </div>
              <button
                onClick={() => setIsAddingCategory(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 uppercase font-bold mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Valorant Sharpshooters, Top Earners"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 uppercase font-bold mb-1">
                    Target Game
                  </label>
                  <select
                    value={categoryForm.game_slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, game_slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
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
                  <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 uppercase font-bold mb-1">
                    Ranking Metric *
                  </label>
                  <select
                    value={categoryForm.sort_metric}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_metric: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
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
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 uppercase font-bold mb-1">
                  Minimum Matches Threshold
                </label>
                <input
                  type="number"
                  min={0}
                  value={categoryForm.min_matches}
                  onChange={(e) => setCategoryForm({ ...categoryForm, min_matches: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 uppercase font-bold mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Short description for leaderboard tooltip"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#1E2538] border border-slate-300 dark:border-[#242C3D] text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono uppercase cursor-pointer"
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

      {/* 5. Edit Overview Stats Modal (Admin Privileges) */}
      {isEditingStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#242C3D] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#E56A10]" />
                <h3 className="font-headline font-bold text-lg text-slate-900 dark:text-white uppercase">
                  Edit Leaderboard Overview Stats
                </h3>
              </div>
              <button
                onClick={() => setIsEditingStats(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStats} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-900 dark:text-slate-200 uppercase font-bold mb-1">
                  Total Awarded Prizes *
                </label>
                <input
                  type="text"
                  required
                  value={statsForm.total_awarded_prizes}
                  onChange={(e) => setStatsForm({ ...statsForm, total_awarded_prizes: e.target.value })}
                  placeholder="e.g. ₹15,00,000+"
                  className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-900 dark:text-slate-200 uppercase font-bold mb-1">
                    Active Contenders *
                  </label>
                  <input
                    type="text"
                    required
                    value={statsForm.active_contenders}
                    onChange={(e) => setStatsForm({ ...statsForm, active_contenders: e.target.value })}
                    placeholder="e.g. 25,000+"
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-900 dark:text-slate-200 uppercase font-bold mb-1">
                    Verified Squads *
                  </label>
                  <input
                    type="text"
                    required
                    value={statsForm.verified_squads}
                    onChange={(e) => setStatsForm({ ...statsForm, verified_squads: e.target.value })}
                    placeholder="e.g. 1,250+"
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-900 dark:text-slate-200 uppercase font-bold mb-1">
                    Top Team Earnings *
                  </label>
                  <input
                    type="text"
                    required
                    value={statsForm.top_team_earnings}
                    onChange={(e) => setStatsForm({ ...statsForm, top_team_earnings: e.target.value })}
                    placeholder="e.g. ₹2,10,000"
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-900 dark:text-slate-200 uppercase font-bold mb-1">
                    Top Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={statsForm.top_team_name}
                    onChange={(e) => setStatsForm({ ...statsForm, top_team_name: e.target.value })}
                    placeholder="e.g. Team Solaris X"
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => setIsEditingStats(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#1E2538] border border-slate-300 dark:border-[#242C3D] text-slate-800 dark:text-slate-200 rounded-lg text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStats}
                  className="px-5 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmittingStats ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Add Contender Modal (Admin Privileges) */}
      {isAddingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#242C3D] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#E56A10]" />
                <h3 className="font-headline font-bold text-lg text-slate-900 dark:text-white uppercase">
                  Add Contender to Standings
                </h3>
              </div>
              <button
                onClick={() => setIsAddingEntry(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-900 dark:text-slate-200 uppercase font-bold mb-1">
                    Entry Type *
                  </label>
                  <select
                    value={entryForm.type}
                    onChange={(e) => setEntryForm({ ...entryForm, type: e.target.value as "team" | "player" })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  >
                    <option value="team">Franchise Squad</option>
                    <option value="player">Individual Athlete</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-900 dark:text-slate-200 uppercase font-bold mb-1">
                    Game Discipline *
                  </label>
                  <select
                    value={entryForm.game_slug}
                    onChange={(e) => {
                      const slug = e.target.value;
                      const gMap: Record<string, string> = {
                        valorant: "Valorant",
                        "counter-strike-2": "CS2",
                        bgmi: "BGMI",
                        chess: "Chess",
                        "smash-karts": "Smash Karts",
                        "mini-militia": "Mini Militia",
                      };
                      setEntryForm({
                        ...entryForm,
                        game_slug: slug,
                        game_name: gMap[slug] || slug,
                      });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  >
                    <option value="valorant">Valorant</option>
                    <option value="counter-strike-2">Counter-Strike 2</option>
                    <option value="bgmi">BGMI</option>
                    <option value="chess">Chess</option>
                    <option value="smash-karts">Smash Karts</option>
                    <option value="mini-militia">Mini Militia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-mono text-slate-900 dark:text-slate-200 uppercase font-bold mb-1">
                    Squad / Contender Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S8UL Esports"
                    value={entryForm.name}
                    onChange={(e) => setEntryForm({ ...entryForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-900 dark:text-slate-200 uppercase font-bold mb-1">
                    Tag *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S8UL"
                    value={entryForm.tag}
                    onChange={(e) => setEntryForm({ ...entryForm, tag: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-900 dark:text-slate-200 uppercase font-bold mb-1">
                    Captain / Handle *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mortal"
                    value={entryForm.captain}
                    onChange={(e) => setEntryForm({ ...entryForm, captain: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-900 dark:text-slate-200 uppercase font-bold mb-1">
                    Initial ELO Rating
                  </label>
                  <input
                    type="number"
                    value={entryForm.rating}
                    onChange={(e) => setEntryForm({ ...entryForm, rating: parseInt(e.target.value) || 1000 })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-900 dark:text-slate-200 uppercase font-bold mb-1">
                    Wins
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={entryForm.wins}
                    onChange={(e) => {
                      const w = parseInt(e.target.value) || 0;
                      const l = entryForm.losses ?? 0;
                      const total = w + l;
                      const rate = total > 0 ? Math.round((w / total) * 100) : 0;
                      setEntryForm({ ...entryForm, wins: w, matches_played: total, win_rate: rate });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-900 dark:text-slate-200 uppercase font-bold mb-1">
                    Losses
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={entryForm.losses}
                    onChange={(e) => {
                      const l = parseInt(e.target.value) || 0;
                      const w = entryForm.wins ?? 0;
                      const total = w + l;
                      const rate = total > 0 ? Math.round((w / total) * 100) : 0;
                      setEntryForm({ ...entryForm, losses: l, matches_played: total, win_rate: rate });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-900 dark:text-slate-200 uppercase font-bold mb-1">
                    Prize Earnings (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={entryForm.earnings}
                    onChange={(e) => setEntryForm({ ...entryForm, earnings: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => setIsAddingEntry(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#1E2538] border border-slate-300 dark:border-[#242C3D] text-slate-800 dark:text-slate-200 rounded-lg text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEntry}
                  className="px-5 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmittingEntry ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add to Standings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

