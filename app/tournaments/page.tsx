"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getTournaments, normalizeTournament, NormalizedTournament } from "@/lib/api/tournaments";
import { TOURNAMENTS_DATA } from "@/lib/data/tournaments";
import { GAMES_DATA } from "@/lib/data/games";
import {
  Trophy,
  Filter,
  Search,
  ArrowRight,
  Calendar,
  Clock,
  Server,
  Award,
  Flame,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function TournamentsDiscoveryPage() {
  const [tournaments, setTournaments] = useState<NormalizedTournament[]>(() =>
    TOURNAMENTS_DATA.map(normalizeTournament)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedFee, setSelectedFee] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTournaments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTournaments();
      if (data && data.length > 0) {
        setTournaments(data.map(normalizeTournament));
      }
    } catch (err: unknown) {
      console.warn("Backend /tournaments offline, using static cache", err);
      setTournaments(TOURNAMENTS_DATA.map(normalizeTournament));
      setError("Viewing cached tournament catalog.");
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
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.gameName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.serverRegion.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGame && matchesFee && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full">
      {/* Sub-Bar */}
      <div className="w-full bg-[#F1F3F5] py-2 px-4 md:px-8 border-b border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs font-mono text-[#64748B]">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#E56A10] transition-colors">
              HOME
            </Link>
            <span>/</span>
            <span className="text-[#0F172A] font-bold">TOURNAMENTS DISCOVERY</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-[#0F172A]">
              <span className="w-2 h-2 rounded-full bg-[#E56A10] animate-pulse" />
              {tournaments.length} ACTIVE BRACKETS
            </span>
            <span className="hidden md:inline text-[#64748B]">FASTAPI LIVE NODE</span>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <section className="bg-white py-12 px-4 md:px-8 border-b border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F3F5] rounded text-[#E56A10] text-xs font-bold tracking-wider uppercase font-mono">
            <Trophy className="w-3.5 h-3.5" />
            OFFICIAL SANCTIONED COMPETITIONS
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-headline text-[#0F172A] uppercase tracking-tight">
            TOURNAMENT SCHEDULE & ESCROW POOLS
          </h1>
          <p className="text-sm text-[#475569] max-w-2xl leading-relaxed">
            Discover upcoming cups across certified esports disciplines. Register verified rosters, secure your spot with zero hidden fees, and compete under hardware anti-cheat supervision.
          </p>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="bg-[#F8F9FA] py-4 px-4 md:px-8 border-b border-[#E2E8F0] sticky top-16 z-20 backdrop-blur-md bg-white/90">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Game Selector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedGame("all")}
              className={`px-3.5 py-1.5 rounded text-xs font-mono font-bold uppercase transition-colors whitespace-nowrap ${
                selectedGame === "all"
                  ? "bg-[#0F172A] text-white"
                  : "bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]"
              }`}
            >
              All Disciplines
            </button>
            {GAMES_DATA.map((g) => (
              <button
                key={g.slug}
                onClick={() => setSelectedGame(g.slug)}
                className={`px-3.5 py-1.5 rounded text-xs font-mono font-bold uppercase transition-colors whitespace-nowrap ${
                  selectedGame === g.slug
                    ? "bg-[#0F172A] text-white"
                    : "bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Fee Filter & Search Input */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-white border border-[#CBD5E1] rounded p-1 text-xs font-mono">
              <button
                onClick={() => setSelectedFee("all")}
                className={`px-2.5 py-0.5 rounded ${
                  selectedFee === "all" ? "bg-[#0F172A] text-white font-bold" : "text-[#64748B]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFee("free")}
                className={`px-2.5 py-0.5 rounded ${
                  selectedFee === "free" ? "bg-[#0F172A] text-white font-bold" : "text-[#64748B]"
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setSelectedFee("paid")}
                className={`px-2.5 py-0.5 rounded ${
                  selectedFee === "paid" ? "bg-[#0F172A] text-white font-bold" : "text-[#64748B]"
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
                placeholder="Search tournament title..."
                className="w-full pl-8 pr-3 py-1.5 bg-white text-[#0F172A] placeholder-[#94A3B8] text-xs rounded border border-[#CBD5E1] focus:outline-none focus:border-[#E56A10]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Offline notice */}
      {error && (
        <div className="w-full bg-[#FEF3C7] border-b border-[#F59E0B]/30 px-4 py-2 text-xs font-mono text-[#92400E] flex items-center justify-between max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchTournaments}
            className="flex items-center gap-1 font-bold underline hover:text-[#B45309]"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Tournament Cards Grid */}
      <section className="py-10 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#E2E8F0] h-96 animate-pulse p-4 space-y-4"
              >
                <div className="w-full h-40 bg-[#E2E8F0] rounded-lg" />
                <div className="h-6 bg-[#E2E8F0] rounded w-3/4" />
                <div className="h-4 bg-[#F1F3F5] rounded w-full" />
                <div className="h-10 bg-[#E2E8F0] rounded mt-6" />
              </div>
            ))}
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E2E8F0] p-8 space-y-4">
            <Trophy className="w-12 h-12 text-[#94A3B8] mx-auto" />
            <h3 className="text-lg font-bold font-headline text-[#0F172A]">
              No Tournaments Found
            </h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              No tournaments matched your filters. Try resetting the filters.
            </p>
            <button
              onClick={() => {
                setSelectedGame("all");
                setSelectedFee("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-[#0F172A] text-white rounded text-xs font-mono font-bold uppercase hover:bg-[#1E293B]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <article
                key={tournament.id}
                className="flex flex-col justify-between bg-white rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] shadow-xs hover:shadow-md transition-all overflow-hidden group"
              >
                <div>
                  {/* Banner & Header */}
                  <div className="relative w-full h-40 overflow-hidden bg-[#0B0E16]">
                    <Image
                      src={tournament.bannerUrl}
                      alt={tournament.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-white/95 text-[#0F172A] font-mono text-[10px] rounded font-bold uppercase">
                        {tournament.gameName}
                      </span>
                      <span className="px-2 py-0.5 bg-[#E56A10] text-white font-mono text-[10px] rounded font-bold">
                        {tournament.format}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          tournament.status === "LIVE"
                            ? "bg-emerald-500 text-white"
                            : "bg-[#0B0E16]/80 text-[#FFB68F] border border-[#E56A10]/40"
                        }`}
                      >
                        {tournament.statusLabel}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-mono">
                      <span>{tournament.registeredTeams} / {tournament.maxTeams} SQUADS</span>
                      <span className="text-[#FFB68F] font-bold">{tournament.prizePool}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col gap-3">
                    <h3 className="text-lg font-bold font-headline text-[#0F172A] group-hover:text-[#E56A10] transition-colors line-clamp-1">
                      {tournament.title}
                    </h3>
                    <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                      {tournament.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 py-2 border-y border-[#F1F3F5] text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-[#64748B] uppercase block">Schedule</span>
                        <span className="text-[#0F172A] font-medium block truncate mt-0.5">
                          {tournament.startsAt}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] uppercase block">Entry Fee</span>
                        <span className="text-[#E56A10] font-bold block mt-0.5">
                          {tournament.entryFee}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#64748B] font-mono flex items-center justify-between">
                      <span>Server: {tournament.serverRegion}</span>
                      <span>{tournament.rankRequirement}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <Link
                    href={`/tournaments/${tournament.slug}`}
                    className="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors font-mono"
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
