'use client';

import React, { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Users,
  Shield,
  Copy,
  CheckCircle,
  Clock,
  ArrowRight,
  Wallet,
  Gamepad2,
  Calendar,
} from "lucide-react";

export default function DashboardPage() {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex flex-col w-full bg-[#F8F9FA] min-h-screen">
      {/* 1. Header Hero */}
      <section className="w-full bg-[#EFF4FF] py-10 md:py-12 border-b border-[#D3E4FE]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#0B0E16] border-2 border-[#E56A10] flex items-center justify-center font-bold text-xl text-[#F59E0B] font-headline">
                VX
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold font-headline text-[#0B1C30]">
                    @vortex_lead
                  </h1>
                  <span className="px-2 py-0.5 bg-[#E56A10] text-white text-[10px] font-mono font-bold rounded">
                    VERIFIED CAPTAIN
                  </span>
                </div>
                <p className="text-xs text-[#565E74] font-mono mt-0.5">
                  Riot ID: Vortex#APEX • Steam ID: STEAM_0:1:88291039
                </p>
              </div>
            </div>

            {/* Wallet Quick Balance */}
            <div className="bg-white p-4 rounded border border-[#D3E4FE] shadow-sm flex items-center gap-4">
              <div>
                <div className="text-[11px] font-mono text-[#565E74] uppercase font-bold">
                  Escrow Winnings
                </div>
                <div className="text-2xl font-bold font-headline text-[#E56A10]">₹12,450</div>
              </div>
              <div className="w-10 h-10 rounded bg-[#FFDBCA] flex items-center justify-center text-[#E56A10]">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Dashboard Content */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full space-y-8">
        {/* Active Squad Card with 6-char Invite Code */}
        <div className="bg-white p-6 rounded border border-[#D3E4FE] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF4FF] pb-4">
            <div>
              <div className="text-xs font-mono text-[#565E74] uppercase font-bold">
                Active Tactical Squad (Valorant)
              </div>
              <h2 className="text-xl font-bold font-headline text-[#0B1C30]">Solaris X [SLX]</h2>
            </div>
            {/* Invite Code Box */}
            <div className="flex items-center gap-2 bg-[#EFF4FF] p-2 rounded border border-[#D3E4FE]">
              <span className="text-xs text-[#565E74] font-mono">Invite Code:</span>
              <span className="font-mono text-sm font-bold text-[#E56A10] tracking-widest">
                SR7X4K
              </span>
              <button
                onClick={() => handleCopy("SR7X4K")}
                className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded text-xs font-mono hover:border-[#E56A10] flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedCode ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Roster Members */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { user: "@vortex_lead", role: "CAPTAIN", gameId: "Vortex#APEX" },
              { user: "@phantom_aim", role: "MEMBER", gameId: "Phantom#999" },
              { user: "@omen_smoke", role: "MEMBER", gameId: "Omen#IND" },
              { user: "@sova_recon", role: "MEMBER", gameId: "Sova#DARTS" },
              { user: "@jett_entry", role: "MEMBER", gameId: "Jett#WIND" },
            ].map((m, i) => (
              <div key={i} className="bg-[#EFF4FF] p-3 rounded border border-[#D3E4FE] text-xs font-mono">
                <div className="font-bold text-[#0B1C30]">{m.user}</div>
                <div className="text-[10px] text-[#E56A10] font-bold">{m.role}</div>
                <div className="text-[10px] text-[#565E74] truncate mt-1">{m.gameId}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Registered Tournaments & Upcoming Matches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registered Tournaments */}
          <div className="bg-white p-6 rounded border border-[#D3E4FE] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFF4FF] pb-3">
              <h3 className="font-headline font-bold text-base text-[#0B1C30] uppercase">
                Registered Tournaments
              </h3>
              <Link href="/tournaments" className="text-xs text-[#E56A10] font-mono hover:underline">
                Browse More
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-[#EFF4FF] rounded border border-[#D3E4FE] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-[#FFDBCA] text-[#331100] text-[10px] font-mono font-bold rounded uppercase">
                    CHECK-IN OPEN
                  </span>
                  <span className="text-xs font-mono font-bold text-[#E56A10]">₹50,000 POOL</span>
                </div>
                <h4 className="font-headline font-bold text-sm text-[#0B1C30]">
                  AMETHEUS VALORANT INVITATIONAL 2026
                </h4>
                <div className="flex items-center justify-between text-xs text-[#565E74] font-mono pt-2 border-t border-[#D3E4FE]">
                  <span>Starts Today, 8:00 PM IST</span>
                  <Link
                    href="/tournaments/ametheus-valorant-open-01"
                    className="text-[#E56A10] font-bold hover:underline flex items-center gap-1"
                  >
                    View Bracket <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Matches */}
          <div className="bg-white p-6 rounded border border-[#D3E4FE] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFF4FF] pb-3">
              <h3 className="font-headline font-bold text-base text-[#0B1C30] uppercase">
                Next Match Lobby
              </h3>
              <Link href="/matches" className="text-xs text-[#E56A10] font-mono hover:underline">
                Match Center
              </Link>
            </div>

            <div className="p-4 bg-[#0B0E16] text-white rounded border border-[#242C3D] space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-[#E56A10] text-white text-[10px] font-mono font-bold rounded uppercase">
                  LIVE IN 25 MIN
                </span>
                <span className="text-xs font-mono text-[#94A3B8]">Quarterfinals BO3</span>
              </div>
              <div className="flex items-center justify-between font-headline font-bold text-base">
                <span>Solaris X</span>
                <span className="text-xs text-[#94A3B8] font-mono">VS</span>
                <span>Apex Strikers</span>
              </div>
              <Link
                href="/matches"
                className="w-full py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-mono text-xs font-bold uppercase rounded flex items-center justify-center gap-1 transition-all"
              >
                Enter Match Lobby
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
