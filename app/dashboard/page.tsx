'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Trophy,
  Users,
  Shield,
  Copy,
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
  ExternalLink,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useUser, useAuth } from "@clerk/nextjs";
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
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
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

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const isHardcodedAdmin = userEmail === "pk.4081988@gmail.com" || userEmail === "admin@ametheus.gg";
  const effectiveRole = isHardcodedAdmin ? "SUPER_ADMIN" : (profile?.role || "PLAYER");
  const isSuperAdmin = isHardcodedAdmin || effectiveRole === "SUPER_ADMIN";
  const isOrganizer = isHardcodedAdmin || effectiveRole === "ORGANIZER" || isSuperAdmin;

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, teamsRes, tournRes, matchRes] = await Promise.allSettled([
        getCurrentUserProfile(),
        getMyTeams(),
        getTournaments(),
        getMatches(),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value) {
        setProfile(profileRes.value);
        setProfileForm({
          display_name: profileRes.value.display_name || "",
          riot_id: profileRes.value.riot_id || "",
          steam_id: profileRes.value.steam_id || "",
        });
      }
      if (teamsRes.status === "fulfilled" && Array.isArray(teamsRes.value)) {
        setTeams(teamsRes.value);
      }
      if (tournRes.status === "fulfilled" && Array.isArray(tournRes.value)) {
        setTournaments(tournRes.value);
      }
      if (matchRes.status === "fulfilled" && Array.isArray(matchRes.value)) {
        setMatches(matchRes.value);
      }
    } catch (err) {
      console.warn("Dashboard data loading error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      loadDashboardData();
    } else if (isAuthLoaded && !isSignedIn) {
      setIsLoading(false);
    }
  }, [isSignedIn, isAuthLoaded]);

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

  // Real user display names without mock fallbacks
  const displayName = profile?.display_name || user?.fullName || user?.username || "Athlete";
  const username = profile?.username || user?.username || (userEmail ? userEmail.split("@")[0] : "player");
  const inrBalance = profile?.inr_balance != null ? Number(profile.inr_balance).toLocaleString("en-IN") : "0";

  return (
    <div className="flex flex-col w-full bg-[#0B0E16] min-h-screen text-[#F8FAFC]">
      {/* Super Admin Notice Banner (for pk.4081988@gmail.com and SUPER_ADMIN) */}
      {isSuperAdmin && (
        <div className="w-full bg-[#E56A10]/15 border-b border-[#E56A10]/30 px-4 md:px-8 py-3">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#FFB68F]">
              <Shield className="w-4 h-4 text-[#E56A10] shrink-0" />
              <span>
                <strong className="text-white">SUPER ADMIN ACCESS GRANTED:</strong> You have authoritative privileges across match arbitration, game catalog management, and platform analytics.
              </span>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded transition-colors shrink-0 shadow-xs"
            >
              Open Admin Cockpit <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 1. Header Profile Banner */}
      <section className="w-full bg-[#10141F] py-8 md:py-10 border-b border-[#242C3D]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              {/* User Avatar */}
              <div className="w-16 h-16 rounded-xl bg-[#161A24] border-2 border-[#E56A10] flex items-center justify-center font-bold text-xl text-[#FFB68F] font-mono shrink-0 overflow-hidden shadow-md">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={displayName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayName.slice(0, 2).toUpperCase()
                )}
              </div>

              {/* Profile Details */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold font-headline text-white">
                    {displayName}
                  </h1>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${
                      isSuperAdmin
                        ? "bg-[#E56A10]/20 text-[#FFB68F] border-[#E56A10]/50"
                        : effectiveRole === "ORGANIZER"
                        ? "bg-amber-950/40 text-amber-300 border-amber-500/40"
                        : "bg-[#161A24] text-[#94A3B8] border-[#242C3D]"
                    }`}
                  >
                    {isSuperAdmin ? "SUPER ADMIN" : effectiveRole}
                  </span>
                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    className="p-1.5 text-[#94A3B8] hover:text-[#E56A10] hover:bg-[#161A24] transition-colors rounded cursor-pointer"
                    title="Edit Competitive Profile & Game Handles"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#94A3B8] font-mono mt-2">
                  <span className="text-white">@{username}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <span>Riot ID:</span>
                    {profile?.riot_id ? (
                      <span className="text-white font-semibold">{profile.riot_id}</span>
                    ) : (
                      <button
                        onClick={() => setIsEditProfileOpen(true)}
                        className="text-[11px] text-[#E56A10] hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        [+ Link Handle]
                      </button>
                    )}
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <span>Steam ID:</span>
                    {profile?.steam_id ? (
                      <span className="text-white font-semibold">{profile.steam_id}</span>
                    ) : (
                      <button
                        onClick={() => setIsEditProfileOpen(true)}
                        className="text-[11px] text-[#E56A10] hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        [+ Link Steam]
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Quick Balance Card */}
            <div className="flex items-center gap-4 bg-[#161A24] p-4 rounded-xl border border-[#242C3D] shadow-xs">
              <div>
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase font-bold tracking-wider">
                  Escrow Balance
                </div>
                <div className="text-2xl font-bold font-mono text-[#E56A10]">
                  ₹{inrBalance}
                </div>
              </div>
              <div className="w-11 h-11 rounded-lg bg-[#E56A10]/15 border border-[#E56A10]/30 flex items-center justify-center text-[#E56A10]">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Dashboard Content */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full space-y-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8] font-mono text-sm gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#E56A10]" />
            <span>Loading competitive profile and telemetry...</span>
          </div>
        ) : (
          <>
            {/* Active Squad Card */}
            {activeTeam ? (
              <div className="bg-[#10141F] p-6 rounded-xl border border-[#242C3D] shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242C3D] pb-4">
                  <div>
                    <div className="text-xs font-mono text-[#94A3B8] uppercase font-bold tracking-wider">
                      Active Tactical Squad ({activeTeam.game_slug.toUpperCase()})
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <h2 className="text-xl font-bold font-headline text-white">
                        {activeTeam.name} [{activeTeam.tag}]
                      </h2>
                      {isCaptain && (
                        <span className="px-2 py-0.5 bg-[#E56A10]/20 text-[#FFB68F] border border-[#E56A10]/40 text-[10px] font-mono font-bold rounded">
                          SQUAD CAPTAIN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Invite Code & Action Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-[#161A24] px-3 py-1.5 rounded-lg border border-[#242C3D]">
                      <span className="text-xs text-[#94A3B8] font-mono">Invite Code:</span>
                      <span className="font-mono text-sm font-bold text-[#E56A10] tracking-widest">
                        {activeTeam.invite_code}
                      </span>
                      <button
                        onClick={() => handleCopy(activeTeam.invite_code)}
                        className="px-2 py-0.5 bg-[#0B0E16] border border-[#242C3D] rounded text-xs font-mono text-[#CBD5E1] hover:text-white hover:border-[#E56A10] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedCode ? "Copied" : "Copy"}
                      </button>
                    </div>

                    <button
                      onClick={() => setIsJoinSquadOpen(true)}
                      className="px-3 py-2 bg-[#161A24] border border-[#242C3D] hover:border-[#E56A10] text-[#CBD5E1] hover:text-white rounded-lg text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[#E56A10]" /> Join Squad
                    </button>

                    {isCaptain ? (
                      <button
                        onClick={() => handleDisbandSquad(activeTeam.id)}
                        className="px-3 py-2 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Disband Squad"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Disband
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLeaveSquad(activeTeam.id)}
                        className="px-3 py-2 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Leave Squad"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Leave
                      </button>
                    )}
                  </div>
                </div>

                {/* Roster Members with Kick Functionality */}
                <div>
                  <div className="text-xs font-mono font-bold text-[#94A3B8] uppercase mb-3">
                    Squad Roster ({activeTeam.members?.length || 1} / {activeTeam.max_members} Athletes)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {activeTeam.members && activeTeam.members.length > 0 ? (
                      activeTeam.members.map((m, i) => (
                        <div
                          key={i}
                          className="bg-[#161A24] p-3 rounded-lg border border-[#242C3D] text-xs font-mono flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">@{m.username}</span>
                              {isCaptain && m.user_id !== profile?.id && (
                                <button
                                  onClick={() => handleKickMember(activeTeam.id, m.user_id, m.username)}
                                  className="p-1 text-[#94A3B8] hover:text-rose-400 transition-colors cursor-pointer"
                                  title={`Kick @${m.username}`}
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="text-[10px] text-[#E56A10] font-bold mt-1 uppercase">
                              {m.role}
                            </div>
                            <div className="text-[11px] text-[#94A3B8] truncate mt-1">
                              {m.game_handle || "Handle pending"}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-xs text-[#94A3B8] font-mono">
                        Captain: @{activeTeam.captain_username}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#10141F] p-6 rounded-xl border border-[#242C3D] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-lg font-bold font-headline text-white">
                    No Active Tactical Squad
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-1.5 max-w-xl leading-relaxed">
                    You haven&apos;t joined or created a squad yet. Create your roster to receive an exclusive 6-character squad code, or enter an invite code to join your team.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setIsJoinSquadOpen(true)}
                    className="px-4 py-2.5 bg-[#161A24] border border-[#242C3D] hover:border-[#E56A10] text-[#CBD5E1] hover:text-white font-mono text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-[#E56A10]" />
                    Join with Invite Code
                  </button>
                  <Link
                    href="/games"
                    className="px-4 py-2.5 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create Squad
                  </Link>
                </div>
              </div>
            )}

            {/* Tournaments & Upcoming Match Lobby */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tournaments Section */}
              <div className="bg-[#10141F] p-6 rounded-xl border border-[#242C3D] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
                  <h3 className="font-headline font-bold text-base text-white uppercase flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#E56A10]" /> Competitive Tournaments
                  </h3>
                  <Link href="/tournaments" className="text-xs text-[#E56A10] font-mono hover:underline">
                    Browse All →
                  </Link>
                </div>

                <div className="space-y-3">
                  {tournaments.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="p-4 bg-[#161A24] rounded-lg border border-[#242C3D] hover:border-[#333C4D] transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-[#0B0E16] text-[#FFB68F] border border-[#E56A10]/30 text-[10px] font-mono font-bold rounded uppercase">
                          {t.status}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#E56A10]">
                          {t.prize_pool}
                        </span>
                      </div>
                      <h4 className="font-headline font-bold text-sm text-white">
                        {t.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono pt-2 border-t border-[#242C3D]">
                        <span>Starts: {t.starts_at ? new Date(t.starts_at).toLocaleDateString() : "TBD"}</span>
                        <Link
                          href={`/tournaments/${t.slug || t.id}`}
                          className="text-[#E56A10] font-bold hover:underline flex items-center gap-1"
                        >
                          View Details <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}

                  {tournaments.length === 0 && (
                    <div className="p-6 text-center text-xs text-[#94A3B8] font-mono bg-[#161A24] rounded-lg border border-[#242C3D]">
                      No active tournaments scheduled. Check back shortly for new competitive brackets!
                    </div>
                  )}
                </div>
              </div>

              {/* Next Match Lobby */}
              <div className="bg-[#10141F] p-6 rounded-xl border border-[#242C3D] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
                  <h3 className="font-headline font-bold text-base text-white uppercase flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-[#E56A10]" /> Next Match Lobby
                  </h3>
                  <Link href="/matches" className="text-xs text-[#E56A10] font-mono hover:underline">
                    Match Center →
                  </Link>
                </div>

                {nextMatch ? (
                  <div className="p-5 bg-[#161A24] text-white rounded-lg border border-[#242C3D] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-[#E56A10]/20 text-[#FFB68F] border border-[#E56A10]/40 text-[10px] font-mono font-bold rounded uppercase">
                        {nextMatch.status}
                      </span>
                      <span className="text-xs font-mono text-[#94A3B8]">{nextMatch.stage}</span>
                    </div>
                    <div className="flex items-center justify-between font-headline font-bold text-base py-2">
                      <span className="text-white">{nextMatch.team_a?.name || "Team Alpha"}</span>
                      <span className="text-xs text-[#E56A10] font-mono px-2 py-1 bg-[#0B0E16] rounded border border-[#242C3D]">
                        VS
                      </span>
                      <span className="text-white">{nextMatch.team_b?.name || "Team Bravo"}</span>
                    </div>
                    <Link
                      href="/matches"
                      className="w-full py-2.5 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      Enter Match Lobby
                    </Link>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#161A24] border border-dashed border-[#242C3D] rounded-lg text-xs text-[#94A3B8] font-mono flex flex-col items-center gap-2">
                    <Gamepad2 className="w-6 h-6 text-[#64748B]" />
                    <span>No matches scheduled right now. Join a tournament to get seeded into a live bracket!</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#10141F] text-white border border-[#242C3D] rounded-xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
              <h3 className="text-base font-bold uppercase font-mono text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#E56A10]" /> Edit Competitive Profile
              </h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-[#94A3B8] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {profileSaveSuccess ? (
              <div className="p-6 text-center text-emerald-400 font-mono text-xs flex flex-col items-center gap-2">
                <Check className="w-8 h-8 text-emerald-400" />
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
                    placeholder="e.g. Phoenix Ace"
                    className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono"
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
                    placeholder="Player#REGION"
                    className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono"
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
                    placeholder="STEAM_0:X:XXXXXX"
                    className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#242C3D]">
                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(false)}
                    className="px-4 py-2 bg-[#161A24] border border-[#242C3D] text-xs font-mono uppercase rounded-lg text-[#94A3B8] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#10141F] text-white border border-[#242C3D] rounded-xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
              <h3 className="text-base font-bold uppercase font-mono text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#E56A10]" /> Join Squad with Invite Code
              </h3>
              <button
                onClick={() => setIsJoinSquadOpen(false)}
                className="text-[#94A3B8] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {joinError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg text-xs font-mono">
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
                  className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2.5 text-base font-mono font-bold tracking-widest text-center text-[#E56A10] focus:border-[#E56A10] focus:outline-hidden uppercase"
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
                  className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => setIsJoinSquadOpen(false)}
                  className="px-4 py-2 bg-[#161A24] border border-[#242C3D] text-xs font-mono uppercase rounded-lg text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoiningSquad}
                  className="px-5 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
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
