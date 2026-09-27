"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  HelpCircle,
  Search,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Mail,
  Phone,
  Wallet,
  Users,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/constants/support";

interface FaqItem {
  id: string;
  category: "wallet" | "team" | "matches" | "disputes" | "rules" | "account";
  categoryLabel: string;
  question: string;
  answer: string;
}

interface GuideItem {
  id: string;
  category: "wallet" | "team" | "matches" | "disputes" | "rules";
  categoryLabel: string;
  title: string;
  readTime: string;
  summary: string;
  steps: { title: string; detail: string }[];
}

const FAQS: FaqItem[] = [
  {
    id: "faq-wallet-payout",
    category: "wallet",
    categoryLabel: "Competitive Wallet & Payouts",
    question: "How does the AMETHEUS Platform Prize Vault Guarantee operate?",
    answer:
      "Every tournament entry fee is deposited into a secure prize holding vault before bracket generation. Upon final match verification by certified arbiters, prize pool funds disburse automatically directly to the registered winners' wallet accounts within 30 minutes.",
  },
  {
    id: "faq-wallet-deposit",
    category: "wallet",
    categoryLabel: "Competitive Wallet & Payouts",
    question: "How do UPI QR payments and 12-digit UTR verifications work?",
    answer:
      "When registering for an entry-fee tournament or adding funds to your wallet, the platform displays an official dynamic UPI QR code. Pay using any UPI app (GPay, PhonePe, Paytm, etc.) and submit the 12-digit numeric UTR/Reference number. The automated ledger audits and approves verified transactions instantly.",
  },
  {
    id: "faq-wallet-refund",
    category: "wallet",
    categoryLabel: "Competitive Wallet & Payouts",
    question: "What happens if a tournament is cancelled by the organizer?",
    answer:
      "If a tournament is cancelled in accordance with platform regulations, 100% of collected entry fees are automatically refunded from the prize vault to the original payment methods or player wallet balances within 2 hours, logged tamper-evidently to the SHA-256 audit ledger.",
  },
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
    id: "faq-match-checkin",
    category: "matches",
    categoryLabel: "Match Operations",
    question: "What is the check-in protocol and forfeit grace period?",
    answer:
      "All participating teams must check in within their Match Lobby before scheduled match time. A strict 15-minute grace countdown begins at the scheduled match hour. If a roster fails to check in before the timer expires, the match automatically records a forfeit loss.",
  },
  {
    id: "faq-match-creds",
    category: "matches",
    categoryLabel: "Match Operations",
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
      "Titles requiring client anti-cheat (e.g. Riot Vanguard for Valorant, VAC Live for CS2, Battlegrounds Anti-Cheat for BGMI) require all players to play with active kernel-level drivers and hardware TPM 2.0. Any player flagged for third-party injects suffers immediate permanent platform disqualification.",
  },
  {
    id: "faq-account-kyc",
    category: "account",
    categoryLabel: "Account & Profile",
    question: "How do I link and verify my In-Game Handle?",
    answer:
      "Head to your Profile / Settings to link your official in-game handle (Riot ID, BGMI Character ID, Free Fire UID, CODM IGN). In-game handles must match exactly with lobby rosters to prevent account ringers or smurfs.",
  },
];

