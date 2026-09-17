"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  HelpCircle,
  CreditCard,
  Mail,
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
} from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    handle: "",
    category: "MATCH_DISPUTE",
    tournamentId: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
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
            Need arbitration on a disputed bracket match, escrow payment assistance, or organizer certification? Our live operations desk responds in real-time.
          </p>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-12 flex flex-col gap-12 w-full">
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
              Escrow &amp; Payment Vault
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Razorpay order verification, entry fee holding receipts, team cancellation refunds, and verified prize pool payout claims.
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
              Official Discord &amp; Ops
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct voice channels with tournament referees, captain lobbies, and platform community match-finding.
            </p>
            <div className="mt-auto flex items-center gap-2 text-xs text-slate-700 font-mono pt-3 border-t border-slate-100">
              <Mail className="w-3.5 h-3.5 text-[#E56A10]" /> support@ametheus.gg
            </div>
          </div>
        </div>

        {/* Contact / Ticket Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-10 max-w-3xl mx-auto w-full shadow-sm">
          {submitted ? (
            <div className="text-center py-12 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold uppercase font-headline text-slate-900">
                Ticket Logged Successfully
              </h2>
              <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                Your inquiry has been routed to our Operations Command desk. A reference ticket ID has been generated and dispatched to your email.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono font-bold uppercase rounded-lg text-slate-900 transition-colors cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-lg font-bold uppercase font-headline text-slate-900">
                  Dispatch Operational Ticket
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Fill out the parameters below to open an expedited ticket with our duty administrator.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 uppercase mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Alex Mercer"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-[#E56A10] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 uppercase mb-1.5">
                    Registered Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@example.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-[#E56A10] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 uppercase mb-1.5">
                    Gamer Tag / In-Game Handle
                  </label>
                  <input
                    type="text"
                    value={formData.handle}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                    placeholder="VORTEX#IND"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-[#E56A10] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 uppercase mb-1.5">
                    Inquiry Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#E56A10] transition-colors"
                  >
                    <option value="MATCH_DISPUTE">Match Dispute &amp; Evidence</option>
                    <option value="ESCROW_PAYMENT">Escrow Payment / Refund</option>
                    <option value="ORGANIZER_PARTNERSHIP">Organizer Certification</option>
                    <option value="ANTI_CHEAT">Anti-Cheat &amp; Fair Play Report</option>
                    <option value="TECHNICAL_BUG">Platform Bug / Glitch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 uppercase mb-1.5">
                  Tournament or Match ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.tournamentId}
                  onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
                  placeholder="e.g. valorant-pro-invitational-s1"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-[#E56A10] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 uppercase mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Explain the circumstance, match round, opponent handle, or payment reference..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-[#E56A10] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  "Dispatching..."
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Operations Ticket
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
