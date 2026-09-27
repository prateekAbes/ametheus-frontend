"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Users, Shield, ArrowRight, Flame, CheckCircle, Gamepad2, Sparkles, Layers } from "lucide-react";
import { getTournaments, normalizeTournament, NormalizedTournament, getTournamentsSummary, TournamentsSummary } from "@/lib/api/tournaments";
import { getGames, normalizeGame, NormalizedGame } from "@/lib/api/games";

const HERO_GIF_URL = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z0ZWFmNnN2cWJxeHoxbjlyM3cydXBnNDB1NnY2d2hkYWFxdG00MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPnAiaMCws8nOsE/giphy.gif";
const HERO_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80";

export default function HomePage() {
  const [tournaments, setTournaments] = useState<NormalizedTournament[]>([]);
  const [games, setGames] = useState<NormalizedGame[]>([]);
  const [tournamentsSummary, setTournamentsSummary] = useState<TournamentsSummary | null>(null);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isGifError, setIsGifError] = useState(false);

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

    getTournamentsSummary()
      .then((sum) => setTournamentsSummary(sum))
      .catch(() => setTournamentsSummary(null));

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

  // Scope: calculate strictly from active, upcoming, published tournaments in the database
  const activeUpcomingTournaments = tournaments.filter((t) => {
    const s = (t.status || "").toUpperCase();
    return !["DELETED", "CANCELLED", "HIDDEN", "DRAFT"].includes(s);
  });

  const calculatedPrizePool = activeUpcomingTournaments.reduce((acc, t) => acc + (t.prizePoolNum || 0), 0);
  const finalPrizePoolInr = tournamentsSummary?.total_prize_pool_inr !== undefined
    ? tournamentsSummary.total_prize_pool_inr
    : calculatedPrizePool;
  const prizePoolDisplay = `₹${finalPrizePoolInr.toLocaleString("en-IN")}`;

  const upcomingTournamentsCount = tournamentsSummary?.active_tournaments_count !== undefined
    ? tournamentsSummary.active_tournaments_count
    : activeUpcomingTournaments.length;

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Section — Composite Visual with Blended Animated Texture & Typography */}
      <section className="relative overflow-hidden bg-[#0B0E16] text-[#F8FAFC] border-b border-[#242C3D] py-20 md:py-28 px-4 md:px-8 flex flex-col items-center justify-center min-h-[580px] md:min-h-[640px]">
        {/* Layer 1: Subtle grid backdrop */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Layer 2: Ambient Background Typography (Subtle, Oversized, Non-interactive) */}
        <div 
          aria-hidden="true" 
          className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden z-0"
        >
          <span className="font-headline font-black text-[18vw] sm:text-[15vw] tracking-tighter text-white/[0.025] uppercase whitespace-nowrap leading-none transform -translate-y-6">
            AMETHEUS
          </span>
        </div>

        {/* Layer 3: Integrated Animated Visual Texture (Blended Behind Typography) */}
        <div 
          aria-hidden="true" 
          className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_45%,#000_25%,transparent_100%)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isGifError ? HERO_FALLBACK_IMAGE : HERO_GIF_URL}
            alt=""
            onError={() => setIsGifError(true)}
            className="w-full max-w-5xl h-full object-cover object-center opacity-35 sm:opacity-40 md:opacity-45 mix-blend-screen scale-110 filter saturate-150 contrast-125 transition-opacity duration-1000"
          />
          {/* Soft atmospheric gradient fades to blend seamlessly into surrounding #0B0E16 */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E16] via-transparent to-[#0B0E16]/80 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E16] via-transparent to-[#0B0E16] pointer-events-none" />
          <div className="absolute inset-0 bg-[#0B0E16]/40 pointer-events-none" />
        </div>

        {/* Layer 4: Main Foreground Content & Typography */}
        <div className="max-w-[1440px] mx-auto flex flex-col items-center text-center relative z-10 w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161A24]/90 backdrop-blur-md border border-[#242C3D] rounded mb-6 text-[#E56A10] text-xs font-bold tracking-widest font-mono shadow-sm">
            <Flame className="w-4 h-4 text-[#E56A10]" />
            TIER-1 TOURNAMENT PLATFORM
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight font-headline max-w-4xl text-white drop-shadow-md">
            ENTER THE <span className="text-[#E56A10] drop-shadow-[0_0_25px_rgba(229,106,16,0.35)]">COMPETITION.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#CBD5E1] max-w-2xl leading-relaxed drop-shadow-xs">
            The next-generation competitive esports engine. Form your roster, claim your tournament slot, play verified matches, and compete for verified prize pools.
          </p>

          {/* Primary Operations CTAs: Prominent "Select Game", "Competitive Pipeline" */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/games"
              className="px-8 py-3.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-sm rounded-lg uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-lg shadow-[#E56A10]/20 hover:shadow-[#E56A10]/40 cursor-pointer"
            >
              <Gamepad2 className="w-5 h-5" />
              <span>Select Game</span>
            </Link>

            <a
              href="#pipeline"
              className="px-6 py-3.5 bg-[#161A24]/90 backdrop-blur-md hover:bg-[#202634] text-[#F8FAFC] border border-[#242C3D] hover:border-[#E56A10] font-bold text-sm rounded-lg uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#E56A10]" />
              <span>Competitive Pipeline</span>
            </a>
          </div>

          {/* Live Telemetry Bar */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl pt-8 border-t border-[#242C3D]/80 bg-[#0B0E16]/60 backdrop-blur-xs rounded-xl p-4">
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
                {upcomingTournamentsCount}
              </div>
              <div className="text-xs text-[#94A3B8] font-mono uppercase mt-1">
                Upcoming Tournaments
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

      {/* 2. THE COMPETITIVE PIPELINE (Position 2 - Prominently Styled) */}
      <section id="pipeline" className="relative overflow-hidden py-20 px-4 md:px-8 max-w-[1440px] mx-auto w-full border-b border-slate-200 dark:border-[#242C3D]">
        {/* Ambient background typography */}
        <div aria-hidden="true" className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none select-none z-0 overflow-hidden">
          <span className="font-headline font-black text-[14vw] sm:text-[11vw] tracking-tighter text-slate-900/[0.02] dark:text-white/[0.02] uppercase whitespace-nowrap leading-none">
            PIPELINE
          </span>
        </div>

        <div className="relative z-10 text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-[#1C2030] text-[#E56A10] border border-amber-200 dark:border-[#E56A10]/30 rounded-full font-mono text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            The Competitive Pipeline
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-headline text-[#0F172A] dark:text-white">
            How AMETHEUS Works
          </h2>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-2">
            The 4-stage pipeline from roster formation to automated bracket progression and verified escrow prize payouts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#121622] border-2 border-slate-200 dark:border-[#242C3D] hover:border-[#E56A10] dark:hover:border-[#E56A10] p-6 rounded-xl flex flex-col justify-between transition-all hover:shadow-lg group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#161A24] text-[#E56A10] flex items-center justify-center font-extrabold font-mono mb-4 text-base border border-slate-200 dark:border-[#242C3D] group-hover:bg-[#E56A10] group-hover:text-white transition-colors">
                01
              </div>
              <h3 className="font-headline font-bold text-lg text-[#0F172A] dark:text-white mb-2">
                Select Game & Form Team
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                Navigate to your game hub. Create your team to become Captain and receive an instant 6-character code (e.g. <code className="font-mono font-bold text-[#0F172A] dark:text-[#E56A10]">SR7X4K</code>). Teammates join for ₹0.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E2538]">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                Instant Roster Sync
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121622] border-2 border-slate-200 dark:border-[#242C3D] hover:border-[#E56A10] dark:hover:border-[#E56A10] p-6 rounded-xl flex flex-col justify-between transition-all hover:shadow-lg group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#161A24] text-[#E56A10] flex items-center justify-center font-extrabold font-mono mb-4 text-base border border-slate-200 dark:border-[#242C3D] group-hover:bg-[#E56A10] group-hover:text-white transition-colors">
                02
              </div>
              <h3 className="font-headline font-bold text-lg text-[#0F172A] dark:text-white mb-2">
                Register Tournament
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                Choose an active tournament. Verify your team eligibility, accept rules, and complete registration with secure platform tournament entry checkout (₹50–₹60).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E2538]">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                Escrow Protected Entry
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121622] border-2 border-slate-200 dark:border-[#242C3D] hover:border-[#E56A10] dark:hover:border-[#E56A10] p-6 rounded-xl flex flex-col justify-between transition-all hover:shadow-lg group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#161A24] text-[#E56A10] flex items-center justify-center font-extrabold font-mono mb-4 text-base border border-slate-200 dark:border-[#242C3D] group-hover:bg-[#E56A10] group-hover:text-white transition-colors">
                03
              </div>
              <h3 className="font-headline font-bold text-lg text-[#0F172A] dark:text-white mb-2">
                Check-In & Play Match
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                Check in before match time. Access lobby credentials, play your match, and submit end-screen evidence for verified score entry.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E2538]">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                Protected Credentials
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121622] border-2 border-slate-200 dark:border-[#242C3D] hover:border-[#E56A10] dark:hover:border-[#E56A10] p-6 rounded-xl flex flex-col justify-between transition-all hover:shadow-lg group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#161A24] text-[#E56A10] flex items-center justify-center font-extrabold font-mono mb-4 text-base border border-slate-200 dark:border-[#242C3D] group-hover:bg-[#E56A10] group-hover:text-white transition-colors">
                04
              </div>
              <h3 className="font-headline font-bold text-lg text-[#0F172A] dark:text-white mb-2">
                Advance & Win Prizes
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                Dynamic tournament engine auto-advances verified winners round-by-round. Earn points, rank on the global leaderboard, and claim verified cash payouts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E2538]">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                Automated Advancement
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED TOURNAMENTS (Position 3) */}
      <section className="py-16 px-4 md:px-8 max-w-[1440px] mx-auto w-full border-b border-slate-200 dark:border-[#242C3D]">
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
                      {t.hasLiveMatches ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] rounded font-mono font-bold bg-rose-600 text-white animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          MATCHES LIVE
                        </span>
                      ) : t.status === "REGISTRATION_OPEN" ? (
                        <span className="px-2 py-0.5 text-[10px] rounded font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                          REGISTRATION OPEN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] rounded font-mono font-bold bg-slate-100 dark:bg-[#161A24] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-[#242C3D]">
                          REGISTRATION CLOSED
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-slate-500 font-bold uppercase">
                        {t.gameName || t.gameSlug}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold font-headline text-[#0F172A] dark:text-white mb-3">
                      {t.title}
                    </h3>

                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 dark:border-[#1E2538] text-xs font-mono mb-4">
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase">Prize Pool</div>
                        <div className="font-bold text-[#E56A10] text-sm tabular-nums">
                          {t.prizePool}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase">Entry Fee</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm tabular-nums">
                          {t.entryFee}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>Slots Filled</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {registered} / {max}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-[#1E2538] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#E56A10] h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/tournaments/${t.slug}`}
                      className="w-full block py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-[#E56A10] dark:hover:bg-[#E56A10] dark:hover:text-white text-xs font-mono font-bold uppercase tracking-wider rounded-lg text-center transition-colors"
                    >
                      Enter Tournament
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. FEATURED GAMES (Position 4) */}
      <section className="py-16 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-xs font-bold tracking-widest text-[#E56A10] uppercase font-mono mb-1">
                Active Disciplines
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-headline text-[#0F172A] dark:text-white">
                Esports Disciplines & Game Hubs
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 max-w-xl">
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
    </div>
  );
}
