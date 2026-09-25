"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { getTournaments, normalizeTournament, NormalizedTournament } from "@/lib/api/tournaments";
import { getGames, Game } from "@/lib/api/games";
import {
  Trophy,
  Search,
  ArrowRight,
  X,
} from "lucide-react";

const DEFAULT_TOURNAMENT_BANNER = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop";

function TournamentBanner({ src, alt }: { src: string; alt: string }) {
  const isBroken = !src || src.includes("aida") || src.includes("googleusercontent.com");
  const [imgSrc, setImgSrc] = useState(isBroken ? DEFAULT_TOURNAMENT_BANNER : src);

  useEffect(() => {
    if (src && !src.includes("aida") && !src.includes("googleusercontent.com")) {
      setImgSrc(src);
    } else {
      setImgSrc(DEFAULT_TOURNAMENT_BANNER);
    }
  }, [src]);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      unoptimized
      className="object-cover group-hover:scale-105 transition-transform duration-500"
      onError={() => setImgSrc(DEFAULT_TOURNAMENT_BANNER)}
    />
  );
}

function TournamentsContent() {
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get("search") || "";

  const [tournaments, setTournaments] = useState<NormalizedTournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedFee, setSelectedFee] = useState("all");
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);

  useEffect(() => {
    setSearchQuery(searchFromUrl);
  }, [searchFromUrl]);

  const fetchTournamentsAndGames = async () => {
    setLoading(true);
    try {
      const [tList, gList] = await Promise.allSettled([
        getTournaments(),
        getGames(),
      ]);

      if (tList.status === "fulfilled" && Array.isArray(tList.value)) {
        setTournaments(tList.value.map(normalizeTournament));
      } else {
        setTournaments([]);
      }

      if (gList.status === "fulfilled" && Array.isArray(gList.value)) {
        setGames(gList.value);
      } else {
        setGames([]);
      }
    } catch (err: unknown) {
      console.error("Failed to load tournaments from database", err);
      setTournaments([]);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentsAndGames();
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
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.gameName && t.gameName.toLowerCase().includes(q)) ||
      (t.gameSlug && t.gameSlug.toLowerCase().includes(q)) ||
      (t.serverRegion && t.serverRegion.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q));
    return matchesGame && matchesFee && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full bg-[#F8F9FF] dark:bg-[#0B0E16] min-h-screen text-[#0B1C30] dark:text-slate-100 transition-colors">
      {/* Sub-Bar */}
      <div className="w-full bg-white dark:bg-[#0F131D] py-2.5 px-4 md:px-8 border-b border-slate-200 dark:border-[#242C3D] transition-colors">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#E56A10] transition-colors">
              HOME
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold">TOURNAMENTS DISCOVERY</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
              <span className="w-2 h-2 rounded-full bg-[#E56A10] animate-pulse" />
              {tournaments.length} ACTIVE BRACKETS
            </span>
            <span className="hidden md:inline text-slate-400 dark:text-slate-500">LIVE ARENA ENGINE</span>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <section className="bg-[#EFF4FF] dark:bg-[#0F131D] py-12 px-4 md:px-8 border-b border-slate-200 dark:border-[#242C3D] transition-colors">
        <div className="max-w-[1440px] mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] rounded text-[#E56A10] text-xs font-bold tracking-wider uppercase font-mono shadow-xs">
            <Trophy className="w-3.5 h-3.5" />
            OFFICIAL SANCTIONED COMPETITIONS
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-headline text-slate-900 dark:text-white uppercase tracking-tight">
            TOURNAMENT SCHEDULE &amp; PRIZE POOLS
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Discover upcoming competitive cups across certified esports disciplines. Register verified teams, compete with zero hidden fees, and battle under automated anti-cheat supervision.
          </p>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="bg-white/95 dark:bg-[#0F131D]/95 py-4 px-4 md:px-8 border-b border-slate-200 dark:border-[#242C3D] sticky top-16 z-20 backdrop-blur-md transition-colors">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Game Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedGame("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors whitespace-nowrap cursor-pointer border ${
                selectedGame === "all"
                  ? "bg-[#E56A10] text-white border-transparent shadow-xs"
                  : "bg-slate-100 dark:bg-[#161A24] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1E2538] border-slate-200 dark:border-[#242C3D]"
              }`}
            >
              All Disciplines
            </button>
            {games.map((g) => (
              <button
                key={g.slug}
                onClick={() => setSelectedGame(g.slug)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors whitespace-nowrap cursor-pointer border ${
                  selectedGame === g.slug
                    ? "bg-[#E56A10] text-white border-transparent shadow-xs"
                    : "bg-slate-100 dark:bg-[#161A24] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1E2538] border-slate-200 dark:border-[#242C3D]"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Fee Filter & Search Input */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-slate-100 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] rounded-lg p-1 text-xs font-mono">
              <button
                onClick={() => setSelectedFee("all")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedFee === "all" ? "bg-[#E56A10] text-white font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFee("free")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedFee === "free" ? "bg-[#E56A10] text-white font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setSelectedFee("paid")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedFee === "paid" ? "bg-[#E56A10] text-white font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50 dark:bg-[#161A24] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs rounded-lg border border-slate-300 dark:border-[#242C3D] focus:outline-none focus:border-[#E56A10] font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
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
                className="bg-white dark:bg-[#121622] rounded-xl border border-slate-200 dark:border-[#242C3D] h-96 animate-pulse p-4 space-y-4 shadow-xs"
              >
                <div className="w-full h-40 bg-slate-100 dark:bg-[#161A24] rounded-lg" />
                <div className="h-6 bg-slate-100 dark:bg-[#161A24] rounded w-3/4" />
                <div className="h-4 bg-slate-100 dark:bg-[#161A24] rounded w-full" />
                <div className="h-10 bg-slate-100 dark:bg-[#161A24] rounded mt-6" />
              </div>
            ))}
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#121622] rounded-xl border border-slate-200 dark:border-[#242C3D] p-8 space-y-4 shadow-xs">
            <Trophy className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-white">
              No Tournaments Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-mono">
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
                className="flex flex-col justify-between bg-white dark:bg-[#121622] rounded-xl border border-slate-200 dark:border-[#242C3D] hover:border-[#E56A10] dark:hover:border-[#E56A10] shadow-xs hover:shadow-md transition-all overflow-hidden group"
              >
                <div>
                  {/* Banner & Header */}
                  <div className="relative w-full h-44 overflow-hidden bg-slate-100 dark:bg-[#161A24]">
                    <TournamentBanner
                      src={tournament.bannerUrl}
                      alt={tournament.title}
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
                      <span className="text-slate-300">{tournament.registeredTeams} / {tournament.maxTeams} TEAMS</span>
                      <span className="text-[#E56A10] font-bold text-sm bg-black/60 px-2 py-0.5 rounded border border-[#E56A10]/40">{tournament.prizePool}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col gap-3">
                    <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-white group-hover:text-[#E56A10] transition-colors line-clamp-1">
                      {tournament.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {tournament.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 dark:border-[#242C3D] text-xs font-mono">
                      <div className="bg-slate-50 dark:bg-[#161A24] p-2.5 rounded-lg border border-slate-200 dark:border-[#242C3D]">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-bold">Schedule</span>
                        <span className="text-slate-900 dark:text-white font-bold block truncate mt-0.5">
                          {tournament.startsAt}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#161A24] p-2.5 rounded-lg border border-slate-200 dark:border-[#242C3D]">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-bold">Entry Fee</span>
                        <span className="text-[#E56A10] font-bold block mt-0.5">
                          {tournament.entryFee}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
                      <span>Server: <strong className="text-slate-800 dark:text-slate-200">{tournament.serverRegion}</strong></span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">{tournament.rankRequirement}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <Link
                    href={`/tournaments/${tournament.slug}`}
                    className="w-full py-2.5 bg-slate-900 dark:bg-[#1A2234] hover:bg-slate-800 dark:hover:bg-[#232D42] text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all font-mono shadow-xs border border-transparent dark:border-[#242C3D]"
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
