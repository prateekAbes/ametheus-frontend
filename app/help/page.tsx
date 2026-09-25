"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Search,
  Shield,
  Users,
  Wallet,
  Clock,
  AlertTriangle,
  FileCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface FaqItem {
  id: string;
  category: "team" | "wallet" | "matches" | "disputes" | "rules";
  categoryLabel: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "faq-team-create",
    category: "team",
    categoryLabel: "Team Management",
    question: "How do I form a competitive team and invite teammates?",
    answer:
      "Team creation is strictly anchored within game hubs (e.g. Games → Valorant → Create Team). Once created, the team captain receives a unique 6-character cryptographic invite code (e.g. SR7X4K). Teammates enter this code from their game hub or Dashboard to instantly join the roster for free.",
  },
  {
    id: "faq-team-limits",
    category: "team",
    categoryLabel: "Team Management",
    question: "Can captains remove members or transfer captaincy?",
    answer:
      "Yes. Team captains possess full roster administration controls on the game page, including kicking inactive members, setting in-game handles, or disbanding the team entirely provided the team is not currently active in a live tournament bracket.",
  },
  {
    id: "faq-wallet-payout",
    category: "wallet",
    categoryLabel: "Competitive Wallet & Payouts",
    question: "How does the AMETHEUS Platform Prize Vault Guarantee operate?",
    answer:
      "Every tournament entry fee is deposited into a secure prize holding vault before bracket generation. Upon final match verification by certified arbiters, prize pool funds disburse automatically directly to the registered winners' wallet accounts within 30 minutes.",
  },
  {
    id: "faq-wallet-refund",
    category: "wallet",
    categoryLabel: "Competitive Wallet & Payouts",
    question: "What happens if a tournament is cancelled by the organizer?",
    answer:
      "If a tournament is cancelled in accordance with platform regulations, 100% of collected entry fees are automatically refunded from the prize vault to the original payment methods within 2 hours, logged tamper-evidently to the SHA-256 audit ledger.",
  },
  {
    id: "faq-match-checkin",
    category: "matches",
    categoryLabel: "Match Day Operations",
    question: "What is the check-in protocol and forfeit grace period?",
    answer:
      "All participating teams must check in within their Match Lobby before scheduled match time. A strict 15-minute grace countdown begins at the scheduled match hour. If a roster fails to check in before the timer expires, the match automatically records a forfeit loss.",
  },
  {
    id: "faq-match-creds",
    category: "matches",
    categoryLabel: "Match Day Operations",
    question: "Where do we receive custom lobby credentials?",
    answer:
      "Randomized, per-match lobby codes and passwords (e.g. AMT-XXXXXX) unlock inside the Match Lobby Modal once both teams complete roster check-in. Matches are hosted exclusively on official low-latency Mumbai AWS servers (ap-south-1).",
  },
  {
    id: "faq-dispute-evidence",
    category: "disputes",
    categoryLabel: "Disputes & Arbitration",
    question: "What evidence is required when submitting match results or disputes?",
    answer:
      "Captains must submit an uncropped end-game scoreboard screenshot clearly displaying all 10 player handles, combat stats, and server time. If cheating or smurfing is suspected, captains can open a dispute ticket with server telemetry logs or video clips.",
  },
  {
    id: "faq-dispute-sla",
    category: "disputes",
    categoryLabel: "Disputes & Arbitration",
    question: "How quickly are live match disputes arbitrated?",
    answer:
      "Opening a dispute immediately freezes the affected bracket node. Official platform arbiters inspect scoreboard proofs and server telemetry with a strict SLA of under 15 minutes, ensuring the bracket advances without prolonged tournament disruption.",
  },
  {
    id: "faq-anticheat",
    category: "rules",
    categoryLabel: "Anti-Cheat & Fair Play",
    question: "What anti-cheat systems are mandatory for AMETHEUS matches?",
    answer:
      "Titles requiring client anti-cheat (e.g. Riot Vanguard for Valorant, VAC Live for CS2) require all players to play with active kernel-level drivers and hardware TPM 2.0. Any player flagged for third-party injects suffers immediate permanent platform disqualification.",
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFaq, setExpandedFaq] = useState<string | null>("faq-team-create");

  const categories = [
    { id: "all", label: "All Questions" },
    { id: "team", label: "Team Management" },
    { id: "wallet", label: "Competitive Wallet & Payouts" },
    { id: "matches", label: "Match Operations" },
    { id: "disputes", label: "Disputes & Arbitration" },
    { id: "rules", label: "Anti-Cheat & Rules" },
  ];

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full bg-[#F8F9FA] min-h-screen">
      {/* 1. Header Banner */}
      <section className="w-full bg-[#EFF4FF] py-12 md:py-16 border-b border-[#D3E4FE]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E5EEFF] border border-[#CBD5E1] rounded text-[#E56A10] text-xs font-bold font-mono tracking-wider uppercase mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            OFFICIAL RULEBOOK &amp; KNOWLEDGE BASE
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-headline text-[#0B1C30] uppercase">
            Platform Help Center
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#565E74] max-w-2xl leading-relaxed">
            Everything you need to know about competitive team creation, prize vault distribution, match day check-in protocols, and dispute arbitration.
          </p>

          {/* Search Bar */}
          <div className="mt-6 max-w-xl relative">
            <Search className="w-4 h-4 text-[#565E74] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search help articles (e.g. escrow, invite code, forfeit, dispute)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0B1C30] placeholder-[#94A3B8] focus:outline-hidden focus:ring-2 focus:ring-[#E56A10] shadow-xs"
            />
          </div>
        </div>
      </section>

      {/* 2. Main Body */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-12 space-y-8 w-full">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded text-xs font-headline font-bold uppercase tracking-wider transition-all ${
                selectedCategory === cat.id
                  ? "bg-[#E56A10] text-white shadow-xs"
                  : "bg-white border border-[#CBD5E1] text-[#565E74] hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedFaq === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white rounded-xl border border-[#D3E4FE] shadow-xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E56A10]">
                      {faq.categoryLabel}
                    </span>
                    <h3 className="font-headline font-bold text-sm sm:text-base text-[#0B1C30]">
                      {faq.question}
                    </h3>
                  </div>
                  <div className="w-7 h-7 rounded bg-[#EFF4FF] flex items-center justify-center text-[#565E74] shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#565E74] leading-relaxed border-t border-[#F1F5F9] font-sans">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-[#CBD5E1] text-[#64748B] text-xs">
              No matching help topics found for &quot;{searchQuery}&quot;. Try a different keyword or contact operations support.
            </div>
          )}
        </div>

        {/* Support Routing Card */}
        <div className="p-6 bg-white rounded-xl border border-[#D3E4FE] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-headline font-bold text-base text-[#0B1C30] uppercase">
              Need Live Match Arbitration or Escrow Assistance?
            </h4>
            <p className="text-xs text-[#565E74] font-mono mt-1">
              Our dedicated arbitration desk responds in under 15 minutes during active tournament play.
            </p>
          </div>
          <Link
            href="/contact"
            className="px-5 py-2.5 bg-[#0B1C30] hover:bg-[#162A45] text-white rounded font-headline font-bold text-xs uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5"
          >
            Escalate to Support Desk <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
