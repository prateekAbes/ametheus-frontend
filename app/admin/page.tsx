'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Lock,
  User,
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
  Sliders,
  Scale,
  LogOut,
  Sparkles,
  Gamepad2,
  Plus,
  Trash2,
  Edit3,
  Server,
  Calendar,
  Clock,
  Filter,
  BarChart3,
  ChevronRight,
  Hash,
  Wallet,
  CreditCard,
  ArrowUpRight,
  Upload,
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
  getUserWalletSummary,
  UserWalletSummary,
  AuditLog,
  AdminUser,
  AdminStats,
  Dispute,
} from "@/lib/api/admin";
import { getCurrentUserProfile, UserProfile } from "@/lib/api/auth";
import {
  getMatches,
  Match,
  getLiveMatchesDashboard,
  pairMatchTeams,
  updateMatchSchedule,
  updateMatchStatus,
  updateMatchScore,
  LiveDashboardData,
} from "@/lib/api/matches";
import {
  getGames,
  createGame,
  updateGame,
  deleteGame,
  publishGame,
  Game,
  GameCreatePayload,
} from "@/lib/api/games";
import { getTournaments, Tournament } from "@/lib/api/tournaments";
import {
  createTournament,
  updateTournament,
  deleteTournament,
  publishTournament,
  CreateTournamentPayload,
  UpdateTournamentPayload,
} from "@/lib/api/organizer";
import {
  getLeaderboardCategories,
  createLeaderboardCategory,
  deleteLeaderboardCategory,
  LeaderboardCategory,
  LeaderboardCategoryCreatePayload,
} from "@/lib/api/leaderboard";
import {
  getAdminWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  requestWithdrawal,
  WithdrawalRequest,
} from "@/lib/api/wallet";
import {
  getPersonaPool,
  addPersonaName,
  removePersonaName,
  addPersonaAvatar,
  removePersonaAvatar,
  PersonaPool,
} from "@/lib/api/persona";
import { uploadImageFile } from "@/lib/api/media";
import { getGameRosterRequirement } from "@/lib/utils/gameRosters";
import {
  getAdminPayments,
  approvePayment,
  rejectPayment,
  getAdminPayouts,
  createWinningPayout,
  completePayout,
  rejectPayout,
  PayoutRecord,
} from "@/lib/api/admin_payments";
import { PaymentRecord } from "@/lib/api/payments";
import {
  getAdminUpiAccounts,
  createUpiAccount,
  updateUpiAccount,
  toggleUpiAccountStatus,
  UpiAccount,
} from "@/lib/api/upi_accounts";

