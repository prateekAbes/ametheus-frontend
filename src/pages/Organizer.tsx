import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Container, Hud, Badge, Dot, Cta, SectionHead, Modal, Panel, Portal } from '../components/ui'
import { BattleRoyaleResultsModal } from '../components/admin/BattleRoyaleResultsModal'
import { useAuthContext } from '../context/AuthContext'
import {
  getMyOrganizedTournaments,
  createTournamentOrganizer,
  updateTournamentOrganizer,
  publishTournamentOrganizer,
  closeRegistrationOrganizer,
  reopenRegistrationOrganizer,
  generateBracketOrganizer,
  cancelTournamentOrganizer,
  startLiveTournamentOrganizer,
  completeTournamentOrganizer,
} from '../services/organizer'
import { getGames, Game } from '../services/games'
import {
  Tournament,
  normalizeTournament,
  getTournamentRegistrations,
} from '../services/tournaments'
import {
  getMatches,
  submitMatchResult,
  updateMatch,
  updateMatchCredentialsAdmin,
  releaseMatchCredentialsAdmin,
  ApiMatch,
} from '../services/matches'
import {
  createMatchRequest,
  getMyMatchRequests,
  sendOrganizerEmail,
  getMyOrganizerEmails,
  replyToOrganizerEmailThread,
  MatchRequest,
  OrganizerEmailThread,
} from '../services/organizerComm'
import { inr } from '../lib/data'

