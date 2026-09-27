"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  Users,
  Shield,
  Search,
  Plus,
  ArrowRight,
  Copy,
  Check,
  Crown,
  Gamepad2,
  Lock,
  UserPlus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import PageMediaVisual from "@/components/media/PageMediaVisual";
import { getTeams, joinTeam, Team } from "@/lib/api/teams";
import { getGames, Game } from "@/lib/api/games";

export default function TeamsPage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGameSlug, setSelectedGameSlug] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Quick Join Code Form
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [playerHandle, setPlayerHandle] = useState("");
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [joinMsg, setJoinMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [teamsData, gamesData] = await Promise.all([
        getTeams({
          game_slug: selectedGameSlug === "all" ? undefined : selectedGameSlug,
          search: searchQuery.trim() || undefined,
        }),
        getGames(),
      ]);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setGames(Array.isArray(gamesData) ? gamesData : []);
    } catch (err) {
      console.warn("Failed to fetch teams directory:", err);
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGameSlug, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      setJoinMsg({ type: "error", text: "Please sign in to join a competitive team roster." });
      return;
    }
    if (!inviteCode.trim() || !playerHandle.trim()) {
      setJoinMsg({ type: "error", text: "Enter both team invite code and your in-game handle." });
      return;
    }

    setIsSubmittingJoin(true);
    setJoinMsg(null);
    try {
      const res = await joinTeam({
        invite_code: inviteCode.trim().toUpperCase(),
        player_handle: playerHandle.trim(),
      });
      setJoinMsg({
        type: "success",
        text: `Successfully joined ${res.name} [${res.tag}]!`,
      });
      setInviteCode("");
      setPlayerHandle("");
      fetchData();
      setTimeout(() => {
        setIsJoinModalOpen(false);
        setJoinMsg(null);
      }, 2500);
    } catch (err: any) {
      setJoinMsg({
        type: "error",
        text: err?.message || "Failed to join team. Check the invite code and try again.",
      });
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#F8F9FA] dark:bg-[#0B0E16] min-h-screen text-[#0B1C30] dark:text-[#F8FAFC]">
      {/* 1. Hero Section with Centralized Page Media Visual */}
      <section className="bg-[#EFF4FF] dark:bg-[#0F131D] py-12 md:py-16 px-4 md:px-8 border-b border-slate-200 dark:border-[#242C3D] relative overflow-hidden transition-colors">
        <PageMediaVisual
          pageId="teams"
          defaultMediaUrl="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80"
          defaultOpacity={0.25}
          maskGradient="radial-gradient(ellipse 75% 75% at 75% 50%, #000 20%, transparent 100%)"
        />

        <div className="max-w-[1440px] mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] rounded text-[#E56A10] text-xs font-bold tracking-wider uppercase font-mono shadow-xs">
            <Users className="w-3.5 h-3.5" />
            OFFICIAL COMPETITIVE SQUADS &amp; ROSTERS
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline text-slate-900 dark:text-white uppercase tracking-tight">
                Squads &amp; Teams Hub
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Explore registered competitive squads, join rosters via invite codes, and build your championship lineup for sanctioned tournament brackets.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="px-4 py-2.5 bg-white dark:bg-[#1A2234] hover:bg-slate-50 dark:hover:bg-[#232D42] border border-slate-200 dark:border-[#242C3D] rounded-xl text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4 text-[#E56A10]" />
                <span>Join with Invite Code</span>
              </button>
              <Link
                href="/games"
                className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white rounded-xl text-xs font-headline font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-[#E56A10]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Form New Squad</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content Body */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-10 space-y-8 w-full">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Game Discipline Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedGameSlug("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-headline font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedGameSlug === "all"
                  ? "bg-[#E56A10] text-white shadow-xs"
                  : "bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#242C3D] text-slate-700 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-[#1A2234]"
              }`}
            >
              All Disciplines
            </button>
            {games
              .filter((g) => g.is_team_game !== false)
              .map((game) => (
                <button
                  key={game.slug}
                  onClick={() => setSelectedGameSlug(game.slug)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-headline font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedGameSlug === game.slug
                      ? "bg-[#E56A10] text-white shadow-xs"
                      : "bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#242C3D] text-slate-700 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-[#1A2234]"
                  }`}
                >
                  {game.name}
                </button>
              ))}
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search squad name or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#242C3D] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#E56A10]"
            />
          </div>
        </div>

        {/* Squad Cards Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-[#E56A10]" />
            <span className="text-xs font-mono uppercase tracking-wider">Syncing Team Rosters...</span>
          </div>
        ) : teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const memberCount = (team.members || []).length;
              const subCount = (team.substitutes || []).length;
              const maxMembers = team.max_members || 5;
              const isFull = memberCount >= maxMembers;

              return (
                <div
                  key={team.id}
                  className="bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#242C3D] rounded-2xl p-6 space-y-5 hover:border-slate-300 dark:hover:border-[#38435C] transition-all shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Tag + Name + Game */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#EFF4FF] dark:bg-[#1A2234] border border-blue-200 dark:border-[#242C3D] text-[#E56A10] font-mono text-xs font-bold rounded">
                            [{team.tag}]
                          </span>
                          <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-[#94A3B8]">
                            {team.game_slug}
                          </span>
                        </div>
                        <h3 className="font-headline font-bold text-lg text-slate-900 dark:text-white truncate">
                          {team.name}
                        </h3>
                      </div>

                      {/* Roster Capacity Badge */}
                      <span
                        className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase shrink-0 ${
                          isFull
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        }`}
                      >
                        {memberCount}/{maxMembers} Active
                      </span>
                    </div>

                    {/* Captain Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
                      <Crown className="w-3.5 h-3.5 text-[#E56A10] shrink-0" />
                      <span>Led by:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {team.captain_username}
                      </span>
                    </div>

                    {/* Roster Players Lineup */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                        Roster Lineup:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(team.members || []).map((m, idx) => (
                          <span
                            key={m.id || idx}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-[#0B0E16] border border-slate-200 dark:border-[#242C3D] rounded text-[11px] font-mono text-slate-700 dark:text-[#CBD5E1]"
                          >
                            {m.role === "CAPTAIN" && <Crown className="w-2.5 h-2.5 text-[#E56A10]" />}
                            <span>{m.game_handle || m.username}</span>
                          </span>
                        ))}
                        {subCount > 0 &&
                          (team.substitutes || []).map((s, idx) => (
                            <span
                              key={s.id || idx}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded text-[11px] font-mono text-purple-700 dark:text-purple-300"
                            >
                              <span>SUB: {s.game_handle || s.username}</span>
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions / Invite Code */}
                  <div className="pt-4 border-t border-slate-100 dark:border-[#242C3D] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-slate-400">Invite Code:</span>
                      <button
                        onClick={() => handleCopyCode(team.invite_code)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#232D42] rounded text-xs font-mono font-bold text-slate-900 dark:text-white transition-colors cursor-pointer"
                        title="Copy Invite Code"
                      >
                        <span>{team.invite_code}</span>
                        {copiedCode === team.invite_code ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-[#E56A10]" />
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setInviteCode(team.invite_code);
                        setIsJoinModalOpen(true);
                      }}
                      className="text-xs font-mono font-bold uppercase text-[#E56A10] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Join Roster →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center bg-white dark:bg-[#121622] rounded-2xl border border-dashed border-slate-300 dark:border-[#242C3D] space-y-4">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">
                No Squads Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-mono">
                No active squads matched your search or discipline filter. Be the first to register a squad!
              </p>
            </div>
            <Link
              href="/games"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white rounded-lg text-xs font-headline font-bold uppercase tracking-wider transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Form a Squad in Game Hub
            </Link>
          </div>
        )}
      </main>

      {/* Quick Join Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-[#242C3D] rounded-2xl max-w-md w-full p-6 space-y-5 text-white animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#242C3D]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#E56A10]" />
                <h3 className="font-headline font-bold text-base uppercase">Join Competitive Squad</h3>
              </div>
              <button
                onClick={() => {
                  setIsJoinModalOpen(false);
                  setJoinMsg(null);
                }}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {joinMsg && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-mono ${
                  joinMsg.type === "success"
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                    : "bg-red-950/60 border-red-500 text-red-300"
                }`}
              >
                {joinMsg.type === "success" ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                )}
                <span>{joinMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleQuickJoin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase text-[#CBD5E1]">
                  6-Character Invite Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. X7K9PQ"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-[#0B0E16] border border-[#242C3D] focus:border-[#E56A10] rounded-xl text-sm font-mono text-white tracking-widest uppercase outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase text-[#CBD5E1]">
                  Your In-Game Handle
                </label>
                <input
                  type="text"
                  placeholder="e.g. PlayerOne#IND or Character ID"
                  value={playerHandle}
                  onChange={(e) => setPlayerHandle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0B0E16] border border-[#242C3D] focus:border-[#E56A10] rounded-xl text-xs font-mono text-white outline-none"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Must match the in-game username you will compete with in match lobbies.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => {
                    setIsJoinModalOpen(false);
                    setJoinMsg(null);
                  }}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJoin}
                  className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white rounded-xl text-xs font-headline font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingJoin ? "Verifying..." : "Confirm & Join Roster"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