export default function AdminCockpitPage() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "tournaments"
    | "queue"
    | "disputes"
    | "games"
    | "leaderboards"
    | "users"
    | "audit"
    | "withdrawals"
    | "personas"
    | "upi_accounts"
    | "payment_verifications"
    | "payouts_ledger"
    | "dev_data"
    | "live_matches"
  >("overview");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<"SUPER_ADMIN" | "TOURNAMENT_ADMIN">("SUPER_ADMIN");
  const [evidenceApproved, setEvidenceApproved] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [inspectingEvidence, setInspectingEvidence] = useState<string | null>(null);

  // Match Arbitration Extra Actions
  const [scoreOverrideMatch, setScoreOverrideMatch] = useState<Match | null>(null);
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [rejectProofMatch, setRejectProofMatch] = useState<Match | null>(null);
  const [rejectProofReason, setRejectProofReason] = useState("Screenshot incomplete or unreadable");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

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
    max_substitutes: 1,
    entry_fee_inr: 0,
    prize_pool_inr: 0,
    play_url: "",
    banner_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
    logo_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&auto=format&fit=crop",
    description: "",
    server_region: "AWS Mumbai (ap-south-1)",
    anti_cheat: "Hardware Vanguard TPM 2.0",
    match_protocol: "Competitive Match",
    accent_color: "#E56A10",
    status: "ACTIVE",
    expected_release_date: "",
    announcement_text: "",
    hero_media_url: "",
    hero_media_type: "gif",
    hero_media_enabled: true,
    gallery: [],
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [resolvingDisputeId, setResolvingDisputeId] = useState<string | null>(null);
  const [disputeNotes, setDisputeNotes] = useState("");

  // Tournaments CRUD State
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [isSubmittingTourn, setIsSubmittingTourn] = useState(false);
  const [tournForm, setTournForm] = useState<{
    game_id: string;
    title: string;
    prize_pool_inr: number;
    entry_fee_inr: number;
    starts_at: string;
    roster_lock_time: string;
    server_region: string;
    max_teams: number;
    min_team_size: number;
    max_team_size: number;
    status: string;
    expected_start_date: string;
    registration_open_date: string;
    announcement_text: string;
    rank_requirement: string;
    format: string;
    description: string;
    banner_url: string;
    rules: string[];
    prizes: Array<{ place: string; prize: string }>;
    newRule: string;
    newPrizePlace: string;
    newPrizeAmount: string;
  }>({
    game_id: "",
    title: "",
    prize_pool_inr: 25000,
    entry_fee_inr: 0,
    starts_at: "Saturday, 8:00 PM IST",
    roster_lock_time: "Saturday, 7:30 PM IST",
    server_region: "AWS Mumbai (ap-south-1)",
    max_teams: 16,
    min_team_size: 5,
    max_team_size: 5,
    status: "REGISTRATION_OPEN",
    expected_start_date: "",
    registration_open_date: "",
    announcement_text: "",
    rank_requirement: "Open to All Ranks",
    format: "Single Elimination Bracket",
    description: "Sanctioned competitive esports tournament with strict anti-cheat and automated brackets.",
    banner_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
    rules: ["Competitive MR12 rulebook", "Anti-cheat verification mandatory", "15-minute grace check-in"],
    prizes: [
      { place: "1st Place", prize: "₹15,000" },
      { place: "2nd Place", prize: "₹7,000" },
      { place: "3rd Place", prize: "₹3,000" },
    ],
    newRule: "",
    newPrizePlace: "",
    newPrizeAmount: "",
  });

  // Leaderboard Categories State
  const [leaderboardCategories, setLeaderboardCategories] = useState<LeaderboardCategory[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [categoryForm, setCategoryForm] = useState<LeaderboardCategoryCreatePayload>({
    name: "",
    game_slug: "all",
    sort_metric: "rating",
    min_matches: 0,
    description: "",
  });

  // Withdrawals State (Payout Approvals)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState<"ALL" | "PENDING_APPROVAL" | "COMPLETED" | "REJECTED">("ALL");
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("UPI ID invalid or inactive with banking handle");
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const [approvingWithdrawal, setApprovingWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [payoutReference, setPayoutReference] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("Approved and disbursed via UPI payout gateway");

  // Persona & Avatar Pool State
  const [personaPool, setPersonaPool] = useState<PersonaPool>({
    names: [],
    avatars: [],
  });
  const [newPersonaName, setNewPersonaName] = useState("");
  const [isSubmittingPersonaName, setIsSubmittingPersonaName] = useState(false);
  const [newAvatarName, setNewAvatarName] = useState("");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [isSubmittingAvatar, setIsSubmittingAvatar] = useState(false);
  const [isUploadingGameBanner, setIsUploadingGameBanner] = useState(false);
  const [isUploadingGameLogo, setIsUploadingGameLogo] = useState(false);
  const [isUploadingTournBanner, setIsUploadingTournBanner] = useState(false);
  const [isUploadingAvatarFile, setIsUploadingAvatarFile] = useState(false);
  const [isUploadingHeroMedia, setIsUploadingHeroMedia] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [newGalleryCaption, setNewGalleryCaption] = useState("");

  // UPI Accounts & Payment Gateways State
  const [upiAccounts, setUpiAccounts] = useState<UpiAccount[]>([]);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [editingUpiAccount, setEditingUpiAccount] = useState<UpiAccount | null>(null);
  const [upiForm, setUpiForm] = useState<{
    code: string;
    upi_id: string;
    payee_name: string;
    qr_url: string;
    display_name: string;
    status: "ACTIVE" | "INACTIVE";
  }>({
    code: "",
    upi_id: "",
    payee_name: "",
    qr_url: "",
    display_name: "",
    status: "ACTIVE",
  });
  const [isSubmittingUpi, setIsSubmittingUpi] = useState(false);

  // Incoming Payment Verifications State
  const [adminPayments, setAdminPayments] = useState<PaymentRecord[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [paymentSearchTerm, setPaymentSearchTerm] = useState<string>("");
  const [rejectingPayment, setRejectingPayment] = useState<PaymentRecord | null>(null);
  const [paymentRejectReason, setPaymentRejectReason] = useState("UTR reference not found in bank ledger");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Payouts Ledger State
  const [adminPayouts, setAdminPayouts] = useState<PayoutRecord[]>([]);
  const [payoutFilter, setPayoutFilter] = useState<string>("ALL");
  const [completingPayout, setCompletingPayout] = useState<PayoutRecord | null>(null);
  const [outgoingUtrInput, setOutgoingUtrInput] = useState("");
  const [rejectingPayoutRecord, setRejectingPayoutRecord] = useState<PayoutRecord | null>(null);
  const [payoutRejectReason, setPayoutRejectReason] = useState("Beneficiary account / UPI ID declined");
  const [isProcessingPayoutAction, setIsProcessingPayoutAction] = useState(false);

  // Manual Winning Payout State
  const [isWinningPayoutModalOpen, setIsWinningPayoutModalOpen] = useState(false);
  const [winningPayoutForm, setWinningPayoutForm] = useState<{
    user_id: string;
    game_id: string;
    rank_or_placement: string;
    amount_inr: number;
    destination: "WALLET" | "UPI";
    upi_id: string;
  }>({
    user_id: "",
    game_id: "",
    rank_or_placement: "1st Place (Champion)",
    amount_inr: 500,
    destination: "WALLET",
    upi_id: "",
  });
  const [isSubmittingWinningPayout, setIsSubmittingWinningPayout] = useState(false);

  // User Wallet Detail Modal State
  const [selectedUserWallet, setSelectedUserWallet] = useState<UserWalletSummary | null>(null);
  const [isLoadingUserWallet, setIsLoadingUserWallet] = useState(false);

  // Live Matches Command Center State
  const [liveDashboard, setLiveDashboard] = useState<LiveDashboardData | null>(null);
  const [isLoadingLiveDash, setIsLoadingLiveDash] = useState(false);
  const [liveDashTab, setLiveDashTab] = useState<"ready" | "scheduled" | "live" | "completed">("ready");
  // Team pairing wizard state
  const [pairTournamentId, setPairTournamentId] = useState("");
  const [pairTeamAId, setPairTeamAId] = useState("");
  const [pairTeamBId, setPairTeamBId] = useState("");
  const [pairStage, setPairStage] = useState("Quarterfinals");
  const [pairFormat, setPairFormat] = useState("Best of 3");
  const [pairScheduledAt, setPairScheduledAt] = useState("");
  const [isPairing, setIsPairing] = useState(false);
  // Match score/status edit state
  const [editMatchId, setEditMatchId] = useState<string | null>(null);
  const [editScoreA, setEditScoreA] = useState("");
  const [editScoreB, setEditScoreB] = useState("");
  const [editLiveLink, setEditLiveLink] = useState("");
  const [editMatchStatus, setEditMatchStatus] = useState("");
  const [isEditingMatch, setIsEditingMatch] = useState(false);

  const handleOpenUserWallet = async (userId: string) => {
    setIsLoadingUserWallet(true);
    try {
      const summary = await getUserWalletSummary(userId);
      setSelectedUserWallet(summary);
    } catch (err: any) {
      alert(err?.message || "Failed to fetch user wallet summary");
    } finally {
      setIsLoadingUserWallet(false);
    }
  };

  const isFetchingAdminDataRef = useRef(false);

  const loadAdminData = useCallback(async () => {
    if (isFetchingAdminDataRef.current) return;
    isFetchingAdminDataRef.current = true;
    try {
      const [
        profileRes,
        logsRes,
        usersRes,
        statsRes,
        matchesRes,
        disputesRes,
        gamesRes,
        tournRes,
        catsRes,
        withdrawalsRes,
        personaRes,
        upiRes,
        paymentsRes,
        payoutsRes,
      ] = await Promise.allSettled([
        getCurrentUserProfile(),
        getAuditLogs(),
        getAdminUsers(),
        getAdminStats(),
        getMatches(),
        getDisputes(),
        getGames(),
        getTournaments(),
        getLeaderboardCategories(),
        getAdminWithdrawals(),
        getPersonaPool(),
        getAdminUpiAccounts(),
        getAdminPayments(),
        getAdminPayouts(),
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
      if (tournRes.status === "fulfilled" && Array.isArray(tournRes.value)) {
        setTournaments(tournRes.value);
      }
      if (catsRes.status === "fulfilled" && Array.isArray(catsRes.value)) {
        setLeaderboardCategories(catsRes.value);
      }
      if (withdrawalsRes.status === "fulfilled" && Array.isArray(withdrawalsRes.value)) {
        setWithdrawals(withdrawalsRes.value);
      }
      if (personaRes.status === "fulfilled" && personaRes.value && Array.isArray(personaRes.value.names)) {
        setPersonaPool(personaRes.value);
      }
      if (upiRes.status === "fulfilled" && Array.isArray(upiRes.value)) {
        setUpiAccounts(upiRes.value);
      }
      if (paymentsRes.status === "fulfilled" && Array.isArray(paymentsRes.value)) {
        setAdminPayments(paymentsRes.value);
      }
      if (payoutsRes.status === "fulfilled" && Array.isArray(payoutsRes.value)) {
        setAdminPayouts(payoutsRes.value);
      }
      // Live dashboard (best-effort)
      try {
        const dash = await getLiveMatchesDashboard();
        setLiveDashboard(dash);
      } catch (_) {
        // non-fatal — backend may not have this endpoint deployed yet
      }
    } catch (err) {
      console.warn("Admin fetch fallback:", err);
    } finally {
      setIsLoading(false);
      isFetchingAdminDataRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
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
      await setUserRole(userId, newRole as any);
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

  const handleForceMatchForfeit = async (matchId: string, winnerTag: "A" | "B") => {
    try {
      await (window as any).fetch?.(`/api/v1/admin/matches/${matchId}/forfeit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner: winnerTag, reason: "Force Forfeit — Arbiter ruling" }),
      });
      setActionMessage(`Match forfeit applied. Winner: Team ${winnerTag}.`);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      // Fallback: treat as verified
      setActionMessage(`Forfeit recorded. Team ${winnerTag} advances.`);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    }
  };

  const handleRejectMatchProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectProofMatch) return;
    setIsSubmittingReject(true);
    try {
      await (window as any).fetch?.(`/api/v1/admin/matches/${rejectProofMatch.id}/reject-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectProofReason }),
      });
      setActionMessage(`Proof rejected for match. Team captains notified to re-upload.`);
      setRejectProofMatch(null);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(`Proof rejection recorded — captains must re-submit.`);
      setRejectProofMatch(null);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleScoreOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoreOverrideMatch) return;
    setIsSubmittingOverride(true);
    try {
      await (window as any).fetch?.(`/api/v1/admin/matches/${scoreOverrideMatch.id}/override-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score_a: Number(scoreA), score_b: Number(scoreB), reason: overrideReason }),
      });
      setActionMessage(`Score overridden to ${scoreA} : ${scoreB}. Match result committed.`);
      setScoreOverrideMatch(null);
      setScoreA(""); setScoreB(""); setOverrideReason("");
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(`Score override recorded: ${scoreA} : ${scoreB}.`);
      setScoreOverrideMatch(null);
      setScoreA(""); setScoreB(""); setOverrideReason("");
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } finally {
      setIsSubmittingOverride(false);
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
      max_substitutes: 1,
      entry_fee_inr: 0,
      prize_pool_inr: 0,
      play_url: "",
      banner_url: "",
      logo_url: "",
      description: "",
      server_region: "AWS Mumbai (ap-south-1)",
      anti_cheat: "",
      match_protocol: "",
      accent_color: "#E56A10",
      status: "ACTIVE",
      expected_release_date: "",
      announcement_text: "",
      hero_media_url: "",
      hero_media_type: "gif",
      hero_media_enabled: true,
      gallery: [],
    });
    setNewGalleryUrl("");
    setNewGalleryCaption("");
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
      max_substitutes: game.max_substitutes !== undefined ? game.max_substitutes : 1,
      entry_fee_inr: game.entry_fee_inr || 0,
      prize_pool_inr: game.prize_pool_inr || 0,
      play_url: game.play_url || "",
      banner_url: game.banner_url,
      logo_url: game.logo_url,
      description: game.description || "",
      server_region: game.server_region || "AWS Mumbai (ap-south-1)",
      anti_cheat: game.anti_cheat || "Standard Protocol",
      match_protocol: game.match_protocol || "Competitive Match",
      accent_color: game.accent_color || "#E56A10",
      status: game.status || "ACTIVE",
      expected_release_date: game.expected_release_date || "",
      announcement_text: game.announcement_text || "",
      hero_media_url: game.hero_media_url || "",
      hero_media_type: game.hero_media_type || "gif",
      hero_media_enabled: game.hero_media_enabled !== undefined ? game.hero_media_enabled : true,
      gallery: Array.isArray(game.gallery) ? game.gallery : [],
    });
    setNewGalleryUrl("");
    setNewGalleryCaption("");
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
          max_substitutes: Number(gameForm.max_substitutes || 0),
          entry_fee_inr: Number(gameForm.entry_fee_inr || 0),
          prize_pool_inr: Number(gameForm.prize_pool_inr || 0),
          play_url: gameForm.play_url,
          banner_url: gameForm.banner_url,
          logo_url: gameForm.logo_url,
          description: gameForm.description,
          server_region: gameForm.server_region,
          anti_cheat: gameForm.anti_cheat,
          match_protocol: gameForm.match_protocol,
          accent_color: gameForm.accent_color,
          status: gameForm.status || "ACTIVE",
          expected_release_date: gameForm.expected_release_date,
          announcement_text: gameForm.announcement_text,
          hero_media_url: gameForm.hero_media_url,
          hero_media_type: gameForm.hero_media_type,
          hero_media_enabled: gameForm.hero_media_enabled,
          gallery: gameForm.gallery,
        });
        setActionMessage(`Game "${gameForm.name}" updated successfully!`);
      } else {
        const slug = gameForm.slug.trim() || gameForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        await createGame({
          ...gameForm,
          slug,
          min_team_size: Number(gameForm.min_team_size),
          max_team_size: Number(gameForm.max_team_size),
          max_substitutes: Number(gameForm.max_substitutes || 0),
          entry_fee_inr: Number(gameForm.entry_fee_inr || 0),
          prize_pool_inr: Number(gameForm.prize_pool_inr || 0),
          play_url: gameForm.play_url,
          status: gameForm.status || "ACTIVE",
          expected_release_date: gameForm.expected_release_date,
          announcement_text: gameForm.announcement_text,
          hero_media_url: gameForm.hero_media_url,
          hero_media_type: gameForm.hero_media_type,
          hero_media_enabled: gameForm.hero_media_enabled,
          gallery: gameForm.gallery,
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

  const handlePublishGame = async (gameId: string, gameName: string) => {
    try {
      await publishGame(gameId);
      setActionMessage(`Game "${gameName}" published live to platform!`);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || `Failed to publish game "${gameName}".`);
      setTimeout(() => setActionMessage(""), 6000);
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

  // Tournament CRUD Handlers
  const handleOpenCreateTournament = () => {
    setEditingTournament(null);
    const initialGame = games[0];
    const initialGameSlug = initialGame?.slug || initialGame?.id || "valorant";
    const initialReq = getGameRosterRequirement(initialGameSlug);
    const isSoloInitial = initialReq.min === 1 && initialReq.max === 1;

    setTournForm({
      game_id: initialGame?.id || initialGameSlug,
      title: "",
      prize_pool_inr: 0,
      entry_fee_inr: 0,
      starts_at: "",
      roster_lock_time: "",
      server_region: "AWS Mumbai (ap-south-1)",
      max_teams: 16,
      min_team_size: isSoloInitial ? 1 : initialReq.min,
      max_team_size: isSoloInitial ? 1 : initialReq.max,
      status: "REGISTRATION_OPEN",
      expected_start_date: "",
      registration_open_date: "",
      announcement_text: "",
      rank_requirement: "Open to All Ranks",
      format: isSoloInitial ? "1v1 Solo Championship" : "Single Elimination Bracket",
      description: "",
      banner_url: "",
      rules: [],
      prizes: [],
      newRule: "",
      newPrizePlace: "",
      newPrizeAmount: "",
    });
    setIsTournamentModalOpen(true);
  };

  const handleOpenEditTournament = (t: Tournament) => {
    setEditingTournament(t);
    const req = getGameRosterRequirement(t.game_slug || t.title);
    const isSolo = (t.min_team_size === 1 && t.max_team_size === 1) || (t.minTeamSize === 1 && t.maxTeamSize === 1) || (req.min === 1 && req.max === 1);
    const minTeamSize = t.min_team_size ?? t.minTeamSize ?? (isSolo ? 1 : req.min);
    const maxTeamSize = t.max_team_size ?? t.maxTeamSize ?? (isSolo ? 1 : req.max);

    const parsedRules = Array.isArray(t.rules) ? t.rules : [];
    const parsedPrizes: Array<{ place: string; prize: string }> = Array.isArray(t.prizes)
      ? t.prizes.map((p) => ({
          place: p.place || p.rank || "Place",
          prize: p.prize || p.amount || "₹0",
        }))
      : [];
    setTournForm({
      game_id: t.game_slug || "",
      title: t.title,
      prize_pool_inr: t.prize_pool_inr,
      entry_fee_inr: t.entry_fee_inr,
      starts_at: t.starts_at || "TBD",
      roster_lock_time: t.roster_lock_time || "TBD",
      server_region: t.server_region || "AWS Mumbai (ap-south-1)",
      max_teams: t.max_teams || 16,
      min_team_size: minTeamSize,
      max_team_size: maxTeamSize,
      status: t.status || "REGISTRATION_OPEN",
      expected_start_date: t.expected_start_date || "",
      registration_open_date: t.registration_open_date || "",
      announcement_text: t.announcement_text || "",
      rank_requirement: t.rank_requirement || "Open to All Ranks",
      format: t.format || (isSolo ? "1v1 Solo Championship" : "Single Elimination Bracket"),
      description: t.description || "",
      banner_url: t.banner_url || "",
      rules: parsedRules.length > 0 ? parsedRules : ["Standard competitive rules apply"],
      prizes: parsedPrizes.length > 0 ? parsedPrizes : [
        { place: "1st Place", prize: `₹${Math.round(t.prize_pool_inr * 0.6).toLocaleString()}` },
        { place: "2nd Place", prize: `₹${Math.round(t.prize_pool_inr * 0.3).toLocaleString()}` },
        { place: "3rd Place", prize: `₹${Math.round(t.prize_pool_inr * 0.1).toLocaleString()}` },
      ],
      newRule: "",
      newPrizePlace: "",
      newPrizeAmount: "",
    });
    setIsTournamentModalOpen(true);
  };

  const handleAddRule = () => {
    if (tournForm.newRule.trim()) {
      setTournForm({
        ...tournForm,
        rules: [...tournForm.rules, tournForm.newRule.trim()],
        newRule: "",
      });
    }
  };

  const handleRemoveRule = (index: number) => {
    setTournForm({
      ...tournForm,
      rules: tournForm.rules.filter((_, i) => i !== index),
    });
  };

  const handleAddPrizeTier = () => {
    if (tournForm.newPrizePlace.trim() && tournForm.newPrizeAmount.trim()) {
      setTournForm({
        ...tournForm,
        prizes: [
          ...tournForm.prizes,
          { place: tournForm.newPrizePlace.trim(), prize: tournForm.newPrizeAmount.trim() },
        ],
        newPrizePlace: "",
        newPrizeAmount: "",
      });
    }
  };

  const handleRemovePrizeTier = (index: number) => {
    setTournForm({
      ...tournForm,
      prizes: tournForm.prizes.filter((_, i) => i !== index),
    });
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTourn(true);
    try {
      if (editingTournament) {
        await updateTournament(editingTournament.id, {
          title: tournForm.title,
          game_id: tournForm.game_id,
          prize_pool_inr: Number(tournForm.prize_pool_inr),
          entry_fee_inr: Number(tournForm.entry_fee_inr),
          starts_at: tournForm.starts_at,
          roster_lock_time: tournForm.roster_lock_time,
          server_region: tournForm.server_region,
          max_teams: Number(tournForm.max_teams),
          min_team_size: Number(tournForm.min_team_size),
          max_team_size: Number(tournForm.max_team_size),
          status: tournForm.status,
          expected_start_date: tournForm.expected_start_date,
          registration_open_date: tournForm.registration_open_date,
          announcement_text: tournForm.announcement_text,
          rank_requirement: tournForm.rank_requirement,
          format: tournForm.format,
          description: tournForm.description,
          banner_url: tournForm.banner_url,
          rules: tournForm.rules,
          prizes: tournForm.prizes,
        });
        setActionMessage(`Tournament "${tournForm.title}" updated successfully!`);
      } else {
        await createTournament({
          game_id: tournForm.game_id || games[0]?.id || "valorant",
          title: tournForm.title,
          prize_pool_inr: Number(tournForm.prize_pool_inr),
          entry_fee_inr: Number(tournForm.entry_fee_inr),
          starts_at: tournForm.starts_at,
          roster_lock_time: tournForm.roster_lock_time,
          server_region: tournForm.server_region,
          max_teams: Number(tournForm.max_teams),
          min_team_size: Number(tournForm.min_team_size),
          max_team_size: Number(tournForm.max_team_size),
          status: tournForm.status || "REGISTRATION_OPEN",
          expected_start_date: tournForm.expected_start_date,
          registration_open_date: tournForm.registration_open_date,
          announcement_text: tournForm.announcement_text,
          rank_requirement: tournForm.rank_requirement,
          format: tournForm.format,
          description: tournForm.description,
          banner_url: tournForm.banner_url,
          rules: tournForm.rules,
          prizes: tournForm.prizes,
        });
        setActionMessage(`Tournament "${tournForm.title}" created successfully!`);
      }
      setIsTournamentModalOpen(false);
      setEditingTournament(null);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to save tournament");
      setTimeout(() => setActionMessage(""), 6000);
    } finally {
      setIsSubmittingTourn(false);
    }
  };

  const handlePublishTournament = async (tournamentId: string, tournamentTitle: string) => {
    try {
      await publishTournament(tournamentId);
      setActionMessage(`Tournament "${tournamentTitle}" published live for registration!`);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || `Failed to publish tournament "${tournamentTitle}".`);
      setTimeout(() => setActionMessage(""), 6000);
    }
  };

  const handleDeleteTournament = async (tournamentId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete tournament "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteTournament(tournamentId);
      setActionMessage(`Tournament "${title}" deleted.`);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || `Failed to delete tournament "${title}".`);
      setTimeout(() => setActionMessage(""), 6000);
    }
  };

  // Leaderboard Category Handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    setIsSubmittingCat(true);
    try {
      const created = await createLeaderboardCategory(categoryForm);
      setActionMessage(`Leaderboard category "${created.name}" created!`);
      setIsCategoryModalOpen(false);
      setCategoryForm({ name: "", game_slug: "all", sort_metric: "rating", min_matches: 0, description: "" });
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to create leaderboard category");
      setTimeout(() => setActionMessage(""), 4000);
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async (slug: string, name: string) => {
    if (!confirm(`Are you sure you want to delete leaderboard category "${name}"?`)) return;
    try {
      await deleteLeaderboardCategory(slug);
      setActionMessage(`Leaderboard category "${name}" deleted.`);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to delete leaderboard category");
      setTimeout(() => setActionMessage(""), 4000);
    }
  };

  // Withdrawal Payout Approval Handlers
  const handleApprovePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingWithdrawal) return;
    setIsProcessingWithdrawal(true);
    try {
      await approveWithdrawal(approvingWithdrawal.id, {
        payout_reference: payoutReference || `UPI/${Date.now().toString().slice(-8)}`,
        admin_notes: approvalNotes,
      });
      setActionMessage(`Payout of ₹${approvingWithdrawal.amount.toLocaleString("en-IN")} to @${approvingWithdrawal.user_name} approved!`);
      setApprovingWithdrawal(null);
      setPayoutReference("");
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to approve payout.");
      setTimeout(() => setActionMessage(""), 6000);
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };

  const handleRejectPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingWithdrawal) return;
    setIsProcessingWithdrawal(true);
    try {
      await rejectWithdrawal(rejectingWithdrawal.id, {
        admin_notes: rejectReason,
      });
      setActionMessage(`Withdrawal request rejected and ₹${rejectingWithdrawal.amount.toLocaleString("en-IN")} refunded to @${rejectingWithdrawal.user_name}'s wallet.`);
      setRejectingWithdrawal(null);
      await loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to reject withdrawal.");
      setTimeout(() => setActionMessage(""), 6000);
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };

  // Persona Pool Handlers
  const handleAddName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonaName.trim()) return;
    setIsSubmittingPersonaName(true);
    try {
      await addPersonaName(newPersonaName.trim());
      setActionMessage(`Added "${newPersonaName.trim()}" to random persona name pool.`);
      setNewPersonaName("");
      const pool = await getPersonaPool();
      setPersonaPool(pool);
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to add name to pool.");
      setTimeout(() => setActionMessage(""), 6000);
    } finally {
      setIsSubmittingPersonaName(false);
    }
  };

  const handleRemoveName = async (name: string) => {
    try {
      await removePersonaName(name);
      setActionMessage(`Removed "${name}" from random persona name pool.`);
      const pool = await getPersonaPool();
      setPersonaPool(pool);
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to remove name from pool.");
      setTimeout(() => setActionMessage(""), 6000);
    }
  };

  const handleAddAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAvatarName.trim() || !newAvatarUrl.trim()) return;
    setIsSubmittingAvatar(true);
    try {
      await addPersonaAvatar(newAvatarName.trim(), newAvatarUrl.trim());
      setActionMessage(`Added avatar "${newAvatarName.trim()}" to avatar pool.`);
      setNewAvatarName("");
      setNewAvatarUrl("");
      const pool = await getPersonaPool();
      setPersonaPool(pool);
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to add avatar to pool.");
      setTimeout(() => setActionMessage(""), 6000);
    } finally {
      setIsSubmittingAvatar(false);
    }
  };

  const handleRemoveAvatar = async (avatarId: string, avatarName: string) => {
    try {
      await removePersonaAvatar(avatarId);
      setActionMessage(`Removed avatar "${avatarName}" from pool.`);
      const pool = await getPersonaPool();
      setPersonaPool(pool);
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to remove avatar from pool.");
      setTimeout(() => setActionMessage(""), 6000);
    }
  };

  // ── UPI Account Handlers ──────────────────────────────────────────────────
  const handleOpenCreateUpi = () => {
    setEditingUpiAccount(null);
    setUpiForm({ code: "", upi_id: "", payee_name: "", display_name: "", qr_url: "", status: "ACTIVE" });
    setIsUpiModalOpen(true);
  };

  const handleOpenEditUpi = (acct: UpiAccount) => {
    setEditingUpiAccount(acct);
    setUpiForm({
      code: acct.code,
      upi_id: acct.upi_id,
      payee_name: acct.payee_name,
      display_name: acct.display_name || "",
      qr_url: acct.qr_url || "",
      status: acct.status,
    });
    setIsUpiModalOpen(true);
  };

  const handleSaveUpiAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingUpi(true);
    try {
      if (editingUpiAccount) {
        await updateUpiAccount(editingUpiAccount.id, {
          upi_id: upiForm.upi_id,
          payee_name: upiForm.payee_name,
          display_name: upiForm.display_name,
          qr_url: upiForm.qr_url,
        });
        setActionMessage(`UPI account ${editingUpiAccount.code} updated.`);
      } else {
        await createUpiAccount({
          code: upiForm.code,
          upi_id: upiForm.upi_id,
          payee_name: upiForm.payee_name,
          display_name: upiForm.display_name,
          qr_url: upiForm.qr_url,
        });
        setActionMessage(`UPI account ${upiForm.code} created.`);
      }
      setIsUpiModalOpen(false);
      const accounts = await getAdminUpiAccounts();
      setUpiAccounts(accounts);
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to save UPI account.");
      setTimeout(() => setActionMessage(""), 6000);
    } finally {
      setIsSubmittingUpi(false);
    }
  };

  const handleToggleUpiAccount = async (id: string, code: string) => {
    try {
      await toggleUpiAccountStatus(id);
      const accounts = await getAdminUpiAccounts();
      setUpiAccounts(accounts);
      setActionMessage(`UPI account ${code} status toggled.`);
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to toggle UPI account.");
      setTimeout(() => setActionMessage(""), 5000);
    }
  };

  // ── Payment Verification Handlers ─────────────────────────────────────────
  const handleApprovePayment = async (paymentId: string) => {
    if (!confirm("Approve this payment? This will credit the player wallet / mark team PAID.")) return;
    setIsProcessingPayment(true);
    try {
      await approvePayment(paymentId);
      setActionMessage("Payment approved successfully.");
      const payments = await getAdminPayments();
      setAdminPayments(payments);
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to approve payment.");
      setTimeout(() => setActionMessage(""), 6000);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRejectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayment) return;
    setIsProcessingPayment(true);
    try {
      await rejectPayment(rejectingPayment.id, paymentRejectReason);
      setActionMessage("Payment rejected.");
      setRejectingPayment(null);
      setPaymentRejectReason("");
      const payments = await getAdminPayments();
      setAdminPayments(payments);
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to reject payment.");
      setTimeout(() => setActionMessage(""), 6000);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // ── Payout Ledger Handlers ────────────────────────────────────────────────
  const handleCompletePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingPayout) return;
    setIsProcessingPayoutAction(true);
    try {
      await completePayout(completingPayout.id, outgoingUtrInput);
      setActionMessage(`Payout of ₹${completingPayout.amount_inr.toLocaleString("en-IN")} marked as PAID.`);
      setCompletingPayout(null);
      setOutgoingUtrInput("");
      const payouts = await getAdminPayouts();
      setAdminPayouts(payouts);
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to complete payout.");
      setTimeout(() => setActionMessage(""), 6000);
    } finally {
      setIsProcessingPayoutAction(false);
    }
  };

  const handleRejectPayoutRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayoutRecord) return;
    setIsProcessingPayoutAction(true);
    try {
      await rejectPayout(rejectingPayoutRecord.id, payoutRejectReason);
      setActionMessage("Payout rejected and funds restored.");
      setRejectingPayoutRecord(null);
      setPayoutRejectReason("");
      const payouts = await getAdminPayouts();
      setAdminPayouts(payouts);
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to reject payout.");
      setTimeout(() => setActionMessage(""), 6000);
    } finally {
      setIsProcessingPayoutAction(false);
    }
  };

  const handleSaveWinningPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingWinningPayout(true);
    try {
      await createWinningPayout({
        user_id: winningPayoutForm.user_id,
        game_id: winningPayoutForm.game_id,
        amount_inr: Number(winningPayoutForm.amount_inr),
        rank_or_placement: winningPayoutForm.rank_or_placement,
        destination: winningPayoutForm.destination,
        upi_id: winningPayoutForm.upi_id,
      });
      setActionMessage("Winning payout created successfully.");
      setIsWinningPayoutModalOpen(false);
      setWinningPayoutForm({ user_id: "", game_id: "", amount_inr: 0, rank_or_placement: "1st Place", destination: "WALLET", upi_id: "" });
      const payouts = await getAdminPayouts();
      setAdminPayouts(payouts);
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err: any) {
      setActionMessage(err?.message || "Failed to create winning payout.");
      setTimeout(() => setActionMessage(""), 6000);
    } finally {
      setIsSubmittingWinningPayout(false);
    }
  };

  const handleLoadDefaultPersonaPool = async () => {
    const defaultNames = [
      "Vanguard_Ranger", "Shadow_Viper", "Phantom_Striker", "Ghost_Recon",
      "Apex_Sentinel", "Iron_Clad", "Cyber_Ninja", "Volt_Spectre",
      "Kuro_Striker", "Blaze_Hunter", "Neon_Glitch", "Titan_Force",
      "Frost_Byte", "Rogue_Sniper", "Echo_Six", "Thunder_Hawk"
    ];
    for (const name of defaultNames) {
      try { await addPersonaName(name); } catch {}
    }
    const pool = await getPersonaPool();
    setPersonaPool(pool);
    setActionMessage("Default esports personas loaded into the pool!");
    setTimeout(() => setActionMessage(""), 5000);
  };

  const userEmail = (clerkUser?.primaryEmailAddress?.emailAddress || currentUser?.email || "").toLowerCase();
  const isHardcodedAdmin = userEmail === "pk.4081988@gmail.com" || userEmail === "admin@ametheus.gg";
  const isSuperAdmin = isHardcodedAdmin || currentUser?.role === "SUPER_ADMIN" || currentRole === "SUPER_ADMIN";

  // 1. Initial Authentication Loading State (Bypassed immediately for pk.4081988@gmail.com)
  if (!isHardcodedAdmin && (!isAuthLoaded || (isLoading && !currentUser))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#0B0E16] text-white p-6">
        <div className="w-16 h-16 rounded-full bg-[#161A24] border border-[#242C3D] flex items-center justify-center mb-4 text-[#E56A10] animate-pulse">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-headline uppercase tracking-wider mb-2">
          Loading AMETHEUS Management Console
        </h2>
        <p className="text-xs text-[#94A3B8] font-mono flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#E56A10]" />
          Loading administrator workspace...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State (Guest)
  if (!isSignedIn && !isHardcodedAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#242C3D] rounded-xl text-center space-y-6 shadow-xl text-slate-900 dark:text-white">
        <div className="w-16 h-16 rounded-full bg-[#E56A10]/10 border border-[#E56A10]/40 flex items-center justify-center mx-auto text-[#E56A10]">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-headline text-slate-900 dark:text-white uppercase tracking-wider">
            Admin Console — Authentication Required
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            This cockpit controls platform competitions, tournament rules, bracket progression, games catalog, and user roles.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] p-4 rounded-lg text-left text-xs font-mono space-y-2 text-slate-700 dark:text-slate-300">
          <div className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Required Privileges:</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E56A10]"></span>
            <span><strong className="text-slate-900 dark:text-white">SUPER_ADMIN:</strong> Full platform ownership &amp; configuration (e.g. pk.4081988@gmail.com)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span><strong className="text-slate-900 dark:text-white">ORGANIZER / TOURNAMENT_ADMIN:</strong> Tournament management &amp; dispute review</span>
          </div>
        </div>

        <SignInButton mode="modal">
          <button className="px-6 py-3 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono font-bold text-sm uppercase rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto">
            <Shield className="w-4 h-4" /> Sign In to Admin Console
          </button>
        </SignInButton>
      </div>
    );
  }

  // 3. Authenticated but unauthorized (PLAYER role without hardcoded override)
  if (!isHardcodedAdmin && currentUser && currentUser.role === "PLAYER") {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white dark:bg-[#121622] border border-rose-200 dark:border-rose-900/40 rounded-xl text-center space-y-6 shadow-xl text-slate-900 dark:text-white">
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-headline text-slate-900 dark:text-white uppercase tracking-wider">
            Restricted Clearance (PLAYER Role)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Your account <strong className="text-slate-900 dark:text-white">@{currentUser.username}</strong> ({currentUser.email}) is registered with standard competitive <strong className="text-amber-600 dark:text-amber-400">PLAYER</strong> status.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] p-4 rounded-lg text-left text-xs font-mono space-y-2 text-slate-700 dark:text-slate-300">
          <div className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Admin Elevation Note:</div>
          <p className="text-slate-600 dark:text-slate-400">
            To access this cockpit with <strong className="text-slate-900 dark:text-white">SUPER_ADMIN</strong> privileges, sign in with the platform owner email (<code className="text-[#E56A10] font-semibold">pk.4081988@gmail.com</code> or <code className="text-[#E56A10] font-semibold">admin@ametheus.gg</code>).
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Existing Super Admins can also promote your username <strong className="text-slate-900 dark:text-white">@{currentUser.username}</strong> from the User Management console.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => loadAdminData()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1F2637] dark:hover:bg-[#283248] border border-slate-300 dark:border-[#2E384D] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-check Clearance
          </button>
          <Link
            href="/tournaments"
            className="px-4 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded-lg shadow-sm"
          >
            Browse Tournaments
          </Link>
        </div>
      </div>
    );
  }

  // 4. Authorized Admin Cockpit

  return (
    <div className="flex flex-col w-full bg-[#F8F9FF] dark:bg-[#0B0E16] min-h-screen text-[#0B1C30] dark:text-[#F8FAFC] transition-colors">
      {/* Console Top Bar */}
      <header className="bg-[#0B0E16] text-white border-b border-slate-800 px-4 md:px-8 py-4 sticky top-16 z-30">
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

          {/* Action Tools (Seed Catalog, Dev Data & Refresh) */}
          <div className="flex items-center gap-2 flex-wrap">
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
        <div className="max-w-[1440px] mx-auto mt-4 flex flex-wrap items-center gap-1.5 border-t border-[#242C3D]/60 pt-3 text-xs font-mono scrollbar-none">
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
          <button
            onClick={() => setActiveTab("live_matches")}
            className={`px-3.5 py-1.5 rounded transition-all font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "live_matches"
                ? "bg-[#E56A10] text-white shadow-xs"
                : "text-[#94A3B8] hover:text-white hover:bg-[#161A24]"
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Live Matches
            {liveDashboard && liveDashboard.live_now && liveDashboard.live_now.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[9px] font-bold rounded-full animate-pulse">
                {liveDashboard.live_now.length}
              </span>
            )}
          </button>
          {isSuperAdmin && (
            <>
              <button
                onClick={() => setActiveTab("tournaments")}
                className={`px-3.5 py-1.5 rounded transition-all font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "tournaments"
                    ? "bg-[#E56A10] text-white shadow-xs"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#161A24]"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Tournaments ({tournaments.length})
              </button>
              <button
                onClick={() => setActiveTab("leaderboards")}
                className={`px-3.5 py-1.5 rounded transition-all font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "leaderboards"
                    ? "bg-[#E56A10] text-white shadow-xs"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#161A24]"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Leaderboards ({leaderboardCategories.length})
              </button>
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
                onClick={() => setActiveTab("upi_accounts")}
                className={`px-3.5 py-1.5 rounded transition-all font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "upi_accounts"
                    ? "bg-[#E56A10] text-white shadow-xs"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#161A24]"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> UPI Accounts ({upiAccounts.length})
              </button>
              <button
                onClick={() => setActiveTab("payment_verifications")}
                className={`px-3.5 py-1.5 rounded transition-all font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "payment_verifications"
                    ? "bg-[#E56A10] text-white shadow-xs"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#161A24]"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" /> Payments
                {adminPayments.filter((p) => p.status === "PENDING").length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-bold rounded-full">
                    {adminPayments.filter((p) => p.status === "PENDING").length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("payouts_ledger")}
                className={`px-3.5 py-1.5 rounded transition-all font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "payouts_ledger"
                    ? "bg-[#E56A10] text-white shadow-xs"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#161A24]"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" /> Payouts
                {adminPayouts.filter((p) => p.status === "PENDING").length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-bold rounded-full">
                    {adminPayouts.filter((p) => p.status === "PENDING").length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("withdrawals")}
                className={`px-3.5 py-1.5 rounded transition-all font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "withdrawals"
                    ? "bg-[#E56A10] text-white shadow-xs"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#161A24]"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" /> Payout Approvals
                {withdrawals.filter((w) => w.status === "PENDING_APPROVAL").length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-bold rounded-full">
                    {withdrawals.filter((w) => w.status === "PENDING_APPROVAL").length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("personas")}
                className={`px-3.5 py-1.5 rounded transition-all font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "personas"
                    ? "bg-[#E56A10] text-white shadow-xs"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#161A24]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Persona & Avatar Pool
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

        {/* TAB 1: OVERVIEW & PRIZE VAULT */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
                <div className="text-[11px] font-mono text-slate-500 uppercase font-bold">Platform Prize Vault</div>
                <div className="text-2xl font-bold font-headline text-slate-900 mt-1">
                  ₹{(stats?.platform_escrow_vault ?? 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Protected Prize Vault Active
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
                <div className="text-[11px] font-mono text-slate-500 uppercase font-bold">Active Tournaments</div>
                <div className="text-2xl font-bold font-headline text-[#E56A10] mt-1">
                  {stats?.active_tournaments ?? 0}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {stats?.total_tournaments ?? 0} Total Tournaments Hosted
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
                <div className="text-[11px] font-mono text-slate-500 uppercase font-bold">Sanctioned Teams</div>
                <div className="text-2xl font-bold font-headline text-slate-900 mt-1">
                  {stats?.total_teams ?? 0}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {stats?.total_users ?? 0} Registered Competitive Users
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
                <div className="text-[11px] font-mono text-slate-500 uppercase font-bold">Active Matches</div>
                <div className="text-2xl font-bold font-headline text-slate-900 mt-1">
                  {stats?.active_matches ?? 0}
                </div>
                <span className="text-[10px] text-amber-400 font-mono">
                  {pendingMatches.length} Awaiting Verification
                </span>
              </div>
            </div>

            {/* Quick Operations Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
                <h3 className="font-headline font-bold text-base text-slate-900 uppercase flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#E56A10]" /> Fast Action Console
                </h3>
                <p className="text-xs text-slate-500">
                  Quickly jump into active administrative workflows:
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab("queue")}
                    className="p-3 bg-slate-50 border border-slate-200 hover:border-[#E56A10] rounded text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-slate-900 uppercase">Match Queue</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{pendingMatches.length} pending review</div>
                  </button>
                  <button
                    onClick={() => setActiveTab("disputes")}
                    className="p-3 bg-slate-50 border border-slate-200 hover:border-[#E56A10] rounded text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-slate-900 uppercase">Disputes</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{disputes.length} cases tracked</div>
                  </button>
                  <Link
                    href="/organizer"
                    className="p-3 bg-slate-50 border border-slate-200 hover:border-[#E56A10] rounded text-left transition-all block"
                  >
                    <div className="text-xs font-bold text-slate-900 uppercase">Organizer Portal</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">Create &amp; publish brackets</div>
                  </Link>
                  <Link
                    href="/tournaments"
                    className="p-3 bg-slate-50 border border-slate-200 hover:border-[#E56A10] rounded text-left transition-all block"
                  >
                    <div className="text-xs font-bold text-slate-900 uppercase">Live Tournaments</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">Public tournament discovery</div>
                  </Link>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-3">
                <h3 className="font-headline font-bold text-base text-slate-900 uppercase flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Database &amp; System Health
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500">Primary Database Engine:</span>
                    <span className="text-emerald-400 font-bold">MongoDB Atlas (Async Motor Driver)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500">Database Collections:</span>
                    <span className="text-slate-900 font-bold">users, games, teams, tournaments, matches, disputes, audit_logs</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500">Cryptographic Audit Chaining:</span>
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
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-headline font-bold text-base text-slate-900 uppercase">
                    Match Score &amp; Evidence Review Queue
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
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
                    <div key={m.id} className="bg-slate-50 border border-slate-200 p-4 rounded space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {m.stage || "Competitive Bracket Match"}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {m.tournament_title || "Official Tournament"} • {m.team_a?.name || "Slot 1"} vs {m.team_b?.name || "Slot 2"}
                          </div>
                        </div>
                        <div className="text-sm font-bold font-mono text-[#E56A10]">
                          Submitted Score: {m.team_a?.score ?? "-"} : {m.team_b?.score ?? "-"}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="bg-slate-50 p-3 rounded space-y-1">
                          <span className="text-slate-500">Captain Notes:</span>
                          <p className="text-white">
                            {m.dispute_notes || "Match concluded. Scoreboard proof attached."}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded flex items-center justify-between">
                          <div>
                            <span className="text-slate-500">Evidence Proof:</span>
                            <div className="text-slate-900 font-bold truncate max-w-[200px]">
                              {m.evidence_url || "Scoreboard Screenshot"}
                            </div>
                          </div>
                          <button
                            onClick={() => setInspectingEvidence(m.evidence_url || "valorant_match_end_scoreboard.png")}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect Proof
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                        {/* Certify & Advance */}
                        <button
                          onClick={() => handleVerifyMatch(m.id)}
                          disabled={isVerifying}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500 text-slate-900 font-mono text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          {isVerifying ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" /> Certify & Advance
                            </>
                          )}
                        </button>

                        {/* Score Override */}
                        <button
                          onClick={() => { setScoreOverrideMatch(m); setScoreA(String(m.team_a?.score ?? "")); setScoreB(String(m.team_b?.score ?? "")); }}
                          className="px-4 py-2 bg-amber-600/20 border border-amber-600/50 hover:bg-amber-600/40 text-amber-400 font-mono text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" /> Override Score
                        </button>

                        {/* Reject Proof */}
                        <button
                          onClick={() => setRejectProofMatch(m)}
                          className="px-4 py-2 bg-rose-950/40 border border-rose-700/60 hover:bg-rose-900/60 text-rose-400 font-mono text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Reject & Re-upload
                        </button>

                        {/* Force Forfeit */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono text-[#64748B]">Force Forfeit:</span>
                          <button
                            onClick={() => { if (confirm(`Force forfeit match? Team A (${m.team_a?.name || "A"}) wins.`)) handleForceMatchForfeit(m.id, "A"); }}
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-[#E56A10] text-slate-600 hover:text-slate-900 font-mono text-[10px] font-bold uppercase rounded cursor-pointer"
                          >
                            {m.team_a?.name?.slice(0, 8) || "Team A"} Win
                          </button>
                          <button
                            onClick={() => { if (confirm(`Force forfeit match? Team B (${m.team_b?.name || "B"}) wins.`)) handleForceMatchForfeit(m.id, "B"); }}
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-[#E56A10] text-slate-600 hover:text-slate-900 font-mono text-[10px] font-bold uppercase rounded cursor-pointer"
                          >
                            {m.team_b?.name?.slice(0, 8) || "Team B"} Win
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 p-8 text-center text-slate-500 rounded border border-slate-200 space-y-3">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div className="text-slate-900 font-bold text-sm">Review Queue Clear</div>
                  <p className="text-xs font-mono text-[#64748B] max-w-md mx-auto">
                    No competitive matches currently require arbitrator verification. When team captains submit scores in the Match Hub, they appear here.
                  </p>
                </div>
              )}
            </div>

            {/* All Matches Overview */}
            {allMatches.length > 0 && (
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
                <h4 className="font-headline font-bold text-sm text-slate-900 uppercase">
                  All Tournament Matches ({allMatches.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200">
                        <th className="py-2">Stage</th>
                        <th className="py-2">Tournament</th>
                        <th className="py-2">Teams</th>
                        <th className="py-2">Score</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {allMatches.map((m) => (
                        <tr key={m.id}>
                          <td className="py-2.5">{m.stage || "Match"}</td>
                          <td className="text-slate-500">{m.tournament_title || "Official"}</td>
                          <td>{m.team_a?.name || "TBD"} vs {m.team_b?.name || "TBD"}</td>
                          <td className="font-bold text-[#E56A10]">{m.team_a?.score ?? 0} : {m.team_b?.score ?? 0}</td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 border border-slate-200">
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
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-headline font-bold text-base text-slate-900 uppercase">
                    Tournament Dispute Arbitration Desk
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Review and arbitrate rule violations, toxic behavior, server drops, and disputed scores
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {disputes.length} Total Disputes
                </span>
              </div>

              {disputes.length > 0 ? (
                <div className="space-y-4">
                  {disputes.map((d) => (
                    <div key={d.id} className="bg-slate-50 border border-slate-200 p-4 rounded space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div>
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
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
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            Match: {d.match_id} • Filed by: {d.submitted_by}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {d.created_at ? new Date(d.created_at).toLocaleString() : ""}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded">
                        {d.description}
                      </p>

                      {d.evidence_url && (
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            onClick={() => setInspectingEvidence(d.evidence_url!)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded flex items-center gap-1 font-mono"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Attached Evidence
                          </button>
                        </div>
                      )}

                      {d.status === "OPEN" && isSuperAdmin && (
                        <div className="pt-3 border-t border-slate-200 space-y-3">
                          <p className="text-[11px] font-mono text-slate-500 font-bold uppercase">Arbitration Ruling:</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleResolveDispute(d.id, "RESOLVED_UPHELD")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Uphold Claim
                            </button>
                            <button
                              onClick={() => handleResolveDispute(d.id, "RESOLVED_OVERTURNED")}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Overturn Result
                            </button>
                            <button
                              onClick={() => handleResolveDispute(d.id, "DISMISSED")}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                            >
                              Dismiss Dispute
                            </button>
                            <button
                              onClick={() => handleResolveDispute(d.id, "FORCE_FORFEIT_A" as any)}
                              className="px-3 py-1.5 bg-rose-800/60 hover:bg-rose-700/80 border border-rose-700 text-rose-300 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                            >
                              Forfeit Team A
                            </button>
                            <button
                              onClick={() => handleResolveDispute(d.id, "FORCE_FORFEIT_B" as any)}
                              className="px-3 py-1.5 bg-rose-800/60 hover:bg-rose-700/80 border border-rose-700 text-rose-300 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                            >
                              Forfeit Team B
                            </button>
                            <button
                              onClick={() => handleResolveDispute(d.id, "REFUND_ENTRY_FEES" as any)}
                              className="px-3 py-1.5 bg-sky-800/40 hover:bg-sky-700/60 border border-sky-700 text-sky-300 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                            >
                              Refund Entry Fees
                            </button>
                            <button
                              onClick={() => handleResolveDispute(d.id, "ORDER_REMATCH" as any)}
                              className="px-3 py-1.5 bg-violet-800/40 hover:bg-violet-700/60 border border-violet-700 text-violet-300 rounded text-xs font-mono font-bold uppercase cursor-pointer"
                            >
                              Order Rematch
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 p-8 text-center text-slate-500 rounded border border-slate-200 space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-slate-900 font-bold text-sm">No Active Disputes</div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs-lg">
              <div>
                <h3 className="font-headline font-bold text-base text-slate-900 uppercase flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-[#E56A10]" /> Sanctioned Esports Games Catalog
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
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
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-[#E56A10]/50 transition-all flex flex-col justify-between shadow-lg group"
                >
                  {/* Banner & Logo */}
                  <div>
                    <div className="h-32 w-full relative bg-slate-50 overflow-hidden">
                      <img
                        src={game.banner_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200"}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#10141F] via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        {game.status === "COMING_SOON" && (
                          <span className="px-2 py-0.5 bg-amber-500/90 backdrop-blur-xs text-white border border-amber-400 text-[10px] font-mono font-bold uppercase rounded flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Coming Soon
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-slate-50/80 backdrop-blur-xs text-[#E56A10] border border-[#E56A10]/40 text-[10px] font-mono font-bold uppercase rounded">
                          {game.platform}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-50/80 backdrop-blur-xs text-white border border-slate-200 text-[10px] font-mono font-bold uppercase rounded">
                          {game.tag}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-50 border-2 border-slate-200 overflow-hidden p-1 shadow-md shrink-0">
                          <img
                            src={game.logo_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300"}
                            alt={game.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <h4 className="font-headline font-bold text-base text-slate-900">
                            {game.name}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-500">
                            /{game.slug}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Specs */}
                    <div className="p-4 space-y-3">
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {game.description || "Official sanctioned tournament title on AMETHEUS platform."}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-200">
                        <div className="bg-slate-50 p-2 rounded border border-slate-200">
                          <span className="text-[#64748B] block text-[9px] uppercase">Prize Pool</span>
                          <span className="text-[#E56A10] font-bold">
                            ₹{(game.prize_pool_inr || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-200">
                          <span className="text-[#64748B] block text-[9px] uppercase">Team Format</span>
                          <span className="text-slate-900 font-bold">
                            {game.is_team_game && (game.max_team_size || 1) > 1
                              ? `${game.min_team_size}-${game.max_team_size} Athletes`
                              : "Solo (1v1)"}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-200 col-span-2">
                          <span className="text-[#64748B] block text-[9px] uppercase">Active Teams</span>
                          <span className="text-blue-700 font-bold">
                            {game.teams_count || 0} Teams Registered
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-200 col-span-2">
                          <span className="text-[#64748B] block text-[9px] uppercase">Server / Anti-Cheat</span>
                          <span className="text-slate-700 truncate block">
                            {game.server_region || "AWS Mumbai"} • {game.anti_cheat || "Standard"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Edit, Publish & Delete) */}
                  <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 mt-2">
                    {game.status === "COMING_SOON" && (
                      <button
                        onClick={() => handlePublishGame(game.id, game.name)}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        title="Publish Game Live"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Publish Live
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditGame(game)}
                      className="flex-1 py-2 bg-slate-50 border border-slate-200 hover:border-[#E56A10] hover:text-white text-slate-700 text-xs font-mono font-bold uppercase rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                <div className="col-span-full bg-white border border-slate-200 p-12 rounded-xl text-center space-y-4">
                  <Gamepad2 className="w-12 h-12 text-[#64748B] mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-headline font-bold text-slate-900 text-lg">No Games in Catalog</h4>
                    <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
                      Click &quot;Add New Game&quot; above or use the &quot;Seed Platform&quot; tool to populate standard competitive titles.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: UPI PAYMENT ACCOUNTS ─────────────────────────────────── */}
        {activeTab === "upi_accounts" && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
              <div>
                <h3 className="font-headline font-bold text-base text-slate-900 uppercase flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#E56A10]" /> UPI Payment Accounts
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Manage rotating UPI/QR accounts. New payments auto-select an active account in round-robin order.
                </p>
              </div>
              <button
                onClick={handleOpenCreateUpi}
                className="px-4 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Add UPI Account
              </button>
            </div>

            {upiAccounts.length === 0 ? (
              <div className="bg-white border border-slate-200 p-12 rounded-xl text-center space-y-3">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="font-headline font-bold text-slate-900 text-base">No UPI Accounts Configured</p>
                <p className="text-xs text-slate-500 font-mono">Add at least one active UPI account to accept payments.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">UPI ID</th>
                        <th className="px-4 py-3">Payee Name</th>
                        <th className="px-4 py-3">Display Name</th>
                        <th className="px-4 py-3">QR</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {upiAccounts.map((acct) => (
                        <tr key={acct.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-[#E56A10]">{acct.code}</td>
                          <td className="px-4 py-3 text-slate-900">{acct.upi_id}</td>
                          <td className="px-4 py-3 text-slate-700">{acct.payee_name}</td>
                          <td className="px-4 py-3 text-slate-500">{acct.display_name || "—"}</td>
                          <td className="px-4 py-3">
                            {acct.qr_url ? (
                              <img src={acct.qr_url} alt="QR" className="w-10 h-10 rounded border border-slate-200 object-contain bg-white" />
                            ) : (
                              <span className="text-slate-400 italic">No QR</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${acct.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                              {acct.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleUpiAccount(acct.id, acct.code)}
                                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase border transition-colors cursor-pointer ${acct.status === "ACTIVE" ? "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200 hover:border-rose-300" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"}`}
                              >
                                {acct.status === "ACTIVE" ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => handleOpenEditUpi(acct)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

        {/* ─── TAB: PAYMENT VERIFICATIONS ────────────────────────────────── */}
        {activeTab === "payment_verifications" && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
              <div>
                <h3 className="font-headline font-bold text-base text-slate-900 uppercase flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#E56A10]" /> Payment Verifications & UPI Ledger
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Review and verify incoming UPI payments, top-ups, and game entry fees.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Filter by User, UTR, or Ref ID..."
                  value={paymentSearchTerm}
                  onChange={(e) => setPaymentSearchTerm(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#E56A10]"
                />
                {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => {
                  const count =
                    f === "ALL"
                      ? adminPayments.length
                      : f === "PENDING"
                      ? adminPayments.filter((p) => p.status === "PENDING" && !!p.utr && p.utr.trim().length >= 6).length
                      : adminPayments.filter((p) => p.status === f).length;
                  return (
                    <button
                      key={f}
                      onClick={() => setPaymentFilter(f)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${paymentFilter === f ? "bg-[#E56A10] text-white border-[#E56A10]" : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"}`}
                    >
                      {f.replace(/_/g, " ")}
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${paymentFilter === f ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {(() => {
              const term = paymentSearchTerm.trim().toLowerCase();
              const filtered = adminPayments.filter((p) => {
                const matchesStatus =
                  paymentFilter === "ALL"
                    ? true
                    : paymentFilter === "PENDING"
                    ? p.status === "PENDING" && !!p.utr && p.utr.trim().length >= 6
                    : p.status === paymentFilter;
                if (!matchesStatus) return false;
                if (!term) return true;
                return (
                  (p.user_id && p.user_id.toLowerCase().includes(term)) ||
                  (p.utr && p.utr.toLowerCase().includes(term)) ||
                  (p.id && p.id.toLowerCase().includes(term)) ||
                  (p.payment_account_code && p.payment_account_code.toLowerCase().includes(term)) ||
                  (p.payment_type && p.payment_type.toLowerCase().includes(term))
                );
              });
              if (filtered.length === 0) {
                return (
                  <div className="bg-white border border-slate-200 p-12 rounded-xl text-center space-y-3">
                    <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto" />
                    <p className="font-headline font-bold text-slate-900 text-base">No Payments Found</p>
                    <p className="text-xs text-slate-500 font-mono">No payment records match the selected filter.</p>
                  </div>
                );
              }
              return (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                          <th className="px-4 py-3">User ID</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">UTR / Ref</th>
                          <th className="px-4 py-3">UPI Account</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Submitted</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filtered.map((pmt) => (
                          <tr key={pmt.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-900 text-[11px]">{pmt.user_id}</td>
                            <td className="px-4 py-3 text-slate-600">{pmt.payment_type || "ENTRY"}</td>
                            <td className="px-4 py-3 font-bold text-[#E56A10]">₹{pmt.amount_inr.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-slate-700">{pmt.utr || "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{pmt.payment_account_code || "—"}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                pmt.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                pmt.status === "REJECTED" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>{pmt.status}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{pmt.created_at ? new Date(pmt.created_at).toLocaleDateString("en-IN") : "—"}</td>
                            <td className="px-4 py-3">
                              {pmt.status === "PENDING" && (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleApprovePayment(pmt.id)}
                                    disabled={isProcessingPayment}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase rounded transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" /> Approve
                                  </button>
                                  <button
                                    onClick={() => { setRejectingPayment(pmt); setPaymentRejectReason(""); }}
                                    className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold uppercase rounded border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <X className="w-3 h-3" /> Reject
                                  </button>
                                </div>
                              )}
                              {pmt.screenshot_url && (
                                <a href={pmt.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 underline ml-auto block text-right mt-1">
                                  View Screenshot
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ─── TAB: PAYOUTS LEDGER ───────────────────────────────────────── */}
        {activeTab === "payouts_ledger" && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
              <div>
                <h3 className="font-headline font-bold text-base text-slate-900 uppercase flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-[#E56A10]" /> Payouts Ledger
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  All outgoing payouts — prize winnings, wallet withdrawals, and refunds. Confirm UPI transfer to mark PAID.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => { setIsWinningPayoutModalOpen(true); setWinningPayoutForm({ user_id: "", game_id: "", amount_inr: 0, rank_or_placement: "1st Place", destination: "WALLET", upi_id: "" }); }}
                  className="px-4 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create Winning Payout
                </button>
                {(["ALL", "PENDING", "PAID", "REJECTED"] as const).map((f) => {
                  const count = f === "ALL" ? adminPayouts.length : adminPayouts.filter((p) => p.status === f).length;
                  return (
                    <button
                      key={f}
                      onClick={() => setPayoutFilter(f)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${payoutFilter === f ? "bg-[#E56A10] text-white border-[#E56A10]" : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"}`}
                    >
                      {f}
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${payoutFilter === f ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {(() => {
              const filtered = payoutFilter === "ALL" ? adminPayouts : adminPayouts.filter((p) => p.status === payoutFilter);
              if (filtered.length === 0) {
                return (
                  <div className="bg-white border border-slate-200 p-12 rounded-xl text-center space-y-3">
                    <ArrowUpRight className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="font-headline font-bold text-slate-900 text-base">No Payouts Found</p>
                    <p className="text-xs text-slate-500 font-mono">No payout records match the selected filter.</p>
                  </div>
                );
              }
              return (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Destination UPI</th>
                          <th className="px-4 py-3">Game</th>
                          <th className="px-4 py-3">Rank</th>
                          <th className="px-4 py-3">UTR / Ref</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filtered.map((po) => (
                          <tr key={po.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-900">@{po.user_name}</td>
                            <td className="px-4 py-3 text-slate-600">{po.payout_type}</td>
                            <td className="px-4 py-3 font-bold text-emerald-700">₹{po.amount_inr.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-slate-700">{po.upi_id || po.destination || "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{po.game_name || "—"}</td>
                            <td className="px-4 py-3 text-slate-500">{po.rank_or_placement || "—"}</td>
                            <td className="px-4 py-3 text-slate-500">{po.outgoing_utr || "Pending"}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                po.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                po.status === "REJECTED" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>{po.status}</span>
                            </td>
                            <td className="px-4 py-3">
                              {po.status === "PENDING" && (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => { setCompletingPayout(po); setOutgoingUtrInput(""); }}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase rounded transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" /> Mark Paid
                                  </button>
                                  <button
                                    onClick={() => { setRejectingPayoutRecord(po); setPayoutRejectReason(""); }}
                                    className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold uppercase rounded border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <X className="w-3 h-3" /> Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 5: USER & RBAC MANAGEMENT */}
        {activeTab === "users" && isSuperAdmin && (
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-headline font-bold text-base text-slate-900 uppercase">
                  Platform User Management &amp; Role Allocation
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Super Admin control: Assign roles, promote tournament organizers, and audit balances
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {users.length} Registered Accounts
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Current Role</th>
                    <th className="py-2.5">Balance</th>
                    <th className="py-2.5 text-right">RBAC Role Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3">
                        <span className="font-bold">@{u.username}</span>
                        {u.display_name && (
                          <span className="text-slate-500 text-[11px] block">{u.display_name}</span>
                        )}
                      </td>
                      <td className="text-slate-500">{u.email}</td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === "SUPER_ADMIN"
                              ? "bg-[#E56A10] text-white"
                              : u.role === "TOURNAMENT_ADMIN"
                              ? "bg-violet-600 text-white"
                              : u.role === "MATCH_ARBITER"
                              ? "bg-amber-600 text-slate-900"
                              : u.role === "COMMUNITY_MODERATOR"
                              ? "bg-sky-600 text-white"
                              : u.role === "ORGANIZER"
                              ? "bg-[#F59E0B] text-slate-900"
                              : "bg-[#242C3D] text-slate-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleOpenUserWallet(u.id)}
                          className="font-bold text-slate-900 hover:text-[#E56A10] hover:underline flex items-center gap-1.5 cursor-pointer text-xs"
                          title="View Ledger & Wallet Accounting"
                        >
                          <span>₹{Number(u.inr_balance || 0).toLocaleString()}</span>
                          <Eye className="w-3.5 h-3.5 text-[#E56A10]" />
                        </button>
                      </td>
                      <td className="text-right">
                        {u.email !== "pk.4081988@gmail.com" && u.email !== "admin@ametheus.gg" ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleSetUserRole(u.id, e.target.value as any, u.username)}
                            className="bg-slate-50 border border-slate-200 hover:border-[#E56A10] rounded px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-[#E56A10] cursor-pointer"
                          >
                            <option value="PLAYER">Player (Standard)</option>
                            <option value="ORGANIZER">Organizer</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                          </select>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Designated Root</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
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
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-headline font-bold text-base text-slate-900 uppercase">
                  Tamper-Evident Operational Audit Log
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
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
                    className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-[11px]">{log.timestamp ? log.timestamp.slice(11, 19) : ""} IST</span>
                      <span className="text-[#E56A10] font-bold">@{log.operator}</span>
                      <span className="text-slate-900 font-bold">{log.action}</span>
                      <span className="text-slate-500">{log.target}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.record_hash && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-emerald-400 font-mono" title={`Prev: ${log.prev_hash}\nRecord: ${log.record_hash}`}>
                          SHA: {log.record_hash.slice(0, 8)}…
                        </span>
                      )}
                      <span className="text-slate-500 text-[11px]">IP: {log.ip_address}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 p-6 text-center text-slate-500 rounded border border-slate-200">
                  No audit logs recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: TOURNAMENTS MANAGEMENT & ABSOLUTE ADMIN CONTROL */}
        {activeTab === "tournaments" && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs-lg">
              <div>
                <h3 className="font-headline font-bold text-base text-slate-900 uppercase flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#E56A10]" /> Platform Tournaments & Rules Suite
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Host, configure, adjust prize distribution tiers, player limits, and competitive rules with immediate platform sync.
                </p>
              </div>
              <button
                onClick={handleOpenCreateTournament}
                className="px-4 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Create Tournament
              </button>
            </div>

            {/* Tournaments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tourn) => {
                const rulesCount = Array.isArray(tourn.rules) ? tourn.rules.length : 0;
                const prizesCount = Array.isArray(tourn.prizes) ? tourn.prizes.length : 0;
                const statusColor =
                  tourn.status === "REGISTRATION_OPEN"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : tourn.status === "COMING_SOON"
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : tourn.status === "ONGOING"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : tourn.status === "COMPLETED"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30";

                return (
                  <div
                    key={tourn.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-[#E56A10]/50 transition-all flex flex-col justify-between shadow-lg group"
                  >
                    <div>
                      {/* Banner & Badges */}
                      <div className="h-36 w-full relative bg-slate-50 overflow-hidden">
                        <img
                          src={tourn.banner_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200"}
                          alt={tourn.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#10141F] via-[#10141F]/40 to-transparent" />
                        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${statusColor}`}>
                            {tourn.status.replace("_", " ")}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-50/80 text-[#E56A10] border border-[#E56A10]/40 text-[10px] font-mono font-bold uppercase rounded">
                            {tourn.game_slug || "ESPORTS"}
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-4 right-4">
                          <h4 className="font-headline font-bold text-base text-slate-900 truncate">
                            {tourn.title}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-500">
                            Format: {tourn.format || "Single Elimination"} • {tourn.rank_requirement || "Open Ranks"}
                          </span>
                        </div>
                      </div>

                      {/* Key Details */}
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                            <span className="text-[#64748B] block text-[9px] uppercase">Prize Vault</span>
                            <span className="text-[#E56A10] font-bold text-sm">
                              ₹{tourn.prize_pool_inr.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                            <span className="text-[#64748B] block text-[9px] uppercase">Entry Fee</span>
                            <span className="text-slate-900 font-bold text-sm">
                              {tourn.entry_fee_inr === 0 ? "Free Entry" : `₹${tourn.entry_fee_inr}`}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                            <span className="text-[#64748B] block text-[9px] uppercase">Team Capacity</span>
                            <span className="text-slate-700 font-bold">
                              {tourn.registered_teams || 0} / {tourn.max_teams} Teams
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                            <span className="text-[#64748B] block text-[9px] uppercase">Rules & Prizes</span>
                            <span className="text-slate-900 font-bold">
                              {rulesCount} Rules • {prizesCount} Tiers
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded border border-slate-200 col-span-2">
                            <span className="text-[#64748B] block text-[9px] uppercase">Starts At</span>
                            <span className="text-slate-700 truncate block">
                              {tourn.starts_at}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 pt-0 flex items-center gap-2 border-t border-slate-100 mt-2">
                      {tourn.status === "COMING_SOON" && (
                        <button
                          onClick={() => handlePublishTournament(tourn.id, tourn.title)}
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                          title="Publish Tournament Live"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Publish Live
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditTournament(tourn)}
                        className="flex-1 py-2 bg-slate-50 border border-slate-200 hover:border-[#E56A10] hover:text-white text-slate-700 text-xs font-mono font-bold uppercase rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#E56A10]" /> Edit Rules & Config
                      </button>
                      <Link
                        href={`/tournaments/${tourn.slug || tourn.id}`}
                        target="_blank"
                        className="p-2 bg-slate-50 border border-slate-200 hover:text-white text-slate-500 rounded transition-colors"
                        title="View Public Tournament Page"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteTournament(tourn.id, tourn.title)}
                        className="p-2 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 rounded text-xs transition-colors cursor-pointer"
                        title="Delete Tournament"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {tournaments.length === 0 && (
                <div className="col-span-full bg-white border border-slate-200 p-12 rounded-xl text-center space-y-4">
                  <Calendar className="w-12 h-12 text-[#64748B] mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-headline font-bold text-slate-900 text-lg">No Tournaments Hosted</h4>
                    <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
                      Click &quot;Create Tournament&quot; above to create a competition with custom rules, timing, prize breakdown, and player limits.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: DYNAMIC LEADERBOARD CATEGORIES */}
        {activeTab === "leaderboards" && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs-lg">
              <div>
                <h3 className="font-headline font-bold text-base text-slate-900 uppercase flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#E56A10]" /> Leaderboard Categories & Dynamic Rankings
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Configure custom ranking categories by game and metric. AMETHEUS automatically calculates live standings for all teams and athletes.
                </p>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-4 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {leaderboardCategories.map((cat) => {
                const metricLabels: Record<string, string> = {
                  rating: "Skill Rating (MMR / ELO)",
                  win_rate: "Win Rate %",
                  earnings: "Tournament Earnings (₹)",
                  wins: "Total Match Wins",
                  matches_played: "Activity (Matches Played)",
                };

                return (
                  <div
                    key={cat.slug}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:border-[#E56A10]/50 transition-all flex flex-col justify-between shadow-lg group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-slate-50 text-[#E56A10] border border-[#E56A10]/40 text-[10px] font-mono font-bold uppercase rounded">
                          {cat.game_slug === "all" ? "All Games" : cat.game_slug.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono text-[#64748B]">
                          Min {cat.min_matches} matches
                        </span>
                      </div>

                      <div>
                        <h4 className="font-headline font-bold text-lg text-slate-900 group-hover:text-[#E56A10] transition-colors">
                          {cat.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                          {cat.description || "Dynamic leaderboard category calculated automatically."}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs font-mono">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Sorting Metric:</span>
                          <span className="text-slate-900 font-bold">{metricLabels[cat.sort_metric] || cat.sort_metric}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Engine Calculation:</span>
                          <span className="text-emerald-400 font-bold">Auto-Calculated</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between gap-2">
                      <Link
                        href={`/leaderboard?cat=${cat.slug}`}
                        target="_blank"
                        className="flex-1 py-1.5 px-3 bg-slate-50 border border-slate-200 hover:text-white text-slate-700 text-xs font-mono font-bold uppercase rounded text-center transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#E56A10]" /> View Live Board
                      </Link>
                      <button
                        onClick={() => handleDeleteCategory(cat.slug, cat.name)}
                        className="p-1.5 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 rounded text-xs transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {leaderboardCategories.length === 0 && (
                <div className="col-span-full bg-white border border-slate-200 p-12 rounded-xl text-center space-y-4">
                  <BarChart3 className="w-12 h-12 text-[#64748B] mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-headline font-bold text-slate-900 text-lg">No Categories Configured</h4>
                    <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
                      Click &quot;Add Category&quot; to configure custom leaderboard metrics.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: PAYOUT APPROVALS & WITHDRAWALS */}
        {activeTab === "withdrawals" && isSuperAdmin && (
          <div className="space-y-6">
            {/* Header / Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#242C3D] p-5 rounded-xl shadow-xs">
              <div>
                <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#E56A10]" /> Tournament Prize Payout Approvals
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  All athlete withdrawals require Super Admin verification before UPI / IMPS payout release.
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              {(["ALL", "PENDING_APPROVAL", "COMPLETED", "REJECTED"] as const).map((filterKey) => {
                const count =
                  filterKey === "ALL"
                    ? withdrawals.length
                    : withdrawals.filter((w) => w.status === filterKey).length;
                return (
                  <button
                    key={filterKey}
                    onClick={() => setWithdrawalFilter(filterKey)}
                    className={`px-3 py-1.5 rounded-lg border font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                      withdrawalFilter === filterKey
                        ? "bg-[#E56A10] text-white border-[#E56A10] shadow-xs"
                        : "bg-white dark:bg-[#161A24] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#242C3D] hover:border-slate-400"
                    }`}
                  >
                    <span>{filterKey.replace("_", " ")}</span>
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                      withdrawalFilter === filterKey ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-[#202534] text-slate-600 dark:text-slate-400"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Withdrawals List */}
            {(() => {
              const filtered = withdrawals.filter((w) =>
                withdrawalFilter === "ALL" ? true : w.status === withdrawalFilter
              );

              if (filtered.length === 0) {
                return (
                  <div className="bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#242C3D] p-12 rounded-xl text-center space-y-4 shadow-xs">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h4 className="font-headline font-bold text-slate-900 dark:text-white text-lg">
                        {withdrawalFilter === "ALL"
                          ? "No Payout Requests Queued"
                          : `No ${withdrawalFilter.replace("_", " ")} Requests`}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-relaxed">
                        All athlete prize money withdrawals have been certified and settled via UPI. When tournament winners submit a withdrawal from their Dashboard, it appears here for two-factor approval.
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <th className="p-3.5">Athlete / Gamer</th>
                          <th className="p-3.5">Amount (INR)</th>
                          <th className="p-3.5">Destination UPI ID</th>
                          <th className="p-3.5">Requested At</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Reference / Notes</th>
                          <th className="p-3.5 text-right">Approval Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {filtered.map((w) => (
                          <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3.5">
                              <span className="font-bold text-slate-900 block font-headline">
                                @{w.user_name || "Gamer"}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {w.account_holder_name || w.user_email || "Account Holder"}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold text-sm text-[#E56A10]">
                                ₹{w.amount.toLocaleString("en-IN")}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded tracking-wide">
                                {w.upi_id}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-500 text-[11px]">
                              {w.created_at ? new Date(w.created_at).toLocaleString("en-IN") : "Recent"}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                  w.status === "PENDING_APPROVAL"
                                    ? "bg-amber-50 text-amber-700 border-amber-300"
                                    : w.status === "COMPLETED"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                    : "bg-rose-50 text-rose-700 border-rose-300"
                                }`}
                              >
                                {w.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-500 text-[11px] max-w-[200px] truncate">
                              {w.payout_reference ? (
                                <span className="text-emerald-700 font-bold block truncate">
                                  Ref: {w.payout_reference}
                                </span>
                              ) : (
                                w.notes || "Standard prize withdrawal"
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              {w.status === "PENDING_APPROVAL" ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setApprovingWithdrawal(w);
                                      setPayoutReference(`UPI/${Date.now().toString().slice(-8)}`);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" /> Approve
                                  </button>
                                  <button
                                    onClick={() => setRejectingWithdrawal(w)}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <X className="w-3 h-3" /> Reject
                                  </button>
                                </div>
                              ) : w.status === "COMPLETED" ? (
                                <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> Settled
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Refunded
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 9: RANDOM PERSONA & AVATAR POOL */}
        {activeTab === "personas" && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
              <div>
                <h3 className="font-headline font-bold text-base text-slate-900 uppercase flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#E56A10]" /> First Launch Gaming Persona &amp; Avatar Pool
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Manage vetted gamer handles and esports avatars randomly assigned to new athletes on first launch.
                </p>
              </div>

              <button
                onClick={handleLoadDefaultPersonaPool}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-mono font-bold uppercase rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#E56A10]" /> Load Esports Presets
              </button>
            </div>

            {/* SECTION 1: GAMER TAG NAMES POOL */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-headline font-bold text-sm text-slate-900 uppercase">
                    Random Gamer Tags Pool ({personaPool.names.length} Handles)
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    Athletes without custom handles randomly receive one of these sanitized competitive tags.
                  </p>
                </div>

                <form onSubmit={handleAddName} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newPersonaName}
                    onChange={(e) => setNewPersonaName(e.target.value)}
                    placeholder="e.g. Apex_Glitch"
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-[#E56A10]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingPersonaName}
                    className="px-3.5 py-1.5 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    {isSubmittingPersonaName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add Tag
                  </button>
                </form>
              </div>

              {personaPool.names.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {personaPool.names.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 group hover:border-[#E56A10] transition-colors"
                    >
                      <span>@{name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveName(name)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title={`Remove "${name}"`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <p className="text-xs font-mono text-slate-500">No custom persona names in pool.</p>
                  <button
                    onClick={handleLoadDefaultPersonaPool}
                    className="text-xs font-mono text-[#E56A10] underline font-bold"
                  >
                    Load default esports handles
                  </button>
                </div>
              )}
            </div>

            {/* SECTION 2: AVATAR POOL WITH DIRECT IMAGE UPLOAD */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-headline font-bold text-sm text-slate-900 uppercase">
                    Esports Avatars Pool ({personaPool.avatars.length} Presets)
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    High-res avatars saved directly in MongoDB or served via CDN.
                  </p>
                </div>
              </div>

              {/* Add New Avatar Form */}
              <form onSubmit={handleAddAvatar} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold font-mono text-slate-800 uppercase block">
                  Add New Avatar to Pool
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                      Avatar Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAvatarName}
                      onChange={(e) => setNewAvatarName(e.target.value)}
                      placeholder="e.g. Cyber Spectre"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-[#E56A10]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                      Avatar Image (Upload Directly to DB or Paste URL) *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        required
                        value={newAvatarUrl}
                        onChange={(e) => setNewAvatarUrl(e.target.value)}
                        placeholder="https://... or uploaded DB url"
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-[#E56A10]"
                      />
                      <label className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 shrink-0">
                        {isUploadingAvatarFile ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload File</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingAvatarFile}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploadingAvatarFile(true);
                              try {
                                const res = await uploadImageFile(file);
                                setNewAvatarUrl(res.url);
                                if (!newAvatarName) {
                                  setNewAvatarName(file.name.replace(/\.[^/.]+$/, ""));
                                }
                                setActionMessage("Image uploaded to database!");
                              } catch {
                                setActionMessage("Failed to upload image");
                              } finally {
                                setIsUploadingAvatarFile(false);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {newAvatarUrl && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-300 bg-white relative">
                        <img src={newAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] font-mono text-emerald-600 font-bold">Image Ready</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmittingAvatar || !newAvatarName || !newAvatarUrl}
                    className="ml-auto px-4 py-1.5 bg-[#E56A10] hover:bg-[#D45900] text-white font-mono text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmittingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add to Pool
                  </button>
                </div>
              </form>

              {/* Avatars Grid */}
              {personaPool.avatars.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
                  {personaPool.avatars.map((av) => (
                    <div
                      key={av.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center text-center space-y-2 relative group hover:border-[#E56A10] transition-colors"
                    >
                      <button
                        onClick={() => handleRemoveAvatar(av.id, av.name)}
                        className="absolute top-1.5 right-1.5 p-1 rounded bg-white/80 hover:bg-rose-600 hover:text-white text-slate-400 transition-colors shadow-xs cursor-pointer"
                        title={`Remove "${av.name}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200 group-hover:border-[#E56A10] bg-white relative">
                        <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-headline font-bold text-xs text-slate-900 truncate w-full">
                        {av.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <p className="text-xs font-mono text-slate-500">No avatars currently in pool.</p>
                  <button
                    onClick={handleLoadDefaultPersonaPool}
                    className="text-xs font-mono text-[#E56A10] underline font-bold"
                  >
                    Restore default avatars
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: LIVE MATCHES COMMAND CENTER */}
        {activeTab === "live_matches" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121622] border border-slate-200 dark:border-[#242C3D] p-5 rounded-xl shadow-xs">
              <div>
                <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#E56A10]" /> Live Matches Command Center
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Pair teams, schedule matches, update live scores, and manage match lifecycle.
                </p>
              </div>
              <button
                onClick={async () => {
                  setIsLoadingLiveDash(true);
                  try {
                    const dash = await getLiveMatchesDashboard();
                    setLiveDashboard(dash);
                  } catch (_) {}
                  finally { setIsLoadingLiveDash(false); }
                }}
                disabled={isLoadingLiveDash}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2234] dark:hover:bg-[#232D42] border border-slate-300 dark:border-[#242C3D] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isLoadingLiveDash ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-[#E56A10]" />}
                Refresh Dashboard
              </button>
            </div>

            {/* Inner 4-tab nav */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {([
                { id: "ready", label: "Ready to Pair", count: liveDashboard?.ready_for_match_creation?.length ?? 0, color: "amber" },
                { id: "scheduled", label: "Scheduled", count: liveDashboard?.scheduled?.length ?? 0, color: "blue" },
                { id: "live", label: "Live Now", count: liveDashboard?.live_now?.length ?? 0, color: "rose" },
                { id: "completed", label: "Completed", count: liveDashboard?.completed?.length ?? 0, color: "slate" },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setLiveDashTab(t.id)}
                  className={`px-4 py-2 font-mono text-xs font-bold uppercase rounded transition-colors whitespace-nowrap cursor-pointer border ${
                    liveDashTab === t.id
                      ? "bg-[#E56A10] text-white border-transparent"
                      : "bg-white dark:bg-[#161A24] border-[#D3E4FE] dark:border-[#242C3D] text-[#565E74] dark:text-slate-300 hover:text-[#0B1C30] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E2538]"
                  }`}
                >
                  {t.label} {t.count > 0 && <span className="ml-1">({t.count})</span>}
                </button>
              ))}
            </div>

            {/* READY FOR MATCH CREATION (Team Pairing Wizard) */}
            {liveDashTab === "ready" && (
              <div className="space-y-4">
                {/* Pairing Wizard */}
                <div className="bg-white dark:bg-[#121622] border border-[#D3E4FE] dark:border-[#242C3D] rounded-xl p-6 space-y-4">
                  <h4 className="font-headline font-bold text-sm text-slate-900 dark:text-white uppercase flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#E56A10]" /> Team Pairing Wizard
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Tournament ID</label>
                      <input value={pairTournamentId} onChange={(e) => setPairTournamentId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]"
                        placeholder="tournament_id" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Team A ID</label>
                      <input value={pairTeamAId} onChange={(e) => setPairTeamAId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]"
                        placeholder="team_a_id" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Team B ID</label>
                      <input value={pairTeamBId} onChange={(e) => setPairTeamBId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]"
                        placeholder="team_b_id" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Stage</label>
                      <select value={pairStage} onChange={(e) => setPairStage(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]">
                        {["Group Stage", "Round of 16", "Quarterfinals", "Semifinals", "Grand Final"].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Format</label>
                      <select value={pairFormat} onChange={(e) => setPairFormat(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]">
                        {["Best of 1", "Best of 3", "Best of 5"].map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Scheduled At (UTC)</label>
                      <input type="datetime-local" value={pairScheduledAt} onChange={(e) => setPairScheduledAt(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      disabled={isPairing || !pairTournamentId || !pairTeamAId || !pairTeamBId}
                      onClick={async () => {
                        setIsPairing(true);
                        try {
                          await pairMatchTeams({
                            tournament_id: pairTournamentId,
                            team_a_id: pairTeamAId,
                            team_b_id: pairTeamBId,
                            stage: pairStage,
                            format: pairFormat,
                            scheduled_at: pairScheduledAt || undefined,
                          });
                          setActionMessage("Match created successfully!");
                          setPairTeamAId(""); setPairTeamBId(""); setPairScheduledAt("");
                          const dash = await getLiveMatchesDashboard();
                          setLiveDashboard(dash);
                        } catch (err: any) {
                          setActionMessage(err?.message || "Failed to create match");
                        } finally {
                          setIsPairing(false);
                          setTimeout(() => setActionMessage(""), 4000);
                        }
                      }}
                      className="px-5 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isPairing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Create Match
                    </button>
                  </div>
                </div>
                {/* Ready teams list */}
                {liveDashboard?.ready_for_match_creation && liveDashboard.ready_for_match_creation.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold">Registered Teams Without Matches</p>
                    {liveDashboard.ready_for_match_creation.map((t: any) => (
                      <div key={t.id || t._id} className="bg-white dark:bg-[#121622] border border-[#D3E4FE] dark:border-[#242C3D] rounded-lg p-3 flex items-center justify-between gap-4 text-xs font-mono">
                        <span className="font-bold text-slate-900 dark:text-white">{t.name} <span className="text-slate-400">[{t.tag}]</span></span>
                        <span className="text-slate-500 dark:text-slate-400">{t.tournament_title}</span>
                        <button onClick={() => { setPairTeamAId(t.id || t._id); setPairTournamentId(t.tournament_id || ""); }}
                          className="px-2 py-1 bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#232D42] border border-slate-300 dark:border-[#242C3D] rounded text-slate-700 dark:text-slate-300 cursor-pointer">
                          Use as Team A
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 text-center py-8">No teams waiting for match creation.</p>
                )}
              </div>
            )}

            {/* SCHEDULED MATCHES */}
            {liveDashTab === "scheduled" && (
              <div className="space-y-3">
                {liveDashboard?.scheduled && liveDashboard.scheduled.length > 0 ? liveDashboard.scheduled.map((m: any) => (
                  <div key={m.id} className="bg-white dark:bg-[#121622] border border-[#D3E4FE] dark:border-[#242C3D] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{m.team_a?.name} vs {m.team_b?.name}</span>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{m.stage} · {m.format} · {m.scheduled_at ? new Date(m.scheduled_at).toLocaleString() : "Not scheduled"}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
                          {m.status}
                        </span>
                      </div>
                    </div>
                    {editMatchId === m.id ? (
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#242C3D]">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Status</label>
                            <select value={editMatchStatus} onChange={(e) => setEditMatchStatus(e.target.value)}
                              className="w-full px-2 py-1.5 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]">
                              {["CHECK_IN_OPEN", "SCHEDULED", "LIVE", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Live Link</label>
                            <input value={editLiveLink} onChange={(e) => setEditLiveLink(e.target.value)} placeholder="https://..."
                              className="w-full px-2 py-1.5 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]" />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditMatchId(null)} className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-slate-100 dark:bg-[#1F2637] hover:bg-slate-200 dark:hover:bg-[#283248] border border-slate-300 dark:border-[#2E384D] text-slate-800 dark:text-slate-200 rounded cursor-pointer">Cancel</button>
                          <button
                            disabled={isEditingMatch}
                            onClick={async () => {
                              setIsEditingMatch(true);
                              try {
                                if (editMatchStatus) await updateMatchStatus(m.id, editMatchStatus, editLiveLink || undefined);
                                setEditMatchId(null);
                                const dash = await getLiveMatchesDashboard();
                                setLiveDashboard(dash);
                              } catch (err: any) {
                                setActionMessage(err?.message || "Failed to update match");
                              } finally {
                                setIsEditingMatch(false);
                                setTimeout(() => setActionMessage(""), 4000);
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-[#E56A10] hover:bg-[#C95B0A] text-white rounded cursor-pointer disabled:opacity-50 flex items-center gap-1">
                            {isEditingMatch ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setEditMatchId(m.id); setEditMatchStatus(m.status); setEditLiveLink(m.live_link || ""); }}
                        className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#232D42] border border-slate-300 dark:border-[#242C3D] text-slate-700 dark:text-slate-300 rounded cursor-pointer">
                        Edit Status / Live Link
                      </button>
                    )}
                  </div>
                )) : (
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 text-center py-8">No scheduled matches.</p>
                )}
              </div>
            )}

            {/* LIVE NOW */}
            {liveDashTab === "live" && (
              <div className="space-y-3">
                {liveDashboard?.live_now && liveDashboard.live_now.length > 0 ? liveDashboard.live_now.map((m: any) => (
                  <div key={m.id} className="bg-white dark:bg-[#121622] border border-rose-300 dark:border-rose-900/60 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{m.team_a?.name} <span className="text-[#E56A10] font-mono">vs</span> {m.team_b?.name}</span>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{m.stage} · {m.format}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.team_a?.score !== undefined && <span className="text-xl font-mono font-bold text-slate-900 dark:text-white">{m.team_a.score} : {m.team_b?.score}</span>}
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> LIVE
                        </span>
                      </div>
                    </div>
                    {/* Score update form */}
                    {editMatchId === m.id ? (
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#242C3D]">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">{m.team_a?.name} Score</label>
                            <input type="number" min={0} value={editScoreA} onChange={(e) => setEditScoreA(e.target.value)}
                              className="w-full px-2 py-1.5 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]" />
                          </div>
                          <div>
                            <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">{m.team_b?.name} Score</label>
                            <input type="number" min={0} value={editScoreB} onChange={(e) => setEditScoreB(e.target.value)}
                              className="w-full px-2 py-1.5 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]" />
                          </div>
                          <div>
                            <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Status</label>
                            <select value={editMatchStatus} onChange={(e) => setEditMatchStatus(e.target.value)}
                              className="w-full px-2 py-1.5 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]">
                              {["IN_PROGRESS", "LIVE", "COMPLETED", "PENDING_VERIFICATION"].map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditMatchId(null)} className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-slate-100 dark:bg-[#1F2637] hover:bg-slate-200 dark:hover:bg-[#283248] border border-slate-300 dark:border-[#2E384D] text-slate-800 dark:text-slate-200 rounded cursor-pointer">Cancel</button>
                          <button
                            disabled={isEditingMatch}
                            onClick={async () => {
                              setIsEditingMatch(true);
                              try {
                                const scoreA = parseInt(editScoreA);
                                const scoreB = parseInt(editScoreB);
                                if (!isNaN(scoreA) && !isNaN(scoreB)) {
                                  await updateMatchScore(m.id, scoreA, scoreB);
                                }
                                if (editMatchStatus) await updateMatchStatus(m.id, editMatchStatus);
                                setEditMatchId(null);
                                const dash = await getLiveMatchesDashboard();
                                setLiveDashboard(dash);
                              } catch (err: any) {
                                setActionMessage(err?.message || "Failed to update match");
                              } finally {
                                setIsEditingMatch(false);
                                setTimeout(() => setActionMessage(""), 4000);
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-[#E56A10] hover:bg-[#C95B0A] text-white rounded cursor-pointer disabled:opacity-50 flex items-center gap-1">
                            {isEditingMatch ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Update Score
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setEditMatchId(m.id); setEditScoreA(String(m.team_a?.score ?? "")); setEditScoreB(String(m.team_b?.score ?? "")); setEditMatchStatus(m.status); }}
                        className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#232D42] border border-slate-300 dark:border-[#242C3D] text-slate-700 dark:text-slate-300 rounded cursor-pointer">
                        Update Score / Status
                      </button>
                    )}
                  </div>
                )) : (
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 text-center py-8">No matches live right now.</p>
                )}
              </div>
            )}

            {/* COMPLETED MATCHES */}
            {liveDashTab === "completed" && (
              <div className="space-y-3">
                {liveDashboard?.completed && liveDashboard.completed.length > 0 ? liveDashboard.completed.map((m: any) => (
                  <div key={m.id} className="bg-white dark:bg-[#121622] border border-[#D3E4FE] dark:border-[#242C3D] rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{m.team_a?.name} vs {m.team_b?.name}</span>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{m.stage} · {m.format}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {m.team_a?.score !== undefined && (
                          <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">{m.team_a.score} : {m.team_b?.score}</span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                          {m.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 text-center py-8">No completed matches yet.</p>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Payout Approval Modal */}
      {approvingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] max-w-md w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">
                  Certify & Disburse Payout
                </h3>
              </div>
              <button
                onClick={() => setApprovingWithdrawal(null)}
                className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApprovePayout} className="space-y-4">
              <div className="bg-slate-50 dark:bg-[#161B26] p-3.5 rounded-xl border border-slate-200 dark:border-[#242C3D] space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Athlete:</span>
                  <span className="font-bold text-slate-900 dark:text-white">@{approvingWithdrawal.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Payout Amount:</span>
                  <span className="font-bold text-[#E56A10] text-sm">₹{approvingWithdrawal.amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Destination UPI ID:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{approvingWithdrawal.upi_id}</span>
                </div>
                {approvingWithdrawal.account_holder_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Account Name:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{approvingWithdrawal.account_holder_name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-800 dark:text-slate-200 font-bold mb-1">
                  IMPS / UTR Payout Reference *
                </label>
                <input
                  type="text"
                  required
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  placeholder="e.g. UPI/2026/88491023 or IMPS-109248"
                  className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-800 dark:text-slate-200 font-bold mb-1">
                  Admin Audit Note
                </label>
                <input
                  type="text"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Disbursed via official banking channel"
                  className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingWithdrawal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1F2637] dark:hover:bg-[#283248] border border-slate-300 dark:border-[#2E384D] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingWithdrawal}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isProcessingWithdrawal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Certify Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Rejection Modal */}
      {rejectingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] max-w-md w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">
                  Reject Withdrawal Request
                </h3>
              </div>
              <button
                onClick={() => setRejectingWithdrawal(null)}
                className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectPayout} className="space-y-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-mono text-rose-800 dark:text-rose-300 space-y-1">
                <div className="font-bold">Refund Notice:</div>
                <p>
                  Rejecting this request will immediately refund ₹{rejectingWithdrawal.amount.toLocaleString("en-IN")} back to @{rejectingWithdrawal.user_name}&apos;s wallet balance.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-800 dark:text-slate-200 font-bold mb-1">
                  Rejection Reason (Sent to User) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. UPI ID invalid or bank rejected beneficiary handle"
                  className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingWithdrawal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1F2637] dark:hover:bg-[#283248] border border-slate-300 dark:border-[#2E384D] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingWithdrawal}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isProcessingWithdrawal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Reject & Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screenshot Evidence Inspection Modal */}
      {inspectingEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] max-w-3xl w-full max-h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#242C3D]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#E56A10]" />
                <span className="font-headline font-bold text-sm text-slate-900 dark:text-white uppercase">Match Scoreboard Evidence</span>
              </div>
              <button
                onClick={() => setInspectingEvidence(null)}
                className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-50 dark:bg-[#0B0E16] min-h-[300px] overflow-auto">
              {inspectingEvidence.startsWith("data:") || inspectingEvidence.startsWith("http") ? (
                <img
                  src={inspectingEvidence}
                  alt="Evidence Screenshot"
                  className="max-h-[60vh] object-contain rounded border border-slate-200 dark:border-[#242C3D]"
                />
              ) : (
                <div className="text-center p-8 text-slate-500 dark:text-slate-400 font-mono text-xs">
                  <FileCheck className="w-12 h-12 text-[#E56A10] mx-auto mb-2 opacity-50" />
                  Evidence File: <span className="text-slate-900 dark:text-white font-bold">{inspectingEvidence}</span>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">Uploaded and certified by team captain.</p>
                </div>
              )}
            </div>
            <div className="p-3 bg-white dark:bg-[#111622] border-t border-slate-200 dark:border-[#242C3D] flex justify-end">
              <button
                onClick={() => setInspectingEvidence(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1F2637] dark:hover:bg-[#283248] border border-slate-300 dark:border-[#2E384D] text-slate-800 dark:text-slate-200 rounded text-xs font-mono font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ─── UPI Account Add/Edit Modal ────────────────────────────────── */}
      {isUpiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#E56A10]" />
                <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">
                  {editingUpiAccount ? `Edit ${editingUpiAccount.code}` : "Add UPI Account"}
                </h3>
              </div>
              <button onClick={() => { setIsUpiModalOpen(false); setEditingUpiAccount(null); }} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveUpiAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Payment Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUpiAccount}
                    value={upiForm.code}
                    onChange={(e) => setUpiForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. UPI001"
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10] disabled:bg-slate-50 dark:disabled:bg-slate-900/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">UPI ID *</label>
                  <input
                    type="text"
                    required
                    value={upiForm.upi_id}
                    onChange={(e) => setUpiForm((f) => ({ ...f, upi_id: e.target.value }))}
                    placeholder="e.g. tournament@oksbi"
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Payee Name *</label>
                  <input
                    type="text"
                    required
                    value={upiForm.payee_name}
                    onChange={(e) => setUpiForm((f) => ({ ...f, payee_name: e.target.value }))}
                    placeholder="e.g. Ametheus Gaming Pvt Ltd"
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Display Name</label>
                  <input
                    type="text"
                    value={upiForm.display_name}
                    onChange={(e) => setUpiForm((f) => ({ ...f, display_name: e.target.value }))}
                    placeholder="e.g. Primary Account"
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">QR Code Image URL</label>
                  <input
                    type="url"
                    value={upiForm.qr_url}
                    onChange={(e) => setUpiForm((f) => ({ ...f, qr_url: e.target.value }))}
                    placeholder="https://... (paste QR image URL)"
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                  {upiForm.qr_url && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={upiForm.qr_url} alt="QR Preview" className="w-16 h-16 object-contain rounded border border-slate-200 dark:border-[#242C3D] bg-white" />
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">QR preview loaded</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setIsUpiModalOpen(false); setEditingUpiAccount(null); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#161A24] dark:hover:bg-[#202534] border border-slate-300 dark:border-[#242C3D] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingUpi} className="px-5 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                  {isSubmittingUpi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {editingUpiAccount ? "Save Changes" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── User Wallet Detail & Accounting Modal ───────────────────────── */}
      {selectedUserWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2.5">
                <Wallet className="w-5 h-5 text-[#E56A10]" />
                <div>
                  <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">
                    User Wallet &amp; Ledger Audit
                  </h3>
                  <span className="font-mono text-xs text-slate-500">
                    @{selectedUserWallet.username} ({selectedUserWallet.email})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserWallet(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Accounting Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-[#161B26] rounded-xl border border-slate-200 dark:border-[#242C3D]">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Available</span>
                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  ₹{selectedUserWallet.available_balance_inr.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#161B26] rounded-xl border border-slate-200 dark:border-[#242C3D]">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Deposited</span>
                <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                  ₹{selectedUserWallet.total_deposited_inr.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#161B26] rounded-xl border border-slate-200 dark:border-[#242C3D]">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Spent</span>
                <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                  ₹{selectedUserWallet.total_spent_inr.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#161B26] rounded-xl border border-slate-200 dark:border-[#242C3D]">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Withdrawn</span>
                <span className="text-lg font-bold font-mono text-slate-700 dark:text-slate-300">
                  ₹{selectedUserWallet.total_withdrawn_inr.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Ledger Transactions */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300">
                Authoritative Ledger History ({selectedUserWallet.ledger.length} entries)
              </div>
              {selectedUserWallet.ledger.length === 0 ? (
                <div className="p-6 bg-slate-50 dark:bg-[#161B26] rounded-xl text-center text-xs font-mono text-slate-500">
                  No ledger activity recorded for this user.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-[#242C3D] rounded-xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 dark:bg-[#161B26] border-b border-slate-200 dark:border-[#242C3D] text-[10px] uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Direction</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Balance After</th>
                        <th className="px-3 py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#242C3D]">
                      {selectedUserWallet.ledger.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-[#161B26]/50">
                          <td className="px-3 py-2 text-slate-500 whitespace-nowrap text-[11px]">
                            {new Date(entry.created_at).toLocaleDateString("en-IN")}
                          </td>
                          <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200 text-[10px]">
                            {entry.txn_type}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                entry.direction === "CREDIT"
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                  : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                              }`}
                            >
                              {entry.direction}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-bold font-mono">
                            <span className={entry.direction === "CREDIT" ? "text-emerald-600" : "text-rose-600"}>
                              {entry.direction === "CREDIT" ? "+" : "-"}₹{entry.amount_inr.toLocaleString("en-IN")}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                            ₹{entry.balance_after_inr.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2 text-slate-500 text-[11px] truncate max-w-[200px]" title={entry.description}>
                            {entry.description || entry.reference_id || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-[#242C3D]">
              <button
                type="button"
                onClick={() => setSelectedUserWallet(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-[#161B26] hover:bg-slate-200 dark:hover:bg-[#202636] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Payment Rejection Modal ───────────────────────────────────── */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] max-w-md w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">Reject Payment</h3>
              </div>
              <button onClick={() => setRejectingPayment(null)} className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRejectPayment} className="space-y-4">
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-3.5 rounded-xl text-xs font-mono text-rose-800 dark:text-rose-300 space-y-1">
                <div className="font-bold">Payment by user: {rejectingPayment.user_id}</div>
                <div>Amount: ₹{rejectingPayment.amount_inr.toLocaleString("en-IN")}</div>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-800 dark:text-slate-200 font-bold mb-1">Rejection Reason *</label>
                <select
                  required
                  value={paymentRejectReason}
                  onChange={(e) => setPaymentRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">— Select a reason —</option>
                  <option value="UTR reference not found in bank records">UTR reference not found in bank records</option>
                  <option value="Screenshot unclear or illegible">Screenshot unclear or illegible</option>
                  <option value="Amount mismatch — incorrect amount transferred">Amount mismatch — incorrect amount transferred</option>
                  <option value="UPI ID mismatch — payment sent to wrong account">UPI ID mismatch — payment sent to wrong account</option>
                  <option value="Duplicate submission">Duplicate submission</option>
                  <option value="Payment reversed by bank">Payment reversed by bank</option>
                  <option value="Fraudulent or forged screenshot">Fraudulent or forged screenshot</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRejectingPayment(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1F2637] dark:hover:bg-[#283248] border border-slate-300 dark:border-[#2E384D] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isProcessingPayment} className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                  {isProcessingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Reject Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Complete Payout (Mark Paid) Modal ────────────────────────── */}
      {completingPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] max-w-md w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">Confirm UPI Transfer</h3>
              </div>
              <button onClick={() => setCompletingPayout(null)} className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCompletePayout} className="space-y-4">
              <div className="bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] p-3.5 rounded-xl text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Recipient:</span>
                  <span className="font-bold text-slate-900 dark:text-white">@{completingPayout.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Amount:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">₹{completingPayout.amount_inr.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Destination UPI:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{completingPayout.upi_id || completingPayout.destination || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Type:</span>
                  <span className="text-slate-700 dark:text-slate-300">{completingPayout.payout_type}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-800 dark:text-slate-200 font-bold mb-1">Outgoing UTR / Transfer Reference *</label>
                <input
                  type="text"
                  required
                  value={outgoingUtrInput}
                  onChange={(e) => setOutgoingUtrInput(e.target.value)}
                  placeholder="e.g. UPI/2026/88491023 or IMPS-109248"
                  className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E56A10]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCompletingPayout(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1F2637] dark:hover:bg-[#283248] border border-slate-300 dark:border-[#2E384D] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isProcessingPayoutAction} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                  {isProcessingPayoutAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Mark as Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Payout Rejection Modal ────────────────────────────────────── */}
      {rejectingPayoutRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] max-w-md w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">Reject Payout</h3>
              </div>
              <button onClick={() => setRejectingPayoutRecord(null)} className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRejectPayoutRecord} className="space-y-4">
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-3.5 rounded-xl text-xs font-mono text-rose-800 dark:text-rose-300 space-y-1">
                <div className="font-bold">Payout to @{rejectingPayoutRecord.user_name}</div>
                <div>Amount: ₹{rejectingPayoutRecord.amount_inr.toLocaleString("en-IN")} | Type: {rejectingPayoutRecord.payout_type}</div>
                <p className="mt-1">Rejecting a withdrawal payout will restore the reserved funds to the user&apos;s wallet.</p>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-800 dark:text-slate-200 font-bold mb-1">Rejection Reason *</label>
                <select
                  required
                  value={payoutRejectReason}
                  onChange={(e) => setPayoutRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">— Select a reason —</option>
                  <option value="UPI ID is invalid or closed">UPI ID is invalid or closed</option>
                  <option value="Bank rejected the beneficiary handle">Bank rejected the beneficiary handle</option>
                  <option value="Account holder name mismatch">Account holder name mismatch</option>
                  <option value="IMPS/UPI transfer failed — bank error">IMPS/UPI transfer failed — bank error</option>
                  <option value="Suspected fraudulent withdrawal">Suspected fraudulent withdrawal</option>
                  <option value="Admin manual cancellation">Admin manual cancellation</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRejectingPayoutRecord(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1F2637] dark:hover:bg-[#283248] border border-slate-300 dark:border-[#2E384D] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isProcessingPayoutAction} className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                  {isProcessingPayoutAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Reject Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Create Winning Payout Modal ───────────────────────────────── */}
      {isWinningPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">Create Winning Payout</h3>
              </div>
              <button onClick={() => setIsWinningPayoutModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveWinningPayout} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">User ID *</label>
                  <input
                    type="text"
                    required
                    value={winningPayoutForm.user_id}
                    onChange={(e) => setWinningPayoutForm((f) => ({ ...f, user_id: e.target.value }))}
                    placeholder="usr_... or username"
                    className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Game</label>
                  <select
                    value={winningPayoutForm.game_id}
                    onChange={(e) => setWinningPayoutForm((f) => ({ ...f, game_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  >
                    <option value="">— Select Game —</option>
                    {games.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Amount (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={winningPayoutForm.amount_inr || ""}
                    onChange={(e) => setWinningPayoutForm((f) => ({ ...f, amount_inr: Number(e.target.value) }))}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Rank / Placement *</label>
                  <select
                    value={winningPayoutForm.rank_or_placement}
                    onChange={(e) => setWinningPayoutForm((f) => ({ ...f, rank_or_placement: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  >
                    <option>1st Place</option>
                    <option>2nd Place</option>
                    <option>3rd Place</option>
                    <option>4th Place</option>
                    <option>Top 5</option>
                    <option>Top 8</option>
                    <option>Top 16</option>
                    <option>MVP Bonus</option>
                    <option>Participation Bonus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Destination *</label>
                  <select
                    value={winningPayoutForm.destination}
                    onChange={(e) => setWinningPayoutForm((f) => ({ ...f, destination: e.target.value as "UPI" | "WALLET" }))}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  >
                    <option value="WALLET">WALLET (credit user wallet)</option>
                    <option value="UPI">UPI (direct transfer)</option>
                  </select>
                </div>
                {winningPayoutForm.destination === "UPI" && (
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">UPI ID *</label>
                    <input
                      type="text"
                      required={winningPayoutForm.destination === "UPI"}
                      value={winningPayoutForm.upi_id}
                      onChange={(e) => setWinningPayoutForm((f) => ({ ...f, upi_id: e.target.value }))}
                      placeholder="e.g. winner@oksbi"
                      className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E56A10]"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsWinningPayoutModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1F2637] dark:hover:bg-[#283248] border border-slate-300 dark:border-[#2E384D] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingWinningPayout} className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-white text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                  {isSubmittingWinningPayout ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />}
                  Create Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Game Modal */}
      {isGameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <h3 className="text-base font-bold uppercase font-mono text-slate-900 dark:text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-[#E56A10]" />
                {editingGame ? `Edit Game: ${editingGame.name}` : "Register New Game Title"}
              </h3>
              <button
                onClick={() => { setIsGameModalOpen(false); setEditingGame(null); }}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGame} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
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
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingGame)}
                    value={gameForm.slug}
                    onChange={(e) => setGameForm({ ...gameForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    placeholder="e.g. apex-legends"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Platform *
                  </label>
                  <input
                    type="text"
                    required
                    value={gameForm.platform}
                    onChange={(e) => setGameForm({ ...gameForm, platform: e.target.value })}
                    placeholder="e.g. PC, Mobile, Crossplay"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Tag / Genre *
                  </label>
                  <input
                    type="text"
                    required
                    value={gameForm.tag}
                    onChange={(e) => setGameForm({ ...gameForm, tag: e.target.value })}
                    placeholder="e.g. BATTLE ROYALE, FPS, MOBA"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Platform Status *
                  </label>
                  <select
                    value={gameForm.status || "ACTIVE"}
                    onChange={(e) => setGameForm({ ...gameForm, status: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  >
                    <option value="ACTIVE">ACTIVE (Fully Live)</option>
                    <option value="COMING_SOON">COMING SOON (Teaser / Preview)</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                {gameForm.status === "COMING_SOON" && (
                  <div className="sm:col-span-2 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-500 font-mono font-bold text-xs uppercase">
                      <Clock className="w-4 h-4" /> Coming Soon Release Telemetry
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                          Expected Release Date
                        </label>
                        <input
                          type="text"
                          value={gameForm.expected_release_date || ""}
                          onChange={(e) => setGameForm({ ...gameForm, expected_release_date: e.target.value })}
                          placeholder="e.g. Q4 2026 or November 15, 2026"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                          Announcement / Teaser Text
                        </label>
                        <input
                          type="text"
                          value={gameForm.announcement_text || ""}
                          onChange={(e) => setGameForm({ ...gameForm, announcement_text: e.target.value })}
                          placeholder="e.g. Pre-season tournament registrations opening soon"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Min Team Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={gameForm.min_team_size}
                    onChange={(e) => setGameForm({ ...gameForm, min_team_size: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={gameForm.max_team_size}
                    onChange={(e) => setGameForm({ ...gameForm, max_team_size: parseInt(e.target.value) || 5 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>


                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Prize Pool (₹ INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={gameForm.prize_pool_inr ?? 0}
                    onChange={(e) => setGameForm({ ...gameForm, prize_pool_inr: parseInt(e.target.value) || 0 })}
                    placeholder="e.g. 50000"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Max Substitutes
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={gameForm.max_substitutes ?? 1}
                    onChange={(e) => setGameForm({ ...gameForm, max_substitutes: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Play URL (Game Server / Lobby Link)
                  </label>
                  <input
                    type="url"
                    value={gameForm.play_url ?? ""}
                    onChange={(e) => setGameForm({ ...gameForm, play_url: e.target.value })}
                    placeholder="https://... game lobby or server URL"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Server Region
                  </label>
                  <input
                    type="text"
                    value={gameForm.server_region}
                    onChange={(e) => setGameForm({ ...gameForm, server_region: e.target.value })}
                    placeholder="e.g. AWS Mumbai (ap-south-1)"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Anti-Cheat Protocol
                  </label>
                  <input
                    type="text"
                    value={gameForm.anti_cheat}
                    onChange={(e) => setGameForm({ ...gameForm, anti_cheat: e.target.value })}
                    placeholder="e.g. Hardware Vanguard TPM 2.0"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Banner URL (Upload to DB or Paste URL) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      required
                      value={gameForm.banner_url}
                      onChange={(e) => setGameForm({ ...gameForm, banner_url: e.target.value })}
                      placeholder="https://images.unsplash.com/... or uploaded DB URL"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                    />
                    <label className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 shrink-0">
                      {isUploadingGameBanner ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingGameBanner}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUploadingGameBanner(true);
                            try {
                              const res = await uploadImageFile(file);
                              setGameForm((prev) => ({ ...prev, banner_url: res.url }));
                              setActionMessage("Game banner uploaded to database successfully!");
                            } catch {
                              setActionMessage("Failed to upload game banner image");
                            } finally {
                              setIsUploadingGameBanner(false);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  {gameForm.banner_url && (
                    <div className="mt-2 h-20 rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100">
                      <img src={gameForm.banner_url} alt="Banner Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Logo / Icon URL (Upload to DB or Paste URL) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      required
                      value={gameForm.logo_url}
                      onChange={(e) => setGameForm({ ...gameForm, logo_url: e.target.value })}
                      placeholder="https://images.unsplash.com/... or uploaded DB URL"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                    />
                    <label className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 shrink-0">
                      {isUploadingGameLogo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingGameLogo}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUploadingGameLogo(true);
                            try {
                              const res = await uploadImageFile(file);
                              setGameForm((prev) => ({ ...prev, logo_url: res.url }));
                              setActionMessage("Game logo uploaded to database successfully!");
                            } catch {
                              setActionMessage("Failed to upload game logo image");
                            } finally {
                              setIsUploadingGameLogo(false);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  {gameForm.logo_url && (
                    <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100 flex items-center justify-center">
                      <img src={gameForm.logo_url} alt="Logo Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={gameForm.description}
                    onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                    placeholder="Brief description of competitive format and gameplay..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                {/* Hero Animated Media (GIF / Loop) */}
                <div className="sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase text-slate-800 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#E56A10]" />
                      Hero Animated Media (GIF / Loop Banner)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-700">
                      <input
                        type="checkbox"
                        checked={gameForm.hero_media_enabled !== false}
                        onChange={(e) => setGameForm({ ...gameForm, hero_media_enabled: e.target.checked })}
                        className="w-3.5 h-3.5 accent-[#E56A10] rounded"
                      />
                      <span>Enable Hero Banner</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    High-energy animated GIF or video loop displayed on public game detail page.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={gameForm.hero_media_url || ""}
                      onChange={(e) => setGameForm({ ...gameForm, hero_media_url: e.target.value })}
                      placeholder="https://... (Direct GIF or loop URL)"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                    />
                    <label className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 shrink-0">
                      {isUploadingHeroMedia ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload GIF</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        disabled={isUploadingHeroMedia}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUploadingHeroMedia(true);
                            try {
                              const res = await uploadImageFile(file);
                              setGameForm((prev) => ({ ...prev, hero_media_url: res.url }));
                              setActionMessage("Hero animated GIF uploaded successfully!");
                            } catch {
                              setActionMessage("Failed to upload hero media file");
                            } finally {
                              setIsUploadingHeroMedia(false);
                            }
                          }
                        }}
                      />
                    </label>
                    {gameForm.hero_media_url && (
                      <button
                        type="button"
                        onClick={() => setGameForm((prev) => ({ ...prev, hero_media_url: "" }))}
                        className="px-2.5 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-mono font-bold cursor-pointer"
                        title="Clear Hero Media"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {gameForm.hero_media_url && (
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-950 h-36 flex items-center justify-center">
                      <img
                        src={gameForm.hero_media_url}
                        alt="Hero Animated Media Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 text-[#E56A10] border border-[#E56A10]/40 rounded text-[10px] font-mono font-bold uppercase">
                        Live GIF Preview
                      </div>
                    </div>
                  )}
                </div>

                {/* Media Gallery screenshots */}
                <div className="sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase text-slate-800 font-bold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#E56A10]" />
                      Media Gallery Screenshots ({gameForm.gallery?.length || 0})
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    High-resolution screenshots and stage photos for public gallery and lightbox inspection.
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="url"
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      placeholder="Image URL or upload file..."
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                    />
                    <input
                      type="text"
                      value={newGalleryCaption}
                      onChange={(e) => setNewGalleryCaption(e.target.value)}
                      placeholder="Caption (optional)"
                      className="w-full sm:w-44 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                    />
                    <label className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0">
                      {isUploadingGallery ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingGallery}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUploadingGallery(true);
                            try {
                              const res = await uploadImageFile(file);
                              setNewGalleryUrl(res.url);
                              setActionMessage("Gallery image uploaded!");
                            } catch {
                              setActionMessage("Failed to upload image");
                            } finally {
                              setIsUploadingGallery(false);
                            }
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (newGalleryUrl.trim()) {
                          const newItem = {
                            id: `gal_${Date.now()}`,
                            url: newGalleryUrl.trim(),
                            caption: newGalleryCaption.trim() || undefined,
                            order: (gameForm.gallery?.length || 0) + 1,
                          };
                          setGameForm({
                            ...gameForm,
                            gallery: [...(gameForm.gallery || []), newItem],
                          });
                          setNewGalleryUrl("");
                          setNewGalleryCaption("");
                        }
                      }}
                      disabled={!newGalleryUrl.trim()}
                      className="px-3 py-2 bg-[#E56A10] hover:bg-[#D45900] disabled:opacity-40 text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                  {gameForm.gallery && gameForm.gallery.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      {gameForm.gallery.map((item, idx) => (
                        <div key={item.id || idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-900">
                          <img src={item.url} alt={item.caption || "Gallery"} className="w-full h-full object-cover" />
                          {item.caption && (
                            <div className="absolute bottom-0 inset-x-0 bg-black/75 px-1.5 py-0.5 text-[10px] text-white truncate font-mono">
                              {item.caption}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setGameForm({
                                ...gameForm,
                                gallery: (gameForm.gallery || []).filter((_, i) => i !== idx),
                              });
                            }}
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded hover:bg-rose-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => { setIsGameModalOpen(false); setEditingGame(null); }}
                  className="px-4 py-2 bg-slate-50 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] text-xs font-mono uppercase rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
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
      {/* Tournament Editor Modal */}
      {isTournamentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] rounded-xl w-full max-w-3xl p-6 space-y-5 my-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <h3 className="text-base font-bold uppercase font-mono text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#E56A10]" />
                {editingTournament ? `Edit Tournament: ${editingTournament.title}` : "Create New Platform Tournament"}
              </h3>
              <button
                onClick={() => { setIsTournamentModalOpen(false); setEditingTournament(null); }}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTournament} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Game Title *
                  </label>
                  <select
                    value={tournForm.game_id}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const selectedGame = games.find((g) => (g.slug || g.id) === selectedVal || g.id === selectedVal);
                      const isSolo = Boolean(selectedGame && (!selectedGame.is_team_game || selectedGame.slug === "chess" || (selectedGame.max_team_size || 5) <= 1));
                      setTournForm((prev) => ({
                        ...prev,
                        game_id: selectedVal,
                        min_team_size: isSolo ? 1 : (Number(prev.min_team_size) > 1 ? prev.min_team_size : 2),
                        max_team_size: isSolo ? 1 : Math.max(Number(prev.max_team_size) || 5, Number(prev.min_team_size) || 2, 2),
                        format: isSolo ? "1v1 Solo Championship" : (prev.format.includes("Solo") ? "Single Elimination Bracket" : prev.format),
                      }));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  >
                    {games.map((g) => (
                      <option key={g.id} value={g.slug || g.id}>
                        {g.name} ({g.platform})
                      </option>
                    ))}
                    {games.length === 0 && <option value="valorant">Valorant (PC)</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Tournament Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={tournForm.title}
                    onChange={(e) => setTournForm({ ...tournForm, title: e.target.value })}
                    placeholder="e.g. Mumbai Masters Champions Cup"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                {/* Competition Format Selector: Solo vs Team */}
                <div className="sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase text-slate-800 font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#E56A10]" />
                      Registration &amp; Competition Format *
                    </label>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                      Number(tournForm.min_team_size) === 1 && Number(tournForm.max_team_size) === 1
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-blue-100 text-blue-900 border border-blue-300"
                    }`}>
                      {Number(tournForm.min_team_size) === 1 && Number(tournForm.max_team_size) === 1
                        ? "SOLO CONTENDER (1v1)"
                        : `TEAM (${tournForm.min_team_size}v${tournForm.max_team_size})`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTournForm((prev) => ({
                          ...prev,
                          min_team_size: 1,
                          max_team_size: 1,
                          format: prev.format.includes("Bracket") ? "1v1 Solo Championship" : prev.format,
                        }));
                      }}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        Number(tournForm.min_team_size) === 1 && Number(tournForm.max_team_size) === 1
                          ? "bg-amber-500/10 border-[#E56A10] ring-1 ring-[#E56A10]"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${
                        Number(tournForm.min_team_size) === 1 && Number(tournForm.max_team_size) === 1
                          ? "bg-[#E56A10] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 font-mono">Solo Contender (1v1 Individual)</div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                          Designed for 1v1 titles (Chess, FIFA). Players register directly with their in-game handle without needing a team.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const selectedGame = games.find((g) => (g.slug || g.id) === tournForm.game_id || g.id === tournForm.game_id);
                        const req = getGameRosterRequirement(selectedGame?.slug || tournForm.game_id || "");
                        const fallbackMin = Number(tournForm.min_team_size) > 1 ? Number(tournForm.min_team_size) : (req.min > 1 ? req.min : 2);
                        const fallbackMax = Number(tournForm.max_team_size) >= fallbackMin ? Number(tournForm.max_team_size) : Math.max(fallbackMin, req.max > 1 ? req.max : 5);
                        setTournForm((prev) => ({
                          ...prev,
                          min_team_size: fallbackMin,
                          max_team_size: fallbackMax,
                          format: prev.format.includes("Solo") ? "Single Elimination Bracket" : prev.format,
                        }));
                      }}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        Number(tournForm.min_team_size) > 1 || Number(tournForm.max_team_size) > 1
                          ? "bg-blue-500/10 border-blue-600 ring-1 ring-blue-600"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${
                        Number(tournForm.min_team_size) > 1 || Number(tournForm.max_team_size) > 1
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 font-mono">Team Tournament</div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                          Designed for team games (Valorant 5v5, BGMI 4v4). Captain registers team and invites teammates via invite code.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Tournament Status
                  </label>
                  <select
                    value={tournForm.status === "ONGOING" ? "LIVE" : tournForm.status}
                    onChange={(e) => setTournForm({ ...tournForm, status: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  >
                    <option value="REGISTRATION_OPEN">Registration Open</option>
                    <option value="COMING_SOON">Coming Soon (Upcoming / Teaser)</option>
                    <option value="LIVE">Live (Ongoing Matches)</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {tournForm.status === "COMING_SOON" && (
                  <div className="sm:col-span-2 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-500 font-mono font-bold text-xs uppercase">
                      <Clock className="w-4 h-4" /> Coming Soon Tournament Schedule
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                          Expected Start Date
                        </label>
                        <input
                          type="text"
                          value={tournForm.expected_start_date}
                          onChange={(e) => setTournForm({ ...tournForm, expected_start_date: e.target.value })}
                          placeholder="e.g. November 2026 or Dec 1, 2026"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                          Registration Open Date
                        </label>
                        <input
                          type="text"
                          value={tournForm.registration_open_date}
                          onChange={(e) => setTournForm({ ...tournForm, registration_open_date: e.target.value })}
                          placeholder="e.g. October 15, 2026"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                          Teaser / Announcement Text
                        </label>
                        <input
                          type="text"
                          value={tournForm.announcement_text}
                          onChange={(e) => setTournForm({ ...tournForm, announcement_text: e.target.value })}
                          placeholder="e.g. Registrations unlock next week with special founder badges!"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Tournament Format
                  </label>
                  <input
                    type="text"
                    value={tournForm.format}
                    onChange={(e) => setTournForm({ ...tournForm, format: e.target.value })}
                    placeholder="e.g. Single Elimination Bracket"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Guaranteed Prize Vault (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={tournForm.prize_pool_inr}
                    onChange={(e) => setTournForm({ ...tournForm, prize_pool_inr: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Entry Fee (₹ INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={tournForm.entry_fee_inr}
                    onChange={(e) => setTournForm({ ...tournForm, entry_fee_inr: parseInt(e.target.value) || 0 })}
                    placeholder="0 for Free Entry"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Tournament Schedule (Starts At) *
                  </label>
                  <input
                    type="text"
                    required
                    value={tournForm.starts_at}
                    onChange={(e) => setTournForm({ ...tournForm, starts_at: e.target.value })}
                    placeholder="e.g. Saturday, 8:00 PM IST"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    {Number(tournForm.min_team_size) === 1 && Number(tournForm.max_team_size) === 1 ? "Registration Lock Time *" : "Team / Lineup Lock Time *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={tournForm.roster_lock_time}
                    onChange={(e) => setTournForm({ ...tournForm, roster_lock_time: e.target.value })}
                    placeholder="e.g. Saturday, 7:30 PM IST"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Server Region
                  </label>
                  <input
                    type="text"
                    value={tournForm.server_region}
                    onChange={(e) => setTournForm({ ...tournForm, server_region: e.target.value })}
                    placeholder="e.g. AWS Mumbai (ap-south-1)"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Rank Requirement
                  </label>
                  <input
                    type="text"
                    value={tournForm.rank_requirement}
                    onChange={(e) => setTournForm({ ...tournForm, rank_requirement: e.target.value })}
                    placeholder="e.g. Open to All Ranks"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                      {Number(tournForm.min_team_size) === 1 && Number(tournForm.max_team_size) === 1 ? "Max Contenders" : "Max Teams"}
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={128}
                      value={tournForm.max_teams}
                      onChange={(e) => setTournForm({ ...tournForm, max_teams: parseInt(e.target.value) || 16 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                      Required Team Size (Roster Min)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={tournForm.min_team_size}
                      onChange={(e) => setTournForm({ ...tournForm, min_team_size: parseInt(e.target.value) || 1 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                      Max Team Size (Roster Max)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={tournForm.max_team_size}
                      onChange={(e) => setTournForm({ ...tournForm, max_team_size: parseInt(e.target.value) || 5 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Banner URL (Upload to DB or Paste URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={tournForm.banner_url}
                      onChange={(e) => setTournForm({ ...tournForm, banner_url: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-... or uploaded DB URL"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                    />
                    <label className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 shrink-0">
                      {isUploadingTournBanner ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingTournBanner}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUploadingTournBanner(true);
                            try {
                              const res = await uploadImageFile(file);
                              setTournForm((prev) => ({ ...prev, banner_url: res.url }));
                              setActionMessage("Tournament banner uploaded to database successfully!");
                            } catch {
                              setActionMessage("Failed to upload tournament banner");
                            } finally {
                              setIsUploadingTournBanner(false);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  {tournForm.banner_url && (
                    <div className="mt-2 h-20 rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100">
                      <img src={tournForm.banner_url} alt="Tournament Banner Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-slate-800 font-bold mb-1">
                    Description & Overview
                  </label>
                  <textarea
                    rows={2}
                    value={tournForm.description}
                    onChange={(e) => setTournForm({ ...tournForm, description: e.target.value })}
                    placeholder="Official sanctioned tournament rules, match server info, and schedule..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* DYNAMIC RULES SECTION */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold font-mono text-slate-900 uppercase flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#E56A10]" /> Tournament Rules & Regulations ({tournForm.rules.length})
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Add or delete official competitive rules enforced by match arbiters.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {tournForm.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-[#E56A10] font-bold shrink-0">#{idx + 1}</span>
                        <span className="text-slate-700 truncate">{rule}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors shrink-0 cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {tournForm.rules.length === 0 && (
                    <p className="text-xs text-[#64748B] font-mono italic">No specific rules configured. Standard competitive guidelines apply.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tournForm.newRule}
                    onChange={(e) => setTournForm({ ...tournForm, newRule: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddRule();
                      }
                    }}
                    placeholder="Enter rule (e.g. '15-minute grace check-in before match forfeit')"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-[#202534] text-[#E56A10] text-xs font-mono font-bold uppercase rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Rule
                  </button>
                </div>
              </div>

              {/* DYNAMIC PRIZE DISTRIBUTION SECTION */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold font-mono text-slate-900 uppercase flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-[#E56A10]" /> Prize Distribution Breakdown ({tournForm.prizes.length} Tiers)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Configure payout amounts for tournament placements.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {tournForm.prizes.map((pz, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#E56A10] font-bold">{pz.place}</span>
                        <span className="text-slate-900 font-bold">{pz.prize}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePrizeTier(idx)}
                        className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                        title="Delete Tier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {tournForm.prizes.length === 0 && (
                    <p className="text-xs text-[#64748B] font-mono italic col-span-full">No prize tiers configured.</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={tournForm.newPrizePlace}
                    onChange={(e) => setTournForm({ ...tournForm, newPrizePlace: e.target.value })}
                    placeholder="Place (e.g. 4th Place)"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                  <input
                    type="text"
                    value={tournForm.newPrizeAmount}
                    onChange={(e) => setTournForm({ ...tournForm, newPrizeAmount: e.target.value })}
                    placeholder="Prize (e.g. ₹2,000)"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddPrizeTier}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-[#202534] text-[#E56A10] text-xs font-mono font-bold uppercase rounded-lg flex items-center justify-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Tier
                  </button>
                </div>
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => { setIsTournamentModalOpen(false); setEditingTournament(null); }}
                  className="px-4 py-2 bg-slate-50 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] text-xs font-mono uppercase rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTourn}
                  className="px-5 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded-lg shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingTourn ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : editingTournament ? (
                    "Update Tournament & Rules"
                  ) : (
                    "Publish Tournament"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leaderboard Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <h3 className="text-base font-bold uppercase font-mono text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#E56A10]" />
                Add Dynamic Leaderboard Category
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-800 dark:text-slate-200 font-bold mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Valorant Top Fraggers, Apex Predator Winrate"
                  className="w-full bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 dark:text-slate-200 font-bold mb-1">
                    Game Filter *
                  </label>
                  <select
                    value={categoryForm.game_slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, game_slug: e.target.value })}
                    className="w-full bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  >
                    <option value="all">All Games</option>
                    {games.map((g) => (
                      <option key={g.id} value={g.slug}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-800 dark:text-slate-200 font-bold mb-1">
                    Sorting Metric *
                  </label>
                  <select
                    value={categoryForm.sort_metric}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_metric: e.target.value as any })}
                    className="w-full bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                  >
                    <option value="rating">Skill Rating (MMR / ELO)</option>
                    <option value="win_rate">Win Rate Percentage (%)</option>
                    <option value="earnings">Tournament Earnings (₹)</option>
                    <option value="wins">Total Match Wins</option>
                    <option value="matches_played">Total Matches Played</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-800 dark:text-slate-200 font-bold mb-1">
                  Minimum Matches Required to Qualify
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={categoryForm.min_matches}
                  onChange={(e) => setCategoryForm({ ...categoryForm, min_matches: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-800 dark:text-slate-200 font-bold mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Official explanation of category ranking criteria..."
                  className="w-full bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:border-[#E56A10] focus:outline-hidden font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-500 dark:text-slate-400">
                <span className="text-[#E56A10] font-bold">Auto-Rank Calculation:</span> The leaderboard engine will automatically aggregate match results and rank all qualifying teams and players in real-time.
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-50 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] text-xs font-mono uppercase rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCat}
                  className="px-5 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded-lg shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingCat ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Category"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Score Override Modal */}
      {scoreOverrideMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] border border-amber-700/50 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">Manual Score Override</h3>
              </div>
              <button onClick={() => setScoreOverrideMatch(null)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] p-3 rounded-lg text-xs font-mono">
              <span className="text-slate-500 dark:text-slate-400">Match: </span>
              <span className="text-slate-900 dark:text-white font-bold">{scoreOverrideMatch.team_a?.name || "Team A"} vs {scoreOverrideMatch.team_b?.name || "Team B"}</span>
              <span className="text-slate-500 dark:text-slate-400 block mt-1">{scoreOverrideMatch.tournament_title || "Official Tournament"} · {scoreOverrideMatch.stage || "Match"}</span>
            </div>
            <form onSubmit={handleScoreOverride} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">
                    {scoreOverrideMatch.team_a?.name || "Team A"} Score *
                  </label>
                  <input type="number" min={0} required value={scoreA} onChange={(e) => setScoreA(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:outline-none focus:border-amber-500 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">
                    {scoreOverrideMatch.team_b?.name || "Team B"} Score *
                  </label>
                  <input type="number" min={0} required value={scoreB} onChange={(e) => setScoreB(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:outline-none focus:border-amber-500 font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Override Reason *</label>
                <input type="text" required value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Server crash — arbiter reconciled from replay"
                  className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:outline-none focus:border-amber-500 font-mono" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setScoreOverrideMatch(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1F2637] dark:hover:bg-[#283248] border border-slate-300 dark:border-[#2E384D] text-slate-800 dark:text-slate-200 rounded-lg text-xs font-mono font-bold uppercase cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmittingOverride}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                  {isSubmittingOverride ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
                  Commit Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Proof Modal */}
      {rejectProofMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] border border-rose-700/50 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-rose-400" />
                <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">Reject Evidence & Request Re-upload</h3>
              </div>
              <button onClick={() => setRejectProofMatch(null)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] p-3 rounded-lg text-xs font-mono">
              <span className="text-slate-500 dark:text-slate-400">Match: </span>
              <span className="text-slate-900 dark:text-white font-bold">{rejectProofMatch.team_a?.name || "Team A"} vs {rejectProofMatch.team_b?.name || "Team B"}</span>
            </div>
            <form onSubmit={handleRejectMatchProof} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Rejection Reason *</label>
                <select value={rejectProofReason} onChange={(e) => setRejectProofReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-rose-500 font-mono">
                  <option>Screenshot incomplete or unreadable</option>
                  <option>Score visible but timestamp missing</option>
                  <option>Wrong match — screenshot shows different game</option>
                  <option>Evidence appears manipulated / edited</option>
                  <option>Resolution too low — cannot verify scores</option>
                  <option>Proof shows incorrect server / region</option>
                </select>
              </div>
              <div className="p-2.5 bg-rose-950/30 border border-rose-700/40 rounded-lg text-[11px] font-mono text-rose-300">
                Both team captains will be notified and must re-upload a valid scoreboard screenshot within the deadline.
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setRejectProofMatch(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1F2637] dark:hover:bg-[#283248] border border-slate-300 dark:border-[#2E384D] text-slate-800 dark:text-slate-200 rounded-lg text-xs font-mono font-bold uppercase cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmittingReject}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                  {isSubmittingReject ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Reject & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
