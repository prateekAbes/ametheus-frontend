"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TOURNAMENTS_DATA } from "@/lib/data/tournaments";
import { GAMES_DATA } from "@/lib/data/games";
import {
  Trophy,
  Filter,
  Search,
  ArrowRight,
  Calendar,
  Clock,
  Server,
  Award,
  Flame,
} from "lucide-react";

export default function TournamentsDiscoveryPage() {
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedFee, setSelectedFee] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTournaments = TOURNAMENTS_DATA.filter((t) => {
    const matchesGame = selectedGame === "all" || t.gameSlug === selectedGame;
    const matchesFee =
      selectedFee === "all" ||
      (selectedFee === "free" && t.entryFeeNum === 0) ||
      (selectedFee === "paid" && t.entryFeeNum > 0);
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.gameName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.serverRegion.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGame && matchesFee && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full">
      {/* Sub-Bar */}
      <div className="w-full bg-[#F1F3F5] py-2 px-4 md:px-8 border-b border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs font-mono text-[#64748B]">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#E56A10] transition-colors">
              HOME
            </Link>
            <span>/</span>
            <span className="text-[#0F172A] font-bold">TOURNAMENTS DISCOVERY</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-[#0F172A]">
              <span className="w-2 h-2 rounded-full bg-[#E56A10] animate-pulse" />
              18 ACTIVE BRACKETS
            </span>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <section className="bg-white py-12 px-4 md:px-8 border-b border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F3F5] rounded text-[#E56A10] text-xs font-bold tracking-widest uppercase font-mono mb-3">
            <Trophy className="w-3.5 h-3.5" />
            TIER-1 TOURNAMENT CIRCUIT
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-headline text-[#0F172A] uppercase tracking-tight">
            Competitive Tournaments &amp; Brackets
          </h1>
          <p className="text-sm text-[#475569] max-w-2xl mt-2 leading-relaxed">
            Discover upcoming cups, register your verified squad, and compete for certified cash escrow prize pools across India and South Asia.
          </p>
        </div>
      </section>

      {/* Filter Controller */}
      <section className="bg-[#F1F3F5] py-4 px-4 md:px-8 sticky top-16 z-40 border-b border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Discipline Dropdown */}
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#CBD5E1] rounded text-xs font-mono font-semibold text-[#0F172A] focus:outline-none focus:border-[#E56A10]"
            >
              <option value="all">All Disciplines (12 Titles)</option>
              {GAMES_DATA.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>

            {/* Entry Fee Filter */}
            <div className="flex items-center bg-white border border-[#CBD5E1] rounded p-0.5">
              <button
                onClick={() => setSelectedFee("all")}
                className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-colors ${
                  selectedFee === "all"
                    ? "bg-[#E56A10] text-white"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                All Fees
              </button>
              <button
                onClick={() => setSelectedFee("free")}
                className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-colors ${
                  selectedFee === "free"
                    ? "bg-[#E56A10] text-white"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Free (₹0)
              </button>
              <button
                onClick={() => setSelectedFee("paid")}
                className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-colors ${
                  selectedFee === "paid"
                    ? "bg-[#E56A10] text-white"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Paid Stakes
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tournaments, titles, servers..."
              className="w-full pl-9 pr-4 py-1.5 bg-white text-[#0F172A] placeholder-[#94A3B8] text-xs rounded border border-[#CBD5E1] focus:outline-none focus:border-[#E56A10]"
            />
          </div>
        </div>
      </section>

      {/* Tournaments Grid */}
      <section className="py-12 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTournaments.map((t) => (
            <article
              key={t.id}
              className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Banner Header */}
                <div className="relative h-40 w-full overflow-hidden bg-[#0B0E16]">
                  <Image
                    src={t.bannerUrl}
                    alt={t.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
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
                    <h3 className="font-headline font-bold text-base text-[#0F172A] group-hover:text-[#E56A10] transition-colors leading-snug">
                      {t.title}
                    </h3>
                    <span className="text-xs text-[#64748B] font-mono block mt-1">
                      {t.gameName} • {t.format}
                    </span>
                  </div>

                  {/* Slot progress */}
                  <div className="bg-[#F8F9FA] rounded-lg p-3 flex flex-col gap-1.5 border border-[#E2E8F0]">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#64748B]">SLOT FILL STATUS</span>
                      <span className="text-[#0F172A] font-bold">
                        {t.registeredTeams} / {t.maxTeams} Teams
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <div
                        className="h-full bg-[#E56A10] rounded-full"
                        style={{
                          width: `${(t.registeredTeams / t.maxTeams) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                      <span>{t.maxTeams - t.registeredTeams} slots remaining</span>
                      <span>Starts Soon</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#64748B] font-mono pt-1">
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
                      <span className="truncate">{t.serverRegion.split(" ")[0]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#E56A10]" />
                      <span className="truncate">{t.rankRequirement.replace("Rank: ", "")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="p-5 pt-0">
                <Link
                  href={`/tournaments/${t.slug || t.id}`}
                  className="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2"
                >
                  <span>View Details &amp; Rules</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
