"use client";

import { Team } from "@/types";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface Props {
  team: Team;
}

export default function TeamRosterCard({ team }: Props) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(team.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFull = team.members.length >= (team.maxMembers || 5);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F3F5] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#0B0E16] text-[#F59E0B] font-headline font-bold flex items-center justify-center text-sm">
            {team.tag}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline font-bold text-base text-[#0F172A]">
                {team.name}
              </h3>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                  isFull
                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                    : "bg-[#F1F3F5] text-[#475569]"
                }`}
              >
                {isFull ? "ROSTER FULL" : "ACTIVE SQUAD"}
              </span>
            </div>
            <span className="text-xs text-[#64748B] font-mono">
              Captain: @{team.captainUsername}
            </span>
          </div>
        </div>

        {/* Invite Code Badge */}
        <div className="flex items-center gap-2 bg-[#0B0E16] text-white px-3 py-1.5 rounded-lg border border-[#242C3D]">
          <div className="flex flex-col text-left">
            <span className="text-[9px] text-[#94A3B8] font-mono uppercase">
              Squad Code
            </span>
            <span className="font-mono font-bold text-sm tracking-wider text-[#E56A10]">
              {team.inviteCode}
            </span>
          </div>
          <button
            onClick={copyCode}
            className="p-1 text-[#CBD5E1] hover:text-white transition-colors cursor-pointer"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Roster Slots */}
      <div>
        <div className="flex items-center justify-between text-xs text-[#64748B] font-mono mb-2">
          <span>
            Roster Slots ({team.members.length} / {team.maxMembers})
            {isFull && <strong className="text-rose-600 ml-1.5 font-bold">• ROSTER FULL</strong>}
          </span>
          <span>Zero Substitutes Allowed</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {Array.from({ length: team.maxMembers }).map((_, i) => {
            const member = team.members[i];
            return (
              <div
                key={i}
                className={`p-2.5 rounded border text-xs flex flex-col justify-between min-h-[64px] ${
                  member
                    ? "bg-[#F8F9FA] border-[#E2E8F0]"
                    : "bg-[#F1F3F5]/50 border-dashed border-[#CBD5E1] text-[#94A3B8]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase font-bold text-[#64748B]">
                    Slot 0{i + 1}
                  </span>
                  {member?.role === "CAPTAIN" && (
                    <span className="px-1 bg-[#E56A10] text-white text-[8px] font-bold rounded">
                      CPT
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  {member ? (
                    <>
                      <div className="font-semibold text-[#0F172A] truncate">
                        @{member.username}
                      </div>
                      <div className="text-[10px] text-[#64748B] font-mono truncate">
                        {member.gameId}
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] italic">Open Slot</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
