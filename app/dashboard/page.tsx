'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Trophy,
  Users,
  Shield,
  Copy,
  Clock,
  ArrowRight,
  Wallet,
  Gamepad2,
  Calendar,
  UserPlus,
  Loader2,
  Settings,
  LogOut,
  UserMinus,
  Trash2,
  X,
  Check,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Download,
  CreditCard,
  Plus,
  Send,
  Eye,
  CheckCircle2,
  TrendingUp,
  Award,
  Bell,
  CheckCircle,
  Upload,
} from "lucide-react";
import { useUser, useAuth } from "@clerk/nextjs";
import { getCurrentUserProfile, updateUserProfile, UserProfile } from "@/lib/api/auth";
import {
  getMyTeams,
  createTeam,
  joinTeam,
  leaveTeam,
  disbandTeam,
  Team,
} from "@/lib/api/teams";
import { getTournaments, getMyTournamentRegistrations, Tournament } from "@/lib/api/tournaments";
import { getMatches, Match } from "@/lib/api/matches";
import {
  initFirstLaunchPersona,
  GAMING_AVATAR_PRESETS,
} from "@/lib/utils/gamingIdentity";
import { requestWithdrawal, depositFunds } from "@/lib/api/wallet";
import { submitPaymentUtr } from "@/lib/api/payments";
import { uploadImageFile } from "@/lib/api/media";
import { getGameRosterRequirement } from "@/lib/utils/gameRosters";

