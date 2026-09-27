"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  BookOpen,
  Clock,
  Scale,
  Gamepad2,
  Lock,
  ArrowRight,
  Ban,
  UserCheck,
  FileCheck,
  Table as TableIcon,
  RefreshCw,
} from "lucide-react";
import {
  getRegulations,
  getRegulationTables,
  GameRegulation,
  RegulationTable,
} from "@/lib/api/regulations";

const SECTIONS = [
  { id: "eligibility", label: "Participant Eligibility" },
  { id: "registration", label: "Registration & Rosters" },
  { id: "matchday", label: "Check-In & Lobbies" },
  { id: "gamespecific", label: "Game Discipline Regulations" },
  { id: "tables", label: "Master Regulation Matrix" },
  { id: "reporting", label: "Result Reporting" },
  { id: "anticheat", label: "Anti-Cheat & Conduct" },
  { id: "payouts", label: "Prize Vault Payouts" },
];

const DEFAULT_REGULATIONS: GameRegulation[] = [
  {
    id: "reg_bgmi",
    game_name: "BGMI",
    chapter_code: "BGMI-01",
    title: "Battlegrounds Mobile India (BGMI)",
    format: "Squads 4v4 / Battle Royale | Multi-Match Points System",
    server: "Official Krafton Custom Esports Room (Mumbai Data Center)",
    map_pool: ["Erangel", "Miramar", "Sanhok"],
    rules: [
      "Roster Size: 4 active players per squad. All players must use registered in-game IDs (UIDs).",
      "Scoring System: Official BGIS 10-point matrix (1st: 10pts, 2nd: 6pts, 3rd: 5pts, 4th: 4pts, 5th: 3pts, 6th: 2pts, 7th-8th: 1pt) + 1 point per kill.",
      "Devices: Mobile phones only (iOS / Android). Emulators, iPad, tablets, triggers, and macros are strictly prohibited.",
      "Result Evidence: Captains must submit an uncropped end-game results screenshot showing team rank and kills.",
    ],
    order: 1,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "reg_valorant",
    game_name: "VALORANT",
    chapter_code: "VAL-01",
    title: "Valorant (5v5 Tactical Shooter)",
    format: "Standard 5v5 | Single Elimination Bracket | Best-of-1 (Finals BO3)",
    server: "AWS Mumbai (ap-south-1) — 128 Tick",
    map_pool: ["Ascent", "Haven", "Bind", "Split", "Sunset", "Lotus", "Abyss"],
    rules: [
      "Roster Size: Exactly 5 active players + up to 1 optional substitute registered before roster lock.",
      "Overtime: Standard 2-round win margin overtime (Win by 2 rounds).",
      "Anti-Cheat: Riot Vanguard must be running with TPM 2.0 and Secure Boot enabled. Any Vanguard violation results in permanent ban.",
      "Cheats & Glitches: Deliberate use of map exploits (Cypher camera glitches, Sova dart out-of-bounds) forfeits the round.",
      "Pauses: Each team receives one 60-second tactical timeout per half. Max 5 minutes technical pause per match upon arbiter approval.",
    ],
    order: 2,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "reg_freefire",
    game_name: "Free Fire MAX",
    chapter_code: "FF-01",
    title: "Free Fire MAX",
    format: "Clash Squad 4v4 / Battle Royale",
    server: "India Region Dedicated Esports Server",
    map_pool: ["Bermuda", "Purgatory", "Kalahari"],
    rules: [
      "Roster Size: 4 players per roster registered under identical team tag.",
      "Emulators: PC emulators (BlueStacks, LDPlayer, Nox) are strictly banned. Violations trigger immediate bracket forfeiture.",
      "Character Skills: Gun attribute skins must be set to 'Off/Default' when specified by the tournament lobby host.",
      "Proof of Victory: Full victory screen screenshot displaying all elimination counts must be submitted within 15 minutes.",
    ],
    order: 3,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "reg_codm",
    game_name: "Call of Duty: Mobile",
    chapter_code: "COD-01",
    title: "Call of Duty: Mobile (CODM)",
    format: "5v5 Search & Destroy / Hardpoint",
    server: "India South Low-Latency Dedicated Matchmaking",
    map_pool: ["Crash", "Firing Range", "Raid", "Summit", "Standoff", "Tunisia"],
    rules: [
      "Roster Size: 5 players per squad. Substitutes must be listed prior to tournament check-in.",
      "Banned Equipment: NA-45, Akimbo perks, Persistence perk, Heartbeat Sensor, and Operator Skills when specified.",
      "Touch Controls Only: Controllers and emulators are completely barred from certified competitive cups.",
    ],
    order: 4,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "reg_cs2",
    game_name: "Counter-Strike 2",
    chapter_code: "CS2-01",
    title: "Counter-Strike 2 (5v5 MR12)",
    format: "5v5 Competitive MR12 | Single Elimination",
    server: "Valve South Asia (ap-south-1) Dedicated Server",
    map_pool: ["Mirage", "Inferno", "Nuke", "Ancient", "Anubis", "Dust II"],
    rules: [
      "Roster Size: 5 players per squad + 1 optional substitute registered before check-in.",
      "Anti-Cheat: VAC Live and server-side integrity telemetry active at all times.",
      "Overtime: MR3 (first to 4 rounds) with 10k start money.",
      "Tactical Pauses: 1 tactical pause of 30 seconds per half allowed per team.",
    ],
    order: 5,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

const DEFAULT_TABLES: RegulationTable[] = [
  {
    id: "tbl_discipline_matrix",
    title: "Game Discipline Regulations Master Matrix",
    description: "Standardized competitive framework, dynamic chapter codes, server regions, and mandatory rules.",
    columns: ["Game", "Chapter Code", "Format", "Server / Region", "Key Regulation"],
    rows: [
      ["BGMI", "BGMI-01", "Squads 4v4 / Battle Royale", "Krafton Dedicated Mumbai", "BGIS 10-point scoring; Mobile phones only (emulators banned)"],
      ["VALORANT", "VAL-01", "Standard 5v5 Tactical", "AWS Mumbai (ap-south-1) 128T", "Riot Vanguard TPM 2.0 required; standard overtime rules"],
      ["Free Fire MAX", "FF-01", "Clash Squad 4v4 / BR", "India Dedicated Esports", "Default gun attributes only; PC emulators strictly barred"],
      ["COD Mobile", "COD-01", "5v5 Search & Destroy", "India South Low-Latency", "Touch controls only; heartbeats and persistence banned"],
      ["CS2", "CS2-01", "Competitive 5v5 MR12", "Valve South Asia ap-south-1", "VAC Live & server anti-cheat; standard timeout protocols"],
    ],
    order: 1,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

export default function TournamentRulesPage() {
  const [activeSection, setActiveSection] = useState<string>("eligibility");
  const [regulations, setRegulations] = useState<GameRegulation[]>(DEFAULT_REGULATIONS);
  const [tables, setTables] = useState<RegulationTable[]>(DEFAULT_TABLES);
  const [selectedGameTab, setSelectedGameTab] = useState<string>("reg_bgmi");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dynamic regulations and tables from backend
  useEffect(() => {
    let isMounted = true;
    Promise.all([getRegulations(), getRegulationTables()])
      .then(([regsData, tablesData]) => {
        if (!isMounted) return;
        if (Array.isArray(regsData) && regsData.length > 0) {
          setRegulations(regsData);
          setSelectedGameTab(regsData[0].id);
        }
        if (Array.isArray(tablesData) && tablesData.length > 0) {
          setTables(tablesData);
        }
      })
      .catch((err) => {
        console.warn("Using offline default tournament regulations:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const activeRegulation = regulations.find((r) => r.id === selectedGameTab) || regulations[0];

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-[#0B1C30] flex flex-col">
      {/* 1. Header Banner */}
      <section className="w-full bg-[#EFF4FF] py-12 md:py-16 border-b border-[#D3E4FE]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E5EEFF] border border-[#CBD5E1] rounded text-[#E56A10] text-xs font-mono font-bold tracking-widest uppercase mb-4 shadow-xs">
            <BookOpen className="w-3.5 h-3.5" /> OFFICIAL COMPETITION RULEBOOK
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-headline text-[#0B1C30] uppercase tracking-tight">
            AMETHEUS Tournament Regulations &amp; Rules
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
            Standardized competitive regulations governing bracket seeding, roster eligibility, match day check-in, anti-cheat mandates, evidence submission, and prize vault guarantees across all sanctioned competitions.
          </p>
        </div>
      </section>

      {/* 2. Main Rulebook Container */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-12 grid grid-cols-1 lg:grid-cols-4 gap-10 w-full">
        {/* Table of Contents Sticky Sidebar */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-[#D3E4FE] rounded-xl p-5 sticky top-20 shadow-xs">
            <h3 className="text-xs font-bold font-mono uppercase text-[#0B1C30] tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#E56A10]" /> Rulebook Navigation
            </h3>
            <nav className="space-y-1 text-xs font-mono">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => handleNavClick(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all cursor-pointer font-bold ${
                    activeSection === sec.id
                      ? "bg-[#E56A10] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-mono text-slate-500">
              Need immediate arbiter assistance?
              <Link href="/contact" className="mt-2 inline-flex items-center gap-1 text-[#E56A10] font-bold hover:underline">
                Contact Arbiters <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Rulebook Content */}
        <div className="lg:col-span-3 space-y-10">
          {/* Section 1: Participant Eligibility */}
          <section id="eligibility" className="bg-white border border-[#D3E4FE] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#E56A10] font-mono text-xs font-bold uppercase tracking-wider">
              <UserCheck className="w-4 h-4" /> Eligibility Requirements
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-headline text-[#0B1C30] uppercase">
              Participant Eligibility &amp; Account Requirements
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-sans list-disc pl-5">
              <li><strong>Age Requirement:</strong> Contenders must be at least 16 years of age to register for certified prize-pool competitions.</li>
              <li><strong>Account Ownership:</strong> Players must compete using their own primary in-game accounts. Account sharing, smurfing, ringers, or impersonation result in immediate forfeiture.</li>
              <li><strong>Regional Eligibility:</strong> Matches are hosted on South Asia / Indian servers (AWS ap-south-1). Players must ensure their network latency allows competitive fairness.</li>
              <li><strong>Integrity Standing:</strong> Accounts with active bans from publisher anti-cheat software (VAC, Vanguard, BattlEye, Krafton Security) are barred from AMETHEUS tournaments.</li>
            </ul>
          </section>

          {/* Section 2: Registration & Roster Lock */}
          <section id="registration" className="bg-white border border-[#D3E4FE] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#E56A10] font-mono text-xs font-bold uppercase tracking-wider">
              <Lock className="w-4 h-4" /> Roster Protocol
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-headline text-[#0B1C30] uppercase">
              Registration, Fees &amp; Roster Lock
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-sans list-disc pl-5">
              <li><strong>Entry Fee Payment:</strong> Registration is confirmed only upon payment verification via direct UPI or wallet balance. Funds are deposited into the automated Prize Holding Vault.</li>
              <li><strong>Roster Freeze:</strong> Rosters are permanently locked 30 minutes prior to the tournament start time. No roster substitutions or additions can occur once the bracket is generated.</li>
              <li><strong>Team Size Compliance:</strong> Squads must meet the exact minimum player count for their chosen discipline (e.g. 5 for Valorant, 4 for BGMI).</li>
              <li><strong>Cancellation &amp; Refunds:</strong> If a team withdraws before the registration cutoff, their entry fee is refunded in full to their wallet. Withdrawals after roster lock forfeit the entry fee.</li>
            </ul>
          </section>

          {/* Section 3: Match Day Operations */}
          <section id="matchday" className="bg-white border border-[#D3E4FE] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#E56A10] font-mono text-xs font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4" /> Match Day Schedule
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-headline text-[#0B1C30] uppercase">
              Match Day Operations &amp; Check-In Protocol
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-sans list-disc pl-5">
              <li><strong>Mandatory Check-In:</strong> Both teams must check in inside the Match Lobby at least 15 minutes before the scheduled match hour.</li>
              <li><strong>Forfeit Grace Period:</strong> A strict 15-minute countdown clock begins at the scheduled match time. If a roster fails to arrive with all required players within 15 minutes, a default win is awarded to the attending team.</li>
              <li><strong>Lobby Room Credentials:</strong> Custom lobby room codes and passwords unlock automatically within the Match Lobby Modal once both team captains check in.</li>
            </ul>
          </section>

          {/* Section 4: Game-Specific Rules (Fully Dynamic) */}
          <section id="gamespecific" className="bg-white border border-[#D3E4FE] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 text-[#E56A10] font-mono text-xs font-bold uppercase tracking-wider">
              <Gamepad2 className="w-4 h-4" /> Sanctioned Disciplines ({regulations.length})
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-headline text-[#0B1C30] uppercase">
                Game Discipline Regulations
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Select any sanctioned game discipline to inspect official formats, dynamic chapter codes, map pools, and tournament mandates.
              </p>
            </div>

            {/* Dynamic Game Tab Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
              {regulations.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => setSelectedGameTab(reg.id)}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                    selectedGameTab === reg.id
                      ? "bg-[#E56A10] text-white border-[#E56A10] shadow-xs"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {reg.game_name}
                </button>
              ))}
            </div>

            {/* Active Game Details */}
            {activeRegulation && (
              <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-[#E56A10]/15 border border-[#E56A10]/40 text-[#E56A10] font-mono text-xs font-extrabold rounded">
                        {activeRegulation.chapter_code}
                      </span>
                      <h3 className="font-headline font-bold text-base text-[#0B1C30]">
                        {activeRegulation.title}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs font-mono text-slate-600">
                      <span><strong>Format:</strong> {activeRegulation.format}</span>
                      <span>•</span>
                      <span><strong>Server:</strong> {activeRegulation.server}</span>
                    </div>
                  </div>
                </div>

                {activeRegulation.map_pool && activeRegulation.map_pool.length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-500 mb-2">
                      Official Map Pool:
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeRegulation.map_pool.map((map) => (
                        <span key={map} className="px-2.5 py-1 bg-white border border-slate-200 text-xs font-mono text-slate-800 rounded font-bold shadow-2xs">
                          {map}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeRegulation.rules && activeRegulation.rules.length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-500 mb-2">
                      Special Discipline Rules:
                    </h4>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-700 list-disc pl-5 leading-relaxed font-sans">
                      {activeRegulation.rules.map((rule, idx) => (
                        <li key={idx}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Section: Dynamic Configurable Tables */}
          <section id="tables" className="bg-white border border-[#D3E4FE] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 text-[#E56A10] font-mono text-xs font-bold uppercase tracking-wider">
              <TableIcon className="w-4 h-4" /> Regulation Matrix
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-headline text-[#0B1C30] uppercase">
                Master Discipline Regulation Matrix
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Cross-discipline comparison matrix outlining dynamic chapter codes, competition formats, and official arbitration mandates.
              </p>
            </div>

            {tables.map((tbl) => (
              <div key={tbl.id} className="space-y-3">
                {tables.length > 1 && (
                  <h3 className="font-headline font-bold text-base text-[#0B1C30]">
                    {tbl.title}
                  </h3>
                )}
                {tbl.description && (
                  <p className="text-xs font-mono text-slate-600">
                    {tbl.description}
                  </p>
                )}

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[#0B1C30]">
                        {tbl.columns.map((c, idx) => (
                          <th key={idx} className="py-3 px-4 font-bold uppercase tracking-wider text-xs">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {tbl.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-3 px-4 font-sans text-xs">
                              {cIdx === 1 ? (
                                <span className="px-2 py-0.5 bg-[#E56A10]/10 border border-[#E56A10]/30 text-[#E56A10] font-mono font-bold rounded text-[11px]">
                                  {cell}
                                </span>
                              ) : (
                                cell || <span className="text-slate-400 italic">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>

          {/* Section 5: Result Reporting & Scoreboard Proof */}
          <section id="reporting" className="bg-white border border-[#D3E4FE] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#E56A10] font-mono text-xs font-bold uppercase tracking-wider">
              <FileCheck className="w-4 h-4" /> Result Protocol
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-headline text-[#0B1C30] uppercase">
              Result Reporting &amp; Verification Evidence
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-sans list-disc pl-5">
              <li><strong>Scoreboard Screenshot Mandate:</strong> The winning team captain must upload an unedited, full-screen end-of-game scoreboard screenshot within 15 minutes of match conclusion.</li>
              <li><strong>Required Screenshot Elements:</strong> Match proof must clearly display: player nicknames, elimination scores, final match outcome (Victory/Defeat), and in-game match timer.</li>
              <li><strong>Dispute Evidence:</strong> If cheating or misconduct is suspected, an official dispute ticket must be submitted with accompanying video proof, match replay link, or arbiter review request.</li>
            </ul>
          </section>

          {/* Section 6: Anti-Cheat & Conduct */}
          <section id="anticheat" className="bg-white border border-[#D3E4FE] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 font-mono text-xs font-bold uppercase tracking-wider">
              <Ban className="w-4 h-4" /> Integrity Mandate
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-headline text-[#0B1C30] uppercase">
              Code of Conduct, Anti-Cheat &amp; Disqualification
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-sans list-disc pl-5">
              <li><strong>Zero-Tolerance Cheating Policy:</strong> Use of aimbots, wallhacks, radar hacks, modified APKs, hardware macros, or third-party memory injection software results in immediate permanent ban and forfeiture of all tournament winnings.</li>
              <li><strong>Match Fixing &amp; Collusion:</strong> Any intentional throwing, win-trading, or pre-arranged outcomes between teams leads to lifetime platform suspension.</li>
              <li><strong>Toxicity &amp; Harassment:</strong> Racist, sexist, derogatory, or threatening conduct in match lobbies or global chat triggers disqualification upon referee review.</li>
            </ul>
          </section>

          {/* Section 7: Prize Vault Payouts */}
          <section id="payouts" className="bg-white border border-[#D3E4FE] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#E56A10] font-mono text-xs font-bold uppercase tracking-wider">
              <Shield className="w-4 h-4" /> Vault Security
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-headline text-[#0B1C30] uppercase">
              Prize Vault Guarantees &amp; Payout Timelines
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-sans list-disc pl-5">
              <li><strong>Prize Vault Security:</strong> 100% of declared prize pools are backed and secured in the AMETHEUS Platform Vault prior to tournament commencement.</li>
              <li><strong>Disbursement SLA:</strong> Following final match arbitration and evidence sign-off, prize payouts disburse automatically to the registered winners&apos; wallet accounts within 30 minutes.</li>
              <li><strong>Withdrawals:</strong> Players can withdraw prize balances to their personal verified UPI IDs or bank accounts at any time through the Player Dashboard.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
