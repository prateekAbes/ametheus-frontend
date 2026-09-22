"use client";

import { useState } from "react";
import { X, Users, Check, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { Team } from "@/types";
import { getTeamByCode, joinTeam as apiJoinTeam } from "@/lib/api/teams";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameSlug: string;
  gameName?: string;
  onTeamJoined: (team: Team) => void;
  findTeamByCode?: (code: string) => Team | undefined;
}

export default function JoinTeamModal({
  isOpen,
  onClose,
  gameSlug,
  gameName = "Game",
  onTeamJoined,
  findTeamByCode,
}: Props) {
  const [code, setCode] = useState("");
  const [inGameId, setInGameId] = useState("");
  const [matchedTeam, setMatchedTeam] = useState<Team | null>(null);
  const [error, setError] = useState("");
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen) return null;

  const handleCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().trim();
    setCode(val);
    setError("");

    if (val.length === 6) {
      // 1. Try local cache / prop first
      const localTeam = findTeamByCode ? findTeamByCode(val) : undefined;
      if (localTeam) {
        if (localTeam.gameSlug !== gameSlug) {
          setError(`This code belongs to a ${localTeam.gameSlug} team, not ${gameName}.`);
          setMatchedTeam(null);
        } else {
          setMatchedTeam(localTeam);
        }
        return;
      }

      // 2. Query backend API
      try {
        const apiTeam = await getTeamByCode(val);
        if (apiTeam) {
          if (apiTeam.game_slug !== gameSlug) {
            setError(`This code belongs to a ${apiTeam.game_slug} team, not ${gameName}.`);
            setMatchedTeam(null);
          } else {
            const mappedTeam: Team = {
              id: apiTeam.id,
              gameSlug: apiTeam.game_slug,
              name: apiTeam.name,
              tag: apiTeam.tag,
              logoUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop",
              inviteCode: apiTeam.invite_code,
              captainUserId: apiTeam.captain_id,
              captainUsername: apiTeam.captain_username,
              maxMembers: apiTeam.max_members,
              createdAt: new Date().toISOString(),
              members: apiTeam.members.map((m) => ({
                userId: m.user_id,
                username: m.username,
                role: (m.role === "CAPTAIN" ? "CAPTAIN" : "MEMBER") as "CAPTAIN" | "MEMBER",
                gameId: m.game_handle,
                riotId: m.game_handle,
                joinedAt: new Date().toISOString(),
              })),
            };
            setMatchedTeam(mappedTeam);
          }
        }
      } catch {
        setError("No active squad found with this 6-character code.");
        setMatchedTeam(null);
      }
    } else {
      setMatchedTeam(null);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedTeam) {
      setError("Please enter a valid 6-character team code.");
      return;
    }
    if (!inGameId.trim()) {
      setError("Please enter your verified Riot / In-Game ID.");
      return;
    }

    if (matchedTeam.gameSlug === "chess" || matchedTeam.maxMembers <= 1) {
      setError("Chess is a solo discipline. Team rosters and squad joins are not permitted.");
      return;
    }

    if (matchedTeam.members.length >= matchedTeam.maxMembers) {
      setError(`This squad is already full (${matchedTeam.members.length}/${matchedTeam.maxMembers}).`);
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      const res = await apiJoinTeam({
        invite_code: matchedTeam.inviteCode,
        player_handle: inGameId.trim(),
      });

      const updatedTeam: Team = {
        id: res.id,
        gameSlug: res.game_slug,
        name: res.name,
        tag: res.tag,
        logoUrl: matchedTeam.logoUrl,
        inviteCode: res.invite_code,
        captainUserId: res.captain_id,
        captainUsername: res.captain_username,
        maxMembers: res.max_members,
        createdAt: new Date().toISOString(),
        members: res.members.map((m) => ({
          userId: m.user_id,
          username: m.username,
          role: (m.role === "CAPTAIN" ? "CAPTAIN" : "MEMBER") as "CAPTAIN" | "MEMBER",
          gameId: m.game_handle,
          riotId: m.game_handle,
          joinedAt: new Date().toISOString(),
        })),
      };

      setMatchedTeam(updatedTeam);
      setJoinedSuccess(true);
      onTeamJoined(updatedTeam);
    } catch (err: any) {
      console.warn("Backend API join failed:", err);
      setError(err?.message || "Failed to join squad. The roster may be full or the code is invalid.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white text-[#0B1C30] border border-slate-200 rounded-xl shadow-2xl p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#F59E0B]/10 border border-[#F59E0B] flex items-center justify-center text-[#F59E0B]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-slate-900">
                Join {gameName} Squad
              </h3>
              <span className="font-mono text-[10px] text-slate-500 uppercase">
                6-Character Invite Code • ₹0 Fee
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {joinedSuccess && matchedTeam ? (
          /* Success State */
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
              <Check className="w-8 h-8" />
            </div>

            <h4 className="font-headline font-bold text-xl text-slate-900 mb-1">
              Joined {matchedTeam.name}!
            </h4>
            <p className="text-xs text-slate-600 max-w-sm mb-6 leading-relaxed">
              You are now locked into the squad roster. Your verified player ID has been bound for upcoming tournament brackets.
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-sm cursor-pointer"
            >
              Continue to Game Hub
            </button>
          </div>
        ) : (
          /* Input & Preview State */
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 mb-1.5 font-semibold">
                Enter 6-Character Squad Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
                placeholder="e.g. SR7X4K"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-xl text-center text-[#E56A10] font-mono font-bold tracking-widest placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-[#E56A10] transition-colors shadow-xs"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Ask your squad captain for their 6-character team invite code.
              </span>
            </div>

            {/* Live Squad Preview Card */}
            {matchedTeam && (
              <div className="bg-[#EFF4FF] border border-[#CBD5E1] rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-sm text-[#0B1C30] shadow-xs">
                      {matchedTeam.tag}
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-sm text-slate-900">
                        {matchedTeam.name}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Captain: @{matchedTeam.captainUsername}
                      </span>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-700 text-xs font-bold rounded font-mono shadow-xs">
                    ₹0 FREE JOIN
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Roster Fill:</span>
                  <span className={`font-mono font-bold ${matchedTeam.members.length >= matchedTeam.maxMembers ? "text-rose-600 font-bold" : "text-slate-900"}`}>
                    {matchedTeam.members.length} / {matchedTeam.maxMembers} Players
                    {matchedTeam.members.length >= matchedTeam.maxMembers && " (FULL)"}
                  </span>
                </div>

                {matchedTeam.members.length >= matchedTeam.maxMembers && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-mono font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>ROSTER FULL — Maximum squad capacity reached. Cannot add more players.</span>
                  </div>
                )}

                {/* In-Game ID prompt */}
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-700 mb-1.5 font-semibold">
                    Your In-Game Handle / Player ID
                  </label>
                  <input
                    type="text"
                    value={inGameId}
                    onChange={(e) => setInGameId(e.target.value)}
                    placeholder="e.g. shadow#IND"
                    disabled={matchedTeam.members.length >= matchedTeam.maxMembers}
                    className="w-full px-3.5 py-2.5 bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 font-mono focus:outline-hidden focus:border-[#E56A10] transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-transparent text-slate-600 hover:text-slate-900 text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!matchedTeam || isJoining || (matchedTeam ? matchedTeam.members.length >= matchedTeam.maxMembers : false)}
                className="px-5 py-2.5 bg-[#E56A10] disabled:bg-slate-300 disabled:text-slate-500 hover:bg-[#C95B0A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {isJoining && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {matchedTeam && matchedTeam.members.length >= matchedTeam.maxMembers
                    ? "ROSTER FULL"
                    : isJoining
                    ? "Joining Squad..."
                    : "Join Squad (₹0)"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
