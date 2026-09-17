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
    <div className="flex flex-col w-full bg-[#F8F9FF] min-h-screen text-[#0B1C30]">
      {/* Sub-Bar */}
      <div className="w-full bg-white py-2.5 px-4 md:px-8 border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#E56A10] transition-colors">
              HOME
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">TOURNAMENTS DISCOVERY</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-900 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#E56A10] animate-pulse" />
              {tournaments.length} ACTIVE BRACKETS
            </span>
            <span className="hidden md:inline text-slate-400">LIVE ARENA ENGINE</span>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <section className="bg-[#EFF4FF] py-12 px-4 md:px-8 border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded text-[#E56A10] text-xs font-bold tracking-wider uppercase font-mono shadow-xs">
            <Trophy className="w-3.5 h-3.5" />
            OFFICIAL SANCTIONED COMPETITIONS
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-headline text-slate-900 uppercase tracking-tight">
            TOURNAMENT SCHEDULE &amp; PRIZE POOLS
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Discover upcoming competitive cups across certified esports disciplines. Register verified squads, compete with zero hidden fees, and battle under automated anti-cheat supervision.
          </p>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="bg-white/95 py-4 px-4 md:px-8 border-b border-slate-200 sticky top-16 z-20 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Game Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedGame("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                selectedGame === "all"
                  ? "bg-[#E56A10] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              All Disciplines
            </button>
            {GAMES_DATA.map((g) => (
              <button
                key={g.slug}
                onClick={() => setSelectedGame(g.slug)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  selectedGame === g.slug
                    ? "bg-[#E56A10] text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Fee Filter & Search Input */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1 text-xs font-mono">
              <button
                onClick={() => setSelectedFee("all")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedFee === "all" ? "bg-[#E56A10] text-white font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFee("free")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedFee === "free" ? "bg-[#E56A10] text-white font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setSelectedFee("paid")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedFee === "paid" ? "bg-[#E56A10] text-white font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Paid
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tournaments..."
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#E56A10] font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
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
                className="bg-white rounded-xl border border-slate-200 h-96 animate-pulse p-4 space-y-4 shadow-xs"
              >
                <div className="w-full h-40 bg-slate-100 rounded-lg" />
                <div className="h-6 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-10 bg-slate-100 rounded mt-6" />
              </div>
            ))}
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 space-y-4 shadow-xs">
            <Trophy className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold font-headline text-slate-900">
              No Tournaments Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-mono">
              No tournaments matched your filters. Try resetting the search or filters.
            </p>
            <button
              onClick={() => {
                setSelectedGame("all");
                setSelectedFee("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-[#E56A10] text-white rounded-lg text-xs font-mono font-bold uppercase hover:bg-[#D45900] cursor-pointer shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <article
                key={tournament.id}
                className="flex flex-col justify-between bg-white rounded-xl border border-slate-200 hover:border-[#E56A10] shadow-xs hover:shadow-md transition-all overflow-hidden group"
              >
                <div>
                  {/* Banner & Header */}
                  <div className="relative w-full h-44 overflow-hidden bg-slate-100">
                    <Image
                      src={tournament.bannerUrl}
                      alt={tournament.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-black/75 text-white border border-white/20 font-mono text-[10px] rounded font-bold uppercase backdrop-blur-xs">
                        {tournament.gameName}
                      </span>
                      <span className="px-2 py-0.5 bg-black/75 border border-white/20 text-white font-mono text-[10px] rounded font-bold backdrop-blur-xs">
                        {tournament.format}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border backdrop-blur-xs ${
                          tournament.status === "LIVE"
                            ? "bg-emerald-600/90 text-white border-emerald-400"
                            : "bg-black/75 text-orange-300 border-orange-400/50"
                        }`}
                      >
                        {tournament.statusLabel}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-mono">
                      <span className="text-slate-300">{tournament.registeredTeams} / {tournament.maxTeams} SQUADS</span>
                      <span className="text-[#E56A10] font-bold text-sm bg-black/60 px-2 py-0.5 rounded border border-[#E56A10]/40">{tournament.prizePool}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col gap-3">
                    <h3 className="text-lg font-bold font-headline text-slate-900 group-hover:text-[#E56A10] transition-colors line-clamp-1">
                      {tournament.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {tournament.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 text-xs font-mono">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Schedule</span>
                        <span className="text-slate-900 font-bold block truncate mt-0.5">
                          {tournament.startsAt}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Entry Fee</span>
                        <span className="text-[#E56A10] font-bold block mt-0.5">
                          {tournament.entryFee}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                      <span>Server: <strong className="text-slate-800">{tournament.serverRegion}</strong></span>
                      <span className="text-slate-800 font-semibold">{tournament.rankRequirement}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <Link
                    href={`/tournaments/${tournament.slug}`}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all font-mono shadow-xs"
                  >
                    <span>View Hub &amp; Bracket</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#E56A10]" />
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
