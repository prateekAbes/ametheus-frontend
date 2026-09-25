"use client";

import { useState } from "react";
import { X, Shield, Check, Copy, AlertCircle, Loader2 } from "lucide-react";
import { Team } from "@/types";
import { createTeam as apiCreateTeam } from "@/lib/api/teams";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameSlug: string;
  gameName: string;
  onTeamCreated: (team: Team) => void;
}

export default function CreateTeamModal({
  isOpen,
  onClose,
  gameSlug,
  gameName,
  onTeamCreated,
}: Props) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [gameId, setGameId] = useState("");
  const [createdTeam, setCreatedTeam] = useState<Team | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gameSlug === "chess") {
      setError("Chess is a solo discipline. Team creation is not allowed.");
      return;
    }

    if (!name.trim() || !tag.trim() || !gameId.trim()) {
      setError("All fields are required to register team.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await apiCreateTeam({
        game_slug: gameSlug,
        name: name.trim(),
        tag: tag.trim().toUpperCase(),
        captain_handle: gameId.trim(),
      });

      const newTeam: Team = {
        id: res.id,
        gameSlug: res.game_slug,
        name: res.name,
        tag: res.tag,
        logoUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop",
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

      setCreatedTeam(newTeam);
      onTeamCreated(newTeam);
    } catch (err: any) {
      console.warn("Backend API create team failed:", err);
      setError(err?.message || "Failed to create team. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = () => {
    if (createdTeam) {
      navigator.clipboard.writeText(createdTeam.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111622] text-[#0B1C30] dark:text-[#F8FAFC] border border-slate-200 dark:border-[#242C3D] rounded-xl shadow-2xl p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#E56A10]/10 border border-[#E56A10] flex items-center justify-center text-[#E56A10]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-slate-900 dark:text-white">
                Create {gameName} Team
              </h3>
              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase">
                Captain Designation • Official Roster
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdTeam ? (
          /* Success State with 6-character Code */
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
              <Check className="w-8 h-8" />
            </div>

            <h4 className="font-headline font-bold text-xl text-slate-900 dark:text-white mb-1">
              Team Successfully Created!
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
              You are officially designated as <strong className="text-slate-900 dark:text-white">CAPTAIN</strong>. Share this 6-character invite code with your teammates to assemble your roster.
            </p>

            <div className="w-full bg-[#EFF4FF] dark:bg-[#161f38] border border-[#CBD5E1] dark:border-[#242C3D] rounded-lg p-4 flex flex-col items-center gap-2 mb-6">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-mono tracking-wider font-semibold">
                Team Invite Code
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-3xl tracking-widest text-[#E56A10]">
                  {createdTeam.inviteCode}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="px-3.5 py-1.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="w-full text-left text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#161B26] p-3 rounded-lg border border-slate-200 dark:border-[#242C3D] mb-6 space-y-1">
              <div>
                <strong className="text-slate-900 dark:text-white">Team Name:</strong> {createdTeam.name} [{createdTeam.tag}]
              </div>
              <div>
                <strong className="text-slate-900 dark:text-white">Captain:</strong> @{createdTeam.captainUsername}
              </div>
              <div>
                <strong className="text-slate-900 dark:text-white">Roster Slots:</strong> 1 / {createdTeam.maxMembers} Filled
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-sm cursor-pointer"
            >
              Done & View Team
            </button>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 mb-1.5 font-semibold">
                Team Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Velocity Strike Elite"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#1a2233] focus:outline-hidden focus:border-[#E56A10] transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 mb-1.5 font-semibold">
                  Team Tag (3-4 Chars)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={tag}
                  onChange={(e) => setTag(e.target.value.toUpperCase())}
                  placeholder="e.g. VSE"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-mono uppercase focus:bg-white dark:focus:bg-[#1a2233] focus:outline-hidden focus:border-[#E56A10] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 mb-1.5 font-semibold">
                  Captain In-Game / Platform ID
                </label>
                <input
                  type="text"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  placeholder="e.g. vortex#IND"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-mono focus:bg-white dark:focus:bg-[#1a2233] focus:outline-hidden focus:border-[#E56A10] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-[#EFF4FF] dark:bg-[#161f38] border border-[#CBD5E1] dark:border-[#242C3D] rounded-lg text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="text-slate-900 dark:text-white font-semibold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#E56A10]" />
                Official Roster Policy
              </div>
              <p className="text-[11px] leading-relaxed">
                Tournaments enforce registered team rosters. Teammates join using your generated 6-character team invite code.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-[#242C3D]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#E56A10] disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 hover:bg-[#C95B0A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmitting ? "Creating Team..." : "Create Team & Generate Code"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
