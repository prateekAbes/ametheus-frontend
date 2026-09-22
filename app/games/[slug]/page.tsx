"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getGameBySlug, normalizeGame, NormalizedGame } from "@/lib/api/games";
import { getMyTeams, Team } from "@/lib/api/teams";
import CreateTeamModal from "@/components/team/CreateTeamModal";
import JoinTeamModal from "@/components/team/JoinTeamModal";
import GamePaymentModal from "@/components/game/GamePaymentModal";
import {
  Shield,
  Users,
  UserPlus,
  Play,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wallet,
  Sparkles,
  CreditCard,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function DedicatedGameHubPage({ params }: Props) {
  const resolvedParams = use(params);
  const [game, setGame] = useState<NormalizedGame | null>(null);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTeamForPayment, setSelectedTeamForPayment] = useState<Team | null>(null);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number | null>(null);

  const fetchGameAndTeams = async () => {
    try {
      const gData = await getGameBySlug(resolvedParams.slug);
      if (gData) {
        setGame(normalizeGame(gData));
      }
      const teams = await getMyTeams(resolvedParams.slug);
      setMyTeams(teams);
    } catch {
      // not found handled below
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameAndTeams();
  }, [resolvedParams.slug]);

  if (!loading && !game) {
    notFound();
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-sm font-mono text-slate-500 animate-pulse">Loading Game Hub...</div>
      </div>
    );
  }

  const isSoloGame = !game.isTeamGame || game.maxTeamSize === 1 || game.slug === "chess";
  const userTeam = myTeams.length > 0 ? myTeams[0] : null;
  const isPaid = userTeam?.payment_status === "PAID";
  const isPending = userTeam?.payment_status === "PAYMENT_PENDING";
  const isRejected = userTeam?.payment_status === "PAYMENT_REJECTED";

  const handleOpenPayment = (team?: Team) => {
    setSelectedTeamForPayment(team || userTeam);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F8F9FF] dark:bg-[#0B0E16] text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      {/* 1. Breadcrumbs Trail */}
      <div className="w-full bg-[#F1F3F5] dark:bg-[#121622] py-2 px-4 md:px-8 border-b border-[#E2E8F0] dark:border-[#242C3D]">
        <div className="max-w-[1440px] mx-auto flex items-center gap-2 text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">
          <Link href="/" className="hover:text-[#E56A10] transition-colors">
            HOME
          </Link>
          <span>/</span>
          <Link href="/games" className="hover:text-[#E56A10] transition-colors">
            GAMES
          </Link>
          <span>/</span>
          <span className="text-[#0F172A] dark:text-white font-bold uppercase">
            {game.name}
          </span>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-8 w-full">
        {/* Coming Soon Announcement Banner */}
        {game.status === "COMING_SOON" && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-mono font-bold uppercase rounded">
                  COMING SOON
                </span>
                <span className="text-xs font-mono text-amber-500 font-bold">
                  ARENA PREVIEW
                </span>
              </div>
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                {game.announcementText || `${game.name} is launching soon on AMETHEUS Arena.`}
              </p>
              {game.expectedReleaseDate && (
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-mono">
                  Expected Launch: <strong className="text-[#0F172A] dark:text-white">{game.expectedReleaseDate}</strong>
                </p>
              )}
            </div>
            <span className="px-3 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold rounded">
              LOCKED
            </span>
          </div>
        )}

        {/* 2. Main Game Hero Header */}
        <section className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] shadow-sm">
          {game.heroMediaUrl && game.heroMediaEnabled && (
            <div className="absolute inset-0 overflow-hidden opacity-25 dark:opacity-35 pointer-events-none z-0">
              <img
                src={game.heroMediaUrl}
                alt={`${game.name} hero animation`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-[#121622] dark:via-[#121622]/85 dark:to-transparent" />
            </div>
          )}

          <div className="relative z-10 p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start gap-5 max-w-3xl">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-[#0B0E16] shrink-0 flex items-center justify-center shadow-md overflow-hidden">
                <Image
                  src={game.logoUrl}
                  alt={game.name}
                  width={112}
                  height={112}
                  unoptimized
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1.5 right-1.5 px-1.5 bg-[#E56A10] text-white font-mono text-[9px] font-bold rounded">
                  {isSoloGame ? "1v1" : `${game.minTeamSize}-${game.maxTeamSize}`}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E56A10]/10 text-[#E56A10] text-[10px] font-mono font-bold rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E56A10] animate-pulse" />
                    GAME TITLE
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F1F3F5] dark:bg-[#161A24] border dark:border-[#242C3D] text-[#0F172A] dark:text-slate-200 text-[10px] font-mono rounded">
                    <Shield className="w-3.5 h-3.5 text-[#E56A10]" />
                    {game.antiCheat}
                  </span>
                  <span className="px-2 py-0.5 bg-[#F1F3F5] dark:bg-[#161A24] border dark:border-[#242C3D] text-[#64748B] dark:text-[#94A3B8] text-[10px] font-mono rounded">
                    {game.serverRegion}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold font-headline text-[#0F172A] dark:text-white tracking-tight uppercase mt-1">
                  {game.name}
                </h1>

                <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] max-w-2xl leading-relaxed">
                  {game.description || "Compete in official competitive lobbies, form your roster, and play for verified match results."}
                </p>
              </div>
            </div>

            {/* Entry Fee & Format Highlights */}
            <div className="flex items-center gap-6 lg:border-l border-[#E2E8F0] dark:border-[#242C3D] lg:pl-8 shrink-0 w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase">Entry Fee</span>
                <span className="text-3xl font-bold font-headline text-[#E56A10] tabular-nums">
                  {game.entryFeeInr > 0 ? `₹${game.entryFeeInr}` : "FREE"}
                </span>
                <span className="text-[11px] text-emerald-600 font-mono">5% off with Wallet</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase">Roster Format</span>
                <span className="text-2xl font-bold font-headline text-slate-900 dark:text-white">
                  {isSoloGame ? "Solo (1v1)" : `${game.maxTeamSize} Players`}
                </span>
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                  {game.maxSubstitutes} Sub allowed
                </span>
              </div>
            </div>
          </div>

          {/* Technical Telemetry Strip */}
          <div className="bg-[#F8F9FA] dark:bg-[#161A24] px-6 py-3 border-t border-[#E2E8F0] dark:border-[#242C3D] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] font-mono block">Required Players</span>
              <span className="font-semibold text-[#0F172A] dark:text-white">
                {isSoloGame ? "1 Solo Athlete" : `${game.maxTeamSize} Athletes`}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] font-mono block">Substitutes</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {game.maxSubstitutes > 0 ? `${game.maxSubstitutes} Max` : "None"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] font-mono block">Match Protocol</span>
              <span className="font-semibold text-[#0F172A] dark:text-white">{game.matchProtocol}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] font-mono block">Active Squads</span>
              <span className="font-semibold text-[#0F172A] dark:text-white">{game.teamsCount} Registered</span>
            </div>
          </div>
        </section>

        {/* 3. CORE USER FLOW: GAME -> CREATE TEAM -> PAY -> PLAY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Action Hub */}
          <div className="lg:col-span-8 space-y-6">
            {/* Squad Status & Action Card */}
            <div className="bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#242C3D] pb-4">
                <div>
                  <h2 className="text-xl font-bold font-headline text-slate-900 dark:text-white uppercase">
                    {userTeam ? "Your Registered Squad" : isSoloGame ? "Solo Contender Status" : "Join the Arena"}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    {userTeam
                      ? `Squad details for ${game.name}`
                      : "Create your squad or join with an invite code to proceed to payment and play."}
                  </p>
                </div>
                {userTeam && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                      isPaid
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : isPending
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        : isRejected
                        ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                        : "bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    {isPaid
                      ? "✓ PAID & READY"
                      : isPending
                      ? "PAYMENT PENDING VERIFICATION"
                      : isRejected
                      ? "PAYMENT REJECTED"
                      : "UNPAID"}
                  </span>
                )}
              </div>

              {/* If User has a team */}
              {userTeam ? (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-50 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] rounded-xl flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-mono text-slate-500 uppercase">Team Name</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{userTeam.name}</span>
                        <span className="text-xs font-mono text-[#E56A10] bg-[#E56A10]/10 px-2 py-0.5 rounded">
                          [{userTeam.tag}]
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-500 mt-1">
                        Captain: <strong className="text-slate-800 dark:text-slate-200">@{userTeam.captain_username}</strong> • Invite Code:{" "}
                        <strong className="text-[#E56A10]">{userTeam.invite_code}</strong>
                      </div>
                    </div>

                    {/* Roster counts */}
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <div className="bg-white dark:bg-[#121622] px-3 py-2 rounded-lg border border-slate-200 dark:border-[#242C3D]">
                        <span className="text-slate-400 block text-[10px]">MAIN ROSTER</span>
                        <span className="text-slate-900 dark:text-white font-bold">
                          {userTeam.members?.length || 0} / {userTeam.max_members}
                        </span>
                      </div>
                      {userTeam.max_substitutes > 0 && (
                        <div className="bg-white dark:bg-[#121622] px-3 py-2 rounded-lg border border-slate-200 dark:border-[#242C3D]">
                          <span className="text-slate-400 block text-[10px]">SUBSTITUTES</span>
                          <span className="text-slate-900 dark:text-white font-bold">
                            {userTeam.substitutes?.length || 0} / {userTeam.max_substitutes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Roster Members list */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Active Roster Athletes:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {userTeam.members?.map((m, idx) => (
                        <div
                          key={m.id || idx}
                          className="p-3 bg-white dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] rounded-xl flex items-center justify-between text-xs font-mono"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {idx + 1}. @{m.username}
                            </span>
                            <span className="text-[11px] text-slate-500">Handle: {m.game_handle}</span>
                          </div>
                          {m.role === "CAPTAIN" && (
                            <span className="px-1.5 py-0.5 bg-[#E56A10]/15 text-[#E56A10] text-[9px] font-bold rounded">
                              CAPTAIN
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Primary Stage Gate Action: PAY or PLAY */}
                  <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#242C3D]">
                    {isPaid ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white">
                                Squad Verified &amp; Confirmed!
                              </div>
                              <p className="text-xs text-slate-500 font-mono">
                                Entry fee verified. You are authorized to launch the competitive match lobby.
                              </p>
                            </div>
                          </div>
                        </div>

                        {game.playUrl ? (
                          <a
                            href={game.playUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-sm uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                          >
                            <Play className="w-5 h-5 fill-current" />
                            <span>LAUNCH / PLAY {game.name} NOW</span>
                            <ExternalLink className="w-4 h-4 ml-1" />
                          </a>
                        ) : (
                          <div className="p-4 bg-slate-900 dark:bg-black text-white rounded-xl font-mono text-center space-y-2">
                            <div className="text-sm font-bold text-[#E56A10]">LOBBY READY TO PLAY</div>
                            <p className="text-xs text-slate-400">
                              Lobby credentials and server slot have been issued to team captain @{userTeam.captain_username}.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : isPending ? (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="w-6 h-6 text-amber-500 animate-pulse" />
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              Waiting for Payment Verification
                            </div>
                            <p className="text-xs text-slate-500 font-mono">
                              Admin is verifying your submitted UPI transaction ID. Refresh or check back shortly.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenPayment(userTeam)}
                          className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 border border-amber-500/40 rounded-lg text-xs font-mono font-bold cursor-pointer"
                        >
                          View Payment
                        </button>
                      </div>
                    ) : isRejected ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3">
                          <AlertTriangle className="w-6 h-6 text-rose-500" />
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">Payment Rejected</div>
                            <p className="text-xs text-slate-500 font-mono">
                              The submitted transaction ID could not be verified by platform administrators.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenPayment(userTeam)}
                          className="w-full py-3.5 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Pay Again to Unlock Play</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenPayment(userTeam)}
                        className="w-full py-4 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono font-bold text-sm uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <CreditCard className="w-5 h-5" />
                        <span>Pay Entry Fee (₹{game.entryFeeInr}) to Play</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* No Team Created Yet */
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-white uppercase">
                      No Registered Squad for {game.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
                      {isSoloGame
                        ? "Register as a solo contender, pay the entry fee, and compete."
                        : `Form your ${game.minTeamSize}-${game.maxTeamSize} athlete squad or join an existing roster using an invite code.`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="px-6 py-3 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Users className="w-4 h-4" />
                      <span>{isSoloGame ? "Register Solo Contender" : "Create Team"}</span>
                    </button>

                    {!isSoloGame && (
                      <button
                        onClick={() => setIsJoinModalOpen(true)}
                        className="px-6 py-3 bg-white dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] hover:border-[#E56A10] text-slate-900 dark:text-white font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Join Team with Code</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Media Gallery Lightbox */}
            {game.gallery && game.gallery.length > 0 && (
              <div className="bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold uppercase font-headline text-slate-900 dark:text-white">
                  <Layers className="w-4 h-4 text-[#E56A10]" />
                  Official Arena Gallery ({game.gallery.length})
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {game.gallery.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      onClick={() => setSelectedGalleryIndex(idx)}
                      className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-[#242C3D] cursor-pointer group bg-slate-900"
                    >
                      <img
                        src={item.url}
                        alt={item.caption || "Screenshot"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/75 p-1.5 text-[10px] text-white font-mono truncate">
                          {item.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Quick Rules & Game Highlights */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold font-headline text-slate-900 dark:text-white uppercase flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#E56A10]" />
                Tournament Rules &amp; Protocol
              </h3>

              <div className="space-y-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                <div className="p-3 bg-slate-50 dark:bg-[#161A24] rounded-xl border border-slate-200 dark:border-[#242C3D]">
                  <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Platform Anti-Cheat</span>
                  Strict {game.antiCheat} monitoring active across all match servers.
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#161A24] rounded-xl border border-slate-200 dark:border-[#242C3D]">
                  <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Payment Guarantee</span>
                  Manual admin verification ensures complete payment authenticity before lobby access.
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#161A24] rounded-xl border border-slate-200 dark:border-[#242C3D]">
                  <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Direct Gameplay</span>
                  No complicated tournament brackets or event waiting lines. Form team, pay, play immediately.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        gameSlug={game.slug}
        gameName={game.name}
        onTeamCreated={(team) => {
          setIsCreateModalOpen(false);
          fetchGameAndTeams();
          // Directly open payment after team creation
          if (game.entryFeeInr > 0) {
            handleOpenPayment(team as any);
          }
        }}
      />

      <JoinTeamModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        gameSlug={game.slug}
        gameName={game.name}
        onTeamJoined={() => {
          setIsJoinModalOpen(false);
          fetchGameAndTeams();
        }}
      />

      {isPaymentModalOpen && (
        <GamePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            fetchGameAndTeams();
          }}
          gameSlug={game.slug}
          gameName={game.name}
          entryFeeInr={game.entryFeeInr}
          teamId={selectedTeamForPayment?.id}
          teamName={selectedTeamForPayment?.name}
          onPaymentSuccess={() => {
            fetchGameAndTeams();
          }}
        />
      )}
    </div>
  );
}
