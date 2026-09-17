"use client";

import { useState } from "react";
import { createEscrowOrder, verifyEscrowPayment } from "@/lib/api/payments";
import { Tournament, Team } from "@/types";
import { X, Shield, Check, AlertCircle, CreditCard, Lock, Sparkles, Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tournament: any;
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
  const [selectedTeamId, setSelectedTeamId] = useState(
    userTeams.length > 0 ? userTeams[0].id : ""
  );
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [step, setStep] = useState<"SELECT_TEAM" | "CHECKOUT" | "SUCCESS">("SELECT_TEAM");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const selectedTeam = userTeams.find((t) => t.id === selectedTeamId);

  const handleProceedToCheckout = () => {
    if (!selectedTeam) {
      setError("Please select a squad to register.");
      return;
    }
    if (selectedTeam.members.length < (tournament.gameSlug === "chess" ? 1 : 3)) {
      setError(`Your squad needs at least 3 players to enter this tournament (Current: ${selectedTeam.members.length}).`);
      return;
    }
    if (!acceptedRules) {
      setError("You must accept the tournament fair play rules and zero-substitute policy.");
      return;
    }

    setError("");
    if (tournament.entryFeeNum === 0) {
      // Free tournament
      setIsProcessing(true);
      createEscrowOrder(tournament.id, selectedTeam.id)
        .then(() => {
          setStep("SUCCESS");
          onRegistrationSuccess();
        })
        .catch((err) => {
          setError(err.message || "Registration failed");
        })
        .finally(() => setIsProcessing(false));
    } else {
      setStep("CHECKOUT");
    }
  };

  const handleSandboxPayment = async (simulateFailure = false) => {
    if (!selectedTeam) return;
    setIsProcessing(true);
    setError("");

    try {
      if (simulateFailure) {
        throw new Error("Sandbox payment simulated failure: Card declined / Insufficient test funds.");
      }

      const order = await createEscrowOrder(tournament.id, selectedTeam.id);
      await verifyEscrowPayment({
        razorpay_order_id: order.order_id || `order_${Date.now()}`,
        razorpay_payment_id: `pay_sandbox_${Date.now()}`,
        razorpay_signature: "mock_signature_verified",
      });
      setStep("SUCCESS");
      onRegistrationSuccess();
    } catch (err: any) {
      setError(err.message || "Sandbox payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRazorpayCheckout = async () => {
    if (!selectedTeam) return;
    setIsProcessing(true);
    setError("");

    try {
      const order = await createEscrowOrder(tournament.id, selectedTeam.id);

      const hasRazorpayScript = typeof window !== "undefined" && !!(window as any).Razorpay;
      const isLiveKey = order.key_id && !order.key_id.startsWith("rzp_test_ametheus");

      if (hasRazorpayScript && isLiveKey && order.order_id) {
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
            } catch (err: any) {
              setError(err.message || "Payment verification failed");
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: selectedTeam.name,
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

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          setError(response.error?.description || "Payment failed at gateway");
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        // Fallback directly to sandbox verified payment
        await handleSandboxPayment(false);
      }
    } catch (err: any) {
      setError(err.message || "Registration payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#10131B] text-[#F8FAFC] border border-[#242C3D] rounded-xl shadow-2xl p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242C3D] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#E56A10]/10 border border-[#E56A10] flex items-center justify-center text-[#E56A10]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-white">
                Register for Tournament
              </h3>
              <span className="font-mono text-[10px] text-[#94A3B8] uppercase">
                {tournament.title}
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

        {step === "SELECT_TEAM" && (
          <div className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800/80 rounded text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-2 font-semibold">
                Select Your Squad / Team
              </label>
              {userTeams.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {userTeams.map((team) => (
                    <label
                      key={team.id}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                        selectedTeamId === team.id
                          ? "bg-[#161A24] border-[#E56A10]"
                          : "bg-[#0B0E16] border-[#242C3D] hover:border-[#CBD5E1]"
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
                          <div className="font-bold text-sm text-white">
                            {team.name} [{team.tag}]
                          </div>
                          <div className="text-[11px] text-[#94A3B8] font-mono">
                            Captain: @{team.captainUsername} • {team.members.length} Players
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-[#E56A10] font-bold">
                        {team.inviteCode}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#0B0E16] border border-dashed border-[#242C3D] rounded-lg text-xs text-[#94A3B8]">
                  No active squads found for this title. Please create a squad on the game hub first.
                </div>
              )}
            </div>

            {/* Fee summary card */}
            <div className="bg-[#0B0E16] border border-[#242C3D] rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase font-mono block">
                  Team Entry Pass (Covers All 5 Players)
                </span>
                <span className="text-xl font-bold font-headline text-white">
                  {tournament.entryFee}
                </span>
              </div>
              <span className="px-2 py-1 bg-[#161A24] border border-[#242C3D] text-[#CBD5E1] text-[10px] font-mono rounded">
                100% SECURE ESCROW
              </span>
            </div>

            {/* Agreement */}
            <label className="flex items-start gap-2 text-xs text-[#94A3B8] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={acceptedRules}
                onChange={(e) => setAcceptedRules(e.target.checked)}
                className="mt-0.5 text-[#E56A10] focus:ring-[#E56A10] rounded"
              />
              <span>
                I agree to the tournament regulations: fixed 5-man roster, zero substitutes, hardware Vanguard ID checks, and mandatory check-in 30 mins before match start.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-transparent text-[#94A3B8] hover:text-white text-xs font-bold uppercase tracking-wider rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors"
              >
                Proceed to Checkout ({tournament.entryFee})
              </button>
            </div>
          </div>
        )}

        {step === "CHECKOUT" && (
          <div className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800/80 rounded text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-4 bg-[#161A24] border border-[#242C3D] rounded-lg flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Tournament:</span>
                <span className="font-bold text-white">{tournament.title}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Registering Squad:</span>
                <span className="font-bold text-white">{selectedTeam?.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-[#242C3D] pt-2">
                <span className="text-[#94A3B8]">Total Amount Due:</span>
                <span className="font-headline font-bold text-xl text-[#E56A10]">
                  {tournament.entryFee}
                </span>
              </div>
            </div>

            {/* Sandbox Test System Box */}
            <div className="bg-[#0B0E16] border border-amber-500/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Sandbox Escrow Simulation
                </div>
                <span className="px-1.5 py-0.5 bg-amber-950/60 text-amber-300 text-[10px] font-mono border border-amber-500/30 rounded font-bold">
                  TEST MODE ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Test the end-to-end tournament registration and escrow ledger verification without entering real UPI/card details.
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
                  className="w-full py-2.5 bg-[#161A24] hover:bg-rose-950/40 text-rose-300 border border-rose-800/40 font-mono text-xs uppercase rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Simulate Failure</span>
                </button>
              </div>
            </div>

            {/* Escrow Gateway Footer */}
            <div className="bg-[#0B0E16] border border-[#242C3D] rounded-lg p-3 flex flex-col items-center text-center gap-2">
              <div className="flex items-center gap-2 text-xs text-[#CBD5E1] font-mono">
                <Lock className="w-3.5 h-3.5 text-[#E56A10]" />
                Razorpay Platform Escrow • UPI / NetBanking / Cards
              </div>
              <p className="text-[10px] text-[#94A3B8]">
                Funds are held in cryptographic SHA-256 escrow until tournament completion and match verification.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("SELECT_TEAM")}
                className="px-4 py-2 bg-transparent text-[#94A3B8] hover:text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRazorpayCheckout}
                className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#D45900] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isProcessing ? "Verifying..." : `Launch Razorpay Gateway`}</span>
              </button>
            </div>
          </div>
        )}

        {step === "SUCCESS" && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center text-emerald-500 mb-4">
              <Check className="w-8 h-8" />
            </div>

            <h4 className="font-headline font-bold text-xl text-white mb-1">
              Registration Confirmed!
            </h4>
            <p className="text-xs text-[#94A3B8] max-w-sm mb-6">
              Your squad <strong className="text-white">{selectedTeam?.name}</strong> has been seeded into the tournament. Payment receipt and match lobby instructions will be sent before launch.
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors"
            >
              View Tournament Bracket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
