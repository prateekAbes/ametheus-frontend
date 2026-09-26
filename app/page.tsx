"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Users, Shield, ArrowRight, Flame, CheckCircle, Gamepad2 } from "lucide-react";
import { getTournaments, normalizeTournament, NormalizedTournament } from "@/lib/api/tournaments";
import { getGames, normalizeGame, NormalizedGame } from "@/lib/api/games";

export default function HomePage() {
  const [tournaments, setTournaments] = useState<NormalizedTournament[]>([]);
  const [games, setGames] = useState<NormalizedGame[]>([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);
  const [isLoadingGames, setIsLoadingGames] = useState(true);

  useEffect(() => {
    getTournaments()
      .then((data) => {
        if (Array.isArray(data)) {
          setTournaments(data.map(normalizeTournament));
        } else {
          setTournaments([]);
        }
      })
      .catch(() => setTournaments([]))
      .finally(() => setIsLoadingTournaments(false));

    getGames()
      .then((data) => {
        if (Array.isArray(data)) {
          setGames(data.map(normalizeGame));
        } else {
          setGames([]);
        }
      })
      .catch(() => setGames([]))
      .finally(() => setIsLoadingGames(false));
  }, []);

  const featuredTournaments = tournaments.slice(0, 3);
  const featuredGames = games.slice(0, 6);

  const totalPrizePool = tournaments.reduce((acc, t) => acc + (t.prizePoolNum || 0), 0);
  const prizePoolDisplay = totalPrizePool > 0 ? `₹${totalPrizePool.toLocaleString()}+` : "₹0+";

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-[#0B0E16] text-[#F8FAFC] border-b border-[#242C3D] py-20 md:py-28 px-4 md:px-8">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-[1440px] mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161A24] border border-[#242C3D] rounded mb-6 text-[#E56A10] text-xs font-bold tracking-widest font-mono">
            <Flame className="w-4 h-4 text-[#E56A10]" />
            TIER-1 TOURNAMENT PLATFORM
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight font-headline max-w-4xl text-white">
            ENTER THE <span className="text-[#E56A10]">COMPETITION.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#94A3B8] max-w-2xl leading-relaxed">
            The next-generation competitive esports engine. Form your roster, claim your tournament slot, play verified matches, and compete for verified prize pools.
          </p>

          {/* Primary Operations CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/tournaments"
              className="px-6 py-3 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-sm rounded uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
            >
              Browse Tournaments
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/games"
              className="px-6 py-3 bg-[#161A24] hover:bg-[#202634] text-[#F8FAFC] border border-[#242C3D] hover:border-[#E56A10] font-bold text-sm rounded uppercase tracking-wider transition-all"
            >
              Select Game Hub
            </Link>
          </div>

          {/* Live Telemetry Bar */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl pt-8 border-t border-[#242C3D]/60">
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-headline text-white tabular-nums">
                {prizePoolDisplay}
              </div>
              <div className="text-xs text-[#94A3B8] font-mono uppercase mt-1">
                Active Prize Pool
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-headline text-[#E56A10] tabular-nums">
                {games.length}
              </div>
              <div className="text-xs text-[#94A3B8] font-mono uppercase mt-1">
                Esports Disciplines
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-headline text-white tabular-nums">
                ₹0
              </div>
              <div className="text-xs text-[#94A3B8] font-mono uppercase mt-1">
                Team Join Cost
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-headline text-[#10B981] tabular-nums">
                100%
              </div>
              <div className="text-xs text-[#94A3B8] font-mono uppercase mt-1">
                Admin Verified Matches
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Tournaments (Daylight Canvas) */}
      <section className="py-16 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#E56A10] uppercase font-mono mb-1">
              Active Competitions
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-headline text-[#0F172A] dark:text-white">
              Featured Tournaments
            </h2>
          </div>
          <Link
            href="/tournaments"
            className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-slate-300 hover:text-[#E56A10] dark:hover:text-[#E56A10] flex items-center gap-1.5 transition-colors"
          >
            View all tournaments
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {featuredTournaments.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#121622] rounded-lg border border-dashed border-[#E2E8F0] dark:border-[#242C3D] text-[#64748B] dark:text-slate-400 font-mono text-xs">
            {isLoadingTournaments ? "Loading featured tournaments from database..." : "No active tournaments currently scheduled."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTournaments.map((t) => {
              const registered = t.registeredTeams || 0;
              const max = t.maxTeams || 16;
              const percent = max > 0 ? Math.min(100, Math.round((registered / max) * 100)) : 0;
              return (
                <div
                  key={t.id}
                  className="bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] hover:border-[#CBD5E1] dark:hover:border-[#E56A10] rounded-lg p-6 flex flex-col justify-between transition-all hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="px-2 py-0.5 text-[10px] rounded font-mono font-bold bg-[#E56A10] text-white">
                        {t.statusLabel || t.status}
                      </span>
                      <span className="text-xs text-[#64748B] dark:text-slate-400 font-mono">
                        {t.startsAt}
                      </span>
                    </div>

                    <h3 className="font-headline font-bold text-lg text-[#0F172A] dark:text-white leading-snug mb-2">
                      {t.title}
                    </h3>

                    <p className="text-xs text-[#64748B] dark:text-slate-400 font-mono mb-6">
                      {t.gameName}
                    </p>

                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#F1F3F5] dark:border-[#242C3D] mb-6">
                      <div>
                        <span className="text-[10px] text-[#64748B] dark:text-slate-400 uppercase font-mono block">
                          Prize Pool
                        </span>
                        <span className="text-lg font-bold font-headline text-[#E56A10] tabular-nums">
                          {t.prizePool}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] dark:text-slate-400 uppercase font-mono block">
                          Entry Fee
                        </span>
                        <span className="text-lg font-bold font-headline text-[#0F172A] dark:text-white tabular-nums">
                          {t.entryFee}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400 mb-4">
                      <span>Registered Slots:</span>
                      <span className="font-bold text-[#0F172A] dark:text-white font-mono">
                        {registered} / {max} Teams
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-[#F1F3F5] dark:bg-[#161A24] rounded-full overflow-hidden mb-6">
                      <div
                        className="h-full bg-[#E56A10] rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/tournaments/${t.slug || t.id}`}
                    className="w-full py-2.5 bg-[#0F172A] dark:bg-[#E56A10] hover:bg-[#1E293B] dark:hover:bg-[#C95B0A] text-white text-xs font-bold uppercase tracking-wider rounded text-center transition-colors block"
                  >
                    View Tournament Details
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Games Directory Preview (Contextual Game Hub Entry) */}
      <section className="bg-[#F1F3F5] dark:bg-[#0B0E16]/80 py-16 px-4 md:px-8 border-y border-[#E2E8F0] dark:border-[#242C3D]">
        <div className="max-w-[1440px] mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-xs font-bold tracking-widest text-[#E56A10] uppercase font-mono mb-1">
                Contextual Competition
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-headline text-[#0F172A] dark:text-white">
                Disciplines & Dedicated Game Hubs
              </h2>
              <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1 max-w-xl">
                Teams are formed directly inside each game hub. Select your title to create a team, generate your 6-character code, or register.
              </p>
            </div>
            <Link
              href="/games"
              className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-slate-300 hover:text-[#E56A10] dark:hover:text-[#E56A10] flex items-center gap-1.5 transition-colors"
            >
              Explore all {games.length > 0 ? games.length : ""} games
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {featuredGames.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#121622] rounded-lg border border-dashed border-[#E2E8F0] dark:border-[#242C3D] text-[#64748B] dark:text-slate-400 font-mono text-xs">
              {isLoadingGames ? "Loading game hubs from database..." : "No active game hubs found."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGames.map((g) => {
                const activeTournCount = tournaments.filter((t) => t.gameSlug === g.slug).length;
                return (
                  <div
                    key={g.slug}
                    className="bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] hover:border-[#E56A10] dark:hover:border-[#E56A10] rounded-lg p-6 flex flex-col justify-between transition-all group hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-0.5 bg-[#F1F3F5] dark:bg-[#161A24] text-[#475569] dark:text-slate-300 font-mono text-[10px] font-bold rounded">
                          {g.tag || g.platform}
                        </span>
                        <span className="text-xs text-[#10B981] font-mono font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                          {activeTournCount} Active
                        </span>
                      </div>

                      <h3 className="text-xl font-bold font-headline text-[#0F172A] dark:text-white group-hover:text-[#E56A10] transition-colors mb-1">
                        {g.name}
                      </h3>
                      <div className="text-xs text-[#64748B] dark:text-slate-400 font-mono mb-6">
                        Active Tournaments: <span className="font-bold text-[#0F172A] dark:text-slate-200">{activeTournCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-[#F1F3F5] dark:border-[#242C3D]">
                      <Link
                        href={`/games/${g.slug}`}
                        className="flex-1 py-2 bg-[#F8F9FA] dark:bg-[#161A24] hover:bg-[#E56A10] hover:text-white dark:hover:bg-[#E56A10] text-[#0F172A] dark:text-slate-200 text-xs font-bold uppercase tracking-wider rounded text-center transition-colors border border-[#E2E8F0] dark:border-[#242C3D]"
                      >
                        Enter Hub
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. How AMETHEUS Works */}
      <section className="py-20 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-bold tracking-widest text-[#E56A10] uppercase font-mono mb-2">
            The Competitive Pipeline
          </div>
          <h2 className="text-3xl font-bold font-headline text-[#0F172A] dark:text-white">
            How AMETHEUS Works
          </h2>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-2">
            From team creation to automated bracket advancement and verified prize payouts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] p-6 rounded-lg flex flex-col">
            <div className="w-10 h-10 rounded bg-[#0B0E16] dark:bg-[#161A24] text-[#E56A10] flex items-center justify-center font-bold font-mono mb-4 text-sm border border-transparent dark:border-[#242C3D]">
              01
            </div>
            <h3 className="font-headline font-bold text-base text-[#0F172A] dark:text-white mb-2">
              Select Game & Form Team
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
              Navigate to your game hub. Create your team to become Captain and receive an instant 6-character code (e.g. <code className="font-mono font-bold text-[#0F172A] dark:text-[#E56A10]">SR7X4K</code>). Teammates join for ₹0.
            </p>
          </div>

          <div className="bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] p-6 rounded-lg flex flex-col">
            <div className="w-10 h-10 rounded bg-[#0B0E16] dark:bg-[#161A24] text-[#E56A10] flex items-center justify-center font-bold font-mono mb-4 text-sm border border-transparent dark:border-[#242C3D]">
              02
            </div>
            <h3 className="font-headline font-bold text-base text-[#0F172A] dark:text-white mb-2">
              Register Tournament
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
              Choose an active tournament. Verify your team eligibility, accept rules, and complete registration with secure platform tournament entry checkout (₹50–₹60).
            </p>
          </div>

          <div className="bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] p-6 rounded-lg flex flex-col">
            <div className="w-10 h-10 rounded bg-[#0B0E16] dark:bg-[#161A24] text-[#E56A10] flex items-center justify-center font-bold font-mono mb-4 text-sm border border-transparent dark:border-[#242C3D]">
              03
            </div>
            <h3 className="font-headline font-bold text-base text-[#0F172A] dark:text-white mb-2">
              Check-In & Play Match
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
              Check in 30 minutes before match time. Access lobby credentials, play your match, and submit end-screen evidence for admin score verification.
            </p>
          </div>

          <div className="bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] p-6 rounded-lg flex flex-col">
            <div className="w-10 h-10 rounded bg-[#0B0E16] dark:bg-[#161A24] text-[#E56A10] flex items-center justify-center font-bold font-mono mb-4 text-sm border border-transparent dark:border-[#242C3D]">
              04
            </div>
            <h3 className="font-headline font-bold text-base text-[#0F172A] dark:text-white mb-2">
              Advance & Win Prizes
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
              Single-elimination engine auto-advances verified winners round-by-round. Earn points, rank on the global leaderboard, and claim verified cash payouts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
