"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  registerForTournament,
  registerForTournamentUpi,
  submitTournamentUtr,
  getTournamentRegistrationStatus,
  TournamentRegisterUpiResponse,
  TournamentRegistrationStatus,
} from "@/lib/api/tournaments";
import { getWallet } from "@/lib/api/wallet";
import { getMyTeams } from "@/lib/api/teams";
import { Team } from "@/types";
import {
  X,
  Shield,
  Check,
  AlertCircle,
  CreditCard,
  Wallet,
  Gamepad2,
  UserCheck,
  Users,
  ArrowRight,
  Loader2,
  CheckCircle,
  Copy,
  QrCode,
} from "lucide-react";
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
  maxTeamSize?: number;
  max_team_size?: number;
  isSolo?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tournament: TournamentModalData;
  userTeams?: Team[];
  onRegistrationSuccess: () => void;
}

export default function RegisterTournamentModal({
  isOpen,
  onClose,
  tournament,
  userTeams: initialTeams = [],
  onRegistrationSuccess,
}: Props) {
  const { user } = useUser();
  const [fetchedTeams, setFetchedTeams] = useState<Team[]>([]);
  const [isTeamsLoading, setIsTeamsLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [inGameId, setInGameId] = useState("");
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [step, setStep] = useState<"SELECT_TEAM" | "CHECKOUT" | "SUCCESS">("SELECT_TEAM");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Direct UPI & Existing Registration State
  const [existingReg, setExistingReg] = useState<TournamentRegistrationStatus["registration"] | null>(null);
  const [isCheckingReg, setIsCheckingReg] = useState(false);
  const [paymentMethodTab, setPaymentMethodTab] = useState<"WALLET" | "UPI">("WALLET");
  const [upiData, setUpiData] = useState<TournamentRegisterUpiResponse | null>(null);
  const [isLoadingUpi, setIsLoadingUpi] = useState(false);
  const [utrInput, setUtrInput] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [upiSubmittedSuccess, setUpiSubmittedSuccess] = useState(false);

  const gameSlug = (tournament.gameSlug || tournament.game_slug || "").toLowerCase();
  const requiredTeamSize = Number(tournament.min_team_size ?? tournament.minTeamSize ?? 1);
  const maxTeamSize = Number(tournament.max_team_size ?? tournament.maxTeamSize ?? (requiredTeamSize > 1 ? requiredTeamSize : 5));
  const isSolo = Boolean(
    tournament.isSolo ||
    (requiredTeamSize === 1 && maxTeamSize === 1) ||
    gameSlug === "chess"
  );
  const rosterLabel =
    requiredTeamSize === maxTeamSize
      ? `${requiredTeamSize} Players Required`
      : `${requiredTeamSize}-${maxTeamSize} Players Required`;

  // Check existing registration on open & team selection
  useEffect(() => {
    if (!isOpen || !tournament.id) return;
    setIsCheckingReg(true);
    getTournamentRegistrationStatus(tournament.id, isSolo ? undefined : selectedTeamId || undefined)
      .then((res) => {
        if (res?.is_registered && res.registration) {
          setExistingReg(res.registration);
        } else {
          setExistingReg(null);
        }
      })
      .catch(() => setExistingReg(null))
      .finally(() => setIsCheckingReg(false));
  }, [isOpen, tournament.id, selectedTeamId, isSolo]);

  useEffect(() => {
    if (!isOpen) return;

    // Reset state on open
    setError("");
    setStep("SELECT_TEAM");
    setIsTeamsLoading(true);
    setPaymentMethodTab("WALLET");
    setUpiData(null);
    setUtrInput("");
    setUpiSubmittedSuccess(false);

    // Fetch authoritative teams directly from MongoDB
    getMyTeams(gameSlug)
      .then((tList) => {
        const mapped: Team[] = (tList || []).map((t) => ({
          id: t.id,
          gameSlug: t.game_slug,
          name: t.name,
          tag: t.tag,
          logoUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop",
          inviteCode: t.invite_code,
          captainUserId: t.captain_id,
          captainUsername: t.captain_username,
          maxMembers: t.max_members,
          createdAt: new Date().toISOString(),
          members: (t.members || []).map((m) => ({
            userId: m.user_id,
            username: m.username,
            role: (m.role === "CAPTAIN" ? "CAPTAIN" : "MEMBER") as "CAPTAIN" | "MEMBER",
            gameId: m.game_handle,
            riotId: m.game_handle,
            joinedAt: new Date().toISOString(),
          })),
        }));
        setFetchedTeams(mapped);
        if (mapped.length > 0) {
          setSelectedTeamId(mapped[0].id);
        } else {
          setSelectedTeamId("");
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch teams from database for tournament:", err);
        setFetchedTeams([]);
        setSelectedTeamId("");
      })
      .finally(() => {
        setIsTeamsLoading(false);
      });

    getWallet()
      .then((w) => setWalletBalance(w.available_inr))
      .catch(() => setWalletBalance(0));
  }, [isOpen, gameSlug]);

  if (!isOpen) return null;

  const activeTeams = fetchedTeams.length > 0 ? fetchedTeams : initialTeams;
  const selectedTeam = isSolo ? null : activeTeams.find((t) => t.id === selectedTeamId);

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
        setError("Please select a team to register.");
        return;
      }
      if (selectedTeam.members.length < requiredTeamSize) {
        const missing = requiredTeamSize - selectedTeam.members.length;
        setError(
          `Your team requires ${missing} more player${missing > 1 ? "s" : ""} to enter this tournament (Current: ${selectedTeam.members.length}/${requiredTeamSize} required). Manage your roster on the game page.`
        );
        return;
      }
      const maxCap = selectedTeam.maxMembers ?? maxTeamSize;
      if (selectedTeam.members.length > maxCap) {
        setError(`Your team has too many players (${selectedTeam.members.length}/${maxCap}). Maximum allowed for this tournament is ${maxCap}.`);
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
      setUpiSubmittedSuccess(false);
      setStep("SUCCESS");
      onRegistrationSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tournament registration failed";
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const initUpiPayment = async () => {
    setIsLoadingUpi(true);
    setError("");
    try {
      const data = await registerForTournamentUpi(tournament.id, isSolo ? undefined : selectedTeam?.id);
      setUpiData(data);
    } catch (err: any) {
      setError(err?.message || "Failed to initialize direct UPI payment account.");
    } finally {
      setIsLoadingUpi(false);
    }
  };

  const handleCopyUpi = () => {
    if (upiData?.upi_id) {
      navigator.clipboard.writeText(upiData.upi_id);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  const handleSubmitUtr = async () => {
    if (!upiData) return;
    const clean = utrInput.trim();
    if (!clean || clean.length < 6) {
      setError("Please enter a valid UPI Reference / UTR Number (minimum 6 digits).");
      return;
    }
    setIsProcessing(true);
    setError("");
    try {
      await submitTournamentUtr(tournament.id, {
        payment_id: upiData.payment_id,
        utr: clean,
      });
      setUpiSubmittedSuccess(true);
      setStep("SUCCESS");
      onRegistrationSuccess();
    } catch (err: any) {
      setError(err?.message || "Failed to submit UPI UTR. Please verify the reference and try again.");
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

        {/* Existing Registration Guard Banner */}
        {existingReg && (
          <div
            className={`p-4 rounded-xl border mb-4 text-xs font-mono space-y-1.5 ${
              existingReg.payment_status === "PAID" || existingReg.payment_status === "FREE"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>
                {existingReg.payment_status === "PAID" || existingReg.payment_status === "FREE"
                  ? "Already Registered & Confirmed"
                  : "Registration Pending Admin Verification"}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {existingReg.payment_status === "PAID" || existingReg.payment_status === "FREE"
                ? "Your entry for this tournament is locked in. Match room credentials will appear before the scheduled start."
                : `Your registration with payment reference (${existingReg.utr || "Submitted"}) is awaiting admin verification. Your slot is held.`}
            </p>
          </div>
        )}

        {step === "SELECT_TEAM" && (
          <div className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Team Selection or Solo Contender Card */}
            {isSolo ? (
              <div className="p-4 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    1. Solo Athlete Contender
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded">
                    SOLO (1v1) FORMAT
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 border border-slate-300 dark:border-[#242C3D] shrink-0">
                    <img
                      src={user?.imageUrl || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop"}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">
                      {user?.fullName || user?.username || "Individual Athlete"}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Competing solo • No team required
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-semibold">
                    1. Select Your Registered Team
                  </label>
                  <span className="text-[11px] font-mono font-bold text-[#E56A10] bg-[#E56A10]/10 border border-[#E56A10]/30 px-2 py-0.5 rounded">
                    {rosterLabel}
                  </span>
                </div>

                {isTeamsLoading ? (
                  <div className="p-4 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-xl space-y-3 animate-pulse">
                    <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  </div>
                ) : activeTeams.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {activeTeams.map((team) => {
                      const maxCap = team.maxMembers ?? maxTeamSize;
                      const isFull = team.members.length > maxCap;
                      const isEligible = team.members.length >= requiredTeamSize && !isFull;
                      return (
                        <label
                          key={team.id}
                          className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                            selectedTeamId === team.id
                              ? "bg-[#EFF4FF] dark:bg-[#161f38] border-[#E56A10]"
                              : "bg-slate-50 dark:bg-[#161B26] border-slate-200 dark:border-[#242C3D] hover:border-slate-300"
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
                              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{team.name} [{team.tag}]</span>
                                {isFull ? (
                                  <span className="text-[9px] text-red-700 bg-red-100 font-mono font-bold px-1.5 py-0.2 rounded border border-red-200">
                                    ROSTER FULL
                                  </span>
                                ) : isEligible ? (
                                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 font-mono font-bold px-1.5 py-0.2 rounded">
                                    Eligible ({team.members.length}/{requiredTeamSize})
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 font-mono font-bold px-1.5 py-0.2 rounded">
                                    {requiredTeamSize - team.members.length} More Needed
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
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
                  /* Clean Empty State: Direct to Game Page */
                  <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3 text-center">
                    <Users className="w-8 h-8 text-amber-500 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-headline">
                        Team Required for Tournament
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-1">
                        You do not have a registered team for {tournament.gameName || "this game"} yet. Teams are created and managed on the official game page.
                      </p>
                    </div>
                    <div className="pt-1">
                      <Link
                        href={`/games/${gameSlug}`}
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded-lg transition-colors shadow-xs"
                      >
                        <span>Go to {tournament.gameName || "Game"} Page to Form Team</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* In-Game ID Input */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-mono uppercase text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-[#E56A10]" />
                2. {gameIdLabel}
              </label>
              <input
                type="text"
                value={inGameId}
                onChange={(e) => setInGameId(e.target.value)}
                placeholder={gameIdPlaceholder}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] focus:border-[#E56A10] focus:bg-white dark:focus:bg-[#1a2233] text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-mono rounded-lg outline-hidden transition-all shadow-xs"
                required
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {gameIdHelper}
              </p>
            </div>

            {/* Fee summary card */}
            <div className="bg-[#EFF4FF] dark:bg-[#161f38] border border-[#CBD5E1] dark:border-[#242C3D] rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block">
                  {isSolo ? "Solo Contender Pass (1 Player)" : "Team Entry Pass (Covers Entire Team)"}
                </span>
                <span className="text-xl font-bold font-headline text-slate-900 dark:text-white">
                  {tournament.entryFee}
                </span>
              </div>
              <span className="px-2 py-1 bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] text-[#E56A10] text-[10px] font-mono font-bold rounded shadow-xs">
                100% SECURE PRIZE VAULT GUARANTEE
              </span>
            </div>

            {/* Agreement */}
            <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
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

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-[#242C3D]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(existingReg) || (!isSolo && activeTeams.length === 0)}
                onClick={handleProceedToCheckout}
                className="px-5 py-2.5 bg-[#E56A10] disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 hover:bg-[#C95B0A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-sm cursor-pointer"
              >
                {existingReg ? "Already Registered (Locked)" : `Proceed to Checkout (${tournament.entryFee})`}
              </button>
            </div>
          </div>
        )}

        {step === "CHECKOUT" && (
          <div className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-4 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-lg flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Tournament:</span>
                <span className="font-bold text-slate-900 dark:text-white">{tournament.title}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{isSolo ? "Contender:" : "Registering Team:"}</span>
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

            {/* Payment Method Switcher (Wallet vs Direct UPI) */}
            <div className="flex rounded-lg border border-slate-200 dark:border-[#242C3D] p-1 bg-slate-100 dark:bg-[#161B26]">
              <button
                type="button"
                onClick={() => setPaymentMethodTab("WALLET")}
                className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  paymentMethodTab === "WALLET"
                    ? "bg-white dark:bg-[#20283C] text-[#E56A10] shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                Wallet Balance
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethodTab("UPI");
                  if (!upiData && !isLoadingUpi) {
                    initUpiPayment();
                  }
                }}
                className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  paymentMethodTab === "UPI"
                    ? "bg-white dark:bg-[#20283C] text-[#E56A10] shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                Direct UPI (QR / VPA)
              </button>
            </div>

            {paymentMethodTab === "WALLET" ? (
              <>
                {/* Insufficient balance prompt or secure deduction confirmation */}
                {walletBalance !== null && (tournament.entryFeeNum || 0) > walletBalance ? (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-lg text-xs space-y-2">
                    <div className="text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      Insufficient Wallet Balance
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px] leading-relaxed">
                      Entry fee requires ₹{tournament.entryFeeNum}. Your available balance is ₹{walletBalance.toLocaleString()}. You can switch to <strong>Direct UPI</strong> above to pay instantly via QR code without topping up.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethodTab("UPI");
                          if (!upiData && !isLoadingUpi) initUpiPayment();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-mono text-[11px] font-bold uppercase rounded shadow-xs cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Pay with Direct UPI Instead →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-lg p-3 flex flex-col items-center text-center gap-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-mono">
                      <Wallet className="w-3.5 h-3.5 text-[#E56A10]" />
                      Direct Wallet Balance Deduction • Instant Registration
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      The entry fee will be deducted directly from your competitive wallet balance.
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
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    <span>{isProcessing ? "Processing..." : "Confirm Wallet Deduction"}</span>
                  </button>
                </div>
              </>
            ) : (
              /* DIRECT UPI SECTION */
              <div className="space-y-4">
                {isLoadingUpi ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-[#161B26] rounded-xl border border-slate-200 dark:border-[#242C3D] space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#E56A10] mx-auto" />
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                      Generating official UPI QR &amp; payment reference...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-lg space-y-2 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Official UPI ID:</span>
                        <div className="flex items-center gap-1.5">
                          <code className="text-[#E56A10] font-bold text-xs bg-white dark:bg-[#0B0E16] px-2 py-0.5 rounded border border-slate-200 dark:border-[#242C3D]">
                            {upiData?.upi_id || "Loading..."}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
                            title="Copy UPI ID"
                          >
                            {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Payee Name:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{upiData?.payee_name || "Ametheus Esports"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Payee Code:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{upiData?.account_code || "UPI001"}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 dark:border-[#242C3D] pt-2">
                        <span className="text-slate-500 dark:text-slate-400 font-bold">Exact Amount:</span>
                        <span className="font-bold text-base text-[#E56A10]">₹{upiData?.amount_inr ?? tournament.entryFeeNum}</span>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-lg">
                      <img
                        src={
                          upiData?.qr_url ||
                          `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                            upiData?.upi_uri || `upi://pay?pa=${upiData?.upi_id}&pn=Ametheus&am=${tournament.entryFeeNum}&cu=INR`
                          )}`
                        }
                        alt="Official UPI QR Code"
                        className="w-40 h-40 object-contain rounded-md border border-slate-200 dark:border-slate-700 bg-white"
                      />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-2 text-center">
                        Scan with GPay, PhonePe, Paytm, BHIM, or any banking UPI app
                      </span>
                    </div>

                    {/* UTR Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200">
                        12-Digit UPI Ref / UTR Number
                      </label>
                      <input
                        type="text"
                        maxLength={24}
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value)}
                        placeholder="e.g. 524018294821"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:border-[#E56A10] outline-hidden shadow-xs"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Enter the 12-digit transaction ID from your payment confirmation screen or bank SMS.
                      </p>
                    </div>

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
                        disabled={isProcessing || !utrInput.trim()}
                        onClick={handleSubmitUtr}
                        className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#D45900] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span>{isProcessing ? "Submitting..." : "Submit UTR & Register"}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {step === "SUCCESS" && (
          <div className="flex flex-col items-center text-center py-6">
            <div
              className={`w-14 h-14 rounded-full border flex items-center justify-center mb-4 shadow-sm ${
                upiSubmittedSuccess
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              <Check className="w-8 h-8" />
            </div>

            <h4 className="font-headline font-bold text-xl text-slate-900 dark:text-white mb-1">
              {upiSubmittedSuccess ? "Registration Submitted for Verification!" : "Registration Confirmed!"}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
              {upiSubmittedSuccess ? (
                <>
                  Your direct UPI transaction reference (<code className="text-[#E56A10] font-bold">{utrInput}</code>) has been submitted to tournament administrators. Your slot is held and will be confirmed once payment verification finishes.
                </>
              ) : isSolo ? (
                <>
                  You have been confirmed as a solo contender for <strong className="text-slate-900 dark:text-white">{tournament.title}</strong> with player handle <code className="text-[#E56A10] font-bold">{inGameId}</code>. Match lobby instructions will unlock before launch.
                </>
              ) : (
                <>
                  Your team <strong className="text-slate-900 dark:text-white">{selectedTeam?.name}</strong> has been seeded into the tournament with player handle <code className="text-[#E56A10] font-bold">{inGameId}</code>. Match lobby instructions will unlock before launch.
                </>
              )}
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-sm cursor-pointer"
            >
              {upiSubmittedSuccess ? "Done" : "View Tournament Bracket"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
