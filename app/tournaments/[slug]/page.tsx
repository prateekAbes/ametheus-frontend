"use client";

import { useEffect, use, useState } from "react";
import { getTournamentBySlug, normalizeTournament, NormalizedTournament } from "@/lib/api/tournaments";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TOURNAMENTS_DATA } from "@/lib/data/tournaments";
import { useTeamStore } from "@/lib/store/team-store";
import BracketTree from "@/components/tournament/BracketTree";
import RegisterTournamentModal from "@/components/tournament/RegisterTournamentModal";
import JoinTeamModal from "@/components/team/JoinTeamModal";
import MatchLobbyModal from "@/components/match/MatchLobbyModal";
import EvidenceSubmissionModal from "@/components/match/EvidenceSubmissionModal";
import { MatchLobbyInfo, BracketMatch } from "@/types";
import {
  Shield,
  Trophy,
  Calendar,
  Clock,
  Server,
  Award,
  Users,
  Check,
  CheckCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  UserPlus,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function TournamentDetailPage({ params }: Props) {
  const resolvedParams = use(params);
  const staticMatch = TOURNAMENTS_DATA.find(
    (t) => t.slug === resolvedParams.slug || t.id === resolvedParams.slug
  );

  const [tournament, setTournament] = useState<NormalizedTournament | null>(() =>
    staticMatch ? normalizeTournament(staticMatch) : null
  );

  useEffect(() => {
    getTournamentBySlug(resolvedParams.slug)
      .then((data) => {
        if (data) {
          setTournament(normalizeTournament(data));
        }
      })
      .catch(() => {
        // Retain static fallback
      });
  }, [resolvedParams.slug]);

  const activeTourn = tournament || (staticMatch ? normalizeTournament(staticMatch) : null);

  if (!activeTourn) {
    notFound();
  }

  // Narrowed non-null reference
  const currentTournament: NormalizedTournament = activeTourn;
  const { teams, findTeamByCode } = useTeamStore(currentTournament.gameSlug);

  const [activeTab, setActiveTab] = useState<
    "overview" | "schedule" | "prizes" | "bracket" | "rosters"
  >("overview");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [selectedBracketMatch, setSelectedBracketMatch] = useState<MatchLobbyInfo | null>(null);
  const [activeEvidenceMatch, setActiveEvidenceMatch] = useState<MatchLobbyInfo | null>(null);

  const handleSelectBracketMatch = (bm: BracketMatch) => {
    const lobbyInfo: MatchLobbyInfo = {
      id: bm.id,
      tournamentId: currentTournament.id,
      tournamentTitle: currentTournament.title,
      gameSlug: currentTournament.gameSlug,
      gameName: currentTournament.gameName,
      stage: `Round ${bm.round} — Match #${bm.matchNumber}`,
      format: currentTournament.format,
      scheduledTime: bm.scheduledTime || "Scheduled Bracket Match",
      status: (bm.status as any) || "CHECK_IN_OPEN",
      serverRegion: currentTournament.serverRegion,
      lobbyCode: `AMT-${bm.id.slice(0, 8).toUpperCase()}`,
      lobbyPassword: "ESCROW_VANGUARD_99",
      teamA: {
        id: bm.teamA.tag || "t-a",
        name: bm.teamA.name || "TBD (Slot 1)",
        tag: bm.teamA.tag || "TBD",
        logoUrl: "",
        score: bm.teamA.score,
        isCheckedIn: true,
        roster: [{ username: `${bm.teamA.tag || "Player"}_1`, gameId: `${bm.teamA.tag || "P"}#1` }],
      },
      teamB: {
        id: bm.teamB.tag || "t-b",
        name: bm.teamB.name || "TBD (Slot 2)",
        tag: bm.teamB.tag || "TBD",
        logoUrl: "",
        score: bm.teamB.score,
        isCheckedIn: true,
        roster: [{ username: `${bm.teamB.tag || "Player"}_1`, gameId: `${bm.teamB.tag || "P"}#1` }],
      },
    };
    setSelectedBracketMatch(lobbyInfo);
  };

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Summary (Stitch Screen 4 Spec) */}
      <section className="relative w-full overflow-hidden bg-white border-b border-[#E2E8F0] py-8">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E56A10] text-white text-xs font-mono font-bold rounded uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {currentTournament.statusLabel}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F1F3F5] text-[#0F172A] text-xs font-mono rounded">
              <Shield className="w-3.5 h-3.5 text-[#E56A10]" />
              AMETHEUS ESCROW GUARANTEED
            </span>
            <span className="px-2.5 py-1 bg-[#F1F3F5] text-[#64748B] text-xs font-mono rounded">
              SERVER: {currentTournament.serverRegion}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col justify-between">
              <div>
                <h1 className="text-3xl sm:text-5xl font-bold font-headline uppercase tracking-tight text-[#0F172A]">
                  {currentTournament.title}
                </h1>
                <p className="text-sm sm:text-base text-[#475569] mt-2 max-w-2xl leading-relaxed">
                  {currentTournament.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-6 text-xs text-[#64748B] font-mono">
                <div>
                  <strong className="text-[#0F172A]">Discipline:</strong> {currentTournament.gameName}
                </div>
                <div>
                  <strong className="text-[#0F172A]">Roster Lock:</strong> {currentTournament.rosterLockTime}
                </div>
                <div>
                  <strong className="text-[#0F172A]">Launch:</strong> {currentTournament.startsAt}
                </div>
              </div>
            </div>

            {/* Entry Fee Box & Direct Action */}
            <div className="lg:col-span-4 bg-[#F8F9FA] p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">
                    Entry Fee Structure
                  </span>
                  <span className="font-bold text-sm text-[#0F172A]">
                    Squad Registration
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-[#E56A10]/10 text-[#E56A10] text-[10px] font-mono font-bold rounded">
                  100% SECURE ESCROW
                </span>
              </div>

              <div className="my-3 space-y-2">
                <div className="p-3 bg-white rounded border border-[#E56A10]/30">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-mono font-bold text-[#E56A10] uppercase">
                      Captain Slot (Host)
                    </span>
                    <span className="font-headline font-bold text-xl text-[#E56A10]">
                      {currentTournament.entryFee}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-0.5">
                    Single payment pays for all 5 team seats.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 rounded border border-emerald-500/30">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-mono font-bold text-emerald-800 uppercase">
                      Teammate Slots (4 Players)
                    </span>
                    <span className="font-headline font-bold text-lg text-emerald-700">
                      ₹0 Free
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-900 mt-0.5">
                    Join instantly using Captain&apos;s 6-character squad code.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {isRegistered ? (
                  <div className="p-3 bg-emerald-100 text-emerald-800 font-bold text-xs rounded text-center font-mono">
                    ✓ YOUR SQUAD IS REGISTERED &amp; SEEDED
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setIsRegisterModalOpen(true)}
                      className="w-full py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-xs"
                    >
                      Register Squad — {currentTournament.entryFee}
                    </button>
                    <button
                      onClick={() => setIsJoinModalOpen(true)}
                      className="w-full py-2 bg-white hover:bg-[#F1F3F5] border border-[#CBD5E1] text-[#0F172A] font-bold text-xs uppercase tracking-wider rounded transition-colors"
                    >
                      Join Squad with Code — ₹0
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Metric Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-[#F8F9FA] p-4 rounded-lg border border-[#E2E8F0]">
              <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                Total Prize Escrow
              </span>
              <div className="text-2xl font-bold font-headline text-[#E56A10] mt-0.5 tabular-nums">
                {currentTournament.prizePool}
              </div>
              <span className="text-[11px] text-[#64748B] font-mono">
                100% Escrow Backed
              </span>
            </div>

            <div className="bg-[#F8F9FA] p-4 rounded-lg border border-[#E2E8F0]">
              <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                Squad Composition
              </span>
              <div className="text-2xl font-bold font-headline text-[#0F172A] mt-0.5">
                5 Players
              </div>
              <span className="text-[11px] text-red-600 font-mono font-bold">
                Zero Substitutes Allowed
              </span>
            </div>

            <div className="bg-[#F8F9FA] p-4 rounded-lg border border-[#E2E8F0]">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-[#64748B] uppercase">Tournament Bracket</span>
                <span className="text-[#E56A10] font-bold">
                  {currentTournament.registeredTeams} / {currentTournament.maxTeams} Teams
                </span>
              </div>
              <div className="text-2xl font-bold font-headline text-[#0F172A] mt-0.5">
                {Math.round((currentTournament.registeredTeams / currentTournament.maxTeams) * 100)}% Filled
              </div>
              <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-[#E56A10] h-full rounded-full"
                  style={{
                    width: `${(currentTournament.registeredTeams / currentTournament.maxTeams) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-[#F8F9FA] p-4 rounded-lg border border-[#E2E8F0]">
              <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                Match Adjudication
              </span>
              <div className="text-2xl font-bold font-headline text-[#0F172A] mt-0.5">
                Single Elim
              </div>
              <span className="text-[11px] text-[#64748B] font-mono">
                Bo1 Rounds // Bo3 Final
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sticky Tab Controls */}
      <nav className="sticky top-16 z-40 bg-white border-b border-[#E2E8F0] shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between overflow-x-auto py-2">
          <div className="flex items-center gap-2 font-mono text-xs whitespace-nowrap">
            {[
              { id: "overview", label: "Overview & Rules" },
              { id: "schedule", label: "Schedule & Timeline" },
              { id: "prizes", label: "Prize Distribution" },
              { id: "bracket", label: "Live Bracket" },
              { id: "rosters", label: `Rosters (${currentTournament.registeredRosters.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 rounded text-xs font-bold uppercase transition-colors ${
                  activeTab === t.id
                    ? "bg-[#E56A10] text-white"
                    : "bg-[#F1F3F5] text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-[#64748B]">
            <span>OFFICIAL ESCROW NODE:</span>
            <span className="px-2 py-0.5 bg-[#F1F3F5] text-[#0F172A] font-bold rounded">
              RZP-PAID-SECURE
            </span>
          </div>
        </div>
      </nav>

      {/* 3. Main Tab Contents */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full">
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8">
            {/* Rules Matrix */}
            <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-xs">
              <h2 className="text-xl font-bold font-headline text-[#0F172A] mb-4">
                Tournament Regulations &amp; Protocols
              </h2>
              <ul className="space-y-3 text-xs text-[#475569]">
                {currentTournament.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#E56A10] flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-xs">
            <h2 className="text-xl font-bold font-headline text-[#0F172A] mb-4">
              Schedule &amp; Match Progression
            </h2>
            <div className="space-y-4">
              {currentTournament.schedule.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-sm text-[#0F172A] block">
                      {item.stage}
                    </span>
                    <span className="text-[#64748B] mt-0.5 block">{item.details}</span>
                  </div>
                  <span className="px-3 py-1 bg-white border border-[#CBD5E1] rounded font-mono font-bold text-[#E56A10] whitespace-nowrap">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "prizes" && (
          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-xs">
            <h2 className="text-xl font-bold font-headline text-[#0F172A] mb-2">
              Prize Pool Distribution
            </h2>
            <p className="text-xs text-[#64748B] mb-6">
              Total Escrow Backed: <strong className="text-[#E56A10]">{currentTournament.prizePool}</strong>. Payouts processed automatically within 30 minutes of final match verification.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {currentTournament.prizes.map((p, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] flex flex-col justify-between"
                >
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded self-start ${p.badge}`}>
                    {p.rank}
                  </span>
                  <div className="my-4">
                    <span className="text-3xl font-bold font-headline text-[#0F172A] tabular-nums block">
                      {p.amount}
                    </span>
                    <span className="text-xs text-[#64748B] font-mono">
                      {p.share} of total pool
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-mono font-bold">
                    ✓ Instant Razorpay Disbursal
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "bracket" && (
          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold font-headline text-[#0F172A]">
                  Tournament Single-Elimination Bracket
                </h2>
                <p className="text-xs text-[#64748B]">
                  Live real-time match advancement. Winners auto-advance upon admin evidence certification.
                </p>
              </div>
              <span className="text-xs font-mono text-[#E56A10] font-bold">
                AUTO-REFRESH: ACTIVE
              </span>
            </div>

            <BracketTree
              rounds={currentTournament.bracketRounds}
              onSelectMatch={handleSelectBracketMatch}
            />
          </div>
        )}

        {activeTab === "rosters" && (
          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-xs">
            <h2 className="text-xl font-bold font-headline text-[#0F172A] mb-4">
              Confirmed Squad Rosters ({currentTournament.registeredRosters.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentTournament.registeredRosters.map((roster, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-[#0B0E16] text-[#F59E0B] font-headline font-bold flex items-center justify-center text-xs">
                        {roster.tag}
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-sm text-[#0F172A]">
                          {roster.name}
                        </h4>
                        <span className="text-[10px] text-[#64748B] font-mono">
                          Captain: @{roster.captain}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded">
                      SEEDED
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-[#475569] border-t border-[#E2E8F0] pt-2">
                    <span className="text-[#64748B] block mb-1">Squad Members:</span>
                    <div className="flex flex-wrap gap-1">
                      {roster.members.map((m, mIdx) => (
                        <span
                          key={mIdx}
                          className="px-2 py-0.5 bg-white border border-[#E2E8F0] rounded text-[10px]"
                        >
                          @{m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <RegisterTournamentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        tournament={currentTournament as any}
        userTeams={teams}
        onRegistrationSuccess={() => {
          setIsRegistered(true);
        }}
      />

      {/* Join Team Modal */}
      <JoinTeamModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        gameSlug={currentTournament.gameSlug}
        gameName={currentTournament.gameName}
        findTeamByCode={findTeamByCode}
        onTeamJoined={() => {}}
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
