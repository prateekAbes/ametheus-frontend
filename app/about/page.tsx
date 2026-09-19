"use client";

import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Trophy,
  Zap,
  Server,
  Lock,
  Cpu,
  ArrowRight,
  CheckCircle,
  FileCheck,
  Users,
  Award,
  Flame,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full bg-[#F8F9FA] min-h-screen">
      {/* 1. Hero Header */}
      <section className="w-full bg-[#0B0E16] text-white py-16 px-4 md:px-8 border-b border-[#242C3D]">
        <div className="max-w-[1440px] mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161A24] border border-[#E56A10]/50 rounded text-[#E56A10] text-xs font-mono font-bold tracking-wider uppercase mb-4">
            <Shield className="w-3.5 h-3.5" />
            THE SOLAR VANGUARD STANDARD
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-headline uppercase tracking-tight max-w-4xl">
            Sanctioned Esports Infrastructure Built for Competitive Integrity
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8] max-w-2xl leading-relaxed">
            AMETHEUS combines nocturnal arena intensity with daylight operational clarity. Designed from the ground up for competitive players, tactical squad captains, and tournament arbiters across India.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            <div className="p-4 bg-[#10141F] border border-[#242C3D] rounded">
              <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Platform Prize Vault</span>
              <span className="text-2xl font-bold font-headline text-white mt-1 block">₹14,50,000+</span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
                <CheckCircle className="w-3 h-3" /> Escrow Protected
              </span>
            </div>
            <div className="p-4 bg-[#10141F] border border-[#242C3D] rounded">
              <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Contender Athletes</span>
              <span className="text-2xl font-bold font-headline text-[#E56A10] mt-1 block">24,800+</span>
              <span className="text-[10px] text-[#94A3B8] font-mono mt-1 block">Sanctioned Players</span>
            </div>
            <div className="p-4 bg-[#10141F] border border-[#242C3D] rounded">
              <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Game Disciplines</span>
              <span className="text-2xl font-bold font-headline text-white mt-1 block">6 Titles</span>
              <span className="text-[10px] text-[#94A3B8] font-mono mt-1 block">PC, Mobile &amp; Browser</span>
            </div>
            <div className="p-4 bg-[#10141F] border border-[#242C3D] rounded">
              <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Arbitration SLA</span>
              <span className="text-2xl font-bold font-headline text-white mt-1 block">&lt; 15 Mins</span>
              <span className="text-[10px] text-[#E56A10] font-mono mt-1 block">Live Match Verification</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Platform Architecture Pillars */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-14 space-y-12 w-full">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#E56A10] uppercase mb-2">
            ENGINEERING EXCELLENCE
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-headline text-[#0F172A] uppercase">
            Four Pillars of the AMETHEUS Platform
          </h2>
          <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
            How our platform guarantees zero-latency gameplay, fraud-proof payouts, and fair play.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded bg-[#FFDBCA] text-[#E56A10] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-headline text-[#0F172A] uppercase">
              1. Protected Prize Vault Guarantee
            </h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Every tournament entry fee and prize pool is placed into our protected prize vault prior to match commencement. Winners receive automated prize disbursals directly to their verified accounts within minutes of evidence certification.
            </p>
            <div className="pt-2 border-t border-[#F1F3F5] text-[11px] font-mono text-[#E56A10] font-bold">
              100% Financial Reconciliation // Zero Default Risk
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded bg-[#EFF4FF] text-[#0F172A] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-headline text-[#0F172A] uppercase">
              2. Automated Bracket State Engine
            </h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Our mathematical bracket engine calculates single elimination trees, seeds odd teams with certified BYEs, generates randomized per-match credentials, and auto-advances winners to subsequent rounds upon score verification.
            </p>
            <div className="pt-2 border-t border-[#F1F3F5] text-[11px] font-mono text-[#0F172A] font-bold">
              Dynamic Tree Generation // Auto-Advancement
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded bg-[#EFF4FF] text-[#0F172A] flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-headline text-[#0F172A] uppercase">
              3. Tamper-Evident Operational Audit Ledger
            </h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              All administrative operations, squad lineup changes, match score submissions, dispute arbitrations, and organizer promotions are securely recorded, ensuring a permanent and transparent verification trail.
            </p>
            <div className="pt-2 border-t border-[#F1F3F5] text-[11px] font-mono text-emerald-700 font-bold">
              Transparent Audit Ledger // Zero Impersonation
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded bg-[#FFDBCA] text-[#E56A10] flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-headline text-[#0F172A] uppercase">
              4. Live WebSocket Match Telemetry
            </h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Real-time score submissions, dispute freezes, and verification announcements stream instantaneously across all connected client browsers without manual page reloading using native WebSocket broadcast channels.
            </p>
            <div className="pt-2 border-t border-[#F1F3F5] text-[11px] font-mono text-[#E56A10] font-bold">
              Native Push Tickers // 25s Ping Heartbeat
            </div>
          </div>
        </div>

        {/* 3. Technology Stack & Security */}
        <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div>
              <h3 className="text-xl font-bold font-headline text-[#0F172A] uppercase">
                Technical Stack &amp; Infrastructure
              </h3>
              <p className="text-xs text-[#64748B] font-mono mt-0.5">
                Modern full-stack specifications running on low-latency Indian edge nodes
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-mono text-xs font-bold rounded self-start sm:self-auto">
              PRODUCTION OPERATIONAL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2">
              <span className="font-bold text-[#0F172A] uppercase tracking-wider block">Frontend Layer</span>
              <ul className="space-y-1 text-[#64748B] font-mono">
                <li>• Next.js 16.3.5 (Turbopack)</li>
                <li>• Clerk Core 3 Authentication</li>
                <li>• Tailwind CSS &amp; Lucide Icons</li>
                <li>• Platform Escrow Engine</li>
                <li>• Deployed on Vercel Global Edge</li>
              </ul>
            </div>
            <div className="space-y-2">
              <span className="font-bold text-[#0F172A] uppercase tracking-wider block">Backend Engine</span>
              <ul className="space-y-1 text-[#64748B] font-mono">
                <li>• Python 3.12 Competition Engine</li>
                <li>• MongoDB High-Scale Document Store</li>
                <li>• Fast Automated Bracket Arbitration</li>
                <li>• Secure Clerk Authentication</li>
                <li>• Deployed on Cloud Infrastructure</li>
              </ul>
            </div>
            <div className="space-y-2">
              <span className="font-bold text-[#0F172A] uppercase tracking-wider block">Game Infrastructure</span>
              <ul className="space-y-1 text-[#64748B] font-mono">
                <li>• AWS Mumbai (ap-south-1)</li>
                <li>• Riot Vanguard &amp; Hardware Anti-Cheat</li>
                <li>• 128-Tick Competitive Servers</li>
                <li>• 15-Minute Check-in Forfeit Grace</li>
                <li>• Verified Squad Eligibility</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. Call to Action */}
        <div className="bg-[#0B0E16] text-white p-8 rounded-xl border border-[#242C3D] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold font-headline uppercase">Ready to Compete?</h3>
            <p className="text-xs text-[#94A3B8] font-mono mt-1">
              Browse live tournaments, register your squad, or contact platform arbiters.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tournaments"
              className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white rounded font-headline font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4" /> Browse Tournaments
            </Link>
            <Link
              href="/contact"
              className="px-5 py-2.5 bg-[#161A24] hover:bg-[#242C3D] text-white border border-[#242C3D] rounded font-headline font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
