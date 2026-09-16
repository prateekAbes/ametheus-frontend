"use client";

import { useState } from "react";
import { X, Users, Check, AlertCircle, Sparkles } from "lucide-react";
import { Team } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameSlug: string;
  gameName: string;
  onTeamJoined: (team: Team) => void;
  findTeamByCode: (code: string) => Team | undefined;
}

export default function JoinTeamModal({
  isOpen,
  onClose,
  gameSlug,
  gameName,
  onTeamJoined,
  findTeamByCode,
}: Props) {
  const [code, setCode] = useState("");
  const [inGameId, setInGameId] = useState("");
  const [matchedTeam, setMatchedTeam] = useState<Team | null>(null);
  const [error, setError] = useState("");
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().trim();
    setCode(val);
    setError("");

    if (val.length === 6) {
      const team = findTeamByCode(val);
      if (team) {
        if (team.gameSlug !== gameSlug) {
          setError(`This code belongs to a ${team.gameSlug} team, not ${gameName}.`);
          setMatchedTeam(null);
        } else {
          setMatchedTeam(team);
        }
      } else {
        setError("No active squad found with this 6-character code.");
        setMatchedTeam(null);
      }
    } else {
      setMatchedTeam(null);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedTeam) {
      setError("Please enter a valid 6-character team code.");
      return;
    }
    if (!inGameId.trim()) {
      setError("Please enter your verified Riot / In-Game ID.");
      return;
    }

    if (matchedTeam.members.length >= matchedTeam.maxMembers) {
      setError("This squad is already full (5/5).");
      return;
    }

    const updatedTeam: Team = {
      ...matchedTeam,
      members: [
        ...matchedTeam.members,
        {
          userId: `usr_${Date.now()}`,
          username: inGameId.split("#")[0] || "Contender",
          role: "MEMBER",
          gameId: inGameId.trim(),
          riotId: inGameId.trim(),
          joinedAt: new Date().toISOString(),
        },
      ],
    };

    setMatchedTeam(updatedTeam);
    setJoinedSuccess(true);
    onTeamJoined(updatedTeam);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#10131B] text-[#F8FAFC] border border-[#242C3D] rounded-xl shadow-2xl p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242C3D] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#F59E0B]/10 border border-[#F59E0B] flex items-center justify-center text-[#F59E0B]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-white">
                Join {gameName} Squad
              </h3>
              <span className="font-mono text-[10px] text-[#94A3B8] uppercase">
                6-Character Invite Code • ₹0 Fee
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#94A3B8] hover:text-white hover:bg-[#161A24] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {joinedSuccess && matchedTeam ? (
          /* Success State */
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center text-emerald-500 mb-4">
              <Check className="w-8 h-8" />
            </div>

            <h4 className="font-headline font-bold text-xl text-white mb-1">
              Joined {matchedTeam.name}!
            </h4>
            <p className="text-xs text-[#94A3B8] max-w-sm mb-6">
              You are now locked into the squad roster. Your verified Riot ID has been bound for upcoming tournament brackets.
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors"
            >
              Continue to Game Hub
            </button>
          </div>
        ) : (
          /* Input & Preview State */
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800/80 rounded text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1.5 font-semibold">
                Enter 6-Character Squad Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
                placeholder="e.g. SR7X4K"
                className="w-full px-4 py-3 bg-[#0B0E16] border border-[#242C3D] rounded text-xl text-center text-[#E56A10] font-mono font-bold tracking-widest placeholder-[#64748B] focus:outline-none focus:border-[#E56A10]"
                required
              />
              <span className="text-[11px] text-[#94A3B8] mt-1 block">
                Ask your squad captain for their 6-character team invite code.
              </span>
            </div>

            {/* Live Squad Preview Card */}
            {matchedTeam && (
              <div className="bg-[#161A24] border border-[#242C3D] rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded bg-[#0B0E16] border border-[#242C3D] flex items-center justify-center font-bold text-sm text-[#F59E0B]">
                      {matchedTeam.tag}
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-sm text-white">
                        {matchedTeam.name}
                      </h4>
                      <span className="text-[11px] text-[#94A3B8] font-mono">
                        Captain: @{matchedTeam.captainUsername}
                      </span>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500 text-emerald-400 text-xs font-bold rounded font-mono">
                    ₹0 JOIN FEE
                  </div>
                </div>

                <div className="border-t border-[#242C3D] pt-3 flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8]">Roster Fill:</span>
                  <span className="font-mono font-bold text-white">
                    {matchedTeam.members.length} / {matchedTeam.maxMembers} Players
                  </span>
                </div>

                {/* In-Game ID prompt */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1.5 font-semibold">
                    Your In-Game / Riot ID
                  </label>
                  <input
                    type="text"
                    value={inGameId}
                    onChange={(e) => setInGameId(e.target.value)}
                    placeholder="e.g. shadow#IND"
                    className="w-full px-3 py-2 bg-[#0B0E16] border border-[#242C3D] rounded text-sm text-white placeholder-[#64748B] font-mono focus:outline-none focus:border-[#E56A10]"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-transparent text-[#94A3B8] hover:text-white text-xs font-bold uppercase tracking-wider rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!matchedTeam}
                className="px-5 py-2.5 bg-[#E56A10] disabled:bg-[#242C3D] disabled:text-[#64748B] hover:bg-[#C95B0A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors"
              >
                Join Squad (₹0)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