const GUIDES: GuideItem[] = [
  {
    id: "guide-payment",
    category: "wallet",
    categoryLabel: "Competitive Wallet",
    title: "Tournament Registration & UPI Payment Walkthrough",
    readTime: "3 min read",
    summary: "Complete step-by-step instructions for paying tournament entry fees via UPI QR and verifying transaction UTR numbers.",
    steps: [
      {
        title: "1. Select Tournament & Click Register",
        detail: "Navigate to Active Tournaments, choose your game qualifier, and click 'Register Team' or 'Join Tournament'.",
      },
      {
        title: "2. Scan Official Dynamic UPI QR",
        detail: "The modal displays our official UPI payment QR code with the exact fee amount. Scan with GPay, PhonePe, Paytm, or BHIM.",
      },
      {
        title: "3. Copy 12-Digit Numeric UTR / Ref Number",
        detail: "After successful payment in your UPI app, copy the 12-digit transaction UTR number (e.g. 408198812345).",
      },
      {
        title: "4. Paste UTR and Submit for Ledger Verification",
        detail: "Paste the UTR into the verification field. The system logs the transaction and updates your entry to PAID upon automated verification.",
      },
    ],
  },
  {
    id: "guide-squad",
    category: "team",
    categoryLabel: "Team Management",
    title: "How to Build a Team Roster & Invite Teammates",
    readTime: "4 min read",
    summary: "Guide on creating teams within game hubs, distributing cryptographic invite codes, and managing player lineups.",
    steps: [
      {
        title: "1. Navigate to Game Hub",
        detail: "Go to Games Directory and select your competitive discipline (e.g. Valorant, BGMI, Free Fire).",
      },
      {
        title: "2. Create Team & Set Tag",
        detail: "Provide a unique team name and 3-5 character squad tag (e.g. 'Velocity Gaming' [VLT]).",
      },
      {
        title: "3. Share 6-Character Cryptographic Invite Code",
        detail: "The captain receives a unique invite code (e.g. 'X7K9PQ'). Teammates enter this code in the Game Hub to join without fees.",
      },
      {
        title: "4. Lock Roster Before Tournament Deadline",
        detail: "Ensure all core members and designated substitute have joined and verified their in-game handles before the roster lock countdown.",
      },
    ],
  },
  {
    id: "guide-matchday",
    category: "matches",
    categoryLabel: "Match Day Protocols",
    title: "Match Day Check-In & Custom Lobby Protocol",
    readTime: "3 min read",
    summary: "Exact schedule, 15-minute grace countdowns, server regions, and room credential distribution rules.",
    steps: [
      {
        title: "1. Arrive at Match Lobby 15 Minutes Prior",
        detail: "Navigate to Live Match Ticker or your Tournament Hub. Open your match lobby modal before scheduled start.",
      },
      {
        title: "2. Click 'Roster Check-In'",
        detail: "Both team captains must confirm readiness. A 15-minute grace timer begins at the scheduled match minute.",
      },
      {
        title: "3. Receive Lobby Room ID & Password",
        detail: "Once both rosters check in, the randomized room name and password unlock on your screen.",
      },
      {
        title: "4. Join Official AWS Mumbai Server",
        detail: "Launch your game client, join the custom match, verify all player tags, and commence competition.",
      },
    ],
  },
  {
    id: "guide-arbitration",
    category: "disputes",
    categoryLabel: "Disputes & Fair Play",
    title: "Scoreboard Evidence Submission & Live Dispute SLA",
    readTime: "3 min read",
    summary: "Standard operating procedure for submitting clean match proofs and escalating rule infractions to certified arbiters.",
    steps: [
      {
        title: "1. Capture Full End-Game Scoreboard",
        detail: "Take an uncropped, full-screen screenshot displaying all player handles, combat scores, and match timestamps.",
      },
      {
        title: "2. Submit Results via Match Center",
        detail: "Winning captain uploads the screenshot and enters the series score (e.g. 2 - 1).",
      },
      {
        title: "3. Opposing Captain Confirmation / Dispute Window",
        detail: "The opposing captain has 10 minutes to confirm or flag a dispute with accompanying evidence.",
      },
      {
        title: "4. Rapid Arbiter Resolution",
        detail: "If disputed, official platform arbiters review proofs and server logs with an enforced 15-minute resolution SLA.",
      },
    ],
  },
];

function HelpCenterContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [activeView, setActiveView] = useState<"faq" | "guides">("faq");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [expandedFaq, setExpandedFaq] = useState<string | null>("faq-wallet-payout");
  const [expandedGuide, setExpandedGuide] = useState<string | null>("guide-payment");

  // Sync category if query param changes
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedCategory(cat);
      if (cat === "wallet") {
        setExpandedFaq("faq-wallet-payout");
      }
    }
  }, [searchParams]);

  const categories = [
    { id: "all", label: "All Topics" },
    { id: "wallet", label: "Wallet & Payments" },
    { id: "team", label: "Teams & Squads" },
    { id: "matches", label: "Match Operations" },
    { id: "disputes", label: "Disputes & Arbitration" },
    { id: "rules", label: "Anti-Cheat & Rules" },
    { id: "account", label: "Account & Profile" },
  ];

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredGuides = GUIDES.filter((guide) => {
    const matchesCategory = selectedCategory === "all" || guide.category === selectedCategory;
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full bg-[#F8F9FA] min-h-screen">
      {/* 1. Header Banner */}
      <section className="w-full bg-[#EFF4FF] py-12 md:py-16 border-b border-[#D3E4FE]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E5EEFF] border border-[#CBD5E1] rounded text-[#E56A10] text-xs font-bold font-mono tracking-wider uppercase mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            AMETHEUS SUPPORT &amp; KNOWLEDGE SYSTEM
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-headline text-[#0B1C30] uppercase">
            Platform Help Center
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#565E74] max-w-2xl leading-relaxed">
            Search our knowledge base and official guides covering competitive team formation, UPI QR payments, prize vault guarantees, and live arbitration.
          </p>

          {/* Search Bar */}
          <div className="mt-6 max-w-xl relative">
            <Search className="w-4 h-4 text-[#565E74] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search help articles (e.g. wallet, UTR, invite code, check-in, dispute)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0B1C30] placeholder-[#94A3B8] focus:outline-hidden focus:ring-2 focus:ring-[#E56A10] shadow-xs"
            />
          </div>

          {/* View Mode Switcher: Knowledge Base vs Guides */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => setActiveView("faq")}
              className={`px-4 py-2 rounded-lg text-xs font-bold font-headline uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeView === "faq"
                  ? "bg-[#0B1C30] text-white shadow-xs"
                  : "bg-white border border-[#CBD5E1] text-[#565E74] hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#E56A10]" />
              <span>Knowledge Base &amp; FAQs</span>
            </button>
            <button
              onClick={() => setActiveView("guides")}
              className={`px-4 py-2 rounded-lg text-xs font-bold font-headline uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeView === "guides"
                  ? "bg-[#0B1C30] text-white shadow-xs"
                  : "bg-white border border-[#CBD5E1] text-[#565E74] hover:bg-slate-50"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#E56A10]" />
              <span>Contender Guides &amp; Docs</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Main Body */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-10 space-y-8 w-full">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded text-xs font-headline font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-[#E56A10] text-white shadow-xs"
                  : "bg-white border border-[#CBD5E1] text-[#565E74] hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* SECTION A: KNOWLEDGE BASE / FAQS */}
        {activeView === "faq" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">
                {filteredFaqs.length} {filteredFaqs.length === 1 ? "Article" : "Articles"} Found
              </span>
              <Link href="/rules" className="text-xs font-mono font-bold text-[#E56A10] hover:underline flex items-center gap-1">
                View Tournament Rules Page →
              </Link>
            </div>

            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-xl border border-[#D3E4FE] shadow-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
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
                No matching help articles found for &quot;{searchQuery}&quot;. Try a different keyword or contact support.
              </div>
            )}
          </div>
        )}

        {/* SECTION B: DOCUMENTATION & CONTENDER GUIDES */}
        {activeView === "guides" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">
                {filteredGuides.length} Official Contender {filteredGuides.length === 1 ? "Guide" : "Guides"}
              </span>
              <span className="text-xs font-mono text-[#64748B]">
                Step-by-step procedural manuals
              </span>
            </div>

            {filteredGuides.map((guide) => {
              const isExpanded = expandedGuide === guide.id;
              return (
                <div
                  key={guide.id}
                  className="bg-white rounded-xl border border-[#D3E4FE] shadow-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedGuide(isExpanded ? null : guide.id)}
                    className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E56A10]">
                          {guide.categoryLabel}
                        </span>
                        <span className="text-[10px] font-mono text-[#94A3B8]">• {guide.readTime}</span>
                      </div>
                      <h3 className="font-headline font-bold text-base sm:text-lg text-[#0B1C30]">
                        {guide.title}
                      </h3>
                      <p className="text-xs text-[#565E74] leading-relaxed max-w-3xl">
                        {guide.summary}
                      </p>
                    </div>
                    <div className="w-7 h-7 rounded bg-[#EFF4FF] flex items-center justify-center text-[#565E74] shrink-0 mt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-6 pt-3 border-t border-[#F1F5F9] bg-[#FAFCFF] space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {guide.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-white border border-[#E2E8F0] rounded-xl space-y-1.5 shadow-2xs"
                          >
                            <h4 className="font-headline font-bold text-xs uppercase tracking-wide text-[#0B1C30] flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-[#E56A10] text-white flex items-center justify-center text-[10px] font-mono">
                                {idx + 1}
                              </span>
                              {step.title}
                            </h4>
                            <p className="text-xs text-[#565E74] leading-relaxed pl-6">
                              {step.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredGuides.length === 0 && (
              <div className="p-12 text-center bg-white rounded-xl border border-dashed border-[#CBD5E1] text-[#64748B] text-xs">
                No matching guides found for &quot;{searchQuery}&quot;. Try a different category or search term.
              </div>
            )}
          </div>
        )}

        {/* Support Routing Card */}
        <div className="p-6 bg-white rounded-xl border border-[#D3E4FE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="font-headline font-bold text-base text-[#0B1C30] uppercase">
              Need Live Match Arbitration or Support Ticket Assistance?
            </h4>
            <p className="text-xs text-[#565E74] font-mono">
              Submit an official support ticket to our 24/7 arbitration desk for immediate resolution.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-700">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-1.5 hover:text-[#E56A10] transition-colors">
                <Mail className="w-3.5 h-3.5 text-[#E56A10]" /> {SUPPORT_EMAIL}
              </a>
              {SUPPORT_PHONE ? (
                <a href={`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 hover:text-[#E56A10] transition-colors">
                  <Phone className="w-3.5 h-3.5 text-[#E56A10]" /> {SUPPORT_PHONE}
                </a>
              ) : null}
            </div>
          </div>
          <Link
            href="/contact"
            className="px-5 py-2.5 bg-[#0B1C30] hover:bg-[#162A45] text-white rounded font-headline font-bold text-xs uppercase tracking-wider transition-colors shrink-0 flex items-center justify-center gap-1.5"
          >
            Open Support Ticket <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs font-mono text-slate-500">Loading Help Center...</div>}>
      <HelpCenterContent />
    </Suspense>
  );
}
