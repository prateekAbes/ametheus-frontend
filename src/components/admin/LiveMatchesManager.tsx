import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  type ApiMatch,
  getMatches,
  createMatchAdmin,
  updateMatchDetailsAdmin,
  deleteMatchAdmin,
  markMatchLiveAdmin,
  completeMatchAdmin,
  swapTeamsAdmin,
  updateMatchStatus,
  getTournamentRegisteredRosters,
  closeTournamentRegistration,
  updateTournamentStream,
  getTournamentRoundsRosters,
  publishRosterAdmin,
  publishAllRostersAdmin,
  type RegisteredRosterTeam,
  type TournamentRoundsRostersResponse,
} from '../../services/matches'
import { type Tournament } from '../../services/tournaments'
import { Panel, Hud, Badge, Brackets } from '../ui'

interface Props {
  tournaments: Tournament[]
  onMatchesUpdated?: () => void
}

const DEFAULT_STAGES = [
  'Round 1',
  'Round 2',
  'Round 3',
  'Quarterfinals',
  'Semifinals',
  'Grand Final',
  'Losers Bracket Round 1',
  'Losers Bracket Round 2',
  'Third Place Match',
]

export function LiveMatchesManager({ tournaments, onMatchesUpdated }: Props) {
  const [matches, setMatches] = useState<ApiMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedTournId, setSelectedTournId] = useState<string>('ALL')
  const [selectedRoundTab, setSelectedRoundTab] = useState<string>('ALL')
  const [bannerMsg, setBannerMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Tournament Stream & Rosters state
  const [tournRosters, setTournRosters] = useState<RegisteredRosterTeam[]>([])
  const [loadingRosters, setLoadingRosters] = useState(false)
  const [tournStreamUrl, setTournStreamUrl] = useState('')
  const [savingStream, setSavingStream] = useState(false)
  const [closingReg, setClosingReg] = useState(false)
  const [showRostersDrawer, setShowRostersDrawer] = useState(false)

  // Round Builder Data
  const [roundsRostersData, setRoundsRostersData] = useState<TournamentRoundsRostersResponse | null>(null)
  const [loadingRoundsData, setLoadingRoundsData] = useState(false)

  // Modals
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false)
  const [addMatchData, setAddMatchData] = useState({
    tournament_id: '',
    stage: 'Round 1',
    round_name: 'Round 1',
    round_number: 1,
    match_number: 1,
    roster_status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    team_a_mode: 'ROSTER' as 'ROSTER' | 'PLACEHOLDER',
    team_b_mode: 'ROSTER' as 'ROSTER' | 'PLACEHOLDER',
    team_a_id: '',
    team_b_id: '',
    team_a_placeholder: '',
    team_b_placeholder: '',
    next_match_slot: '',
    advancement_label: '',
    series_format: 'BO1',
    scheduled_time: '',
    scheduled_date: '',
    youtube_live_url: '',
    server_region: 'AWS Mumbai (ap-south-1)',
    lobby_code: '',
    lobby_password: '',
  })
  const [submittingAdd, setSubmittingAdd] = useState(false)

  // Single Match Publish Modal
  const [publishModalMatch, setPublishModalMatch] = useState<ApiMatch | null>(null)
  const [publishNotifyLeaders, setPublishNotifyLeaders] = useState(true)
  const [publishMatchNotes, setPublishMatchNotes] = useState('')
  const [submittingPublish, setSubmittingPublish] = useState(false)

  // Batch Publish Modal
  const [isBatchPublishOpen, setIsBatchPublishOpen] = useState(false)
  const [submittingBatchPublish, setSubmittingBatchPublish] = useState(false)

  const [goLiveMatch, setGoLiveMatch] = useState<ApiMatch | null>(null)
  const [goLiveUrl, setGoLiveUrl] = useState('')
  const [submittingLive, setSubmittingLive] = useState(false)

  const [scoreMatch, setScoreMatch] = useState<ApiMatch | null>(null)
  const [scoreForm, setScoreForm] = useState({ score_a: 0, score_b: 0, winner_team_id: '' })
  const [submittingScore, setSubmittingScore] = useState(false)

  const [editMatch, setEditMatch] = useState<ApiMatch | null>(null)
  const [editForm, setEditForm] = useState({
    status: 'SCHEDULED',
    roster_status: 'PUBLISHED',
    round_name: '',
    round_number: 1,
    match_number: 1,
    scheduled_time: '',
    scheduled_date: '',
    next_match_slot: '',
    youtube_live_url: '',
    lobby_code: '',
    lobby_password: '',
    server_region: 'AWS Mumbai (ap-south-1)',
    score_a: 0,
    score_b: 0,
    winner_team_id: '',
  })
  const [submittingEdit, setSubmittingEdit] = useState(false)

  const showBanner = (text: string, type: 'ok' | 'err' = 'ok') => {
    setBannerMsg({ type, text })
    setTimeout(() => setBannerMsg(null), 5000)
  }

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMatches()
      if (Array.isArray(data)) {
        setMatches(data)
      }
    } catch (err: any) {
      console.warn('Failed to load matches:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  const currentTournament = useMemo(
    () => tournaments.find((t) => t.id === selectedTournId || t.slug === selectedTournId),
    [tournaments, selectedTournId]
  )

  const fetchRoundsData = useCallback(async (tournId: string) => {
    if (!tournId || tournId === 'ALL') {
      setRoundsRostersData(null)
      return
    }
    setLoadingRoundsData(true)
    try {
      const res = await getTournamentRoundsRosters(tournId)
      setRoundsRostersData(res)
    } catch (err) {
      console.warn('Could not fetch tournament round roster data:', err)
      setRoundsRostersData(null)
    } finally {
      setLoadingRoundsData(false)
    }
  }, [])

  // Fetch rosters, stream, and rounds data when tournament is selected
  useEffect(() => {
    if (selectedTournId === 'ALL' || !selectedTournId) {
      setTournRosters([])
      setTournStreamUrl('')
      setRoundsRostersData(null)
      setSelectedRoundTab('ALL')
      return
    }

    setTournStreamUrl(currentTournament?.live_stream_url || '')
    setLoadingRosters(true)
    getTournamentRegisteredRosters(selectedTournId)
      .then((res) => {
        if (res && Array.isArray(res.teams)) {
          setTournRosters(res.teams)
        } else {
          setTournRosters([])
        }
      })
      .catch(() => setTournRosters([]))
      .finally(() => setLoadingRosters(false))

    fetchRoundsData(selectedTournId)
    setSelectedRoundTab('ALL')
  }, [selectedTournId, currentTournament, fetchRoundsData])

  // Extract distinct round tabs for the current tournament scope
  const availableRoundTabs = useMemo(() => {
    const roundsSet = new Set<string>()

    // From rounds data API if available
    if (roundsRostersData?.rounds && roundsRostersData.rounds.length > 0) {
      roundsRostersData.rounds.forEach((r) => {
        if (r.round_name) roundsSet.add(r.round_name)
      })
    }

    // From matches in state
    const scopedMatches = selectedTournId === 'ALL'
      ? matches
      : matches.filter((m) => m.tournament_id === selectedTournId || (currentTournament?.slug && m.tournament_id === currentTournament.slug))

    scopedMatches.forEach((m) => {
      const rName = m.round_name || m.stage || (m.round_number ? `Round ${m.round_number}` : '')
      if (rName) roundsSet.add(rName)
    })

    // If empty and a tournament is selected, provide sensible defaults
    if (roundsSet.size === 0 && selectedTournId !== 'ALL') {
      DEFAULT_STAGES.slice(0, 4).forEach((s) => roundsSet.add(s))
    }

    return Array.from(roundsSet)
  }, [roundsRostersData, matches, selectedTournId, currentTournament])

  // Handle Save Tournament Stream
  const handleSaveTournStream = async () => {
    if (!selectedTournId || selectedTournId === 'ALL') return
    setSavingStream(true)
    try {
      await updateTournamentStream(selectedTournId, tournStreamUrl.trim())
      showBanner('Tournament live stream URL broadcast updated!')
    } catch (err: any) {
      showBanner(err?.message || 'Failed to update stream URL', 'err')
    } finally {
      setSavingStream(false)
    }
  }

  // Handle Close Tournament Registration
  const handleCloseRegistration = async () => {
    if (!selectedTournId || selectedTournId === 'ALL') return
    if (!confirm('Close registration and lock rosters for this tournament?')) return
    setClosingReg(true)
    try {
      await closeTournamentRegistration(selectedTournId)
      showBanner('Tournament registrations locked. Ready for match creation & bracket progression.')
      if (currentTournament) {
        currentTournament.status = 'REGISTRATION_CLOSED'
        currentTournament.registration_status = 'CLOSED'
      }
      fetchRoundsData(selectedTournId)
    } catch (err: any) {
      showBanner(err?.message || 'Failed to close registration', 'err')
    } finally {
      setClosingReg(false)
    }
  }

  // Handle Quick Status
  const handleQuickStatus = async (matchId: string, status: string) => {
    try {
      await updateMatchStatus(matchId, status)
      showBanner(`Match status changed to ${status}`)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      showBanner(err?.message || 'Failed to change match status', 'err')
    }
  }

  // Handle Swap Teams
  const handleSwapTeams = async (matchId: string) => {
    try {
      await swapTeamsAdmin(matchId)
      showBanner('Teams swapped successfully')
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      showBanner(err?.message || 'Failed to swap teams', 'err')
    }
  }

  // Handle Delete Match
  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to permanently delete this match?')) return
    try {
      await deleteMatchAdmin(matchId)
      showBanner('Match deleted from bracket')
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      showBanner(err?.message || 'Failed to delete match', 'err')
    }
  }

  // Handle Add Match Submit
  const handleAddMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetTournId = addMatchData.tournament_id || selectedTournId
    if (!targetTournId || targetTournId === 'ALL') {
      alert('Please select a specific tournament for this match.')
      return
    }

    setSubmittingAdd(true)
    try {
      const payload: any = {
        tournament_id: targetTournId,
        stage: addMatchData.round_name || addMatchData.stage,
        round_name: addMatchData.round_name || addMatchData.stage,
        round_number: Number(addMatchData.round_number) || 1,
        match_number: Number(addMatchData.match_number) || 1,
        roster_status: addMatchData.roster_status,
        series_format: addMatchData.series_format,
        scheduled_time: addMatchData.scheduled_time || 'TBD',
        scheduled_date: addMatchData.scheduled_date || undefined,
        next_match_slot: addMatchData.next_match_slot.trim() || undefined,
        advancement_label: addMatchData.advancement_label.trim() || undefined,
        youtube_live_url: addMatchData.youtube_live_url.trim() || undefined,
        server_region: addMatchData.server_region.trim() || undefined,
        lobby_code: addMatchData.lobby_code.trim() || undefined,
        lobby_password: addMatchData.lobby_password.trim() || undefined,
        status: 'SCHEDULED',
      }

      if (addMatchData.team_a_mode === 'ROSTER' && addMatchData.team_a_id) {
        payload.team_a_id = addMatchData.team_a_id
        const t = tournRosters.find((r) => r.team_id === addMatchData.team_a_id)
        if (t) payload.team_a_name = t.team_name
      } else {
        payload.team_a_placeholder = addMatchData.team_a_placeholder.trim() || 'TBD (Team A)'
      }

      if (addMatchData.team_b_mode === 'ROSTER' && addMatchData.team_b_id) {
        payload.team_b_id = addMatchData.team_b_id
        const t = tournRosters.find((r) => r.team_id === addMatchData.team_b_id)
        if (t) payload.team_b_name = t.team_name
      } else {
        payload.team_b_placeholder = addMatchData.team_b_placeholder.trim() || 'TBD (Team B)'
      }

      await createMatchAdmin(payload)
      showBanner(
        addMatchData.roster_status === 'PUBLISHED'
          ? 'Match roster created and PUBLISHED! Team captains notified.'
          : 'Match created as DRAFT. Remember to review and publish when finalized.'
      )
      setIsAddMatchOpen(false)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to create match')
    } finally {
      setSubmittingAdd(false)
    }
  }

  // Handle Single Match Publish Roster Submit
  const handlePublishRosterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publishModalMatch) return
    setSubmittingPublish(true)
    try {
      const res = await publishRosterAdmin(publishModalMatch.id, {
        notify_leaders: publishNotifyLeaders,
        match_notes: publishMatchNotes.trim() || undefined,
      })
      showBanner(
        `✓ Roster Published! ${res.notified_count} captain(s) notified via in-app & Brevo email.`
      )
      setPublishModalMatch(null)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to publish roster')
    } finally {
      setSubmittingPublish(false)
    }
  }

  // Handle Batch Publish All Drafts Submit
  const handleBatchPublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTournId || selectedTournId === 'ALL') {
      alert('Please select a specific tournament to batch publish rosters.')
      return
    }

    setSubmittingBatchPublish(true)
    try {
      const roundTarget = selectedRoundTab !== 'ALL' ? selectedRoundTab : undefined
      const res = await publishAllRostersAdmin(selectedTournId, roundTarget)
      showBanner(
        `✓ Batch Published! ${res.published_matches} match(es) published and ${res.notified_leaders} team captains notified.`
      )
      setIsBatchPublishOpen(false)
      fetchMatches()
      fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to batch publish rosters')
    } finally {
      setSubmittingBatchPublish(false)
    }
  }

  // Handle Go Live Submit
  const handleGoLiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goLiveMatch) return
    setSubmittingLive(true)
    try {
      await markMatchLiveAdmin(goLiveMatch.id, goLiveUrl.trim())
      showBanner(`Match marked LIVE with broadcast stream!`)
      setGoLiveMatch(null)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to mark match live')
    } finally {
      setSubmittingLive(false)
    }
  }

  // Handle Score & Complete Submit
  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scoreMatch) return
    setSubmittingScore(true)
    try {
      await completeMatchAdmin(scoreMatch.id, {
        score_a: Number(scoreForm.score_a),
        score_b: Number(scoreForm.score_b),
        winner_team_id: scoreForm.winner_team_id || undefined,
      })
      showBanner(
        `Match completed! Winner automatically advanced into next round roster slot.`
      )
      setScoreMatch(null)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to record match score and advance winner')
    } finally {
      setSubmittingScore(false)
    }
  }

  // Handle Edit Match Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editMatch) return
    setSubmittingEdit(true)
    try {
      await updateMatchDetailsAdmin(editMatch.id, {
        status: editForm.status,
        roster_status: editForm.roster_status,
        round_name: editForm.round_name || undefined,
        round_number: Number(editForm.round_number) || undefined,
        match_number: Number(editForm.match_number) || undefined,
        scheduled_time: editForm.scheduled_time || undefined,
        scheduled_date: editForm.scheduled_date || undefined,
        next_match_slot: editForm.next_match_slot || undefined,
        youtube_live_url: editForm.youtube_live_url.trim() || undefined,
        lobby_code: editForm.lobby_code.trim() || undefined,
        lobby_password: editForm.lobby_password.trim() || undefined,
        server_region: editForm.server_region.trim() || undefined,
        score_a: Number(editForm.score_a),
        score_b: Number(editForm.score_b),
        winner_team_id: editForm.winner_team_id || undefined,
      })
      showBanner('Match credentials, schedule, stream & score updated successfully')
      setEditMatch(null)
      fetchMatches()
      if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to update match')
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Filtered Matches
  const filteredMatches = matches.filter((m) => {
    const statusMatch =
      statusFilter === 'ALL' || (m.status || '').toUpperCase() === statusFilter
    const tourMatch =
      selectedTournId === 'ALL' ||
      m.tournament_id === selectedTournId ||
      (currentTournament?.slug && m.tournament_id === currentTournament.slug)

    const roundMatch =
      selectedRoundTab === 'ALL' ||
      m.round_name === selectedRoundTab ||
      m.stage === selectedRoundTab ||
      (m.round_number && `Round ${m.round_number}` === selectedRoundTab)

    return statusMatch && tourMatch && roundMatch
  })

  // Draft matches in current tournament/round scope
  const draftMatchesInScope = useMemo(() => {
    return filteredMatches.filter((m) => (m.roster_status || '').toUpperCase() === 'DRAFT')
  }, [filteredMatches])

  const liveCount = matches.filter((m) => (m.status || '').toUpperCase() === 'LIVE').length
  const scheduledCount = matches.filter(
    (m) =>
      (m.status || '').toUpperCase() === 'SCHEDULED' ||
      (m.status || '').toUpperCase() === 'CHECK_IN_OPEN'
  ).length
  const completedCount = matches.filter((m) => (m.status || '').toUpperCase() === 'COMPLETED').length
  const totalDraftCount = matches.filter(
    (m) => (m.roster_status || '').toUpperCase() === 'DRAFT'
  ).length

  const isRegistrationClosed =
    currentTournament?.registration_status === 'CLOSED' ||
    currentTournament?.status === 'REGISTRATION_CLOSED' ||
    currentTournament?.status === 'IN_PROGRESS' ||
    currentTournament?.status === 'COMPLETED'

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-3xl font-black uppercase text-ink">
              Match Engine &amp; Roster Progression
            </h2>
            <span className="border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-[10px] text-cyan font-bold uppercase">
              Automated Brackets
            </span>
          </div>
          <p className="text-xs text-dim">
            Authoritative match formation: configure round rosters, draft vs published visibility, auto-advancing winners, and live broadcast streams.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const defaultRound =
                selectedRoundTab !== 'ALL'
                  ? selectedRoundTab
                  : availableRoundTabs[0] || 'Round 1'
              setAddMatchData({
                tournament_id: selectedTournId !== 'ALL' ? selectedTournId : tournaments[0]?.id || '',
                stage: defaultRound,
                round_name: defaultRound,
                round_number: 1,
                match_number: filteredMatches.length + 1,
                roster_status: 'DRAFT',
                team_a_mode: 'ROSTER',
                team_b_mode: 'ROSTER',
                team_a_id: '',
                team_b_id: '',
                team_a_placeholder: '',
                team_b_placeholder: '',
                next_match_slot: '',
                advancement_label: '',
                series_format: 'BO1',
                scheduled_time: '',
                scheduled_date: '',
                youtube_live_url: '',
                server_region: 'AWS Mumbai (ap-south-1)',
                lobby_code: '',
                lobby_password: '',
              })
              setIsAddMatchOpen(true)
            }}
            className="border border-cyan bg-cyan px-4 py-2 font-display text-xs font-black uppercase tracking-wider text-void hover:bg-cyan/90 transition-all cursor-pointer shadow-xs"
          >
            + Form Match Roster
          </button>
          <button
            onClick={() => {
              fetchMatches()
              if (selectedTournId !== 'ALL') fetchRoundsData(selectedTournId)
            }}
            disabled={loading}
            className="border border-white/20 bg-surface px-3 py-2 uppercase text-dim hover:text-ink hover:border-white/40 cursor-pointer"
          >
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {bannerMsg && (
        <div
          className={`p-3 border text-xs font-bold ${
            bannerMsg.type === 'ok'
              ? 'border-ok/40 bg-ok/10 text-ok'
              : 'border-live/40 bg-live/10 text-live'
          }`}
        >
          {bannerMsg.text}
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Panel className="p-3 text-center">
          <Hud className="text-dim">Total Matches</Hud>
          <p className="font-display text-2xl font-black text-ink">{matches.length}</p>
        </Panel>
        <Panel className="p-3 text-center border-warn/40 bg-warn/[0.03]">
          <Hud className="text-warn">Draft Rosters</Hud>
          <p className="font-display text-2xl font-black text-warn">{totalDraftCount}</p>
        </Panel>
        <Panel className="p-3 text-center border-live/40 bg-live/[0.03]">
          <Hud className="text-live">🔴 Live Now</Hud>
          <p className="font-display text-2xl font-black text-live">{liveCount}</p>
        </Panel>
        <Panel className="p-3 text-center">
          <Hud className="text-cyan">Scheduled</Hud>
          <p className="font-display text-2xl font-black text-cyan">{scheduledCount}</p>
        </Panel>
        <Panel className="p-3 text-center">
          <Hud className="text-ok">Completed</Hud>
          <p className="font-display text-2xl font-black text-ok">{completedCount}</p>
        </Panel>
      </div>

      {/* Tournament Scope Selector & Broadcast Bar */}
      <Panel className="p-4 md:p-5 space-y-4 border-white/15 bg-surface/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-ink uppercase tracking-wider">Tournament Scope:</span>
            <select
              value={selectedTournId}
              onChange={(e) => setSelectedTournId(e.target.value)}
              className="border border-white/20 bg-void px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan min-w-[240px]"
            >
              <option value="ALL">All Tournaments (Global View)</option>
              {tournaments.map((t) => (
                <option key={t.id || t.slug} value={t.id || t.slug}>
                  {t.title} ({t.status || 'ACTIVE'})
                </option>
              ))}
            </select>
          </div>

          {selectedTournId !== 'ALL' && currentTournament && (
            <div className="flex flex-wrap items-center gap-2">
              {!isRegistrationClosed ? (
                <button
                  onClick={handleCloseRegistration}
                  disabled={closingReg}
                  className="border border-warn/40 bg-warn/15 px-3 py-1.5 text-[11px] font-bold text-warn hover:bg-warn hover:text-void transition-colors cursor-pointer"
                >
                  {closingReg ? 'Closing...' : '🔒 Close Reg & Finalize Rosters'}
                </button>
              ) : (
                <span className="border border-dim bg-dim/10 px-2.5 py-1 text-[10px] text-dim font-bold uppercase">
                  ✓ Registrations Closed
                </span>
              )}
              <button
                onClick={() => setShowRostersDrawer(!showRostersDrawer)}
                className="border border-cyan/40 bg-cyan/10 px-3 py-1.5 text-[11px] font-bold text-cyan hover:bg-cyan hover:text-void transition-colors cursor-pointer"
              >
                {showRostersDrawer ? 'Hide Rosters' : `View Contenders (${tournRosters.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Tournament Broadcast Stream Bar */}
        {selectedTournId !== 'ALL' && currentTournament && (
          <div className="pt-3 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-void/50 p-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-live font-bold uppercase tracking-wider shrink-0">
                🔴 Tournament Stream:
              </span>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=... or /live/..."
                value={tournStreamUrl}
                onChange={(e) => setTournStreamUrl(e.target.value)}
                className="w-full border border-white/15 bg-surface px-3 py-1 text-xs text-ink outline-none focus:border-cyan"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSaveTournStream}
                disabled={savingStream}
                className="border border-live bg-live/20 px-3 py-1 text-[11px] font-bold text-live hover:bg-live hover:text-white transition-colors cursor-pointer"
              >
                {savingStream ? 'Saving...' : 'Broadcast Stream'}
              </button>
              {tournStreamUrl && (
                <a
                  href={tournStreamUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-white/20 px-2.5 py-1 text-[11px] text-dim hover:text-ink"
                >
                  Watch ↗
                </a>
              )}
            </div>
          </div>
        )}

        {/* Registered Contenders & Unpaired Roster Drawer */}
        {showRostersDrawer && selectedTournId !== 'ALL' && (
          <div className="pt-3 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <Hud className="text-cyan">
                Registered Contenders &amp; Rosters ({tournRosters.length} Teams)
              </Hud>
              {loadingRosters && <span className="text-dim">Loading rosters...</span>}
            </div>

            {tournRosters.length === 0 ? (
              <div className="p-4 border border-dashed border-white/10 text-center text-dim">
                No teams have registered for this tournament yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[280px] overflow-y-auto">
                {tournRosters.map((team) => (
                  <div
                    key={team.team_id}
                    className="border border-white/10 bg-void/80 p-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-black uppercase text-ink truncate max-w-[180px]">
                        {team.team_name} [{team.team_tag}]
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 border uppercase ${
                          team.is_paired
                            ? 'border-ok/40 text-ok bg-ok/10'
                            : 'border-warn/40 text-warn bg-warn/10'
                        }`}
                      >
                        {team.is_paired ? 'Paired' : 'Unpaired'}
                      </span>
                    </div>
                    <div className="text-[10px] text-dim">
                      Captain: @{team.captain?.username || team.captain_username || 'TBD'}
                    </div>
                    {team.members && team.members.length > 0 && (
                      <div className="text-[10px] text-dim/80 truncate">
                        Members: {team.members.map((m) => m.username || m.game_id).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* ROUND SELECTION TABS & ROSTER BATCH PUBLISH BAR */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-graphite p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-dim uppercase font-bold mr-1">Rounds:</span>
            <button
              onClick={() => setSelectedRoundTab('ALL')}
              className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                selectedRoundTab === 'ALL'
                  ? 'border border-cyan bg-cyan text-void font-bold'
                  : 'border border-white/10 bg-surface text-dim hover:text-ink'
              }`}
            >
              All Rounds ({filteredMatches.length})
            </button>
            {availableRoundTabs.map((r) => {
              const rMatches = matches.filter((m) => {
                const tourMatch =
                  selectedTournId === 'ALL' ||
                  m.tournament_id === selectedTournId ||
                  (currentTournament?.slug && m.tournament_id === currentTournament.slug)
                const isRound =
                  m.round_name === r ||
                  m.stage === r ||
                  (m.round_number && `Round ${m.round_number}` === r)
                return tourMatch && isRound
              })
              const rDrafts = rMatches.filter(
                (m) => (m.roster_status || '').toUpperCase() === 'DRAFT'
              ).length

              return (
                <button
                  key={r}
                  onClick={() => setSelectedRoundTab(r)}
                  className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selectedRoundTab === r
                      ? 'border border-cyan bg-cyan text-void font-bold'
                      : 'border border-white/10 bg-surface text-dim hover:text-ink'
                  }`}
                >
                  <span>{r}</span>
                  <span className="text-[10px] opacity-75">({rMatches.length})</span>
                  {rDrafts > 0 && (
                    <span className="size-2 rounded-full bg-warn inline-block" title={`${rDrafts} draft rosters`} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Batch Publish Button if there are draft rosters in scope */}
          {draftMatchesInScope.length > 0 && selectedTournId !== 'ALL' && (
            <button
              onClick={() => setIsBatchPublishOpen(true)}
              className="border border-warn bg-warn/15 px-3 py-1 font-mono text-xs font-bold uppercase text-warn hover:bg-warn hover:text-void transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>📢 Publish All Drafts in {selectedRoundTab === 'ALL' ? 'Tournament' : selectedRoundTab} ({draftMatchesInScope.length})</span>
            </button>
          )}
        </div>

        {/* Secondary Filter: Match Lifecycle Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-dim uppercase font-bold text-[11px] mr-1">Status:</span>
            {['ALL', 'LIVE', 'CHECK_IN_OPEN', 'SCHEDULED', 'COMPLETED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
                  statusFilter === s
                    ? 'border border-cyan text-cyan font-bold bg-cyan/10'
                    : 'text-dim hover:text-ink'
                }`}
              >
                {s === 'LIVE' ? '🔴 LIVE' : s}
              </button>
            ))}
          </div>
          <Hud className="text-cyan">{filteredMatches.length} Match Formations Listed</Hud>
        </div>
      </div>

      {/* MATCH FORMATIONS LIST: WHO IS PLAYING WHOM */}
      <div className="space-y-4">
        {filteredMatches.map((m) => {
          const isLive = (m.status || '').toUpperCase() === 'LIVE'
          const isCheckIn = (m.status || '').toUpperCase() === 'CHECK_IN_OPEN'
          const isDone = (m.status || '').toUpperCase() === 'COMPLETED'
          const isDraft = (m.roster_status || '').toUpperCase() === 'DRAFT'
          const isUpdated = (m.roster_status || '').toUpperCase() === 'UPDATED'

          const teamAName = m.team_a?.name || m.team_a_name || m.team_a_placeholder || 'TBD (Team A)'
          const teamBName = m.team_b?.name || m.team_b_name || m.team_b_placeholder || 'TBD (Team B)'
          const isTeamAPlaceholder = !m.team_a_id && Boolean(m.team_a_placeholder)
          const isTeamBPlaceholder = !m.team_b_id && Boolean(m.team_b_placeholder)

          const scoreA = m.team_a?.score ?? m.score_a ?? 0
          const scoreB = m.team_b?.score ?? m.score_b ?? 0
          const streamUrl = m.youtube_live_url || m.live_link

          const roundTitle = m.round_name || m.stage || `Round ${m.round_number || 1}`
          const matchNum = m.match_number || m.order || 1

          return (
            <Panel
              key={m.id}
              className={`p-4 md:p-5 transition-colors relative ${
                isLive
                  ? 'border-live/60 bg-live/[0.04]'
                  : isDraft
                  ? 'border-warn/40 bg-warn/[0.02]'
                  : isCheckIn
                  ? 'border-cyan/40 bg-cyan/[0.02]'
                  : 'border-white/10 bg-surface/50'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2.5 flex-1 min-w-0">
                  {/* Round Header & Status Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-black text-sm uppercase text-cyan tracking-wider">
                      {roundTitle} · MATCH {matchNum}
                    </span>
                    <span className="text-white/20">|</span>
                    <span className="text-dim text-[11px] truncate max-w-[200px]">
                      {m.tournament_title || currentTournament?.title || 'Tournament'}
                    </span>
                    <span className="text-white/20">|</span>

                    {/* Roster Publication Badge */}
                    {isDraft ? (
                      <span className="border border-warn bg-warn/15 px-2 py-0.5 text-[10px] font-bold uppercase text-warn">
                        ⚠️ DRAFT (HIDDEN FROM PUBLIC)
                      </span>
                    ) : isUpdated ? (
                      <span className="border border-cyan bg-cyan/15 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan">
                        🔄 ROSTER UPDATED
                      </span>
                    ) : (
                      <span className="border border-ok/40 bg-ok/10 px-2 py-0.5 text-[10px] font-bold uppercase text-ok">
                        ✓ PUBLISHED &amp; PUBLIC
                      </span>
                    )}

                    {/* Match Lifecycle Badge */}
                    <Badge
                      s={
                        isLive
                          ? 'live'
                          : isDone
                          ? 'completed'
                          : isCheckIn
                          ? 'warn'
                          : 'upcoming'
                      }
                      label={m.status || 'SCHEDULED'}
                    />

                    {streamUrl && (
                      <a
                        href={streamUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-live/20 px-2 py-0.5 text-[10px] font-bold text-live border border-live/30 hover:bg-live/30"
                      >
                        🔴 Stream Active ↗
                      </a>
                    )}
                  </div>

                  {/* VISUAL WHO IS PLAYING WHOM */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 border-y border-white/5 my-1">
                    {/* Team A */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="size-8 rounded bg-void border border-white/10 flex items-center justify-center font-display font-black text-xs text-ink shrink-0">
                        A
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-display text-base md:text-lg font-black uppercase truncate ${
                              isTeamAPlaceholder ? 'italic text-dim' : 'text-ink'
                            }`}
                          >
                            {teamAName}
                          </span>
                          {m.team_a?.tag && (
                            <span className="text-[10px] text-cyan font-mono">[{m.team_a.tag}]</span>
                          )}
                        </div>
                        {isTeamAPlaceholder && (
                          <span className="text-[9px] text-dim block">Advancement Placeholder</span>
                        )}
                      </div>
                      <span className="font-display text-lg font-black text-cyan px-2 py-0.5 bg-void border border-white/10 tabular-nums shrink-0">
                        {scoreA}
                      </span>
                    </div>

                    {/* VS Bridge */}
                    <div className="flex sm:flex-col items-center justify-center px-3 py-1 font-display font-black text-dim text-xs tracking-wider shrink-0">
                      <span>─── VS ───</span>
                    </div>

                    {/* Team B */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="font-display text-lg font-black text-cyan px-2 py-0.5 bg-void border border-white/10 tabular-nums shrink-0">
                        {scoreB}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-display text-base md:text-lg font-black uppercase truncate ${
                              isTeamBPlaceholder ? 'italic text-dim' : 'text-ink'
                            }`}
                          >
                            {teamBName}
                          </span>
                          {m.team_b?.tag && (
                            <span className="text-[10px] text-cyan font-mono">[{m.team_b.tag}]</span>
                          )}
                        </div>
                        {isTeamBPlaceholder && (
                          <span className="text-[9px] text-dim block">Advancement Placeholder</span>
                        )}
                      </div>
                      <div className="size-8 rounded bg-void border border-white/10 flex items-center justify-center font-display font-black text-xs text-ink shrink-0">
                        B
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Advancement Progression */}
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-dim">
                    <span>Format: <strong className="text-ink">{m.format || m.series_format || 'BO1'}</strong></span>
                    <span>Region: <strong className="text-ink">{m.server_region || 'AWS Mumbai'}</strong></span>
                    {(m.scheduled_date || m.scheduled_time) && (
                      <span>Schedule: <strong className="text-cyan">{[m.scheduled_date, m.scheduled_time].filter(Boolean).join(' ')}</strong></span>
                    )}
                    {m.lobby_code && (
                      <span className="text-ink">
                        Lobby: <strong className="text-cyan">{m.lobby_code}</strong>
                      </span>
                    )}
                    {m.lobby_password && (
                      <span className="text-ink">
                        Pass: <strong className="text-warn">{m.lobby_password}</strong>
                      </span>
                    )}
                  </div>

                  {/* Winner / Auto-Advancement Destination Banner */}
                  {(m.next_match_slot || m.advancement_label || isDone) && (
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
                      {isDone && m.winner_team_id && (
                        <span className="border border-ok/50 bg-ok/10 text-ok px-2 py-0.5 font-bold">
                          🏆 Winner: {m.winner_team_id === m.team_a_id ? teamAName : teamBName}
                        </span>
                      )}
                      {m.next_match_slot ? (
                        <span className="text-cyan font-mono">
                          ──► Winner Advances to: <strong>{m.next_match_slot}</strong>
                        </span>
                      ) : m.advancement_label ? (
                        <span className="text-cyan font-mono">
                          ──► Progression: <strong>{m.advancement_label}</strong>
                        </span>
                      ) : isDone ? (
                        <span className="text-ok font-mono text-[10px]">
                          ✓ Bracket Engine: Winner automatically advanced into next round slot.
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Operations & Authoritative Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-white/10">
                  {/* Publish Roster Button (If in Draft) */}
                  {isDraft && (
                    <button
                      onClick={() => {
                        setPublishModalMatch(m)
                        setPublishNotifyLeaders(true)
                        setPublishMatchNotes('')
                      }}
                      className="border border-warn bg-warn/20 px-3 py-1.5 uppercase text-xs font-bold text-warn hover:bg-warn hover:text-void transition-all cursor-pointer"
                    >
                      📢 Publish Roster
                    </button>
                  )}

                  {!isLive && !isDone && (
                    <button
                      onClick={() => {
                        setGoLiveMatch(m)
                        setGoLiveUrl(
                          m.youtube_live_url ||
                            m.live_link ||
                            currentTournament?.live_stream_url ||
                            ''
                        )
                      }}
                      className="border border-live bg-live/20 px-3 py-1.5 uppercase text-xs font-bold text-live hover:bg-live hover:text-white transition-all cursor-pointer"
                    >
                      🔴 Go Live
                    </button>
                  )}

                  {!isCheckIn && !isLive && !isDone && (
                    <button
                      onClick={() => handleQuickStatus(m.id, 'CHECK_IN_OPEN')}
                      className="border border-warn/40 bg-warn/10 px-3 py-1.5 uppercase text-xs text-warn hover:bg-warn/20 transition-all cursor-pointer"
                    >
                      Open Check-In
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setScoreMatch(m)
                      setScoreForm({
                        score_a: m.team_a?.score ?? m.score_a ?? 0,
                        score_b: m.team_b?.score ?? m.score_b ?? 0,
                        winner_team_id: m.winner_team_id || '',
                      })
                    }}
                    className="border border-ok/40 bg-ok/10 px-3 py-1.5 uppercase text-xs font-bold text-ok hover:bg-ok hover:text-void transition-all cursor-pointer"
                  >
                    🏁 Score / Complete
                  </button>

                  <button
                    onClick={() => {
                      setEditMatch(m)
                      setEditForm({
                        status: m.status || 'SCHEDULED',
                        roster_status: m.roster_status || 'PUBLISHED',
                        round_name: m.round_name || m.stage || 'Round 1',
                        round_number: m.round_number || 1,
                        match_number: m.match_number || 1,
                        scheduled_time: m.scheduled_time || '',
                        scheduled_date: m.scheduled_date || '',
                        next_match_slot: m.next_match_slot || '',
                        youtube_live_url: m.youtube_live_url || m.live_link || '',
                        lobby_code: m.lobby_code || '',
                        lobby_password: m.lobby_password || '',
                        server_region: m.server_region || 'AWS Mumbai (ap-south-1)',
                        score_a: m.team_a?.score ?? m.score_a ?? 0,
                        score_b: m.team_b?.score ?? m.score_b ?? 0,
                        winner_team_id: m.winner_team_id || '',
                      })
                    }}
                    className="border border-cyan bg-cyan/15 px-3 py-1.5 uppercase text-xs font-bold text-cyan hover:bg-cyan hover:text-void transition-all cursor-pointer"
                  >
                    Edit Lobby
                  </button>

                  <button
                    onClick={() => handleSwapTeams(m.id)}
                    title="Swap Team A and Team B sides"
                    className="border border-white/20 px-2 py-1.5 uppercase text-xs text-dim hover:text-ink cursor-pointer"
                  >
                    ⇄ Swap
                  </button>

                  <button
                    onClick={() => handleDeleteMatch(m.id)}
                    title="Delete Match"
                    className="border border-live/30 px-2 py-1.5 uppercase text-xs text-live/80 hover:bg-live hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </Panel>
          )
        })}

        {filteredMatches.length === 0 && (
          <div className="border border-white/10 p-12 text-center text-dim bg-surface/30">
            No matches found for the selected round and criteria. Use &quot;+ Form Match Roster&quot; above to configure round formations.
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / FORM MATCH ROSTER */}
      {isAddMatchOpen && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-md overflow-y-auto"
        >
          <div className="w-full max-w-lg border border-white/20 bg-graphite p-6 my-8 relative max-h-[90vh] overflow-y-auto">
            <Brackets color="border-cyan/50" />
            <h3 className="font-display text-2xl font-black uppercase text-ink">
              Form Round Match Roster
            </h3>
            <p className="text-xs text-dim mt-1">
              Configure who plays whom for this round with advancement routing and draft control.
            </p>

            <form onSubmit={handleAddMatchSubmit} className="mt-5 space-y-4 font-mono text-xs">
              {/* Target Tournament */}
              <div>
                <label className="block text-dim uppercase mb-1">Target Tournament</label>
                <select
                  value={addMatchData.tournament_id}
                  onChange={(e) =>
                    setAddMatchData({ ...addMatchData, tournament_id: e.target.value })
                  }
                  required
                  className="w-full border border-white/20 bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-cyan"
                >
                  {tournaments.map((t) => (
                    <option key={t.id || t.slug} value={t.id || t.slug}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Roster Publication Initial State */}
              <div className="border border-warn/30 bg-warn/[0.04] p-3 space-y-1">
                <label className="block text-warn font-bold uppercase">
                  Roster Visibility Status
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="roster_status"
                      value="DRAFT"
                      checked={addMatchData.roster_status === 'DRAFT'}
                      onChange={() => setAddMatchData({ ...addMatchData, roster_status: 'DRAFT' })}
                      className="accent-warn"
                    />
                    <span className="text-ink font-bold">DRAFT (Review first, hidden from public)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="roster_status"
                      value="PUBLISHED"
                      checked={addMatchData.roster_status === 'PUBLISHED'}
                      onChange={() => setAddMatchData({ ...addMatchData, roster_status: 'PUBLISHED' })}
                      className="accent-cyan"
                    />
                    <span className="text-ink font-bold">PUBLISHED (Immediately public &amp; notify)</span>
                  </label>
                </div>
              </div>

              {/* Stage / Round Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim uppercase mb-1">Round / Stage Name</label>
                  <input
                    type="text"
                    list="available-rounds-list"
                    value={addMatchData.round_name}
                    onChange={(e) =>
                      setAddMatchData({
                        ...addMatchData,
                        round_name: e.target.value,
                        stage: e.target.value,
                      })
                    }
                    placeholder="e.g. Quarterfinals or Round 1"
                    required
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-cyan"
                  />
                  <datalist id="available-rounds-list">
                    {availableRoundTabs.map((st) => (
                      <option key={st} value={st} />
                    ))}
                    {DEFAULT_STAGES.map((st) => (
                      <option key={st} value={st} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-dim uppercase mb-1">Series Format</label>
                  <select
                    value={addMatchData.series_format}
                    onChange={(e) =>
                      setAddMatchData({ ...addMatchData, series_format: e.target.value })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-cyan"
                  >
                    <option value="BO1">Best of 1 (BO1)</option>
                    <option value="BO3">Best of 3 (BO3)</option>
                    <option value="BO5">Best of 5 (BO5)</option>
                  </select>
                </div>
              </div>

              {/* Round & Match Ordering Numbers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim uppercase mb-1">Round Number</label>
                  <input
                    type="number"
                    min="1"
                    value={addMatchData.round_number}
                    onChange={(e) =>
                      setAddMatchData({ ...addMatchData, round_number: Number(e.target.value) })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block text-dim uppercase mb-1">Match Number in Round</label>
                  <input
                    type="number"
                    min="1"
                    value={addMatchData.match_number}
                    onChange={(e) =>
                      setAddMatchData({ ...addMatchData, match_number: Number(e.target.value) })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
              </div>

              {/* Team A Selection */}
              <div className="border border-white/10 bg-void/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink uppercase">Team A</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setAddMatchData({ ...addMatchData, team_a_mode: 'ROSTER' })
                      }
                      className={`px-2 py-0.5 text-[10px] uppercase ${
                        addMatchData.team_a_mode === 'ROSTER'
                          ? 'border border-cyan bg-cyan text-void font-bold'
                          : 'text-dim hover:text-ink'
                      }`}
                    >
                      Registered Team
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAddMatchData({ ...addMatchData, team_a_mode: 'PLACEHOLDER' })
                      }
                      className={`px-2 py-0.5 text-[10px] uppercase ${
                        addMatchData.team_a_mode === 'PLACEHOLDER'
                          ? 'border border-cyan bg-cyan text-void font-bold'
                          : 'text-dim hover:text-ink'
                      }`}
                    >
                      Placeholder
                    </button>
                  </div>
                </div>

                {addMatchData.team_a_mode === 'ROSTER' ? (
                  <select
                    value={addMatchData.team_a_id}
                    onChange={(e) =>
                      setAddMatchData({ ...addMatchData, team_a_id: e.target.value })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  >
                    <option value="">Select Registered Team...</option>
                    {tournRosters.map((r) => (
                      <option key={r.team_id} value={r.team_id}>
                        {r.team_name} [{r.team_tag}] (Capt: @{r.captain?.username || r.captain_username || 'TBD'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Winner of Match 1 or Alpha Squad"
                    value={addMatchData.team_a_placeholder}
                    onChange={(e) =>
                      setAddMatchData({ ...addMatchData, team_a_placeholder: e.target.value })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                )}
              </div>

              {/* Team B Selection */}
              <div className="border border-white/10 bg-void/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink uppercase">Team B</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setAddMatchData({ ...addMatchData, team_b_mode: 'ROSTER' })
                      }
                      className={`px-2 py-0.5 text-[10px] uppercase ${
                        addMatchData.team_b_mode === 'ROSTER'
                          ? 'border border-cyan bg-cyan text-void font-bold'
                          : 'text-dim hover:text-ink'
                      }`}
                    >
                      Registered Team
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAddMatchData({ ...addMatchData, team_b_mode: 'PLACEHOLDER' })
                      }
                      className={`px-2 py-0.5 text-[10px] uppercase ${
                        addMatchData.team_b_mode === 'PLACEHOLDER'
                          ? 'border border-cyan bg-cyan text-void font-bold'
                          : 'text-dim hover:text-ink'
                      }`}
                    >
                      Placeholder
                    </button>
                  </div>
                </div>

                {addMatchData.team_b_mode === 'ROSTER' ? (
                  <select
                    value={addMatchData.team_b_id}
                    onChange={(e) =>
                      setAddMatchData({ ...addMatchData, team_b_id: e.target.value })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  >
                    <option value="">Select Registered Team...</option>
                    {tournRosters.map((r) => (
                      <option key={r.team_id} value={r.team_id}>
                        {r.team_name} [{r.team_tag}] (Capt: @{r.captain?.username || r.captain_username || 'TBD'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Winner of Match 2 or Beta Squad"
                    value={addMatchData.team_b_placeholder}
                    onChange={(e) =>
                      setAddMatchData({ ...addMatchData, team_b_placeholder: e.target.value })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                )}
              </div>

              {/* Advancement Destination */}
              <div>
                <label className="block text-dim uppercase mb-1">
                  Advancement Destination Slot (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Semifinals Match 1 or Grand Final"
                  value={addMatchData.next_match_slot}
                  onChange={(e) =>
                    setAddMatchData({ ...addMatchData, next_match_slot: e.target.value })
                  }
                  className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                />
                <p className="text-[10px] text-dim mt-0.5">
                  Winning team will be automatically placed into this bracket slot upon match completion.
                </p>
              </div>

              {/* Scheduled Time & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim uppercase mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={addMatchData.scheduled_date}
                    onChange={(e) =>
                      setAddMatchData({ ...addMatchData, scheduled_date: e.target.value })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block text-dim uppercase mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 8:00 PM IST"
                    value={addMatchData.scheduled_time}
                    onChange={(e) =>
                      setAddMatchData({ ...addMatchData, scheduled_time: e.target.value })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
              </div>

              {/* Optional Broadcast URL */}
              <div>
                <label className="block text-dim uppercase mb-1">YouTube Live Stream (Optional)</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/live/..."
                  value={addMatchData.youtube_live_url}
                  onChange={(e) =>
                    setAddMatchData({ ...addMatchData, youtube_live_url: e.target.value })
                  }
                  className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddMatchOpen(false)}
                  className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="border border-cyan bg-cyan px-5 py-2 font-display text-xs font-black uppercase text-void hover:bg-cyan/90 transition-colors cursor-pointer"
                >
                  {submittingAdd ? 'Saving...' : 'Save Match Formation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SINGLE MATCH ROSTER PUBLISH REVIEW */}
      {publishModalMatch && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-md"
        >
          <div className="w-full max-w-lg border border-warn bg-graphite p-6 relative">
            <Brackets color="border-warn/60" />
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-warn/20 border border-warn/40 text-warn text-[10px] font-bold uppercase mb-2">
              ⚠️ ROSTER REVIEW &amp; PUBLICATION
            </div>
            <h3 className="font-display text-2xl font-black uppercase text-ink">
              Publish Match Roster
            </h3>
            <p className="text-xs text-dim mt-1">
              Confirm lineup for {publishModalMatch.round_name || publishModalMatch.stage} · Match {publishModalMatch.match_number || 1}.
            </p>

            <form onSubmit={handlePublishRosterSubmit} className="mt-4 space-y-4 font-mono text-xs">
              {/* Matchup Summary Box */}
              <div className="border border-white/10 bg-void/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-black uppercase text-cyan">
                    {publishModalMatch.team_a?.name || publishModalMatch.team_a_name || 'Team A'}
                  </span>
                  <span className="text-dim font-bold">VS</span>
                  <span className="font-display text-base font-black uppercase text-cyan">
                    {publishModalMatch.team_b?.name || publishModalMatch.team_b_name || 'Team B'}
                  </span>
                </div>
                <div className="text-[11px] text-dim flex flex-wrap gap-3 border-t border-white/10 pt-2">
                  <span>Schedule: {publishModalMatch.scheduled_time || 'TBD'}</span>
                  <span>Format: {publishModalMatch.series_format || publishModalMatch.format || 'BO1'}</span>
                </div>
              </div>

              {/* Publication Notice */}
              <div className="border border-cyan/30 bg-cyan/[0.05] p-3 text-[11px] space-y-1 text-cyan">
                <p className="font-bold">Publishing this roster will immediately:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-ink/80">
                  <li>Make this match publicly visible in the Live Matches schedule</li>
                  <li>Send real-time in-app alerts to both registered team captains</li>
                  <li>Dispatch official branded notification emails via Brevo with community links</li>
                </ul>
              </div>

              {/* Optional Custom Notes */}
              <div>
                <label className="block text-dim uppercase mb-1">
                  Optional Match Notes for Captains
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please join lobby 15 minutes before match time"
                  value={publishMatchNotes}
                  onChange={(e) => setPublishMatchNotes(e.target.value)}
                  className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                />
              </div>

              {/* Notification Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={publishNotifyLeaders}
                  onChange={(e) => setPublishNotifyLeaders(e.target.checked)}
                  className="accent-cyan"
                />
                <span className="text-ink font-bold">
                  Notify Team Captains (In-App Alert &amp; Brevo Email)
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPublishModalMatch(null)}
                  className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer"
                >
                  Back to Edit
                </button>
                <button
                  type="submit"
                  disabled={submittingPublish}
                  className="border border-warn bg-warn px-5 py-2 font-display text-xs font-black uppercase text-void hover:bg-warn/90 transition-colors cursor-pointer"
                >
                  {submittingPublish ? 'Publishing...' : 'Confirm & Publish Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BATCH PUBLISH CONFIRMATION */}
      {isBatchPublishOpen && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-md"
        >
          <div className="w-full max-w-lg border border-warn bg-graphite p-6 relative">
            <Brackets color="border-warn/60" />
            <h3 className="font-display text-2xl font-black uppercase text-ink">
              Batch Publish Draft Rosters
            </h3>
            <p className="text-xs text-dim mt-1">
              You are about to publish {draftMatchesInScope.length} draft match(es) for{' '}
              {selectedRoundTab === 'ALL' ? 'all rounds' : selectedRoundTab}.
            </p>

            <form onSubmit={handleBatchPublishSubmit} className="mt-4 space-y-4 font-mono text-xs">
              <div className="max-h-[220px] overflow-y-auto space-y-2 border border-white/10 bg-void/60 p-3">
                {draftMatchesInScope.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-[11px] border-b border-white/5 pb-1">
                    <span className="text-cyan font-bold">
                      {m.round_name || m.stage} · M{m.match_number || 1}
                    </span>
                    <span className="text-ink">
                      {m.team_a?.name || m.team_a_name || 'Team A'} vs {m.team_b?.name || m.team_b_name || 'Team B'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border border-cyan/30 bg-cyan/[0.05] p-3 text-[11px] text-cyan">
                Every team leader with registered email will receive an official match notification email with tournament details and community links.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsBatchPublishOpen(false)}
                  className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBatchPublish}
                  className="border border-warn bg-warn px-5 py-2 font-display text-xs font-black uppercase text-void hover:bg-warn/90 transition-colors cursor-pointer"
                >
                  {submittingBatchPublish ? 'Publishing All...' : 'Confirm & Publish All'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GO LIVE */}
      {goLiveMatch && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-md"
        >
          <div className="w-full max-w-md border border-live/60 bg-graphite p-6 relative">
            <Brackets color="border-live/60" />
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-live/20 border border-live/40 text-live text-[10px] font-bold uppercase mb-2">
              <span className="size-1.5 rounded-full bg-live animate-ping" />
              BROADCAST CONTROL
            </div>
            <h3 className="font-display text-2xl font-black uppercase text-ink">
              Mark Match Live
            </h3>
            <p className="text-xs text-dim mt-1">
              {goLiveMatch.tournament_title} · {goLiveMatch.team_a?.name || 'Team A'} VS{' '}
              {goLiveMatch.team_b?.name || 'Team B'}
            </p>

            <form onSubmit={handleGoLiveSubmit} className="mt-4 space-y-4 font-mono text-xs">
              <div>
                <label className="block text-dim uppercase mb-1">
                  YouTube Live Stream URL
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or /live/..."
                  value={goLiveUrl}
                  onChange={(e) => setGoLiveUrl(e.target.value)}
                  required
                  className="w-full border border-white/20 bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-live"
                />
                <p className="text-[10px] text-dim mt-1">
                  This broadcast link will stream live on the match arena and public tournament hubs.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setGoLiveMatch(null)}
                  className="border border-white/20 px-3 py-1.5 uppercase text-dim hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLive}
                  className="border border-live bg-live px-4 py-1.5 uppercase text-xs font-bold text-white hover:bg-live/90 transition-colors cursor-pointer"
                >
                  {submittingLive ? 'Broadcasting...' : '🔴 Start Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SCORE & COMPLETE (WITH AUTOMATIC ADVANCEMENT) */}
      {scoreMatch && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-md"
        >
          <div className="w-full max-w-md border border-white/20 bg-graphite p-6 relative">
            <Brackets color="border-ok/50" />
            <h3 className="font-display text-2xl font-black uppercase text-ink">
              Score &amp; Complete Match
            </h3>
            <p className="text-xs text-dim mt-1">
              Record official scores. Declaring a winner will automatically advance that team into the next round match slot in this bracket.
            </p>

            <form onSubmit={handleScoreSubmit} className="mt-4 space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-white/10 bg-void/50 p-3">
                  <label className="block text-dim uppercase mb-1 truncate">
                    {scoreMatch.team_a?.name || scoreMatch.team_a_name || 'Team A'} Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={scoreForm.score_a}
                    onChange={(e) =>
                      setScoreForm({ ...scoreForm, score_a: Number(e.target.value) })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-xl font-display font-black text-cyan outline-none"
                  />
                </div>
                <div className="border border-white/10 bg-void/50 p-3">
                  <label className="block text-dim uppercase mb-1 truncate">
                    {scoreMatch.team_b?.name || scoreMatch.team_b_name || 'Team B'} Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={scoreForm.score_b}
                    onChange={(e) =>
                      setScoreForm({ ...scoreForm, score_b: Number(e.target.value) })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-xl font-display font-black text-cyan outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-dim uppercase mb-1">Declared Winner</label>
                <select
                  value={scoreForm.winner_team_id}
                  onChange={(e) =>
                    setScoreForm({ ...scoreForm, winner_team_id: e.target.value })
                  }
                  className="w-full border border-white/20 bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-cyan"
                >
                  <option value="">Auto-Determine from Highest Score</option>
                  {(scoreMatch.team_a?.id || scoreMatch.team_a_id) && (
                    <option value={scoreMatch.team_a?.id || scoreMatch.team_a_id}>
                      {scoreMatch.team_a?.name || scoreMatch.team_a_name || 'Team A'}
                    </option>
                  )}
                  {(scoreMatch.team_b?.id || scoreMatch.team_b_id) && (
                    <option value={scoreMatch.team_b?.id || scoreMatch.team_b_id}>
                      {scoreMatch.team_b?.name || scoreMatch.team_b_name || 'Team B'}
                    </option>
                  )}
                </select>
              </div>

              <div className="border border-ok/30 bg-ok/[0.05] p-2.5 text-[11px] text-ok">
                ⚡ Winner will be populated into the next round bracket match immediately upon submission.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setScoreMatch(null)}
                  className="border border-white/20 px-3 py-1.5 uppercase text-dim hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingScore}
                  className="border border-ok bg-ok px-4 py-1.5 uppercase text-xs font-bold text-void hover:bg-ok/90 transition-colors cursor-pointer"
                >
                  {submittingScore ? 'Saving...' : 'Confirm & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT MATCH DETAILS & LOBBY */}
      {editMatch && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-md overflow-y-auto"
        >
          <div className="w-full max-w-lg border border-white/20 bg-graphite p-6 my-8 relative max-h-[90vh] overflow-y-auto">
            <Brackets color="border-cyan/50" />
            <h3 className="font-display text-2xl font-black uppercase text-ink">
              Edit Match &amp; Lobby Credentials
            </h3>
            <p className="text-xs text-dim mt-1 font-mono">
              {editMatch.tournament_title || 'Tournament'} · {editMatch.stage || 'Round'}
            </p>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim uppercase mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="CHECK_IN_OPEN">CHECK_IN_OPEN</option>
                    <option value="LIVE">LIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="DISPUTED">DISPUTED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-dim uppercase mb-1">Roster Visibility</label>
                  <select
                    value={editForm.roster_status}
                    onChange={(e) => setEditForm({ ...editForm, roster_status: e.target.value })}
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  >
                    <option value="DRAFT">DRAFT (Hidden from Public)</option>
                    <option value="PUBLISHED">PUBLISHED (Public)</option>
                    <option value="UPDATED">UPDATED (Rescheduled)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim uppercase mb-1">Round / Stage Name</label>
                  <input
                    type="text"
                    value={editForm.round_name}
                    onChange={(e) => setEditForm({ ...editForm, round_name: e.target.value })}
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block text-dim uppercase mb-1">Next Match Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. Semifinals Match 1"
                    value={editForm.next_match_slot}
                    onChange={(e) => setEditForm({ ...editForm, next_match_slot: e.target.value })}
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim uppercase mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={editForm.scheduled_date}
                    onChange={(e) => setEditForm({ ...editForm, scheduled_date: e.target.value })}
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block text-dim uppercase mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    value={editForm.scheduled_time}
                    onChange={(e) => setEditForm({ ...editForm, scheduled_time: e.target.value })}
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-dim uppercase mb-1">YouTube Live Stream URL</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/live/..."
                  value={editForm.youtube_live_url}
                  onChange={(e) =>
                    setEditForm({ ...editForm, youtube_live_url: e.target.value })
                  }
                  className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim uppercase mb-1">Lobby Room Code</label>
                  <input
                    type="text"
                    placeholder="e.g. AMT-ROOM-01"
                    value={editForm.lobby_code}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lobby_code: e.target.value })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan font-bold text-cyan"
                  />
                </div>
                <div>
                  <label className="block text-dim uppercase mb-1">Lobby Password</label>
                  <input
                    type="text"
                    placeholder="e.g. PASS99"
                    value={editForm.lobby_password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lobby_password: e.target.value })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan font-bold text-warn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div>
                  <label className="block text-dim uppercase mb-1">
                    {editMatch.team_a?.name || editMatch.team_a_name || 'Team A'} Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.score_a}
                    onChange={(e) =>
                      setEditForm({ ...editForm, score_a: Number(e.target.value) })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block text-dim uppercase mb-1">
                    {editMatch.team_b?.name || editMatch.team_b_name || 'Team B'} Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.score_b}
                    onChange={(e) =>
                      setEditForm({ ...editForm, score_b: Number(e.target.value) })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditMatch(null)}
                  className="border border-white/20 px-3 py-1.5 uppercase text-dim hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="border border-cyan bg-cyan px-4 py-1.5 uppercase text-xs font-bold text-void hover:bg-cyan/90 transition-colors cursor-pointer"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
