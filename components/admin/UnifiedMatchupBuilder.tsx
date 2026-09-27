"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Users,
  Radio,
  Tv,
  Plus,
  Loader2,
  CheckCircle,
  Play,
  Edit3,
  Trash2,
  Sliders,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Shield,
  Layers,
  Clock,
  Sparkles,
  ArrowRight,
  Lock,
  Bell,
  Key,
  MessageSquare,
  Link2,
  Send,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import {
  getTournamentRegisteredRosters,
  TournamentRegisteredRostersResponse,
  RegisteredRosterTeam,
  createMatchAdmin,
  updateMatchDetailsAdmin,
  deleteMatchAdmin,
  markMatchLiveAdmin,
  completeMatchAdmin,
  updateTournamentFormat,
  updateTournamentStream,
  addTournamentRound,
  updateTournamentCommunity,
  updateMatchJoinInfo,
  triggerMatchReminder,
  closeTournamentRegistration,
  getBattleRoyaleCalculation,
  generateBattleRoyaleMatches,
  rebalanceBattleRoyaleMatches,
  BattleRoyaleCalculationResponse,
  BattleRoyalePreviewMatch,
} from "@/lib/api/admin";
import { Tournament } from "@/lib/api/tournaments";

interface MatchItem {
  id: string;
  tournament_id: string;
  round_name?: string;
  round_number?: number;
  match_number?: number;
  match_type?: string;
  stage?: string;
  format?: string;
  series_format?: string;
  youtube_live_url?: string;
  status: string;
  scheduled_time?: string;
  scheduled_at?: string;
  team_a_id?: string;
  team_b_id?: string;
  team_a_name?: string;
  team_b_name?: string;
  team_a_placeholder?: string;
  team_b_placeholder?: string;
  score_a?: number;
  score_b?: number;
  winner_team_id?: string;
  games?: any[];
  team_a?: { id?: string; name: string; tag: string; score?: number } | null;
  team_b?: { id?: string; name: string; tag: string; score?: number } | null;
  join_info_enabled?: boolean;
  join_info?: Record<string, string>;
  match_message?: string;
  sent_reminders?: string[];
  next_match_id?: string;
  next_match_slot?: string;
  advancement_label?: string;
  teams?: any[];
  team_ids?: string[];
  room_capacity?: number;
  players_per_team?: number;
  max_teams?: number;
}

interface Props {
  tournaments: Tournament[];
  selectedTournamentId: string;
  onSelectTournament: (id: string) => void;
  matches: MatchItem[];
  onRefreshMatches: () => Promise<void>;
}

const CORE_FORMATS = [
  "Knockout",
  "Round Robin",
  "Combination",
  "Swiss System",
  "Ladder Tournament",
  "Battle Royale",
];

const DEFAULT_ROUNDS = [
  "Round 1",
];

const REMINDER_TYPES = [
  { id: "1_WEEK", label: "1 Week Before" },
  { id: "2_DAYS", label: "2 Days Before" },
  { id: "1_DAY", label: "1 Day Before" },
  { id: "15_MINUTES", label: "15 Minutes Before" },
  { id: "10_MINUTES", label: "10 Minutes Before" },
  { id: "STARTING_NOW", label: "Starting Now" },
  { id: "STARTED", label: "Match Started" },
];

const OPTION_CLASS = "bg-white text-slate-900 dark:bg-[#161B26] dark:text-slate-100 font-sans";

