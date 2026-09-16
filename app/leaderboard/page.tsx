'use client';

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LEADERBOARD_ENTRIES } from "@/lib/data/leaderboard";
import { LeaderboardEntry } from "@/types";
import {
  Trophy,
  Shield,
  Search,
  Download,
  CheckCircle,
  Flame,
  Award,
  TrendingUp,
  Users,
  Wallet,
  ArrowRight,
} from "lucide-react";

export default function LeaderboardPage() {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"teams" | "players">("teams");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeframe, setTimeframe] = useState<"all" | "season" | "month" | "weekly">("all");

  const disciplines = [
    { id: "all", name: "All Games" },
    { id: "valorant", name: "Valorant" },
    { id: "counter-strike-2", name: "CS2" },
    { id: "bgmi", name: "BGMI" },
    { id: "chess", name: "Chess" },
    { id: "smash-karts", name: "Smash Karts" },
    { id: "mini-militia", name: "Mini Militia" },
  ];

  // Filter entries
  const filteredEntries = LEADERBOARD_ENTRIES.filter((entry) => {
    const matchesDiscipline = selectedDiscipline === "all" || entry.gameSlug === selectedDiscipline;
    const matchesType = selectedType === "teams" ? entry.type === "team" : entry.type === "player";
    const matchesSearch =
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.captain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDiscipline && matchesType && matchesSearch;
  });

  const topThree = LEADERBOARD_ENTRIES.filter((e) => e.rank <= 3);
  const matrixEntries = filteredEntries.filter((e) => e.rank > 3);

  const exportCsv = () => {
    const header = "Rank,Team,Tag,Game,WinRate,Wins,Losses,Rating,Earnings\n";
    const rows = filteredEntries
      .map(
        (e) =>
          `${e.rank},"${e.name}","${e.tag}","${e.gameName}",${e.winRate}%,${e.wins},${e.losses},${e.rating},${e.earnings}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ametheus-leaderboard-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col w-full bg-[#F8F9FA] min-h-screen">
      {/* 1. Metric Header Bar */}
      <section className="w-full bg-[#EFF4FF] py-10 md:py-12 border-b border-[#D3E4FE]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E5EEFF] border border-[#CBD5E1] rounded text-[#E56A10] text-xs font-bold font-mono tracking-wider uppercase mb-3">
                <span className="w-2 h-2 rounded-full bg-[#E56A10] animate-ping" />
                SEASON 2026 // RATINGS AUDITED
              </div>
              <h1 className="text-3xl md:text-5xl font-bold font-headline text-[#0B1C30] tracking-tight uppercase">
                AMETHEUS Global Leaderboard
              </h1>
              <p className="mt-2 text-sm md:text-base text-[#565E74] max-w-2xl leading-relaxed">
                Track competitive performance, championship standings, and verified escrow earnings across all AMETHEUS sanctioned tournaments.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={exportCsv}
                className="px-4 py-2.5 bg-white border border-[#D3E4FE] shadow-sm rounded text-[#0B1C30] font-headline font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-[#565E74]" />
                Export CSV
              </button>
              <Link
                href="/tournaments"
                className="px-4 py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white rounded font-headline font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                Join Tournaments
              </Link>
            </div>
          </div>

          {/* Telemetry Stat Cards matching Stitch Screen 8 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded border border-[#D3E4FE] shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-[#565E74] uppercase tracking-wider mb-1 font-bold">
                  Total Distributed Prizes
                </div>
                <div className="text-2xl font-bold font-headline text-[#0B1C30]">₹14,50,000+</div>
                <span className="text-[11px] text-[#E56A10] font-mono flex items-center gap-1 mt-1 font-bold">
                  <Shield className="w-3.5 h-3.5" /> Escrow Verified
                </span>
              </div>
              <div className="w-12 h-12 rounded bg-[#E5EEFF] flex items-center justify-center text-[#E56A10]">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded border border-[#D3E4FE] shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-[#565E74] uppercase tracking-wider mb-1 font-bold">
                  Active Contenders
                </div>
                <div className="text-2xl font-bold font-headline text-[#0B1C30]">24,800+</div>
                <span className="text-[11px] text-[#565E74] font-mono flex items-center gap-1 mt-1 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" /> +3,120 This Month
                </span>
              </div>
              <div className="w-12 h-12 rounded bg-[#E5EEFF] flex items-center justify-center text-[#0B1C30]">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded border border-[#D3E4FE] shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-[#565E74] uppercase tracking-wider mb-1 font-bold">
                  Verified Teams
                </div>
                <div className="text-2xl font-bold font-headline text-[#0B1C30]">1,120+</div>
                <span className="text-[11px] text-[#565E74] font-mono flex items-center gap-1 mt-1 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> KYC & Roster Locked
                </span>
              </div>
              <div className="w-12 h-12 rounded bg-[#E5EEFF] flex items-center justify-center text-[#0B1C30]">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded border border-[#D3E4FE] shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-[#565E74] uppercase tracking-wider mb-1 font-bold">
                  Top Team Earnings
                </div>
                <div className="text-2xl font-bold font-headline text-[#E56A10]">₹1,85,000</div>
                <span className="text-[11px] text-[#565E74] font-mono flex items-center gap-1 mt-1 font-bold">
                  <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" /> Team Solaris X
                </span>
              </div>
              <div className="w-12 h-12 rounded bg-[#FFDBCA] flex items-center justify-center text-[#E56A10]">
                <Flame className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content Canvas */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full">
        {/* Filter Controls Card */}
        <div className="bg-white p-5 rounded border border-[#D3E4FE] shadow-sm mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E5EEFF]">
            {/* Teams vs Players */}
            <div className="flex items-center gap-1 bg-[#EFF4FF] p-1 rounded">
              <button
                onClick={() => setSelectedType("teams")}
                className={`px-4 py-1.5 font-headline text-xs font-bold uppercase tracking-wider rounded transition-all ${
                  selectedType === "teams"
                    ? "bg-[#E56A10] text-white shadow-sm"
                    : "text-[#565E74] hover:text-[#0B1C30]"
                }`}
              >
                Franchise Teams
              </button>
              <button
                onClick={() => setSelectedType("players")}
                className={`px-4 py-1.5 font-headline text-xs font-bold uppercase tracking-wider rounded transition-all ${
                  selectedType === "players"
                    ? "bg-[#E56A10] text-white shadow-sm"
                    : "text-[#565E74] hover:text-[#0B1C30]"
                }`}
              >
                Individual Soloists
              </button>
            </div>

            {/* Timeframe */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All Time" },
                { id: "season", label: "Season 2026" },
                { id: "month", label: "This Month" },
                { id: "weekly", label: "Weekly Blitz" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeframe(t.id as any)}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors ${
                    timeframe === t.id
                      ? "bg-[#0B1C30] text-white"
                      : "text-[#565E74] hover:bg-[#E5EEFF]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#565E74]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team tag, handle, player..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#EFF4FF] border border-[#D3E4FE] text-xs rounded text-[#0B1C30] placeholder:text-[#565E74] focus:outline-none focus:bg-white focus:border-[#E56A10]"
              />
            </div>
          </div>

          {/* Discipline Selector Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-mono text-[#565E74] uppercase tracking-wider font-bold shrink-0 mr-1">
              Discipline:
            </span>
            {disciplines.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDiscipline(d.id)}
                className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded shrink-0 transition-all ${
                  selectedDiscipline === d.id
                    ? "bg-[#E56A10] text-white shadow-sm"
                    : "bg-[#EFF4FF] text-[#565E74] hover:text-[#0B1C30] hover:bg-[#D3E4FE]"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* Championship Podium (Top 3) */}
        {selectedDiscipline === "all" && selectedType === "teams" && !searchQuery && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#E56A10]" />
                <h2 className="text-xl font-bold font-headline text-[#0B1C30] uppercase tracking-tight">
                  Championship Podium
                </h2>
              </div>
              <span className="text-xs font-mono text-[#565E74] uppercase font-bold">
                Top 3 Sanctioned Franchises
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* #2 Titan Clash (CS2) */}
              <div className="bg-white p-6 rounded border border-[#D3E4FE] shadow-sm relative overflow-hidden order-2 md:order-1 transform transition hover:-translate-y-1">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#BEC6E0]" />
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-[#DAE2FD] text-[#131B2E] font-headline font-bold text-base">
                    #2
                  </span>
                  <span className="px-2 py-0.5 bg-[#EFF4FF] rounded text-[10px] font-mono uppercase text-[#565E74] font-bold">
                    CS2 PRO CIRCUIT
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded bg-[#EFF4FF] overflow-hidden shrink-0 border border-[#D3E4FE]">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMYikVhkT2cPuCcT6iHyvC8KRrGxi2uWjy_Yg4PRywCpZ0Qk_XuBVy-SRnVARKIhqdj-kgUgfYlRjv_KTabBT194pEvMHjgNWeddHSPbu6P_N7NZD2B8VX7etUUzxmFCcI_NOLjS7LndnhoB8Te6UWYv5FexbsBx1329LlvMT7RFsiQ8_LX9hHuWmyhH0syOHCVlI_t-LXya3oFvZnd1NPJyQz_IZjYv6PmnX97rPssU0Rf0xwleEz"
                      alt="Titan Clash"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-headline text-lg font-bold text-[#0B1C30]">Titan Clash</h3>
                      <CheckCircle className="w-4 h-4 text-[#E56A10]" />
                    </div>
                    <p className="text-xs text-[#565E74] font-mono">[TC-ELITE] • Captain: @reaper_cs</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-[#EFF4FF] p-3 rounded mb-4 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-[#565E74]">WIN RATE</div>
                    <div className="text-sm font-bold text-[#0B1C30] mt-0.5">89.1%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#565E74]">W / L</div>
                    <div className="text-sm font-bold text-[#0B1C30] mt-0.5">38 / 5</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#565E74]">POINTS</div>
                    <div className="text-sm font-bold text-[#E56A10] mt-0.5">3,420</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#EFF4FF]">
                  <span className="text-xs text-[#565E74] font-mono uppercase">Earnings</span>
                  <span className="text-lg font-bold font-headline text-[#0B1C30]">₹1,20,000</span>
                </div>
              </div>

              {/* #1 Solaris X (Valorant) */}
              <div className="bg-white p-7 rounded border-2 border-[#E56A10] shadow-md relative overflow-hidden order-1 md:order-2 -mt-4 transform transition hover:-translate-y-1">
                <div className="absolute top-0 left-0 right-0 h-2 bg-[#E56A10]" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded bg-[#E56A10] text-white font-headline font-bold text-lg shadow-sm">
                      #1
                    </span>
                    <Trophy className="w-6 h-6 text-[#F59E0B]" />
                  </div>
                  <span className="px-2.5 py-1 bg-[#FFDBCA] text-[#331100] text-[10px] font-mono uppercase tracking-wider rounded font-bold">
                    VALORANT PREMIER CHAMPION
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-20 h-20 rounded bg-[#EFF4FF] overflow-hidden shrink-0 border border-[#D3E4FE] shadow-sm">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdPWn2ez9ufUiy3oobQMiyzKWPPQYVyngmyTfKqJMWwfmrnUALrqljOu3fdZn-93iR00dO8abRLetxpR3H_YY3Lw0kKtOiie2zXvcvZIFoaGNsiSwx85D3D6OxG0gHpFRiib2Ya4XvFEph7nC919c8zczdq9v32ddvS6lpbCcpe-vwqwPx1OMgEU1xRwlEmm5SIE6Rj7g-L0YKOPoAoiiNPDGGv944Lu6ZDoOPAhH3_SduIY6JiOlN"
                      alt="Solaris X"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-headline text-2xl font-bold text-[#0B1C30] uppercase">
                        Solaris X
                      </h3>
                      <CheckCircle className="w-5 h-5 text-[#E56A10]" />
                    </div>
                    <p className="text-xs text-[#565E74] font-mono">[SLX] • Captain: @vortex_lead</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-[#EFF4FF] p-3 rounded mb-4 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-[#565E74]">WIN RATE</div>
                    <div className="text-lg font-bold text-[#E56A10] mt-0.5">94.2%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#565E74]">W / L</div>
                    <div className="text-lg font-bold text-[#0B1C30] mt-0.5">42 / 3</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#565E74]">POINTS</div>
                    <div className="text-lg font-bold text-[#0B1C30] mt-0.5">4,890</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#EFF4FF]">
                  <span className="text-xs text-[#565E74] font-mono uppercase">Escrow Payout</span>
                  <span className="text-2xl font-bold font-headline text-[#E56A10]">₹1,85,000</span>
                </div>
              </div>

              {/* #3 Soul Cadets (BGMI) */}
              <div className="bg-white p-6 rounded border border-[#D3E4FE] shadow-sm relative overflow-hidden order-3 transform transition hover:-translate-y-1">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#FFB95F]" />
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-[#FFDDB8] text-[#2A1700] font-headline font-bold text-base">
                    #3
                  </span>
                  <span className="px-2 py-0.5 bg-[#EFF4FF] rounded text-[10px] font-mono uppercase text-[#565E74] font-bold">
                    BGMI SQUAD INVITATIONAL
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded bg-[#EFF4FF] overflow-hidden shrink-0 border border-[#D3E4FE]">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJyotics78wQBHUOgYaMmCce9e_DLqZgHGyJP2jKj3_xhVWvP8PhkqLa01gBm4tie9z2jbwUOwI2TSDd-1RCv9Yr1j_bUg4AMrX7V7fqg8mzDAOcz4eQg4ZNSNOcUWqG1PlAPqo4-G1Rvph-2LGIaj1bgttW-RenPdreK7vomeC4gDL4GXEwsIEcE6wVnBzjS3SFx5cbwTz8brPBmRLw8Ch6yloRusSeTA9UCmJGJDLMCmfMfSyONn"
                      alt="Soul Cadets"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-headline text-lg font-bold text-[#0B1C30]">Soul Cadets</h3>
                      <CheckCircle className="w-4 h-4 text-[#E56A10]" />
                    </div>
                    <p className="text-xs text-[#565E74] font-mono">[SOUL] • Captain: @ronin_bgmi</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-[#EFF4FF] p-3 rounded mb-4 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-[#565E74]">WIN RATE</div>
                    <div className="text-sm font-bold text-[#0B1C30] mt-0.5">86.4%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#565E74]">W / L</div>
                    <div className="text-sm font-bold text-[#0B1C30] mt-0.5">32 / 5</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#565E74]">POINTS</div>
                    <div className="text-sm font-bold text-[#E56A10] mt-0.5">2,980</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#EFF4FF]">
                  <span className="text-xs text-[#565E74] font-mono uppercase">Earnings</span>
                  <span className="text-lg font-bold font-headline text-[#0B1C30]">₹95,000</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Standings Matrix Table */}
        <div className="bg-white rounded border border-[#D3E4FE] shadow-sm overflow-hidden mb-12">
          <div className="p-4 bg-[#EFF4FF] border-b border-[#D3E4FE] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-headline text-base font-bold text-[#0B1C30] uppercase tracking-tight">
                Standings Matrix
              </h3>
              <p className="text-xs text-[#565E74]">
                Competitive ranking and rating breakdown ({filteredEntries.length} entries matched)
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#565E74]">Live ELO sync active</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-[#D3E4FE] text-[#565E74] font-mono uppercase text-[11px]">
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Franchise / Player</th>
                  <th className="py-3 px-4">Discipline</th>
                  <th className="py-3 px-4 text-center">Matches</th>
                  <th className="py-3 px-4 text-center">Win Rate</th>
                  <th className="py-3 px-4 text-center">Form Streak</th>
                  <th className="py-3 px-4 text-right">Rating ELO</th>
                  <th className="py-3 px-4 text-right">Prized Pool</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EEFF]">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#565E74] font-mono">
                      No franchises or players matched your current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-[#EFF4FF]/60 transition-colors font-medium text-[#0B1C30]"
                    >
                      {/* Rank */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded font-mono font-bold text-xs ${
                            entry.rank === 1
                              ? "bg-[#E56A10] text-white"
                              : entry.rank === 2
                              ? "bg-[#DAE2FD] text-[#131B2E]"
                              : entry.rank === 3
                              ? "bg-[#FFDDB8] text-[#2A1700]"
                              : "bg-[#EFF4FF] text-[#565E74]"
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      </td>

                      {/* Team Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[#EFF4FF] border border-[#D3E4FE] flex items-center justify-center font-bold text-xs text-[#0B1C30] shrink-0 overflow-hidden relative">
                            {entry.logoUrl ? (
                              <Image
                                src={entry.logoUrl}
                                alt={entry.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              entry.tag
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold">
                              <span>{entry.name}</span>
                              {entry.isVerified && (
                                <CheckCircle className="w-3.5 h-3.5 text-[#E56A10]" />
                              )}
                            </div>
                            <div className="text-[11px] text-[#565E74] font-mono">
                              [{entry.tag}] • {entry.captain}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Discipline */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-[#EFF4FF] border border-[#D3E4FE] rounded text-[11px] font-mono text-[#565E74] uppercase">
                          {entry.gameName}
                        </span>
                      </td>

                      {/* Matches */}
                      <td className="py-3 px-4 text-center font-mono text-[#565E74]">
                        {entry.matchesPlayed} ({entry.wins}W / {entry.losses}L)
                      </td>

                      {/* Win Rate */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#E56A10]">
                        {entry.winRate}%
                      </td>

                      {/* Form Streak */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 font-mono text-[10px] font-bold">
                          {entry.form.map((res, i) => (
                            <span
                              key={i}
                              className={`w-4 h-4 rounded flex items-center justify-center ${
                                res === "W"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {res}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#0B1C30]">
                        {entry.rating.toLocaleString()}
                      </td>

                      {/* Earnings */}
                      <td className="py-3 px-4 text-right font-headline font-bold text-sm text-[#E56A10]">
                        ₹{entry.earnings.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
