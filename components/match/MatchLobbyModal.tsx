'use client';

import React, { useState } from "react";
import { MatchLobbyInfo } from "@/types";
import { X, CheckCircle, Copy, Shield, Server, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { checkInMatch } from "@/lib/api/matches";

interface Props {
  match: MatchLobbyInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitEvidence: (match: MatchLobbyInfo) => void;
}

export default function MatchLobbyModal({ match, isOpen, onClose, onSubmitEvidence }: Props) {
  const [copiedLobby, setCopiedLobby] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  if (!isOpen || !match) return null;

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      await checkInMatch(match.id);
      setIsCheckedIn(true);
    } catch (e) {
      console.warn("Match check-in backend call failed, falling back to local state:", e);
      setIsCheckedIn(true);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCopy = (text: string, type: "lobby" | "pass") => {
    navigator.clipboard.writeText(text);
    if (type === "lobby") {
      setCopiedLobby(true);
      setTimeout(() => setCopiedLobby(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B0E16] text-[#F8FAFC] border border-[#242C3D] w-full max-w-2xl rounded shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#242C3D] bg-[#10141F]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#161A24] border border-[#E56A10]/40 text-[#E56A10] text-[10px] font-mono font-bold rounded">
              MATCH LOBBY // ESCROW PROTECTED
            </div>
            <h3 className="text-xl font-bold font-headline text-white mt-1 uppercase">
              {match.stage}
            </h3>
            <p className="text-xs text-[#94A3B8] font-mono">{match.tournamentTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#94A3B8] hover:text-white hover:bg-[#161A24] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Teams Confrontation Strip */}
          <div className="grid grid-cols-3 items-center bg-[#161A24] border border-[#242C3D] p-4 rounded text-center">
            {/* Team A */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded bg-[#0B0E16] border border-[#242C3D] flex items-center justify-center font-headline font-bold text-white text-base">
                {match.teamA.tag}
              </div>
              <span className="font-bold text-sm text-white mt-2">{match.teamA.name}</span>
              <span className="text-[11px] text-[#94A3B8] font-mono">[{match.teamA.tag}]</span>
              {match.teamA.isCheckedIn || isCheckedIn ? (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                  <CheckCircle className="w-3 h-3" /> CHECKED IN
                </span>
              ) : (
                <span className="mt-1.5 text-[10px] text-[#F59E0B] font-mono">PENDING CHECK-IN</span>
              )}
            </div>

            {/* Versus & Score */}
            <div className="flex flex-col items-center justify-center">
              <span className="px-2 py-0.5 bg-[#0B0E16] border border-[#242C3D] text-[10px] font-mono font-bold text-[#E56A10] rounded uppercase mb-2">
                {match.status}
              </span>
              {match.teamA.score !== undefined && match.teamB.score !== undefined ? (
                <div className="text-3xl font-bold font-mono text-white tabular-nums">
                  {match.teamA.score} : {match.teamB.score}
                </div>
              ) : (
                <div className="text-xl font-bold font-headline text-[#94A3B8]">VS</div>
              )}
              <span className="text-[11px] text-[#94A3B8] font-mono mt-1">{match.format}</span>
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded bg-[#0B0E16] border border-[#242C3D] flex items-center justify-center font-headline font-bold text-white text-base">
                {match.teamB.tag}
              </div>
              <span className="font-bold text-sm text-white mt-2">{match.teamB.name}</span>
              <span className="text-[11px] text-[#94A3B8] font-mono">[{match.teamB.tag}]</span>
              {match.teamB.isCheckedIn ? (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                  <CheckCircle className="w-3 h-3" /> CHECKED IN
                </span>
              ) : (
                <span className="mt-1.5 text-[10px] text-[#F59E0B] font-mono">PENDING CHECK-IN</span>
              )}
            </div>
          </div>

          {/* Dedicated Server Credentials */}
          <div className="bg-[#10141F] border border-[#242C3D] p-4 rounded space-y-3">
            <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono">
              <span className="flex items-center gap-1 text-white font-bold">
                <Server className="w-4 h-4 text-[#E56A10]" /> DEDICATED SERVER PROTOCOL
              </span>
              <span>{match.serverRegion}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#242C3D]">
              {/* Lobby Code */}
              <div className="bg-[#0B0E16] border border-[#242C3D] p-3 rounded flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#94A3B8] font-mono uppercase">LOBBY / ROOM ID</div>
                  <div className="font-mono text-sm font-bold text-white">{match.lobbyCode}</div>
                </div>
                <button
                  onClick={() => handleCopy(match.lobbyCode, "lobby")}
                  className="p-1.5 bg-[#161A24] border border-[#242C3D] hover:border-[#E56A10] text-[#CBD5E1] hover:text-white rounded text-xs flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedLobby ? "Copied" : "Copy"}
                </button>
              </div>

              {/* Lobby Password */}
              <div className="bg-[#0B0E16] border border-[#242C3D] p-3 rounded flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#94A3B8] font-mono uppercase">LOBBY PASSWORD</div>
                  <div className="font-mono text-sm font-bold text-[#F59E0B]">{match.lobbyPassword}</div>
                </div>
                <button
                  onClick={() => handleCopy(match.lobbyPassword, "pass")}
                  className="p-1.5 bg-[#161A24] border border-[#242C3D] hover:border-[#E56A10] text-[#CBD5E1] hover:text-white rounded text-xs flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedPassword ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* Roster & In-Game IDs */}
          <div>
            <div className="text-xs font-mono font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
              Verified In-Game Handles (Anti-Smurf Protection)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#10141F] border border-[#242C3D] p-3 rounded text-xs space-y-1.5">
                <div className="font-bold text-white border-b border-[#242C3D] pb-1 font-mono">
                  {match.teamA.name}
                </div>
                {match.teamA.roster.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-[#94A3B8]">
                    <span>@{p.username}</span>
                    <span className="font-mono text-white bg-[#161A24] px-1.5 py-0.5 rounded text-[11px]">
                      {p.gameId}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-[#10141F] border border-[#242C3D] p-3 rounded text-xs space-y-1.5">
                <div className="font-bold text-white border-b border-[#242C3D] pb-1 font-mono">
                  {match.teamB.name}
                </div>
                {match.teamB.roster.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-[#94A3B8]">
                    <span>@{p.username}</span>
                    <span className="font-mono text-white bg-[#161A24] px-1.5 py-0.5 rounded text-[11px]">
                      {p.gameId}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-[#10141F] border-t border-[#242C3D] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#242C3D] text-white font-bold text-xs rounded uppercase tracking-wider font-mono flex items-center gap-1.5 transition-all"
              >
                {isCheckingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>{isCheckingIn ? "Checking In..." : "Captain Check-In (10m left)"}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800 px-3 py-1.5 rounded">
                <CheckCircle className="w-4 h-4" /> Ready for Match
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onSubmitEvidence(match);
              }}
              className="px-4 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs rounded uppercase tracking-wider font-mono flex items-center gap-1.5"
            >
              Submit Score & Evidence
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#161A24] border border-[#242C3D] text-[#94A3B8] hover:text-white rounded text-xs font-mono uppercase"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