export default function UnifiedMatchupBuilder({
  tournaments,
  selectedTournamentId,
  onSelectTournament,
  matches,
  onRefreshMatches,
}: Props) {
  const currentTournament = useMemo(
    () => tournaments.find((t) => t.id === selectedTournamentId),
    [tournaments, selectedTournamentId]
  );

  const [rostersData, setRostersData] = useState<TournamentRegisteredRostersResponse | null>(null);
  const [isLoadingRosters, setIsLoadingRosters] = useState(false);

  // Tournament Livestream Bar
  const [streamUrl, setStreamUrl] = useState("");
  const [isSavingStream, setIsSavingStream] = useState(false);

  // Community Link State (Only Discord OR WhatsApp)
  const [communityPlatform, setCommunityPlatform] = useState<"DISCORD" | "WHATSAPP">("DISCORD");
  const [communityLink, setCommunityLink] = useState("");
  const [isSavingCommunity, setIsSavingCommunity] = useState(false);

  // Format Switch State
  const [selectedFormat, setSelectedFormat] = useState("Knockout");
  const [isUpdatingFormat, setIsUpdatingFormat] = useState(false);

  // Battle Royale Specific State
  const [builderMode, setBuilderMode] = useState<"HEAD_TO_HEAD" | "BATTLE_ROYALE">("HEAD_TO_HEAD");
  const [brCalcData, setBrCalcData] = useState<BattleRoyaleCalculationResponse | null>(null);
  const [isLoadingBRCalc, setIsLoadingBRCalc] = useState(false);
  const [isGeneratingBR, setIsGeneratingBR] = useState(false);
  const [isRebalancingBR, setIsRebalancingBR] = useState(false);
  const [brBalanced, setBrBalanced] = useState(false);
  const [localBRDistribution, setLocalBRDistribution] = useState<BattleRoyalePreviewMatch[]>([]);

  // Close Registration Modal
  const [isCloseRegModalOpen, setIsCloseRegModalOpen] = useState(false);
  const [isClosingReg, setIsClosingReg] = useState(false);

  // Active Round Selection
  const [activeRound, setActiveRound] = useState("Round 1");
  const [customRounds, setCustomRounds] = useState<string[]>([]);
  const [newRoundInput, setNewRoundInput] = useState("");
  const [isAddingRound, setIsAddingRound] = useState(false);

  // Match Creation Modal
  const [isAddMatchModalOpen, setIsAddMatchModalOpen] = useState(false);
  const [addMatchRound, setAddMatchRound] = useState("Round 1");
  const [addTeamAMode, setAddTeamAMode] = useState<"TEAM" | "PLACEHOLDER">("TEAM");
  const [addTeamBMode, setAddTeamBMode] = useState<"TEAM" | "PLACEHOLDER">("TEAM");
  const [addTeamAId, setAddTeamAId] = useState("");
  const [addTeamBId, setAddTeamBId] = useState("");
  const [addTeamAPlaceholder, setAddTeamAPlaceholder] = useState("");
  const [addTeamBPlaceholder, setAddTeamBPlaceholder] = useState("");
  const [addSeriesFormat, setAddSeriesFormat] = useState<"BO1" | "BO3">("BO1");
  const [addScheduledTime, setAddScheduledTime] = useState("");
  const [addNextMatchId, setAddNextMatchId] = useState("");
  const [addNextMatchSlot, setAddNextMatchSlot] = useState<"A" | "B">("A");
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);

  // Edit Match Modal
  const [editingMatch, setEditingMatch] = useState<MatchItem | null>(null);
  const [editTeamAId, setEditTeamAId] = useState("");
  const [editTeamBId, setEditTeamBId] = useState("");
  const [editTeamAPlaceholder, setEditTeamAPlaceholder] = useState("");
  const [editTeamBPlaceholder, setEditTeamBPlaceholder] = useState("");
  const [editSeriesFormat, setEditSeriesFormat] = useState<"BO1" | "BO3">("BO1");
  const [editScheduledTime, setEditScheduledTime] = useState("");
  const [editNextMatchId, setEditNextMatchId] = useState("");
  const [editNextMatchSlot, setEditNextMatchSlot] = useState<"A" | "B">("A");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Edit Match - Join Info state
  const [editJoinInfoEnabled, setEditJoinInfoEnabled] = useState(false);
  const [editJoinCode, setEditJoinCode] = useState("");
  const [editPartyId, setEditPartyId] = useState("");
  const [editRoomId, setEditRoomId] = useState("");
  const [editLobbyId, setEditLobbyId] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editJoinLink, setEditJoinLink] = useState("");
  const [editMatchMessage, setEditMatchMessage] = useState("");
  const [activeReminderSending, setActiveReminderSending] = useState<string | null>(null);

  // Complete / Enter Score Modal
  const [scoringMatch, setScoringMatch] = useState<MatchItem | null>(null);
  const [scoreA, setScoreA] = useState("0");
  const [scoreB, setScoreB] = useState("0");
  const [winnerTeamId, setWinnerTeamId] = useState("");
  const [markComplete, setMarkComplete] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  // Action status message
  const [statusBanner, setStatusBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check if registration is closed
  const isRegistrationClosed = useMemo(() => {
    if (!currentTournament) return false;
    return (
      currentTournament.registration_status === "CLOSED" ||
      Boolean(currentTournament.is_registration_closed) ||
      currentTournament.status === "REGISTRATION_CLOSED" ||
      currentTournament.status === "IN_PROGRESS" ||
      currentTournament.status === "COMPLETED"
    );
  }, [currentTournament]);

  // Fetch registered rosters and initialize stream & community when selected tournament changes
  useEffect(() => {
    if (!selectedTournamentId) {
      setRostersData(null);
      setStreamUrl("");
      setCommunityLink("");
      return;
    }

    setIsLoadingRosters(true);
    getTournamentRegisteredRosters(selectedTournamentId)
      .then((data) => setRostersData(data))
      .catch((err) => console.warn("Failed to load registered rosters:", err))
      .finally(() => setIsLoadingRosters(false));

    if (currentTournament) {
      const fmt = currentTournament.format || currentTournament.match_format || "Knockout";
      setSelectedFormat(fmt);
      if (
        fmt.toLowerCase().includes("battle") ||
        fmt.toLowerCase().includes("royale") ||
        ["bgmi", "free-fire", "free-fire-max", "pubg"].includes((currentTournament.game_slug || "").toLowerCase())
      ) {
        setBuilderMode("BATTLE_ROYALE");
        loadBRData();
      }
      setStreamUrl(currentTournament.stream_url || currentTournament.youtube_live_url || "");
      if (currentTournament.community_platform === "WHATSAPP" || currentTournament.community_platform === "DISCORD") {
        setCommunityPlatform(currentTournament.community_platform);
      }
      setCommunityLink(currentTournament.community_link || "");
    }
  }, [selectedTournamentId, currentTournament]);

  // Load Battle Royale Authoritative Data
  const loadBRData = async () => {
    if (!selectedTournamentId) return;
    setIsLoadingBRCalc(true);
    try {
      const data = await getBattleRoyaleCalculation(selectedTournamentId);
      setBrCalcData(data);
      if (data.preview_distribution && data.preview_distribution.length > 0) {
        setLocalBRDistribution(data.preview_distribution);
      }
    } catch (err) {
      console.warn("Failed to load Battle Royale calculations:", err);
    } finally {
      setIsLoadingBRCalc(false);
    }
  };

  // Toggle Even Rebalancing vs Sequential Greedy Fill
  const handleToggleBalanced = (balanced: boolean) => {
    setBrBalanced(balanced);
    if (!brCalcData || !brCalcData.teams || brCalcData.teams.length === 0) return;

    const allTeams = brCalcData.teams;
    const reqMatches = brCalcData.required_matches;
    const maxTeams = brCalcData.max_teams_per_match;

    if (reqMatches === 0) return;

    if (balanced) {
      const newMatches: BattleRoyalePreviewMatch[] = Array.from({ length: reqMatches }, (_, i) => ({
        match_number: i + 1,
        match_name: `Match ${i + 1} Lobby`,
        team_count: 0,
        teams: [],
      }));

      allTeams.forEach((team, idx) => {
        const mIdx = idx % reqMatches;
        newMatches[mIdx].teams.push(team);
        newMatches[mIdx].team_count = newMatches[mIdx].teams.length;
      });
      setLocalBRDistribution(newMatches);
    } else {
      const newMatches: BattleRoyalePreviewMatch[] = [];
      for (let i = 0; i < reqMatches; i++) {
        const startIdx = i * maxTeams;
        const chunk = allTeams.slice(startIdx, startIdx + maxTeams);
        newMatches.push({
          match_number: i + 1,
          match_name: `Match ${i + 1} Lobby`,
          team_count: chunk.length,
          teams: chunk,
        });
      }
      setLocalBRDistribution(newMatches);
    }
  };

  // Generate Battle Royale Matches
  const handleGenerateBRMatches = async () => {
    if (!selectedTournamentId) return;
    setIsGeneratingBR(true);
    setStatusBanner(null);
    try {
      const customDistribution = localBRDistribution.map((m) => ({
        match_number: m.match_number,
        team_ids: m.teams.map((t) => t.id || t.team_id).filter(Boolean) as string[],
      }));

      const res = await generateBattleRoyaleMatches(selectedTournamentId, {
        stage_name: "Round 1",
        round_name: "Round 1",
        balanced: brBalanced,
        custom_distribution: customDistribution.length > 0 ? customDistribution : undefined,
      });

      setStatusBanner({
        type: "success",
        text: `Successfully generated ${res.total_matches} Battle Royale match lobbies from actual database registrations!`,
      });
      await onRefreshMatches();
      await loadBRData();
    } catch (err: any) {
      setStatusBanner({
        type: "error",
        text: err?.message || "Failed to generate Battle Royale matches.",
      });
    } finally {
      setIsGeneratingBR(false);
    }
  };

  // Rebalance a team between Battle Royale match lobbies
  const handleMoveTeam = async (teamId: string, fromMatchNumber: number, toMatchNumber: number) => {
    if (fromMatchNumber === toMatchNumber) return;

    const dbMatchA = matches.find(
      (m) =>
        m.tournament_id === selectedTournamentId &&
        (m.format === "Battle Royale" || m.match_type === "BATTLE_ROYALE") &&
        m.match_number === fromMatchNumber
    );
    const dbMatchB = matches.find(
      (m) =>
        m.tournament_id === selectedTournamentId &&
        (m.format === "Battle Royale" || m.match_type === "BATTLE_ROYALE") &&
        m.match_number === toMatchNumber
    );

    setLocalBRDistribution((prev) => {
      const copy = prev.map((m) => ({ ...m, teams: [...m.teams] }));
      const fromMatch = copy.find((m) => m.match_number === fromMatchNumber);
      const toMatch = copy.find((m) => m.match_number === toMatchNumber);
      if (!fromMatch || !toMatch) return prev;

      const teamIndex = fromMatch.teams.findIndex((t) => (t.id || t.team_id) === teamId);
      if (teamIndex === -1) return prev;

      const [team] = fromMatch.teams.splice(teamIndex, 1);
      fromMatch.team_count = fromMatch.teams.length;
      toMatch.teams.push(team);
      toMatch.team_count = toMatch.teams.length;
      return copy;
    });

    if (dbMatchA && dbMatchB) {
      setIsRebalancingBR(true);
      try {
        await rebalanceBattleRoyaleMatches(selectedTournamentId, {
          team_id: teamId,
          from_match_id: dbMatchA.id,
          to_match_id: dbMatchB.id,
        });
        await onRefreshMatches();
      } catch (err: any) {
        console.warn("Failed to persist team rebalance to DB:", err);
      } finally {
        setIsRebalancingBR(false);
      }
    }
  };

  // Derive dynamic list of rounds from existing matches + default rounds ("Round 1") + custom rounds
  const allRounds = useMemo(() => {
    const roundSet = new Set<string>(DEFAULT_ROUNDS);
    if (currentTournament?.custom_rounds) {
      currentTournament.custom_rounds.forEach((r) => roundSet.add(r));
    }
    matches
      .filter((m) => m.tournament_id === selectedTournamentId)
      .forEach((m) => {
        const rName = m.round_name || m.stage;
        if (rName) roundSet.add(rName);
      });
    customRounds.forEach((r) => roundSet.add(r));
    return Array.from(roundSet);
  }, [matches, selectedTournamentId, customRounds, currentTournament]);

  // Ensure activeRound is valid
  useEffect(() => {
    if (allRounds.length > 0 && !allRounds.includes(activeRound)) {
      setActiveRound(allRounds[0]);
    }
  }, [allRounds, activeRound]);

  // Filter matches for the active tournament and active round
  const activeRoundMatches = useMemo(() => {
    return matches.filter((m) => {
      if (m.tournament_id !== selectedTournamentId) return false;
      const rName = m.round_name || m.stage;
      return rName === activeRound;
    });
  }, [matches, selectedTournamentId, activeRound]);

  // Identify which teams are already paired in the active round
  const pairedTeamIdsInActiveRound = useMemo(() => {
    const ids = new Set<string>();
    activeRoundMatches.forEach((m) => {
      if (m.team_a_id) ids.add(m.team_a_id);
      if (m.team_b_id) ids.add(m.team_b_id);
    });
    return ids;
  }, [activeRoundMatches]);

  const registeredTeamsList = useMemo(() => {
    return rostersData?.teams || [];
  }, [rostersData]);

  const candidateMatches = useMemo(() => {
    return matches.filter((m) => m.tournament_id === selectedTournamentId);
  }, [matches, selectedTournamentId]);

  // Mid-Tournament Format Switch
  const handleFormatChange = async (newFormat: string) => {
    if (!selectedTournamentId) return;
    setIsUpdatingFormat(true);
    setStatusBanner(null);
    try {
      await updateTournamentFormat(selectedTournamentId, newFormat);
      setSelectedFormat(newFormat);
      if (newFormat === "Battle Royale") {
        setBuilderMode("BATTLE_ROYALE");
        loadBRData();
      }
      setStatusBanner({
        type: "success",
        text: `Tournament format updated to "${newFormat}". All completed matches and bracket history preserved!`,
      });
      await onRefreshMatches();
    } catch (err: any) {
      setStatusBanner({
        type: "error",
        text: err?.message || "Failed to switch tournament format.",
      });
    } finally {
      setIsUpdatingFormat(false);
    }
  };

  // Save Tournament-level Live Stream URL
  const handleSaveStream = async () => {
    if (!selectedTournamentId) return;
    setIsSavingStream(true);
    setStatusBanner(null);
    try {
      await updateTournamentStream(selectedTournamentId, streamUrl.trim());
      setStatusBanner({
        type: "success",
        text: "Tournament livestream broadcast URL saved successfully!",
      });
    } catch (err: any) {
      setStatusBanner({
        type: "error",
        text: err?.message || "Failed to save tournament stream URL.",
      });
    } finally {
      setIsSavingStream(false);
    }
  };

  // Save Tournament Community Link (Exclusive Discord OR WhatsApp)
  const handleSaveCommunity = async () => {
    if (!selectedTournamentId) return;
    setIsSavingCommunity(true);
    setStatusBanner(null);
    try {
      await updateTournamentCommunity(
        selectedTournamentId,
        communityPlatform,
        communityLink.trim() || null
      );
      setStatusBanner({
        type: "success",
        text: `Official ${communityPlatform === "DISCORD" ? "Discord" : "WhatsApp"} link saved! Confirmed participants can now access it securely.`,
      });
    } catch (err: any) {
      setStatusBanner({
        type: "error",
        text: err?.message || "Failed to save community link.",
      });
    } finally {
      setIsSavingCommunity(false);
    }
  };

  // Close Registration Handler
  const handleCloseRegistration = async () => {
    if (!selectedTournamentId) return;
    setIsClosingReg(true);
    try {
      await closeTournamentRegistration(selectedTournamentId);
      setIsCloseRegModalOpen(false);
      setStatusBanner({
        type: "success",
        text: "Tournament registration has been closed! No new teams can register.",
      });
      await onRefreshMatches();
    } catch (err: any) {
      alert(err?.message || "Failed to close tournament registration");
    } finally {
      setIsClosingReg(false);
    }
  };

  // Add Round and Persist to Tournament
  const handleAddCustomRound = async () => {
    const clean = newRoundInput.trim();
    if (!clean) return;
    if (!selectedTournamentId) {
      alert("Please select a tournament first.");
      return;
    }
    try {
      await addTournamentRound(selectedTournamentId, clean);
      setCustomRounds((prev) => [...prev, clean]);
      setActiveRound(clean);
      setNewRoundInput("");
      setIsAddingRound(false);
      setStatusBanner({
        type: "success",
        text: `Round "${clean}" successfully added to tournament and persisted!`,
      });
      await onRefreshMatches();
    } catch (err: any) {
      alert(err?.message || "Failed to add round");
    }
  };

  // Open Add Match modal
  const handleOpenAddMatch = (roundName?: string, defaultTeamAId?: string) => {
    setAddMatchRound(roundName || activeRound);
    setAddTeamAMode("TEAM");
    setAddTeamBMode("TEAM");
    setAddTeamAId(defaultTeamAId || "");
    setAddTeamBId("");
    setAddTeamAPlaceholder("");
    setAddTeamBPlaceholder("");
    setAddSeriesFormat("BO1");
    setAddScheduledTime("");
    setAddNextMatchId("");
    setAddNextMatchSlot("A");
    setIsAddMatchModalOpen(true);
  };

  // Submit New Match
  const handleSubmitNewMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournamentId) return;

    if (addTeamAMode === "TEAM" && !addTeamAId) {
      alert("Please select Team A or enter a placeholder.");
      return;
    }
    if (addTeamBMode === "TEAM" && !addTeamBId) {
      alert("Please select Team B or enter a placeholder.");
      return;
    }
    if (addTeamAMode === "TEAM" && addTeamBMode === "TEAM" && addTeamAId === addTeamBId) {
      alert("Cannot pair a team against itself. Please select two different teams.");
      return;
    }

    setIsCreatingMatch(true);
    setStatusBanner(null);

    const teamADoc = registeredTeamsList.find((t) => t.id === addTeamAId || t.team_id === addTeamAId);
    const teamBDoc = registeredTeamsList.find((t) => t.id === addTeamBId || t.team_id === addTeamBId);

    try {
      await createMatchAdmin({
        tournament_id: selectedTournamentId,
        team_a_id: addTeamAMode === "TEAM" ? addTeamAId : undefined,
        team_b_id: addTeamBMode === "TEAM" ? addTeamBId : undefined,
        team_a_name: addTeamAMode === "TEAM" ? (teamADoc?.name || teamADoc?.team_name) : addTeamAPlaceholder,
        team_b_name: addTeamBMode === "TEAM" ? (teamBDoc?.name || teamBDoc?.team_name) : addTeamBPlaceholder,
        team_a_placeholder: addTeamAMode === "PLACEHOLDER" ? addTeamAPlaceholder : undefined,
        team_b_placeholder: addTeamBMode === "PLACEHOLDER" ? addTeamBPlaceholder : undefined,
        round_name: addMatchRound,
        stage: addMatchRound,
        series_format: addSeriesFormat,
        match_format: addSeriesFormat,
        scheduled_time: addScheduledTime.trim() || undefined,
        next_match_id: addNextMatchId || undefined,
        next_match_slot: addNextMatchId ? addNextMatchSlot : undefined,
      });

      setIsAddMatchModalOpen(false);
      setStatusBanner({
        type: "success",
        text: `Match successfully created in ${addMatchRound}!`,
      });
      await onRefreshMatches();
    } catch (err: any) {
      alert(err?.message || "Failed to create match");
    } finally {
      setIsCreatingMatch(false);
    }
  };

  // Open Edit Match
  const handleOpenEditMatch = (m: MatchItem) => {
    setEditingMatch(m);
    setEditTeamAId(m.team_a_id || "");
    setEditTeamBId(m.team_b_id || "");
    setEditTeamAPlaceholder(m.team_a_placeholder || "");
    setEditTeamBPlaceholder(m.team_b_placeholder || "");
    setEditSeriesFormat((m.series_format?.toUpperCase() === "BO3" ? "BO3" : "BO1"));
    setEditScheduledTime(m.scheduled_time || "");
    setEditNextMatchId(m.next_match_id || "");
    setEditNextMatchSlot(m.next_match_slot === "B" ? "B" : "A");

    // Join info
    setEditJoinInfoEnabled(Boolean(m.join_info_enabled));
    setEditJoinCode(m.join_info?.join_code || "");
    setEditPartyId(m.join_info?.party_id || "");
    setEditRoomId(m.join_info?.room_id || "");
    setEditLobbyId(m.join_info?.lobby_id || "");
    setEditPassword(m.join_info?.password || "");
    setEditJoinLink(m.join_info?.join_link || "");
    setEditMatchMessage(m.match_message || "");
  };

  // Submit Edit Match
  const handleSaveMatchEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    setIsSavingEdit(true);
    try {
      await updateMatchDetailsAdmin(editingMatch.id, {
        team_a_id: editTeamAId || undefined,
        team_b_id: editTeamBId || undefined,
        team_a_placeholder: editTeamAPlaceholder || undefined,
        team_b_placeholder: editTeamBPlaceholder || undefined,
        series_format: editSeriesFormat,
        scheduled_time: editScheduledTime.trim() || undefined,
        next_match_id: editNextMatchId || undefined,
        next_match_slot: editNextMatchId ? editNextMatchSlot : undefined,
      });

      // Also persist join info
      const joinInfoDict: Record<string, string> = {};
      if (editJoinCode.trim()) joinInfoDict.join_code = editJoinCode.trim();
      if (editPartyId.trim()) joinInfoDict.party_id = editPartyId.trim();
      if (editRoomId.trim()) joinInfoDict.room_id = editRoomId.trim();
      if (editLobbyId.trim()) joinInfoDict.lobby_id = editLobbyId.trim();
      if (editPassword.trim()) joinInfoDict.password = editPassword.trim();
      if (editJoinLink.trim()) joinInfoDict.join_link = editJoinLink.trim();

      await updateMatchJoinInfo(editingMatch.id, {
        join_info_enabled: editJoinInfoEnabled,
        join_info: joinInfoDict,
        match_message: editMatchMessage.trim() || undefined,
      });

      setEditingMatch(null);
      setStatusBanner({
        type: "success",
        text: "Match parameters and participant join information updated successfully.",
      });
      await onRefreshMatches();
    } catch (err: any) {
      alert(err?.message || "Failed to update match");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Send Match Reminder
  const handleSendReminder = async (matchId: string, reminderType: string) => {
    setActiveReminderSending(reminderType);
    try {
      const res = await triggerMatchReminder(matchId, reminderType);
      setStatusBanner({
        type: "success",
        text: `Reminder "${reminderType}" sent! ${res.participants_notified} confirmed participant(s) notified.`,
      });
      await onRefreshMatches();
      // Update editingMatch state if open
      if (editingMatch && editingMatch.id === matchId) {
        setEditingMatch({
          ...editingMatch,
          sent_reminders: [...(editingMatch.sent_reminders || []), reminderType],
        });
      }
    } catch (err: any) {
      alert(err?.message || "Failed to send match reminder");
    } finally {
      setActiveReminderSending(null);
    }
  };

  // Delete Match
  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Are you sure you want to delete this match?")) return;
    try {
      await deleteMatchAdmin(matchId);
      setStatusBanner({
        type: "success",
        text: "Match deleted successfully.",
      });
      await onRefreshMatches();
    } catch (err: any) {
      alert(err?.message || "Failed to delete match");
    }
  };

  // 1-Click Mark Match Live
  const handleMarkLive = async (m: MatchItem) => {
    try {
      await markMatchLiveAdmin(m.id, {
        youtube_live_url: streamUrl || m.youtube_live_url || "",
      });
      setStatusBanner({
        type: "success",
        text: `Match marked as LIVE! Broadcasted to live ticker and matches hub.`,
      });
      await onRefreshMatches();
    } catch (err: any) {
      alert(err?.message || "Failed to mark match live");
    }
  };

  // Open Score / Winner Modal
  const handleOpenScoring = (m: MatchItem) => {
    setScoringMatch(m);
    setScoreA(String(m.score_a ?? 0));
    setScoreB(String(m.score_b ?? 0));
    setWinnerTeamId(m.winner_team_id || "");
    setMarkComplete(m.status === "COMPLETED");
  };

  // Submit Score / Winner (Sends both payload naming conventions for 100% backend compatibility)
  const handleSaveScoring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoringMatch) return;
    setIsSubmittingScore(true);
    try {
      const sA = parseInt(scoreA) || 0;
      const sB = parseInt(scoreB) || 0;

      if (markComplete && !winnerTeamId) {
        alert("Please designate the winning team to finalize and complete the match.");
        setIsSubmittingScore(false);
        return;
      }

      if (markComplete) {
        await completeMatchAdmin(scoringMatch.id, {
          team1_score: sA,
          team2_score: sB,
          winner_id: winnerTeamId,
          score_a: sA,
          score_b: sB,
          winner_team_id: winnerTeamId,
        });
      } else {
        await updateMatchDetailsAdmin(scoringMatch.id, {
          score_a: sA,
          score_b: sB,
          winner_team_id: winnerTeamId || undefined,
        });
      }

      setScoringMatch(null);
      setStatusBanner({
        type: "success",
        text: markComplete ? "Match marked as COMPLETED and scores finalized!" : "Scores updated successfully.",
      });
      await onRefreshMatches();
    } catch (err: any) {
      alert(err?.message || "Failed to update scores");
    } finally {
      setIsSubmittingScore(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. AUTHORITATIVE TOP BAR */}
      <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] p-5 rounded-xl shadow-xs space-y-4">
        {/* Tournament Selector & Top Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Active Tournament for Matchup Builder
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => onSelectTournament(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-[#E56A10] focus:outline-none"
            >
              <option value="" className={OPTION_CLASS}>-- Choose a Tournament to Manage --</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id} className={OPTION_CLASS}>
                  [{t.status}] {t.title} ({t.game_slug?.toUpperCase() || "GAME"})
                </option>
              ))}
            </select>
          </div>

          {selectedTournamentId && (
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {/* Total Teams Pill */}
              <div className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-mono">
                <span className="text-blue-600 dark:text-blue-400 font-bold block text-[10px] uppercase">
                  Registered Teams
                </span>
                <span className="text-base font-bold text-blue-900 dark:text-blue-200">
                  {registeredTeamsList.length} Teams
                </span>
              </div>

              {/* Registration Status & Close Button */}
              {isRegistrationClosed ? (
                <div className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-mono">
                  <span className="text-rose-600 dark:text-rose-400 font-bold block text-[10px] uppercase">
                    Registration
                  </span>
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> CLOSED
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCloseRegModalOpen(true)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-600 border border-rose-300 dark:border-rose-800 hover:border-transparent text-rose-700 dark:text-rose-300 hover:text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Close Registration</span>
                </button>
              )}

              {/* Tournament Format Selector (Mid-Tournament Switching Allowed) */}
              <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                  Competition Format
                </label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <select
                    value={selectedFormat}
                    onChange={(e) => handleFormatChange(e.target.value)}
                    disabled={isUpdatingFormat}
                    className="bg-transparent text-xs font-mono font-bold text-[#E56A10] focus:outline-none cursor-pointer"
                  >
                    {CORE_FORMATS.map((f) => (
                      <option key={f} value={f} className={OPTION_CLASS}>
                        {f}
                      </option>
                    ))}
                  </select>
                  {isUpdatingFormat && <Loader2 className="w-3 h-3 animate-spin text-[#E56A10]" />}
                </div>
              </div>

              {/* Add Match Button */}
              <button
                type="button"
                onClick={() => handleOpenAddMatch(activeRound)}
                className="px-4 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Match</span>
              </button>
            </div>
          )}
        </div>

        {/* Livestream and Community Link Controls */}
        {selectedTournamentId && (
          <div className="pt-3 border-t border-slate-200 dark:border-[#2E384D] space-y-3">
            {/* Livestream Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 text-rose-500 font-mono text-xs font-bold uppercase shrink-0">
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Official Broadcast:</span>
              </div>
              <div className="flex-1 relative">
                <input
                  type="url"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="Enter YouTube or Twitch stream URL (e.g. https://www.youtube.com/watch?v=...)"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveStream}
                disabled={isSavingStream}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 transition-colors"
              >
                {isSavingStream ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tv className="w-3.5 h-3.5" />}
                <span>Save Broadcast</span>
              </button>
            </div>

            {/* Exclusive Participant Community Link (Discord OR WhatsApp - never both) */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#1E2538] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  Participant Community:
                </span>
                <div className="flex items-center gap-3 text-xs font-mono font-bold">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-800 dark:text-slate-200">
                    <input
                      type="radio"
                      name="communityPlatformChoice"
                      value="DISCORD"
                      checked={communityPlatform === "DISCORD"}
                      onChange={() => setCommunityPlatform("DISCORD")}
                      className="text-[#5865F2] focus:ring-[#5865F2] cursor-pointer"
                    />
                    <span className="text-[#5865F2] flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> Discord
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-800 dark:text-slate-200">
                    <input
                      type="radio"
                      name="communityPlatformChoice"
                      value="WHATSAPP"
                      checked={communityPlatform === "WHATSAPP"}
                      onChange={() => setCommunityPlatform("WHATSAPP")}
                      className="text-[#25D366] focus:ring-[#25D366] cursor-pointer"
                    />
                    <span className="text-[#25D366] flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex-1 relative">
                <input
                  type="url"
                  value={communityLink}
                  onChange={(e) => setCommunityLink(e.target.value)}
                  placeholder={communityPlatform === "DISCORD" ? "https://discord.gg/your-invite" : "https://chat.whatsapp.com/your-group"}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#2E384D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveCommunity}
                disabled={isSavingCommunity}
                className="px-3.5 py-1.5 bg-[#E56A10] hover:bg-[#D45900] text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 transition-colors"
              >
                {isSavingCommunity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                <span>Save Community Link</span>
              </button>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              * Protected link: Visible only to authenticated, confirmed tournament participants on their match/tournament dashboard.
            </p>

            {/* Matchup Builder Mode Tabs */}
            <div className="pt-3 border-t border-slate-200 dark:border-[#2E384D] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBuilderMode("HEAD_TO_HEAD")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                    builderMode === "HEAD_TO_HEAD"
                      ? "bg-[#E56A10] text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-[#161B26] dark:hover:bg-[#1F2637] text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Standard 1v1 Builder</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBuilderMode("BATTLE_ROYALE");
                    loadBRData();
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                    builderMode === "BATTLE_ROYALE"
                      ? "bg-[#E56A10] text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-[#161B26] dark:hover:bg-[#1F2637] text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Battle Royale Match Builder</span>
                  {brCalcData && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/20 text-white font-mono">
                      {brCalcData.required_matches} Lobbies
                    </span>
                  )}
                </button>
              </div>

              {builderMode === "BATTLE_ROYALE" && (
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>DB Source Active: {brCalcData?.registered_teams_count ?? registeredTeamsList.length} Confirmed Lineups</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Banner */}
      {statusBanner && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
            statusBanner.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusBanner.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{statusBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="hover:opacity-75 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {!selectedTournamentId ? (
        <div className="bg-white dark:bg-[#111622] border border-dashed border-slate-300 dark:border-[#2E384D] rounded-xl p-12 text-center space-y-3">
          <Trophy className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">
            No Tournament Selected
          </h4>
          <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
            Please select a tournament from the dropdown above to manage registered teams, create matches round-by-round, and control live series scoring.
          </p>
        </div>
      ) : builderMode === "BATTLE_ROYALE" ? (
        <div className="space-y-6">
          {/* 1. TOP STATS RIBBON (5 METRICS AS SPECIFIED) */}
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] p-5 rounded-xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#E56A10]/10 text-[#E56A10] border border-[#E56A10]/30">
                    Live Database Calculation
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {brCalcData?.game_name || currentTournament?.game_name || "Battle Royale"}
                  </span>
                </div>
                <h3 className="font-headline font-black text-lg text-slate-900 dark:text-white uppercase mt-1">
                  Battle Royale Match Builder
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadBRData}
                  disabled={isLoadingBRCalc}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#161B26] dark:hover:bg-[#1F2637] border border-slate-300 dark:border-[#2E384D] text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBRCalc ? "animate-spin text-[#E56A10]" : ""}`} />
                  <span>Refresh Registered Data</span>
                </button>
              </div>
            </div>

            {/* Prominent 5-Metric Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-2">
              {/* Metric 1: Registered Teams */}
              <div className="p-4 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#2E384D] rounded-xl">
                <div className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
                  Registered Teams
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                  {brCalcData?.registered_teams_count ?? registeredTeamsList.length}
                </div>
                <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                  ● Confirmed in DB
                </div>
              </div>

              {/* Metric 2: Room Capacity */}
              <div className="p-4 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#2E384D] rounded-xl">
                <div className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
                  Room Capacity
                </div>
                <div className="text-2xl font-black font-mono text-[#E56A10] mt-1">
                  {brCalcData?.room_capacity ?? 100}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Players per Room
                </div>
              </div>

              {/* Metric 3: Players Per Team */}
              <div className="p-4 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#2E384D] rounded-xl">
                <div className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
                  Players Per Team
                </div>
                <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
                  {brCalcData?.players_per_team ?? 4}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Active Squad Size
                </div>
              </div>

              {/* Metric 4: Capacity */}
              <div className="p-4 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#2E384D] rounded-xl">
                <div className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
                  Capacity
                </div>
                <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1">
                  {brCalcData?.max_teams_per_match ?? 25}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Teams / Match
                </div>
              </div>

              {/* Metric 5: Required Matches */}
              <div className="p-4 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#2E384D] rounded-xl col-span-2 sm:col-span-1">
                <div className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
                  Required Matches
                </div>
                <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {brCalcData?.required_matches ?? 0}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Lobbies Needed
                </div>
              </div>
            </div>

            {/* Formula Banner & Controls */}
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-lg text-xs font-mono text-blue-800 dark:text-blue-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold">Authoritative Mathematical Formula:</span>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">
                  Capacity = floor(Room Capacity {brCalcData?.room_capacity ?? 100} ÷ Squad Size {brCalcData?.players_per_team ?? 4}) = <strong className="text-blue-900 dark:text-white font-bold">{brCalcData?.max_teams_per_match ?? 25} Teams/Match</strong>
                  {" • "}
                  Required Matches = ceil({brCalcData?.registered_teams_count ?? registeredTeamsList.length} Actual Registered Teams ÷ {brCalcData?.max_teams_per_match ?? 25}) = <strong className="text-blue-900 dark:text-white font-bold">{brCalcData?.required_matches ?? 0} Matches</strong>
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={brBalanced}
                    onChange={(e) => handleToggleBalanced(e.target.checked)}
                    className="accent-[#E56A10] cursor-pointer"
                  />
                  <span>Evenly Rebalance Lobbies</span>
                </label>

                <button
                  type="button"
                  onClick={handleGenerateBRMatches}
                  disabled={isGeneratingBR || (brCalcData?.registered_teams_count || 0) === 0}
                  className="px-4 py-2 bg-[#E56A10] hover:bg-[#D45900] disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-2 cursor-pointer shadow-xs transition-colors shrink-0"
                >
                  {isGeneratingBR ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Generate Round 1 BR Matches</span>
                </button>
              </div>
            </div>
          </div>

          {/* LOBBIES DISPLAY */}
          <div className="space-y-4">
            {isLoadingBRCalc ? (
              <div className="p-12 bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] rounded-xl text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#E56A10] mx-auto" />
                <p className="text-xs font-mono text-slate-500">
                  Fetching registered lineups and computing room lobbies...
                </p>
              </div>
            ) : localBRDistribution.length === 0 ? (
              <div className="bg-white dark:bg-[#111622] border border-dashed border-slate-300 dark:border-[#2E384D] rounded-xl p-12 text-center space-y-3">
                <Shield className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">
                  No Confirmed Teams Registered
                </h4>
                <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
                  When teams register for this tournament with confirmed payment, the Battle Royale calculation engine will automatically partition them into required match lobbies.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {localBRDistribution.map((m) => {
                  const dbMatch = matches.find(
                    (dm) =>
                      dm.tournament_id === selectedTournamentId &&
                      (dm.format === "Battle Royale" || dm.match_type === "BATTLE_ROYALE") &&
                      dm.match_number === m.match_number
                  );

                  return (
                    <div
                      key={m.match_number}
                      className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] rounded-xl overflow-hidden shadow-xs"
                    >
                      {/* Lobby Header */}
                      <div className="p-4 bg-slate-50 dark:bg-[#161B26] border-b border-slate-200 dark:border-[#242C3D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#E56A10]/10 text-[#E56A10] border border-[#E56A10]/30 font-mono font-black text-sm flex items-center justify-center">
                            #{m.match_number}
                          </div>
                          <div>
                            <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white uppercase flex items-center gap-2">
                              {m.match_name}
                              {dbMatch?.status === "LIVE" && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-rose-600 text-white animate-pulse">
                                  LIVE
                                </span>
                              )}
                              {dbMatch?.status === "COMPLETED" && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-500 text-white">
                                  COMPLETED
                                </span>
                              )}
                            </h4>
                            <span className="text-xs font-mono text-slate-500">
                              Assigned: <strong className="text-slate-900 dark:text-white">{m.teams.length}</strong> / {brCalcData?.max_teams_per_match ?? 25} Teams Capacity
                            </span>
                          </div>
                        </div>

                        {/* Right Header Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {dbMatch ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditMatch(dbMatch)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1F2637] dark:hover:bg-[#283248] text-slate-800 dark:text-slate-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Key className="w-3.5 h-3.5 text-[#E56A10]" />
                                <span>Room ID & Password</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenScoring(dbMatch)}
                                className="px-3 py-1.5 bg-[#E56A10] hover:bg-[#D45900] text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                              >
                                <Trophy className="w-3.5 h-3.5" />
                                <span>Result / Scoring</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded px-2.5 py-1">
                              Preview (Click Generate to Save to DB)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Teams Grid in Lobby */}
                      <div className="p-4">
                        {m.teams.length === 0 ? (
                          <div className="p-6 text-center text-xs font-mono text-slate-400">
                            No teams assigned to this lobby.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {m.teams.map((team, tIdx) => {
                              const tId = team.id || team.team_id;
                              const tName = team.name || team.team_name || "Team";
                              const tTag = team.tag || team.team_tag || "TEAM";
                              const capName = team.captain_username || (team.captain as any)?.username || "Captain";

                              return (
                                <div
                                  key={tId || tIdx}
                                  className="p-3 bg-slate-50/80 dark:bg-[#161B26]/80 border border-slate-200 dark:border-[#242C3D] rounded-lg space-y-2 hover:border-[#E56A10]/40 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="w-5 h-5 rounded bg-slate-200 dark:bg-[#242C3D] text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                        {tIdx + 1}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="font-mono font-bold text-xs text-slate-900 dark:text-white truncate">
                                          {tName} <span className="text-[#E56A10]">[{tTag}]</span>
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-400 truncate">
                                          Capt: @{capName}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Move to another match dropdown */}
                                    {localBRDistribution.length > 1 && (
                                      <div className="shrink-0 flex items-center gap-1">
                                        <label className="text-[9px] font-mono text-slate-400 uppercase">
                                          Move:
                                        </label>
                                        <select
                                          value={m.match_number}
                                          onChange={(e) => handleMoveTeam(tId, m.match_number, parseInt(e.target.value))}
                                          disabled={isRebalancingBR}
                                          className="bg-white dark:bg-[#1E2538] border border-slate-300 dark:border-[#2E384D] rounded px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#E56A10] focus:outline-none cursor-pointer"
                                        >
                                          {localBRDistribution.map((targetM) => (
                                            <option key={targetM.match_number} value={targetM.match_number} className={OPTION_CLASS}>
                                              Match {targetM.match_number}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                  </div>

                                  {team.member_handles && team.member_handles.length > 0 && (
                                    <div className="text-[9px] font-mono text-slate-500 truncate border-t border-slate-200/50 dark:border-[#242C3D]/50 pt-1.5">
                                      Roster: {team.member_handles.join(", ")}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 2. REGISTERED TEAMS PANEL (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] rounded-xl overflow-hidden shadow-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-[#161B26] border-b border-slate-200 dark:border-[#242C3D] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#E56A10]" />
                  <span className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
                    Registered Lineups ({registeredTeamsList.length})
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Active in {activeRound}
                </span>
              </div>

              {isLoadingRosters ? (
                <div className="p-8 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#E56A10]" />
                  <span>Loading authoritative rosters...</span>
                </div>
              ) : registeredTeamsList.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-slate-400 space-y-1.5">
                  <p>No verified teams registered in database yet.</p>
                  <p className="text-[10px] text-slate-500">
                    Players can join via the public tournament registration flow.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-[#1F2637] max-h-[600px] overflow-y-auto">
                  {registeredTeamsList.map((team, idx) => {
                    const tId = team.id || team.team_id;
                    const isPairedInThisRound = pairedTeamIdsInActiveRound.has(tId);
                    const teamName = team.name || team.team_name || "Team";

                    return (
                      <div
                        key={tId || idx}
                        className={`p-3 transition-colors ${
                          isPairedInThisRound
                            ? "bg-slate-50/50 dark:bg-[#141824]/40"
                            : "bg-white dark:bg-[#111622] hover:bg-slate-50 dark:hover:bg-[#161B26]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            {/* Team Initial Icon Badge (No Seed Number) */}
                            <div className="w-6 h-6 rounded bg-slate-100 dark:bg-[#1F2637] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-[#2E384D] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 uppercase">
                              {teamName.substring(0, 1)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold font-mono text-slate-900 dark:text-white truncate">
                                {teamName} [{team.tag || team.team_tag || "TEAM"}]
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                Capt: @{team.captain_username || (team.captain as any)?.username || "Player"}
                              </div>
                              {team.member_handles && team.member_handles.length > 0 && (
                                <div className="text-[9px] text-slate-500 font-mono truncate mt-0.5">
                                  Roster: {team.member_handles.join(", ")}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {/* Visual State: Assigned vs Unassigned in this round */}
                            {isPairedInThisRound ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                Assigned
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                                Unassigned
                              </span>
                            )}

                            {!isPairedInThisRound && (
                              <button
                                type="button"
                                onClick={() => handleOpenAddMatch(activeRound, tId)}
                                className="text-[10px] font-mono text-[#E56A10] hover:underline font-bold cursor-pointer"
                              >
                                + Pair Match
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3. ROUND-BY-ROUND MATCH ENGINE (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Round Tabs & Dynamic Round Creator */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-[#242C3D]">
              <div className="flex items-center gap-1.5 flex-nowrap">
                {allRounds.map((rName) => {
                  const count = matches.filter(
                    (m) =>
                      m.tournament_id === selectedTournamentId &&
                      (m.round_name || m.stage) === rName
                  ).length;

                  return (
                    <button
                      key={rName}
                      type="button"
                      onClick={() => setActiveRound(rName)}
                      className={`px-3.5 py-1.5 rounded-t-lg font-mono text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                        activeRound === rName
                          ? "border-[#E56A10] text-[#E56A10] bg-slate-50 dark:bg-[#161B26]"
                          : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {rName}
                      {count > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-[#242C3D] text-slate-700 dark:text-slate-300">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Add New Round Button */}
              <div className="shrink-0">
                {isAddingRound ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newRoundInput}
                      onChange={(e) => setNewRoundInput(e.target.value)}
                      placeholder="e.g. Round 2"
                      className="px-2 py-1 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#2E384D] rounded text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomRound}
                      className="px-2 py-1 bg-[#E56A10] text-white text-xs font-mono font-bold rounded cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingRound(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingRound(true)}
                    className="px-2.5 py-1 text-[11px] font-mono font-bold text-[#E56A10] hover:bg-[#E56A10]/10 rounded border border-[#E56A10]/30 transition-colors cursor-pointer"
                  >
                    + New Round
                  </button>
                )}
              </div>
            </div>

            {/* Matches List in Active Round */}
            <div className="space-y-3">
              {activeRoundMatches.length === 0 ? (
                <div className="bg-white dark:bg-[#111622] border border-dashed border-slate-300 dark:border-[#2E384D] rounded-xl p-10 text-center space-y-3">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                  <h5 className="font-headline font-bold text-sm text-slate-900 dark:text-white uppercase">
                    No Matches in {activeRound}
                  </h5>
                  <p className="text-xs text-slate-500 font-mono max-w-sm mx-auto">
                    Manually pair two registered teams or assign previous match winner placeholders for this round.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenAddMatch(activeRound)}
                    className="px-4 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white rounded-lg text-xs font-mono font-bold uppercase inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Match in {activeRound}</span>
                  </button>
                </div>
              ) : (
                activeRoundMatches.map((m, mIdx) => {
                  const teamAName = m.team_a?.name || m.team_a_name || m.team_a_placeholder || "TBD";
                  const teamBName = m.team_b?.name || m.team_b_name || m.team_b_placeholder || "TBD";
                  const isTeamAPlaceholder = !m.team_a_id && Boolean(m.team_a_placeholder);
                  const isTeamBPlaceholder = !m.team_b_id && Boolean(m.team_b_placeholder);

                  const isLive = m.status === "LIVE";
                  const isCompleted = m.status === "COMPLETED";

                  return (
                    <div
                      key={m.id}
                      className={`bg-white dark:bg-[#111622] border rounded-xl p-4 shadow-xs space-y-3 transition-colors ${
                        isLive
                          ? "border-rose-500/60 dark:border-rose-500/60 bg-rose-50/10"
                          : isCompleted
                          ? "border-emerald-500/40 dark:border-emerald-500/30"
                          : "border-slate-200 dark:border-[#242C3D]"
                      }`}
                    >
                      {/* Match Meta Header */}
                      <div className="flex items-center justify-between text-xs font-mono border-b border-slate-100 dark:border-[#1E2538] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            Match #{m.match_number || mIdx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-[#1C2232] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-[#2E384D]">
                            {m.series_format || m.format || "BO1"}
                          </span>
                          {m.scheduled_time && (
                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {m.scheduled_time}
                            </span>
                          )}
                        </div>

                        {/* Status Badge & Join Info Indicator */}
                        <div className="flex items-center gap-2">
                          {m.join_info_enabled && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                              <Key className="w-2.5 h-2.5" /> Join Info
                            </span>
                          )}
                          {isLive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-600 text-white flex items-center gap-1 animate-pulse">
                              <Radio className="w-3 h-3" /> LIVE
                            </span>
                          ) : isCompleted ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500 text-white flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> COMPLETED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
                              SCHEDULED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Match Contestants & Score */}
                      {m.format === "Battle Royale" || m.match_type === "BATTLE_ROYALE" || ((m.teams || []).length > 2) ? (
                        <div className="py-2.5 px-3 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-lg flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Shield className="w-4 h-4 text-[#E56A10] shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                                Battle Royale Match Lobby ({(m.teams || []).length} Teams)
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 truncate">
                                {(m.teams || []).length > 0 ? (m.teams || []).slice(0, 4).map((t: any) => t.name || t.team_name).join(", ") + ((m.teams || []).length > 4 ? ` +${(m.teams || []).length - 4} more` : "") : "Lobby"}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setBuilderMode("BATTLE_ROYALE");
                              loadBRData();
                            }}
                            className="px-2.5 py-1 text-[11px] font-mono text-[#E56A10] hover:bg-[#E56A10]/10 rounded border border-[#E56A10]/30 font-bold cursor-pointer transition-colors shrink-0"
                          >
                            Open in BR Builder →
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-12 items-center gap-3 py-1">
                          {/* Team A */}
                          <div className="col-span-5 text-right">
                            <div
                              className={`font-mono text-sm font-bold truncate ${
                                m.winner_team_id && (m.winner_team_id === m.team_a_id || m.winner_team_id === teamAName)
                                  ? "text-emerald-500 font-extrabold"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {teamAName}
                            </div>
                            {isTeamAPlaceholder && (
                              <span className="text-[10px] font-mono text-amber-500 italic block">
                                (Placeholder)
                              </span>
                            )}
                          </div>

                          {/* Score Box */}
                          <div className="col-span-2 flex flex-col items-center justify-center">
                            <div className="px-3 py-1 bg-slate-100 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-lg font-mono font-bold text-sm text-[#E56A10] tabular-nums">
                              {m.score_a ?? 0} : {m.score_b ?? 0}
                            </div>
                          </div>

                          {/* Team B */}
                          <div className="col-span-5 text-left">
                            <div
                              className={`font-mono text-sm font-bold truncate ${
                                m.winner_team_id && (m.winner_team_id === m.team_b_id || m.winner_team_id === teamBName)
                                  ? "text-emerald-500 font-extrabold"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {teamBName}
                            </div>
                            {isTeamBPlaceholder && (
                              <span className="text-[10px] font-mono text-amber-500 italic block">
                                (Placeholder)
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Advancement Destination Status */}
                      <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-slate-100/80 dark:border-[#1A2234] flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {m.next_match_id ? (() => {
                            const target = matches.find((tgt) => tgt.id === m.next_match_id);
                            const targetLabel = target ? `${target.round_name || target.stage} Match #${target.match_number || 1}` : "Downstream Match";
                            return (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3 text-purple-500" />
                                Advances to: {targetLabel} (Slot {m.next_match_slot || "A"})
                              </span>
                            );
                          })() : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-[#2E384D] flex items-center gap-1">
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              Advances to: Next Round (Auto)
                            </span>
                          )}
                        </div>

                        {isCompleted && m.winner_team_id && (
                          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span>Winner ({m.winner_team_id === m.team_a_id ? teamAName : teamBName}) advanced</span>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1E2538] text-xs font-mono flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {/* 1-Click Go Live */}
                          {!isLive && !isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleMarkLive(m)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Play className="w-3 h-3" />
                              <span>Go Live</span>
                            </button>
                          )}

                          {/* Enter Score / Winner Modal */}
                          <button
                            type="button"
                            onClick={() => handleOpenScoring(m)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Sliders className="w-3 h-3" />
                            <span>{isCompleted ? "Edit Score" : "Score & Winner"}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditMatch(m)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2234] dark:hover:bg-[#232D42] text-slate-700 dark:text-slate-300 rounded text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {/* Delete Match */}
                          <button
                            type="button"
                            onClick={() => handleDeleteMatch(m.id)}
                            className="px-2 py-1 bg-slate-100 hover:bg-rose-100 dark:bg-[#1A2234] dark:hover:bg-rose-950/40 text-rose-600 rounded text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: CLOSE REGISTRATION */}
      {isCloseRegModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase">
                  Close Registration?
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  {currentTournament?.title}
                </p>
              </div>
            </div>

            <p className="text-xs font-mono text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to close registration for this tournament? Once closed, no new players or teams can register, and the tournament is permanently locked for match bracket scheduling and execution.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#242C3D]">
              <button
                type="button"
                onClick={() => setIsCloseRegModalOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E2538] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseRegistration}
                disabled={isClosingReg}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isClosingReg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Confirm Close Registration</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MATCH (MANUAL CREATION) */}
      {isAddMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] max-w-lg w-full rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <h4 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#E56A10]" /> Add Match to {addMatchRound}
              </h4>
              <button
                type="button"
                onClick={() => setIsAddMatchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewMatch} className="space-y-4">
              {/* Round Selection */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Target Round *
                </label>
                <select
                  value={addMatchRound}
                  onChange={(e) => setAddMatchRound(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#E56A10]"
                >
                  {allRounds.map((r) => (
                    <option key={r} value={r} className={OPTION_CLASS}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* TEAM A SELECTION */}
              <div className="p-3 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300">
                    Team A Selection *
                  </label>
                  <div className="flex rounded border border-slate-200 dark:border-[#242C3D] p-0.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setAddTeamAMode("TEAM")}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        addTeamAMode === "TEAM" ? "bg-[#E56A10] text-white font-bold" : "text-slate-400"
                      }`}
                    >
                      Registered Team
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddTeamAMode("PLACEHOLDER")}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        addTeamAMode === "PLACEHOLDER" ? "bg-[#E56A10] text-white font-bold" : "text-slate-400"
                      }`}
                    >
                      Winner Placeholder
                    </button>
                  </div>
                </div>

                {addTeamAMode === "TEAM" ? (
                  <select
                    value={addTeamAId}
                    onChange={(e) => setAddTeamAId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  >
                    <option value="" className={OPTION_CLASS}>-- Choose Registered Team A --</option>
                    {registeredTeamsList.map((t, i) => (
                      <option key={t.id || i} value={t.id || t.team_id} className={OPTION_CLASS}>
                        {t.name || t.team_name} [{t.tag || "TEAM"}]{" "}
                        {pairedTeamIdsInActiveRound.has(t.id || t.team_id) ? "(Assigned)" : "(Available)"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={addTeamAPlaceholder}
                    onChange={(e) => setAddTeamAPlaceholder(e.target.value)}
                    placeholder="e.g. Winner of Round 1 Match 1"
                    className="w-full px-3 py-2 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                )}
              </div>

              {/* TEAM B SELECTION */}
              <div className="p-3 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300">
                    Team B Selection *
                  </label>
                  <div className="flex rounded border border-slate-200 dark:border-[#242C3D] p-0.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setAddTeamBMode("TEAM")}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        addTeamBMode === "TEAM" ? "bg-[#E56A10] text-white font-bold" : "text-slate-400"
                      }`}
                    >
                      Registered Team
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddTeamBMode("PLACEHOLDER")}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        addTeamBMode === "PLACEHOLDER" ? "bg-[#E56A10] text-white font-bold" : "text-slate-400"
                      }`}
                    >
                      Winner Placeholder
                    </button>
                  </div>
                </div>

                {addTeamBMode === "TEAM" ? (
                  <select
                    value={addTeamBId}
                    onChange={(e) => setAddTeamBId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  >
                    <option value="" className={OPTION_CLASS}>-- Choose Registered Team B --</option>
                    {registeredTeamsList.map((t, i) => (
                      <option key={t.id || i} value={t.id || t.team_id} className={OPTION_CLASS}>
                        {t.name || t.team_name} [{t.tag || "TEAM"}]{" "}
                        {pairedTeamIdsInActiveRound.has(t.id || t.team_id) ? "(Assigned)" : "(Available)"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={addTeamBPlaceholder}
                    onChange={(e) => setAddTeamBPlaceholder(e.target.value)}
                    placeholder="e.g. Winner of Round 1 Match 2"
                    className="w-full px-3 py-2 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                )}
              </div>

              {/* SERIES FORMAT: Strictly BO1 or BO3 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Series Format (Strict) *
                  </label>
                  <select
                    value={addSeriesFormat}
                    onChange={(e) => setAddSeriesFormat(e.target.value as "BO1" | "BO3")}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#E56A10]"
                  >
                    <option value="BO1" className={OPTION_CLASS}>Best of 1 (First to 1 Win)</option>
                    <option value="BO3" className={OPTION_CLASS}>Best of 3 (First to 2 Wins)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Scheduled Time (Optional)
                  </label>
                  <input
                    type="text"
                    value={addScheduledTime}
                    onChange={(e) => setAddScheduledTime(e.target.value)}
                    placeholder="e.g. Today, 6:00 PM IST"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
              </div>

              {/* Advancement Destination Mapping */}
              <div className="p-3 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300">
                  <ArrowRight className="w-3.5 h-3.5 text-[#E56A10]" />
                  <span>Winner Advancement Destination</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-0.5">
                      Target Downstream Match
                    </label>
                    <select
                      value={addNextMatchId}
                      onChange={(e) => setAddNextMatchId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                    >
                      <option value="" className={OPTION_CLASS}>Automatic Progression (Standard)</option>
                      {candidateMatches.map((cm) => (
                        <option key={cm.id} value={cm.id} className={OPTION_CLASS}>
                          [{cm.round_name || cm.stage}] Match #{cm.match_number || 1} ({cm.team_a_name || cm.team_a_placeholder || "Slot A"} vs {cm.team_b_name || cm.team_b_placeholder || "Slot B"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-0.5">
                      Target Slot
                    </label>
                    <select
                      value={addNextMatchSlot}
                      onChange={(e) => setAddNextMatchSlot(e.target.value as "A" | "B")}
                      className="w-full px-2 py-1.5 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                    >
                      <option value="A" className={OPTION_CLASS}>Slot A (Contender 1)</option>
                      <option value="B" className={OPTION_CLASS}>Slot B (Contender 2)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => setIsAddMatchModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E2538] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingMatch}
                  className="px-5 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isCreatingMatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Create Match</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MATCH (INCLUDING JOIN INFO AND REMINDER NOTIFICATIONS) */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] max-w-lg w-full rounded-2xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <h4 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#E56A10]" /> Edit Match #{editingMatch.match_number || 1}
              </h4>
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMatchEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Team A (Registered Team)
                  </label>
                  <select
                    value={editTeamAId}
                    onChange={(e) => setEditTeamAId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  >
                    <option value="" className={OPTION_CLASS}>-- Or use placeholder below --</option>
                    {registeredTeamsList.map((t, i) => (
                      <option key={t.id || i} value={t.id || t.team_id} className={OPTION_CLASS}>
                        {t.name || t.team_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Team B (Registered Team)
                  </label>
                  <select
                    value={editTeamBId}
                    onChange={(e) => setEditTeamBId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  >
                    <option value="" className={OPTION_CLASS}>-- Or use placeholder below --</option>
                    {registeredTeamsList.map((t, i) => (
                      <option key={t.id || i} value={t.id || t.team_id} className={OPTION_CLASS}>
                        {t.name || t.team_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Team A Placeholder
                  </label>
                  <input
                    type="text"
                    value={editTeamAPlaceholder}
                    onChange={(e) => setEditTeamAPlaceholder(e.target.value)}
                    placeholder="e.g. Winner of R1M1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Team B Placeholder
                  </label>
                  <input
                    type="text"
                    value={editTeamBPlaceholder}
                    onChange={(e) => setEditTeamBPlaceholder(e.target.value)}
                    placeholder="e.g. Winner of R1M2"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Series Format (Strict)
                  </label>
                  <select
                    value={editSeriesFormat}
                    onChange={(e) => setEditSeriesFormat(e.target.value as "BO1" | "BO3")}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#E56A10]"
                  >
                    <option value="BO1" className={OPTION_CLASS}>Best of 1 (First to 1 Win)</option>
                    <option value="BO3" className={OPTION_CLASS}>Best of 3 (First to 2 Wins)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    value={editScheduledTime}
                    onChange={(e) => setEditScheduledTime(e.target.value)}
                    placeholder="e.g. Tomorrow 6:00 PM IST"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
              </div>

              {/* Advancement Destination Mapping */}
              <div className="p-3 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300">
                  <ArrowRight className="w-3.5 h-3.5 text-[#E56A10]" />
                  <span>Winner Advancement Destination</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-0.5">
                      Target Downstream Match
                    </label>
                    <select
                      value={editNextMatchId}
                      onChange={(e) => setEditNextMatchId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                    >
                      <option value="" className={OPTION_CLASS}>Automatic Progression (Standard)</option>
                      {candidateMatches.filter((cm) => cm.id !== editingMatch?.id).map((cm) => (
                        <option key={cm.id} value={cm.id} className={OPTION_CLASS}>
                          [{cm.round_name || cm.stage}] Match #{cm.match_number || 1} ({cm.team_a_name || cm.team_a_placeholder || "Slot A"} vs {cm.team_b_name || cm.team_b_placeholder || "Slot B"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-0.5">
                      Target Slot
                    </label>
                    <select
                      value={editNextMatchSlot}
                      onChange={(e) => setEditNextMatchSlot(e.target.value as "A" | "B")}
                      className="w-full px-2 py-1.5 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                    >
                      <option value="A" className={OPTION_CLASS}>Slot A (Contender 1)</option>
                      <option value="B" className={OPTION_CLASS}>Slot B (Contender 2)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Match-Specific Join Information (Credentials) */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#E56A10]" />
                    <span className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
                      Match Join Credentials
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-700 dark:text-slate-300 font-bold">
                    <input
                      type="checkbox"
                      checked={editJoinInfoEnabled}
                      onChange={(e) => setEditJoinInfoEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-[#E56A10] focus:ring-[#E56A10] cursor-pointer"
                    />
                    <span>Enable for Participants</span>
                  </label>
                </div>

                {editJoinInfoEnabled && (
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-[#242C3D]">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                          Join Code / Lobby Code
                        </label>
                        <input
                          type="text"
                          value={editJoinCode}
                          onChange={(e) => setEditJoinCode(e.target.value)}
                          placeholder="e.g. AMT-8821"
                          className="w-full px-3 py-1.5 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                          Password
                        </label>
                        <input
                          type="text"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="e.g. scrim99"
                          className="w-full px-3 py-1.5 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                          Party ID
                        </label>
                        <input
                          type="text"
                          value={editPartyId}
                          onChange={(e) => setEditPartyId(e.target.value)}
                          placeholder="e.g. PARTY_41"
                          className="w-full px-2 py-1.5 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                          Room ID
                        </label>
                        <input
                          type="text"
                          value={editRoomId}
                          onChange={(e) => setEditRoomId(e.target.value)}
                          placeholder="e.g. ROOM_77"
                          className="w-full px-2 py-1.5 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                          Lobby ID
                        </label>
                        <input
                          type="text"
                          value={editLobbyId}
                          onChange={(e) => setEditLobbyId(e.target.value)}
                          placeholder="e.g. LOBBY_12"
                          className="w-full px-2 py-1.5 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                        Direct Join Link (Optional)
                      </label>
                      <input
                        type="url"
                        value={editJoinLink}
                        onChange={(e) => setEditJoinLink(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                        Match Message / Arbiter Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={editMatchMessage}
                        onChange={(e) => setEditMatchMessage(e.target.value)}
                        placeholder="Important rules, server region (e.g. Mumbai), spectator policies, or arbiter Discord tags..."
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#111520] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Countdown Reminders Section */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
                    Send Match Reminders
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400">
                  Trigger notifications directly to confirmed participants of this match.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {REMINDER_TYPES.map((rt) => {
                    const isSent = editingMatch.sent_reminders?.includes(rt.id);
                    const isSending = activeReminderSending === rt.id;

                    return (
                      <button
                        key={rt.id}
                        type="button"
                        disabled={isSent || Boolean(activeReminderSending)}
                        onClick={() => handleSendReminder(editingMatch.id, rt.id)}
                        className={`p-2 rounded-lg text-[10px] font-mono font-bold uppercase flex items-center justify-between border transition-all cursor-pointer ${
                          isSent
                            ? "bg-slate-100 dark:bg-[#1A2234] border-slate-300 dark:border-[#2E384D] text-slate-400 dark:text-slate-500 cursor-not-allowed"
                            : "bg-white dark:bg-[#111520] border-blue-300 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        }`}
                      >
                        <span className="truncate mr-1">{rt.label}</span>
                        {isSending ? (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-500 shrink-0" />
                        ) : isSent ? (
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        ) : (
                          <Send className="w-3 h-3 text-blue-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E2538] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-[#E56A10] hover:bg-[#D45900] text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENTER SCORE / SET WINNER */}
      {scoringMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#242C3D] max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#242C3D] pb-3">
              <h4 className="font-headline font-bold text-base text-slate-900 dark:text-white uppercase flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#E56A10]" /> Match Score &amp; Result
              </h4>
              <button
                type="button"
                onClick={() => setScoringMatch(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveScoring} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1 truncate">
                    {scoringMatch.team_a?.name || scoringMatch.team_a_name || scoringMatch.team_a_placeholder || "Team A"} Score
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1 truncate">
                    {scoringMatch.team_b?.name || scoringMatch.team_b_name || scoringMatch.team_b_placeholder || "Team B"} Score
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Designate Winning Team
                </label>
                <select
                  value={winnerTeamId}
                  onChange={(e) => setWinnerTeamId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161B26] border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#E56A10]"
                >
                  <option value="" className={OPTION_CLASS}>-- Match Still In Progress (No Winner Yet) --</option>
                  <option value={scoringMatch.team_a_id || scoringMatch.team_a?.id || scoringMatch.team_a_name || scoringMatch.team_a_placeholder} className={OPTION_CLASS}>
                    🏆 {scoringMatch.team_a?.name || scoringMatch.team_a_name || scoringMatch.team_a_placeholder || "Team A"}
                  </option>
                  <option value={scoringMatch.team_b_id || scoringMatch.team_b?.id || scoringMatch.team_b_name || scoringMatch.team_b_placeholder} className={OPTION_CLASS}>
                    🏆 {scoringMatch.team_b?.name || scoringMatch.team_b_name || scoringMatch.team_b_placeholder || "Team B"}
                  </option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#161B26] border border-slate-200 dark:border-[#242C3D] rounded-lg flex items-center gap-2">
                <input
                  type="checkbox"
                  id="markCompleteCheck"
                  checked={markComplete}
                  onChange={(e) => setMarkComplete(e.target.checked)}
                  className="rounded border-slate-300 text-[#E56A10] focus:ring-[#E56A10] cursor-pointer"
                />
                <label htmlFor="markCompleteCheck" className="text-xs font-mono text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
                  Mark match as COMPLETED (advances tournament standing)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#242C3D]">
                <button
                  type="button"
                  onClick={() => setScoringMatch(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-[#242C3D] rounded-lg text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E2538] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingScore}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingScore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Result</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export { UnifiedMatchupBuilder };
