"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getGames, normalizeGame, NormalizedGame } from "@/lib/api/games";
import { GameCategory } from "@/types";
import { Shield, Search, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";

export default function GamesDirectoryPage() {
  const [games, setGames] = useState<NormalizedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiGames = await getGames();
      if (Array.isArray(apiGames)) {
        setGames(apiGames.map(normalizeGame));
      } else {
        setGames([]);
      }
    } catch (err: unknown) {
      console.error("Failed to load games from database", err);
      setGames([]);
      setError("Unable to load games from database. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const filteredGames = games.filter((game) => {
    const matchesCategory =
      selectedCategory === "all" ? true : game.category === selectedCategory;
    const matchesSearch =
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.platform.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F8F9FF] dark:bg-[#0B0E16] text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      {/* Sub-Bar & Breadcrumbs Context */}
      <div className="w-full bg-[#F1F3F5] dark:bg-[#121622] py-2.5 px-4 md:px-8 border-b border-[#E2E8F0] dark:border-[#242C3D] transition-colors">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span className="text-[#E56A10] font-bold">DIRECTORY</span>
            <span>/</span>
            <span className="text-[#0F172A] dark:text-white font-semibold">SANCTIONED DISCIPLINES</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 bg-[#E2E8F0] dark:bg-[#161A24] text-[#0F172A] dark:text-slate-200 border dark:border-[#242C3D] rounded text-[10px] uppercase font-bold">
              SEASON 04 ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-[#0F172A] dark:text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              TOURNAMENT PLATFORM ACTIVE
            </span>
            <span className="hidden md:inline text-[#64748B] dark:text-[#94A3B8]">LIVE ARENA ENGINE</span>
          </div>
        </div>
      </div>

      {/* Hero Header Section */}
      <section className="w-full bg-white dark:bg-[#0B0E16] py-12 px-4 md:px-8 border-b border-[#E2E8F0] dark:border-[#242C3D] transition-colors">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F3F5] dark:bg-[#161A24] border dark:border-[#242C3D] rounded text-[#E56A10] text-xs font-bold tracking-widest uppercase font-mono">
                <Shield className="w-3.5 h-3.5" />
                OFFICIAL SANCTIONED COMPETITIONS
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold font-headline text-[#0F172A] dark:text-white uppercase tracking-tight">
                SUPPORTED COMPETITIVE DISCIPLINES
              </h1>
              <p className="text-sm text-[#475569] dark:text-[#94A3B8] max-w-3xl leading-relaxed">
                Explore sanctioned esports tournaments across official competitive titles. Select your game to enter dedicated hubs, view rulebooks, deploy anti-cheat verifications, and manage verified squad lineups.
              </p>
            </div>

            {/* Telemetry Metrics Card Cluster */}
            <div className="lg:col-span-4 bg-[#F8F9FA] dark:bg-[#121622] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#242C3D]">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white dark:bg-[#161A24] rounded-lg border border-[#E2E8F0] dark:border-[#242C3D]">
                  <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase block">
                    Disciplines
                  </span>
                  <span className="text-2xl font-bold font-headline text-[#0F172A] dark:text-white block tabular-nums">
                    {games.length}
                  </span>
                  <span className="text-[11px] text-[#E56A10] font-medium font-mono">
                    100% Certified
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-[#161A24] rounded-lg border border-[#E2E8F0] dark:border-[#242C3D]">
                  <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase block">
                    Active Squads
                  </span>
                  <span className="text-2xl font-bold font-headline text-[#E56A10] block tabular-nums">
                    {games.reduce((acc, g) => acc + (g.teamsCount || 0), 0)}
                  </span>
                  <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                    Registered Rosters
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="w-full py-4 px-4 md:px-8 border-b border-[#E2E8F0] dark:border-[#242C3D] sticky top-16 z-20 backdrop-blur-md bg-white/90 dark:bg-[#0B0E16]/90 transition-colors">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {(["all", "pc", "mobile", "crossplay", "solo"] as GameCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded text-xs font-mono font-bold uppercase transition-colors whitespace-nowrap cursor-pointer border ${
                  selectedCategory === cat
                    ? "bg-[#0F172A] dark:bg-[#E56A10] text-white border-transparent shadow-xs"
                    : "bg-white dark:bg-[#161A24] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white border-[#E2E8F0] dark:border-[#242C3D]"
                }`}
              >
                {cat === "all" ? "All Disciplines" : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, platform, or tags..."
              className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-[#161A24] text-[#0F172A] dark:text-white placeholder-[#94A3B8] text-xs rounded border border-[#CBD5E1] dark:border-[#242C3D] focus:outline-hidden focus:border-[#E56A10]"
            />
          </div>
        </div>
      </section>

      {/* Notice bar if offline fallback */}
      {error && (
        <div className="w-full bg-[#FEF3C7] border-b border-[#F59E0B]/30 px-4 py-2 text-xs font-mono text-[#92400E] flex items-center justify-between max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchGames}
            className="flex items-center gap-1 font-bold underline hover:text-[#B45309]"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Games Bento Grid */}
      <section className="w-full py-12 px-4 md:px-8 max-w-[1440px] mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#E2E8F0] h-96 animate-pulse p-4 space-y-4"
              >
                <div className="w-full h-44 bg-[#E2E8F0] rounded-lg" />
                <div className="h-6 bg-[#E2E8F0] rounded w-3/4" />
                <div className="h-4 bg-[#F1F3F5] dark:bg-[#161A24] rounded w-full" />
                <div className="h-10 bg-[#E2E8F0] dark:bg-[#242C3D] rounded mt-6" />
              </div>
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#121622] rounded-xl border border-[#E2E8F0] dark:border-[#242C3D] p-8 space-y-4">
            <AlertTriangle className="w-12 h-12 text-[#94A3B8] mx-auto" />
            <h3 className="text-lg font-bold font-headline text-[#0F172A] dark:text-white">
              {games.length === 0 ? "No Sanctioned Disciplines Yet" : "No Matching Disciplines Found"}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-sm mx-auto">
              {games.length === 0
                ? "There are currently no competitive titles configured in the platform database."
                : `No games matched category "${selectedCategory}" and search "${searchQuery}". Try adjusting filters.`}
            </p>
            {games.length > 0 && (
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-[#0F172A] dark:bg-[#E56A10] text-white rounded text-xs font-mono font-bold uppercase hover:bg-[#1E293B] dark:hover:bg-[#D45900] cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredGames.map((game) => (
              <article
                key={game.slug}
                className="flex flex-col justify-between bg-white dark:bg-[#121622] rounded-xl border border-[#E2E8F0] dark:border-[#242C3D] hover:border-[#CBD5E1] dark:hover:border-[#E56A10]/50 shadow-xs hover:shadow-md transition-all overflow-hidden group"
              >
                <div>
                  {/* Thumbnail Header */}
                  <div className="relative w-full h-44 overflow-hidden bg-[#0B0E16]">
                    <Image
                      src={game.bannerUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop"}
                      alt={game.name}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-white/90 dark:bg-slate-900/90 text-[#0F172A] dark:text-white font-mono text-[10px] rounded font-bold">
                        {game.platform}
                      </span>
                      <span className="px-2 py-0.5 bg-[#E56A10] text-white font-mono text-[10px] rounded font-bold">
                        {game.tag}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-mono">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {game.teamsCount || 0} SQUADS
                      </span>
                      <span className="bg-black/60 px-2 py-0.5 rounded text-[11px]">
                        {game.entryFeeInr > 0 ? `ENTRY ₹${game.entryFeeInr}` : "FREE ENTRY"}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col gap-3">
                    <div>
                      <h3 className="text-xl font-bold font-headline text-[#0F172A] dark:text-white group-hover:text-[#E56A10] transition-colors">
                        {game.name}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
                        {game.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-[#F1F3F5] dark:border-[#242C3D] text-xs">
                      <div>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase font-mono block">
                          Prize Pool
                        </span>
                        <span className="text-base font-bold font-headline text-[#E56A10] tabular-nums">
                          {game.prizePoolInr > 0 ? `₹${game.prizePoolInr.toLocaleString("en-IN")}` : "Glory & Rank"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase font-mono block">
                          Game Format
                        </span>
                        <span className="text-xs font-bold text-[#0F172A] dark:text-white font-mono block mt-0.5">
                          {game.isTeamGame ? `${game.minTeamSize}v${game.minTeamSize} Squad` : "Solo 1v1"}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono flex items-center justify-between">
                      <span>Server: {game.serverRegion}</span>
                      <span>{game.antiCheat}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="p-5 pt-0">
                  <Link
                    href={`/games/${game.slug}`}
                    className="w-full py-2.5 bg-[#0F172A] dark:bg-[#E56A10] hover:bg-[#1E293B] dark:hover:bg-[#D45900] text-white text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Enter Dedicated Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
