import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Container, Hud, Badge, Dot, Cta, SectionHead, Modal, Panel, Portal } from '../components/ui'
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
import { getMatches, submitMatchResult, updateMatch, ApiMatch } from '../services/matches'
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
    is_solo: false,
    min_team_size: 5,
    max_team_size: 5,
    format: 'Knockout',
    tournament_type: 'Knockout',
    match_format: 'Best of 1',
    whatsapp_group_url: '',
    discord_url: '',
    server_region: 'AWS Mumbai (ap-south-1)',
    prize_pool_inr: 10000,
    entry_fee_inr: 0,
    max_teams: 16,
    starts_at: '',
    roster_lock_time: '',
    rank_requirement: 'Open to All Ranks',
    description: 'Sanctioned competitive esports tournament. Anti-cheat verification mandatory.',
    rules: '1. Standard competitive rules apply.\n2. Roster check-in required 15 mins prior to match start.\n3. Toxic conduct or cheating results in immediate disqualification.',
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

  // Stream & Room Creds State
  const [selectedLobbyMatch, setSelectedLobbyMatch] = useState<ApiMatch | null>(null)
  const [lobbyCode, setLobbyCode] = useState('')
  const [lobbyPassword, setLobbyPassword] = useState('')
  const [streamUrl, setStreamUrl] = useState('')
  const [isSavingLobby, setIsSavingLobby] = useState(false)

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
    const isSolo = sel?.max_team_size === 1 || sel?.tag?.toLowerCase().includes('1v1')
    setFormData((prev) => ({
      ...prev,
      game_id: gameVal,
      is_solo: !!isSolo,
      min_team_size: isSolo ? 1 : (sel?.min_team_size || 5),
      max_team_size: isSolo ? 1 : (sel?.max_team_size || 5),
      format: 'Knockout',
    }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const rulesArr = formData.rules.split('\n').map((r) => r.trim()).filter(Boolean)
      const startIso = formData.starts_at || new Date(Date.now() + 86400000 * 3).toISOString()
      const lockIso = formData.roster_lock_time || new Date(Date.now() + 86400000 * 2).toISOString()

      await createTournamentOrganizer({
        title: formData.title,
        game_id: formData.game_id,
        prize_pool_inr: Number(formData.prize_pool_inr),
        entry_fee_inr: Number(formData.entry_fee_inr),
        starts_at: startIso,
        roster_lock_time: lockIso,
        server_region: formData.server_region,
        max_teams: Number(formData.max_teams),
        min_team_size: Number(formData.min_team_size),
        max_team_size: Number(formData.max_team_size),
        rank_requirement: formData.rank_requirement,
        format: formData.format,
        tournament_type: formData.tournament_type || formData.format,
        match_format: formData.match_format,
        whatsapp_group_url: formData.whatsapp_group_url || undefined,
        discord_url: formData.discord_url || undefined,
        description: formData.description,
        rules: rulesArr,
      })

      setIsCreateModalOpen(false)
      setActionMsg(`Tournament "${formData.title}" created in DRAFT state!`)
      setTimeout(() => setActionMsg(null), 4000)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to create tournament')
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

  const openLobbyModal = (m: ApiMatch) => {
    setSelectedLobbyMatch(m)
    setLobbyCode(m.lobby_code || '')
    setLobbyPassword(m.lobby_password || '')
    setStreamUrl(m.youtube_live_url || m.live_link || '')
  }

  const handleSaveLobbyCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLobbyMatch) return
    setIsSavingLobby(true)
    try {
      await updateMatch(selectedLobbyMatch.id, {
        lobby_code: lobbyCode.trim(),
        lobby_password: lobbyPassword.trim(),
        youtube_live_url: streamUrl.trim(),
      })
      setActionMsg('Lobby room credentials & stream URL updated successfully.')
      setTimeout(() => setActionMsg(null), 4000)
      setSelectedLobbyMatch(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update lobby credentials')
    } finally {
      setIsSavingLobby(false)
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
            <Cta onClick={() => setIsCreateModalOpen(true)}>+ New Tournament</Cta>
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
            {/* Tournament Management Section */}
            <div className="mt-12 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="font-display text-3xl font-black uppercase">My Organized Tournaments</h2>
                <Hud className="text-cyan">{tournaments.length} REGISTERED</Hud>
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
                    <Cta onClick={() => setIsCreateModalOpen(true)}>Create Tournament</Cta>
                  </div>
                </div>
              ) : (
                tournaments.map((raw) => {
                  const t = normalizeTournament(raw)
                  return (
                    <div
                      key={t.id}
                      className="border border-white/15 bg-graphite p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <Badge s={t.status} />
                          <Hud className="text-cyan">{t.gameName || t.gameId}</Hud>
                          <span className="text-xs text-dim">· {t.format}</span>
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
                              {t.registeredTeams} / {t.maxTeams} Teams
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Link
                          to={`/tournaments/${t.slug || t.id}`}
                          className="border border-white/20 px-3 py-2 font-mono text-xs uppercase hover:border-cyan hover:text-cyan transition-colors"
                        >
                          Public Page
                        </Link>

                        <button
                          onClick={() => openRostersModal(raw)}
                          className="border border-white/20 px-3 py-2 font-mono text-xs uppercase hover:border-ink text-ink transition-colors"
                        >
                          View Rosters
                        </button>

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
                          <>
                            <button
                              onClick={() => handleGenBracket(t.id)}
                              className="border border-cyan bg-cyan/15 px-3 py-2 font-mono text-xs uppercase text-cyan hover:bg-cyan/30 transition-colors font-bold"
                            >
                              ⚡ Gen Bracket & Start Live
                            </button>
                            <button
                              onClick={() => handleStartLive(t.id)}
                              className="border border-ok/50 bg-ok/10 px-3 py-2 font-mono text-xs uppercase text-ok hover:bg-ok/20 transition-colors"
                            >
                              ▶ Start Live
                            </button>
                            <button
                              onClick={() => handleReopenReg(t.id)}
                              className="border border-white/20 bg-surface px-3 py-2 font-mono text-xs uppercase text-dim hover:text-ink hover:border-cyan transition-colors"
                            >
                              Reopen Reg
                            </button>
                          </>
                        )}

                        {t.status === 'LIVE' && (
                          <button
                            onClick={() => handleCompleteTournament(t.id)}
                            className="border border-ok bg-ok/20 px-3 py-2 font-mono text-xs uppercase text-ok hover:bg-ok/30 transition-colors font-bold"
                          >
                            ✓ Complete Event
                          </button>
                        )}

                        {(t.status === 'REGISTRATION_CLOSED' || t.status === 'REGISTRATION_OPEN') && (
                          <button
                            onClick={() => handleOpenMatchRequest(t.id)}
                            className="border border-cyan/50 bg-cyan/10 px-3 py-2 font-mono text-xs uppercase text-cyan hover:bg-cyan/20 transition-colors"
                          >
                            Request Match
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

        {/* Live Matches & Arbitration Queue */}
        <div className="mt-16 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="font-display text-3xl font-black uppercase">Live Match Arbitration</h2>
              <p className="text-xs text-dim">Review live brackets, submit verified results, and update lobby room credentials.</p>
            </div>
            <Hud className="text-cyan">{matches.length} MATCHES</Hud>
          </div>

          {matches.length === 0 ? (
            <div className="border border-white/10 p-8 text-center font-mono text-xs text-dim">
              NO MATCHES SCHEDULED ACROSS ORGANIZED BRACKETS
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {matches.slice(0, 8).map((m) => (
                <div key={m.id} className="border border-white/15 bg-graphite p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-cyan uppercase">{m.stage || 'Round 1'}</span>
                    <Badge s={m.status || 'SCHEDULED'} />
                  </div>

                  <div className="flex items-center justify-between border-y border-white/5 py-3">
                    <div className="text-sm font-bold truncate max-w-[140px]">{m.team_a?.name || 'TBD Team A'}</div>
                    <div className="font-mono text-xs px-2 py-1 bg-surface border border-white/10">
                      {m.team_a?.score ?? 0} : {m.team_b?.score ?? 0}
                    </div>
                    <div className="text-sm font-bold truncate max-w-[140px] text-right">{m.team_b?.name || 'TBD Team B'}</div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-dim">
                      {m.server_region || 'AWS Mumbai'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openArbitrationModal(m)}
                        className="border border-cyan/40 bg-cyan/10 px-3 py-1 font-mono text-xs text-cyan hover:bg-cyan/20 transition-colors"
                      >
                        Submit Score
                      </button>
                      <button
                        onClick={() => openLobbyModal(m)}
                        className="border border-white/20 bg-surface px-3 py-1 font-mono text-xs text-ink hover:border-cyan hover:text-cyan transition-colors"
                      >
                        Room & Stream
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
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
                <h2 className="font-display text-3xl font-black uppercase">Tournament Specification Wizard</h2>
                <p className="text-xs text-dim">Configure competition format, prize vault, and rules.</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-dim hover:text-ink text-xl">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Hud>Game / Discipline</Hud>
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

                <div>
                  <Hud>Tournament Title</Hud>
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

              {/* Format selection */}
              <div className="border border-white/10 bg-surface/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase text-cyan font-bold">Roster & Competition Format</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 border border-cyan/40 bg-cyan/10 text-cyan">
                    {formData.is_solo ? 'SOLO (1v1)' : `TEAM (${formData.min_team_size}v${formData.max_team_size})`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        is_solo: true,
                        min_team_size: 1,
                        max_team_size: 1,
                        format: '1v1 Solo Championship',
                      }))
                    }
                    className={`border p-3 text-left font-mono text-xs uppercase transition-colors ${
                      formData.is_solo ? 'border-cyan bg-cyan/10 text-cyan' : 'border-white/10 text-dim hover:border-white/30'
                    }`}
                  >
                    1v1 Solo Contender
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        is_solo: false,
                        min_team_size: 5,
                        max_team_size: 5,
                        format: 'Single Elimination Bracket',
                      }))
                    }
                    className={`border p-3 text-left font-mono text-xs uppercase transition-colors ${
                      !formData.is_solo ? 'border-cyan bg-cyan/10 text-cyan' : 'border-white/10 text-dim hover:border-white/30'
                    }`}
                  >
                    Team Roster (5v5 Squad)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Hud>Prize Pool (₹)</Hud>
                  <input
                    type="number"
                    min="0"
                    value={formData.prize_pool_inr}
                    onChange={(e) => setFormData({ ...formData, prize_pool_inr: Number(e.target.value) })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                  />
                </div>
                <div>
                  <Hud>Entry Fee (₹)</Hud>
                  <input
                    type="number"
                    min="0"
                    value={formData.entry_fee_inr}
                    onChange={(e) => setFormData({ ...formData, entry_fee_inr: Number(e.target.value) })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                  />
                </div>
                <div>
                  <Hud>Max Teams</Hud>
                  <input
                    type="number"
                    min="2"
                    max="256"
                    value={formData.max_teams}
                    onChange={(e) => setFormData({ ...formData, max_teams: Number(e.target.value) })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Hud>Tournament Format</Hud>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value, tournament_type: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm"
                  >
                    <option value="Knockout">Knockout</option>
                    <option value="Round Robin">Round Robin</option>
                    <option value="Battle Royale">Battle Royale</option>
                  </select>
                </div>
                <div>
                  <Hud>Series Format</Hud>
                  <select
                    value={formData.match_format}
                    onChange={(e) => setFormData({ ...formData, match_format: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm"
                  >
                    <option value="Best of 1">Best of 1 (BO1)</option>
                    <option value="Best of 3">Best of 3 (BO3)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Hud>WhatsApp Group URL</Hud>
                  <input
                    type="url"
                    placeholder="https://chat.whatsapp.com/..."
                    value={formData.whatsapp_group_url}
                    onChange={(e) => setFormData({ ...formData, whatsapp_group_url: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                  />
                </div>
                <div>
                  <Hud>Discord Server URL</Hud>
                  <input
                    type="url"
                    placeholder="https://discord.gg/..."
                    value={formData.discord_url}
                    onChange={(e) => setFormData({ ...formData, discord_url: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Hud>Server Region</Hud>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Hud>Start Date & Time</Hud>
                  <input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                  />
                </div>
                <div>
                  <Hud>Roster Lock Time</Hud>
                  <input
                    type="datetime-local"
                    value={formData.roster_lock_time}
                    onChange={(e) => setFormData({ ...formData, roster_lock_time: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <Hud>Description & Rules</Hud>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-xs"
                />
              </div>

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
                  {creating ? 'Creating...' : 'Create Tournament Draft'}
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
              className="relative w-full max-w-md border border-white/20 bg-graphite p-6 md:p-8 max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto select-text"
            >
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-2xl font-black uppercase text-ink">Room & Stream Settings</h3>
                  <p className="text-xs text-dim">Set custom room code, password, and live stream URL.</p>
                </div>
                <button onClick={() => setSelectedLobbyMatch(null)} className="text-dim hover:text-ink text-xl">✕</button>
              </div>

              <form onSubmit={handleSaveLobbyCredentials} className="space-y-4">
                <div>
                  <Hud>Lobby / Room Code</Hud>
                  <input
                    type="text"
                    value={lobbyCode}
                    onChange={(e) => setLobbyCode(e.target.value)}
                    placeholder="e.g. AMT-ROOM-01"
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink font-mono text-sm outline-none focus:border-cyan"
                  />
                </div>

                <div>
                  <Hud>Lobby Password</Hud>
                  <input
                    type="text"
                    value={lobbyPassword}
                    onChange={(e) => setLobbyPassword(e.target.value)}
                    placeholder="e.g. PASS123"
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink font-mono text-sm outline-none focus:border-cyan"
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
                  <span className="mt-1 block text-[10px] text-dim">Stream will appear on the match details page and broadcast hubs.</span>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedLobbyMatch(null)}
                    className="px-4 py-2 border border-white/20 text-dim hover:text-ink text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingLobby}
                    className="px-6 py-2 bg-cyan text-void font-bold uppercase hover:bg-white transition-colors text-xs"
                  >
                    {isSavingLobby ? 'Saving...' : 'Save Settings'}
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
