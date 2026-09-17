"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { getTournaments, normalizeTournament, NormalizedTournament } from "@/lib/api/tournaments";
import { TOURNAMENTS_DATA } from "@/lib/data/tournaments";
import { GAMES_DATA } from "@/lib/data/games";
import {
  Trophy,
  Search,
  ArrowRight,
  Shield,
  Gamepad2,
  Calendar,
  X,
} from "lucide-react";

function TournamentsContent() {
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get("search") || "";

  const [tournaments, setTournaments] = useState<NormalizedTournament[]>(() =>
    TOURNAMENTS_DATA.map(normalizeTournament)
  );
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedFee, setSelectedFee] = useState("all");
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);

  useEffect(() => {
    setSearchQuery(searchFromUrl);
  }, [searchFromUrl]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const data = await getTournaments();
      if (data && data.length > 0) {
        setTournaments(data.map(normalizeTournament));
      }
    } catch (err: unknown) {
      // Silent seamless fallback to cached static tournament catalog without user disruption
      console.warn("Backend /tournaments fallback to local catalog", err);
      setTournaments(TOURNAMENTS_DATA.map(normalizeTournament));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const filteredTournaments = tournaments.filter((t) => {
    const matchesGame = selectedGame === "all" || t.gameSlug === selectedGame;
    const matchesFee =
      selectedFee === "all" ||
      (selectedFee === "free" && t.entryFeeNum === 0) ||
      (selectedFee === "paid" && t.entryFeeNum > 0);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.gameName.toLowerCase().includes(q) ||
      t.gameSlug.toLowerCase().includes(q) ||
      t.serverRegion.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q));
    return matchesGame && matchesFee && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full bg-[#0F172A] min-h-screen text-[#F8FAFC]">
      {/* Sub-Bar */}
      <div className="w-full bg-[#1E293B] py-2.5 px-4 md:px-8 border-b border-[#334155]">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs font-mono text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#E56A10] transition-colors">
              HOME
            </Link>
            <span>/</span>
            <span className="text-white font-bold">TOURNAMENTS DISCOVERY</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-white">
              <span className="w-2 h-2 rounded-full bg-[#E56A10] animate-pulse" />
              {tournaments.length} ACTIVE BRACKETS
            </span>
            <span className="hidden md:inline text-[#64748B]">LIVE ARENA ENGINE</span>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <section className="bg-[#10141F] py-12 px-4 md:px-8 border-b border-[#242C3D]">
        <div className="max-w-[1440px] mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161A24] border border-[#242C3D] rounded text-[#E56A10] text-xs font-bold tracking-wider uppercase font-mono">
            <Trophy className="w-3.5 h-3.5" />
            OFFICIAL SANCTIONED COMPETITIONS
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-headline text-white uppercase tracking-tight">
            TOURNAMENT SCHEDULE & PRIZE POOLS
          </h1>
          <p className="text-sm text-[#94A3B8] max-w-2xl leading-relaxed">
            Discover upcoming competitive cups across certified esports disciplines. Register verified squads, compete with zero hidden fees, and battle under automated anti-cheat supervision.
          </p>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="bg-[#10141F]/95 py-4 px-4 md:px-8 border-b border-[#242C3D] sticky top-16 z-20 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Game Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedGame("all")}
              className={`px-3.5 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                selectedGame === "all"
                  ? "bg-[#E56A10] text-white shadow-xs"
                  : "bg-[#161A24] text-[#94A3B8] hover:text-white border border-[#242C3D]"
              }`}
            >
              All Disciplines
            </button>
            {GAMES_DATA.map((g) => (
              <button
                key={g.slug}
                onClick={() => setSelectedGame(g.slug)}
                className={`px-3.5 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  selectedGame === g.slug
                    ? "bg-[#E56A10] text-white shadow-xs"
                    : "bg-[#161A24] text-[#94A3B8] hover:text-white border border-[#242C3D]"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Fee Filter & Search Input */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-[#161A24] border border-[#242C3D] rounded-lg p-1 text-xs font-mono">
              <button
                onClick={() => setSelectedFee("all")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedFee === "all" ? "bg-[#E56A10] text-white font-bold" : "text-[#94A3B8] hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFee("free")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedFee === "free" ? "bg-[#E56A10] text-white font-bold" : "text-[#94A3B8] hover:text-white"
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setSelectedFee("paid")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedFee === "paid" ? "bg-[#E56A10] text-white font-bold" : "text-[#94A3B8] hover:text-white"
                }`}
              >
                Paid
              </button>
            </div>

            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tournament title or game..."
                className="w-full pl-8 pr-8 py-1.5 bg-[#161A24] text-white placeholder-[#64748B] text-xs rounded-lg border border-[#242C3D] focus:outline-hidden focus:border-[#E56A10] font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tournament Cards Grid */}
      <section className="py-10 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-[#1E293B] rounded-xl border border-[#334155] h-96 animate-pulse p-4 space-y-4"
              >
                <div className="w-full h-40 bg-[#0F172A] rounded-lg" />
                <div className="h-6 bg-[#0F172A] rounded w-3/4" />
                <div className="h-4 bg-[#0F172A] rounded w-full" />
                <div className="h-10 bg-[#0F172A] rounded mt-6" />
              </div>
            ))}
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-16 bg-[#1E293B] rounded-xl border border-[#334155] p-8 space-y-4">
            <Trophy className="w-12 h-12 text-[#64748B] mx-auto" />
            <h3 className="text-lg font-bold font-headline text-white">
              No Tournaments Found
            </h3>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto font-mono">
              No tournaments matched your filters. Try resetting the search or filters.
            </p>
            <button
              onClick={() => {
                setSelectedGame("all");
                setSelectedFee("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-[#E56A10] text-white rounded-lg text-xs font-mono font-bold uppercase hover:bg-[#D45900] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <article
                key={tournament.id}
                className="flex flex-col justify-between bg-[#1E293B] rounded-xl border border-[#334155] hover:border-[#E56A10]/60 shadow-lg hover:shadow-xl transition-all overflow-hidden group"
              >
                <div>
                  {/* Banner & Header */}
                  <div className="relative w-full h-44 overflow-hidden bg-[#0F172A]">
                    <Image
                      src={tournament.bannerUrl}
                      alt={tournament.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] via-[#1E293B]/40 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-[#0F172A]/90 text-[#FFB68F] border border-[#E56A10]/40 font-mono text-[10px] rounded font-bold uppercase">
                        {tournament.gameName}
                      </span>
                      <span className="px-2 py-0.5 bg-[#1E293B] border border-[#334155] text-white font-mono text-[10px] rounded font-bold">
                        {tournament.format}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          tournament.status === "LIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-[#0B0E16]/80 text-[#FFB68F] border border-[#E56A10]/40"
                        }`}
                      >
                        {tournament.statusLabel}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-mono">
                      <span className="text-[#94A3B8]">{tournament.registeredTeams} / {tournament.maxTeams} SQUADS</span>
                      <span className="text-[#E56A10] font-bold text-sm">{tournament.prizePool}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col gap-3">
                    <h3 className="text-lg font-bold font-headline text-white group-hover:text-[#E56A10] transition-colors line-clamp-1">
                      {tournament.title}
                    </h3>
                    <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                      {tournament.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 py-2 border-y border-[#242C3D] text-xs font-mono">
                      <div className="bg-[#0B0E16] p-2 rounded border border-[#242C3D]">
                        <span className="text-[10px] text-[#64748B] uppercase block">Schedule</span>
                        <span className="text-white font-medium block truncate mt-0.5">
                          {tournament.startsAt}
                        </span>
                      </div>
                      <div className="bg-[#0B0E16] p-2 rounded border border-[#242C3D]">
                        <span className="text-[10px] text-[#64748B] uppercase block">Entry Fee</span>
                        <span className="text-[#E56A10] font-bold block mt-0.5">
                          {tournament.entryFee}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#94A3B8] font-mono flex items-center justify-between">
                      <span>Server: {tournament.serverRegion}</span>
                      <span className="text-[#CBD5E1]">{tournament.rankRequirement}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <Link
                    href={`/tournaments/${tournament.slug}`}
                    className="w-full py-2.5 bg-[#161A24] hover:bg-[#E56A10] text-white hover:text-white border border-[#242C3D] hover:border-[#E56A10] text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all font-mono shadow-xs"
                  >
                    <span>View Hub & Bracket</span>
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

export default function TournamentsDiscoveryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0E16] flex items-center justify-center text-[#94A3B8] font-mono text-sm">
        Loading tournaments...
      </div>
    }>
      <TournamentsContent />
    </Suspense>
  );
}
