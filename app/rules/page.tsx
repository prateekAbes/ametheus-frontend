"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Clock,
  Swords,
  FileCheck,
  Scale,
  Gamepad2,
  Lock,
  ArrowRight,
  ExternalLink,
  Ban,
  UserCheck,
} from "lucide-react";

export default function TournamentRulesPage() {
  const [selectedGameTab, setSelectedGameTab] = useState<string>("valorant");

  const gameRules: Record<string, { title: string; format: string; server: string; mapPool: string[]; rules: string[] }> = {
    valorant: {
      title: "Valorant (5v5 Tactical Shooter)",
      format: "Standard 5v5 | Single Elimination Bracket | Best-of-1 (Finals BO3)",
      server: "AWS Mumbai (ap-south-1) — 128 Tick",
      mapPool: ["Ascent", "Haven", "Bind", "Split", "Sunset", "Lotus", "Abyss"],
      rules: [
        "Roster Size: Exactly 5 active players + up to 1 optional substitute registered before roster lock.",
        "Overtime: Standard 2-round win margin overtime (Win by 2 rounds).",
        "Anti-Cheat: Riot Vanguard must be running with TPM 2.0 and Secure Boot enabled. Any Vanguard violation results in permanent ban.",
        "Cheats & Glitches: Deliberate use of map exploits (Cypher camera glitches, Sova dart out-of-bounds) forfeits the round.",
        "Pauses: Each team receives one 60-second tactical timeout per half. Max 5 minutes technical pause per match upon arbiter approval.",
      ],
    },
    bgmi: {
      title: "Battlegrounds Mobile India (BGMI)",
      format: "Squads 4v4 / Battle Royale | Multi-Match Points System",
      server: "Official Krafton Custom Esports Room (Mumbai Data Center)",
      mapPool: ["Erangel", "Miramar", "Sanhok"],
      rules: [
        "Roster Size: 4 active players per squad. All players must use registered in-game IDs (UIDs).",
        "Scoring System: Official BGIS 10-point matrix (1st: 10pts, 2nd: 6pts, 3rd: 5pts, 4th: 4pts, 5th: 3pts, 6th: 2pts, 7th-8th: 1pt) + 1 point per kill.",
        "Devices: Mobile phones only (iOS / Android). Emulators, iPad, tablets, triggers, and macros are strictly prohibited.",
        "Result Evidence: Captains must submit an uncropped end-game results screenshot showing team rank and kills.",
      ],
    },
    "free-fire": {
      title: "Free Fire MAX",
      format: "Clash Squad 4v4 / Battle Royale",
      server: "India Region Dedicated Esports Server",
      mapPool: ["Bermuda", "Purgatory", "Kalahari"],
      rules: [
        "Roster Size: 4 players per roster registered under identical team tag.",
        "Emulators: PC emulators (BlueStacks, LDPlayer, Nox) are strictly banned. Violations trigger immediate bracket forfeiture.",
        "Character Skills: Gun attribute skins must be set to 'Off/Default' when specified by the tournament lobby host.",
        "Proof of Victory: Full victory screen screenshot displaying all elimination counts must be submitted within 15 minutes.",
      ],
    },
    "cod-mobile": {
      title: "Call of Duty: Mobile (CODM)",
      format: "5v5 Search & Destroy / Hardpoint",
      server: "India South Low-Latency Dedicated Matchmaking",
      mapPool: ["Crash", "Firing Range", "Raid", "Summit", "Standoff", "Tunisia"],
      rules: [
        "Roster Size: 5 players per squad. Substitutes must be listed prior to tournament check-in.",
        "Banned Equipment: NA-45, Akimbo perks, Persistence perk, Heartbeat Sensor, and Operator Skills when specified.",
        "Touch Controls Only: Controllers and emulators are completely barred from certified competitive cups.",
      ],
    },
    chess: {
      title: "Rapid & Blitz Chess (Solo 1v1)",
      format: "1v1 Swiss / Single Elimination | 5+3 Blitz or 10+0 Rapid",
      server: "AMETHEUS Verified Chess Engine (FIDE Standard Protocol)",
      mapPool: ["Standard International 64-Square Chessboard"],
      rules: [
        "Format: Individual 1v1 contender competition. No teams or coaches permitted during live clock play.",
        "Fair Play Telemetry: Real-time Stockfish 16 engine depth correlation and move-time distribution telemetry analysis.",
        "Disconnection: Players have 120 seconds to reconnect before forfeiting the game clock.",
      ],
    },
  };

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
              <Scale className="w-4 h-4 text-[#E56A10]" /> Rulebook Sections
            </h3>
            <nav className="space-y-1 text-xs font-mono">
              <a href="#eligibility" className="block px-2.5 py-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors">
                §1. Participant Eligibility
              </a>
              <a href="#registration" className="block px-2.5 py-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors">
                §2. Registration &amp; Rosters
              </a>
              <a href="#matchday" className="block px-2.5 py-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors">
                §3. Check-In &amp; Lobbies
              </a>
              <a href="#gamespecific" className="block px-2.5 py-1.5 rounded bg-orange-50 text-[#E56A10] font-bold border border-orange-200">
                §4. Game-Specific Rules
              </a>
              <a href="#reporting" className="block px-2.5 py-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors">
                §5. Result Reporting
              </a>
              <a href="#anticheat" className="block px-2.5 py-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors">
                §6. Anti-Cheat &amp; Code of Conduct
              </a>
              <a href="#payouts" className="block px-2.5 py-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors">
                §7. Prize Vault Payouts
              </a>
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
              <UserCheck className="w-4 h-4" /> Section 1
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
              <Lock className="w-4 h-4" /> Section 2
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
              <Clock className="w-4 h-4" /> Section 3
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

          {/* Section 4: Game-Specific Rules */}
          <section id="gamespecific" className="bg-white border border-[#D3E4FE] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 text-[#E56A10] font-mono text-xs font-bold uppercase tracking-wider">
              <Gamepad2 className="w-4 h-4" /> Section 4
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-headline text-[#0B1C30] uppercase">
                Game-Specific Discipline Regulations
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Select a game discipline to view exact tournament formats, map pools, and banned items.
              </p>
            </div>

            {/* Game Tab Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
              {Object.keys(gameRules).map((gKey) => (
                <button
                  key={gKey}
                  onClick={() => setSelectedGameTab(gKey)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors whitespace-nowrap cursor-pointer border ${
                    selectedGameTab === gKey
                      ? "bg-[#E56A10] text-white border-[#E56A10] shadow-xs"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {gameRules[gKey].title.split(" (")[0]}
                </button>
              ))}
            </div>

            {/* Active Game Details */}
            {gameRules[selectedGameTab] && (
              <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="font-headline font-bold text-base text-[#0B1C30]">
                    {gameRules[selectedGameTab].title}
                  </h3>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs font-mono text-slate-600">
                    <span><strong>Format:</strong> {gameRules[selectedGameTab].format}</span>
                    <span>•</span>
                    <span><strong>Server:</strong> {gameRules[selectedGameTab].server}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-500 mb-2">
                    Official Map Pool:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {gameRules[selectedGameTab].mapPool.map((map) => (
                      <span key={map} className="px-2.5 py-1 bg-white border border-slate-200 text-xs font-mono text-slate-800 rounded font-bold">
                        {map}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-500 mb-2">
                    Special Discipline Rules:
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 list-disc pl-5 leading-relaxed font-sans">
                    {gameRules[selectedGameTab].rules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Section 5: Result Reporting & Scoreboard Proof */}
          <section id="reporting" className="bg-white border border-[#D3E4FE] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#E56A10] font-mono text-xs font-bold uppercase tracking-wider">
              <FileCheck className="w-4 h-4" /> Section 5
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
              <Ban className="w-4 h-4" /> Section 6
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
              <Shield className="w-4 h-4" /> Section 7
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
