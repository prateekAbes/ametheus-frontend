'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Users,
  Shield,
  Copy,
  CheckCircle,
  Clock,
  ArrowRight,
  Wallet,
  Gamepad2,
  Calendar,
  UserPlus,
  Loader2,
  Edit3,
  LogOut,
  UserMinus,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { getCurrentUserProfile, updateUserProfile, UserProfile } from "@/lib/api/auth";
import {
  getMyTeams,
  joinTeam,
  leaveTeam,
  kickTeamMember,
  disbandTeam,
  Team,
} from "@/lib/api/teams";
import { getTournaments, Tournament } from "@/lib/api/tournaments";
import { getMatches, Match } from "@/lib/api/matches";

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Profile Edit Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    display_name: "",
    riot_id: "",
    steam_id: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Join Squad Modal State
  const [isJoinSquadOpen, setIsJoinSquadOpen] = useState(false);
  const [joinForm, setJoinForm] = useState({
    invite_code: "",
    player_handle: "",
  });
  const [isJoiningSquad, setIsJoiningSquad] = useState(false);
  const [joinError, setJoinError] = useState("");

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, teamsRes, tournRes, matchRes] = await Promise.allSettled([
        getCurrentUserProfile(),
        getMyTeams(),
        getTournaments(),
        getMatches(),
      ]);

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value);
        setProfileForm({
          display_name: profileRes.value.display_name || "",
          riot_id: profileRes.value.riot_id || "",
          steam_id: profileRes.value.steam_id || "",
        });
      }
      if (teamsRes.status === "fulfilled" && teamsRes.value.length > 0) {
        setTeams(teamsRes.value);
      }
      if (tournRes.status === "fulfilled" && tournRes.value.length > 0) {
        setTournaments(tournRes.value);
      }
      if (matchRes.status === "fulfilled" && matchRes.value.length > 0) {
        setMatches(matchRes.value);
      }
    } catch (err) {
      console.warn("Dashboard data fetch fallback:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated = await updateUserProfile(profileForm);
      setProfile(updated);
      setProfileSaveSuccess(true);
      setTimeout(() => {
        setProfileSaveSuccess(false);
        setIsEditProfileOpen(false);
      }, 1200);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleJoinSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    setIsJoiningSquad(true);
    try {
      await joinTeam({
        invite_code: joinForm.invite_code.toUpperCase().trim(),
        player_handle: joinForm.player_handle.trim(),
      });
      setIsJoinSquadOpen(false);
      setJoinForm({ invite_code: "", player_handle: "" });
      const updatedTeams = await getMyTeams();
      setTeams(updatedTeams);
    } catch (err: any) {
      setJoinError(err.message || "Failed to join squad. Verify the 6-character code.");
    } finally {
      setIsJoiningSquad(false);
    }
  };

  const handleKickMember = async (teamId: string, memberUserId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove @${memberName} from the roster?`)) return;
    try {
      await kickTeamMember(teamId, memberUserId);
      const updatedTeams = await getMyTeams();
      setTeams(updatedTeams);
    } catch (err: any) {
      alert(err.message || "Failed to kick member");
    }
  };

  const handleLeaveSquad = async (teamId: string) => {
    if (!confirm("Are you sure you want to leave this tactical squad?")) return;
    try {
      await leaveTeam(teamId);
      const updatedTeams = await getMyTeams();
      setTeams(updatedTeams);
    } catch (err: any) {
      alert(err.message || "Failed to leave squad");
    }
  };

  const handleDisbandSquad = async (teamId: string) => {
    if (!confirm("Are you sure you want to permanently disband this squad roster?")) return;
    try {
      await disbandTeam(teamId);
      const updatedTeams = await getMyTeams();
      setTeams(updatedTeams);
    } catch (err: any) {
      alert(err.message || "Failed to disband squad");
    }
  };

  const activeTeam = teams.length > 0 ? teams[0] : null;
  const nextMatch = matches.length > 0 ? matches[0] : null;
  const isCaptain = activeTeam && profile && activeTeam.captain_id === profile.id;

  return (
    <div className="flex flex-col w-full bg-[#F8F9FA] min-h-screen">
      {/* 1. Header Hero */}
      <section className="w-full bg-[#EFF4FF] py-10 md:py-12 border-b border-[#D3E4FE]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#0B0E16] border-2 border-[#E56A10] flex items-center justify-center font-bold text-xl text-[#F59E0B] font-headline">
                {profile?.display_name
                  ? profile.display_name.slice(0, 2).toUpperCase()
                  : profile?.username
                  ? profile.username.slice(0, 2).toUpperCase()
                  : "VX"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold font-headline text-[#0B1C30]">
                    {profile?.display_name || `@${profile?.username || "vortex_lead"}`}
                  </h1>
                  <span className="px-2 py-0.5 bg-[#E56A10] text-white text-[10px] font-mono font-bold rounded">
                    {profile?.role || "VERIFIED CONTENDER"}
                  </span>
                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    className="p-1 text-[#565E74] hover:text-[#E56A10] transition-colors rounded hover:bg-white"
                    title="Edit Profile Handles"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#565E74] font-mono mt-1">
                  <span>@{profile?.username || "vortex_lead"}</span>
                  <span>•</span>
                  <span>Riot: {profile?.riot_id || "VORTEX#IND"}</span>
                  <span>•</span>
                  <span>Steam: {profile?.steam_id || "STEAM_0:1:782190"}</span>
                </div>
              </div>
            </div>

            {/* Wallet Quick Balance */}
            <div className="bg-white p-4 rounded border border-[#D3E4FE] shadow-sm flex items-center gap-4">
              <div>
                <div className="text-[11px] font-mono text-[#565E74] uppercase font-bold">
                  Escrow Winnings
                </div>
                <div className="text-2xl font-bold font-headline text-[#E56A10]">
                  ₹{profile?.inr_balance ? Number(profile.inr_balance).toLocaleString() : "12,450"}
                </div>
              </div>
              <div className="w-10 h-10 rounded bg-[#FFDBCA] flex items-center justify-center text-[#E56A10]">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Dashboard Content */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full space-y-8">
        {/* Active Squad Card */}
        {activeTeam ? (
          <div className="bg-white p-6 rounded border border-[#D3E4FE] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF4FF] pb-4">
              <div>
                <div className="text-xs font-mono text-[#565E74] uppercase font-bold">
                  Active Tactical Squad ({activeTeam.game_slug.toUpperCase()})
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-headline text-[#0B1C30]">
                    {activeTeam.name} [{activeTeam.tag}]
                  </h2>
                  {isCaptain && (
                    <span className="px-2 py-0.5 bg-[#E56A10]/15 text-[#E56A10] border border-[#E56A10]/30 text-[10px] font-mono font-bold rounded">
                      SQUAD CAPTAIN
                    </span>
                  )}
                </div>
              </div>

              {/* Invite Code & Action Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-[#EFF4FF] p-2 rounded border border-[#D3E4FE]">
                  <span className="text-xs text-[#565E74] font-mono">Invite Code:</span>
                  <span className="font-mono text-sm font-bold text-[#E56A10] tracking-widest">
                    {activeTeam.invite_code}
                  </span>
                  <button
                    onClick={() => handleCopy(activeTeam.invite_code)}
                    className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded text-xs font-mono hover:border-[#E56A10] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedCode ? "Copied" : "Copy"}
                  </button>
                </div>

                <button
                  onClick={() => setIsJoinSquadOpen(true)}
                  className="px-3 py-2 bg-white border border-[#CBD5E1] hover:border-[#E56A10] text-[#0B1C30] rounded text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#E56A10]" /> Join Squad
                </button>

                {isCaptain ? (
                  <button
                    onClick={() => handleDisbandSquad(activeTeam.id)}
                    className="px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                    title="Disband Squad"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Disband
                  </button>
                ) : (
                  <button
                    onClick={() => handleLeaveSquad(activeTeam.id)}
                    className="px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                    title="Leave Squad"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Leave
                  </button>
                )}
              </div>
            </div>

            {/* Roster Members with Kick Functionality */}
            <div>
              <div className="text-xs font-mono font-bold text-[#565E74] uppercase mb-2">
                Squad Roster ({activeTeam.members?.length || 1} / {activeTeam.max_members} Athletes)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {activeTeam.members && activeTeam.members.length > 0 ? (
                  activeTeam.members.map((m, i) => (
                    <div key={i} className="bg-[#EFF4FF] p-3 rounded border border-[#D3E4FE] text-xs font-mono flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0B1C30]">@{m.username}</span>
                          {isCaptain && m.user_id !== profile?.id && (
                            <button
                              onClick={() => handleKickMember(activeTeam.id, m.user_id, m.username)}
                              className="p-0.5 text-[#94A3B8] hover:text-rose-600 transition-colors"
                              title={`Kick @${m.username}`}
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-[#E56A10] font-bold mt-0.5">{m.role}</div>
                        <div className="text-[10px] text-[#565E74] truncate mt-1">{m.game_handle}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-xs text-[#565E74] font-mono">
                    Captain: @{activeTeam.captain_username}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded border border-[#D3E4FE] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold font-headline text-[#0B1C30]">No Active Tactical Squad</h2>
              <p className="text-xs text-[#565E74] mt-1">
                You haven&apos;t joined or created a squad yet. Create your roster to receive an exclusive 6-character squad code, or enter an invite code to join a teammate.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsJoinSquadOpen(true)}
                className="px-4 py-2 bg-white border border-[#CBD5E1] hover:border-[#E56A10] text-[#0B1C30] font-mono text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Users className="w-4 h-4 text-[#E56A10]" />
                Join with Invite Code
              </button>
              <Link
                href="/games"
                className="px-4 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-mono text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-all shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                Create Squad
              </Link>
            </div>
          </div>
        )}

        {/* Registered Tournaments & Upcoming Matches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registered Tournaments */}
          <div className="bg-white p-6 rounded border border-[#D3E4FE] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFF4FF] pb-3">
              <h3 className="font-headline font-bold text-base text-[#0B1C30] uppercase">
                Active Tournaments
              </h3>
              <Link href="/tournaments" className="text-xs text-[#E56A10] font-mono hover:underline">
                Browse More
              </Link>
            </div>

            <div className="space-y-3">
              {tournaments.slice(0, 3).map((t) => (
                <div key={t.id} className="p-4 bg-[#EFF4FF] rounded border border-[#D3E4FE] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-[#FFDBCA] text-[#331100] text-[10px] font-mono font-bold rounded uppercase">
                      {t.status}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#E56A10]">{t.prize_pool}</span>
                  </div>
                  <h4 className="font-headline font-bold text-sm text-[#0B1C30]">
                    {t.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-[#565E74] font-mono pt-2 border-t border-[#D3E4FE]">
                    <span>Starts {t.starts_at}</span>
                    <Link
                      href={`/tournaments/${t.slug || t.id}`}
                      className="text-[#E56A10] font-bold hover:underline flex items-center gap-1"
                    >
                      View Bracket <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
              {tournaments.length === 0 && (
                <div className="p-4 text-center text-xs text-[#565E74] font-mono">
                  No active tournaments currently available.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Matches */}
          <div className="bg-white p-6 rounded border border-[#D3E4FE] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFF4FF] pb-3">
              <h3 className="font-headline font-bold text-base text-[#0B1C30] uppercase">
                Next Match Lobby
              </h3>
              <Link href="/matches" className="text-xs text-[#E56A10] font-mono hover:underline">
                Match Center
              </Link>
            </div>

            {nextMatch ? (
              <div className="p-4 bg-[#0B0E16] text-white rounded border border-[#242C3D] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-[#E56A10] text-white text-[10px] font-mono font-bold rounded uppercase">
                    {nextMatch.status}
                  </span>
                  <span className="text-xs font-mono text-[#94A3B8]">{nextMatch.stage}</span>
                </div>
                <div className="flex items-center justify-between font-headline font-bold text-base">
                  <span>{nextMatch.team_a?.name || "Team 1"}</span>
                  <span className="text-xs text-[#94A3B8] font-mono">VS</span>
                  <span>{nextMatch.team_b?.name || "Team 2"}</span>
                </div>
                <Link
                  href="/matches"
                  className="w-full py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-mono text-xs font-bold uppercase rounded flex items-center justify-center gap-1 transition-all"
                >
                  Enter Match Lobby
                </Link>
              </div>
            ) : (
              <div className="p-8 text-center bg-[#F8F9FA] border border-dashed border-[#CBD5E1] rounded text-xs text-[#565E74] font-mono">
                No matches scheduled right now. Join a tournament to get seeded into a live bracket!
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0B0E16] text-white border border-[#242C3D] rounded-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
              <h3 className="text-base font-bold uppercase font-mono text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#E56A10]" /> Edit Competitive Profile
              </h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-[#94A3B8] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {profileSaveSuccess ? (
              <div className="p-6 text-center text-emerald-400 font-mono text-xs flex flex-col items-center gap-2">
                <Check className="w-8 h-8" />
                Profile updated successfully!
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.display_name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, display_name: e.target.value })
                    }
                    placeholder="VORTEX ACE"
                    className="w-full bg-[#10131B] border border-[#242C3D] rounded px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                    Riot ID (Game Tag)
                  </label>
                  <input
                    type="text"
                    value={profileForm.riot_id}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, riot_id: e.target.value })
                    }
                    placeholder="VORTEX#IND"
                    className="w-full bg-[#10131B] border border-[#242C3D] rounded px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                    Steam ID
                  </label>
                  <input
                    type="text"
                    value={profileForm.steam_id}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, steam_id: e.target.value })
                    }
                    placeholder="STEAM_0:1:782190"
                    className="w-full bg-[#10131B] border border-[#242C3D] rounded px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#242C3D]">
                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(false)}
                    className="px-4 py-2 bg-[#161A24] border border-[#242C3D] text-xs font-mono uppercase rounded text-[#94A3B8] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white text-xs font-mono font-bold uppercase rounded shadow-sm disabled:opacity-50"
                  >
                    {isSavingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Join Squad Modal */}
      {isJoinSquadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0B0E16] text-white border border-[#242C3D] rounded-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
              <h3 className="text-base font-bold uppercase font-mono text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#E56A10]" /> Join Squad with Invite Code
              </h3>
              <button
                onClick={() => setIsJoinSquadOpen(false)}
                className="text-[#94A3B8] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {joinError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded text-xs font-mono">
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoinSquad} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                  6-Character Invite Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={joinForm.invite_code}
                  onChange={(e) =>
                    setJoinForm({ ...joinForm, invite_code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. 8A3F9X"
                  className="w-full bg-[#10131B] border border-[#242C3D] rounded px-3 py-2 text-base font-mono font-bold tracking-widest text-center text-[#E56A10] focus:border-[#E56A10] focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                  Your In-Game Handle / Riot ID *
                </label>
                <input
                  type="text"
                  required
                  value={joinForm.player_handle}
                  onChange={(e) =>
                    setJoinForm({ ...joinForm, player_handle: e.target.value })
                  }
                  placeholder="Player#TAG"
                  className="w-full bg-[#10131B] border border-[#242C3D] rounded px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => setIsJoinSquadOpen(false)}
                  className="px-4 py-2 bg-[#161A24] border border-[#242C3D] text-xs font-mono uppercase rounded text-[#94A3B8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoiningSquad}
                  className="px-5 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white text-xs font-mono font-bold uppercase rounded shadow-sm disabled:opacity-50"
                >
                  {isJoiningSquad ? "Joining..." : "Join Squad Roster"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