export default function DashboardPage() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // First Launch Notification
  const [firstLaunchNotification, setFirstLaunchNotification] = useState<string | null>(null);

  // Profile Edit Modal State (Steam ID and Riot ID removed as requested)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    display_name: "",
    username: "",
    avatar_url: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Wallet Modals (from previous dashboard)
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("500");
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  // UPI deposit step: null = amount selection, object = show UPI details & UTR form
  const [depositUpiStep, setDepositUpiStep] = useState<{
    payment_id: string;
    upi_id: string;
    payee_name: string;
    amount_inr: number;
    qr_url?: string;
    upi_uri: string;
  } | null>(null);
  const [depositUtrInput, setDepositUtrInput] = useState("");
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);

  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("1000");
  const [upiId, setUpiId] = useState("");
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);

  // Squad Modals (from previous dashboard)
  const [isCreateSquadOpen, setIsCreateSquadOpen] = useState(false);
  const [createSquadForm, setCreateSquadForm] = useState({
    name: "",
    game_slug: "valorant",
    tag: "",
  });
  const [isSubmittingSquad, setIsSubmittingSquad] = useState(false);

  const [isJoinSquadOpen, setIsJoinSquadOpen] = useState(false);
  const [joinInviteCode, setJoinInviteCode] = useState("");
  const [isJoiningSquad, setIsJoiningSquad] = useState(false);

  // Check user privileges
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || profile?.email?.toLowerCase() || "";
  const isHardcodedAdmin = userEmail === "pk.4081988@gmail.com" || userEmail === "admin@ametheus.gg";
  const effectiveRole = isHardcodedAdmin ? "SUPER_ADMIN" : (profile?.role || "PLAYER");
  const isSuperAdmin = isHardcodedAdmin || effectiveRole === "SUPER_ADMIN";
  const isOrganizer = isHardcodedAdmin || effectiveRole === "ORGANIZER" || isSuperAdmin;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, label = "Copied to clipboard") => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCode(text);
      showToast(label);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  // Load dashboard data & initialize first launch persona deterministically
  useEffect(() => {
    let isMounted = true;
    if (!isAuthLoaded) return;

    async function loadData() {
      setIsLoading(true);
      try {
        const [profileRes, teamsRes, tournRes, matchRes, myRegsRes] = await Promise.allSettled([
          getCurrentUserProfile(),
          getMyTeams(),
          getTournaments(),
          getMatches(),
          getMyTournamentRegistrations(),
        ]);

        let currentProf: UserProfile | null = null;
        if (profileRes.status === "fulfilled" && profileRes.value) {
          currentProf = profileRes.value;
        }

        // Authoritative identity: Ametheus DB profile is the single source of truth.
        // Only fall back to Clerk data when no DB profile exists at all.
        const clerkDisplayName = user?.fullName || user?.username || (user?.primaryEmailAddress?.emailAddress ? user.primaryEmailAddress.emailAddress.split("@")[0] : "");
        const clerkAvatar = user?.imageUrl || "";

        // Prefer Ametheus DB values; Clerk is fallback ONLY when profile is missing
        const effectiveDisplayName = currentProf?.display_name || clerkDisplayName || "Gamer";
        const effectiveAvatar = currentProf?.avatar_url || clerkAvatar || "";

        if (isMounted) {
          const resolvedProfile: UserProfile = currentProf || {
            id: user?.id || "usr_me",
            email: user?.primaryEmailAddress?.emailAddress || "",
            username: (user?.username || "").toLowerCase().replace(/\s+/g, "_") || "",
            display_name: effectiveDisplayName,
            avatar_url: effectiveAvatar,
            role: "PLAYER",
            inr_balance: "0.00",
          };

          setProfile(resolvedProfile);
          setProfileForm({
            display_name: effectiveDisplayName,
            username: resolvedProfile.username || "",
            avatar_url: effectiveAvatar,
          });

          const profileStorageKey = user?.id ? `ametheus_user_profile_${user.id}` : "ametheus_user_profile";

          try {
            localStorage.setItem(profileStorageKey, JSON.stringify(resolvedProfile));
            localStorage.setItem(
              user?.id ? `ametheus_gamer_identity_${user.id}` : "ametheus_gamer_identity",
              JSON.stringify({
                gamerTag: effectiveDisplayName,
                avatarUrl: effectiveAvatar,
                clanTag: "AMX",
                isNew: false,
              })
            );
          } catch {}

          // Teams: ONLY use DB data. Never fall back to localStorage — stale data causes phantom squads.
          if (teamsRes.status === "fulfilled" && Array.isArray(teamsRes.value)) {
            setTeams(teamsRes.value);
          } else {
            // API failed — show empty, not stale cached data
            setTeams([]);
          }

          if (tournRes.status === "fulfilled" && Array.isArray(tournRes.value)) {
            setTournaments(tournRes.value);
          }
          if (myRegsRes.status === "fulfilled" && Array.isArray(myRegsRes.value)) {
            setMyRegistrations(myRegsRes.value);
          } else {
            setMyRegistrations([]);
          }
          if (matchRes.status === "fulfilled" && Array.isArray(matchRes.value)) {
            setMatches(matchRes.value);
          }

          // Persona check: ONLY trigger random persona if unauthenticated or NO database profile and NO Clerk identity
          if (!isSignedIn && !currentProf && !clerkDisplayName && !clerkAvatar) {
            const autoPersona = initFirstLaunchPersona(undefined, undefined, user?.id, !!isSignedIn);
            if (autoPersona && autoPersona.isNew) {
              setFirstLaunchNotification(`Welcome to AMETHEUS! Your gaming persona @${autoPersona.gamerTag} has been assigned.`);
              updateUserProfile({
                display_name: autoPersona.gamerTag,
                avatar_url: autoPersona.avatarUrl,
              })
                .then((updated) => {
                  if (isMounted) {
                    setProfile(updated);
                    setProfileForm({
                      display_name: updated.display_name || autoPersona.gamerTag,
                      username: updated.username || "",
                      avatar_url: updated.avatar_url || autoPersona.avatarUrl,
                    });
                    try {
                      localStorage.setItem(profileStorageKey, JSON.stringify(updated));
                      window.dispatchEvent(new CustomEvent("ametheus:profile_updated", { detail: updated }));
                    } catch {}
                  }
                })
                .catch(() => {});
            }
          }
        }
      } catch (e) {
        console.warn("Dashboard sync error:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoaded, isSignedIn, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updatePayload: { display_name: string; avatar_url: string; username?: string } = {
        display_name: profileForm.display_name,
        avatar_url: profileForm.avatar_url,
      };
      // Only send username if the user has changed it from what's stored
      const currentUsername = profile?.username || "";
      if (profileForm.username && profileForm.username !== currentUsername) {
        updatePayload.username = profileForm.username;
      }
      const updated = await updateUserProfile(updatePayload);
      setProfile(updated);
      const profileStorageKey = user?.id ? `ametheus_user_profile_${user.id}` : "ametheus_user_profile";
      const identityStorageKey = user?.id ? `ametheus_gamer_identity_${user.id}` : "ametheus_gamer_identity";
      try {
        localStorage.setItem(profileStorageKey, JSON.stringify(updated));
        localStorage.setItem(
          identityStorageKey,
          JSON.stringify({
            gamerTag: updated.display_name,
            avatarUrl: updated.avatar_url,
            clanTag: "AMX",
            isNew: false,
          })
        );
        window.dispatchEvent(new CustomEvent("ametheus:profile_updated", { detail: updated }));
      } catch {}
      setIsEditProfileOpen(false);
      showToast("Profile settings saved successfully!");
    } catch (e: any) {
      showToast(e?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };


  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingDeposit(true);
    const amountInr = parseInt(depositAmount) || 500;
    if (amountInr < 50 || amountInr > 50000) {
      showToast("Deposit amount must be between ₹50 and ₹50,000.");
      setIsProcessingDeposit(false);
      return;
    }
    try {
      // Initiates a UPI payment — returns UPI account info, NOT a balance credit
      const res = await depositFunds(amountInr);
      // Move to UPI step: show QR / UPI ID and collect UTR reference
      setDepositUpiStep({
        payment_id: res.payment_id,
        upi_id: res.upi_id,
        payee_name: res.payee_name,
        amount_inr: res.amount_inr,
        qr_url: res.qr_url,
        upi_uri: res.upi_uri,
      });
      setDepositUtrInput("");
    } catch (err: any) {
      showToast(err?.message || "Failed to initiate deposit. Please try again.");
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const handleDepositUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositUpiStep) return;
    const cleanUtr = depositUtrInput.trim();
    if (cleanUtr.length < 6) {
      showToast("Please enter a valid UTR / UPI Transaction Reference (at least 6 characters).");
      return;
    }
    setIsSubmittingUtr(true);
    try {
      await submitPaymentUtr(depositUpiStep.payment_id, cleanUtr);
      showToast("Payment reference submitted! Wallet will be credited after admin verification.");
      setDepositUpiStep(null);
      setDepositUtrInput("");
      setIsDepositOpen(false);
      setDepositAmount("500");
    } catch (err: any) {
      showToast(err?.message || "Failed to submit UTR. Please try again.");
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const handleDepositModalClose = () => {
    setIsDepositOpen(false);
    setDepositUpiStep(null);
    setDepositUtrInput("");
    setDepositAmount("500");
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const deducted = parseFloat(withdrawAmount) || 0;
    // Re-compute safe balance for validation
    const currentBal = (() => {
      const raw = profile?.inr_balance;
      if (raw == null) return 0;
      const p = parseFloat(String(raw));
      return isNaN(p) ? 0 : p;
    })();
    if (deducted < 100) {
      showToast("Minimum withdrawal amount is ₹100.");
      return;
    }
    if (deducted > currentBal) {
      showToast(`Insufficient balance. Available: ₹${currentBal.toLocaleString()}`);
      return;
    }
    if (!upiId.includes("@")) {
      showToast("Please enter a valid UPI ID (e.g. name@oksbi)");
      return;
    }
    setIsProcessingWithdraw(true);
    try {
      const res = await requestWithdrawal({
        amount: deducted,
        amount_inr: deducted,
        upi_id: upiId.trim(),
        account_holder_name: profile?.display_name || user?.username || "Gamer",
      });
      // Update balance from authoritative backend response
      if (profile && typeof res.available_inr === "number") {
        setProfile({
          ...profile,
          inr_balance: String(res.available_inr),
        });
      }
      showToast(`Withdrawal request of ₹${deducted.toLocaleString()} submitted! Status: PENDING ADMIN APPROVAL`);
      setIsWithdrawOpen(false);
    } catch (err: any) {
      showToast(err?.message || "Failed to submit withdrawal request. Please try again.");
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createSquadForm.name) return;
    setIsSubmittingSquad(true);
    try {
      const tag = createSquadForm.tag || createSquadForm.name.slice(0, 4).toUpperCase();
      const newTeam = await createTeam({
        name: createSquadForm.name,
        game_slug: createSquadForm.game_slug,
        tag,
        captain_handle: profile?.display_name || user?.username || "Captain",
      });
      setTeams((prev) => [newTeam, ...prev]);
      setIsCreateSquadOpen(false);
      setCreateSquadForm({ name: "", game_slug: "valorant", tag: "" });
      showToast(`Squad "${newTeam.name}" created! Invite code: ${newTeam.invite_code}`);
    } catch (e: any) {
      showToast(e?.message || "Failed to create squad. Please try again.");
    } finally {
      setIsSubmittingSquad(false);
    }
  };

  const handleJoinSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInviteCode.trim()) return;
    setIsJoiningSquad(true);
    try {
      const joined = await joinTeam({
        invite_code: joinInviteCode.trim(),
        player_handle: profile?.display_name || user?.username || "Player",
      });
      setTeams((prev) => [joined, ...prev]);
      setIsJoinSquadOpen(false);
      setJoinInviteCode("");
      showToast(`Successfully joined squad "${joined.name}"!`);
    } catch (e: any) {
      showToast(e?.message || "Invalid squad invite code");
    } finally {
      setIsJoiningSquad(false);
    }
  };

  const exportMatchCsv = () => {
    const headers = "Match ID,Tournament,Opponent,Game,Outcome,Status\n";
    const completedRows = matches
      .filter((m) => m.status === "COMPLETED")
      .map((m) => {
        const myTeam = teams.find((t) => t.id === m.team_a_id || t.id === m.team_b_id);
        const opponent = myTeam?.id === m.team_a_id ? (m.team_b?.name || "—") : (m.team_a?.name || "—");
        const outcome = myTeam && m.winner_team_id === myTeam.id ? "VICTORY" : (m.winner_team_id ? "DEFEAT" : "NO RESULT");
        return `${m.id?.slice(-8) || ""},${m.tournament_title || "Match"},${opponent},,${outcome},Completed\n`;
      })
      .join("");
    const blob = new Blob([headers + completedRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ametheus-match-ledger-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Match ledger exported to CSV!");
  };

  // Authoritative identity: Ametheus MongoDB username > display_name > Clerk username
  const displayName = profile?.username || profile?.display_name || user?.username || user?.firstName || "Player";
  const userAvatar = profile?.avatar_url || user?.imageUrl || GAMING_AVATAR_PRESETS[0].url;
  // Safe balance: parse from inr_balance string, guard NaN explicitly
  const balance = (() => {
    const raw = profile?.inr_balance;
    if (raw == null) return 0;
    const parsed = parseFloat(String(raw));
    return isNaN(parsed) ? 0 : parsed;
  })();
  const ametheusId = profile?.id ? `ATH-${profile.id.slice(-6).toUpperCase()}` : user?.id ? `ATH-${user.id.slice(-6).toUpperCase()}` : "ATH-READY";

  // Calculate real performance metrics from matches
  const completedMatches = matches.filter((m) => m.status === "COMPLETED");
  const wins = completedMatches.filter((m) => {
    const myTeam = teams.find((t) => t.id === m.team_a_id || t.id === m.team_b_id);
    return myTeam && m.winner_team_id === myTeam.id;
  }).length;
  const losses = completedMatches.length - wins;
  const winRate = completedMatches.length > 0 ? ((wins / completedMatches.length) * 100).toFixed(1) : "0.0";
  const eloRating = 1500 + wins * 25;

  return (
    <div className="flex flex-col w-full bg-[#F8F9FF] dark:bg-[#0B0E16] min-h-screen text-[#0B1C30] dark:text-slate-100 antialiased transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#10141F] text-white border border-[#E56A10] px-5 py-3 rounded-lg shadow-2xl flex items-center gap-2.5 font-mono text-xs animate-bounce">
          <Sparkles className="w-4 h-4 text-[#E56A10]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* First Launch Identity Welcome Notice */}
      {firstLaunchNotification && (
        <div className="w-full bg-[#10141F] text-white border-b border-[#242C3D] py-3 px-4 md:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#E56A10] animate-ping" />
              <span className="font-bold text-[#E56A10]">FIRST LAUNCH IDENTITY:</span>
              <span className="text-[#CBD5E1]">{firstLaunchNotification}</span>
            </div>
            <button
              onClick={() => setFirstLaunchNotification(null)}
              className="text-[#94A3B8] hover:text-white text-xs font-mono cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Sub-Header Navigation Bar */}
      <div className="w-full bg-white dark:bg-[#0F131D] border-b border-slate-200 dark:border-[#242C3D] py-3 px-4 md:px-8 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-[#E56A10] transition-colors">
              HOME
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold uppercase">COMPETITIVE DASHBOARD</span>
          </div>

          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <Link
                href="/admin"
                className="px-2.5 py-1 bg-[#E56A10]/10 border border-[#E56A10]/40 text-[#E56A10] hover:bg-[#E56A10] hover:text-white rounded font-bold uppercase text-[11px] transition-all flex items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5" /> Admin Cockpit
              </Link>
            )}
            {isOrganizer && (
              <Link
                href="/organizer"
                className="px-2.5 py-1 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#1E2538] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#242C3D] rounded font-bold uppercase text-[11px] transition-all flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5 text-[#E56A10]" /> Organizer Hub
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Dashboard Container */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 space-y-6">

        {/* 1. TOP WELCOME & METRIC SECTION (Stitch Spec) */}
        <div className="bg-white dark:bg-[#121622] rounded-xl p-6 shadow-xs border border-slate-200 dark:border-[#242C3D] space-y-5 transition-colors">
          {/* User ID Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#242C3D]">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#161A24] border-2 border-slate-200 dark:border-[#242C3D] relative shadow-sm">
                  <Image
                    src={userAvatar}
                    alt={displayName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#121622] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold font-headline text-slate-900 dark:text-white uppercase tracking-tight">
                    {displayName}
                  </h1>
                  <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/40 text-[#E56A10] font-mono text-[11px] font-bold uppercase">
                    {effectiveRole}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    MATCH READY
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    Ametheus ID: <span className="font-bold text-slate-900 dark:text-white">{ametheusId}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start lg:self-center">
              <button
                onClick={() => setIsDepositOpen(true)}
                className="px-5 py-2.5 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-headline text-xs font-bold uppercase rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                Deposit Funds
              </button>

              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="p-2.5 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#1E2538] text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-[#242C3D]"
                title="Edit Gamer Profile"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Ribbon (4 Cards — Active Squad removed per design spec) */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Metric 1: Total Earnings */}
            <div className="bg-[#EFF4FF] dark:bg-[#161A24] p-4 rounded-xl flex flex-col justify-between border border-blue-100/60 dark:border-[#242C3D] hover:border-blue-200 dark:hover:border-[#E56A10] transition-colors">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Prize Winnings</span>
                <Trophy className="w-4 h-4 text-[#E56A10]" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold font-headline text-slate-900 dark:text-white tabular-nums">
                  ₹0
                </div>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-0.5">
                  <span>Season 2026</span>
                </div>
              </div>
            </div>

            {/* Metric 2: Win Rate */}
            <div className="bg-[#EFF4FF] dark:bg-[#161A24] p-4 rounded-xl flex flex-col justify-between border border-blue-100/60 dark:border-[#242C3D] hover:border-blue-200 dark:hover:border-[#E56A10] transition-colors">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Competitive WR</span>
                <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold font-headline text-slate-900 dark:text-white tabular-nums">
                  {winRate}%
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-0.5">
                  <span className="text-slate-900 dark:text-white font-bold">{wins}W</span> • {losses}L
                </div>
              </div>
            </div>

            {/* Metric 3: Matches Played (real DB data) */}
            <div className="bg-[#EFF4FF] dark:bg-[#161A24] p-4 rounded-xl flex flex-col justify-between border border-blue-100/60 dark:border-[#242C3D] hover:border-blue-200 dark:hover:border-[#E56A10] transition-colors">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Matches Played</span>
                <Gamepad2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold font-headline text-slate-900 dark:text-white tabular-nums">
                  {completedMatches.length}
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-0.5">
                  {completedMatches.length === 0 ? "No matches yet" : `${wins} wins · ${losses} losses`}
                </div>
              </div>
            </div>

            {/* Metric 4: Available Wallet Balance */}
            <div className="bg-amber-50/70 dark:bg-amber-950/20 p-4 rounded-xl flex flex-col justify-between border border-amber-200/60 dark:border-amber-800/40 transition-colors">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E56A10]">
                  Available Balance
                </span>
                <Wallet className="w-4 h-4 text-[#E56A10]" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold font-headline text-slate-900 dark:text-white tabular-nums">
                  ₹{balance.toLocaleString()}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Instant tournament entry</span>
                  <button
                    onClick={() => setIsWithdrawOpen(true)}
                    className="text-[#E56A10] hover:text-[#C95B0A] font-mono text-[11px] uppercase font-bold cursor-pointer hover:underline"
                  >
                    Withdraw →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* 2. URGENT CHECK-IN CARD — only shown when there is a real CHECK_IN_OPEN match */}
        {matches.filter((m) => m.status === "CHECK_IN_OPEN").map((m) => (
          <div key={m.id} className="bg-[#10141F] text-white rounded-xl p-6 shadow-xl border border-[#242C3D] relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#E56A10] rounded-full blur-3xl opacity-20 pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded bg-[#E56A10] text-white font-mono text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    CHECK-IN OPEN
                  </span>
                  <span className="text-[#64748B]">•</span>
                  <span className="font-mono text-xs uppercase text-[#94A3B8]">
                    {m.stage || "Competitive Match"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-headline text-white tracking-tight uppercase">
                  {m.tournament_title || "Official Match"}
                </h2>
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-1 font-mono text-xs text-[#CBD5E1]">
                  {m.team_a?.name && m.team_b?.name && (
                    <div className="flex items-center gap-1">
                      <span className="text-[#94A3B8]">Versus:</span>
                      <span className="font-bold text-orange-300">{m.team_b?.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
                <Link
                  href={`/matches/${m.id}`}
                  className="px-6 py-3 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-headline text-xs font-bold uppercase rounded-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-center"
                >
                  <Gamepad2 className="w-4 h-4" />
                  Enter Match Lobby
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* 3. MAIN 2-COLUMN BALANCED OPERATIONAL GRID (8 cols left / 4 cols right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: Registered Tournaments & Match History (~65% = 8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* SECTION: Upcoming Registered Tournaments */}
            <div className="bg-white dark:bg-[#121622] rounded-xl p-6 shadow-xs border border-slate-200 dark:border-[#242C3D] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#242C3D]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#E56A10]" />
                  <h3 className="font-headline text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    Registered Tournaments
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-[#161A24] text-slate-600 dark:text-slate-400 font-mono text-[11px] font-bold uppercase border border-transparent dark:border-[#242C3D]">
                  {myRegistrations.length === 1 ? "1 ENTRY" : `${myRegistrations.length} ENTRIES`}
                </span>
              </div>

              {myRegistrations.length === 0 ? (
                <div className="bg-slate-50 dark:bg-[#161A24] p-8 rounded-xl border border-slate-200 dark:border-[#242C3D] text-center space-y-2">
                  <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-headline">No Registered Tournaments</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Browse open tournaments and register your team to compete.
                  </p>
                  <Link href="/tournaments" className="inline-block mt-2 px-4 py-1.5 rounded-lg bg-[#E56A10] hover:bg-[#C95B0A] text-white font-mono text-xs font-bold uppercase transition-colors">
                    Browse Tournaments
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myRegistrations.map((reg) => (
                    <div
                      key={reg.id || reg._id}
                      className="bg-slate-50 dark:bg-[#161A24] p-4 rounded-xl border border-slate-200 dark:border-[#242C3D] flex flex-col justify-between space-y-3 hover:border-[#E56A10] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold uppercase">
                            {reg.payment_status === "PAID" || reg.payment_status === "FREE" ? "CONFIRMED" : reg.payment_status || "REGISTERED"}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {reg.check_in_status || "PENDING CHECK-IN"}
                          </span>
                        </div>
                        <h4 className="font-headline font-bold text-slate-900 dark:text-white text-base truncate">
                          {reg.tournament_title || "Official Tournament"}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {reg.team_name ? `Squad: ${reg.team_name}` : "Solo Player Entry"}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 dark:border-[#242C3D] flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {reg.starts_at || "Schedule in bracket"}
                        </span>
                        <Link
                          href={`/tournaments/${reg.tournament_slug || reg.tournament_id}`}
                          className="text-[#E56A10] hover:text-[#C95B0A] font-mono text-xs font-bold uppercase flex items-center gap-1"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION: Recent Match History */}
            <div className="bg-white dark:bg-[#121622] rounded-xl p-6 shadow-xs border border-slate-200 dark:border-[#242C3D] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#242C3D]">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#E56A10]" />
                  <h3 className="font-headline text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    Recent Match Logs
                  </h3>
                </div>
                <button
                  onClick={exportMatchCsv}
                  className="font-mono text-xs uppercase text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-bold cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Log
                </button>
              </div>

              {matches.filter((m) => m.status === "COMPLETED").length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-[#161A24] text-slate-600 dark:text-slate-400 font-mono uppercase text-[11px]">
                        <th className="py-2.5 px-3 rounded-l-lg">Match</th>
                        <th className="py-2.5 px-3">Opponent</th>
                        <th className="py-2.5 px-3">Outcome</th>
                        <th className="py-2.5 px-3 text-right rounded-r-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#242C3D] font-medium">
                      {matches.filter((m) => m.status === "COMPLETED").slice(0, 10).map((m) => {
                        const myTeam = teams.find((t) => t.id === m.team_a_id || t.id === m.team_b_id);
                        const isWin = myTeam && m.winner_team_id === myTeam.id;
                        return (
                          <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-[#161A24]/60 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-headline font-bold text-slate-900 dark:text-white">{m.tournament_title || "Match"}</div>
                              <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">#{m.id?.slice(-8)?.toUpperCase()}</span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-200">
                              {myTeam?.id === m.team_a_id ? (m.team_b?.name || "—") : (m.team_a?.name || "—")}
                            </td>
                            <td className="py-3 px-3">
                              {m.winner_team_id ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                  isWin
                                    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400"
                                    : "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400"
                                }`}>
                                  {isWin ? "VICTORY" : "DEFEAT"}
                                </span>
                              ) : (
                                <span className="font-mono text-slate-400 text-[10px]">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                <CheckCircle className="w-3.5 h-3.5" /> Completed
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-[#161A24] p-8 rounded-xl border border-slate-200 dark:border-[#242C3D] text-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-headline">No Match History Yet</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Completed matches will appear here once you play.
                  </p>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-[#161A24] p-3 rounded-lg flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#242C3D]">
                <Sparkles className="w-4 h-4 text-[#E56A10]" />
                <span>Match results are verified by the Ametheus referee system.</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Active Squads, Escrow Wallet & Telemetry (~35% = 4 cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* SECTION: My Teams & Game Rosters */}
            <div className="bg-white dark:bg-[#121622] rounded-xl p-5 shadow-xs border border-slate-200 dark:border-[#242C3D] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#242C3D]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#E56A10]" />
                  <h3 className="font-headline text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    My Game Rosters
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                  {teams.length} {teams.length !== 1 ? "Teams" : "Team"}
                </span>
              </div>

              {/* Squad List */}
              <div className="space-y-2.5">
                {teams.length > 0 ? (
                  teams.map((squad) => {
                    const gameSlug = squad.game_slug || (squad as any).gameSlug || "valorant";
                    const inviteCode = squad.invite_code || (squad as any).inviteCode || "AMX001";
                    const rosterReq = getGameRosterRequirement(gameSlug);
                    const memberCount = Array.isArray(squad.members) ? squad.members.length : 1;
                    const isFull = memberCount >= rosterReq.max;
                    const isCaptain = squad.captain_id === user?.id || squad.captain_username === (profile?.display_name || user?.username);

                    return (
                      <div key={squad.id || inviteCode} className="bg-slate-50 dark:bg-[#161A24] p-3 rounded-lg border border-slate-200 dark:border-[#242C3D] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-headline text-sm font-bold text-slate-900 dark:text-white">
                              {squad.name}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                              isCaptain ? "bg-[#E56A10] text-white" : "bg-slate-200 dark:bg-[#202636] text-slate-700 dark:text-slate-300"
                            }`}>
                              {isCaptain ? "CAPTAIN" : "MEMBER"}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                            {gameSlug}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            <span className={`w-2 h-2 rounded-full ${isFull ? "bg-emerald-500" : "bg-[#E56A10]"}`} />
                            <span>
                              {memberCount}/{rosterReq.max} {rosterReq.formatName} {isFull ? "• Full" : `• ${rosterReq.max - memberCount} Needed`}
                            </span>
                          </div>

                          <div className="flex items-center bg-white dark:bg-[#202636] border border-slate-300 dark:border-[#242C3D] px-2 py-0.5 rounded gap-1">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-wider">
                              {inviteCode}
                            </span>
                            <button
                              onClick={() => copyToClipboard(inviteCode, `Squad Code "${inviteCode}" copied!`)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                              title="Copy permanent squad code"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-slate-50 dark:bg-[#161A24] p-6 rounded-lg border border-slate-200 dark:border-[#242C3D] text-center space-y-2">
                    <Users className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-headline">No Game Rosters</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Teams are game-specific rosters. Create or join a team for a game discipline. Registration is free.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Squad Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setIsCreateSquadOpen(true)}
                  className="py-2 px-3 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#202636] text-slate-900 dark:text-white font-mono text-[11px] font-bold uppercase rounded-lg border border-slate-300 dark:border-[#242C3D] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Squad
                </button>
                <button
                  onClick={() => setIsJoinSquadOpen(true)}
                  className="py-2 px-3 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#202636] text-slate-900 dark:text-white font-mono text-[11px] font-bold uppercase rounded-lg border border-slate-300 dark:border-[#242C3D] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  Join via Code
                </button>
              </div>
            </div>

            {/* SECTION: Escrow Wallet & Quick Payout */}
            <div className="bg-white dark:bg-[#121622] rounded-xl p-5 shadow-xs border border-slate-200 dark:border-[#242C3D] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#242C3D]">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#E56A10]" />
                  <h3 className="font-headline text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    Escrow Wallet
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 font-mono text-[10px] font-bold">
                  100% SECURE
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-[#161A24] p-4 rounded-xl border border-slate-200 dark:border-[#242C3D] space-y-3">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase">Available Balance</span>
                    <div className="text-2xl font-bold font-headline text-slate-900 dark:text-white tabular-nums">
                      ₹{balance.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase">Locked in Escrow</span>
                    <div className="text-base font-bold font-headline text-[#E56A10] tabular-nums">
                      ₹0
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => setIsWithdrawOpen(true)}
                    className="w-full py-2.5 bg-slate-900 dark:bg-[#E56A10] hover:bg-slate-800 dark:hover:bg-[#C95B0A] text-white font-headline text-xs font-bold uppercase rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-[#E56A10] dark:text-white" />
                    Request Withdrawal (Admin Approved)
                  </button>

                  <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-2">
                    <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Connected UPI: <strong className="text-slate-800 dark:text-slate-200">{upiId || "Not Connected"}</strong></span>
                  </div>
                </div>
              </div>

              {/* Mini Transaction Ledger */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">Recent Ledger</span>
                <div className="bg-slate-50 dark:bg-[#161A24] p-4 rounded-lg border border-slate-200 dark:border-[#242C3D] text-center">
                  <span className="font-mono text-xs text-slate-400 dark:text-slate-500">No recent transactions</span>
                </div>
              </div>
            </div>

            {/* SECTION: Platform Telemetry & Live Alerts */}
            <div className="bg-white dark:bg-[#121622] rounded-xl p-5 shadow-xs border border-slate-200 dark:border-[#242C3D] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#242C3D]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#E56A10]" />
                  <h3 className="font-headline text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    Platform Telemetry
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">Live</span>
              </div>

              <div className="bg-slate-50 dark:bg-[#161A24] p-4 rounded-lg border border-slate-200 dark:border-[#242C3D] text-center">
                <span className="font-mono text-xs text-slate-400 dark:text-slate-500">All systems normal • No active alerts</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL 1: Edit Profile Modal (Steam ID and Riot ID removed as requested) */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121622] rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-[#242C3D] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#E56A10]" />
                <h3 className="font-headline font-bold text-lg text-slate-900 dark:text-white uppercase">
                  Edit Gamer Identity
                </h3>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase font-bold text-slate-900 dark:text-slate-300 mb-1">
                  Gamer Handle / Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.display_name}
                  onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                  placeholder="e.g. VORTEX_KID"
                  className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-slate-900 dark:text-slate-300 mb-1">
                  Username (Unique @handle)
                </label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_\-.]/g, "") })}
                  placeholder={profile?.username || "e.g. vortex_kid"}
                  minLength={3}
                  maxLength={30}
                  className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10] font-mono"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                  3–30 chars. Letters, numbers, underscores, hyphens, dots only. Must be unique.
                </p>
              </div>

              {/* Keep / Restore Account Profile Picture Option */}
              {user?.imageUrl && (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 dark:border-[#242C3D] relative shrink-0">
                      <Image
                        src={user.imageUrl}
                        alt="Account profile picture"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-headline">Original Account Picture</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Keep picture from your login account</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm({ ...profileForm, avatar_url: user.imageUrl });
                      showToast("Selected account profile picture!");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${
                      profileForm.avatar_url === user.imageUrl
                        ? "bg-[#E56A10] text-white border-[#E56A10]"
                        : "bg-white dark:bg-[#202636] text-slate-800 dark:text-slate-200 border-slate-300 dark:border-[#242C3D] hover:border-[#E56A10] hover:text-[#E56A10]"
                    }`}
                  >
                    {profileForm.avatar_url === user.imageUrl ? "Active" : "Use Account Picture"}
                  </button>
                </div>
              )}

              {/* Direct File Upload to DB */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#161A24] border border-slate-200 dark:border-[#242C3D] rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 dark:border-[#242C3D] relative shrink-0 bg-white dark:bg-[#202636] flex items-center justify-center">
                    {profileForm.avatar_url ? (
                      <Image
                        src={profileForm.avatar_url}
                        alt="Custom avatar"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Upload className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white font-headline">Upload Custom Avatar</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Upload image directly to DB (PNG, JPG, WEBP)</div>
                  </div>
                </div>
                <label className="px-3 py-1.5 bg-slate-900 dark:bg-[#E56A10] hover:bg-slate-800 dark:hover:bg-[#C95B0A] text-white rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 shrink-0">
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      <span>Upload File</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingAvatar}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsUploadingAvatar(true);
                        try {
                          const res = await uploadImageFile(file);
                          setProfileForm((prev) => ({ ...prev, avatar_url: res.url }));
                          showToast("Avatar uploaded and saved to DB!");
                        } catch {
                          showToast("Failed to upload image");
                        } finally {
                          setIsUploadingAvatar(false);
                        }
                      }
                    }}
                  />
                </label>
              </div>

              {/* Avatar Preset Selection */}
              <div>
                <label className="block text-xs font-mono uppercase font-bold text-slate-900 dark:text-slate-300 mb-1.5">
                  Or Choose Esports Gaming Avatar
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {GAMING_AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, avatar_url: preset.url })}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        profileForm.avatar_url === preset.url
                          ? "border-[#E56A10] ring-2 ring-[#E56A10]/30 scale-95"
                          : "border-slate-200 dark:border-[#242C3D] hover:border-slate-400 dark:hover:border-slate-500"
                      }`}
                    >
                      <Image
                        src={preset.url}
                        alt={preset.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#161A24] rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#242C3D]">
                <span className="text-[#E56A10] font-bold">Tournament Notice:</span> In-game credentials (Riot ID, Steam ID) are requested directly when entering tournament brackets.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#202636] text-slate-700 dark:text-slate-300 border border-transparent dark:border-[#242C3D] text-xs font-mono uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white text-xs font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Identity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Deposit Funds (UPI Flow) */}
      {isDepositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121622] rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-[#242C3D] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#E56A10]" />
                <h3 className="font-headline font-bold text-lg text-slate-900 dark:text-white uppercase">
                  {depositUpiStep ? "Complete UPI Payment" : "Add Money to Wallet"}
                </h3>
              </div>
              <button
                onClick={handleDepositModalClose}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!depositUpiStep ? (
              /* Step 1: Select amount */
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-slate-900 dark:text-slate-300 mb-1">
                    Select Amount (₹ INR) *
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {["200", "500", "1000", "2500"].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                          depositAmount === amt
                            ? "bg-[#E56A10] text-white border-[#E56A10]"
                            : "bg-white dark:bg-[#161A24] text-slate-800 dark:text-slate-200 border-slate-300 dark:border-[#242C3D] hover:bg-slate-100 dark:hover:bg-[#202636]"
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={50}
                    max={50000}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-xs font-mono text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2">
                  <Shield className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <span>Pay via UPI to our account. Submit your UTR reference after payment. Wallet is credited after admin verification.</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDepositModalClose}
                    className="px-4 py-2 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#202636] border border-slate-300 dark:border-[#242C3D] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingDeposit}
                    className="px-5 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white text-xs font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingDeposit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                    Get UPI Payment Details
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Show UPI details and collect UTR */
              <form onSubmit={handleDepositUtrSubmit} className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-[#161A24] rounded-xl border border-slate-200 dark:border-[#242C3D] space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 dark:text-slate-400 uppercase font-bold">Amount to Pay</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">₹{depositUpiStep.amount_inr.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-[#242C3D] pt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 dark:text-slate-400 uppercase">Pay To (UPI ID)</span>
                      <span className="font-bold text-slate-900 dark:text-white">{depositUpiStep.upi_id}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 dark:text-slate-400 uppercase">Payee Name</span>
                      <span className="font-bold text-slate-900 dark:text-white">{depositUpiStep.payee_name}</span>
                    </div>
                  </div>
                  {depositUpiStep.upi_uri && (
                    <a
                      href={depositUpiStep.upi_uri}
                      className="block w-full text-center py-2 mt-1 bg-[#E56A10] hover:bg-[#C95B0A] text-white font-mono text-xs font-bold uppercase rounded-lg transition-colors"
                    >
                      Open in UPI App
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-slate-900 dark:text-slate-300 mb-1">
                    UPI Transaction Reference (UTR) *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    placeholder="e.g. 422345678901"
                    value={depositUtrInput}
                    onChange={(e) => setDepositUtrInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                    Found in your UPI app under transaction details or SMS confirmation.
                  </p>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs font-mono text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <span>After submitting your UTR, admin will verify the payment and credit your wallet. This usually takes up to 30 minutes.</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setDepositUpiStep(null); setDepositUtrInput(""); }}
                    className="px-4 py-2 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#202636] border border-slate-300 dark:border-[#242C3D] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingUtr}
                    className="px-5 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white text-xs font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingUtr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Submit UTR Reference
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Instant Withdrawal */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121622] rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-[#242C3D] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#E56A10]" />
                <h3 className="font-headline font-bold text-lg text-slate-900 dark:text-white uppercase">
                  Request Wallet Withdrawal
                </h3>
              </div>
              <button
                onClick={() => setIsWithdrawOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase font-bold text-slate-900 dark:text-slate-300 mb-1">
                  Withdrawal Amount (Available: ₹{balance.toLocaleString()}) *
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Min ₹100"
                  className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-slate-900 dark:text-slate-300 mb-1">
                  Destination UPI ID / VPA *
                </label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. user@oksbi"
                  className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-200 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
                <Shield className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide text-[11px]">
                    Admin Approval Required Before Payout
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                    To maintain fair play security and prevent unauthorized balance drain, all withdrawal requests are manually reviewed and certified by platform admins before IMPS/UPI disbursement.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#202636] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer border border-slate-300 dark:border-[#242C3D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingWithdraw}
                  className="px-5 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white text-xs font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isProcessingWithdraw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit Withdrawal Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Create Squad */}
      {isCreateSquadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121622] rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-[#242C3D] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#E56A10]" />
                <h3 className="font-headline font-bold text-lg text-slate-900 dark:text-white uppercase">
                  Register Competitive Squad
                </h3>
              </div>
              <button
                onClick={() => setIsCreateSquadOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSquad} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase font-bold text-slate-900 dark:text-slate-300 mb-1">
                  Squad Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Predators"
                  value={createSquadForm.name}
                  onChange={(e) => setCreateSquadForm({ ...createSquadForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-slate-900 dark:text-slate-300 mb-1">
                    Game Discipline
                  </label>
                  <select
                    value={createSquadForm.game_slug}
                    onChange={(e) => setCreateSquadForm({ ...createSquadForm, game_slug: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  >
                    <option value="valorant">Valorant</option>
                    <option value="counter-strike-2">Counter-Strike 2</option>
                    <option value="bgmi">BGMI</option>
                    <option value="smash-karts">Smash Karts</option>
                    <option value="mini-militia">Mini Militia</option>
                    <option value="chess">Chess</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-slate-900 dark:text-slate-300 mb-1">
                    Tag (3-4 chars)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. APEX"
                    value={createSquadForm.tag}
                    onChange={(e) => setCreateSquadForm({ ...createSquadForm, tag: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
              </div>

              {/* Dynamic Game Roster Info */}
              {(() => {
                const req = getGameRosterRequirement(createSquadForm.game_slug);
                return (
                  <div className="p-3 bg-slate-50 dark:bg-[#161A24] rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#242C3D] flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Required Squad Lineup:</span>
                    <span className="font-bold text-[#E56A10] bg-[#E56A10]/10 px-2 py-0.5 rounded border border-[#E56A10]/30">{req.label}</span>
                  </div>
                );
              })()}

              <div className="p-3 bg-slate-50 dark:bg-[#161A24] rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#242C3D]">
                You will be assigned as Squad Captain and receive a unique invite code to share with teammates.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateSquadOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#202636] border border-slate-300 dark:border-[#242C3D] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSquad}
                  className="px-5 py-2 bg-[#E56A10] hover:bg-[#C95B0A] text-white text-xs font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isSubmittingSquad ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Join Squad via Code */}
      {isJoinSquadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121622] rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-[#242C3D] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#242C3D] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#E56A10]" />
                <h3 className="font-headline font-bold text-lg text-slate-900 dark:text-white uppercase">
                  Join Squad via Code
                </h3>
              </div>
              <button
                onClick={() => setIsJoinSquadOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinSquad} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase font-bold text-slate-900 dark:text-slate-300 mb-1">
                  Squad Invite Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VTX882 or MM88XK"
                  value={joinInviteCode}
                  onChange={(e) => setJoinInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white dark:bg-[#161A24] border border-slate-300 dark:border-[#242C3D] rounded-lg text-sm text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#161A24] rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#242C3D]">
                Ask your squad captain for their 6-character squad code. Joining links your player profile to their competitive tournament roster.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinSquadOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#161A24] hover:bg-slate-200 dark:hover:bg-[#202636] border border-slate-300 dark:border-[#242C3D] text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoiningSquad}
                  className="px-5 py-2 bg-slate-900 dark:bg-[#E56A10] hover:bg-slate-800 dark:hover:bg-[#C95B0A] text-white text-xs font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isJoiningSquad ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                  Join Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadDocIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
