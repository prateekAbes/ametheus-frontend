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
    <div className="min-h-screen bg-[#07090E] text-[#F8FAFC] py-12 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-[#161A24] border border-[#242C3D] rounded text-[#E56A10] text-xs font-mono font-bold tracking-widest uppercase mx-auto">
            <HelpCircle className="w-3.5 h-3.5" /> SUPPORT & INTEGRITY OPERATIONS
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-sans uppercase">
            CONTACT <span className="text-[#E56A10]">AMETHEUS</span> DESK
          </h1>
          <p className="text-sm md:text-base text-[#94A3B8] leading-relaxed">
            Need arbitration on a disputed bracket match, escrow payment assistance, or organizer certification? Our live operations desk responds in real-time.
          </p>
        </div>

        {/* 3 Operational Tracks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0B0E16] border border-[#242C3D] rounded-xl p-6 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white uppercase font-mono">
              Tournament Arbitration
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Active match disputes, no-shows, ringers, or screenshot evidence reviews are handled immediately by assigned Tournament Admins.
            </p>
            <div className="mt-auto flex items-center gap-2 text-xs text-[#CBD5E1] font-mono">
              <Clock className="w-3.5 h-3.5 text-[#E56A10]" /> Live Match SLA: &lt; 15 mins
            </div>
          </div>

          <div className="bg-[#0B0E16] border border-[#242C3D] rounded-xl p-6 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white uppercase font-mono">
              Escrow & Payment Vault
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Razorpay order verification, entry fee holding receipts, team cancellation refunds, and verified prize pool payout claims.
            </p>
            <div className="mt-auto flex items-center gap-2 text-xs text-[#CBD5E1] font-mono">
              <Clock className="w-3.5 h-3.5 text-[#E56A10]" /> Finance SLA: &lt; 2 hours
            </div>
          </div>

          <div className="bg-[#0B0E16] border border-[#242C3D] rounded-xl p-6 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white uppercase font-mono">
              Official Discord & Ops
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Direct voice channels with tournament referees, captain lobbies, and platform community match-finding.
            </p>
            <div className="mt-auto flex items-center gap-2 text-xs text-[#CBD5E1] font-mono">
              <Mail className="w-3.5 h-3.5 text-[#E56A10]" /> support@ametheus.gg
            </div>
          </div>
        </div>

        {/* Contact / Ticket Form */}
        <div className="bg-[#0B0E16] border border-[#242C3D] rounded-xl p-6 md:p-10 max-w-3xl mx-auto w-full">
          {submitted ? (
            <div className="text-center py-12 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold uppercase font-mono text-white">
                Ticket Logged Successfully
              </h2>
              <p className="text-sm text-[#94A3B8] max-w-md leading-relaxed">
                Your inquiry has been routed to our Operations Command desk. A reference ticket ID has been generated and dispatched to your email.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2.5 bg-[#161A24] border border-[#242C3D] hover:border-white text-xs font-mono font-bold uppercase rounded text-white transition-colors cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="border-b border-[#242C3D] pb-4">
                <h2 className="text-lg font-bold uppercase font-mono text-white">
                  Dispatch Operational Ticket
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Fill out the parameters below to open an expedited ticket with our duty administrator.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-[#CBD5E1] uppercase mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Alex Mercer"
                    className="w-full bg-[#10131B] border border-[#242C3D] rounded px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-medium text-[#CBD5E1] uppercase mb-1.5">
                    Registered Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@example.com"
                    className="w-full bg-[#10131B] border border-[#242C3D] rounded px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-[#CBD5E1] uppercase mb-1.5">
                    Gamer Tag / Riot ID
                  </label>
                  <input
                    type="text"
                    value={formData.handle}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                    placeholder="VORTEX#IND"
                    className="w-full bg-[#10131B] border border-[#242C3D] rounded px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-medium text-[#CBD5E1] uppercase mb-1.5">
                    Inquiry Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#10131B] border border-[#242C3D] rounded px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#E56A10]"
                  >
                    <option value="MATCH_DISPUTE">Match Dispute & Evidence</option>
                    <option value="ESCROW_PAYMENT">Escrow Payment / Refund</option>
                    <option value="ORGANIZER_PARTNERSHIP">Organizer Certification</option>
                    <option value="ANTI_CHEAT">Anti-Cheat & Fair Play Report</option>
                    <option value="TECHNICAL_BUG">Platform Bug / Glitch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#CBD5E1] uppercase mb-1.5">
                  Tournament or Match ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.tournamentId}
                  onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
                  placeholder="e.g. valorant-pro-invitational-s1"
                  className="w-full bg-[#10131B] border border-[#242C3D] rounded px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#CBD5E1] uppercase mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Explain the circumstance, match round, opponent handle, or payment reference..."
                  className="w-full bg-[#10131B] border border-[#242C3D] rounded px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
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
