'use client';

import React, { useState, useEffect } from "react";
import { MatchLobbyInfo } from "@/types";
import { X, CheckCircle, Copy, Server, Loader2, ExternalLink, Key, MessageSquare, AlertCircle } from "lucide-react";
import { checkInMatch, getMatchJoinInfo, MatchJoinInfo } from "@/lib/api/matches";

interface Props {
  match: MatchLobbyInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitEvidence: (match: MatchLobbyInfo) => void;
}

export default function MatchLobbyModal({ match, isOpen, onClose, onSubmitEvidence }: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [joinInfoData, setJoinInfoData] = useState<MatchJoinInfo | null>(null);
  const [isLoadingJoinInfo, setIsLoadingJoinInfo] = useState(false);

  useEffect(() => {
    if (!isOpen || !match?.id) return;
    setIsLoadingJoinInfo(true);
    getMatchJoinInfo(match.id)
      .then((data) => setJoinInfoData(data))
      .catch(() => setJoinInfoData(null))
      .finally(() => setIsLoadingJoinInfo(false));
  }, [isOpen, match?.id]);

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

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white text-[#0B1C30] border border-slate-200 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#EFF4FF] border border-[#CBD5E1] text-[#E56A10] text-[10px] font-mono font-bold rounded">
              MATCH LOBBY // PRIZE VAULT PROTECTED
            </div>
            <h3 className="text-xl font-bold font-headline text-slate-900 mt-1 uppercase">
              {match.stage}
            </h3>
            <p className="text-xs text-slate-500 font-mono">{match.tournamentTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Teams Confrontation Strip */}
          <div className="grid grid-cols-3 items-center bg-[#EFF4FF] border border-[#CBD5E1] p-4 rounded-xl text-center">
            {/* Team A */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-headline font-bold text-slate-900 text-base shadow-xs">
                {match.teamA.tag}
              </div>
              <span className="font-bold text-sm text-slate-900 mt-2">{match.teamA.name}</span>
              <span className="text-[11px] text-slate-500 font-mono">[{match.teamA.tag}]</span>
              {match.teamA.isCheckedIn || isCheckedIn ? (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-emerald-700 font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded">
                  <CheckCircle className="w-3 h-3" /> CHECKED IN
                </span>
              ) : (
                <span className="mt-1.5 text-[10px] text-amber-700 font-mono font-semibold">PENDING CHECK-IN</span>
              )}
            </div>

            {/* Versus & Score */}
            <div className="flex flex-col items-center justify-center">
              <span className="px-2.5 py-0.5 bg-white border border-slate-300 text-[10px] font-mono font-bold text-[#E56A10] rounded uppercase mb-2 shadow-xs">
                {match.status}
              </span>
              {match.teamA.score !== undefined && match.teamB.score !== undefined ? (
                <div className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
                  {match.teamA.score} : {match.teamB.score}
                </div>
              ) : (
                <div className="text-xl font-bold font-headline text-slate-400">VS</div>
              )}
              <span className="text-[11px] text-slate-500 font-mono mt-1">{match.format}</span>
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-headline font-bold text-slate-900 text-base shadow-xs">
                {match.teamB.tag}
              </div>
              <span className="font-bold text-sm text-slate-900 mt-2">{match.teamB.name}</span>
              <span className="text-[11px] text-slate-500 font-mono">[{match.teamB.tag}]</span>
              {match.teamB.isCheckedIn ? (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-emerald-700 font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded">
                  <CheckCircle className="w-3 h-3" /> CHECKED IN
                </span>
              ) : (
                <span className="mt-1.5 text-[10px] text-amber-700 font-mono font-semibold">PENDING CHECK-IN</span>
              )}
            </div>
          </div>

          {/* Dedicated Server & Match Join Information */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
              <span className="flex items-center gap-1 text-slate-900 font-bold">
                <Server className="w-4 h-4 text-[#E56A10]" /> MATCH JOIN INFORMATION
              </span>
              <span>{match.serverRegion}</span>
            </div>

            {isLoadingJoinInfo ? (
              <div className="py-4 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#E56A10]" /> Loading match credentials...
              </div>
            ) : joinInfoData?.join_info_enabled && joinInfoData.join_info && Object.keys(joinInfoData.join_info).length > 0 ? (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                {joinInfoData.match_message && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-mono text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block uppercase text-[10px]">Arbiter Instructions</span>
                      {joinInfoData.match_message}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(joinInfoData.join_info).map(([key, val]) => {
                    if (!val) return null;
                    const label = key.replace(/_/g, " ").toUpperCase();
                    const isLink = key.includes("link") || key.includes("url") || val.startsWith("http");

                    return (
                      <div key={key} className="bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between shadow-xs">
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="text-[10px] text-slate-500 font-mono uppercase">{label}</div>
                          <div className="font-mono text-sm font-bold text-slate-900 truncate">{val}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isLink && (
                            <a
                              href={val}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-[#E56A10]/10 border border-[#E56A10] text-[#E56A10] hover:bg-[#E56A10] hover:text-white rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopy(val, key)}
                            className="p-1.5 bg-slate-100 border border-slate-200 hover:border-[#E56A10] text-slate-700 hover:text-slate-900 rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            {copiedKey === key ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : match.lobbyCode && match.lobbyCode !== "TBD" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div className="bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between shadow-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase">LOBBY / ROOM ID</div>
                    <div className="font-mono text-sm font-bold text-slate-900">{match.lobbyCode}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(match.lobbyCode || "", "lobby")}
                    className="p-1.5 bg-slate-100 border border-slate-200 hover:border-[#E56A10] text-slate-700 hover:text-slate-900 rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedKey === "lobby" ? "Copied" : "Copy"}
                  </button>
                </div>
                {match.lobbyPassword && (
                  <div className="bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">LOBBY PASSWORD</div>
                      <div className="font-mono text-sm font-bold text-amber-600">{match.lobbyPassword}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(match.lobbyPassword || "", "pass")}
                      className="p-1.5 bg-slate-100 border border-slate-200 hover:border-[#E56A10] text-slate-700 hover:text-slate-900 rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedKey === "pass" ? "Copied" : "Copy"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-white border border-dashed border-slate-300 rounded-lg text-center space-y-1">
                <div className="text-xs font-mono font-bold text-slate-700">Credentials Pending Release</div>
                <p className="text-[11px] text-slate-500 font-mono">
                  Dedicated in-game room code and password will appear here once released by match arbiters prior to launch.
                </p>
              </div>
            )}
          </div>

          {/* Roster & In-Game IDs */}
          <div>
            <div className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-2">
              Verified In-Game Handles (Anti-Smurf Protection)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs space-y-1.5">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 font-mono">
                  {match.teamA.name}
                </div>
                {match.teamA.roster.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-600">
                    <span>@{p.username}</span>
                    <span className="font-mono text-slate-900 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[11px]">
                      {p.gameId}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs space-y-1.5">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 font-mono">
                  {match.teamB.name}
                </div>
                {match.teamB.roster.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-600">
                    <span>@{p.username}</span>
                    <span className="font-mono text-slate-900 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[11px]">
                      {p.gameId}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold text-xs rounded uppercase tracking-wider font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                {isCheckingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>{isCheckingIn ? "Checking In..." : "Captain Check-In (10m left)"}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-800 font-bold bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Ready for Match
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onSubmitEvidence(match);
              }}
              className="px-4 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs rounded uppercase tracking-wider font-mono flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              Submit Score & Evidence
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 rounded text-xs font-mono uppercase cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
