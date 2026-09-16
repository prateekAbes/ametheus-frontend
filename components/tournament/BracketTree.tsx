"use client";

import { BracketRound } from "@/types";
import { Trophy, Flame, Clock, CheckCircle } from "lucide-react";

interface Props {
  rounds: BracketRound[];
}

export default function BracketTree({ rounds }: Props) {
  if (!rounds || rounds.length === 0) {
    return (
      <div className="p-12 text-center bg-[#F8F9FA] rounded-xl border border-dashed border-[#CBD5E1] text-[#64748B] text-xs">
        Tournament bracket will be seeded and generated once registration closes.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex items-start gap-8 min-w-[900px]">
        {rounds.map((round, rIndex) => (
          <div key={rIndex} className="flex-1 flex flex-col gap-4">
            {/* Round Title */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <span className="font-headline font-bold text-xs uppercase tracking-wider text-[#0F172A]">
                {round.name}
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">
                {round.matches.length} {round.matches.length === 1 ? "Match" : "Matches"}
              </span>
            </div>

            {/* Matches in Round */}
            <div className="flex flex-col justify-around gap-6 h-full">
              {round.matches.map((match) => {
                const isLive = match.status === "LIVE";
                return (
                  <div
                    key={match.id}
                    className={`bg-white rounded-lg border shadow-xs transition-all overflow-hidden ${
                      isLive
                        ? "border-[#E56A10] ring-1 ring-[#E56A10]"
                        : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                    }`}
                  >
                    {/* Status header */}
                    <div className="bg-[#F8F9FA] px-3 py-1.5 border-b border-[#F1F3F5] flex items-center justify-between text-[10px] font-mono">
                      {isLive ? (
                        <span className="text-[#E56A10] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E56A10] animate-ping" />
                          LIVE // {match.scheduledTime || "IN PROGRESS"}
                        </span>
                      ) : (
                        <span className="text-[#64748B]">
                          {match.scheduledTime || "COMPLETED"}
                        </span>
                      )}
                      <span className="text-[#94A3B8]">M#{match.matchNumber}</span>
                    </div>

                    {/* Team A */}
                    <div
                      className={`px-3 py-2 flex items-center justify-between border-b border-[#F1F3F5] ${
                        match.teamA.isWinner
                          ? "bg-emerald-50/40 font-bold"
                          : match.teamB.isWinner
                          ? "text-[#64748B]"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {match.teamA.seed && (
                          <span className="font-mono text-[10px] text-[#94A3B8]">
                            #{match.teamA.seed}
                          </span>
                        )}
                        <span className="text-xs text-[#0F172A] truncate max-w-[140px]">
                          {match.teamA.name}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                          match.teamA.isWinner
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-[#F1F3F5] text-[#0F172A]"
                        }`}
                      >
                        {match.teamA.score ?? "-"}
                      </span>
                    </div>

                    {/* Team B */}
                    <div
                      className={`px-3 py-2 flex items-center justify-between ${
                        match.teamB.isWinner
                          ? "bg-emerald-50/40 font-bold"
                          : match.teamA.isWinner
                          ? "text-[#64748B]"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {match.teamB.seed && (
                          <span className="font-mono text-[10px] text-[#94A3B8]">
                            #{match.teamB.seed}
                          </span>
                        )}
                        <span className="text-xs text-[#0F172A] truncate max-w-[140px]">
                          {match.teamB.name}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                          match.teamB.isWinner
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-[#F1F3F5] text-[#0F172A]"
                        }`}
                      >
                        {match.teamB.score ?? "-"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
