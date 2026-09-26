"use client";

import { useEffect, use, useState } from "react";
import { getTournamentBySlug, getTournamentMatches, normalizeTournament, NormalizedTournament } from "@/lib/api/tournaments";
import Link from "next/link";
import Image from "next/image";
import BracketTree from "@/components/tournament/BracketTree";
import RegisterTournamentModal from "@/components/tournament/RegisterTournamentModal";
import MatchLobbyModal from "@/components/match/MatchLobbyModal";
import EvidenceSubmissionModal from "@/components/match/EvidenceSubmissionModal";
import { MatchLobbyInfo, BracketMatch } from "@/types";
import {
  Shield,
  Trophy,
  Clock,
  Check,
  CheckCircle,
  Lock,
  Radio,
  Swords,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function TournamentDetailPage({ params }: Props) {
  const resolvedParams = use(params);

  const [tournament, setTournament] = useState<NormalizedTournament | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getTournamentBySlug(resolvedParams.slug)
      .then((data) => {
        if (isMounted) {
          if (data) {
            setTournament(normalizeTournament(data));
          } else {
            setTournament(null);
          }
          setIsLoading(false);
          setHasFetched(true);
        }
      })
      .catch((err) => {
        console.warn("[Tournament Detail] Fetch from database failed:", err);
        if (isMounted) {
          setTournament(null);
          setIsLoading(false);
          setHasFetched(true);
        }
      });

    getTournamentMatches(resolvedParams.slug)
      .then((mList) => {
        if (isMounted && Array.isArray(mList)) {
          setMatches(mList);
        }
      })
      .catch((err) => {
        console.warn("[Tournament Matches] Fetch failed gracefully:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [resolvedParams.slug]);

  const activeTourn = tournament;

  const [activeTab, setActiveTab] = useState<
    "overview" | "schedule" | "prizes" | "bracket" | "matches" | "rosters"
  >("overview");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [selectedBracketMatch, setSelectedBracketMatch] = useState<MatchLobbyInfo | null>(null);
  const [activeEvidenceMatch, setActiveEvidenceMatch] = useState<MatchLobbyInfo | null>(null);

  if (isLoading && !activeTourn) {
    return (
      <div className="min-h-[75vh] bg-[#F8F9FF] dark:bg-[#0B0E16] flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-200 transition-colors">
        <div className="w-10 h-10 border-4 border-[#E56A10] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
          Loading Tournament Arena Hub...
        </p>
      </div>
    );
  }

  if (hasFetched && !activeTourn) {
    return (
      <div className="min-h-[75vh] bg-[#F8F9FF] dark:bg-[#0B0E16] flex flex-col items-center justify-center p-6 text-center transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-[#E56A10]/10 border border-[#E56A10]/30 flex items-center justify-center text-[#E56A10] mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <span className="text-xs font-mono font-bold text-[#E56A10] tracking-widest uppercase mb-1">
          TOURNAMENT NOT FOUND
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline text-[#0F172A] dark:text-white mb-2">
          Unable to locate &quot;{resolvedParams.slug}&quot;
        </h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-md mb-6">
          This tournament may have concluded, changed its identifier, or is still being configured by the organizer.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/tournaments"
            className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded transition-colors shadow-xs"
          >
            Browse All Tournaments
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-white dark:bg-[#161A24] border border-[#CBD5E1] dark:border-[#242C3D] text-[#0F172A] dark:text-white text-xs font-mono font-bold uppercase rounded hover:bg-[#F1F3F5] dark:hover:bg-[#202534] transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!activeTourn) {
    return (
      <div className="min-h-[75vh] bg-[#F8F9FF] dark:bg-[#0B0E16] flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-200 transition-colors">
        <div className="w-10 h-10 border-4 border-[#E56A10] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
          Loading Tournament Arena Hub...
        </p>
      </div>
    );
  }

  // Narrowed non-null reference
  const currentTournament: NormalizedTournament = activeTourn;

  const isSoloGame = currentTournament.gameSlug === "chess" || currentTournament.maxTeamSize === 1;
  const isComingSoon = currentTournament.status === "COMING_SOON";

  const handleSelectBracketMatch = (bm: any) => {
    if (!bm) return;
    const teamAObj = bm.teamA || bm.team_a || {};
    const teamBObj = bm.teamB || bm.team_b || {};
    const lobbyInfo: MatchLobbyInfo = {
      id: bm.id || `match-${Date.now()}`,
      tournamentId: currentTournament.id,
      tournamentTitle: currentTournament.title,
      gameSlug: currentTournament.gameSlug,
      gameName: currentTournament.gameName,
      stage: bm.stage || `Round ${bm.round || 1} — Match #${bm.matchNumber || 1}`,
      format: currentTournament.format,
      scheduledTime: bm.scheduledTime || bm.scheduled_time || "Scheduled Bracket Match",
      status: (bm.status as any) || "CHECK_IN_OPEN",
      serverRegion: bm.serverRegion || bm.server_region || currentTournament.serverRegion,
      lobbyCode: bm.lobby_code || `AMT-${(bm.id || "00000000").slice(0, 8).toUpperCase()}`,
      lobbyPassword: bm.lobby_password || "AMT_VANGUARD_99",
      teamA: {
        id: teamAObj.id || teamAObj.tag || "t-a",
        name: teamAObj.name || "TBD (Slot 1)",
        tag: teamAObj.tag || "TBD",
        logoUrl: teamAObj.logoUrl || "",
        score: teamAObj.score,
        isCheckedIn: true,
        roster: [{ username: `${teamAObj.tag || "Player"}_1`, gameId: `${teamAObj.tag || "P"}#1` }],
      },
      teamB: {
        id: teamBObj.id || teamBObj.tag || "t-b",
        name: teamBObj.name || "TBD (Slot 2)",
        tag: teamBObj.tag || "TBD",
        logoUrl: teamBObj.logoUrl || "",
        score: teamBObj.score,
        isCheckedIn: true,
        roster: [{ username: `${teamBObj.tag || "Player"}_1`, gameId: `${teamBObj.tag || "P"}#1` }],
      },
    };
    setSelectedBracketMatch(lobbyInfo);
  };

  const maxTeams = Math.max(1, currentTournament.maxTeams || 16);
  const registeredTeams = currentTournament.registeredTeams || 0;
  const fillPct = Math.min(100, Math.round((registeredTeams / maxTeams) * 100));
  const safeRules = currentTournament.rules || [];
  const safeSchedule = currentTournament.schedule || [];
  const safePrizes = currentTournament.prizes || [];
  const safeBracket = currentTournament.bracketRounds || [];
  const safeRosters = currentTournament.registeredRosters || [];

  return (
    <div className="flex flex-col w-full bg-[#F8F9FF] dark:bg-[#0B0E16] text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      {/* Tournament Banner Hero Header */}
      <div className="relative w-full h-52 sm:h-72 overflow-hidden bg-slate-900 border-b border-slate-200 dark:border-[#242C3D]">
        <Image
          src={
            currentTournament.bannerUrl &&
            !currentTournament.bannerUrl.includes("aida") &&
            !currentTournament.bannerUrl.includes("googleusercontent.com")
              ? currentTournament.bannerUrl
              : "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop"
          }
          alt={currentTournament.title}
          fill
          unoptimized
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 md:left-8 flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 bg-black/80 backdrop-blur-md text-white border border-white/20 font-mono text-xs rounded font-bold uppercase">
            {currentTournament.gameName}
          </span>
          <span className="px-3 py-1 bg-[#E56A10] text-white font-mono text-xs rounded font-bold uppercase shadow-sm">
            {currentTournament.prizePool} PRIZE POOL
          </span>
        </div>
      </div>

      {/* 1. Hero Summary */}
      <section className="relative w-full overflow-hidden bg-white dark:bg-[#0B0E16] border-b border-[#E2E8F0] dark:border-[#242C3D] py-8 transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E56A10] text-white text-xs font-mono font-bold rounded uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {currentTournament.statusLabel}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F1F3F5] dark:bg-[#161A24] text-[#0F172A] dark:text-slate-200 border dark:border-[#242C3D] text-xs font-mono rounded">
              <Shield className="w-3.5 h-3.5 text-[#E56A10]" />
              AMETHEUS SECURE PRIZE GUARANTEED
            </span>
            <span className="px-2.5 py-1 bg-[#F1F3F5] dark:bg-[#161A24] text-[#64748B] dark:text-[#94A3B8] border dark:border-[#242C3D] text-xs font-mono rounded">
              SERVER: {currentTournament.serverRegion}
            </span>
          </div>

          {/* Coming Soon Announcement Banner */}
          {isComingSoon && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-[#E56A10]/10 to-transparent border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-mono font-bold text-[10px] rounded uppercase">
                      COMING SOON
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Official Schedule Announced
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {currentTournament.announcementText || "This sanctioned tournament is currently being configured. Bracket seeding and registration will open as scheduled."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                {currentTournament.expectedStartDate && (
                  <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D]">
                    <span className="text-slate-400 block text-[9px] uppercase">Expected Start</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{currentTournament.expectedStartDate}</span>
                  </div>
                )}
                {currentTournament.registrationOpenDate && (
                  <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D]">
                    <span className="text-slate-400 block text-[9px] uppercase">Registration Opens</span>
                    <span className="font-bold text-[#E56A10]">{currentTournament.registrationOpenDate}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col justify-between">
              <div>
                <h1 className="text-3xl sm:text-5xl font-bold font-headline uppercase tracking-tight text-[#0F172A] dark:text-white">
                  {currentTournament.title}
                </h1>
                <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] mt-2 max-w-2xl leading-relaxed">
                  {currentTournament.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-6 text-xs text-[#64748B] dark:text-[#94A3B8] font-mono">
                <div>
                  <strong className="text-[#0F172A] dark:text-white">Discipline:</strong> {currentTournament.gameName}
                </div>
                <div>
                  <strong className="text-[#0F172A] dark:text-white">{isSoloGame ? "Contender Lock:" : "Roster Lock:"}</strong> {currentTournament.rosterLockTime}
                </div>
                <div>
                  <strong className="text-[#0F172A] dark:text-white">Launch:</strong> {currentTournament.startsAt}
                </div>
              </div>
            </div>

            {/* Entry Fee Box & Direct Action */}
            <div className="lg:col-span-4 bg-[#F8F9FA] dark:bg-[#121622] p-5 rounded-xl border border-[#E2E8F0] dark:border-[#242C3D] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#242C3D]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase">
                    Entry Fee Structure
                  </span>
                  <span className="font-bold text-sm text-[#0F172A] dark:text-white">
                    {isSoloGame ? "Solo Athlete Contender" : "Team Registration"}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-[#E56A10]/10 text-[#E56A10] text-[10px] font-mono font-bold rounded">
                  100% SECURE PRIZE VAULT
                </span>
              </div>

              <div className="my-3 space-y-2">
                <div className="p-3 bg-white dark:bg-[#161A24] rounded border border-[#E56A10]/30">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-mono font-bold text-[#E56A10] uppercase">
                      {isSoloGame ? "Solo Entry" : "Team Entry Pass"}
                    </span>
                    <span className="font-headline font-bold text-xl text-[#E56A10]">
                      {currentTournament.entryFee}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                    {isSoloGame
                      ? "Direct individual contender entry. No team required."
                      : `Single entry pass covers the entire team roster.`}
                  </p>
                </div>

                {!isSoloGame && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-500/30">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-400 uppercase">
                        Team Roster ({currentTournament.maxTeamSize || 5} Players)
                      </span>
                      <span className="font-headline font-bold text-lg text-emerald-700 dark:text-emerald-400">
                        Included
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-900 dark:text-emerald-300 mt-0.5">
                      Roster is managed directly on the {currentTournament.gameName} game page.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {isComingSoon ? (
                  <button
                    disabled
                    className="w-full py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider rounded cursor-not-allowed font-mono text-center"
                  >
                    Registration Opens Soon
                  </button>
                ) : isRegistered ? (
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 font-bold text-xs rounded text-center font-mono">
                    ✓ {isSoloGame ? "YOU ARE REGISTERED AS A CONTENDER" : "YOUR TEAM IS REGISTERED & SEEDED"}
                  </div>
                ) : (
                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="w-full py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
                  >
                    {isSoloGame ? "Register as Contender" : "Register Team"} — {currentTournament.entryFee}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Metric Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-[#F8F9FA] dark:bg-[#121622] p-4 rounded-lg border border-[#E2E8F0] dark:border-[#242C3D]">
              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase block">
                Total Prize Vault
              </span>
              <div className="text-2xl font-bold font-headline text-[#E56A10] mt-0.5 tabular-nums">
                {currentTournament.prizePool}
              </div>
              <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                100% Prize Backed
              </span>
            </div>

            <div className="bg-[#F8F9FA] dark:bg-[#121622] p-4 rounded-lg border border-[#E2E8F0] dark:border-[#242C3D]">
              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase block">
                {isSoloGame ? "Contender Format" : "Team Composition"}
              </span>
              <div className="text-2xl font-bold font-headline text-[#0F172A] dark:text-white mt-0.5">
                {isSoloGame ? "1v1 Solo" : `${currentTournament.maxTeamSize || 5} Players`}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                {isSoloGame ? "Solo Contender Discipline" : "Zero Substitutes Allowed"}
              </span>
            </div>

            <div className="bg-[#F8F9FA] dark:bg-[#121622] p-4 rounded-lg border border-[#E2E8F0] dark:border-[#242C3D]">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-[#64748B] dark:text-[#94A3B8] uppercase">Tournament Bracket</span>
                <span className="text-[#E56A10] font-bold">
                  {registeredTeams} / {maxTeams} Teams
                </span>
              </div>
              <div className="text-2xl font-bold font-headline text-[#0F172A] dark:text-white mt-0.5">
                {fillPct}% Filled
              </div>
              <div className="w-full bg-[#E2E8F0] dark:bg-[#242C3D] h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-[#E56A10] h-full rounded-full"
                  style={{
                    width: `${fillPct}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-[#F8F9FA] dark:bg-[#121622] p-4 rounded-lg border border-[#E2E8F0] dark:border-[#242C3D]">
              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase block">
                Match Adjudication
              </span>
              <div className="text-2xl font-bold font-headline text-[#0F172A] dark:text-white mt-0.5">
                Single Elim
              </div>
              <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                Bo1 Rounds // Bo3 Final
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sticky Tab Controls */}
      <nav className="sticky top-16 z-40 bg-white dark:bg-[#0B0E16]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#242C3D] shadow-xs transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between overflow-x-auto py-2">
          <div className="flex items-center gap-2 font-mono text-xs whitespace-nowrap">
            {[
              { id: "overview", label: "Overview & Rules" },
              { id: "schedule", label: "Schedule & Timeline" },
              { id: "prizes", label: "Prize Distribution" },
              { id: "bracket", label: "Live Bracket" },
              { id: "matches", label: `Matches (${matches.length})` },
              { id: "rosters", label: isSoloGame ? `Contenders (${safeRosters.length})` : `Teams (${safeRosters.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 rounded text-xs font-bold uppercase transition-colors cursor-pointer border ${
                  activeTab === t.id
                    ? "bg-[#E56A10] text-white border-transparent shadow-xs"
                    : "bg-[#F1F3F5] dark:bg-[#161A24] text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white border-transparent dark:border-[#242C3D]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">
            <span>OFFICIAL PRIZE NODE:</span>
            <span className="px-2 py-0.5 bg-[#F1F3F5] dark:bg-[#161A24] border dark:border-[#242C3D] text-[#0F172A] dark:text-[#E56A10] font-bold rounded">
              SECURE-PRIZE-VAULT
            </span>
          </div>
        </div>
      </nav>

      {/* 3. Main Tab Contents */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full">
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8">
            {/* Rules Matrix */}
            <div className="bg-white dark:bg-[#121622] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#242C3D] shadow-xs">
              <h2 className="text-xl font-bold font-headline text-[#0F172A] dark:text-white mb-4">
                Tournament Regulations &amp; Protocols
              </h2>
              <ul className="space-y-3 text-xs text-[#475569] dark:text-[#94A3B8]">
                {safeRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#E56A10] flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
                {safeRules.length === 0 && (
                  <li className="text-[#64748B] italic">Standard fair play and platform tournament regulations apply.</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="bg-white dark:bg-[#121622] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#242C3D] shadow-xs">
            <h2 className="text-xl font-bold font-headline text-[#0F172A] dark:text-white mb-4">
              Schedule &amp; Match Progression
            </h2>
            <div className="space-y-4">
              {safeSchedule.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#F8F9FA] dark:bg-[#161A24] rounded-lg border border-[#E2E8F0] dark:border-[#242C3D] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-sm text-[#0F172A] dark:text-white block">
                      {item.stage}
                    </span>
                    <span className="text-[#64748B] dark:text-[#94A3B8] mt-0.5 block">{item.details}</span>
                  </div>
                  <span className="px-3 py-1 bg-white dark:bg-[#0B0E16] border border-[#CBD5E1] dark:border-[#242C3D] rounded font-mono font-bold text-[#E56A10] whitespace-nowrap">
                    {item.time}
                  </span>
                </div>
              ))}
              {safeSchedule.length === 0 && (
                <div className="text-[#64748B] text-xs py-4 text-center">Schedule details will be announced when bracket seeds lock.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "prizes" && (
          <div className="bg-white dark:bg-[#121622] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#242C3D] shadow-xs">
            <h2 className="text-xl font-bold font-headline text-[#0F172A] dark:text-white mb-2">
              Prize Pool Distribution
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-6">
              Total Prize Vault Backed: <strong className="text-[#E56A10]">{currentTournament.prizePool}</strong>. Payouts processed automatically within 30 minutes of final match verification.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {safePrizes.map((p, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-[#F8F9FA] dark:bg-[#161A24] rounded-xl border border-[#E2E8F0] dark:border-[#242C3D] flex flex-col justify-between"
                >
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded self-start ${p.badge}`}>
                    {p.rank}
                  </span>
                  <div className="my-4">
                    <span className="text-3xl font-bold font-headline text-[#0F172A] dark:text-white tabular-nums block">
                      {p.amount}
                    </span>
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-mono">
                      {p.share} of total pool
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    ✓ Instant Prize Disbursal
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "bracket" && (
          <div className="bg-white dark:bg-[#121622] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#242C3D] shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold font-headline text-[#0F172A] dark:text-white">
                  Tournament Single-Elimination Bracket
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Live real-time match advancement. Winners auto-advance upon admin evidence certification.
                </p>
              </div>
              <span className="text-xs font-mono text-[#E56A10] font-bold">
                AUTO-REFRESH: ACTIVE
              </span>
            </div>

            <BracketTree
              rounds={safeBracket}
              onSelectMatch={handleSelectBracketMatch}
            />
          </div>
        )}

        {activeTab === "matches" && (
          <div className="bg-white dark:bg-[#121622] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#242C3D] shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold font-headline text-[#0F172A] dark:text-white">
                  Tournament Match Schedule ({matches.length})
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Official verified matches with real-time scorekeeping and automated lobby routing.
                </p>
              </div>
              <span className="text-xs font-mono text-[#E56A10] font-bold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                TELEMETRY ACTIVE
              </span>
            </div>

            {matches.length === 0 ? (
              <div className="text-center py-12 text-[#64748B] dark:text-[#94A3B8]">
                <Swords className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#E56A10]" />
                <p className="font-headline font-bold text-sm text-[#0F172A] dark:text-white mb-1">
                  No Scheduled Matches Yet
                </p>
                <p className="text-xs font-mono max-w-sm mx-auto">
                  Match generation occurs once registration concludes and the bracket is seeded by the organizer.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((m: any, idx: number) => {
                  const teamA = m.teamA || m.team_a || {};
                  const teamB = m.teamB || m.team_b || {};
                  const stageName = m.stage || `Round ${m.round || 1} — Match #${m.matchNumber || idx + 1}`;
                  const isLive = m.status === "LIVE" || m.status === "IN_PROGRESS";
                  const isDone = m.status === "COMPLETED";

                  return (
                    <div
                      key={m.id || idx}
                      className="p-5 bg-[#F8F9FA] dark:bg-[#161A24] rounded-xl border border-[#E2E8F0] dark:border-[#242C3D] flex flex-col justify-between gap-4 transition-all hover:border-[#E56A10]/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#E56A10] uppercase">
                          {stageName}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                            isLive
                              ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse"
                              : isDone
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {m.status || "SCHEDULED"}
                        </span>
                      </div>

                      <div className="space-y-2 py-1">
                        <div
                          className={`flex items-center justify-between p-2.5 rounded-lg border ${
                            teamA.isWinner
                              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold"
                              : "bg-white dark:bg-[#0B0E16] border-[#E2E8F0] dark:border-[#242C3D] text-[#0F172A] dark:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-[#E56A10]/10 text-[#E56A10] font-mono font-bold text-xs flex items-center justify-center">
                              {teamA.tag || "A"}
                            </div>
                            <span className="text-xs font-semibold truncate max-w-[180px]">
                              {teamA.name || "TBD (Contender A)"}
                            </span>
                          </div>
                          <span className="text-sm font-mono font-bold tabular-nums">
                            {teamA.score ?? "-"}
                          </span>
                        </div>

                        <div
                          className={`flex items-center justify-between p-2.5 rounded-lg border ${
                            teamB.isWinner
                              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold"
                              : "bg-white dark:bg-[#0B0E16] border-[#E2E8F0] dark:border-[#242C3D] text-[#0F172A] dark:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-[#E56A10]/10 text-[#E56A10] font-mono font-bold text-xs flex items-center justify-center">
                              {teamB.tag || "B"}
                            </div>
                            <span className="text-xs font-semibold truncate max-w-[180px]">
                              {teamB.name || "TBD (Contender B)"}
                            </span>
                          </div>
                          <span className="text-sm font-mono font-bold tabular-nums">
                            {teamB.score ?? "-"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-[#242C3D] text-[11px] font-mono">
                        <span className="text-[#64748B] dark:text-[#94A3B8]">
                          {m.scheduledTime || m.scheduled_time || "Time TBD"}
                        </span>
                        <button
                          onClick={() => handleSelectBracketMatch(m)}
                          className="px-3 py-1.5 bg-[#E56A10] hover:bg-[#D45900] text-white rounded font-bold uppercase transition-colors cursor-pointer"
                        >
                          Open Lobby
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "rosters" && (
          <div className="bg-white dark:bg-[#121622] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#242C3D] shadow-xs">
            <h2 className="text-xl font-bold font-headline text-[#0F172A] dark:text-white mb-4">
              {isSoloGame ? `Confirmed Contenders (${safeRosters.length})` : `Confirmed Team Lineups (${safeRosters.length})`}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeRosters.map((roster, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#F8F9FA] dark:bg-[#161A24] rounded-xl border border-[#E2E8F0] dark:border-[#242C3D] flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-[#0B0E16] text-[#F59E0B] font-headline font-bold flex items-center justify-center text-xs">
                        {roster.tag}
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-sm text-[#0F172A] dark:text-white">
                          {roster.name}
                        </h4>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                          {isSoloGame ? `Player: @${roster.captain}` : `Captain: @${roster.captain}`}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border dark:border-emerald-500/30 text-[10px] font-mono font-bold rounded">
                      SEEDED
                    </span>
                  </div>

                  {!isSoloGame && (
                    <div className="text-[11px] font-mono text-[#475569] dark:text-[#94A3B8] border-t border-[#E2E8F0] dark:border-[#242C3D] pt-2">
                      <span className="text-[#64748B] dark:text-[#94A3B8] block mb-1">Team Members:</span>
                      <div className="flex flex-wrap gap-1">
                        {(roster.members || []).map((m, mIdx) => (
                          <span
                            key={mIdx}
                            className="px-2 py-0.5 bg-white dark:bg-[#0B0E16] border border-[#E2E8F0] dark:border-[#242C3D] text-slate-700 dark:text-slate-300 rounded text-[10px]"
                          >
                            @{m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {safeRosters.length === 0 && (
                <div className="col-span-2 text-center text-[#64748B] py-8 text-xs font-mono">
                  {isSoloGame
                    ? "No confirmed contenders yet. Register to secure your tournament slot!"
                    : "No confirmed teams yet. Be the first captain to register your roster!"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <RegisterTournamentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        tournament={currentTournament as any}
        onRegistrationSuccess={() => {
          setIsRegistered(true);
        }}
      />

      {/* Match Lobby Modal */}
      <MatchLobbyModal
        match={selectedBracketMatch}
        isOpen={!!selectedBracketMatch}
        onClose={() => setSelectedBracketMatch(null)}
        onSubmitEvidence={(match) => {
          setSelectedBracketMatch(null);
          setActiveEvidenceMatch(match);
        }}
      />

      {/* Evidence Submission Modal */}
      <EvidenceSubmissionModal
        match={activeEvidenceMatch}
        isOpen={!!activeEvidenceMatch}
        onClose={() => setActiveEvidenceMatch(null)}
        onSuccess={() => {
          setActiveEvidenceMatch(null);
        }}
      />
    </div>
  );
}
