"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getGames, normalizeGame, NormalizedGame } from "@/lib/api/games";
import { GAMES_DATA } from "@/lib/data/games";
import { GameCategory } from "@/types";
import { Shield, Search, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";

export default function GamesDirectoryPage() {
  const [games, setGames] = useState<NormalizedGame[]>(() => GAMES_DATA.map(normalizeGame));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiGames = await getGames();
      if (apiGames && apiGames.length > 0) {
        setGames(apiGames.map(normalizeGame));
      }
    } catch (err: unknown) {
      console.warn("Backend /games unavailable, falling back to static cache", err);
      // Fallback to static data
      setGames(GAMES_DATA.map(normalizeGame));
      setError("Connected in offline preview mode. Showing cached disciplines.");
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
    <div className="flex flex-col w-full">
      {/* Sub-Bar & Breadcrumbs Context */}
      <div className="w-full bg-[#F1F3F5] py-2.5 px-4 md:px-8 border-b border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#64748B]">
          <div className="flex items-center gap-2">
            <span className="text-[#E56A10] font-bold">DIRECTORY</span>
            <span>/</span>
            <span className="text-[#0F172A] font-semibold">SANCTIONED DISCIPLINES</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 bg-[#E2E8F0] text-[#0F172A] rounded text-[10px] uppercase font-bold">
              SEASON 04 ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-[#0F172A]">
              <span className="w-2 h-2 rounded-full bg-[#E56A10] animate-pulse" />
              PRIZE VAULT PROTECTED
            </span>
            <span className="hidden md:inline text-[#64748B]">LIVE ARENA ENGINE</span>
          </div>
        </div>
      </div>

      {/* Hero Header Section */}
      <section className="w-full bg-white py-12 px-4 md:px-8 border-b border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F3F5] rounded text-[#E56A10] text-xs font-bold tracking-widest uppercase font-mono">
                <Shield className="w-3.5 h-3.5" />
                OFFICIAL SANCTIONED COMPETITIONS
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold font-headline text-[#0F172A] uppercase tracking-tight">
                SUPPORTED COMPETITIVE DISCIPLINES
              </h1>
              <p className="text-sm text-[#475569] max-w-3xl leading-relaxed">
                Explore sanctioned esports tournaments across official competitive titles. Select your game to enter dedicated hubs, view rulebooks, deploy anti-cheat verifications, and manage verified squad lineups.
              </p>
            </div>

            {/* Telemetry Metrics Card Cluster */}
            <div className="lg:col-span-4 bg-[#F8F9FA] p-4 rounded-xl border border-[#E2E8F0]">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                    Disciplines
                  </span>
                  <span className="text-2xl font-bold font-headline text-[#0F172A] block tabular-nums">
                    {games.length}
                  </span>
                  <span className="text-[11px] text-[#E56A10] font-medium font-mono">
                    100% Certified
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                    Prize Vault
                  </span>
                  <span className="text-2xl font-bold font-headline text-[#E56A10] block tabular-nums">
                    ₹12.5L+
                  </span>
                  <span className="text-[11px] text-[#64748B] font-mono">
                    Guaranteed Vault
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="w-full bg-[#F8F9FA] py-4 px-4 md:px-8 border-b border-[#E2E8F0] sticky top-16 z-20 backdrop-blur-md bg-white/90">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {(["all", "pc", "mobile", "crossplay", "solo"] as GameCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-[#0F172A] text-white shadow-xs"
                    : "bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]"
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
              className="w-full pl-9 pr-4 py-1.5 bg-white text-[#0F172A] placeholder-[#94A3B8] text-xs rounded border border-[#CBD5E1] focus:outline-none focus:border-[#E56A10]"
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
                <div className="h-4 bg-[#F1F3F5] rounded w-full" />
                <div className="h-10 bg-[#E2E8F0] rounded mt-6" />
              </div>
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E2E8F0] p-8 space-y-4">
            <AlertTriangle className="w-12 h-12 text-[#94A3B8] mx-auto" />
            <h3 className="text-lg font-bold font-headline text-[#0F172A]">
              No Competitive Disciplines Found
            </h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              No games matched category &quot;{selectedCategory}&quot; and search &quot;{searchQuery}&quot;. Try adjusting filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-[#0F172A] text-white rounded text-xs font-mono font-bold uppercase hover:bg-[#1E293B]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredGames.map((game) => (
              <article
                key={game.slug}
                className="flex flex-col justify-between bg-white rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] shadow-xs hover:shadow-md transition-all overflow-hidden group"
              >
                <div>
                  {/* Thumbnail Header */}
                  <div className="relative w-full h-44 overflow-hidden bg-[#0B0E16]">
                    <Image
                      src={game.bannerUrl}
                      alt={game.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-white/90 text-[#0F172A] font-mono text-[10px] rounded font-bold">
                        {game.platform}
                      </span>
                      <span className="px-2 py-0.5 bg-[#E56A10] text-white font-mono text-[10px] rounded font-bold">
                        {game.tag}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-mono">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {game.activeTournaments} CUPS LIVE
                      </span>
                      <span className="bg-black/60 px-2 py-0.5 rounded text-[11px]">
                        {game.upcomingTournaments} UPCOMING
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col gap-3">
                    <div>
                      <h3 className="text-xl font-bold font-headline text-[#0F172A] group-hover:text-[#E56A10] transition-colors">
                        {game.name}
                      </h3>
                      <p className="text-xs text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                        {game.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-[#F1F3F5] text-xs">
                      <div>
                        <span className="text-[10px] text-[#64748B] uppercase font-mono block">
                          Active Pool
                        </span>
                        <span className="text-base font-bold font-headline text-[#E56A10] tabular-nums">
                          {game.activePool}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] uppercase font-mono block">
                          Squad Format
                        </span>
                        <span className="text-xs font-bold text-[#0F172A] font-mono block mt-0.5">
                          {game.isTeamGame ? `${game.minTeamSize} Players Fixed` : "Solo 1v1"}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#64748B] font-mono flex items-center justify-between">
                      <span>Server: {game.serverRegion}</span>
                      <span>{game.antiCheat}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="p-5 pt-0">
                  <Link
                    href={`/games/${game.slug}`}
                    className="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors"
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
