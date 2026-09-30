"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getGameBySlug, normalizeGame, NormalizedGame } from "@/lib/api/games";
import { getMyTeams, kickTeamMember, leaveTeam, disbandTeam, Team } from "@/lib/api/teams";
import { useAuthContext } from "@/components/providers/AuthProvider";
import CreateTeamModal from "@/components/team/CreateTeamModal";
import JoinTeamModal from "@/components/team/JoinTeamModal";
import {
  Shield,
  Users,
  UserPlus,
  Play,
  CheckCircle,
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  Trash2,
  UserMinus,
  Loader2,
  Trophy,
  Clock,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function DedicatedGameHubPage({ params }: Props) {
  const resolvedParams = use(params);
  const { profile: userProfile } = useAuthContext();
  const [game, setGame] = useState<NormalizedGame | null>(null);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

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

  const isCaptain =
    userTeam &&
    userProfile &&
    (userTeam.captain_id === userProfile.id ||
      userTeam.captain_username === userProfile.username);

  const rosterCount = userTeam?.members?.length || 0;
  const maxTeamCapacity = game.maxTeamSize || 5;

  const handleCopyCode = () => {
    if (userTeam?.invite_code) {
      navigator.clipboard.writeText(userTeam.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleKickMember = async (teamId: string, memberUserId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove @${username} from the team roster?`)) return;
    setActionLoading(`kick-${memberUserId}`);
    setActionError(null);
    try {
      await kickTeamMember(teamId, memberUserId);
      await fetchGameAndTeams();
    } catch (err: any) {
      setActionError(err?.message || `Failed to remove @${username}.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to leave this team? You will need an invite code to rejoin.")) return;
    setActionLoading("leave");
    setActionError(null);
    try {
      await leaveTeam(teamId);
      await fetchGameAndTeams();
    } catch (err: any) {
      setActionError(err?.message || "Failed to leave the team.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisbandTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to disband this team? All members will be removed. This cannot be undone.")) return;
    setActionLoading("disband");
    setActionError(null);
    try {
      await disbandTeam(teamId);
      await fetchGameAndTeams();
    } catch (err: any) {
      setActionError(err?.message || "Failed to disband the team.");
    } finally {
      setActionLoading(null);
    }
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
                  {isSoloGame ? "Solo (1v1)" : `${game.minTeamSize}-${game.maxTeamSize}`}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E56A10]/10 text-[#E56A10] text-[10px] font-mono font-bold rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E56A10] animate-pulse" />
                    DISCIPLINE
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
                  {game.description || "Manage your competitive roster, form official teams, and enter sanctioned tournaments."}
                </p>
              </div>
            </div>

            {/* Roster Format & Mode Highlights (No Entry Fee) */}
            <div className="flex items-center gap-6 lg:border-l border-[#E2E8F0] dark:border-[#242C3D] lg:pl-8 shrink-0 w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase">Max Team Size</span>
                <span className="text-2xl font-bold font-headline text-slate-900 dark:text-white">
                  {isSoloGame ? "Solo (1v1)" : `${game.maxTeamSize} Players`}
                </span>
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                  {game.maxSubstitutes > 0 ? `${game.maxSubstitutes} Sub allowed` : "No substitutes"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase">Competition</span>
                <span className="text-2xl font-bold font-headline text-[#E56A10]">
                  TOURNAMENTS
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Sanctioned Arenas</span>
              </div>
            </div>
          </div>

          {/* Technical Telemetry Strip */}
          <div className="bg-[#F8F9FA] dark:bg-[#161A24] px-6 py-3 border-t border-[#E2E8F0] dark:border-[#242C3D] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] font-mono block">Required Players</span>
              <span className="font-semibold text-[#0F172A] dark:text-white">
                {isSoloGame ? "1 Solo Athlete" : `${game.minTeamSize} Min / ${game.maxTeamSize} Max`}
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
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] font-mono block">Active Teams</span>
              <span className="font-semibold text-[#0F172A] dark:text-white">{game.teamsCount || 0} Registered</span>
            </div>
          </div>
        </section>

        {/* 3. CORE USER FLOW: TEAM MANAGEMENT ON GAME PAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Action Hub */}
          <div className="lg:col-span-8 space-y-6">
            {/* Team Status & Management Card */}
            <div className="bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E8F0] dark:border-[#242C3D] pb-4 gap-2">
                <div>
                  <h2 className="text-xl font-bold font-headline text-slate-900 dark:text-white uppercase">
                    {userTeam ? "Your Official Team Roster" : isSoloGame ? "Solo Contender Profile" : "Team Roster Management"}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    {userTeam
                      ? `Active team for ${game.name}. Manage teammates and check tournament readiness.`
                      : isSoloGame
                      ? `Register your solo athlete profile for ${game.name} competitions.`
                      : `Create or join a team for ${game.name}. Your team will be used to register for tournaments.`}
                  </p>
                </div>
                {userTeam && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border self-start sm:self-auto bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  >
                    ✓ ACTIVE ROSTER ({rosterCount}/{maxTeamCapacity})
                  </span>
                )}
              </div>

              {actionError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Loading Skeleton */}
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-20 bg-slate-100 dark:bg-[#161A24] rounded-xl" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="h-16 bg-slate-100 dark:bg-[#161A24] rounded-xl" />
                    <div className="h-16 bg-slate-100 dark:bg-[#161A24] rounded-xl" />
                  </div>
                </div>
              ) : userTeam ? (
                /* User Team Exists */
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
                      <div className="text-xs font-mono text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>
                          Captain: <strong className="text-slate-800 dark:text-slate-200">@{userTeam.captain_username}</strong>
                          {isCaptain && <span className="ml-1 text-[10px] text-[#E56A10] font-bold">(You)</span>}
                        </span>
                        <span>•</span>
                        <span>
                          Invite Code: <strong className="text-[#E56A10] font-bold tracking-wider">{userTeam.invite_code}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Roster counts & Code Copy */}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                      <div className="bg-white dark:bg-[#121622] px-3 py-2 rounded-lg border border-slate-200 dark:border-[#242C3D]">
                        <span className="text-slate-400 block text-[10px]">MAIN ROSTER</span>
                        <span className="text-slate-900 dark:text-white font-bold">
                          {userTeam.members?.length || 0} / {userTeam.max_members || game.maxTeamSize}
                        </span>
                      </div>
                      {game.maxSubstitutes > 0 && (
                        <div className="bg-white dark:bg-[#121622] px-3 py-2 rounded-lg border border-slate-200 dark:border-[#242C3D]">
                          <span className="text-slate-400 block text-[10px]">SUBSTITUTES</span>
                          <span className="text-slate-900 dark:text-white font-bold">
                            {userTeam.substitutes?.length || 0} / {game.maxSubstitutes}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={handleCopyCode}
                        className="px-3.5 py-2 bg-white dark:bg-[#121622] hover:bg-slate-100 dark:hover:bg-[#1e2538] border border-slate-200 dark:border-[#242C3D] text-slate-800 dark:text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Copy Team Code to share"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#E56A10]" />}
                        <span className="font-bold">{copiedCode ? "Copied!" : "Copy Code"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Roster Members list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                      <span>Main Roster Athletes ({userTeam.members?.length || 0} / {userTeam.max_members || game.maxTeamSize}):</span>
                      <span className="text-[11px] text-slate-400 font-normal">Min required for tournament: {game.minTeamSize}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {userTeam.members?.map((m, idx) => {
                        const isThisMemberCaptain = m.role === "CAPTAIN" || m.user_id === userTeam.captain_id;
                        const isThisUser = userProfile && m.user_id === userProfile.id;
                        const canCaptainKick = isCaptain && !isThisMemberCaptain && !isThisUser;

                        return (
                          <div
                            key={m.id || m.user_id || idx}
                            className="p-3 bg-white dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] rounded-xl flex items-center justify-between text-xs font-mono"
                          >
                            <div className="truncate mr-2">
                              <span className="font-bold text-slate-900 dark:text-white block truncate">
                                {idx + 1}. @{m.username} {isThisUser && <span className="text-[#E56A10]">(You)</span>}
                              </span>
                              <span className="text-[11px] text-slate-500 truncate block">Handle: {m.game_handle}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isThisMemberCaptain ? (
                                <span className="px-1.5 py-0.5 bg-[#E56A10]/15 text-[#E56A10] text-[9px] font-bold rounded">
                                  CAPTAIN
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold rounded">
                                  MEMBER
                                </span>
                              )}
                              {canCaptainKick && (
                                <button
                                  onClick={() => handleKickMember(userTeam.id, m.user_id, m.username)}
                                  disabled={actionLoading === `kick-${m.user_id}`}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                                  title="Remove member from roster"
                                >
                                  {actionLoading === `kick-${m.user_id}` ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <UserMinus className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Substitutes List (if any) */}
                  {userTeam.substitutes && userTeam.substitutes.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                        Substitute Athletes ({userTeam.substitutes.length} / {game.maxSubstitutes}):
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {userTeam.substitutes.map((sub, idx) => {
                          const isThisUser = userProfile && sub.user_id === userProfile.id;
                          const canCaptainKick = isCaptain && !isThisUser;

                          return (
                            <div
                              key={sub.id || sub.user_id || idx}
                              className="p-3 bg-white dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] rounded-xl flex items-center justify-between text-xs font-mono"
                            >
                              <div className="truncate mr-2">
                                <span className="font-bold text-slate-900 dark:text-white block truncate">
                                  Sub {idx + 1}. @{sub.username} {isThisUser && <span className="text-[#E56A10]">(You)</span>}
                                </span>
                                <span className="text-[11px] text-slate-500 truncate block">Handle: {sub.game_handle}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 text-[9px] font-bold rounded">
                                  SUBSTITUTE
                                </span>
                                {canCaptainKick && (
                                  <button
                                    onClick={() => handleKickMember(userTeam.id, sub.user_id, sub.username)}
                                    disabled={actionLoading === `kick-${sub.user_id}`}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                                    title="Remove substitute"
                                  >
                                    {actionLoading === `kick-${sub.user_id}` ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <UserMinus className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Team Management Actions */}
                  <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#242C3D] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {isCaptain ? (
                        <button
                          onClick={() => handleDisbandTeam(userTeam.id)}
                          disabled={actionLoading === "disband"}
                          className="px-4 py-2.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 font-mono text-xs font-bold uppercase rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {actionLoading === "disband" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Disband Team</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLeaveTeam(userTeam.id)}
                          disabled={actionLoading === "leave"}
                          className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold uppercase rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {actionLoading === "leave" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserMinus className="w-3.5 h-3.5" />
                          )}
                          <span>Leave Team</span>
                        </button>
                      )}

                      <button
                        onClick={handleCopyCode}
                        className="px-4 py-2.5 bg-white dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] hover:border-[#E56A10] text-slate-800 dark:text-slate-200 font-mono text-xs font-bold uppercase rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#E56A10]" />}
                        <span>{copiedCode ? "Code Copied!" : "Invite Teammates"}</span>
                      </button>
                    </div>

                    <Link
                      href={`/tournaments?game=${game.slug}`}
                      className="px-6 py-2.5 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>Browse {game.name} Tournaments</span>
                    </Link>
                  </div>
                </div>
              ) : game.status === "COMING_SOON" ? (
                /* Coming Soon Teaser State */
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30">
                    <Clock className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-white uppercase">
                      {game.name} is Coming Soon
                    </h3>
                    <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
                      Official arena launches soon. Team formation, athlete rosters, and tournament registrations are currently locked.
                      {game.expectedReleaseDate && (
                        <span className="block mt-1 font-bold text-amber-600 dark:text-amber-400">
                          Target Launch: {game.expectedReleaseDate}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      disabled
                      className="px-6 py-3 bg-slate-100 dark:bg-[#161A24] border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-mono font-bold text-xs uppercase rounded-xl flex items-center gap-2 cursor-not-allowed opacity-60"
                      title="Team formation locked until title launch"
                    >
                      <Users className="w-4 h-4" />
                      <span>{isSoloGame ? "Register Solo Profile (Locked)" : "Create Team (Locked)"}</span>
                    </button>

                    {!isSoloGame && (
                      <button
                        disabled
                        className="px-6 py-3 bg-slate-100 dark:bg-[#161A24] border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-mono font-bold text-xs uppercase rounded-xl flex items-center gap-2 cursor-not-allowed opacity-60"
                        title="Joining locked until title launch"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Join Team (Locked)</span>
                      </button>
                    )}

                    <Link
                      href="/games"
                      className="px-6 py-3 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#202534] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#242C3D] font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Explore Other Disciplines</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* No Team Created Yet (Active Game) */
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-white uppercase">
                      {isSoloGame ? "No Solo Profile for " + game.name : "No Registered Team for " + game.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
                      {isSoloGame
                        ? "Register your solo competitor profile to enter official tournaments."
                        : `Form your ${game.minTeamSize}-${game.maxTeamSize} athlete team or join an existing roster using an invite code.`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="px-6 py-3 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Users className="w-4 h-4" />
                      <span>{isSoloGame ? "Register Solo Profile" : "Create Team"}</span>
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

                    <Link
                      href={`/tournaments?game=${game.slug}`}
                      className="px-6 py-3 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#202534] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#242C3D] font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Trophy className="w-4 h-4 text-[#E56A10]" />
                      <span>View Tournaments</span>
                    </Link>
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

          {/* Right Sidebar: Quick Rules & Platform Highlights */}
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
                  <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Verified Rosters</span>
                  Teams lock in verified player handles and Riot/Steam IDs before tournament check-in.
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#161A24] rounded-xl border border-slate-200 dark:border-[#242C3D]">
                  <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Official Tournaments</span>
                  Use your registered team to enter open tournaments. Entry fees and prize pools belong strictly to tournaments.
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/tournaments?game=${game.slug}`}
                  className="w-full py-3 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Trophy className="w-4 h-4" />
                  <span>View {game.name} Tournaments</span>
                </Link>
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
        onTeamCreated={() => {
          setIsCreateModalOpen(false);
          fetchGameAndTeams();
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

      {/* Media Gallery Lightbox Modal */}
      {selectedGalleryIndex !== null && game.gallery && game.gallery[selectedGalleryIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedGalleryIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center bg-[#0B0E16] border border-[#242C3D] rounded-xl overflow-hidden p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-[#242C3D] text-xs font-mono text-[#94A3B8]">
              <span>
                {game.name} Media Asset ({selectedGalleryIndex + 1} of {game.gallery.length})
              </span>
              <button
                onClick={() => setSelectedGalleryIndex(null)}
                className="p-1 rounded text-[#94A3B8] hover:text-white hover:bg-[#161A24] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full flex items-center justify-center my-4 overflow-hidden max-h-[70vh]">
              <img
                src={game.gallery[selectedGalleryIndex].url}
                alt={game.gallery[selectedGalleryIndex].caption || `${game.name} preview`}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
              />

              {game.gallery.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedGalleryIndex((prev) =>
                        prev !== null ? (prev > 0 ? prev - 1 : game.gallery.length - 1) : 0
                      )
                    }
                    className="absolute left-2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-[#242C3D] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedGalleryIndex((prev) =>
                        prev !== null ? (prev < game.gallery.length - 1 ? prev + 1 : 0) : 0
                      )
                    }
                    className="absolute right-2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-[#242C3D] transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {game.gallery[selectedGalleryIndex].caption && (
              <div className="w-full text-center text-xs font-mono text-[#CBD5E1] pt-2 border-t border-[#242C3D]">
                {game.gallery[selectedGalleryIndex].caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
