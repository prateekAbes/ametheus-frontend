"use client";

import React, { useState } from "react";
import { X, QrCode, Copy, Check, Upload, Loader2, ShieldCheck, Wallet, ArrowRight, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { initiateGamePayment, submitPaymentUtr, InitiatePaymentResponse } from "@/lib/api/payments";
import { uploadImageFile } from "@/lib/api/media";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameSlug: string;
  gameName: string;
  entryFeeInr: number;
  teamId?: string;
  teamName?: string;
  onPaymentSuccess: () => void;
}

export default function GamePaymentModal({
  isOpen,
  onClose,
  gameSlug,
  gameName,
  entryFeeInr,
  teamId,
  teamName,
  onPaymentSuccess,
}: Props) {
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "WALLET">("UPI");
  const [step, setStep] = useState<"CHOOSE_METHOD" | "UPI_PAY" | "CONFIRMED">("CHOOSE_METHOD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<InitiatePaymentResponse | null>(null);
  const [utr, setUtr] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  if (!isOpen) return null;

  const handleInitiate = async (method: "UPI" | "WALLET") => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await initiateGamePayment(gameSlug, teamId, method);
      setPaymentData(res);
      if (res.status === "APPROVED" || method === "WALLET" || res.amount_inr === 0) {
        setStep("CONFIRMED");
        onPaymentSuccess();
      } else {
        setStep("UPI_PAY");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to initiate payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData?.payment_id) return;
    if (utr.trim().length < 6) {
      setError("Please enter a valid Transaction ID / UTR (min 6 characters).");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await submitPaymentUtr(paymentData.payment_id, utr.trim(), screenshotUrl || undefined);
      setStep("CONFIRMED");
      onPaymentSuccess();
    } catch (err: any) {
      setError(err?.message || "Failed to submit UTR. Please ensure it is not a duplicate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const walletDiscount = Math.round(entryFeeInr * 0.05);
  const walletFinalPrice = entryFeeInr - walletDiscount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#121622] border border-[#E2E8F0] dark:border-[#242C3D] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] dark:border-[#242C3D] flex items-center justify-between bg-slate-50 dark:bg-[#161A24] shrink-0">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#E56A10] uppercase tracking-wider block">
              Direct Game Participation Checkout
            </span>
            <h3 className="text-base sm:text-lg font-bold font-headline text-slate-900 dark:text-white">
              {gameName} Entry Fee
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-mono rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: CHOOSE METHOD */}
          {step === "CHOOSE_METHOD" && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-[#161A24] p-4 rounded-xl border border-slate-200 dark:border-[#242C3D] space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500">Title:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{gameName}</span>
                </div>
                {teamName && (
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-500">Participating Squad:</span>
                    <span className="font-bold text-[#E56A10]">{teamName}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-slate-200 dark:border-[#242C3D]">
                  <span className="text-slate-500">Standard Entry Fee:</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {entryFeeInr > 0 ? `₹${entryFeeInr}` : "FREE"}
                  </span>
                </div>
              </div>

              {entryFeeInr === 0 ? (
                <button
                  onClick={() => handleInitiate("UPI")}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Free Registration"}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Select Payment Method:
                  </div>

                  {/* Option 1: Wallet with 5% discount */}
                  <div
                    onClick={() => setPaymentMethod("WALLET")}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === "WALLET"
                        ? "border-[#E56A10] bg-[#E56A10]/5 dark:bg-[#E56A10]/10"
                        : "border-slate-200 dark:border-[#242C3D] bg-white dark:bg-[#161A24]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#E56A10]/10 text-[#E56A10] flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">Ametheus Wallet</span>
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold rounded">
                            5% OFF
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Instant one-click activation. Save ₹{walletDiscount}.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{walletFinalPrice}</div>
                      <div className="text-[10px] text-slate-400 line-through">₹{entryFeeInr}</div>
                    </div>
                  </div>

                  {/* Option 2: UPI via Rotated QR */}
                  <div
                    onClick={() => setPaymentMethod("UPI")}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === "UPI"
                        ? "border-[#E56A10] bg-[#E56A10]/5 dark:bg-[#E56A10]/10"
                        : "border-slate-200 dark:border-[#242C3D] bg-white dark:bg-[#161A24]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">UPI / QR Code</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          GPay, PhonePe, Paytm, BHIM via rotating QR.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">₹{entryFeeInr}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleInitiate(paymentMethod)}
                    disabled={isSubmitting}
                    className="w-full mt-4 py-3.5 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Proceed to {paymentMethod === "WALLET" ? "Wallet Payment" : "UPI QR"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: UPI ROTATED PAYMENT FLOW */}
          {step === "UPI_PAY" && paymentData && (
            <div className="space-y-5">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3.5 rounded-xl space-y-1 text-xs font-mono text-amber-800 dark:text-amber-300">
                <div className="font-bold uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Fixed Account Assignment: {paymentData.payment_account_code}
                </div>
                <p className="text-[11px] opacity-90">
                  This transaction is bound to receiving account <strong>{paymentData.payment_account_code}</strong>.
                </p>
              </div>

              {/* Dynamic QR Display */}
              <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] rounded-2xl space-y-3">
                <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
                  {paymentData.qr_url ? (
                    <img
                      src={paymentData.qr_url}
                      alt="UPI QR Code"
                      className="w-48 h-48 object-contain"
                    />
                  ) : paymentData.upi_uri ? (
                    <QRCodeSVG value={paymentData.upi_uri} size={192} level="M" />
                  ) : null}
                </div>

                <div className="text-center space-y-1">
                  <div className="text-xl font-bold font-headline text-slate-900 dark:text-white">
                    ₹{paymentData.amount_inr}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Pay To: <strong className="text-slate-700 dark:text-slate-300">{paymentData.payee_name}</strong>
                  </div>
                </div>

                {/* Copy UPI Button */}
                {paymentData.upi_id && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(paymentData.upi_id!)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? "Copied UPI ID!" : `Copy ${paymentData.upi_id}`}</span>
                  </button>
                )}
              </div>

              {/* Step-by-Step Instructions */}
              <div className="text-xs font-mono space-y-1.5 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#161A24] p-3.5 rounded-xl border border-slate-200 dark:border-[#242C3D]">
                <div className="font-bold text-slate-900 dark:text-slate-200 uppercase mb-1">How to complete:</div>
                <div>1. Scan the QR code or use the copied UPI ID in your payment app.</div>
                <div>2. Complete the ₹{paymentData.amount_inr} payment.</div>
                <div>3. Open the payment receipt in your UPI app and copy the <strong>Transaction ID / UTR</strong>.</div>
                <div>4. Paste the 12-digit UTR below to verify your entry.</div>
              </div>

              {/* UTR Form */}
              <form onSubmit={handleSubmitUtr} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200 mb-1">
                    UPI Transaction ID / UTR *
                  </label>
                  <input
                    type="text"
                    required
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder="e.g. 428192849201"
                    className="w-full bg-white dark:bg-[#0B0E16] border border-slate-300 dark:border-[#242C3D] rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#E56A10]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Payment Screenshot (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={screenshotUrl}
                      onChange={(e) => setScreenshotUrl(e.target.value)}
                      placeholder="Paste image URL or upload file"
                      className="flex-1 bg-white dark:bg-[#0B0E16] border border-slate-300 dark:border-[#242C3D] rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#E56A10]"
                    />
                    <label className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 shrink-0">
                      {isUploadingScreenshot ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingScreenshot}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUploadingScreenshot(true);
                            try {
                              const res = await uploadImageFile(file);
                              setScreenshotUrl(res.url);
                            } catch {
                              setError("Failed to upload screenshot image");
                            } finally {
                              setIsUploadingScreenshot(false);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !utr.trim()}
                  className="w-full py-3.5 bg-[#E56A10] hover:bg-[#D45900] disabled:opacity-50 text-white font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Submit Payment For Verification"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: CONFIRMED */}
          {step === "CONFIRMED" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold font-headline text-slate-900 dark:text-white uppercase">
                  {paymentMethod === "WALLET" ? "Payment Confirmed!" : "Payment Details Submitted"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono max-w-sm mx-auto">
                  {paymentMethod === "WALLET"
                    ? "Your team entry fee has been paid from your wallet. You are ready to play!"
                    : "Your transaction reference has been logged. Admin will review and verify your entry shortly."}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Close &amp; View Hub
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
