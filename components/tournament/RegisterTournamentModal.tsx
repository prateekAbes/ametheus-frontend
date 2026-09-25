"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { registerForTournament } from "@/lib/api/tournaments";
import { getWallet } from "@/lib/api/wallet";
import { Team } from "@/types";
import { X, Shield, Check, AlertCircle, CreditCard, Wallet, Gamepad2, UserCheck } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getGameRosterRequirement } from "@/lib/utils/gameRosters";

interface TournamentModalData {
  id: string;
  title: string;
  gameSlug?: string;
  game_slug?: string;
  gameName?: string;
  entryFee?: string;
  entryFeeNum?: number;
  minTeamSize?: number;
  min_team_size?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tournament: TournamentModalData;
  userTeams: Team[];
  onRegistrationSuccess: () => void;
}

export default function RegisterTournamentModal({
  isOpen,
  onClose,
  tournament,
  userTeams,
  onRegistrationSuccess,
}: Props) {
  const { user } = useUser();
  const [selectedTeamId, setSelectedTeamId] = useState(
    userTeams.length > 0 ? userTeams[0].id : ""
  );
  const [inGameId, setInGameId] = useState("");
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [step, setStep] = useState<"SELECT_TEAM" | "CHECKOUT" | "SUCCESS">("SELECT_TEAM");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      getWallet()
        .then((w) => setWalletBalance(w.available_inr))
        .catch(() => setWalletBalance(0));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const gameSlug = (tournament.gameSlug || tournament.game_slug || "").toLowerCase();
  const rosterReq = getGameRosterRequirement(gameSlug || tournament.title);
  const isSolo = !rosterReq.requiresTeam || rosterReq.min === 1 || tournament.minTeamSize === 1 || tournament.min_team_size === 1;

  const selectedTeam = isSolo ? null : userTeams.find((t) => t.id === selectedTeamId);

  // Dynamic game identifier labels
  let gameIdLabel = "In-Game Gamer Tag / Handle";
  let gameIdPlaceholder = "e.g. SpeedDemon99";
  let gameIdHelper = "Your registered player handle will be verified during lobby check-in.";

  if (gameSlug.includes("valorant")) {
    gameIdLabel = "Riot ID with Tagline (Required for Vanguard Anti-Cheat)";
    gameIdPlaceholder = "e.g. TenZ#0001";
    gameIdHelper = "Must match your active Riot Games account entering the custom room.";
  } else if (gameSlug.includes("counter-strike") || gameSlug.includes("cs2")) {
    gameIdLabel = "Steam ID64 or Profile URL (Required for VAC Live)";
    gameIdPlaceholder = "e.g. 76561198012345678 or steamcommunity.com/id/handle";
    gameIdHelper = "Steam account will be whitelisted on official 128-tick Mumbai servers.";
  } else if (gameSlug.includes("bgmi")) {
    gameIdLabel = "BGMI Character ID & IGN (Required)";
    gameIdPlaceholder = "e.g. 5123456789 (Phoenix)";
    gameIdHelper = "Required for custom room slot assignment.";
  } else if (gameSlug.includes("chess")) {
    gameIdLabel = "Chess.com or Lichess Username (Required)";
    gameIdPlaceholder = "e.g. GrandmasterBlitz";
    gameIdHelper = "Used to pair your bracket clock match.";
  }

  const handleProceedToCheckout = () => {
    if (!isSolo) {
      if (!selectedTeam) {
        setError("Please select a squad to register.");
        return;
      }
      if (selectedTeam.members.length < rosterReq.min) {
        const missing = rosterReq.min - selectedTeam.members.length;
        setError(`Your squad requires ${missing} more player${missing > 1 ? "s" : ""} to enter this ${rosterReq.formatName} tournament (Current: ${selectedTeam.members.length}/${rosterReq.min} required).`);
        return;
      }
      const maxCap = selectedTeam.maxMembers ?? rosterReq.max;
      if (selectedTeam.members.length > maxCap) {
        setError(`Your squad has too many players (${selectedTeam.members.length}/${maxCap}). Maximum for this format is ${maxCap}.`);
        return;
      }
    }
    if (!inGameId.trim()) {
      setError(`Please provide your ${gameIdLabel.split("(")[0].trim()} to participate.`);
      return;
    }
    if (!acceptedRules) {
      setError("You must accept the tournament fair play rules.");
      return;
    }

    setError("");
    if (!tournament.entryFeeNum || tournament.entryFeeNum === 0) {
      // Free tournament
      setIsProcessing(true);
      registerForTournament(tournament.id, isSolo ? undefined : selectedTeam?.id)
        .then(() => {
          setStep("SUCCESS");
          onRegistrationSuccess();
        })
        .catch((err: Error) => {
          setError(err.message || "Registration failed");
        })
        .finally(() => setIsProcessing(false));
    } else {
      setStep("CHECKOUT");
    }
  };

  const handleTournamentPayment = async () => {
    if (!isSolo && !selectedTeam) return;
    setIsProcessing(true);
    setError("");

    try {
      await registerForTournament(tournament.id, isSolo ? undefined : selectedTeam?.id);
      setStep("SUCCESS");
      onRegistrationSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tournament registration failed";
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111622] text-[#0B1C30] dark:text-[#F8FAFC] border border-slate-200 dark:border-[#242C3D] rounded-xl shadow-2xl p-6 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#E56A10]/10 border border-[#E56A10] flex items-center justify-center text-[#E56A10]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-slate-900 dark:text-white">
                Register for Tournament
              </h3>
              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase">
                {tournament.title}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "SELECT_TEAM" && (
          <div className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Squad Selection (or Solo Contender Card) */}
            {isSolo ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    1. Solo Athlete Contender
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                    SOLO (1v1) FORMAT
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 border border-slate-300 shrink-0">
                    <img
                      src={user?.imageUrl || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop"}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      {user?.fullName || user?.username || "Individual Athlete"}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Competing solo • No squad or teammates required
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-mono uppercase text-slate-700 font-semibold">
                    1. Select Your Squad / Team
                  </label>
                  <span className="text-[11px] font-mono font-bold text-[#E56A10] bg-[#E56A10]/10 border border-[#E56A10]/30 px-2 py-0.5 rounded">
                    {rosterReq.label}
                  </span>
                </div>
                {userTeams.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {userTeams.map((team) => {
                      const maxCap = team.maxMembers ?? rosterReq.max;
                      const isFull = team.members.length >= maxCap;
                      const isEligible = team.members.length >= rosterReq.min && !isFull;
                      return (
                        <label
                          key={team.id}
                          className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                            selectedTeamId === team.id
                              ? "bg-[#EFF4FF] border-[#E56A10]"
                              : "bg-slate-50 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="team_select"
                              value={team.id}
                              checked={selectedTeamId === team.id}
                              onChange={() => setSelectedTeamId(team.id)}
                              className="text-[#E56A10] focus:ring-[#E56A10]"
                            />
                            <div>
                              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                <span>{team.name} [{team.tag}]</span>
                                {isFull ? (
                                  <span className="text-[9px] text-red-700 bg-red-100 font-mono font-bold px-1.5 py-0.2 rounded border border-red-200">
                                    ROSTER FULL
                                  </span>
                                ) : isEligible ? (
                                  <span className="text-[9px] text-emerald-700 bg-emerald-100 font-mono font-bold px-1.5 py-0.2 rounded">
                                    Eligible
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-rose-700 bg-rose-100 font-mono font-bold px-1.5 py-0.2 rounded">
                                    {rosterReq.min - team.members.length} More Needed
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Captain: @{team.captainUsername} • {team.members.length}/{maxCap} Players
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-mono text-[#E56A10] font-bold">
                            {team.inviteCode}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500">
                    No active squads found for this title. Please create a squad on the game hub first.
                  </div>
                )}
              </div>
            )}

            {/* In-Game ID Input (Player Credentials required per prompt) */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-mono uppercase text-slate-700 font-semibold flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-[#E56A10]" />
                2. {gameIdLabel}
              </label>
              <input
                type="text"
                value={inGameId}
                onChange={(e) => setInGameId(e.target.value)}
                placeholder={gameIdPlaceholder}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-[#E56A10] focus:bg-white text-slate-900 placeholder:text-slate-400 text-xs font-mono rounded-lg outline-none transition-all shadow-xs"
                required
              />
              <p className="text-[11px] text-slate-500">
                {gameIdHelper}
              </p>
            </div>

            {/* Fee summary card */}
            <div className="bg-[#EFF4FF] border border-[#CBD5E1] rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">
                  {isSolo ? "Solo Contender Pass (1 Player)" : "Team Entry Pass (Covers Entire Squad)"}
                </span>
                <span className="text-xl font-bold font-headline text-slate-900">
                  {tournament.entryFee}
                </span>
              </div>
              <span className="px-2 py-1 bg-white border border-slate-200 text-[#E56A10] text-[10px] font-mono font-bold rounded shadow-xs">
                100% ESCROW VAULT GUARANTEE
              </span>
            </div>

            {/* Agreement */}
            <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={acceptedRules}
                onChange={(e) => setAcceptedRules(e.target.checked)}
                className="mt-0.5 text-[#E56A10] focus:ring-[#E56A10] rounded"
              />
              <span>
                I agree to tournament regulations: fair play rules, anti-cheat validation, and mandatory match lobby check-in 15 mins prior to start.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-transparent text-slate-600 hover:text-slate-900 text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-sm cursor-pointer"
              >
                Proceed to Checkout ({tournament.entryFee})
              </button>
            </div>
          </div>
        )}

        {step === "CHECKOUT" && (
          <div className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-4 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-lg flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Tournament:</span>
                <span className="font-bold text-slate-900 dark:text-white">{tournament.title}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{isSolo ? "Contender:" : "Registering Squad:"}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {isSolo ? (user?.fullName || user?.username || "Solo Athlete") : selectedTeam?.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Player In-Game Handle:</span>
                <span className="font-bold font-mono text-[#E56A10]">{inGameId}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-slate-200 dark:border-[#242C3D] pt-2">
                <span className="text-slate-500 dark:text-slate-400">Available Wallet Balance:</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  ₹{walletBalance !== null ? walletBalance.toLocaleString() : "..."}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-slate-200 dark:border-[#242C3D] pt-2">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Total Amount Due:</span>
                <span className="font-headline font-bold text-xl text-[#E56A10]">
                  {tournament.entryFee}
                </span>
              </div>
            </div>

            {/* Insufficient balance prompt or secure deduction confirmation */}
            {walletBalance !== null && (tournament.entryFeeNum || 0) > walletBalance ? (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-lg text-xs space-y-2">
                <div className="text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  Insufficient Wallet Balance
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px] leading-relaxed">
                  Entry fee requires ₹{tournament.entryFeeNum}. Your available balance is ₹{walletBalance.toLocaleString()}. Please top up your wallet in the dashboard to register.
                </p>
                <Link
                  href="/dashboard"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-mono text-[11px] font-bold uppercase rounded shadow-xs"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Top Up Wallet in Dashboard →
                </Link>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-lg p-3 flex flex-col items-center text-center gap-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-mono">
                  <Wallet className="w-3.5 h-3.5 text-[#E56A10]" />
                  Direct Wallet Balance Deduction • Instant Registration
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  The entry fee will be deducted directly from your captain wallet balance.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-[#242C3D]">
              <button
                type="button"
                onClick={() => setStep("SELECT_TEAM")}
                className="px-4 py-2 bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isProcessing || (walletBalance !== null && (tournament.entryFeeNum || 0) > walletBalance)}
                onClick={() => handleTournamentPayment()}
                className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#D45900] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isProcessing ? "Processing..." : `Confirm Wallet Deduction`}</span>
              </button>
            </div>
          </div>
        )}

        {step === "SUCCESS" && (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
              <Check className="w-8 h-8" />
            </div>

            <h4 className="font-headline font-bold text-xl text-slate-900 dark:text-white mb-1">
              Registration Confirmed!
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
              {isSolo ? (
                <>You have been confirmed as a solo contender for <strong className="text-slate-900 dark:text-white">{tournament.title}</strong> with player handle <code className="text-[#E56A10] font-bold">{inGameId}</code>. Match lobby instructions will unlock before launch.</>
              ) : (
                <>Your squad <strong className="text-slate-900 dark:text-white">{selectedTeam?.name}</strong> has been seeded into the tournament with player handle <code className="text-[#E56A10] font-bold">{inGameId}</code>. Match lobby instructions will unlock before launch.</>
              )}
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-sm cursor-pointer"
            >
              View Tournament Bracket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
