"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  HelpCircle,
  CreditCard,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ArrowRight,
  LifeBuoy,
} from "lucide-react";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/constants/support";
import { createSupportTicket, SupportTicketPublicResponse } from "@/lib/api/support";

const CATEGORIES = [
  { value: "PAYMENT", label: "Payment & UTR Verification", isPayment: true },
  { value: "WALLET", label: "Wallet Balance & Withdrawals", isPayment: true },
  { value: "TOURNAMENT", label: "Tournament Entry & Brackets", isPayment: false },
  { value: "REGISTRATION", label: "Team / Solo Registration", isPayment: true },
  { value: "TEAM", label: "Team Rosters & Captain Invite Code", isPayment: false },
  { value: "MATCH", label: "Match Lobby & Dispute Evidence", isPayment: false },
  { value: "ACCOUNT", label: "Gamer Tag & Profile Account", isPayment: false },
  { value: "TECHNICAL_ISSUE", label: "Technical Issue / Client Bug", isPayment: false },
  { value: "GAME_ISSUE", label: "Game Protocol / Anti-Cheat", isPayment: false },
  { value: "OTHER", label: "Other General Inquiry", isPayment: false },
];

const PAYMENT_TYPES = [
  { value: "UPI", label: "UPI Transfer (GPay / PhonePe / Paytm)" },
  { value: "WALLET", label: "Wallet Balance" },
  { value: "REGISTRATION_PAYMENT", label: "Tournament Registration Fee" },
  { value: "WITHDRAWAL", label: "Prize Vault Withdrawal" },
  { value: "OTHER", label: "Other Payment Method" },
  { value: "NOT_APPLICABLE", label: "Not Applicable" },
];

