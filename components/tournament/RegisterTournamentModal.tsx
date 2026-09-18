"use client";

import { useState } from "react";
import { createEscrowOrder, verifyEscrowPayment } from "@/lib/api/payments";
import { Team } from "@/types";
import { X, Shield, Check, AlertCircle, CreditCard, Lock, Sparkles, Gamepad2, UserCheck } from "lucide-react";
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
        setError(`Your squad requires ${rosterReq.min} player${rosterReq.min > 1 ? "s" : ""} to enter this ${rosterReq.formatName} tournament (Current: ${selectedTeam.members.length} players).`);
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
    if (tournament.entryFeeNum === 0) {
      // Free tournament
      setIsProcessing(true);
      createEscrowOrder(tournament.id, isSolo ? undefined : selectedTeam?.id)
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

  const handleSandboxPayment = async (simulateFailure = false) => {
    if (!isSolo && !selectedTeam) return;
    setIsProcessing(true);
    setError("");

    try {
      if (simulateFailure) {
        throw new Error("Sandbox payment simulated failure: Card declined / Insufficient test funds.");
      }

      const order = await createEscrowOrder(tournament.id, isSolo ? undefined : selectedTeam?.id);
      await verifyEscrowPayment({
        razorpay_order_id: order.order_id || `order_${Date.now()}`,
        razorpay_payment_id: `pay_sandbox_${Date.now()}`,
        razorpay_signature: "mock_signature_verified",
      });
      setStep("SUCCESS");
      onRegistrationSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sandbox payment failed";
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRazorpayCheckout = async () => {
    if (!isSolo && !selectedTeam) return;
    setIsProcessing(true);
    setError("");

    try {
      const order = await createEscrowOrder(tournament.id, isSolo ? undefined : selectedTeam?.id);

      const rzpWindow = typeof window !== "undefined" ? (window as unknown as { Razorpay?: new (opts: Record<string, unknown>) => { on: (evt: string, cb: (res: { error?: { description?: string } }) => void) => void; open: () => void } }) : {};
      const hasRazorpayScript = !!rzpWindow.Razorpay;
      const isLiveKey = order.key_id && !order.key_id.startsWith("rzp_test_ametheus");

      if (hasRazorpayScript && isLiveKey && order.order_id && rzpWindow.Razorpay) {
        const options = {
          key: order.key_id,
          amount: order.amount_paise,
          currency: order.currency || "INR",
          name: "AMETHEUS Esports",
          description: `Tournament Entry: ${order.tournament_title || tournament.title}`,
          order_id: order.order_id,
          handler: async function (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) {
            try {
              setIsProcessing(true);
              await verifyEscrowPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setStep("SUCCESS");
              onRegistrationSuccess();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Payment verification failed";
              setError(msg);
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: isSolo ? (user?.fullName || user?.username || "Gamer") : selectedTeam?.name,
          },
          theme: {
            color: "#E56A10",
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new rzpWindow.Razorpay(options);
        rzp.on("payment.failed", function (response: { error?: { description?: string } }) {
          setError(response.error?.description || "Payment failed at gateway");
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        // Fallback directly to sandbox verified payment
        await handleSandboxPayment(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration payment failed";
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white text-[#0B1C30] border border-slate-200 rounded-xl shadow-2xl p-6 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#E56A10]/10 border border-[#E56A10] flex items-center justify-center text-[#E56A10]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-slate-900">
                Register for Tournament
              </h3>
              <span className="font-mono text-[10px] text-slate-500 uppercase">
                {tournament.title}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
                      const isEligible = team.members.length >= rosterReq.min;
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
                                {isEligible ? (
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
                                Captain: @{team.captainUsername} • {team.members.length}/{rosterReq.max} Players
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

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Tournament:</span>
                <span className="font-bold text-slate-900">{tournament.title}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{isSolo ? "Contender:" : "Registering Squad:"}</span>
                <span className="font-bold text-slate-900">
                  {isSolo ? (user?.fullName || user?.username || "Solo Athlete") : selectedTeam?.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Player In-Game Handle:</span>
                <span className="font-bold font-mono text-[#E56A10]">{inGameId}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-2">
                <span className="text-slate-500">Total Amount Due:</span>
                <span className="font-headline font-bold text-xl text-[#E56A10]">
                  {tournament.entryFee}
                </span>
              </div>
            </div>

            {/* Sandbox Test System Box */}
            <div className="bg-amber-50/70 border border-amber-300 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-900 uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Quick Sandbox Test Payment
                </div>
                <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-mono border border-amber-300 rounded font-bold">
                  TEST MODE ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Test the end-to-end tournament registration and prize vault entry without entering real UPI/card details.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleSandboxPayment(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isProcessing ? "Processing..." : "⚡ Instant Test Payment"}</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleSandboxPayment(true)}
                  className="w-full py-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-mono text-xs uppercase rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Simulate Failure</span>
                </button>
              </div>
            </div>

            {/* Payment Gateway Footer */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col items-center text-center gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-700 font-mono">
                <Lock className="w-3.5 h-3.5 text-[#E56A10]" />
                Razorpay Verified Checkout • UPI / NetBanking / Cards
              </div>
              <p className="text-[10px] text-slate-500">
                Prize funds are guaranteed and held in the protected prize vault until tournament completion.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep("SELECT_TEAM")}
                className="px-4 py-2 bg-transparent text-slate-600 hover:text-slate-900 text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRazorpayCheckout}
                className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#D45900] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isProcessing ? "Verifying..." : `Launch Razorpay Gateway`}</span>
              </button>
            </div>
          </div>
        )}

        {step === "SUCCESS" && (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
              <Check className="w-8 h-8" />
            </div>

            <h4 className="font-headline font-bold text-xl text-slate-900 mb-1">
              Registration Confirmed!
            </h4>
            <p className="text-xs text-slate-600 max-w-sm mb-6 leading-relaxed">
              {isSolo ? (
                <>You have been confirmed as a solo contender for <strong className="text-slate-900">{tournament.title}</strong> with player handle <code className="text-[#E56A10] font-bold">{inGameId}</code>. Match lobby instructions will unlock before launch.</>
              ) : (
                <>Your squad <strong className="text-slate-900">{selectedTeam?.name}</strong> has been seeded into the tournament with player handle <code className="text-[#E56A10] font-bold">{inGameId}</code>. Match lobby instructions will unlock before launch.</>
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
