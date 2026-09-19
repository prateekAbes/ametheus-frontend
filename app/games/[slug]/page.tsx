"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { GAMES_DATA } from "@/lib/data/games";
import { TOURNAMENTS_DATA } from "@/lib/data/tournaments";
import { useTeamStore } from "@/lib/store/team-store";
import CreateTeamModal from "@/components/team/CreateTeamModal";
import JoinTeamModal from "@/components/team/JoinTeamModal";
import TeamRosterCard from "@/components/team/TeamRosterCard";
import {
  Shield,
  Users,
  UserPlus,
  Trophy,
  ArrowRight,
  Flame,
  Calendar,
  Clock,
  Server,
  Award,
  AlertTriangle,
  Check,
  CheckCircle,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function DedicatedGameHubPage({ params }: Props) {
  const resolvedParams = use(params);
  const game = GAMES_DATA.find((g) => g.slug === resolvedParams.slug);

  if (!game) {
    notFound();
  }

  const { teams, addExistingTeam, joinTeam, findTeamByCode } = useTeamStore(game.slug);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"live" | "completed">("live");

  // Tournaments matching this game
  const tournaments = TOURNAMENTS_DATA.filter(
    (t) => t.gameSlug === game.slug
  );

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F8F9FF] dark:bg-[#0B0E16] text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      {/* 1. Breadcrumbs Trail */}
      <div className="w-full bg-[#F1F3F5] dark:bg-[#121622] py-2 px-4 md:px-8 border-b border-[#E2E8F0] dark:border-[#242C3D] transition-colors">
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
            {game.name} ({game.tag})
          </span>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-8 w-full">
        {/* 2. Main Game Hero Banner Chassis (Stitch Spec) */}
        <section className="relative overflow-hidden rounded-xl bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] shadow-sm transition-colors">
          <div className="relative z-10 p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: Branding & Core Headings */}
            <div className="flex flex-col sm:flex-row items-start gap-5 max-w-3xl">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-[#0B0E16] flex-shrink-0 flex items-center justify-center shadow-md overflow-hidden">
                <Image
                  src={game.logoUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&auto=format&fit=crop"}
                  alt={game.name}
                  width={112}
                  height={112}
                  unoptimized
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1.5 right-1.5 px-1.5 bg-[#E56A10] text-white font-mono text-[9px] font-bold rounded">
                  {game.isTeamGame ? `${game.minTeamSize}v${game.minTeamSize}` : "1v1"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E56A10]/10 text-[#E56A10] text-[10px] font-mono font-bold rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E56A10] animate-pulse" />
                    OFFICIAL AMETHEUS DISCIPLINE
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F1F3F5] dark:bg-[#161A24] border dark:border-[#242C3D] text-[#0F172A] dark:text-slate-200 text-[10px] font-mono rounded">
                    <Shield className="w-3.5 h-3.5 text-[#E56A10]" />
                    {game.antiCheat}
                  </span>
                  <span className="px-2 py-0.5 bg-[#F1F3F5] dark:bg-[#161A24] border dark:border-[#242C3D] text-[#64748B] dark:text-[#94A3B8] text-[10px] font-mono rounded">
                    {game.serverRegion}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-bold font-headline text-[#0F172A] dark:text-white tracking-tight uppercase mt-1">
                  {game.name} Competitive Tournaments
                </h1>

                <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] max-w-2xl leading-relaxed">
                  {game.description}
                </p>
              </div>
            </div>

            {/* Right: Key Telemetry */}
            <div className="flex items-center gap-6 lg:border-l border-[#E2E8F0] dark:border-[#242C3D] lg:pl-8 flex-shrink-0 w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase">Active Pool</span>
                <span className="text-2xl sm:text-3xl font-bold font-headline text-[#E56A10] tabular-nums">
                  {game.activePool}
                </span>
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Secured in Escrow</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase">Active Brackets</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold font-headline text-[#0F172A] dark:text-white tabular-nums">
                    0{game.activeTournaments}
                  </span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border dark:border-emerald-500/30 text-[10px] font-mono font-bold rounded">
                    LIVE
                  </span>
                </div>
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">32 Max Slots/Cup</span>
              </div>
            </div>
          </div>

          {/* Technical Telemetry Strip */}
          <div className="bg-[#F8F9FA] dark:bg-[#161A24] px-6 py-3 border-t border-[#E2E8F0] dark:border-[#242C3D] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs transition-colors">
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] font-mono block">Squad Size</span>
              <span className="font-semibold text-[#0F172A] dark:text-white">
                {game.isTeamGame ? `${game.minTeamSize} Players (Fixed)` : "Solo Contender"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] font-mono block">Substitutes</span>
              <span className="font-semibold text-red-600 dark:text-red-400">STRICTLY PROHIBITED</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] font-mono block">Match Protocol</span>
              <span className="font-semibold text-[#0F172A] dark:text-white">{game.matchProtocol}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] font-mono block">Anti-Cheat</span>
              <span className="font-semibold text-[#0F172A] dark:text-white">{game.antiCheat}</span>
            </div>
          </div>
        </section>

        {/* 3. Contextual Team Action Panel (Exclusive Origin Zone: Phase 8) */}
        <section className="bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] rounded-xl p-6 shadow-sm flex flex-col gap-6 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F1F3F5] dark:border-[#242C3D] pb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#E56A10]/10 flex items-center justify-center text-[#E56A10] flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E56A10]">
                    CONTEXTUAL SQUAD MANAGEMENT
                  </span>
                  <span className="px-1.5 py-0.5 bg-[#F1F3F5] dark:bg-[#161A24] border dark:border-[#242C3D] text-[#64748B] dark:text-[#94A3B8] text-[10px] font-mono rounded font-bold">
                    ₹0 JOIN FEE
                  </span>
                </div>
                <h2 className="text-xl font-bold font-headline text-[#0F172A] dark:text-white">
                  Form Or Join A {game.name} Team
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Teams are created specifically for {game.name}. Create a team to generate a unique 6-character code, or enter an invite code to join a friend&apos;s roster.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Team</span>
              </button>

              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="px-4 py-2.5 bg-[#0F172A] dark:bg-[#161A24] hover:bg-[#1E293B] dark:hover:bg-[#202534] text-white border border-transparent dark:border-[#242C3D] text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Join Team</span>
              </button>
            </div>
          </div>

          {/* Active Squads for this game */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-[#64748B] tracking-wider mb-3">
              Your Active {game.name} Squads ({teams.length})
            </h3>
            {teams.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {teams.map((t) => (
                  <TeamRosterCard key={t.id} team={t} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#F8F9FA] border border-dashed border-[#CBD5E1] rounded-xl text-[#64748B] text-xs">
                You have not formed or joined any {game.name} squad yet. Click &quot;Create Team&quot; or &quot;Join Team&quot; above to begin competing.
              </div>
            )}
          </div>
        </section>

        {/* 4. Open Tournaments Grid (Stitch Spec) */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E56A10]">
                OFFICIAL COMPETITIVE BRACKETS
              </span>
              <h2 className="text-2xl font-bold font-headline text-[#0F172A]">
                Open Tournaments
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
              <span>Next Bracket Starts:</span>
              <span className="text-[#0F172A] dark:text-white font-bold">18:00 IST Today</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tournaments.map((t) => (
              <article
                key={t.id}
                className="bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] hover:border-[#CBD5E1] dark:hover:border-[#E56A10]/50 rounded-xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Banner */}
                  <div className="relative h-40 w-full overflow-hidden bg-[#0B0E16]">
                    <Image
                      src={t.bannerUrl}
                      alt={t.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${t.badgeColor}`}>
                        {t.statusLabel}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                      <div>
                        <span className="text-[10px] text-[#F59E0B] font-mono font-bold uppercase block">
                          Prize Pool
                        </span>
                        <span className="text-xl font-bold font-headline">
                          {t.prizePool}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#CBD5E1] font-mono uppercase block">
                          Team Pass
                        </span>
                        <span className="text-sm font-bold font-mono">
                          {t.entryFee}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col gap-3">
                    <div>
                      <h3 className="font-headline font-bold text-base text-[#0F172A] dark:text-white group-hover:text-[#E56A10] transition-colors leading-snug">
                        {t.title}
                      </h3>
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-mono block mt-1">
                        {t.format}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-[#F8F9FA] dark:bg-[#161A24] rounded-lg p-3 flex flex-col gap-1.5 border border-[#E2E8F0] dark:border-[#242C3D]">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#64748B] dark:text-[#94A3B8]">SLOT FILL STATUS</span>
                        <span className="text-[#0F172A] dark:text-white font-bold">
                          {t.registeredTeams} / {t.maxTeams || 16} Teams
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] dark:bg-[#242C3D] overflow-hidden">
                        <div
                          className="h-full bg-[#E56A10] rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round((t.registeredTeams / (t.maxTeams || 16)) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                        <span>{Math.max(0, (t.maxTeams || 16) - t.registeredTeams)} slots remaining</span>
                        <span>Starts Soon</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#E56A10]" />
                        <span>{t.startsAt.split(",")[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#E56A10]" />
                        <span>{t.startsAt.split(",")[1] || "18:00 IST"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-[#E56A10]" />
                        <span className="truncate">Mumbai Node</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#E56A10]" />
                        <span className="truncate">{t.rankRequirement.replace("Rank: ", "")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="p-5 pt-0">
                  <Link
                    href={`/tournaments/${t.slug || t.id}`}
                    className="w-full py-2.5 bg-[#F1F3F5] dark:bg-[#161A24] hover:bg-[#E56A10] dark:hover:bg-[#E56A10] text-[#0F172A] dark:text-white hover:text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 border border-[#E2E8F0] dark:border-[#242C3D] cursor-pointer"
                  >
                    <span>View Tournament &amp; Rules</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 5. Live Matches & Completed Archive Tabs */}
        <section className="bg-white dark:bg-[#121622] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#242C3D] shadow-sm flex flex-col gap-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F3F5] dark:border-[#242C3D] pb-3">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab("live")}
                className={`text-sm font-bold font-headline uppercase tracking-wider pb-3 -mb-3.5 transition-colors cursor-pointer ${
                  activeTab === "live"
                    ? "text-[#E56A10] border-b-2 border-[#E56A10]"
                    : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
                }`}
              >
                Live Matches In-Progress (2)
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`text-sm font-bold font-headline uppercase tracking-wider pb-3 -mb-3.5 transition-colors cursor-pointer ${
                  activeTab === "completed"
                    ? "text-[#E56A10] border-b-2 border-[#E56A10]"
                    : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
                }`}
              >
                Completed Archive (48)
              </button>
            </div>
            <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
              AUTO-REFRESH INTERVAL: 30S
            </span>
          </div>

          {activeTab === "live" ? (
            <div className="flex flex-col gap-3">
              <div className="bg-[#F8F9FA] dark:bg-[#161A24] rounded-lg p-4 border border-[#E2E8F0] dark:border-[#242C3D] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-[10px] font-mono font-bold rounded flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    MAP 2 // ROUND 18
                  </span>
                  <div>
                    <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase block">
                      Challengers Qualifier #09 • Quarter-Final
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-sm text-[#0F172A] dark:text-white">Team Enigma</span>
                      <span className="px-2 py-0.5 bg-[#E2E8F0] dark:bg-[#242C3D] font-mono font-bold text-xs rounded text-[#0F172A] dark:text-white">
                        11 - 07
                      </span>
                      <span className="font-bold text-sm text-[#0F172A] dark:text-white">Mumbai Titans</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">
                  <span>MAP: ASCENT</span>
                  <Link
                    href="/tournaments"
                    className="px-3 py-1.5 bg-[#0F172A] dark:bg-[#E56A10] hover:bg-[#1E293B] dark:hover:bg-[#D45900] text-white rounded font-bold uppercase tracking-wider text-[11px] transition-colors"
                  >
                    Watch Live Bracket
                  </Link>
                </div>
              </div>

              <div className="bg-[#F8F9FA] dark:bg-[#161A24] rounded-lg p-4 border border-[#E2E8F0] dark:border-[#242C3D] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-[10px] font-mono font-bold rounded flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    MAP 1 // OVERTIME
                  </span>
                  <div>
                    <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase block">
                      Weekend Rapid Blitz #03 • Grand Final
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-sm text-[#0F172A] dark:text-white">Vortex Alpha</span>
                      <span className="px-2 py-0.5 bg-[#E2E8F0] dark:bg-[#242C3D] font-mono font-bold text-xs rounded text-[#0F172A] dark:text-white">
                        13 - 12
                      </span>
                      <span className="font-bold text-sm text-[#0F172A] dark:text-white">Sinister Gaming</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">
                  <span>MAP: BIND</span>
                  <Link
                    href="/tournaments"
                    className="px-3 py-1.5 bg-[#0F172A] dark:bg-[#E56A10] hover:bg-[#1E293B] dark:hover:bg-[#D45900] text-white rounded font-bold uppercase tracking-wider text-[11px] transition-colors"
                  >
                    Watch Live Bracket
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F8F9FA] dark:bg-[#161A24] text-[#64748B] dark:text-[#94A3B8] font-mono text-[10px] uppercase">
                    <th className="p-3">Tournament</th>
                    <th className="p-3">Champion Squad</th>
                    <th className="p-3">Runner Up</th>
                    <th className="p-3 text-right">Prize Disbursed</th>
                    <th className="p-3 text-right">Escrow Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F3F5] dark:divide-[#242C3D]">
                  <tr>
                    <td className="p-3 font-semibold text-[#0F172A] dark:text-white">AMETHEUS Valorant Open #00</td>
                    <td className="p-3 font-bold text-[#E56A10]">Godspeed Esports</td>
                    <td className="p-3 text-[#64748B] dark:text-[#94A3B8]">Phoenix 5</td>
                    <td className="p-3 text-right font-mono font-bold text-[#0F172A] dark:text-white">₹5,000</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded font-mono text-[10px]">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#0F172A] dark:text-white">Monsoon Valorant Showdown</td>
                    <td className="p-3 font-bold text-[#E56A10]">Reckoning Gaming</td>
                    <td className="p-3 text-[#64748B] dark:text-[#94A3B8]">True Rippers</td>
                    <td className="p-3 text-right font-mono font-bold text-[#0F172A] dark:text-white">₹20,000</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded font-mono text-[10px]">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 6. Regulatory Code & Discipline Rules Accordion */}
        <section className="flex flex-col gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E56A10]">
              REGULATORY CODE &amp; STANDARDS
            </span>
            <h2 className="text-2xl font-bold font-headline text-[#0F172A] dark:text-white">
              {game.name} Discipline Protocols
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#121622] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#242C3D] shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#E56A10]/10 flex items-center justify-center text-[#E56A10]">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-headline font-bold text-base text-[#0F172A] dark:text-white">
                  1. Team &amp; Roster Integrity
                </h3>
                <ul className="space-y-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#E56A10] flex-shrink-0 mt-0.5" />
                    <span><strong>Fixed 5 Players:</strong> Zero substitutes permitted. All 5 participants must play all matches.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#E56A10] flex-shrink-0 mt-0.5" />
                    <span><strong>Riot ID Binding:</strong> Riot ID &amp; Tag must match verified Ametheus profile exactly.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#E56A10] flex-shrink-0 mt-0.5" />
                    <span><strong>Anti-Smurf Hardware Locks:</strong> Players bound by HWID. Multi-accounting triggers instant DQ.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono border-t border-[#F1F3F5] dark:border-[#242C3D] mt-4">
                RULESET CODE: VAL-ROST-2026.1
              </div>
            </div>

            <div className="bg-white dark:bg-[#121622] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#242C3D] shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="font-headline font-bold text-base text-[#0F172A] dark:text-white">
                  2. Match &amp; Server Settings
                </h3>
                <ul className="space-y-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#E56A10] flex-shrink-0 mt-0.5" />
                    <span><strong>Custom Game Mode:</strong> Standard 5v5 Tactical with Tournament Mode toggled <strong>ON</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#E56A10] flex-shrink-0 mt-0.5" />
                    <span><strong>Overtime Rules:</strong> Win by 2 standard overtime rounds active for all bracket stages.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#E56A10] flex-shrink-0 mt-0.5" />
                    <span><strong>Server Region:</strong> Mumbai AWS Data Center (AP-South-1) mandatory unless bilateral ping agreement.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono border-t border-[#F1F3F5] dark:border-[#242C3D] mt-4">
                RULESET CODE: VAL-SRV-APSOUTH1
              </div>
            </div>

            <div className="bg-white dark:bg-[#121622] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#242C3D] shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-headline font-bold text-base text-[#0F172A] dark:text-white">
                  3. Verification &amp; Escrow Payout
                </h3>
                <ul className="space-y-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#E56A10] flex-shrink-0 mt-0.5" />
                    <span><strong>Winning Captain Report:</strong> Winning captain must upload full uncropped scorecard within 15 min.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#E56A10] flex-shrink-0 mt-0.5" />
                    <span><strong>Automated Telemetry:</strong> System reads kills, K/D, round count, and validates matching IDs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#E56A10] flex-shrink-0 mt-0.5" />
                    <span><strong>Instant Escrow Payout:</strong> Direct UPI &amp; IMPS prize disbursement dispatched within 30 minutes of final certification.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono border-t border-[#F1F3F5] dark:border-[#242C3D] mt-4">
                RULESET CODE: VAL-ESCROW-V10
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        gameSlug={game.slug}
        gameName={game.name}
        onTeamCreated={(newTeam) => {
          addExistingTeam(newTeam);
        }}
      />

      <JoinTeamModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        gameSlug={game.slug}
        gameName={game.name}
        findTeamByCode={findTeamByCode}
        onTeamJoined={(team) => {
          // Joined team handled
        }}
      />
    </div>
  );
}