export default function ContactPage() {
  const { user, isLoaded } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("PAYMENT");
  const [paymentType, setPaymentType] = useState("UPI");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<SupportTicketPublicResponse | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Auto-populate from authenticated Clerk session
  useEffect(() => {
    if (isLoaded && user) {
      if (!name) {
        setName(user.fullName || user.username || "");
      }
      if (!email) {
        setEmail(user.primaryEmailAddress?.emailAddress || "");
      }
    }
  }, [isLoaded, user, name, email]);

  const selectedCategoryObj = CATEGORIES.find((c) => c.value === category);
  const showPaymentType = selectedCategoryObj?.isPayment ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please provide your name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Please provide a detailed description (at least 10 characters).");
      return;
    }

    setLoading(true);
    try {
      const res = await createSupportTicket({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        category,
        payment_type: showPaymentType ? paymentType : undefined,
        description: description.trim(),
      });
      setCreatedTicket(res);
    } catch (err: any) {
      setError(err?.message || "Failed to submit support ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTicketId = () => {
    if (!createdTicket) return;
    navigator.clipboard.writeText(createdTicket.ticket_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-[#0B1C30] flex flex-col">
      {/* 1. Header Banner */}
      <section className="w-full bg-[#EFF4FF] py-12 md:py-16 border-b border-[#D3E4FE]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-[#E5EEFF] border border-[#CBD5E1] rounded text-[#E56A10] text-xs font-mono font-bold tracking-widest uppercase mb-4">
            <HelpCircle className="w-3.5 h-3.5" /> SUPPORT &amp; INTEGRITY OPERATIONS
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#0B1C30] font-headline uppercase">
            CONTACT <span className="text-[#E56A10]">AMETHEUS</span> DESK
          </h1>
          <p className="mt-3 text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Need arbitration on a bracket match, payment verification, or tournament assistance? Submit an official support ticket and our operations desk will assist you.
          </p>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-12 flex flex-col gap-12 w-full">
        {/* Support Ticket Form or Confirmation */}
        <div className="bg-white border border-[#D3E4FE] rounded-2xl p-6 md:p-10 shadow-sm">
          {createdTicket ? (
            /* Ticket Created Confirmation View */
            <div className="text-center py-8 space-y-6 max-w-xl mx-auto">
              <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm animate-in zoom-in-75 duration-300">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-widest">
                  Ticket Created &amp; Confirmed
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-headline text-[#0B1C30] uppercase mt-1">
                  Support Request Logged
                </h2>
                <p className="text-sm text-slate-600 mt-2">
                  Thank you, <strong>{createdTicket.name}</strong>. Your ticket has been entered into the active operations queue and emailed to our support arbiters.
                </p>
              </div>

              {/* Unique Ticket ID Box */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                  Your Official Reference ID
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-mono font-extrabold text-[#E56A10] tracking-wider select-all">
                    {createdTicket.ticket_id}
                  </span>
                  <button
                    onClick={handleCopyTicketId}
                    type="button"
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                    title="Copy Ticket ID"
                  >
                    {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copiedId && (
                  <span className="text-xs font-mono text-emerald-600 font-bold">Copied to clipboard!</span>
                )}
              </div>

              <div className="text-xs font-mono text-slate-500 space-y-2 bg-[#EFF4FF] p-4 rounded-xl text-left border border-[#D3E4FE]">
                <div className="flex items-center gap-2 font-bold text-[#0B1C30]">
                  <Mail className="w-4 h-4 text-[#E56A10]" /> Confirmation &amp; Routing Details
                </div>
                <p className="text-slate-600 leading-relaxed">
                  • A confirmation email has been dispatched to <strong>{email}</strong> with your Ticket ID and issue summary.
                  <br />
                  • A notification copy was transmitted to <strong>ametheus.gg@gmail.com</strong>.
                  <br />
                  • Please reference <strong>{createdTicket.ticket_id}</strong> in any future correspondence regarding this request.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setCreatedTicket(null);
                    setDescription("");
                  }}
                  className="px-5 py-2.5 bg-[#0B1C30] hover:bg-[#162A45] text-white rounded-lg font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Submit Another Ticket
                </button>
                <Link
                  href="/help"
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-mono text-xs font-bold uppercase transition-colors"
                >
                  Browse Help Center
                </Link>
              </div>
            </div>
          ) : (
            /* Ticket Submission Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-xl font-bold font-headline text-[#0B1C30] uppercase flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-[#E56A10]" /> Open an Official Support Ticket
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  All requests generate a permanent Ticket ID, audit history, and email notifications to you and the platform arbiters.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. gamer@example.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1.5">
                    Issue Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-[#E56A10] cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional Payment Type */}
                {showPaymentType ? (
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1.5">
                      Payment Type / Method
                    </label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-[#E56A10] cursor-pointer"
                    >
                      {PAYMENT_TYPES.map((pt) => (
                        <option key={pt.value} value={pt.value}>
                          {pt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="hidden sm:block">
                    {/* Placeholder for grid alignment */}
                  </div>
                )}

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1.5">
                    Issue Description *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your issue in detail. If this is a payment issue, please include the UTR number or transaction reference. If it's a match dispute, include the match ID or opponent tag..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-[#E56A10] leading-relaxed"
                  />
                  <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                    Minimum 10 characters. Please be as specific as possible to expedite arbitration.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-xs font-mono text-slate-500">
                  Confirmation will be dispatched to your submitted email.
                </span>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Support Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 3 Operational Tracks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4 shadow-sm hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 uppercase font-headline">
              Tournament Arbitration
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Active match disputes, no-shows, ringers, or screenshot evidence reviews are handled immediately by assigned Tournament Admins.
            </p>
            <div className="mt-auto flex items-center gap-2 text-xs text-slate-700 font-mono pt-3 border-t border-slate-100">
              <Clock className="w-3.5 h-3.5 text-[#E56A10]" /> Live Match SLA: &lt; 15 mins
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4 shadow-sm hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 uppercase font-headline">
              Prize &amp; Payment Vault
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Platform order verification, entry fee holding receipts, team cancellation refunds, and verified prize pool payout claims.
            </p>
            <div className="mt-auto flex items-center gap-2 text-xs text-slate-700 font-mono pt-3 border-t border-slate-100">
              <Clock className="w-3.5 h-3.5 text-[#E56A10]" /> Finance SLA: &lt; 2 hours
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4 shadow-sm hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 uppercase font-headline">
              Direct Support &amp; Ops
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct communication channels with tournament referees, support desk, and platform community operations.
            </p>
            <div className="mt-auto flex flex-col gap-1.5 text-xs text-slate-700 font-mono pt-3 border-t border-slate-100">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 hover:text-[#E56A10] transition-colors">
                <Mail className="w-3.5 h-3.5 text-[#E56A10]" /> {SUPPORT_EMAIL}
              </a>
              <a href={`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`} className="flex items-center gap-2 hover:text-[#E56A10] transition-colors">
                <Phone className="w-3.5 h-3.5 text-[#E56A10]" /> {SUPPORT_PHONE}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
