'use client';

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MatchLobbyInfo } from "@/types";
import { getMatches, Match as ApiMatch } from "@/lib/api/matches";
import MatchLobbyModal from "@/components/match/MatchLobbyModal";
import EvidenceSubmissionModal from "@/components/match/EvidenceSubmissionModal";
import LiveTickerBar from "@/components/match/LiveTickerBar";
import { useMatchTicker, TickerEvent } from "@/lib/hooks/useMatchTicker";
import {
  Gamepad2,
  Clock,
  CheckCircle,
  Shield,
  Server,
  ArrowRight,
  Filter,
  FileCheck,
  RefreshCw,
} from "lucide-react";

function mapApiMatchToLobby(m: ApiMatch): MatchLobbyInfo {
  return {
    id: m.id,
    tournamentId: m.tournament_id,
    tournamentTitle: m.tournament_title || "Championship",
    gameSlug: m.game_slug || "valorant",
    gameName: m.game_name || "Valorant",
    stage: m.stage || "Competitive Bracket Match",
    format: m.format || "Standard Match",
    scheduledTime: m.scheduled_time || "Today, 8:00 PM IST",
    status: (m.status as any) || "CHECK_IN_OPEN",
    serverRegion: m.server_region || "AWS Mumbai (ap-south-1)",
    lobbyCode: m.lobby_code || "AMETHEUS-LOBBY-01",
    lobbyPassword: m.lobby_password || "ESCROW_PASS_99",
    teamA: {
      id: m.team_a?.tag || "t-a",
      name: m.team_a?.name || "TBD (Slot 1)",
      tag: m.team_a?.tag || "TBD",
      logoUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&auto=format&fit=crop",
      score: m.team_a?.score ?? undefined,
      isCheckedIn: true,
      roster: [
        { username: `${m.team_a?.tag || "Player"}_1`, gameId: `${m.team_a?.tag || "P"}#1` },
      ],
    },
    teamB: {
      id: m.team_b?.tag || "t-b",
      name: m.team_b?.name || "TBD (Slot 2)",
      tag: m.team_b?.tag || "TBD",
      logoUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=200&auto=format&fit=crop",
      score: m.team_b?.score ?? undefined,
      isCheckedIn: true,
      roster: [
        { username: `${m.team_b?.tag || "Player"}_1`, gameId: `${m.team_b?.tag || "P"}#1` },
      ],
    },
  };
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchLobbyInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeLobbyMatch, setActiveLobbyMatch] = useState<MatchLobbyInfo | null>(null);
  const [activeEvidenceMatch, setActiveEvidenceMatch] = useState<MatchLobbyInfo | null>(null);

  const fetchMatchesData = useCallback(async () => {
    try {
      const data = await getMatches();
      if (Array.isArray(data)) {
        setMatches(data.map(mapApiMatchToLobby));
      } else {
        setMatches([]);
      }
    } catch (err) {
      console.warn("Failed to fetch live matches from backend database:", err);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatchesData();
    const interval = setInterval(fetchMatchesData, 30000);
    return () => clearInterval(interval);
  }, [fetchMatchesData]);

  const handleTickerEvent = useCallback(
    (event: TickerEvent) => {
      if (
        event.event === "MATCH_SCORE_SUBMITTED" ||
        event.event === "MATCH_VERIFIED"
      ) {
        fetchMatchesData();
      }
    },
    [fetchMatchesData]
  );

  const { isConnected, events, latestEvent } = useMatchTicker(handleTickerEvent);

  const filteredMatches = matches.filter((m) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "live") return m.status === "LIVE";
    if (filterStatus === "upcoming") return m.status === "CHECK_IN_OPEN";
    if (filterStatus === "completed") return m.status === "COMPLETED";
    return true;
  });

  return (
    <div className="flex flex-col w-full bg-[#F8F9FF] dark:bg-[#0B0E16] min-h-screen text-[#0B1C30] dark:text-slate-100 transition-colors">
      {/* 1. Header Banner */}
      <section className="w-full bg-[#EFF4FF] dark:bg-[#0F131D] py-10 md:py-12 border-b border-[#D3E4FE] dark:border-[#242C3D] transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E5EEFF] dark:bg-[#161A24] border border-[#CBD5E1] dark:border-[#242C3D] rounded text-[#E56A10] text-xs font-bold font-mono tracking-wider uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-[#E56A10] animate-ping" />
            LIVE TELEMETRY // MATCH HUBS
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-headline text-[#0B1C30] dark:text-white tracking-tight uppercase">
            Global Match Schedule &amp; Lobbies
          </h1>
          <p className="mt-2 text-sm md:text-base text-[#565E74] dark:text-slate-400 max-w-2xl leading-relaxed">
            Monitor real-time match servers, access game room credentials, perform captain check-ins, and submit verified result evidence.
          </p>
        </div>
      </section>

      {/* Live WebSocket Telemetry Ticker */}
      <LiveTickerBar
        isConnected={isConnected}
        events={events}
        latestEvent={latestEvent}
      />

      {/* 2. Matches Canvas */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: "all", label: "All Matches" },
            { id: "live", label: "Live In Progress" },
            { id: "upcoming", label: "Upcoming / Check-In" },
            { id: "completed", label: "Verified Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 font-mono text-xs font-bold uppercase rounded transition-colors whitespace-nowrap cursor-pointer border ${
                filterStatus === tab.id
                  ? "bg-[#E56A10] text-white border-transparent shadow-xs"
                  : "bg-white dark:bg-[#161A24] border-[#D3E4FE] dark:border-[#242C3D] text-[#565E74] dark:text-slate-300 hover:text-[#0B1C30] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E2538]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Matches Grid */}
        {filteredMatches.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-[#121622] rounded-xl border border-dashed border-[#D3E4FE] dark:border-[#242C3D] text-[#64748B] dark:text-[#94A3B8]">
            <Gamepad2 className="w-10 h-10 mx-auto mb-3 opacity-40 text-[#E56A10]" />
            <h4 className="text-sm font-bold font-headline text-slate-800 dark:text-slate-200 uppercase mb-1">
              {isLoading ? "Loading Matches..." : "No Matches Scheduled"}
            </h4>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {isLoading
                ? "Fetching match lobbies from the database..."
                : "There are currently no active or scheduled matches matching this filter in the database."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredMatches.map((match) => (
            <div
              key={match.id}
              className="bg-white dark:bg-[#121622] rounded-xl border border-[#D3E4FE] dark:border-[#242C3D] shadow-sm p-6 hover:border-[#CBD5E1] dark:hover:border-[#E56A10] transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Left Details */}
              <div className="flex flex-col gap-2 min-w-[280px]">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      match.status === "LIVE"
                        ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800"
                        : match.status === "CHECK_IN_OPEN"
                        ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {match.status}
                  </span>
                  <span className="px-2 py-0.5 bg-[#EFF4FF] dark:bg-[#161A24] border border-[#D3E4FE] dark:border-[#242C3D] text-[#0B1C30] dark:text-slate-200 rounded text-[10px] font-mono uppercase font-bold">
                    {match.gameName}
                  </span>
                </div>
                <h3 className="font-headline font-bold text-lg text-[#0B1C30] dark:text-white">{match.stage}</h3>
                <div className="text-xs text-[#565E74] dark:text-slate-400 font-mono">{match.tournamentTitle}</div>
                <div className="flex items-center gap-1.5 text-xs text-[#565E74] dark:text-slate-400 font-mono mt-1">
                  <Server className="w-3.5 h-3.5 text-[#E56A10]" />
                  <span>{match.serverRegion}</span>
                </div>
              </div>

              {/* Match Teams VS Section */}
              <div className="flex items-center justify-center gap-6 sm:gap-10 py-4 px-6 bg-[#EFF4FF] dark:bg-[#161A24] rounded-xl border border-[#D3E4FE] dark:border-[#242C3D] flex-1 max-w-xl">
                {/* Team A */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-white dark:bg-[#1A2234] border border-[#CBD5E1] dark:border-[#242C3D] flex items-center justify-center font-bold text-sm text-[#0B1C30] dark:text-white shadow-sm font-headline">
                    {match.teamA.tag}
                  </div>
                  <span className="font-bold text-sm text-[#0B1C30] dark:text-white mt-1.5">{match.teamA.name}</span>
                  <span className="text-[11px] text-[#565E74] dark:text-slate-400 font-mono">[{match.teamA.tag}]</span>
                </div>

                {/* Center Score / Versus */}
                <div className="flex flex-col items-center">
                  {match.teamA.score !== undefined && match.teamB.score !== undefined ? (
                    <div className="text-2xl font-mono font-bold text-[#0B1C30] dark:text-white">
                      {match.teamA.score} : {match.teamB.score}
                    </div>
                  ) : (
                    <div className="text-base font-headline font-bold text-[#565E74] dark:text-slate-400">VS</div>
                  )}
                  <span className="text-[10px] text-[#565E74] dark:text-slate-400 font-mono mt-1">{match.scheduledTime}</span>
                </div>

                {/* Team B */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-white dark:bg-[#1A2234] border border-[#CBD5E1] dark:border-[#242C3D] flex items-center justify-center font-bold text-sm text-[#0B1C30] dark:text-white shadow-sm font-headline">
                    {match.teamB.tag}
                  </div>
                  <span className="font-bold text-sm text-[#0B1C30] dark:text-white mt-1.5">{match.teamB.name}</span>
                  <span className="text-[11px] text-[#565E74] dark:text-slate-400 font-mono">[{match.teamB.tag}]</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap lg:flex-col items-center justify-end gap-2.5">
                <button
                  onClick={() => setActiveLobbyMatch(match)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#0B0E16] dark:bg-[#1A2234] hover:bg-[#161A24] dark:hover:bg-[#232D42] text-white rounded font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer border border-transparent dark:border-[#242C3D]"
                >
                  <Server className="w-4 h-4 text-[#E56A10]" />
                  Enter Lobby Room
                </button>
                <button
                  onClick={() => setActiveEvidenceMatch(match)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white rounded font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  Submit Evidence
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </main>

      {/* Modals */}
      <MatchLobbyModal
        match={activeLobbyMatch}
        isOpen={!!activeLobbyMatch}
        onClose={() => setActiveLobbyMatch(null)}
        onSubmitEvidence={(m) => {
          setActiveLobbyMatch(null);
          setActiveEvidenceMatch(m);
        }}
      />

      <EvidenceSubmissionModal
        match={activeEvidenceMatch}
        isOpen={!!activeEvidenceMatch}
        onClose={() => setActiveEvidenceMatch(null)}
        onSuccess={() => fetchMatchesData()}
      />
    </div>
  );
}
