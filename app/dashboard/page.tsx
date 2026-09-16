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
} from "lucide-react";
import { getCurrentUserProfile, UserProfile } from "@/lib/api/auth";
import { getMyTeams, Team } from "@/lib/api/teams";
import { getTournaments, Tournament } from "@/lib/api/tournaments";
import { getMatches, Match } from "@/lib/api/matches";

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
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
    }

    loadDashboardData();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const activeTeam = teams.length > 0 ? teams[0] : null;
  const nextMatch = matches.length > 0 ? matches[0] : null;

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
                    @{profile?.username || "vortex_lead"}
                  </h1>
                  <span className="px-2 py-0.5 bg-[#E56A10] text-white text-[10px] font-mono font-bold rounded">
                    {profile?.role || "VERIFIED CONTENDER"}
                  </span>
                </div>
                <p className="text-xs text-[#565E74] font-mono mt-0.5">
                  {profile?.email || "vortex@ametheus.gg"} • In-Game ID: {profile?.riot_id || "Vortex#APEX"}
                </p>
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
        {/* Active Squad Card with 6-char Invite Code */}
        {activeTeam ? (
          <div className="bg-white p-6 rounded border border-[#D3E4FE] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF4FF] pb-4">
              <div>
                <div className="text-xs font-mono text-[#565E74] uppercase font-bold">
                  Active Tactical Squad ({activeTeam.game_slug.toUpperCase()})
                </div>
                <h2 className="text-xl font-bold font-headline text-[#0B1C30]">
                  {activeTeam.name} [{activeTeam.tag}]
                </h2>
              </div>
              {/* Invite Code Box */}
              <div className="flex items-center gap-2 bg-[#EFF4FF] p-2 rounded border border-[#D3E4FE]">
                <span className="text-xs text-[#565E74] font-mono">Invite Code:</span>
                <span className="font-mono text-sm font-bold text-[#E56A10] tracking-widest">
                  {activeTeam.invite_code}
                </span>
                <button
                  onClick={() => handleCopy(activeTeam.invite_code)}
                  className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded text-xs font-mono hover:border-[#E56A10] flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedCode ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Roster Members */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {activeTeam.members && activeTeam.members.length > 0 ? (
                activeTeam.members.map((m, i) => (
                  <div key={i} className="bg-[#EFF4FF] p-3 rounded border border-[#D3E4FE] text-xs font-mono">
                    <div className="font-bold text-[#0B1C30]">@{m.username}</div>
                    <div className="text-[10px] text-[#E56A10] font-bold">{m.role}</div>
                    <div className="text-[10px] text-[#565E74] truncate mt-1">{m.game_handle}</div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-xs text-[#565E74] font-mono">
                  Captain: @{activeTeam.captain_username}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded border border-[#D3E4FE] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold font-headline text-[#0B1C30]">No Active Tactical Squad</h2>
              <p className="text-xs text-[#565E74] mt-1">
                You haven&apos;t joined or created a squad yet. Create your roster to receive an exclusive 6-character squad code.
              </p>
            </div>
            <Link
              href="/games"
              className="px-4 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-mono text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Explore Disciplines & Create Squad
            </Link>
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
    </div>
  );
}

