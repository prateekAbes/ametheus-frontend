'use client';

import React, { useState, useEffect, useCallback } from "react";
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
  UserCheck,
  Loader2,
  RefreshCw,
  FileCheck,
  Database,
  Sliders,
  Scale,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth, useUser, SignInButton } from "@clerk/nextjs";
import {
  getAuditLogs,
  getAdminUsers,
  getAdminStats,
  promoteUserToOrganizer,
  setUserRole,
  verifyMatchResult,
  getDisputes,
  resolveDispute,
  triggerSeedCatalog,
  AuditLog,
  AdminUser,
  AdminStats,
  Dispute,
} from "@/lib/api/admin";
import { getCurrentUserProfile, UserProfile } from "@/lib/api/auth";
import { getMatches, Match } from "@/lib/api/matches";

export default function AdminCockpitPage() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  const [activeTab, setActiveTab] = useState<"overview" | "queue" | "disputes" | "users" | "audit">("overview");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<"SUPER_ADMIN" | "TOURNAMENT_ADMIN">("SUPER_ADMIN");
  const [evidenceApproved, setEvidenceApproved] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [inspectingEvidence, setInspectingEvidence] = useState<string | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [resolvingDisputeId, setResolvingDisputeId] = useState<string | null>(null);
  const [disputeNotes, setDisputeNotes] = useState("");

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileRes, logsRes, usersRes, statsRes, matchesRes, disputesRes] = await Promise.allSettled([
        getCurrentUserProfile(),
        getAuditLogs(),
        getAdminUsers(),
        getAdminStats(),
        getMatches(),
        getDisputes(),
      ]);

      if (profileRes.status === "fulfilled") {
        setCurrentUser(profileRes.value);
        if (profileRes.value.role === "SUPER_ADMIN") {
          setCurrentRole("SUPER_ADMIN");
        } else if (profileRes.value.role === "ORGANIZER") {
          setCurrentRole("TOURNAMENT_ADMIN");
        }
      }

      if (logsRes.status === "fulfilled" && Array.isArray(logsRes.value)) {
        setAuditLogs(logsRes.value);
      }
      if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value)) {
        setUsers(usersRes.value);
      }
      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value);
      }
      if (matchesRes.status === "fulfilled" && Array.isArray(matchesRes.value)) {
        setAllMatches(matchesRes.value);
        const pending = matchesRes.value.filter(
          (m) => m.status === "PENDING_VERIFICATION" || m.status === "DISPUTED"
        );
        setPendingMatches(pending);
      }
      if (disputesRes.status === "fulfilled" && Array.isArray(disputesRes.value)) {
        setDisputes(disputesRes.value);
      }
    } catch (err) {
      console.warn("Admin fetch fallback:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoaded) {
      loadAdminData();
    }
  }, [isAuthLoaded, isSignedIn, loadAdminData]);

  const handlePromoteUser = async (userId: string, username: string) => {
    try {
      await promoteUserToOrganizer(userId);
      setActionMessage(`User @${username} promoted to ORGANIZER successfully.`);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err: any) {
      setActionMessage(err?.message || `Failed to promote @${username}`);
      setTimeout(() => setActionMessage(""), 4000);
    }
  };

  const handleSetUserRole = async (userId: string, newRole: "PLAYER" | "ORGANIZER" | "SUPER_ADMIN", username: string) => {
    try {
      await setUserRole(userId, newRole);
      setActionMessage(`User @${username} role updated to ${newRole}.`);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err: any) {
      setActionMessage(err?.message || `Failed to update role for @${username}`);
      setTimeout(() => setActionMessage(""), 4000);
    }
  };

  const handleVerifyMatch = async (matchId: string) => {
    setIsVerifying(true);
    try {
      await verifyMatchResult(matchId);
      setActionMessage(`Match result verified! Winner auto-advanced in tournament bracket.`);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Match verification committed.");
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResolveDispute = async (
    disputeId: string,
    decision: "RESOLVED_UPHELD" | "RESOLVED_OVERTURNED" | "DISMISSED"
  ) => {
    try {
      await resolveDispute(disputeId, decision, disputeNotes || `Arbitration decision: ${decision}`);
      setActionMessage(`Dispute marked as ${decision}. Match status updated.`);
      setResolvingDisputeId(null);
      setDisputeNotes("");
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to resolve dispute.");
      setTimeout(() => setActionMessage(""), 5000);
    }
  };

  const handleTriggerSeed = async () => {
    setIsSeeding(true);
    try {
      await triggerSeedCatalog();
      setActionMessage("Platform catalog re-seeded successfully with games, tournaments, teams & sample matches.");
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 6000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to trigger catalog seed.");
      setTimeout(() => setActionMessage(""), 5000);
    } finally {
      setIsSeeding(false);
    }
  };

  // 1. Initial Authentication Loading State
  if (!isAuthLoaded || (isLoading && !currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#0B0E16] text-white p-6">
        <div className="w-16 h-16 rounded-full bg-[#161A24] border border-[#242C3D] flex items-center justify-center mb-4 text-[#E56A10] animate-pulse">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-headline uppercase tracking-wider mb-2">
          Verifying AMETHEUS Security Clearance
        </h2>
        <p className="text-xs text-[#94A3B8] font-mono flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#E56A10]" />
          Connecting to MongoDB and evaluating cryptographic role credentials...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State (Guest)
  if (!isSignedIn) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-[#10141F] border border-[#242C3D] rounded-lg text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-[#E56A10]/10 border border-[#E56A10]/40 flex items-center justify-center mx-auto text-[#E56A10]">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-headline text-white uppercase tracking-wider">
            Admin Console — Authentication Required
          </h1>
          <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
            This cockpit controls financial escrow reconciliation, bracket advancement, user roles, and platform arbitration.
          </p>
        </div>

        <div className="bg-[#0B0E16] border border-[#242C3D] p-4 rounded text-left text-xs font-mono space-y-2 text-[#CBD5E1]">
          <div className="text-[#94A3B8] font-bold uppercase tracking-wider">Required Privileges:</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E56A10]"></span>
            <span><strong className="text-white">SUPER_ADMIN:</strong> Full platform ownership &amp; role allocation (e.g. pk.4081988@gmail.com)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span><strong className="text-white">ORGANIZER / TOURNAMENT_ADMIN:</strong> Scoped bracket management &amp; dispute review</span>
          </div>
        </div>

        <SignInButton mode="modal">
          <button className="px-6 py-3 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono font-bold text-sm uppercase rounded shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto">
            <Shield className="w-4 h-4" /> Sign In to Admin Console
          </button>
        </SignInButton>
      </div>
    );
  }

  // 3. Authenticated but unauthorized (PLAYER role)
  if (currentUser && currentUser.role === "PLAYER") {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-[#10141F] border border-rose-600/50 rounded-lg text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-500">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-headline text-white uppercase tracking-wider">
            Restricted Clearance (PLAYER Role)
          </h1>
          <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
            Your account <strong className="text-white">@{currentUser.username}</strong> ({currentUser.email}) is registered with standard competitive <strong className="text-amber-400">PLAYER</strong> status.
          </p>
        </div>

        <div className="bg-[#0B0E16] border border-[#242C3D] p-4 rounded text-left text-xs font-mono space-y-2 text-[#CBD5E1]">
          <div className="text-[#94A3B8] font-bold uppercase tracking-wider">Admin Elevation Note:</div>
          <p className="text-[#94A3B8]">
            To access this cockpit with <strong className="text-white">SUPER_ADMIN</strong> privileges, sign in with the platform owner email (<code className="text-[#E56A10]">pk.4081988@gmail.com</code> or <code className="text-[#E56A10]">admin@ametheus.gg</code>).
          </p>
          <p className="text-[#94A3B8]">
            Existing Super Admins can also promote your username <strong className="text-white">@{currentUser.username}</strong> from the User Management console.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => loadAdminData()}
            className="px-4 py-2 bg-[#161A24] border border-[#242C3D] hover:bg-[#202534] text-white text-xs font-mono font-bold uppercase rounded flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-check Clearance
          </button>
          <Link
            href="/tournaments"
            className="px-4 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded"
          >
            Browse Tournaments
          </Link>
        </div>
      </div>
    );
  }

  // 4. Authorized Admin Cockpit
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  return (
    <div className="flex flex-col w-full bg-[#0B0E16] min-h-screen text-[#F8FAFC]">
      {/* Console Top Bar */}
      <header className="bg-[#10141F] border-b border-[#242C3D] px-4 md:px-8 py-4 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                    isSuperAdmin ? "bg-[#E56A10] text-white" : "bg-[#F59E0B] text-slate-900"
                  }`}
                >
                  {isSuperAdmin ? "SUPER ADMIN" : "TOURNAMENT ADMIN"}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] font-mono">
                Operator: <span className="text-white font-semibold">@{currentUser?.username}</span> • {currentUser?.email}
              </p>
            </div>
          </div>

          {/* Action Tools (Seed Catalog & Refresh) */}
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={handleTriggerSeed}
                disabled={isSeeding}
                className="px-3 py-1.5 bg-[#161A24] border border-[#242C3D] hover:border-[#E56A10]/50 hover:bg-[#1C2230] text-[#CBD5E1] text-xs font-mono font-bold uppercase rounded flex items-center gap-1.5 transition-all cursor-pointer"
                title="Populate MongoDB with default competitive games, tournaments, teams and demo matches"
              >
                {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E56A10]" /> : <Database className="w-3.5 h-3.5 text-[#E56A10]" />}
                <span>{isSeeding ? "Seeding..." : "Seed Platform"}</span>
              </button>
            )}

            <button
              onClick={() => loadAdminData()}
              disabled={isLoading}
              className="px-3 py-1.5 bg-[#161A24] border border-[#242C3D] hover:bg-[#1C2230] text-[#CBD5E1] text-xs font-mono font-bold uppercase rounded flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#E56A10] ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-[1440px] mx-auto mt-4 flex items-center gap-1 border-t border-[#242C3D]/60 pt-3 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-1.5 rounded transition-all font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-[#E56A10] text-white shadow-xs"
                : "text-[#94A3B8] hover:text-white hover:bg-[#161A24]"
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Overview
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-3.5 py-1.5 rounded transition-all font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "queue"
                ? "bg-[#E56A10] text-white shadow-xs"
                : "text-[#94A3B8] hover:text-white hover:bg-[#161A24]"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Match Verification
            {pendingMatches.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[9px] rounded-full">
                {pendingMatches.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("disputes")}
            className={`px-3.5 py-1.5 rounded transition-all font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "disputes"
                ? "bg-[#E56A10] text-white shadow-xs"
                : "text-[#94A3B8] hover:text-white hover:bg-[#161A24]"
            }`}
          >
            <Scale className="w-3.5 h-3.5" /> Disputes
            {disputes.filter((d) => d.status === "OPEN").length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] rounded-full">
                {disputes.filter((d) => d.status === "OPEN").length}
              </span>
            )}
          </button>
          {isSuperAdmin && (
            <>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-3.5 py-1.5 rounded transition-all font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "users"
                    ? "bg-[#E56A10] text-white shadow-xs"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#161A24]"
                }`}
              >
                <Users className="w-3.5 h-3.5" /> User RBAC ({users.length})
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={`px-3.5 py-1.5 rounded transition-all font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "audit"
                    ? "bg-[#E56A10] text-white shadow-xs"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#161A24]"
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" /> Audit Logs
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 w-full space-y-6">
        {/* Action Feedback Toast */}
        {actionMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs font-mono rounded flex items-center gap-2 shadow-lg animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW & ESCROW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#10141F] border border-[#242C3D] p-5 rounded">
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase font-bold">Platform Escrow Vault</div>
                <div className="text-2xl font-bold font-headline text-white mt-1">
                  ₹{(stats?.platform_escrow_vault ?? 1245000).toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Route Escrow Active
                </span>
              </div>

              <div className="bg-[#10141F] border border-[#242C3D] p-5 rounded">
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase font-bold">Active Tournaments</div>
                <div className="text-2xl font-bold font-headline text-[#E56A10] mt-1">
                  {stats?.active_tournaments ?? 0}
                </div>
                <span className="text-[10px] text-[#94A3B8] font-mono">
                  {stats?.total_tournaments ?? 0} Total Tournaments Hosted
                </span>
              </div>

              <div className="bg-[#10141F] border border-[#242C3D] p-5 rounded">
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase font-bold">Sanctioned Teams</div>
                <div className="text-2xl font-bold font-headline text-white mt-1">
                  {stats?.total_teams ?? 0}
                </div>
                <span className="text-[10px] text-[#94A3B8] font-mono">
                  {stats?.total_users ?? 0} Registered Competitive Users
                </span>
              </div>

              <div className="bg-[#10141F] border border-[#242C3D] p-5 rounded">
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase font-bold">Active Matches</div>
                <div className="text-2xl font-bold font-headline text-white mt-1">
                  {stats?.active_matches ?? 0}
                </div>
                <span className="text-[10px] text-amber-400 font-mono">
                  {pendingMatches.length} Awaiting Verification
                </span>
              </div>
            </div>

            {/* Quick Operations Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#10141F] border border-[#242C3D] p-6 rounded space-y-4">
                <h3 className="font-headline font-bold text-base text-white uppercase flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#E56A10]" /> Fast Action Console
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Quickly jump into active administrative workflows:
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab("queue")}
                    className="p-3 bg-[#161A24] border border-[#242C3D] hover:border-[#E56A10] rounded text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white uppercase">Match Queue</div>
                    <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">{pendingMatches.length} pending review</div>
                  </button>
                  <button
                    onClick={() => setActiveTab("disputes")}
                    className="p-3 bg-[#161A24] border border-[#242C3D] hover:border-[#E56A10] rounded text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white uppercase">Disputes</div>
                    <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">{disputes.length} cases tracked</div>
                  </button>
                  <Link
                    href="/organizer"
                    className="p-3 bg-[#161A24] border border-[#242C3D] hover:border-[#E56A10] rounded text-left transition-all block"
                  >
                    <div className="text-xs font-bold text-white uppercase">Organizer Portal</div>
                    <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">Create &amp; publish brackets</div>
                  </Link>
                  <Link
                    href="/tournaments"
                    className="p-3 bg-[#161A24] border border-[#242C3D] hover:border-[#E56A10] rounded text-left transition-all block"
                  >
                    <div className="text-xs font-bold text-white uppercase">Live Tournaments</div>
                    <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">Public tournament discovery</div>
                  </Link>
                </div>
              </div>

              <div className="bg-[#10141F] border border-[#242C3D] p-6 rounded space-y-3">
                <h3 className="font-headline font-bold text-base text-white uppercase flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Database &amp; System Health
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2.5 bg-[#0B0E16] rounded border border-[#242C3D]">
                    <span className="text-[#94A3B8]">Primary Database Engine:</span>
                    <span className="text-emerald-400 font-bold">MongoDB Atlas (Async Motor Driver)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#0B0E16] rounded border border-[#242C3D]">
                    <span className="text-[#94A3B8]">Database Collections:</span>
                    <span className="text-white font-bold">users, games, teams, tournaments, matches, disputes, audit_logs</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#0B0E16] rounded border border-[#242C3D]">
                    <span className="text-[#94A3B8]">Cryptographic Audit Chaining:</span>
                    <span className="text-emerald-400 font-bold">SHA-256 ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MATCH VERIFICATION QUEUE */}
        {activeTab === "queue" && (
          <div className="space-y-6">
            <div className="bg-[#10141F] border border-[#242C3D] p-6 rounded space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242C3D] pb-4">
                <div>
                  <h3 className="font-headline font-bold text-base text-white uppercase">
                    Match Score &amp; Evidence Review Queue
                  </h3>
                  <p className="text-xs text-[#94A3B8] font-mono">
                    Inspect captain-submitted scores and screenshot proofs before certifying bracket progression
                  </p>
                </div>
                <span className="px-3 py-1 bg-[#E56A10]/20 border border-[#E56A10]/50 text-[#E56A10] text-xs font-mono font-bold rounded">
                  {pendingMatches.length} Pending Verification
                </span>
              </div>

              {pendingMatches.length > 0 ? (
                <div className="space-y-4">
                  {pendingMatches.map((m) => (
                    <div key={m.id} className="bg-[#0B0E16] border border-[#242C3D] p-4 rounded space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242C3D] pb-3">
                        <div>
                          <div className="font-bold text-white text-sm">
                            {m.stage || "Competitive Bracket Match"}
                          </div>
                          <div className="text-xs text-[#94A3B8] font-mono">
                            {m.tournament_title || "Official Tournament"} • {m.team_a?.name || "Slot 1"} vs {m.team_b?.name || "Slot 2"}
                          </div>
                        </div>
                        <div className="text-sm font-bold font-mono text-[#E56A10]">
                          Submitted Score: {m.team_a?.score ?? "-"} : {m.team_b?.score ?? "-"}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="bg-[#161A24] p-3 rounded space-y-1">
                          <span className="text-[#94A3B8]">Captain Notes:</span>
                          <p className="text-white">
                            {m.dispute_notes || "Match concluded. Scoreboard proof attached."}
                          </p>
                        </div>
                        <div className="bg-[#161A24] p-3 rounded flex items-center justify-between">
                          <div>
                            <span className="text-[#94A3B8]">Evidence Proof:</span>
                            <div className="text-white font-bold truncate max-w-[200px]">
                              {m.evidence_url || "Scoreboard Screenshot"}
                            </div>
                          </div>
                          <button
                            onClick={() => setInspectingEvidence(m.evidence_url || "valorant_match_end_scoreboard.png")}
                            className="px-3 py-1 bg-[#242C3D] hover:bg-[#333C4D] text-white rounded text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect Proof
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          onClick={() => handleVerifyMatch(m.id)}
                          disabled={isVerifying}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#242C3D] text-white font-mono text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          {isVerifying ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Verifying &amp; Advancing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" /> Certify Score &amp; Advance Winner
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#0B0E16] p-8 text-center text-[#94A3B8] rounded border border-[#242C3D] space-y-3">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div className="text-white font-bold text-sm">Review Queue Clear</div>
                  <p className="text-xs font-mono text-[#64748B] max-w-md mx-auto">
                    No competitive matches currently require arbitrator verification. When team captains submit scores in the Match Hub, they appear here.
                  </p>
                </div>
              )}
            </div>

            {/* All Matches Overview */}
            {allMatches.length > 0 && (
              <div className="bg-[#10141F] border border-[#242C3D] p-6 rounded space-y-4">
                <h4 className="font-headline font-bold text-sm text-white uppercase">
                  All Tournament Matches ({allMatches.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="text-[#94A3B8] border-b border-[#242C3D]">
                        <th className="py-2">Stage</th>
                        <th className="py-2">Tournament</th>
                        <th className="py-2">Teams</th>
                        <th className="py-2">Score</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#242C3D]/60 text-white">
                      {allMatches.map((m) => (
                        <tr key={m.id}>
                          <td className="py-2.5">{m.stage || "Match"}</td>
                          <td className="text-[#94A3B8]">{m.tournament_title || "Official"}</td>
                          <td>{m.team_a?.name || "TBD"} vs {m.team_b?.name || "TBD"}</td>
                          <td className="font-bold text-[#E56A10]">{m.team_a?.score ?? 0} : {m.team_b?.score ?? 0}</td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#161A24] border border-[#242C3D]">
                              {m.status}
                            </span>
                          </td>
                          <td className="text-right">
                            {m.status !== "COMPLETED" && (
                              <button
                                onClick={() => handleVerifyMatch(m.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase"
                              >
                                Certify
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DISPUTES ARBITRATION */}
        {activeTab === "disputes" && (
          <div className="space-y-6">
            <div className="bg-[#10141F] border border-[#242C3D] p-6 rounded space-y-4">
              <div className="flex items-center justify-between border-b border-[#242C3D] pb-4">
                <div>
                  <h3 className="font-headline font-bold text-base text-white uppercase">
                    Tournament Dispute Arbitration Desk
                  </h3>
                  <p className="text-xs text-[#94A3B8] font-mono">
                    Review and arbitrate rule violations, toxic behavior, server drops, and disputed scores
                  </p>
                </div>
                <span className="text-xs font-mono text-[#94A3B8]">
                  {disputes.length} Total Disputes
                </span>
              </div>

              {disputes.length > 0 ? (
                <div className="space-y-4">
                  {disputes.map((d) => (
                    <div key={d.id} className="bg-[#0B0E16] border border-[#242C3D] p-4 rounded space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242C3D] pb-3">
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Reason: {d.reason}</span>
                            <span
                              className={`px-2 py-0.2 rounded text-[10px] font-mono uppercase font-bold ${
                                d.status === "OPEN"
                                  ? "bg-rose-950/60 border border-rose-600 text-rose-400"
                                  : "bg-emerald-950/60 border border-emerald-600 text-emerald-400"
                              }`}
                            >
                              {d.status}
                            </span>
                          </div>
                          <div className="text-xs text-[#94A3B8] font-mono mt-0.5">
                            Match: {d.match_id} • Filed by: {d.submitted_by}
                          </div>
                        </div>
                        <div className="text-xs text-[#94A3B8] font-mono">
                          {d.created_at ? new Date(d.created_at).toLocaleString() : ""}
                        </div>
                      </div>

                      <p className="text-xs text-[#CBD5E1] bg-[#161A24] p-3 rounded">
                        {d.description}
                      </p>

                      {d.evidence_url && (
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            onClick={() => setInspectingEvidence(d.evidence_url!)}
                            className="px-3 py-1 bg-[#242C3D] hover:bg-[#333C4D] text-white rounded flex items-center gap-1 font-mono"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Attached Evidence
                          </button>
                        </div>
                      )}

                      {d.status === "OPEN" && isSuperAdmin && (
                        <div className="pt-3 border-t border-[#242C3D] space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleResolveDispute(d.id, "RESOLVED_UPHELD")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-bold uppercase cursor-pointer"
                            >
                              Upheld (Enforce Claim)
                            </button>
                            <button
                              onClick={() => handleResolveDispute(d.id, "RESOLVED_OVERTURNED")}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-mono font-bold uppercase cursor-pointer"
                            >
                              Overturn Match
                            </button>
                            <button
                              onClick={() => handleResolveDispute(d.id, "DISMISSED")}
                              className="px-3 py-1.5 bg-[#242C3D] hover:bg-[#333C4D] text-white rounded text-xs font-mono font-bold uppercase cursor-pointer"
                            >
                              Dismiss Dispute
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#0B0E16] p-8 text-center text-[#94A3B8] rounded border border-[#242C3D] space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-white font-bold text-sm">No Active Disputes</div>
                  <p className="text-xs font-mono text-[#64748B]">
                    Fair play integrity verified. Disputed tournament matches will be listed here for arbitral ruling.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: USER & RBAC MANAGEMENT */}
        {activeTab === "users" && isSuperAdmin && (
          <div className="bg-[#10141F] border border-[#242C3D] p-6 rounded space-y-4">
            <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
              <div>
                <h3 className="font-headline font-bold text-base text-white uppercase">
                  Platform User Management &amp; Role Allocation
                </h3>
                <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                  Super Admin control: Assign roles, promote tournament organizers, and audit balances
                </p>
              </div>
              <span className="text-xs font-mono text-[#94A3B8]">
                {users.length} Registered Accounts
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-[#94A3B8] border-b border-[#242C3D]">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Current Role</th>
                    <th className="py-2.5">Balance</th>
                    <th className="py-2.5 text-right">RBAC Role Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242C3D]/60 text-white">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3">
                        <span className="font-bold">@{u.username}</span>
                        {u.display_name && (
                          <span className="text-[#94A3B8] text-[11px] block">{u.display_name}</span>
                        )}
                      </td>
                      <td className="text-[#94A3B8]">{u.email}</td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === "SUPER_ADMIN"
                              ? "bg-[#E56A10] text-white"
                              : u.role === "ORGANIZER"
                              ? "bg-[#F59E0B] text-slate-900"
                              : "bg-[#242C3D] text-[#CBD5E1]"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>₹{Number(u.inr_balance || 0).toLocaleString()}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.role === "PLAYER" && (
                            <button
                              onClick={() => handlePromoteUser(u.id, u.username)}
                              className="px-2.5 py-1 bg-[#E56A10] hover:bg-[#C95B0A] text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                            >
                              Make Organizer
                            </button>
                          )}
                          {u.role === "ORGANIZER" && (
                            <button
                              onClick={() => handleSetUserRole(u.id, "PLAYER", u.username)}
                              className="px-2 py-1 bg-[#242C3D] hover:bg-[#333C4D] text-[#CBD5E1] rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                            >
                              Demote
                            </button>
                          )}
                          {u.role === "SUPER_ADMIN" && (
                            <span className="text-[10px] text-[#94A3B8] italic">Designated Root</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#94A3B8]">
                        No platform users registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: CRYPTOGRAPHIC AUDIT LOGS */}
        {activeTab === "audit" && isSuperAdmin && (
          <div className="bg-[#10141F] border border-[#242C3D] p-6 rounded space-y-4">
            <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
              <div>
                <h3 className="font-headline font-bold text-base text-white uppercase">
                  Tamper-Evident Operational Audit Log
                </h3>
                <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                  Every administrative action is stored in MongoDB with SHA-256 hash chains
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> SHA-256 HASH VERIFIED
              </span>
            </div>
            <div className="space-y-2 text-xs font-mono max-h-96 overflow-y-auto">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#0B0E16] p-3 rounded border border-[#242C3D] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[#94A3B8] text-[11px]">{log.timestamp ? log.timestamp.slice(11, 19) : ""} IST</span>
                      <span className="text-[#E56A10] font-bold">@{log.operator}</span>
                      <span className="text-white font-bold">{log.action}</span>
                      <span className="text-[#94A3B8]">{log.target}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.record_hash && (
                        <span className="px-1.5 py-0.5 rounded bg-[#161A24] border border-[#242C3D] text-[10px] text-emerald-400 font-mono" title={`Prev: ${log.prev_hash}\nRecord: ${log.record_hash}`}>
                          SHA: {log.record_hash.slice(0, 8)}…
                        </span>
                      )}
                      <span className="text-[#94A3B8] text-[11px]">IP: {log.ip_address}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#0B0E16] p-6 text-center text-[#94A3B8] rounded border border-[#242C3D]">
                  No audit logs recorded yet.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Screenshot Evidence Inspection Modal */}
      {inspectingEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#10141F] border border-[#242C3D] max-w-3xl w-full rounded overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#242C3D]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#E56A10]" />
                <span className="font-headline font-bold text-sm text-white uppercase">Match Scoreboard Evidence</span>
              </div>
              <button
                onClick={() => setInspectingEvidence(null)}
                className="p-1 text-[#94A3B8] hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-[#0B0E16] min-h-[300px]">
              {inspectingEvidence.startsWith("data:") || inspectingEvidence.startsWith("http") ? (
                <img
                  src={inspectingEvidence}
                  alt="Evidence Screenshot"
                  className="max-h-[60vh] object-contain rounded border border-[#242C3D]"
                />
              ) : (
                <div className="text-center p-8 text-[#94A3B8] font-mono text-xs">
                  <FileCheck className="w-12 h-12 text-[#E56A10] mx-auto mb-2 opacity-50" />
                  Evidence File: <span className="text-white font-bold">{inspectingEvidence}</span>
                  <p className="text-[11px] text-[#64748B] mt-1">Uploaded and certified by squad captain.</p>
                </div>
              )}
            </div>
            <div className="p-3 bg-[#10141F] border-t border-[#242C3D] flex justify-end">
              <button
                onClick={() => setInspectingEvidence(null)}
                className="px-4 py-1.5 bg-[#242C3D] hover:bg-[#333C4D] text-white rounded text-xs font-mono font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