export default function Organizer() {
  const { profile, isOrganizer, isLoading: authLoading } = useAuthContext()

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [matches, setMatches] = useState<ApiMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  // Tab Navigation
  const [activeTab, setActiveTab] = useState<'TOURNAMENTS' | 'MATCH_REQUESTS' | 'EMAILS'>('TOURNAMENTS')

  // Live Match Requests State
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([])
  const [matchRequestFilter, setMatchRequestFilter] = useState('ALL')
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [newRequestForm, setNewRequestForm] = useState({
    tournament_id: '',
    title: '',
    team_a_name: '',
    team_b_name: '',
    round_name: '',
    scheduled_at: '',
    youtube_live_url: '',
    notes: '',
    urgency: 'NORMAL',
  })
  const [submittingReq, setSubmittingReq] = useState(false)

  // Email Admin State
  const [emailThreads, setEmailThreads] = useState<OrganizerEmailThread[]>([])
  const [emailStatusFilter, setEmailStatusFilter] = useState('ALL')
  const [isNewEmailOpen, setIsNewEmailOpen] = useState(false)
  const [newEmailForm, setNewEmailForm] = useState({
    subject: '',
    message: '',
    category: 'GENERAL',
    urgency: 'NORMAL',
  })
  const [submittingEmail, setSubmittingEmail] = useState(false)

  const [activeThread, setActiveThread] = useState<OrganizerEmailThread | null>(null)
  const [threadReplyText, setThreadReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  // Creation Wizard State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    game_id: '',
    participation_mode: 'SQUAD',
    is_solo: false,
    min_team_size: 4,
    max_team_size: 4,
    format: 'Knockout',
    tournament_type: 'Knockout',
    match_format: 'Best of 1',
    whatsapp_group_url: '',
    discord_url: '',
    server_region: 'AWS Mumbai (ap-south-1)',
    prize_pool_inr: 10000,
    entry_fee_inr: 0,
    max_teams: 16,
    start_date: '',
    start_time: '18:00',
    starts_at: '',
    rank_requirement: 'Open to All Ranks',
    description: 'Sanctioned competitive esports tournament. Anti-cheat verification mandatory.',
    rules: '1. Standard competitive rules apply.\n2. Roster check-in required 15 mins prior to match start.\n3. Toxic conduct or cheating results in immediate disqualification.',
    enable_mvp: true,
    prize_distribution: [
      { id: 'pz_1', name: 'Champions', amount: 6000 },
      { id: 'pz_2', name: 'Runner Up', amount: 4000 },
    ] as Array<{ id: string; name: string; amount: number; category_name?: string; prize_amount?: number }>,
  })

  // Edit Tournament State
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Rosters Modal State
  const [viewingRostersTour, setViewingRostersTour] = useState<Tournament | null>(null)
  const [rostersList, setRostersList] = useState<any[]>([])
  const [loadingRosters, setLoadingRosters] = useState(false)

  // Match Arbitration State
  const [selectedMatch, setSelectedMatch] = useState<ApiMatch | null>(null)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [winnerTeamId, setWinnerTeamId] = useState('')
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)
  const [selectedBrMatch, setSelectedBrMatch] = useState<ApiMatch | null>(null)

  // Tournament Cockpit State (Drill-down from Overview)
  const [managingTournament, setManagingTournament] = useState<any | null>(null)
  const [cockpitMatches, setCockpitMatches] = useState<ApiMatch[]>([])
  const [cockpitRosters, setCockpitRosters] = useState<any[]>([])
  const [loadingCockpit, setLoadingCockpit] = useState(false)
  const [cockpitTab, setCockpitTab] = useState<'MATCHES' | 'ROSTERS' | 'COMMUNITY'>('MATCHES')
  const [cockpitWhatsappUrl, setCockpitWhatsappUrl] = useState('')
  const [cockpitDiscordUrl, setCockpitDiscordUrl] = useState('')
  const [savingCommunityLinks, setSavingCommunityLinks] = useState(false)

  // Stream & Room Creds State
  const [selectedLobbyMatch, setSelectedLobbyMatch] = useState<ApiMatch | null>(null)
  const [lobbyCode, setLobbyCode] = useState('')
  const [lobbyPassword, setLobbyPassword] = useState('')
  const [serverRegion, setServerRegion] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [streamUrl, setStreamUrl] = useState('')
  const [isSavingLobby, setIsSavingLobby] = useState(false)
  const [isReleasingCreds, setIsReleasingCreds] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [tList, gList, mList, reqList, mailList] = await Promise.all([
        getMyOrganizedTournaments().catch(() => []),
        getGames(true).catch(() => []),
        getMatches().catch(() => []),
        getMyMatchRequests().catch(() => []),
        getMyOrganizerEmails().catch(() => []),
      ])
      setTournaments(tList)
      setGames(gList)
      setMatches(mList)
      setMatchRequests(reqList)
      setEmailThreads(mailList)

      if (gList.length > 0 && !formData.game_id) {
        setFormData((prev) => ({
          ...prev,
          game_id: gList[0].slug || gList[0].id,
        }))
      }
      if (tList.length > 0 && !newRequestForm.tournament_id) {
        setNewRequestForm((prev) => ({
          ...prev,
          tournament_id: tList[0].id || tList[0].slug,
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOrganizer) {
      loadData()
    }
  }, [isOrganizer])

  const handleGameChange = (gameVal: string) => {
    const sel = games.find((g) => g.id === gameVal || g.slug === gameVal)
    const modes: string[] = sel
      ? ((sel as any).supported_game_modes || (sel as any).supportedGameModes || (sel.is_team_game === false ? ['SOLO'] : ['SQUAD'])).map((m: string) => m.toUpperCase().trim())
      : ['SOLO', 'DUO', 'SQUAD']
    const nextMode = modes.includes((formData.participation_mode || '').toUpperCase())
      ? (formData.participation_mode || '').toUpperCase()
      : modes[0] || 'SQUAD'
    const isSolo = nextMode === 'SOLO'
    const teamSize = nextMode === 'SOLO' ? 1 : (nextMode === 'DUO' ? 2 : 4)

    setFormData((prev) => ({
      ...prev,
      game_id: gameVal,
      participation_mode: nextMode,
      is_solo: isSolo,
      min_team_size: teamSize,
      max_team_size: teamSize,
      format: 'Knockout',
    }))
  }

  const openCreateModal = () => {
    setEditingTournament(null)
    const initGame = games[0]
    const modes: string[] = initGame
      ? ((initGame as any).supported_game_modes || (initGame as any).supportedGameModes || (initGame.is_team_game === false ? ['SOLO'] : ['SQUAD'])).map((m: string) => m.toUpperCase().trim())
      : ['SOLO', 'DUO', 'SQUAD']
    const defaultMode = modes[0] || 'SQUAD'
    setFormData({
      title: '',
      game_id: initGame?.slug || initGame?.id || '',
      participation_mode: defaultMode,
      is_solo: defaultMode === 'SOLO',
      min_team_size: defaultMode === 'SOLO' ? 1 : (defaultMode === 'DUO' ? 2 : 4),
      max_team_size: defaultMode === 'SOLO' ? 1 : (defaultMode === 'DUO' ? 2 : 4),
      format: 'Knockout',
      tournament_type: 'Knockout',
      match_format: 'Best of 1',
      whatsapp_group_url: '',
      discord_url: '',
      server_region: 'AWS Mumbai (ap-south-1)',
      prize_pool_inr: 10000,
      entry_fee_inr: 0,
      max_teams: 16,
      start_date: '',
      start_time: '18:00',
      starts_at: '',
      rank_requirement: 'Open to All Ranks',
      description: 'Sanctioned competitive esports tournament. Anti-cheat verification mandatory.',
      rules: '1. Standard competitive rules apply.\n2. Roster check-in required 15 mins prior to match start.\n3. Toxic conduct or cheating results in immediate disqualification.',
      enable_mvp: true,
      prize_distribution: [
        { id: 'pz_1', name: 'Champions', amount: 6000 },
        { id: 'pz_2', name: 'Runner Up', amount: 4000 },
      ],
    })
    setIsCreateModalOpen(true)
  }

  const openEditModal = (t: any) => {
    setEditingTournament(t)
    const pMode = ((t as any).participation_mode || (t as any).participationMode || (t.is_solo ? 'SOLO' : 'SQUAD')).toUpperCase().trim()
    const startDateVal = t.starts_at ? t.starts_at.split('T')[0] : ''
    const startTimeVal = t.starts_at && t.starts_at.includes('T') ? t.starts_at.split('T')[1].slice(0, 5) : '18:00'
    const rawPrizes = Array.isArray(t.prize_distribution) ? t.prize_distribution : []
    setFormData({
      title: t.title || '',
      game_id: t.game_id || t.gameId || games[0]?.slug || '',
      participation_mode: pMode,
      is_solo: pMode === 'SOLO',
      min_team_size: pMode === 'SOLO' ? 1 : (pMode === 'DUO' ? 2 : 4),
      max_team_size: pMode === 'SOLO' ? 1 : (pMode === 'DUO' ? 2 : 4),
      format: t.format || 'Knockout',
      tournament_type: t.tournament_type || t.format || 'Knockout',
      match_format: t.match_format || 'Best of 1',
      whatsapp_group_url: t.whatsapp_group_url || '',
      discord_url: t.discord_url || (t as any).community_link || '',
      server_region: t.server_region || 'AWS Mumbai (ap-south-1)',
      prize_pool_inr: t.prize_pool_inr ?? t.prizePoolInr ?? 10000,
      entry_fee_inr: t.entry_fee_inr ?? t.entryFeeInr ?? 0,
      max_teams: t.max_teams || t.maxTeams || 16,
      start_date: startDateVal,
      start_time: startTimeVal,
      starts_at: t.starts_at || '',
      rank_requirement: t.rank_requirement || 'Open to All Ranks',
      description: t.description || '',
      rules: Array.isArray(t.rules) ? t.rules.join('\n') : (t.rules || ''),
      enable_mvp: t.enable_mvp !== undefined ? Boolean(t.enable_mvp) : true,
      prize_distribution: rawPrizes.map((p: any, i: number) => ({
        id: p.id || `pz_${i}_${Date.now()}`,
        name: p.name || p.category_name || '',
        amount: Number(p.amount ?? p.prize_amount ?? 0),
      })),
    })
    setIsCreateModalOpen(true)
  }

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const rulesArr = formData.rules.split('\n').map((r) => r.trim()).filter(Boolean)
      let startIso: string
      if (formData.start_date) {
        startIso = new Date(`${formData.start_date}T${formData.start_time || '18:00'}:00`).toISOString()
      } else if (formData.starts_at) {
        startIso = new Date(formData.starts_at).toISOString()
      } else {
        startIso = new Date(Date.now() + 86400000 * 3).toISOString()
      }

      const rawFmt = (formData.tournament_type || formData.format || '').toLowerCase();
      const isBr = rawFmt.includes('battle royale') || rawFmt.includes('battle_royale');
      const isRr = rawFmt.includes('round robin') || rawFmt.includes('round_robin');
      const match_structure = isBr ? 'BATTLE_ROYALE' : isRr ? 'ROUND_ROBIN' : 'KNOCKOUT';
      const pMode = (formData.participation_mode || (formData.is_solo ? 'SOLO' : 'SQUAD')).toUpperCase().trim()
      const is_solo = pMode === 'SOLO'
      const registration_type = is_solo ? 'SOLO' : 'TEAM';
      const team_size = pMode === 'SOLO' ? 1 : (pMode === 'DUO' ? 2 : 4);

      const payload = {
        title: formData.title,
        game_id: formData.game_id,
        participation_mode: pMode,
        is_solo: is_solo,
        registration_type: registration_type,
        match_structure: match_structure,
        prize_pool_inr: Number(formData.prize_pool_inr),
        entry_fee_inr: Number(formData.entry_fee_inr),
        start_date: formData.start_date || undefined,
        start_time: formData.start_time || undefined,
        starts_at: startIso,
        server_region: formData.server_region,
        max_teams: Number(formData.max_teams),
        min_team_size: team_size,
        max_team_size: team_size,
        rank_requirement: formData.rank_requirement,
        format: formData.format,
        tournament_type: formData.tournament_type || formData.format,
        whatsapp_group_url: formData.whatsapp_group_url || undefined,
        discord_url: formData.discord_url || undefined,
        community_link: formData.discord_url || undefined,
        description: formData.description,
        rules: rulesArr,
        enable_mvp: Boolean(formData.enable_mvp),
        prize_distribution: (formData.prize_distribution || []).map((p: any) => ({
          category_name: p.name || p.category_name || '',
          prize_amount: Number(p.amount ?? p.prize_amount ?? 0),
        })),
      }

      if (editingTournament) {
        await updateTournamentOrganizer(editingTournament.id, payload)
        setActionMsg(`Tournament "${formData.title}" updated successfully!`)
      } else {
        await createTournamentOrganizer(payload)
        setActionMsg(`Tournament "${formData.title}" created in DRAFT state!`)
      }

      setIsCreateModalOpen(false)
      setEditingTournament(null)
      setTimeout(() => setActionMsg(null), 4000)
      loadData()
      if (managingTournament && editingTournament?.id === managingTournament?.id) {
        openManageTournament({ ...managingTournament, ...payload })
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save tournament')
    } finally {
      setCreating(false)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await publishTournamentOrganizer(id)
      setActionMsg('Tournament published! Registrations are now OPEN.')
      setTimeout(() => setActionMsg(null), 4000)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to publish tournament')
    }
  }

  const handleCloseReg = async (id: string) => {
    try {
      await closeRegistrationOrganizer(id)
      setActionMsg('Registrations locked. Ready to generate brackets.')
      setTimeout(() => setActionMsg(null), 4000)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to close registrations')
    }
  }

  const handleGenBracket = async (id: string) => {
    try {
      await generateBracketOrganizer(id)
      setActionMsg('Tournament bracket generated! Matches are now LIVE.')
      setTimeout(() => setActionMsg(null), 4000)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to generate bracket')
    }
  }

  const handleStartLive = async (id: string) => {
    try {
      await startLiveTournamentOrganizer(id)
      setActionMsg('Tournament transitioned to LIVE state! Matches are active.')
      setTimeout(() => setActionMsg(null), 4000)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to start tournament live')
    }
  }

  const handleCompleteTournament = async (id: string) => {
    if (!confirm('Mark this tournament as COMPLETED? All matches and results will be finalized.')) return
    try {
      await completeTournamentOrganizer(id)
      setActionMsg('Tournament successfully marked as COMPLETED.')
      setTimeout(() => setActionMsg(null), 4000)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to complete tournament')
    }
  }

  const handleReopenReg = async (id: string) => {
    try {
      await reopenRegistrationOrganizer(id)
      setActionMsg('Registration reopened for contenders.')
      setTimeout(() => setActionMsg(null), 4000)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to reopen registration')
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this tournament? This will refund registered teams.')) return
    try {
      await cancelTournamentOrganizer(id)
      setActionMsg('Tournament cancelled successfully.')
      setTimeout(() => setActionMsg(null), 4000)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to cancel tournament')
    }
  }

  const openRostersModal = async (tour: Tournament) => {
    setViewingRostersTour(tour)
    setLoadingRosters(true)
    try {
      const data = await getTournamentRegistrations(tour.id || tour.slug)
      setRostersList(data || [])
    } catch {
      setRostersList([])
    } finally {
      setLoadingRosters(false)
    }
  }

  const openArbitrationModal = (m: ApiMatch) => {
    setSelectedMatch(m)
    setScoreA(m.team_a?.score ?? 0)
    setScoreB(m.team_b?.score ?? 0)
    setWinnerTeamId(m.winner_team_id || '')
  }

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMatch) return
    setIsSubmittingScore(true)
    try {
      await submitMatchResult(selectedMatch.id, {
        score_a: Number(scoreA),
        score_b: Number(scoreB),
        winner_team_id: winnerTeamId || (scoreA > scoreB ? selectedMatch.team_a?.id : selectedMatch.team_b?.id),
      })
      setActionMsg(`Match score submitted: ${scoreA} - ${scoreB}`)
      setTimeout(() => setActionMsg(null), 4000)
      setSelectedMatch(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to submit match score')
    } finally {
      setIsSubmittingScore(false)
    }
  }

  const openManageTournament = async (t: any) => {
    setManagingTournament(t)
    setCockpitTab('MATCHES')
    setCockpitWhatsappUrl(t.whatsapp_group_url || t.community_link || '')
    setCockpitDiscordUrl(t.discord_url || '')
    setLoadingCockpit(true)
    try {
      const [allM, rosters] = await Promise.all([
        getMatches({ tournament_id: t.id || t.slug }),
        getTournamentRegistrations(t.id || t.slug).catch(() => []),
      ])
      const tid = t.id || t.slug
      const filtered = allM.filter((m: ApiMatch) => m.tournament_id === tid || m.tournament_id === t.slug)
      setCockpitMatches(filtered.length > 0 ? filtered : allM)
      setCockpitRosters(rosters || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingCockpit(false)
    }
  }

  const handleSaveCommunityLinks = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!managingTournament) return
    setSavingCommunityLinks(true)
    try {
      await updateTournamentOrganizer(managingTournament.id, {
        whatsapp_group_url: cockpitWhatsappUrl.trim(),
        discord_url: cockpitDiscordUrl.trim(),
      })
      setActionMsg('✓ Official community links saved successfully.')
      setTimeout(() => setActionMsg(null), 4000)
      setManagingTournament((prev: any) =>
        prev
          ? {
              ...prev,
              whatsapp_group_url: cockpitWhatsappUrl.trim(),
              discord_url: cockpitDiscordUrl.trim(),
            }
          : null
      )
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update community links')
    } finally {
      setSavingCommunityLinks(false)
    }
  }

  const openLobbyModal = (m: ApiMatch) => {
    setSelectedLobbyMatch(m)
    setLobbyCode(m.room_id || '')
    setLobbyPassword(m.room_password || '')
    setServerRegion(m.server_region || 'AWS Mumbai (ap-south-1)')
    setCustomInstructions(m.custom_instructions || m.match_message || '')
    setStreamUrl(m.youtube_live_url || m.live_link || '')
  }

  const handleSaveLobbyCredentials = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedLobbyMatch) return
    setIsSavingLobby(true)
    try {
      await updateMatchCredentialsAdmin(selectedLobbyMatch.id, {
        room_id: lobbyCode.trim(),
        room_password: lobbyPassword.trim(),
        server_region: serverRegion.trim(),
        custom_instructions: customInstructions.trim(),
      })
      if (streamUrl.trim()) {
        await updateMatch(selectedLobbyMatch.id, {
          youtube_live_url: streamUrl.trim(),
        })
      }
      setActionMsg('✓ Match credentials saved (unreleased).')
      setTimeout(() => setActionMsg(null), 4000)
      setSelectedLobbyMatch(null)
      if (managingTournament) {
        openManageTournament(managingTournament)
      } else {
        loadData()
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save match credentials')
    } finally {
      setIsSavingLobby(false)
    }
  }

  const handleReleaseCredentials = async () => {
    if (!selectedLobbyMatch) return
    if (!lobbyCode.trim() || !lobbyPassword.trim()) {
      alert('Please enter and save Room ID and Password before releasing.')
      return
    }
    if (!confirm('Release room credentials to registered participants now? Captain check-in will immediately open.')) {
      return
    }
    setIsReleasingCreds(true)
    try {
      await updateMatchCredentialsAdmin(selectedLobbyMatch.id, {
        room_id: lobbyCode.trim(),
        room_password: lobbyPassword.trim(),
        server_region: serverRegion.trim(),
        custom_instructions: customInstructions.trim(),
      })
      await releaseMatchCredentialsAdmin(selectedLobbyMatch.id)
      setActionMsg('✓ Credentials released and check-in window opened!')
      setTimeout(() => setActionMsg(null), 5000)
      setSelectedLobbyMatch(null)
      if (managingTournament) {
        openManageTournament(managingTournament)
      } else {
        loadData()
      }
    } catch (err: any) {
      alert(err.message || 'Failed to release credentials')
    } finally {
      setIsReleasingCreds(false)
    }
  }

  const handleOpenMatchRequest = (tournamentId: string) => {
    setNewRequestForm((prev) => ({
      ...prev,
      tournament_id: tournamentId,
    }))
    setActiveTab('MATCH_REQUESTS')
    setIsRequestModalOpen(true)
  }

  const handleCreateMatchRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRequestForm.tournament_id) {
      alert('Please select a tournament.')
      return
    }
    setSubmittingReq(true)
    try {
      await createMatchRequest(newRequestForm)
      setActionMsg('Match request submitted successfully to admin team!')
      setTimeout(() => setActionMsg(null), 4000)
      setIsRequestModalOpen(false)
      setNewRequestForm({
        tournament_id: tournaments[0]?.id || '',
        title: '',
        team_a_name: '',
        team_b_name: '',
        round_name: '',
        scheduled_at: '',
        youtube_live_url: '',
        notes: '',
        urgency: 'NORMAL',
      })
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to submit match request')
    } finally {
      setSubmittingReq(false)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmailForm.subject.trim() || !newEmailForm.message.trim()) {
      alert('Subject and message are required.')
      return
    }
    setSubmittingEmail(true)
    try {
      await sendOrganizerEmail(newEmailForm)
      setActionMsg('Inquiry sent to admin team successfully!')
      setTimeout(() => setActionMsg(null), 4000)
      setIsNewEmailOpen(false)
      setNewEmailForm({
        subject: '',
        message: '',
        category: 'GENERAL',
        urgency: 'NORMAL',
      })
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to send inquiry')
    } finally {
      setSubmittingEmail(false)
    }
  }

  const handleThreadReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeThread || !threadReplyText.trim()) return
    setSubmittingReply(true)
    try {
      const updated = await replyToOrganizerEmailThread(activeThread.id, threadReplyText.trim())
      setActiveThread(updated)
      setThreadReplyText('')
      setActionMsg('Reply sent.')
      setTimeout(() => setActionMsg(null), 3000)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to send reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  const isAnyModalOpen =
    isCreateModalOpen ||
    !!viewingRostersTour ||
    !!selectedMatch ||
    !!selectedLobbyMatch ||
    isRequestModalOpen ||
    isNewEmailOpen ||
    !!activeThread

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isAnyModalOpen])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <Hud className="text-cyan animate-pulse">VERIFYING ORGANIZER PERMISSIONS...</Hud>
      </div>
    )
  }

  if (!isOrganizer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-void px-6 text-center">
        <span className="font-mono text-5xl text-warn">403</span>
        <h1 className="mt-4 font-display text-4xl font-black uppercase">Organizer Portal</h1>
        <p className="mt-2 max-w-md text-dim">You must have an Organizer or Super Admin role to access this portal.</p>
        <div className="mt-8">
          <Cta to="/">Return to Home</Cta>
        </div>
      </div>
    )
  }

  const activeCount = tournaments.filter((t) => t.status === 'REGISTRATION_OPEN' || t.status === 'LIVE').length
  const totalPrizeVault = tournaments.reduce((acc, t) => acc + (t.prize_pool_inr || 0), 0)

  return (
    <div className="min-h-screen bg-void pb-32 pt-28">
      <Container>
        {/* Cockpit Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-cyan animate-pulse" />
              <Hud className="text-cyan">ORGANIZER COMMAND COCKPIT</Hud>
              <span className="border border-warn/40 bg-warn/10 px-2 py-0.5 font-mono text-[9px] uppercase text-warn">
                ORGANIZER ROLE
              </span>
            </div>
            <h1 className="mt-2 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-black uppercase leading-none">
              Tournament Manager
            </h1>
            <p className="mt-2 text-dim">Full platform operations: seed brackets, manage rosters, publish events, and arbitrate live matches.</p>
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={() => {
                loadData()
                setActionMsg('Refreshed tournaments and matches from database.')
                setTimeout(() => setActionMsg(null), 3000)
              }}
              className="border border-white/20 bg-surface px-4 py-2 font-mono text-xs uppercase text-dim hover:text-ink hover:border-cyan transition-colors"
            >
              ↻ Refresh
            </button>
            <Cta onClick={openCreateModal}>+ New Tournament</Cta>
          </div>
        </div>

        {actionMsg && (
          <div className="mt-6 border border-ok/40 bg-ok/10 p-4 text-ok font-mono text-xs uppercase tracking-[0.16em]">
            ✓ {actionMsg}
          </div>
        )}

        {/* Organizer Metrics Bar */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Panel className="p-5">
            <Hud className="text-dim">TOTAL EVENTS</Hud>
            <p className="mt-2 font-display text-4xl font-black">{tournaments.length}</p>
          </Panel>
          <Panel className="p-5">
            <Hud className="text-cyan">ACTIVE / LIVE</Hud>
            <p className="mt-2 font-display text-4xl font-black text-cyan">{activeCount}</p>
          </Panel>
          <Panel className="p-5">
            <Hud className="text-ok">ESCROW PRIZE VAULT</Hud>
            <p className="mt-2 font-display text-4xl font-black text-ok">{inr(totalPrizeVault)}</p>
          </Panel>
          <Panel className="p-5">
            <Hud className="text-dim">MATCHES MONITORED</Hud>
            <p className="mt-2 font-display text-4xl font-black">{matches.length}</p>
          </Panel>
        </div>

        {/* Organizer Tab Navigation */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('TOURNAMENTS')}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
              activeTab === 'TOURNAMENTS'
                ? 'border-b-2 border-cyan bg-cyan/10 text-cyan font-bold'
                : 'text-dim hover:text-ink'
            }`}
          >
            My Tournaments ({tournaments.length})
          </button>
          <button
            onClick={() => setActiveTab('MATCH_REQUESTS')}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
              activeTab === 'MATCH_REQUESTS'
                ? 'border-b-2 border-cyan bg-cyan/10 text-cyan font-bold'
                : 'text-dim hover:text-ink'
            }`}
          >
            Live Match Requests ({matchRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('EMAILS')}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
              activeTab === 'EMAILS'
                ? 'border-b-2 border-cyan bg-cyan/10 text-cyan font-bold'
                : 'text-dim hover:text-ink'
            }`}
          >
            Email Admin / Inbox ({emailThreads.length})
          </button>
        </div>

        {activeTab === 'TOURNAMENTS' && (
          <>
            {managingTournament ? (
              /* Dedicated Tournament Operations Cockpit */
              <div className="mt-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div className="space-y-2">
                    <button
                      onClick={() => setManagingTournament(null)}
                      className="font-mono text-xs uppercase text-cyan hover:underline flex items-center gap-1 mb-2"
                    >
                      ← Back to All Tournaments
                    </button>
                    <div className="flex items-center gap-3">
                      <Badge s={managingTournament.status} />
                      <span className="font-mono text-xs text-dim">· {managingTournament.format || managingTournament.tournament_type || 'Knockout'}</span>
                      {managingTournament.is_solo && <span className="font-mono text-[10px] px-2 py-0.5 bg-cyan/10 border border-cyan/30 text-cyan">SOLO</span>}
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl font-black uppercase text-ink">
                      {managingTournament.title}
                    </h2>
                    <p className="font-mono text-xs text-dim">
                      Game: <strong className="text-cyan">{managingTournament.game_name || managingTournament.game_id}</strong> · Prize: <strong className="text-ink">{inr(managingTournament.prize_pool_inr || 0)}</strong> · Entries: <strong className="text-ink">{cockpitRosters.length} / {managingTournament.max_teams || 16}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/tournaments/${managingTournament.slug || managingTournament.id}`}
                      target="_blank"
                      className="border border-white/20 px-3 py-2 font-mono text-xs uppercase hover:border-cyan hover:text-cyan transition-colors"
                    >
                      Public Page ↗
                    </Link>
                    <button
                      onClick={() => openEditModal(managingTournament)}
                      className="border border-white/20 px-3 py-2 font-mono text-xs uppercase hover:border-ink text-ink transition-colors"
                    >
                      Edit Tournament
                    </button>
                    {managingTournament.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(managingTournament.id)}
                        className="border border-ok/50 bg-ok/10 px-3 py-2 font-mono text-xs uppercase text-ok hover:bg-ok/20 transition-colors"
                      >
                        Publish Open
                      </button>
                    )}
                    {managingTournament.status === 'REGISTRATION_OPEN' && (
                      <button
                        onClick={() => handleCloseReg(managingTournament.id)}
                        className="border border-warn/50 bg-warn/10 px-3 py-2 font-mono text-xs uppercase text-warn hover:bg-warn/20 transition-colors"
                      >
                        Lock Rosters
                      </button>
                    )}
                    {managingTournament.status === 'REGISTRATION_CLOSED' && (
                      <>
                        <button
                          onClick={() => handleGenBracket(managingTournament.id)}
                          className="border border-cyan bg-cyan/15 px-3 py-2 font-mono text-xs uppercase text-cyan hover:bg-cyan/30 transition-colors font-bold"
                        >
                          ⚡ Gen Bracket & Start Live
                        </button>
                        <button
                          onClick={() => handleReopenReg(managingTournament.id)}
                          className="border border-white/20 bg-surface px-3 py-2 font-mono text-xs uppercase text-dim hover:text-ink hover:border-cyan transition-colors"
                        >
                          Reopen Reg
                        </button>
                      </>
                    )}
                    {managingTournament.status === 'LIVE' && (
                      <button
                        onClick={() => handleCompleteTournament(managingTournament.id)}
                        className="border border-ok bg-ok/20 px-3 py-2 font-mono text-xs uppercase text-ok hover:bg-ok/30 transition-colors font-bold"
                      >
                        ✓ Complete Event
                      </button>
                    )}
                  </div>
                </div>

                {/* Cockpit Navigation Tabs */}
                <div className="flex border-b border-white/10 gap-2 font-mono text-xs uppercase">
                  <button
                    onClick={() => setCockpitTab('MATCHES')}
                    className={`px-4 py-2 border-b-2 transition-colors ${
                      cockpitTab === 'MATCHES'
                        ? 'border-cyan bg-cyan/10 text-cyan font-bold'
                        : 'border-transparent text-dim hover:text-ink'
                    }`}
                  >
                    Match Cockpit & Room Credentials ({cockpitMatches.length})
                  </button>
                  <button
                    onClick={() => setCockpitTab('ROSTERS')}
                    className={`px-4 py-2 border-b-2 transition-colors ${
                      cockpitTab === 'ROSTERS'
                        ? 'border-cyan bg-cyan/10 text-cyan font-bold'
                        : 'border-transparent text-dim hover:text-ink'
                    }`}
                  >
                    Confirmed Rosters ({cockpitRosters.length})
                  </button>
                  <button
                    onClick={() => setCockpitTab('COMMUNITY')}
                    className={`px-4 py-2 border-b-2 transition-colors ${
                      cockpitTab === 'COMMUNITY'
                        ? 'border-cyan bg-cyan/10 text-cyan font-bold'
                        : 'border-transparent text-dim hover:text-ink'
                    }`}
                  >
                    Official Community Links
                  </button>
                </div>

                {/* Cockpit Tab 1: Matches & Credentials */}
                {cockpitTab === 'MATCHES' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-xl font-bold uppercase text-ink">Scheduled Tournament Matches</h3>
                        <p className="text-xs text-dim">Configure room credentials, stream broadcast links, and arbitrate scores for this tournament.</p>
                      </div>
                      <button
                        onClick={() => openManageTournament(managingTournament)}
                        className="border border-white/20 px-3 py-1 font-mono text-xs text-dim hover:text-ink hover:border-cyan"
                      >
                        ↻ Refresh Matches
                      </button>
                    </div>

                    {loadingCockpit ? (
                      <div className="p-12 text-center border border-white/10 font-mono text-xs text-cyan animate-pulse">
                        FETCHING TOURNAMENT MATCHES & CREDENTIALS...
                      </div>
                    ) : cockpitMatches.length === 0 ? (
                      <div className="border border-dashed border-white/15 p-12 text-center space-y-3">
                        <p className="font-display text-2xl font-bold uppercase text-dim">No Matches Scheduled Yet</p>
                        <p className="text-xs text-dim max-w-md mx-auto">
                          Matches are generated once registrations are closed and the bracket is seeded.
                        </p>
                        {managingTournament.status === 'REGISTRATION_CLOSED' && (
                          <button
                            onClick={() => handleGenBracket(managingTournament.id)}
                            className="mt-3 border border-cyan bg-cyan/15 px-4 py-2 font-mono text-xs uppercase text-cyan hover:bg-cyan/30 transition-colors font-bold"
                          >
                            ⚡ Generate Bracket / Lobbies Now
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {cockpitMatches.map((m) => {
                          const hasCreds = !!m.room_id
                          const isReleased = !!m.credentials_released
                          const isBR = (managingTournament.format || '').toLowerCase().includes('battle') || (managingTournament.tournament_type || '').toLowerCase().includes('battle')
                          const isSolo = !!(managingTournament.is_solo)

                          return (
                            <div key={m.id} className="border border-white/15 bg-graphite p-5 space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs text-cyan font-bold uppercase">
                                  {m.stage || (isBR ? `Lobby Match ${m.match_order || 1}` : `Match ${m.match_order || 1}`)}
                                </span>
                                <Badge s={m.status || 'SCHEDULED'} />
                              </div>

                              {isBR ? (
                                <div className="border-y border-white/5 py-3 space-y-2">
                                  <div className="flex items-center justify-between font-mono text-xs">
                                    <span className="text-dim">Contenders:</span>
                                    <strong className="text-cyan">{m.squads_count || (m.teams ? m.teams.length : (m.team_ids ? m.team_ids.length : 0))} Participants</strong>
                                  </div>
                                  {m.teams && m.teams.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pt-1">
                                      {m.teams.map((tm: any, idx: number) => (
                                        <span key={idx} className="font-mono text-[10px] px-2 py-0.5 bg-surface border border-white/10 text-dim">
                                          {tm.name || `Team ${idx + 1}`}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center justify-between border-y border-white/5 py-3">
                                  <div className="text-sm font-bold truncate max-w-[140px] text-ink">
                                    {m.team_a?.name || (isSolo ? 'Contender 1' : 'Team 1')}
                                  </div>
                                  <div className="font-mono text-xs px-2.5 py-1 bg-surface border border-white/10 font-bold">
                                    {m.team_a?.score ?? 0} : {m.team_b?.score ?? 0}
                                  </div>
                                  <div className="text-sm font-bold truncate max-w-[140px] text-right text-ink">
                                    {m.team_b?.name || (isSolo ? 'Contender 2' : 'Team 2')}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-xs font-mono">
                                <div className="flex items-center gap-2">
                                  {isReleased ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-ok/10 border border-ok/30 text-ok text-[11px] font-bold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
                                      Credentials Released (Check-in Open)
                                    </span>
                                  ) : hasCreds ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-warn/10 border border-warn/30 text-warn text-[11px]">
                                      🔒 Draft Saved (Unreleased)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 text-dim text-[11px]">
                                      ⚠️ No Credentials Set
                                    </span>
                                  )}
                                </div>

                                <span className="text-[11px] text-dim">{m.server_region || 'AWS Mumbai'}</span>
                              </div>

                              {hasCreds && (
                                <div className="bg-surface/60 border border-white/10 p-2.5 font-mono text-[11px] grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-dim block text-[10px]">ROOM ID:</span>
                                    <span className="text-ink font-bold">{m.room_id}</span>
                                  </div>
                                  <div>
                                    <span className="text-dim block text-[10px]">ROOM PASSWORD:</span>
                                    <span className="text-ink font-bold">{m.room_password}</span>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                                <button
                                  onClick={() => openLobbyModal(m)}
                                  className="border border-white/20 bg-surface px-3 py-1.5 font-mono text-xs text-ink hover:border-cyan hover:text-cyan transition-colors"
                                >
                                  Room & Credentials
                                </button>
                                {isBR ? (
                                  <button
                                    onClick={() => setSelectedBrMatch(m)}
                                    className="border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs text-cyan hover:bg-cyan/20 transition-colors font-bold"
                                  >
                                    {m.status === 'COMPLETED' ? 'View / Edit Qualifiers' : 'Enter Results & Qualifiers'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openArbitrationModal(m)}
                                    className="border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs text-cyan hover:bg-cyan/20 transition-colors font-bold"
                                  >
                                    Submit Score
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Cockpit Tab 2: Rosters */}
                {cockpitTab === 'ROSTERS' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-xl font-bold uppercase text-ink">Registered Rosters & Contenders</h3>
                        <p className="text-xs text-dim">Review verified teams and solo participants entered into this event.</p>
                      </div>
                    </div>
                    {cockpitRosters.length === 0 ? (
                      <div className="border border-dashed border-white/15 p-12 text-center font-mono text-xs text-dim">
                        NO PARTICIPANTS REGISTERED YET
                      </div>
                    ) : (
                      <div className="border border-white/15 divide-y divide-white/10 bg-graphite">
                        {cockpitRosters.map((reg: any, i: number) => (
                          <div key={reg.id || i} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs text-cyan font-bold">#{i + 1}</span>
                                <span className="font-display text-lg font-bold text-ink">{reg.team_name || reg.name || `Contender ${i + 1}`}</span>
                                <Badge s={reg.payment_status === 'COMPLETED' ? 'CONFIRMED' : reg.payment_status || 'PENDING'} />
                              </div>
                              <div className="mt-1 font-mono text-xs text-dim">
                                Captain / Lead: <span className="text-ink">{reg.captain_name || reg.user?.name || 'Player'}</span>
                                {reg.game_user_id && <span className="ml-3 text-cyan">IGN: {reg.game_user_id}</span>}
                              </div>
                            </div>
                            <div className="font-mono text-xs text-dim">
                              Registered: {new Date(reg.created_at || Date.now()).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Cockpit Tab 3: Official Community Links */}
                {cockpitTab === 'COMMUNITY' && (
                  <div className="border border-white/15 bg-graphite p-6 md:p-8 max-w-xl space-y-6">
                    <div>
                      <h3 className="font-display text-2xl font-black uppercase text-ink">Official Tournament Community Links</h3>
                      <p className="text-xs text-dim mt-1">
                        These links are securely displayed to verified registered competitors on their confirmation screen and Competitor Hub to coordinate lobbies and match scheduling.
                      </p>
                    </div>

                    <form onSubmit={handleSaveCommunityLinks} className="space-y-4 font-mono text-xs">
                      <div>
                        <label className="text-ink block uppercase font-bold mb-1">Official WhatsApp Group Invite URL</label>
                        <input
                          type="url"
                          value={cockpitWhatsappUrl}
                          onChange={(e) => setCockpitWhatsappUrl(e.target.value)}
                          placeholder="https://chat.whatsapp.com/..."
                          className="w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                        />
                        <span className="text-[10px] text-dim mt-1 block">
                          Used for urgent announcements, lobby coordinator broadcasts, and match timing.
                        </span>
                      </div>

                      <div>
                        <label className="text-ink block uppercase font-bold mb-1">Official Discord Server / Voice Channel</label>
                        <input
                          type="url"
                          value={cockpitDiscordUrl}
                          onChange={(e) => setCockpitDiscordUrl(e.target.value)}
                          placeholder="https://discord.gg/..."
                          className="w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                        />
                        <span className="text-[10px] text-dim mt-1 block">
                          Used for match referee voice communications and lobby coordination.
                        </span>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={savingCommunityLinks}
                          className="px-6 py-2 bg-cyan text-void font-bold uppercase hover:bg-white transition-colors text-xs"
                        >
                          {savingCommunityLinks ? 'Saving...' : 'Save Community Links'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              /* General Tournament Overview List */
              <div className="mt-12 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h2 className="font-display text-3xl font-black uppercase">My Organized Tournaments</h2>
                  <div className="flex items-center gap-3">
                    <Hud className="text-cyan">{tournaments.length} REGISTERED</Hud>
                    <button
                      onClick={openCreateModal}
                      className="px-4 py-1.5 bg-cyan text-void font-bold font-mono text-xs uppercase hover:bg-white transition-colors"
                    >
                      + New Tournament
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="border border-white/10 p-12 text-center">
                    <Hud className="animate-pulse text-cyan">FETCHING ORGANIZER TOURNAMENTS...</Hud>
                  </div>
                ) : tournaments.length === 0 ? (
                  <div className="border border-dashed border-white/15 p-16 text-center">
                    <p className="font-display text-3xl font-black uppercase text-dim">No Tournaments Organized Yet</p>
                    <p className="mt-2 text-sm text-dim">Click "+ New Tournament" to launch your first sanctioned competitive event.</p>
                    <div className="mt-8">
                      <Cta onClick={openCreateModal}>Create Tournament</Cta>
                    </div>
                  </div>
                ) : (
                  tournaments.map((raw) => {
                    const t = normalizeTournament(raw)
                    return (
                      <div
                        key={t.id}
                        className="border border-white/15 bg-graphite p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-white/30 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <Badge s={t.status} />
                            <Hud className="text-cyan">{t.gameName || t.gameId}</Hud>
                            <span className="text-xs text-dim">· {t.format}</span>
                            {t.isSolo && (
                              <span className="font-mono text-[10px] px-2 py-0.5 bg-cyan/10 border border-cyan/30 text-cyan">
                                SOLO
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 font-display text-3xl font-black uppercase text-ink truncate">
                            {t.title}
                          </h3>
                          <div className="mt-3 flex flex-wrap gap-6 text-xs text-dim font-mono">
                            <span>Prize: <strong className="text-ink">{inr(t.prizePoolInr)}</strong></span>
                            <span>Entry: <strong className="text-ink">{t.entryFeeInr ? inr(t.entryFeeInr) : 'FREE'}</strong></span>
                            <span>
                              Registrations:{' '}
                              <strong className="text-cyan">
                                {t.registeredTeams} / {t.maxTeams} {t.isSolo ? 'Players' : 'Teams'}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            onClick={() => openManageTournament(raw)}
                            className="border-2 border-cyan bg-cyan/15 px-4 py-2 font-mono text-xs uppercase text-cyan hover:bg-cyan/30 transition-colors font-bold shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                          >
                            Manage Tournament →
                          </button>

                          <button
                            onClick={() => openEditModal(raw)}
                            className="border border-white/20 px-3 py-2 font-mono text-xs uppercase hover:border-ink text-ink transition-colors"
                          >
                            Edit
                          </button>

                          <Link
                            to={`/tournaments/${t.slug || t.id}`}
                            className="border border-white/20 px-3 py-2 font-mono text-xs uppercase hover:border-cyan hover:text-cyan transition-colors"
                          >
                            Public Page ↗
                          </Link>

                          {t.status === 'DRAFT' && (
                            <button
                              onClick={() => handlePublish(t.id)}
                              className="border border-ok/50 bg-ok/10 px-3 py-2 font-mono text-xs uppercase text-ok hover:bg-ok/20 transition-colors"
                            >
                              Publish Open
                            </button>
                          )}

                          {t.status === 'REGISTRATION_OPEN' && (
                            <button
                              onClick={() => handleCloseReg(t.id)}
                              className="border border-warn/50 bg-warn/10 px-3 py-2 font-mono text-xs uppercase text-warn hover:bg-warn/20 transition-colors"
                            >
                              Lock Rosters
                            </button>
                          )}

                          {t.status === 'REGISTRATION_CLOSED' && (
                            <button
                              onClick={() => handleGenBracket(t.id)}
                              className="border border-cyan bg-cyan/15 px-3 py-2 font-mono text-xs uppercase text-cyan hover:bg-cyan/30 transition-colors font-bold"
                            >
                              ⚡ Gen Bracket
                            </button>
                          )}

                          {t.status === 'LIVE' && (
                            <button
                              onClick={() => handleCompleteTournament(t.id)}
                              className="border border-ok bg-ok/20 px-3 py-2 font-mono text-xs uppercase text-ok hover:bg-ok/30 transition-colors font-bold"
                            >
                              ✓ Complete
                            </button>
                          )}

                          {t.status !== 'CANCELLED' && t.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleCancel(t.id)}
                              className="border border-live/30 px-3 py-2 font-mono text-xs uppercase text-live/80 hover:bg-live/10 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </>
        )}

        {/* Live Match Requests Tab */}
        {activeTab === 'MATCH_REQUESTS' && (
          <div className="mt-12 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Live Match Requests</h2>
                <p className="text-xs text-dim">
                  Submit match scheduling, custom live streams, and bracket arbitration requests directly to Admin.
                </p>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="bg-cyan px-4 py-2 font-mono text-xs font-bold uppercase text-void hover:bg-white transition-colors self-start md:self-auto"
              >
                + Request Live Match
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-dim uppercase mr-2">Filter Status:</span>
              {['ALL', 'NEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'RESOLVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setMatchRequestFilter(st)}
                  className={`px-3 py-1 font-mono text-xs uppercase border transition-colors ${
                    matchRequestFilter === st
                      ? 'border-cyan bg-cyan/10 text-cyan font-bold'
                      : 'border-white/10 text-dim hover:border-white/20 hover:text-ink'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* List */}
            {matchRequests.filter(
              (r) =>
                matchRequestFilter === 'ALL' ||
                r.status === matchRequestFilter ||
                (matchRequestFilter === 'NEW' && r.status === 'PENDING') ||
                (matchRequestFilter === 'UNDER_REVIEW' && r.status === 'IN_REVIEW')
            ).length === 0 ? (
              <div className="border border-dashed border-white/15 p-16 text-center">
                <p className="font-display text-2xl font-black uppercase text-dim">No Match Requests Found</p>
                <p className="mt-2 text-xs text-dim">
                  {matchRequestFilter === 'ALL'
                    ? 'You have not submitted any live match requests yet. Click "+ Request Live Match" to begin.'
                    : `No requests with status "${matchRequestFilter}".`}
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs uppercase text-cyan hover:bg-cyan/20"
                  >
                    + Submit New Match Request
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {matchRequests
                  .filter(
                    (r) =>
                      matchRequestFilter === 'ALL' ||
                      r.status === matchRequestFilter ||
                      (matchRequestFilter === 'NEW' && r.status === 'PENDING') ||
                      (matchRequestFilter === 'UNDER_REVIEW' && r.status === 'IN_REVIEW')
                  )
                  .map((r) => {
                    const stColor =
                      r.status === 'APPROVED'
                        ? 'text-cyan border-cyan/50 bg-cyan/10'
                        : r.status === 'SCHEDULED'
                        ? 'text-ok border-ok/50 bg-ok/10'
                        : r.status === 'REJECTED'
                        ? 'text-live border-live/50 bg-live/10'
                        : 'text-warn border-warn/50 bg-warn/10'

                    return (
                      <div key={r.id} className="border border-white/15 bg-graphite p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase border ${stColor}`}>
                              {r.status}
                            </span>
                            <span className="font-display text-lg font-black uppercase text-ink">
                              {r.title || 'Live Match Request'}
                            </span>
                            <span className="font-mono text-xs text-dim">· Tournament: {r.tournament_title || r.tournament_name || r.tournament_id}</span>
                          </div>
                          <span className="font-mono text-[11px] text-dim">
                            Requested: {r.created_at ? new Date(r.created_at).toLocaleString() : 'Recent'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                          <div className="border border-white/10 bg-surface/40 p-3">
                            <span className="text-[10px] text-dim uppercase block">Matchup</span>
                            <strong className="text-ink text-sm block mt-1">
                              {r.team_a_name} <span className="text-cyan">vs</span> {r.team_b_name}
                            </strong>
                            <span className="text-dim text-[11px] mt-0.5 block">Round: {r.round_name || 'Standard'}</span>
                          </div>

                          <div className="border border-white/10 bg-surface/40 p-3">
                            <span className="text-[10px] text-dim uppercase block">Schedule & Urgency</span>
                            <strong className="text-ink text-sm block mt-1">
                              {r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : 'TBD / Flexible'}
                            </strong>
                            <span className="text-[11px] text-warn mt-0.5 block">Urgency: {r.urgency || 'NORMAL'}</span>
                          </div>

                          <div className="border border-white/10 bg-surface/40 p-3">
                            <span className="text-[10px] text-dim uppercase block">Live Stream</span>
                            {r.youtube_live_url ? (
                              <a
                                href={r.youtube_live_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyan underline text-xs block mt-1 truncate hover:text-white"
                              >
                                {r.youtube_live_url}
                              </a>
                            ) : (
                              <span className="text-dim block mt-1">No stream URL specified</span>
                            )}
                          </div>
                        </div>

                        {r.notes && (
                          <div className="text-xs text-dim bg-surface/30 border border-white/5 p-3">
                            <strong className="text-ink font-mono text-[10px] uppercase block mb-1">Organizer Notes:</strong>
                            <p className="whitespace-pre-line">{r.notes}</p>
                          </div>
                        )}

                        {r.admin_notes && (
                          <div className="text-xs bg-warn/5 border border-warn/30 p-3 text-ink">
                            <strong className="text-warn font-mono text-[10px] uppercase block mb-1">
                              Super Admin Response / Instructions:
                            </strong>
                            <p className="whitespace-pre-line">{r.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}

        {/* Email Admin / Inbox Tab */}
        {activeTab === 'EMAILS' && (
          <div className="mt-12 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">Email Admin / Inbox</h2>
                <p className="text-xs text-dim">
                  Direct official communications channel with Super Admins. Track inquiries, support replies, and dispute threads.
                </p>
              </div>
              <button
                onClick={() => setIsNewEmailOpen(true)}
                className="bg-cyan px-4 py-2 font-mono text-xs font-bold uppercase text-void hover:bg-white transition-colors self-start md:self-auto"
              >
                + Email Admin / New Inquiry
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-dim uppercase mr-2">Filter Status:</span>
              {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setEmailStatusFilter(st)}
                  className={`px-3 py-1 font-mono text-xs uppercase border transition-colors ${
                    emailStatusFilter === st
                      ? 'border-cyan bg-cyan/10 text-cyan font-bold'
                      : 'border-white/10 text-dim hover:border-white/20 hover:text-ink'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* List */}
            {emailThreads.filter((t) => emailStatusFilter === 'ALL' || t.status === emailStatusFilter).length === 0 ? (
              <div className="border border-dashed border-white/15 p-16 text-center">
                <p className="font-display text-2xl font-black uppercase text-dim">No Email Threads Found</p>
                <p className="mt-2 text-xs text-dim">
                  {emailStatusFilter === 'ALL'
                    ? 'You have not sent any inquiries to admins yet. Click "+ Email Admin / New Inquiry" to reach out.'
                    : `No threads with status "${emailStatusFilter}".`}
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setIsNewEmailOpen(true)}
                    className="border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-xs uppercase text-cyan hover:bg-cyan/20"
                  >
                    + Send Inquiry to Admin
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {emailThreads
                  .filter((t) => emailStatusFilter === 'ALL' || t.status === emailStatusFilter)
                  .map((th) => {
                    const stColor =
                      th.status === 'RESOLVED'
                        ? 'text-ok border-ok/50 bg-ok/10'
                        : th.status === 'IN_PROGRESS'
                        ? 'text-cyan border-cyan/50 bg-cyan/10'
                        : th.status === 'CLOSED'
                        ? 'text-dim border-white/20 bg-surface'
                        : 'text-warn border-warn/50 bg-warn/10'

                    const lastMsg = th.messages[th.messages.length - 1]

                    return (
                      <div key={th.id} className="border border-white/15 bg-graphite p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase border ${stColor}`}>
                              {th.status}
                            </span>
                            <span className="font-display text-xl font-black uppercase text-ink">
                              {th.subject}
                            </span>
                            <span className="px-2 py-0.5 font-mono text-[10px] uppercase border border-white/15 bg-surface text-dim">
                              {th.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-warn uppercase">[{th.urgency || 'NORMAL'}]</span>
                            <span className="font-mono text-[11px] text-dim">
                              Updated: {th.updated_at ? new Date(th.updated_at).toLocaleString() : 'Recent'}
                            </span>
                          </div>
                        </div>

                        {lastMsg && (
                          <div className="bg-surface/40 border border-white/5 p-4 rounded-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-[11px] text-cyan font-bold">
                                {lastMsg.sender_role === 'ADMIN' ? '🛡️ Super Admin Response' : '👤 You'}
                              </span>
                              <span className="font-mono text-[10px] text-dim">
                                {lastMsg.created_at ? new Date(lastMsg.created_at).toLocaleTimeString() : ''}
                              </span>
                            </div>
                            <p className="text-xs text-dim line-clamp-2">{lastMsg.message}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <span className="font-mono text-xs text-dim">
                            {th.messages.length} {th.messages.length === 1 ? 'Message' : 'Messages'} in conversation
                          </span>
                          <button
                            onClick={() => {
                              setActiveThread(th)
                              setThreadReplyText('')
                            }}
                            className="border border-cyan/40 bg-cyan/10 px-4 py-1.5 font-mono text-xs uppercase text-cyan hover:bg-cyan/20 transition-colors"
                          >
                            Open Conversation →
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}
      </Container>

      {/* Creation Modal */}
      {isCreateModalOpen && (
        <Portal lockScroll>
          <div
            role="dialog"
            aria-modal
            className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none"
            onClick={() => setIsCreateModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl border border-white/20 bg-graphite p-6 md:p-8 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text"
            >
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-3xl font-black uppercase">
                  {editingTournament ? 'Edit Tournament Specification' : 'Tournament Specification Wizard'}
                </h2>
                <p className="text-xs text-dim">Configure competition format, prize vault, and rules.</p>
              </div>
              <button onClick={() => { setIsCreateModalOpen(false); setEditingTournament(null); }} className="text-dim hover:text-ink text-xl">✕</button>
            </div>

            <form onSubmit={handleSaveTournament} className="space-y-4">
              {(() => {
                const activeGameObj = games.find((g) => (g.slug || g.id) === formData.game_id || g.id === formData.game_id)
                const activeGameModes: string[] = activeGameObj
                  ? ((activeGameObj as any).supported_game_modes || (activeGameObj as any).supportedGameModes || (activeGameObj.is_team_game === false ? ['SOLO'] : ['SQUAD'])).map((m: string) => m.toUpperCase().trim())
                  : ['SOLO', 'DUO', 'SQUAD']
                const currentPartMode = (formData.participation_mode || activeGameModes[0] || 'SQUAD').toUpperCase().trim()

                return (
                  <>
                    {/* 1 & 2. Sanctioned Game & Tournament Title */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 1. Selected Game / Discipline */}
                      <div>
                        <Hud>1. Sanctioned Game <span className="text-cyan">*</span></Hud>
                        <select
                          value={formData.game_id}
                          onChange={(e) => handleGameChange(e.target.value)}
                          className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm"
                          required
                        >
                          {games.map((g) => (
                            <option key={g.id || g.slug} value={g.slug || g.id}>
                              {g.name} ({g.tag || 'ESPORTS'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Tournament Title */}
                      <div>
                        <Hud>2. Tournament Title <span className="text-cyan">*</span></Hud>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="e.g. MONSOON INVITATIONAL 2026"
                          className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm"
                        />
                      </div>
                    </div>

                    {/* Participation Mode (Game Dependent) */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Hud>3. Participation Mode <span className="text-cyan">*</span></Hud>
                        <span className="text-[10px] text-cyan font-mono">Game Dependent</span>
                      </div>
                        <select
                          required
                          value={currentPartMode}
                          onChange={(e) => {
                            const newMode = e.target.value
                            const isSolo = newMode === 'SOLO'
                            const teamSize = newMode === 'SOLO' ? 1 : (newMode === 'DUO' ? 2 : 4)
                            setFormData({
                              ...formData,
                              participation_mode: newMode,
                              is_solo: isSolo,
                              min_team_size: teamSize,
                              max_team_size: teamSize,
                            })
                          }}
                          className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm"
                        >
                          {activeGameModes.map((mode) => (
                            <option key={mode} value={mode}>
                              {mode === 'SOLO' ? 'Solo' : mode === 'DUO' ? 'Duo' : 'Squad'}
                            </option>
                          ))}
                        </select>
                      </div>

                    {/* 5 & 6. Dynamic Capacity & Series Format */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 5. Dynamic Capacity */}
                      <div>
                        <div className="flex items-center justify-between">
                          <Hud>
                            5. {currentPartMode === 'SOLO' ? 'Max Players' : 'Max Teams'} <span className="text-cyan">*</span>
                          </Hud>
                          <span className="text-[10px] text-dim font-mono">
                            {currentPartMode === 'SOLO' ? 'Individual Competitors' : currentPartMode === 'DUO' ? '2-Player Teams' : '4-Player Squads'}
                          </span>
                        </div>
                        <input
                          type="number"
                          required
                          min="2"
                          max="256"
                          placeholder={currentPartMode === 'SOLO' ? 'e.g. 100 players' : currentPartMode === 'DUO' ? 'e.g. 25 teams' : 'e.g. 16 teams'}
                          value={formData.max_teams}
                          onChange={(e) => setFormData({ ...formData, max_teams: Number(e.target.value) })}
                          className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                        />
                      </div>

                      {/* 6. Enable MVP System */}
                      <div>
                        <div className="flex items-center justify-between">
                          <Hud>6. Enable MVP System</Hud>
                          <span className="text-[10px] text-cyan uppercase font-mono">{formData.enable_mvp ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, enable_mvp: !formData.enable_mvp })}
                          className={`mt-1 w-full border px-3 py-2 text-xs font-mono flex items-center justify-between transition-colors ${
                            formData.enable_mvp ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/15 bg-surface text-dim hover:text-ink'
                          }`}
                        >
                          <span>{formData.enable_mvp ? 'MVP Selection Active' : 'MVP Selection Disabled'}</span>
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${formData.enable_mvp ? 'bg-cyan' : 'bg-white/30'}`} />
                        </button>
                        <p className="mt-1 text-[10px] text-dim font-mono">When enabled, prompts for round MVP and tournament MVP after matches.</p>
                      </div>
                    </div>

                    {/* 7 & 8. Prize Pool & Entry Fee */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 7. Prize Pool */}
                      <div>
                        <Hud>7. Prize Pool (₹) <span className="text-cyan">*</span></Hud>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.prize_pool_inr}
                          onChange={(e) => setFormData({ ...formData, prize_pool_inr: Number(e.target.value) })}
                          className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                        />
                      </div>

                      {/* 8. Entry Fee */}
                      <div>
                        <Hud>8. Entry Fee {currentPartMode === 'SOLO' ? 'per Player' : 'per Squad'} (₹) <span className="text-cyan">*</span></Hud>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.entry_fee_inr}
                          onChange={(e) => setFormData({ ...formData, entry_fee_inr: Number(e.target.value) })}
                          className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                        />
                      </div>
                    </div>

                    {/* Configurable Prize Distribution */}
                    <div className="border border-white/10 bg-void/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-dim text-xs font-mono uppercase tracking-wider">
                          Configurable Prize Distribution
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const rows = formData.prize_distribution || []
                            setFormData({
                              ...formData,
                              prize_distribution: [...rows, { id: `pz_${Date.now()}_${Math.random()}`, name: '', amount: 0 }],
                            })
                          }}
                          className="text-[10px] font-mono border border-cyan/40 bg-cyan/10 text-cyan px-2 py-0.5 hover:bg-cyan/20 cursor-pointer"
                        >
                          + Add Prize Row
                        </button>
                      </div>

                      {(!formData.prize_distribution || formData.prize_distribution.length === 0) ? (
                        <p className="text-[11px] text-dim italic">No custom prize categories added yet. Click &quot;+ Add Prize Row&quot; to define awards.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {formData.prize_distribution.map((row: any, idx: number) => (
                            <div key={row.id || idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="e.g. First Place, MVP, Best Fragger"
                                value={row.name || row.category_name || ''}
                                onChange={(e) => {
                                  const updated = [...formData.prize_distribution]
                                  updated[idx] = { ...updated[idx], name: e.target.value }
                                  setFormData({ ...formData, prize_distribution: updated })
                                }}
                                className="flex-1 border border-white/15 bg-surface p-2 text-ink outline-none focus:border-cyan text-xs"
                              />
                              <div className="flex items-center gap-1 w-36">
                                <span className="text-xs text-dim">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Amount"
                                  value={row.amount ?? row.prize_amount ?? 0}
                                  onChange={(e) => {
                                    const updated = [...formData.prize_distribution]
                                    updated[idx] = { ...updated[idx], amount: Number(e.target.value) }
                                    setFormData({ ...formData, prize_distribution: updated })
                                  }}
                                  className="w-full border border-white/15 bg-surface p-2 text-ink outline-none focus:border-cyan text-xs font-mono"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = formData.prize_distribution.filter((_: any, i: number) => i !== idx)
                                  setFormData({ ...formData, prize_distribution: updated })
                                }}
                                className="text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-red-500/30 hover:border-red-500/60"
                                title="Remove prize row"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Prize Reconciliation Status Warning */}
                      {(() => {
                        const declared = Number(formData.prize_pool_inr || 0)
                        const configured = (formData.prize_distribution || []).reduce((acc: number, r: any) => acc + Number(r.amount ?? r.prize_amount ?? 0), 0)
                        const diff = configured - declared
                        const isMatch = declared === configured
                        return (
                          <div className={`mt-2 p-2 border text-[11px] font-mono flex items-center justify-between ${
                            isMatch ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                          }`}>
                            <div className="flex flex-wrap items-center gap-x-3">
                              <span>Declared: <strong>₹{declared.toLocaleString()}</strong></span>
                              <span>Configured: <strong>₹{configured.toLocaleString()}</strong></span>
                              <span>Diff: <strong>{diff >= 0 ? `+₹${diff.toLocaleString()}` : `-₹${Math.abs(diff).toLocaleString()}`}</strong></span>
                            </div>
                            <div>
                              {isMatch ? (
                                <span className="text-emerald-400 font-bold">✓ Matched</span>
                              ) : (
                                <span className="text-amber-300 font-bold">⚠️ Mismatch (Save Allowed)</span>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    {/* 9 & 10. Start Date & Start Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 9. Start Date */}
                      <div>
                        <Hud>9. Start Date <span className="text-cyan">*</span></Hud>
                        <input
                          type="date"
                          required
                          value={formData.start_date || (formData.starts_at ? formData.starts_at.split('T')[0] : '')}
                          onChange={(e) => {
                            const d = e.target.value
                            const t = formData.start_time || '18:00'
                            setFormData({
                              ...formData,
                              start_date: d,
                              start_time: t,
                              starts_at: d && t ? `${d}T${t}` : formData.starts_at,
                            })
                          }}
                          className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                        />
                      </div>

                      {/* 10. Start Time */}
                      <div>
                        <Hud>10. Start Time <span className="text-cyan">*</span></Hud>
                        <input
                          type="time"
                          required
                          value={formData.start_time || (formData.starts_at && formData.starts_at.includes('T') ? formData.starts_at.split('T')[1].slice(0, 5) : '18:00')}
                          onChange={(e) => {
                            const t = e.target.value
                            const d = formData.start_date || (formData.starts_at ? formData.starts_at.split('T')[0] : '')
                            setFormData({
                              ...formData,
                              start_time: t,
                              starts_at: d && t ? `${d}T${t}` : formData.starts_at,
                            })
                          }}
                          className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                        />
                      </div>
                    </div>

                    {/* 11 & 12. WhatsApp & Community Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 11. WhatsApp Link */}
                      <div>
                        <Hud>11. Official WhatsApp Group Link</Hud>
                        <input
                          type="url"
                          placeholder="https://chat.whatsapp.com/... (optional)"
                          value={formData.whatsapp_group_url}
                          onChange={(e) => setFormData({ ...formData, whatsapp_group_url: e.target.value })}
                          className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                        />
                      </div>

                      {/* 12. Community Link */}
                      <div>
                        <Hud>12. Official Community Link (Discord / Public)</Hud>
                        <input
                          type="url"
                          placeholder="https://discord.gg/... (optional)"
                          value={formData.discord_url}
                          onChange={(e) => setFormData({ ...formData, discord_url: e.target.value })}
                          className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                        />
                      </div>
                    </div>

                    {/* 13. Description & Rules */}
                    <div>
                      <Hud>13. Description</Hud>
                      <textarea
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                      />
                    </div>
                    <div>
                      <Hud>Tournament Rules & Regulations</Hud>
                      <textarea
                        rows={3}
                        value={formData.rules}
                        onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                        className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                      />
                    </div>

                    {/* 14. Server Region & Rank Requirements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Hud>14. Server Region</Hud>
                        <input
                          type="text"
                          value={formData.server_region}
                          onChange={(e) => setFormData({ ...formData, server_region: e.target.value })}
                          className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                        />
                      </div>
                      <div>
                        <Hud>Rank Requirement</Hud>
                        <input
                          type="text"
                          value={formData.rank_requirement}
                          onChange={(e) => setFormData({ ...formData, rank_requirement: e.target.value })}
                          className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                        />
                      </div>
                    </div>
                  </>
                )
              })()}

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-white/20 text-dim hover:text-ink text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-cyan text-void font-bold uppercase hover:bg-white transition-colors text-xs"
                >
                  {creating ? 'Saving...' : editingTournament ? 'Save Tournament Changes' : 'Create Tournament Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
      )}

      {/* Rosters Modal */}
      {viewingRostersTour && (
        <Portal lockScroll>
          <div
            role="dialog"
            aria-modal
            className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none"
            onClick={() => setViewingRostersTour(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl border border-white/20 bg-graphite p-6 md:p-8 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text"
            >
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-2xl font-black uppercase text-ink">Registered Rosters</h3>
                  <p className="text-xs text-cyan font-mono">{viewingRostersTour.title}</p>
                </div>
                <button onClick={() => setViewingRostersTour(null)} className="text-dim hover:text-ink text-xl">✕</button>
              </div>

              {loadingRosters ? (
                <div className="p-8 text-center font-mono text-xs text-cyan animate-pulse">
                  LOADING REGISTERED ROSTERS...
                </div>
              ) : rostersList.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-dim border border-dashed border-white/10">
                  NO TEAMS REGISTERED YET
                </div>
              ) : (
                <div className="space-y-3">
                  {rostersList.map((r, i) => (
                    <div key={r.id || i} className="border border-white/10 bg-surface p-4 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-ink">{r.team_name || r.name || `Team ${i + 1}`}</p>
                        <p className="font-mono text-xs text-dim">Captain: {r.captain_name || r.captain || 'Registered Captain'}</p>
                      </div>
                      <span className="border border-ok/40 bg-ok/10 px-2.5 py-1 font-mono text-[10px] text-ok uppercase">
                        Confirmed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}

      {/* Arbitration Score Modal */}
      {selectedMatch && (
        <Portal lockScroll>
          <div
            role="dialog"
            aria-modal
            className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none"
            onClick={() => setSelectedMatch(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md border border-white/20 bg-graphite p-6 md:p-8 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text"
            >
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-2xl font-black uppercase text-ink">Submit Match Score</h3>
                  <p className="text-xs text-dim">Arbitrate and certify official match results.</p>
                </div>
                <button onClick={() => setSelectedMatch(null)} className="text-dim hover:text-ink text-xl">✕</button>
              </div>

              <form onSubmit={handleSubmitScore} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-xs text-dim block truncate">{selectedMatch.team_a?.name || 'Team A'}</label>
                    <input
                      type="number"
                      min="0"
                      value={scoreA}
                      onChange={(e) => setScoreA(Number(e.target.value))}
                      className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink font-mono text-lg outline-none focus:border-cyan text-center"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-dim block truncate text-right">{selectedMatch.team_b?.name || 'Team B'}</label>
                    <input
                      type="number"
                      min="0"
                      value={scoreB}
                      onChange={(e) => setScoreB(Number(e.target.value))}
                      className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink font-mono text-lg outline-none focus:border-cyan text-center"
                    />
                  </div>
                </div>

                <div>
                  <Hud>Winner Declaration</Hud>
                  <select
                    value={winnerTeamId}
                    onChange={(e) => setWinnerTeamId(e.target.value)}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm"
                  >
                    <option value="">Auto-select by score</option>
                    {selectedMatch.team_a?.id && <option value={selectedMatch.team_a.id}>{selectedMatch.team_a.name}</option>}
                    {selectedMatch.team_b?.id && <option value={selectedMatch.team_b.id}>{selectedMatch.team_b.name}</option>}
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedMatch(null)}
                    className="px-4 py-2 border border-white/20 text-dim hover:text-ink text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingScore}
                    className="px-6 py-2 bg-cyan text-void font-bold uppercase hover:bg-white transition-colors text-xs"
                  >
                    {isSubmittingScore ? 'Submitting...' : 'Certify Result'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Battle Royale Results & Qualifiers Modal */}
      <BattleRoyaleResultsModal
        isOpen={!!selectedBrMatch}
        onClose={() => setSelectedBrMatch(null)}
        match={selectedBrMatch}
        tournamentTitle={managingTournament?.title}
        onSuccess={(res) => {
          setActionMsg(res?.message || '✓ Battle Royale results finalized and qualifiers advanced!')
          setSelectedBrMatch(null)
          if (managingTournament) {
            openManageTournament(managingTournament)
          }
        }}
      />

      {/* Room & Stream Modal */}
      {selectedLobbyMatch && (
        <Portal lockScroll>
          <div
            role="dialog"
            aria-modal
            className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none"
            onClick={() => setSelectedLobbyMatch(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg border border-white/20 bg-graphite p-6 md:p-8 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text"
            >
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-2xl font-black uppercase text-ink">Room & Stream Settings</h3>
                  <p className="text-xs text-dim">Configure room credentials, instructions, and live broadcast.</p>
                </div>
                <button onClick={() => setSelectedLobbyMatch(null)} className="text-dim hover:text-ink text-xl">✕</button>
              </div>

              {/* Credential Status Banner */}
              <div className="mb-4 p-3 border font-mono text-xs flex items-center justify-between bg-surface/50">
                <span className="text-dim">STATUS:</span>
                {selectedLobbyMatch.credentials_released ? (
                  <span className="text-ok font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
                    ✓ RELEASED TO PARTICIPANTS
                  </span>
                ) : selectedLobbyMatch.room_id ? (
                  <span className="text-warn font-bold flex items-center gap-1.5">
                    🔒 DRAFT SAVED (PRIVATE TO ORGANIZER)
                  </span>
                ) : (
                  <span className="text-dim">
                    ⚠️ CREDENTIALS NOT CONFIGURED
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveLobbyCredentials} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Hud>Room ID</Hud>
                    <input
                      type="text"
                      value={lobbyCode}
                      onChange={(e) => setLobbyCode(e.target.value)}
                      placeholder="e.g. AMT-ROOM-01"
                      className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink font-mono text-sm outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <Hud>Room Password</Hud>
                    <input
                      type="text"
                      value={lobbyPassword}
                      onChange={(e) => setLobbyPassword(e.target.value)}
                      placeholder="e.g. PASS123"
                      className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink font-mono text-sm outline-none focus:border-cyan"
                    />
                  </div>
                </div>

                <div>
                  <Hud>Server Region</Hud>
                  <input
                    type="text"
                    value={serverRegion}
                    onChange={(e) => setServerRegion(e.target.value)}
                    placeholder="e.g. AWS Mumbai (ap-south-1)"
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink font-mono text-sm outline-none focus:border-cyan"
                  />
                </div>

                <div>
                  <Hud>Custom Match Instructions / Notes</Hud>
                  <textarea
                    rows={2}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g. Join lobby 10 mins prior. Map: Erangel. Spectating disallowed."
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink font-mono text-xs outline-none focus:border-cyan"
                  />
                </div>

                <div>
                  <Hud>Live Stream URL (YouTube Embed / Watch Link)</Hud>
                  <input
                    type="url"
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink font-mono text-sm outline-none focus:border-cyan"
                  />
                  <span className="mt-1 block text-[10px] text-dim font-sans">
                    Stream will be featured on public match details page and official broadcasts.
                  </span>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedLobbyMatch(null)}
                    className="px-4 py-2 border border-white/20 text-dim hover:text-ink text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingLobby || isReleasingCreds}
                    className="px-4 py-2 border border-white/20 bg-surface text-ink font-mono text-xs uppercase hover:border-cyan hover:text-cyan transition-colors"
                  >
                    {isSavingLobby ? 'Saving...' : 'Save Draft (Private)'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReleaseCredentials}
                    disabled={isSavingLobby || isReleasingCreds}
                    className="px-5 py-2 bg-cyan text-void font-bold uppercase hover:bg-white transition-colors text-xs font-mono"
                  >
                    {isReleasingCreds ? 'Releasing...' : '⚡ Release & Open Check-in'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Live Match Request Modal */}
      {isRequestModalOpen && (
        <Portal lockScroll>
          <div
            role="dialog"
            aria-modal
            className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none"
            onClick={() => setIsRequestModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl max-h-[min(90vh,calc(100svh-2rem))] flex flex-col border border-white/20 bg-graphite shadow-2xl overflow-hidden select-text"
            >
            <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
              <div>
                <h3 className="font-display text-2xl font-black uppercase text-ink">Request Live Match</h3>
                <p className="text-xs text-dim">Submit match scheduling or stream broadcasting request to Admin.</p>
              </div>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-dim hover:text-ink text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateMatchRequest} className="overflow-y-auto p-6 space-y-4 flex-1">
              <div>
                <Hud>Target Tournament</Hud>
                <select
                  value={newRequestForm.tournament_id}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, tournament_id: e.target.value })}
                  className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm"
                  required
                >
                  <option value="">Select Tournament</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Hud>Match / Stage Title</Hud>
                <input
                  type="text"
                  required
                  placeholder="e.g. Upper Bracket Quarterfinals"
                  value={newRequestForm.title}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, title: e.target.value })}
                  className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Hud>Team A Name</Hud>
                  <input
                    type="text"
                    required
                    placeholder="Team Alpha"
                    value={newRequestForm.team_a_name}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, team_a_name: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                  />
                </div>
                <div>
                  <Hud>Team B Name</Hud>
                  <input
                    type="text"
                    required
                    placeholder="Team Omega"
                    value={newRequestForm.team_b_name}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, team_b_name: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Hud>Round Name</Hud>
                  <input
                    type="text"
                    placeholder="e.g. Round 1 / Group Stage"
                    value={newRequestForm.round_name}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, round_name: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                  />
                </div>
                <div>
                  <Hud>Urgency</Hud>
                  <select
                    value={newRequestForm.urgency}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, urgency: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Starting Soon)</option>
                  </select>
                </div>
              </div>

              <div>
                <Hud>Proposed Date & Time</Hud>
                <input
                  type="datetime-local"
                  value={newRequestForm.scheduled_at}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, scheduled_at: e.target.value })}
                  className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                />
              </div>

              <div>
                <Hud>YouTube Live Stream / Cast URL (Optional)</Hud>
                <input
                  type="url"
                  placeholder="https://youtube.com/live/..."
                  value={newRequestForm.youtube_live_url}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, youtube_live_url: e.target.value })}
                  className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                />
              </div>

              <div>
                <Hud>Organizer Notes & Special Rules</Hud>
                <textarea
                  rows={3}
                  placeholder="Provide roster details, referee instructions, or server region preferences..."
                  value={newRequestForm.notes}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, notes: e.target.value })}
                  className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 border border-white/20 text-dim hover:text-ink text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="px-6 py-2 bg-cyan text-void font-bold uppercase hover:bg-white transition-colors text-xs"
                >
                  {submittingReq ? 'Submitting...' : 'Submit Match Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
      )}

      {/* Email Admin / New Inquiry Modal */}
      {isNewEmailOpen && (
        <Portal lockScroll>
          <div
            role="dialog"
            aria-modal
            className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none"
            onClick={() => setIsNewEmailOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl max-h-[min(90vh,calc(100svh-2rem))] flex flex-col border border-white/20 bg-graphite shadow-2xl overflow-hidden select-text"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
                <div>
                  <h3 className="font-display text-2xl font-black uppercase text-ink">Email Admin</h3>
                  <p className="text-xs text-dim">Send an official inquiry or escalation to Super Admins.</p>
                </div>
                <button onClick={() => setIsNewEmailOpen(false)} className="text-dim hover:text-ink text-xl">✕</button>
              </div>

              <form onSubmit={handleSendEmail} className="overflow-y-auto p-6 space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Hud>Category</Hud>
                    <select
                      value={newEmailForm.category}
                      onChange={(e) => setNewEmailForm({ ...newEmailForm, category: e.target.value })}
                      className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm"
                    >
                      <option value="GENERAL">General Inquiries</option>
                      <option value="TOURNAMENT_ISSUE">Tournament Issue</option>
                      <option value="DISPUTE">Match Dispute</option>
                      <option value="PRIZE_POOL">Prize Pool / Payout</option>
                      <option value="TECHNICAL">Technical Issue</option>
                      <option value="SPONSORSHIP">Sponsorship</option>
                    </select>
                  </div>
                  <div>
                    <Hud>Urgency</Hud>
                    <select
                      value={newEmailForm.urgency}
                      onChange={(e) => setNewEmailForm({ ...newEmailForm, urgency: e.target.value })}
                      className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Hud>Subject Line</Hud>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Requesting Bracket Reschedule for BGMI Qualifiers"
                    value={newEmailForm.subject}
                    onChange={(e) => setNewEmailForm({ ...newEmailForm, subject: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                  />
                </div>

                <div>
                  <Hud>Detailed Message</Hud>
                  <textarea
                    required
                    rows={6}
                    placeholder="Explain the context, tournament name, team identifiers, and specific resolution required..."
                    value={newEmailForm.message}
                    onChange={(e) => setNewEmailForm({ ...newEmailForm, message: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsNewEmailOpen(false)}
                    className="px-4 py-2 border border-white/20 text-dim hover:text-ink text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEmail}
                    className="px-6 py-2 bg-cyan text-void font-bold uppercase hover:bg-white transition-colors text-xs"
                  >
                    {submittingEmail ? 'Sending...' : 'Send Inquiry to Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Active Email Thread Modal */}
      {activeThread && (
        <Portal lockScroll>
          <div
            role="dialog"
            aria-modal
            className="fixed inset-0 z-[100] flex items-center justify-center bg-void/85 p-3 sm:p-6 backdrop-blur-md overflow-hidden select-none"
            onClick={() => setActiveThread(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[min(90vh,calc(100svh-2rem))] flex flex-col border border-white/20 bg-graphite shadow-2xl overflow-hidden select-text"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 font-mono text-[10px] uppercase border border-cyan/40 bg-cyan/10 text-cyan">
                      {activeThread.status}
                    </span>
                    <span className="px-2 py-0.5 font-mono text-[10px] uppercase border border-white/10 text-dim">
                      {activeThread.category}
                    </span>
                    <span className="font-mono text-[10px] text-warn uppercase">
                      [{activeThread.urgency || 'NORMAL'}]
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-black uppercase text-ink">{activeThread.subject}</h3>
                </div>
                <button onClick={() => setActiveThread(null)} className="text-dim hover:text-ink text-xl">✕</button>
              </div>

              {/* Conversation Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-void/40 border-y border-white/10">
                {activeThread.messages.map((m, idx) => {
                  const isAdmin = m.sender_role === 'ADMIN'
                  return (
                    <div
                      key={idx}
                      className={`p-4 border ${
                        isAdmin
                          ? 'border-cyan/40 bg-cyan/5 ml-4 md:ml-12'
                          : 'border-white/15 bg-graphite mr-4 md:mr-12'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[11px] font-bold uppercase px-2 py-0.5 ${
                              isAdmin
                                ? 'bg-cyan text-void'
                                : 'bg-white/10 text-ink'
                            }`}
                          >
                            {isAdmin ? '🛡️ Super Admin' : '👤 You'}
                          </span>
                          <span className="text-xs font-mono text-dim">{m.sender_name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-dim">
                          {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                      <p className="text-xs text-ink whitespace-pre-line leading-relaxed">{m.message}</p>
                    </div>
                  )
                })}
              </div>

              {/* Reply Composer */}
              <form onSubmit={handleThreadReply} className="p-6 shrink-0 bg-graphite">
                <Hud className="text-dim mb-1">Your Reply</Hud>
                <textarea
                  rows={3}
                  required
                  placeholder="Type your reply to Super Admin..."
                  value={threadReplyText}
                  onChange={(e) => setThreadReplyText(e.target.value)}
                  className="w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                />
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-dim">
                    Status: <strong className="text-cyan">{activeThread.status}</strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveThread(null)}
                      className="px-4 py-1.5 border border-white/20 text-dim hover:text-ink text-xs uppercase"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReply || !threadReplyText.trim()}
                      className="px-6 py-1.5 bg-cyan text-void font-bold uppercase hover:bg-white transition-colors text-xs disabled:opacity-50"
                    >
                      {submittingReply ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
