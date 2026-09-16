'use client';

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Lock,
  Users,
  Trophy,
  AlertTriangle,
  CheckCircle,
  FileText,
  DollarSign,
  Activity,
  Layers,
  Eye,
  Check,
  X,
} from "lucide-react";

export default function AdminCockpitPage() {
  const [currentRole, setCurrentRole] = useState<"SUPER_ADMIN" | "TOURNAMENT_ADMIN">("SUPER_ADMIN");
  const [selectedTournament, setSelectedTournament] = useState<string>("ametheus-valorant-open-01");
  const [evidenceApproved, setEvidenceApproved] = useState(false);

  return (
    <div className="flex flex-col w-full bg-[#0B0E16] min-h-screen text-[#F8FAFC]">
      {/* 1. Admin Top Console Bar */}
      <header className="bg-[#10141F] border-b border-[#242C3D] px-4 md:px-8 py-4">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#161A24] border border-[#242C3D] flex items-center justify-center text-[#E56A10]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline font-bold text-lg text-white uppercase tracking-wider">
                  AMETHEUS ADMIN COCKPIT
                </h1>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    currentRole === "SUPER_ADMIN"
                      ? "bg-[#E56A10] text-white"
                      : "bg-[#F59E0B] text-slate-900"
                  }`}
                >
                  {currentRole}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] font-mono">
                RBAC Level: {currentRole === "SUPER_ADMIN" ? "Global Super Admin" : "Scoped Tournament Organizer"}
              </p>
            </div>
          </div>

          {/* Interactive Role Switcher Toggle */}
          <div className="flex items-center gap-2 bg-[#161A24] border border-[#242C3D] p-1.5 rounded">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase px-2 font-bold">
              Simulate Role:
            </span>
            <button
              onClick={() => setCurrentRole("SUPER_ADMIN")}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded transition-all ${
                currentRole === "SUPER_ADMIN"
                  ? "bg-[#E56A10] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              Super Admin
            </button>
            <button
              onClick={() => setCurrentRole("TOURNAMENT_ADMIN")}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded transition-all ${
                currentRole === "TOURNAMENT_ADMIN"
                  ? "bg-[#F59E0B] text-slate-900 shadow-sm"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              Tournament Admin
            </button>
          </div>
        </div>
      </header>

      {/* 2. Admin Body */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full space-y-8">
        {/* Strict Boundary Alert if Tournament Admin */}
        {currentRole === "TOURNAMENT_ADMIN" && (
          <div className="bg-[#161A24] border border-[#F59E0B]/50 p-4 rounded flex items-start gap-3 text-xs text-[#CBD5E1]">
            <Lock className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
            <div className="space-y-1 font-mono">
              <span className="font-bold text-white uppercase">
                RBAC SCOPE ENFORCEMENT ACTIVE (Rule 2.2 & 2.3)
              </span>
              <p className="text-[#94A3B8]">
                You have been granted scoped access to manage assigned tournaments only. Website configuration, payment keys, platform fee adjustments, global game catalogues, and admin assignments are strictly locked to SUPER_ADMIN.
              </p>
            </div>
          </div>
        )}

        {/* SUPER ADMIN MASTER VIEW */}
        {currentRole === "SUPER_ADMIN" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#10141F] border border-[#242C3D] p-5 rounded">
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase">Platform Escrow Vault</div>
                <div className="text-2xl font-bold font-headline text-white mt-1">₹12,45,000</div>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3 h-3" /> Razorpay Route 100% Reconciled
                </span>
              </div>
              <div className="bg-[#10141F] border border-[#242C3D] p-5 rounded">
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase">Active Tournaments</div>
                <div className="text-2xl font-bold font-headline text-[#E56A10] mt-1">18</div>
                <span className="text-[10px] text-[#94A3B8] font-mono">Across 6 Disciplines</span>
              </div>
              <div className="bg-[#10141F] border border-[#242C3D] p-5 rounded">
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase">Sanctioned Teams</div>
                <div className="text-2xl font-bold font-headline text-white mt-1">1,120</div>
                <span className="text-[10px] text-[#94A3B8] font-mono">3,890 Verified Players</span>
              </div>
              <div className="bg-[#10141F] border border-[#242C3D] p-5 rounded">
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase">Dispute Escalations</div>
                <div className="text-2xl font-bold font-headline text-rose-500 mt-1">2 Pending</div>
                <span className="text-[10px] text-rose-400 font-mono">Requires Arbiter Review</span>
              </div>
            </div>

            {/* Tournament Admin Delegation Controls */}
            <div className="bg-[#10141F] border border-[#242C3D] p-6 rounded space-y-4">
              <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
                <h3 className="font-headline font-bold text-base text-white uppercase">
                  Tournament Admin Delegation Assignments
                </h3>
                <span className="text-xs font-mono text-[#94A3B8]">
                  Database Table: tournament_admin_assignments
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-[#94A3B8] border-b border-[#242C3D]">
                      <th className="py-2">Admin User</th>
                      <th className="py-2">Assigned Tournament</th>
                      <th className="py-2">Assigned By</th>
                      <th className="py-2">Permissions</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242C3D]/60 text-white">
                    <tr>
                      <td className="py-3">@arbiter_val</td>
                      <td>AMETHEUS VALORANT INVITATIONAL 2026</td>
                      <td>@super_admin</td>
                      <td><span className="text-emerald-400">Score Verify, Bracket Advance</span></td>
                      <td className="text-right">
                        <button className="px-2.5 py-1 bg-[#161A24] hover:bg-rose-950/40 hover:text-rose-400 border border-[#242C3D] rounded text-[11px]">
                          Revoke
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3">@cs2_marshal</td>
                      <td>COUNTER-STRIKE 2 PRO DIVISION CUP</td>
                      <td>@super_admin</td>
                      <td><span className="text-emerald-400">Score Verify, Bracket Advance</span></td>
                      <td className="text-right">
                        <button className="px-2.5 py-1 bg-[#161A24] hover:bg-rose-950/40 hover:text-rose-400 border border-[#242C3D] rounded text-[11px]">
                          Revoke
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Platform Tamper-Evident Audit Log */}
            <div className="bg-[#10141F] border border-[#242C3D] p-6 rounded space-y-4">
              <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
                <h3 className="font-headline font-bold text-base text-white uppercase">
                  Tamper-Evident Operational Audit Log
                </h3>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> SHA-256 HASH VERIFIED
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="bg-[#0B0E16] p-3 rounded border border-[#242C3D] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[#94A3B8]">19:15:22 IST</span>
                    <span className="text-[#E56A10] font-bold">@super_admin</span>
                    <span className="text-white">ASSIGN_TOURNAMENT_ADMIN</span>
                    <span className="text-[#94A3B8]">target: @arbiter_val (ametheus-valorant-open-01)</span>
                  </div>
                  <span className="text-[#94A3B8]">IP: 49.37.14.88</span>
                </div>
                <div className="bg-[#0B0E16] p-3 rounded border border-[#242C3D] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[#94A3B8]">18:42:01 IST</span>
                    <span className="text-[#F59E0B] font-bold">@arbiter_val</span>
                    <span className="text-white">APPROVE_MATCH_SCORE</span>
                    <span className="text-[#94A3B8]">match: m-val-qf1 (Score: 13-9)</span>
                  </div>
                  <span className="text-[#94A3B8]">IP: 103.21.244.12</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOURNAMENT ADMIN SCOPED VIEW */}
        {currentRole === "TOURNAMENT_ADMIN" && (
          <div className="space-y-6">
            {/* Scoped Tournament Picker */}
            <div className="bg-[#10141F] border border-[#242C3D] p-5 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono text-[#94A3B8] uppercase font-bold">
                  Assigned Operational Scope
                </span>
                <h2 className="text-lg font-bold font-headline text-white mt-1 uppercase">
                  VALORANT APEX CHALLENGERS — SEASON 4
                </h2>
              </div>
              <span className="px-3 py-1 bg-emerald-950/40 border border-emerald-700 text-emerald-400 text-xs font-mono font-bold rounded">
                OPERATIONS PRIVILEGES ACTIVE
              </span>
            </div>

            {/* Score Verification & Evidence Review Queue */}
            <div className="bg-[#10141F] border border-[#242C3D] p-6 rounded space-y-4">
              <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
                <div>
                  <h3 className="font-headline font-bold text-base text-white uppercase">
                    Match Score & Evidence Review Queue
                  </h3>
                  <p className="text-xs text-[#94A3B8] font-mono">
                    Inspect screenshot uploads before advancing bracket nodes
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-[#E56A10]/20 border border-[#E56A10]/50 text-[#E56A10] text-xs font-mono font-bold rounded">
                  1 Match Awaiting Approval
                </span>
              </div>

              {/* Match Card Under Review */}
              <div className="bg-[#0B0E16] border border-[#242C3D] p-4 rounded space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242C3D] pb-3">
                  <div>
                    <div className="font-bold text-white text-sm">Quarterfinals — Match 1</div>
                    <div className="text-xs text-[#94A3B8] font-mono">
                      Solaris X (SLX) vs Apex Strikers (APX)
                    </div>
                  </div>
                  <div className="text-sm font-bold font-mono text-[#E56A10]">
                    Submitted Score: 13 - 9 (SLX Winner)
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-[#161A24] p-3 rounded space-y-1">
                    <span className="text-[#94A3B8]">Captain Notes:</span>
                    <p className="text-white">
                      "Clean game, all players checked in on Mumbai AWS server. GG to Apex Strikers."
                    </p>
                  </div>
                  <div className="bg-[#161A24] p-3 rounded flex items-center justify-between">
                    <div>
                      <span className="text-[#94A3B8]">Evidence File:</span>
                      <div className="text-white font-bold">valorant_match_end_scoreboard.png</div>
                    </div>
                    <button className="px-3 py-1 bg-[#242C3D] hover:bg-[#333C4D] text-white rounded text-xs flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Inspect
                    </button>
                  </div>
                </div>

                {/* Verification Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button className="px-4 py-2 bg-[#161A24] hover:bg-rose-950/40 text-rose-400 border border-rose-800 rounded font-mono text-xs font-bold uppercase">
                    Flag Dispute
                  </button>
                  <button
                    onClick={() => setEvidenceApproved(true)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase rounded flex items-center gap-1.5 shadow-sm"
                  >
                    {evidenceApproved ? (
                      <>
                        <Check className="w-4 h-4" /> Score Approved & Bracket Seeded
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" /> Approve Score & Advance Bracket
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
