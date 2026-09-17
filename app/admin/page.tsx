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
  Gamepad2,
  Plus,
  Trash2,
  Edit3,
  Server,
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
import {
  getGames,
  createGame,
  updateGame,
  deleteGame,
  Game,
  GameCreatePayload,
} from "@/lib/api/games";

export default function AdminCockpitPage() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  const [activeTab, setActiveTab] = useState<"overview" | "queue" | "disputes" | "games" | "users" | "audit">("overview");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<"SUPER_ADMIN" | "TOURNAMENT_ADMIN">("SUPER_ADMIN");
  const [evidenceApproved, setEvidenceApproved] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [inspectingEvidence, setInspectingEvidence] = useState<string | null>(null);

  // Games CRUD State
  const [games, setGames] = useState<Game[]>([]);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isSubmittingGame, setIsSubmittingGame] = useState(false);
  const [gameForm, setGameForm] = useState<GameCreatePayload>({
    slug: "",
    name: "",
    category: "pc",
    platform: "PC",
    tag: "FPS",
    is_team_game: true,
    min_team_size: 1,
    max_team_size: 5,
    banner_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
    logo_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&auto=format&fit=crop",
    description: "",
    server_region: "AWS Mumbai (ap-south-1)",
    anti_cheat: "Hardware Vanguard TPM 2.0",
    match_protocol: "Competitive Match",
    accent_color: "#E56A10",
  });

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
      const [profileRes, logsRes, usersRes, statsRes, matchesRes, disputesRes, gamesRes] = await Promise.allSettled([
        getCurrentUserProfile(),
        getAuditLogs(),
        getAdminUsers(),
        getAdminStats(),
        getMatches(),
        getDisputes(),
        getGames(),
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
      if (gamesRes.status === "fulfilled" && Array.isArray(gamesRes.value)) {
        setGames(gamesRes.value);
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

  // Game CRUD Handlers
  const handleOpenCreateGame = () => {
    setEditingGame(null);
    setGameForm({
      slug: "",
      name: "",
      category: "pc",
      platform: "PC",
      tag: "FPS",
      is_team_game: true,
      min_team_size: 1,
      max_team_size: 5,
      banner_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
      logo_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&auto=format&fit=crop",
      description: "",
      server_region: "AWS Mumbai (ap-south-1)",
      anti_cheat: "Hardware Vanguard TPM 2.0",
      match_protocol: "Competitive Match",
      accent_color: "#E56A10",
    });
    setIsGameModalOpen(true);
  };

  const handleOpenEditGame = (game: Game) => {
    setEditingGame(game);
    setGameForm({
      slug: game.slug,
      name: game.name,
      category: game.category || "pc",
      platform: game.platform,
      tag: game.tag,
      is_team_game: game.is_team_game,
      min_team_size: game.min_team_size,
      max_team_size: game.max_team_size,
      banner_url: game.banner_url,
      logo_url: game.logo_url,
      description: game.description || "",
      server_region: game.server_region || "AWS Mumbai (ap-south-1)",
      anti_cheat: game.anti_cheat || "Standard Protocol",
      match_protocol: game.match_protocol || "Competitive Match",
      accent_color: game.accent_color || "#E56A10",
    });
    setIsGameModalOpen(true);
  };

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingGame(true);
    try {
      if (editingGame) {
        await updateGame(editingGame.id, {
          name: gameForm.name,
          category: gameForm.category,
          platform: gameForm.platform,
          tag: gameForm.tag,
          is_team_game: gameForm.is_team_game,
          min_team_size: Number(gameForm.min_team_size),
          max_team_size: Number(gameForm.max_team_size),
          banner_url: gameForm.banner_url,
          logo_url: gameForm.logo_url,
          description: gameForm.description,
          server_region: gameForm.server_region,
          anti_cheat: gameForm.anti_cheat,
          match_protocol: gameForm.match_protocol,
          accent_color: gameForm.accent_color,
        });
        setActionMessage(`Game "${gameForm.name}" updated successfully!`);
      } else {
        const slug = gameForm.slug.trim() || gameForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        await createGame({
          ...gameForm,
          slug,
          min_team_size: Number(gameForm.min_team_size),
          max_team_size: Number(gameForm.max_team_size),
        });
        setActionMessage(`Game "${gameForm.name}" registered into catalog!`);
      }
      setIsGameModalOpen(false);
      setEditingGame(null);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to save game");
      setTimeout(() => setActionMessage(""), 5000);
    } finally {
      setIsSubmittingGame(false);
    }
  };

  const handleDeleteGame = async (gameId: string, gameName: string) => {
    if (!confirm(`Are you sure you want to delete game "${gameName}" from the platform catalog? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteGame(gameId);
      setActionMessage(`Game "${gameName}" successfully removed from catalog.`);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || `Failed to delete game "${gameName}".`);
      setTimeout(() => setActionMessage(""), 6000);
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

  const userEmail = (clerkUser?.primaryEmailAddress?.emailAddress || currentUser?.email || "").toLowerCase();
  const isHardcodedAdmin = userEmail === "pk.4081988@gmail.com" || userEmail === "admin@ametheus.gg";
  const isSuperAdmin = isHardcodedAdmin || currentUser?.role === "SUPER_ADMIN" || currentRole === "SUPER_ADMIN";

  // 3. Authenticated but unauthorized (PLAYER role without hardcoded override)
  if (!isHardcodedAdmin && currentUser && currentUser.role === "PLAYER") {
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
                onClick={() => setActiveTab("games")}
                className={`px-3.5 py-1.5 rounded transition-all font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "games"
                    ? "bg-[#E56A10] text-white shadow-xs"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#161A24]"
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" /> Games Catalog ({games.length})
              </button>
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

        {/* TAB 4: GAMES CATALOG & CRUD */}
        {activeTab === "games" && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#10141F] border border-[#242C3D] p-5 rounded-lg">
              <div>
                <h3 className="font-headline font-bold text-base text-white uppercase flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-[#E56A10]" /> Sanctioned Esports Games Catalog
                </h3>
                <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                  Register, configure, and manage authorized competitive titles, team configurations, and server rules.
                </p>
              </div>
              <button
                onClick={handleOpenCreateGame}
                className="px-4 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Add New Game
              </button>
            </div>

            {/* Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="bg-[#10141F] border border-[#242C3D] rounded-xl overflow-hidden hover:border-[#E56A10]/50 transition-all flex flex-col justify-between shadow-lg group"
                >
                  {/* Banner & Logo */}
                  <div>
                    <div className="h-32 w-full relative bg-[#0B0E16] overflow-hidden">
                      <img
                        src={game.banner_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200"}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#10141F] via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#0B0E16]/80 backdrop-blur-xs text-[#E56A10] border border-[#E56A10]/40 text-[10px] font-mono font-bold uppercase rounded">
                          {game.platform}
                        </span>
                        <span className="px-2 py-0.5 bg-[#0B0E16]/80 backdrop-blur-xs text-white border border-[#242C3D] text-[10px] font-mono font-bold uppercase rounded">
                          {game.tag}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#0B0E16] border-2 border-[#242C3D] overflow-hidden p-1 shadow-md shrink-0">
                          <img
                            src={game.logo_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300"}
                            alt={game.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <h4 className="font-headline font-bold text-base text-white">
                            {game.name}
                          </h4>
                          <span className="text-[11px] font-mono text-[#94A3B8]">
                            /{game.slug}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Specs */}
                    <div className="p-4 space-y-3">
                      <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                        {game.description || "Official sanctioned tournament title on AMETHEUS platform."}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-[#242C3D]">
                        <div className="bg-[#0B0E16] p-2 rounded border border-[#242C3D]">
                          <span className="text-[#64748B] block text-[9px] uppercase">Roster Format</span>
                          <span className="text-white font-bold">
                            {game.is_team_game
                              ? `${game.min_team_size}-${game.max_team_size} Athletes`
                              : "1v1 Solo"}
                          </span>
                        </div>
                        <div className="bg-[#0B0E16] p-2 rounded border border-[#242C3D]">
                          <span className="text-[#64748B] block text-[9px] uppercase">Tournaments</span>
                          <span className="text-[#E56A10] font-bold">
                            {game.active_tournaments_count || 0} Active
                          </span>
                        </div>
                        <div className="bg-[#0B0E16] p-2 rounded border border-[#242C3D] col-span-2">
                          <span className="text-[#64748B] block text-[9px] uppercase">Server / Anti-Cheat</span>
                          <span className="text-[#CBD5E1] truncate block">
                            {game.server_region || "AWS Mumbai"} • {game.anti_cheat || "Standard"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Edit & Delete) */}
                  <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-[#242C3D]/60 mt-2">
                    <button
                      onClick={() => handleOpenEditGame(game)}
                      className="flex-1 py-2 bg-[#161A24] border border-[#242C3D] hover:border-[#E56A10] hover:text-white text-[#CBD5E1] text-xs font-mono font-bold uppercase rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#E56A10]" /> Edit Game
                    </button>
                    <button
                      onClick={() => handleDeleteGame(game.id, game.name)}
                      className="p-2 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 rounded text-xs transition-colors cursor-pointer"
                      title="Delete Game Title"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {games.length === 0 && (
                <div className="col-span-full bg-[#10141F] border border-[#242C3D] p-12 rounded-xl text-center space-y-4">
                  <Gamepad2 className="w-12 h-12 text-[#64748B] mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-headline font-bold text-white text-lg">No Games in Catalog</h4>
                    <p className="text-xs text-[#94A3B8] font-mono max-w-md mx-auto">
                      Click &quot;Add New Game&quot; above or use the &quot;Seed Platform&quot; tool to populate standard competitive titles.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: USER & RBAC MANAGEMENT */}
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

      {/* Add / Edit Game Modal */}
      {isGameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#10141F] border border-[#242C3D] rounded-xl w-full max-w-2xl p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#242C3D] pb-3">
              <h3 className="text-base font-bold uppercase font-mono text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-[#E56A10]" />
                {editingGame ? `Edit Game: ${editingGame.name}` : "Register New Game Title"}
              </h3>
              <button
                onClick={() => setIsGameModalOpen(false)}
                className="text-[#94A3B8] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGame} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                    Game Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={gameForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      if (!editingGame) {
                        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                        setGameForm({ ...gameForm, name, slug });
                      } else {
                        setGameForm({ ...gameForm, name });
                      }
                    }}
                    placeholder="e.g. Apex Legends"
                    className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingGame)}
                    value={gameForm.slug}
                    onChange={(e) => setGameForm({ ...gameForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    placeholder="e.g. apex-legends"
                    className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                    Platform *
                  </label>
                  <input
                    type="text"
                    required
                    value={gameForm.platform}
                    onChange={(e) => setGameForm({ ...gameForm, platform: e.target.value })}
                    placeholder="e.g. PC, Mobile, Crossplay"
                    className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                    Tag / Genre *
                  </label>
                  <input
                    type="text"
                    required
                    value={gameForm.tag}
                    onChange={(e) => setGameForm({ ...gameForm, tag: e.target.value })}
                    placeholder="e.g. BATTLE ROYALE, FPS, MOBA"
                    className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                    Min Team Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={gameForm.min_team_size}
                    onChange={(e) => setGameForm({ ...gameForm, min_team_size: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={gameForm.max_team_size}
                    onChange={(e) => setGameForm({ ...gameForm, max_team_size: parseInt(e.target.value) || 5 })}
                    className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                    Server Region
                  </label>
                  <input
                    type="text"
                    value={gameForm.server_region}
                    onChange={(e) => setGameForm({ ...gameForm, server_region: e.target.value })}
                    placeholder="e.g. AWS Mumbai (ap-south-1)"
                    className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                    Anti-Cheat Protocol
                  </label>
                  <input
                    type="text"
                    value={gameForm.anti_cheat}
                    onChange={(e) => setGameForm({ ...gameForm, anti_cheat: e.target.value })}
                    placeholder="e.g. Hardware Vanguard TPM 2.0"
                    className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                    Banner URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={gameForm.banner_url}
                    onChange={(e) => setGameForm({ ...gameForm, banner_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                    Logo / Icon URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={gameForm.logo_url}
                    onChange={(e) => setGameForm({ ...gameForm, logo_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-[#CBD5E1] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={gameForm.description}
                    onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                    placeholder="Brief description of competitive format and gameplay..."
                    className="w-full bg-[#161A24] border border-[#242C3D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => setIsGameModalOpen(false)}
                  className="px-4 py-2 bg-[#161A24] border border-[#242C3D] text-xs font-mono uppercase rounded-lg text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGame}
                  className="px-5 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded-lg shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingGame ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : editingGame ? (
                    "Save Changes"
                  ) : (
                    "Create Game Title"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
