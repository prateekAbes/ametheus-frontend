"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { GAMES_DATA } from "@/lib/data/games";
import { GameCategory } from "@/types";
import { Shield, Filter, Search, ArrowRight, Flame } from "lucide-react";

export default function GamesDirectoryPage() {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGames = GAMES_DATA.filter((game) => {
    const matchesCategory =
      selectedCategory === "all" ? true : game.category === selectedCategory;
    const matchesSearch =
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.platform.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full">
      {/* Sub-Bar & Breadcrumbs Context */}
      <div className="w-full bg-[#F1F3F5] py-2.5 px-4 md:px-8 border-b border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#64748B]">
          <div className="flex items-center gap-2">
            <span className="text-[#E56A10] font-bold">DIRECTORY</span>
            <span>/</span>
            <span className="text-[#0F172A] font-semibold">SANCTIONED DISCIPLINES</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 bg-[#E2E8F0] text-[#0F172A] rounded text-[10px] uppercase font-bold">
              SEASON 04 ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-[#0F172A]">
              <span className="w-2 h-2 rounded-full bg-[#E56A10] animate-pulse" />
              ESCROW PROTOCOL ENGAGED
            </span>
            <span className="hidden md:inline text-[#64748B]">NODE: HYD-AWS-PROD-2</span>
          </div>
        </div>
      </div>

      {/* Hero Header Section */}
      <section className="w-full bg-white py-12 px-4 md:px-8 border-b border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F3F5] rounded text-[#E56A10] text-xs font-bold tracking-widest uppercase font-mono">
                <Shield className="w-3.5 h-3.5" />
                OFFICIAL ESCROW-PROTECTED LEAGUES
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold font-headline text-[#0F172A] uppercase tracking-tight">
                SUPPORTED COMPETITIVE DISCIPLINES
              </h1>
              <p className="text-sm text-[#475569] max-w-3xl leading-relaxed">
                Explore sanctioned esports tournaments across 12 official competitive titles. Select your game to enter dedicated hubs, view rulebooks, deploy anti-cheat verifications, and manage verified squad rosters.
              </p>
            </div>

            {/* Telemetry Metrics Card Cluster */}
            <div className="lg:col-span-4 bg-[#F8F9FA] p-4 rounded-xl border border-[#E2E8F0]">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                    Disciplines
                  </span>
                  <span className="text-2xl font-bold font-headline text-[#0F172A] block tabular-nums">
                    12
                  </span>
                  <span className="text-[11px] text-[#E56A10] font-medium font-mono">
                    100% Certified
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                    Locked Escrow
                  </span>
                  <span className="text-2xl font-bold font-headline text-[#E56A10] block tabular-nums">
                    ₹3.5L+
                  </span>
                  <span className="text-[11px] text-[#64748B] font-mono">
                    Razorpay Node
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                    Registered Squads
                  </span>
                  <span className="text-2xl font-bold font-headline text-[#0F172A] block tabular-nums">
                    1,450+
                  </span>
                  <span className="text-[11px] text-[#64748B] font-mono">
                    Active Rosters
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                    Integrity Status
                  </span>
                  <span className="text-sm font-bold font-headline text-[#0F172A] block mt-1 uppercase">
                    ZERO-SUB
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium font-mono">
                    Strict Roster
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Controller Section */}
      <section className="w-full bg-[#F1F3F5] py-4 px-4 md:px-8 sticky top-16 z-40 border-b border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Segment Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Platforms (12)" },
              { id: "pc", label: "PC Master (4)" },
              { id: "mobile", label: "Mobile Tier (5)" },
              { id: "crossplay", label: "Crossplay / Web (2)" },
              { id: "solo", label: "Solo / 1v1 (2)" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as GameCategory)}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-[#E56A10] text-white"
                    : "bg-white text-[#475569] hover:bg-[#E2E8F0] border border-[#E2E8F0]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, engine, or spec..."
              className="w-full pl-9 pr-4 py-1.5 bg-white text-[#0F172A] placeholder-[#94A3B8] text-xs rounded border border-[#CBD5E1] focus:outline-none focus:border-[#E56A10]"
            />
          </div>
        </div>
      </section>

      {/* Games Bento Grid */}
      <section className="w-full py-12 px-4 md:px-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <article
              key={game.slug}
              className="flex flex-col justify-between bg-white rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] shadow-xs hover:shadow-md transition-all overflow-hidden group"
            >
              <div>
                {/* Thumbnail Header */}
                <div className="relative w-full h-44 overflow-hidden bg-[#0B0E16]">
                  <Image
                    src={game.bannerUrl}
                    alt={game.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-white/90 text-[#0F172A] font-mono text-[10px] rounded font-bold">
                      {game.platform}
                    </span>
                    <span className="px-2 py-0.5 bg-[#E56A10] text-white font-mono text-[10px] rounded font-bold">
                      {game.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-mono">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {game.activeTournaments} CUPS LIVE
                    </span>
                    <span className="bg-black/60 px-2 py-0.5 rounded text-[11px]">
                      {game.upcomingTournaments} UPCOMING
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-3">
                  <div>
                    <h3 className="text-xl font-bold font-headline text-[#0F172A] group-hover:text-[#E56A10] transition-colors">
                      {game.name}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                      {game.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-[#F1F3F5] text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-mono block">
                        Active Pool
                      </span>
                      <span className="text-base font-bold font-headline text-[#E56A10] tabular-nums">
                        {game.activePool}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-mono block">
                        Roster Rule
                      </span>
                      <span className="text-xs font-bold text-[#0F172A] font-mono block mt-0.5">
                        {game.isTeamGame ? `${game.minTeamSize} Players Fixed` : "Solo 1v1"}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#64748B] font-mono flex items-center justify-between">
                    <span>Server: {game.serverRegion}</span>
                    <span>{game.antiCheat}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <Link
                  href={`/games/${game.slug}`}
                  className="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Enter Dedicated Hub</span>
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
