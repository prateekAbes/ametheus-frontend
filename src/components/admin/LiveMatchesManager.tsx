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
  type RegisteredRosterTeam,
} from '../../services/matches'
import { type Tournament } from '../../services/tournaments'
import { Panel, Hud, Badge, Brackets } from '../ui'

interface Props {
  tournaments: Tournament[]
  onMatchesUpdated?: () => void
}

const STAGES = [
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
  const [bannerMsg, setBannerMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Tournament Stream & Rosters state
  const [tournRosters, setTournRosters] = useState<RegisteredRosterTeam[]>([])
  const [loadingRosters, setLoadingRosters] = useState(false)
  const [tournStreamUrl, setTournStreamUrl] = useState('')
  const [savingStream, setSavingStream] = useState(false)
  const [closingReg, setClosingReg] = useState(false)
  const [showRostersDrawer, setShowRostersDrawer] = useState(false)

  // Modals
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false)
  const [addMatchData, setAddMatchData] = useState({
    tournament_id: '',
    stage: 'Round 1',
    team_a_mode: 'ROSTER' as 'ROSTER' | 'PLACEHOLDER',
    team_b_mode: 'ROSTER' as 'ROSTER' | 'PLACEHOLDER',
    team_a_id: '',
    team_b_id: '',
    team_a_placeholder: '',
    team_b_placeholder: '',
    series_format: 'BO1',
    scheduled_time: '',
    youtube_live_url: '',
  })
  const [submittingAdd, setSubmittingAdd] = useState(false)

  const [goLiveMatch, setGoLiveMatch] = useState<ApiMatch | null>(null)
  const [goLiveUrl, setGoLiveUrl] = useState('')
  const [submittingLive, setSubmittingLive] = useState(false)

  const [scoreMatch, setScoreMatch] = useState<ApiMatch | null>(null)
  const [scoreForm, setScoreForm] = useState({ score_a: 0, score_b: 0, winner_team_id: '' })
  const [submittingScore, setSubmittingScore] = useState(false)

  const [editMatch, setEditMatch] = useState<ApiMatch | null>(null)
  const [editForm, setEditForm] = useState({
    status: 'SCHEDULED',
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
    setTimeout(() => setBannerMsg(null), 4000)
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
    () => tournaments.find((t) => t.id === selectedTournId),
    [tournaments, selectedTournId]
  )

  // Fetch rosters & initialize stream when tournament is selected
  useEffect(() => {
    if (selectedTournId === 'ALL' || !selectedTournId) {
      setTournRosters([])
      setTournStreamUrl('')
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
  }, [selectedTournId, currentTournament])

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
      showBanner('Tournament registrations locked. Ready for match creation.')
      if (currentTournament) {
        currentTournament.status = 'REGISTRATION_CLOSED'
        currentTournament.registration_status = 'CLOSED'
      }
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
        stage: addMatchData.stage,
        round_name: addMatchData.stage,
        series_format: addMatchData.series_format,
        scheduled_time: addMatchData.scheduled_time || 'TBD',
        youtube_live_url: addMatchData.youtube_live_url || undefined,
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
      showBanner('Match successfully scheduled in tournament bracket!')
      setIsAddMatchOpen(false)
      fetchMatches()
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to create match')
    } finally {
      setSubmittingAdd(false)
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
      showBanner(`Match completed! Final Score: ${scoreForm.score_a} - ${scoreForm.score_b}`)
      setScoreMatch(null)
      fetchMatches()
      onMatchesUpdated?.()
    } catch (err: any) {
      alert(err?.message || 'Failed to record match score')
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
        youtube_live_url: editForm.youtube_live_url.trim() || undefined,
        lobby_code: editForm.lobby_code.trim() || undefined,
        lobby_password: editForm.lobby_password.trim() || undefined,
        server_region: editForm.server_region.trim() || undefined,
        score_a: Number(editForm.score_a),
        score_b: Number(editForm.score_b),
        winner_team_id: editForm.winner_team_id || undefined,
      })
      showBanner('Match credentials, stream & score updated successfully')
      setEditMatch(null)
      fetchMatches()
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
      selectedTournId === 'ALL' || m.tournament_id === selectedTournId
    return statusMatch && tourMatch
  })

  const liveCount = matches.filter((m) => (m.status || '').toUpperCase() === 'LIVE').length
  const scheduledCount = matches.filter(
    (m) => (m.status || '').toUpperCase() === 'SCHEDULED' || (m.status || '').toUpperCase() === 'CHECK_IN_OPEN'
  ).length
  const completedCount = matches.filter((m) => (m.status || '').toUpperCase() === 'COMPLETED').length

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
          <h2 className="font-display text-3xl font-black uppercase text-ink">
            Live Matches &amp; Broadcast Operations
          </h2>
          <p className="text-xs text-dim">
            Authoritative control: real-time match status, server lobby credentials, live YouTube broadcasts, rosters, and scores.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setAddMatchData({
                tournament_id: selectedTournId !== 'ALL' ? selectedTournId : tournaments[0]?.id || '',
                stage: 'Round 1',
                team_a_mode: 'ROSTER',
                team_b_mode: 'ROSTER',
                team_a_id: '',
                team_b_id: '',
                team_a_placeholder: '',
                team_b_placeholder: '',
                series_format: 'BO1',
                scheduled_time: '',
                youtube_live_url: '',
              })
              setIsAddMatchOpen(true)
            }}
            className="border border-cyan bg-cyan px-4 py-2 font-display text-xs font-black uppercase tracking-wider text-void hover:bg-cyan/90 transition-all cursor-pointer shadow-xs"
          >
            + Create Match
          </button>
          <button
            onClick={fetchMatches}
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Panel className="p-3 text-center">
          <Hud className="text-dim">Total Matches</Hud>
          <p className="font-display text-2xl font-black text-ink">{matches.length}</p>
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

      {/* Tournament Selector & Broadcast Controls */}
      <Panel className="p-4 md:p-5 space-y-4 border-white/15 bg-surface/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-ink uppercase tracking-wider">Tournament Scope:</span>
            <select
              value={selectedTournId}
              onChange={(e) => setSelectedTournId(e.target.value)}
              className="border border-white/20 bg-void px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan min-w-[220px]"
            >
              <option value="ALL">All Tournaments (Global View)</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
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
                {showRostersDrawer ? 'Hide Rosters' : `View Rosters (${tournRosters.length})`}
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

        {/* Registered Rosters Inspector Drawer */}
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
                No teams have completed registration for this tournament yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto">
                {tournRosters.map((team) => (
                  <div
                    key={team.team_id}
                    className="border border-white/10 bg-void/80 p-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-black uppercase text-ink">
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-graphite p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-dim uppercase font-bold mr-1">Status:</span>
          {['ALL', 'LIVE', 'CHECK_IN_OPEN', 'SCHEDULED', 'COMPLETED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'border border-cyan bg-cyan text-void font-bold'
                  : 'border border-white/10 bg-surface text-dim hover:text-ink'
              }`}
            >
              {s === 'LIVE' ? '🔴 LIVE' : s}
            </button>
          ))}
        </div>
        <Hud className="text-cyan">{filteredMatches.length} Matches Found</Hud>
      </div>

      {/* Matches List */}
      <div className="space-y-3">
        {filteredMatches.map((m) => {
          const isLive = (m.status || '').toUpperCase() === 'LIVE'
          const isCheckIn = (m.status || '').toUpperCase() === 'CHECK_IN_OPEN'
          const isDone = (m.status || '').toUpperCase() === 'COMPLETED'
          const teamAName = m.team_a?.name || 'TBD (Team A)'
          const teamBName = m.team_b?.name || 'TBD (Team B)'
          const scoreA = m.team_a?.score ?? 0
          const scoreB = m.team_b?.score ?? 0
          const streamUrl = m.youtube_live_url || m.live_link

          return (
            <Panel
              key={m.id}
              className={`p-4 md:p-5 transition-colors ${
                isLive
                  ? 'border-live/60 bg-live/[0.04]'
                  : isCheckIn
                  ? 'border-warn/40 bg-warn/[0.02]'
                  : 'border-white/10 bg-surface/50'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-cyan uppercase font-bold tracking-wider">
                      {m.tournament_title || 'Tournament'} · {m.stage || m.match_type || 'Round'}
                    </span>
                    <span className="text-white/20">|</span>
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

                  {/* Team A vs Team B with scores */}
                  <div className="flex items-center gap-4 py-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-black uppercase text-ink">
                        {teamAName}
                      </span>
                      <span className="font-display text-lg font-black text-cyan px-2 py-0.5 bg-void border border-white/10 tabular-nums">
                        {scoreA}
                      </span>
                    </div>
                    <span className="text-dim font-bold">VS</span>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-black text-cyan px-2 py-0.5 bg-void border border-white/10 tabular-nums">
                        {scoreB}
                      </span>
                      <span className="font-display text-lg font-black uppercase text-ink">
                        {teamBName}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-dim">
                    <span>Format: {m.format || m.series_format || 'BO1'}</span>
                    <span>Region: {m.server_region || 'AWS Mumbai'}</span>
                    {m.scheduled_time && <span>Time: {m.scheduled_time}</span>}
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
                </div>

                {/* Operations & Quick Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {!isLive && !isDone && (
                    <button
                      onClick={() => {
                        setGoLiveMatch(m)
                        setGoLiveUrl(m.youtube_live_url || m.live_link || currentTournament?.live_stream_url || '')
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
                        score_a: m.team_a?.score ?? 0,
                        score_b: m.team_b?.score ?? 0,
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
                        youtube_live_url: m.youtube_live_url || m.live_link || '',
                        lobby_code: m.lobby_code || '',
                        lobby_password: m.lobby_password || '',
                        server_region: m.server_region || 'AWS Mumbai (ap-south-1)',
                        score_a: m.team_a?.score ?? 0,
                        score_b: m.team_b?.score ?? 0,
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
            No matches found for the selected criteria. Use &quot;+ Create Match&quot; above to schedule bracket matchups.
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / CREATE MATCH */}
      {isAddMatchOpen && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-md overflow-y-auto"
        >
          <div className="w-full max-w-lg border border-white/20 bg-graphite p-6 my-8 relative">
            <Brackets color="border-cyan/50" />
            <h3 className="font-display text-2xl font-black uppercase text-ink">
              Create Tournament Match
            </h3>
            <p className="text-xs text-dim mt-1">
              Add a new matchup between registered rosters or bracket progression slots.
            </p>

            <form onSubmit={handleAddMatchSubmit} className="mt-5 space-y-4 font-mono text-xs">
              {/* Tournament selection */}
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
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stage / Round */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim uppercase mb-1">Stage / Round</label>
                  <select
                    value={addMatchData.stage}
                    onChange={(e) =>
                      setAddMatchData({ ...addMatchData, stage: e.target.value })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-cyan"
                  >
                    {STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
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
                        {r.team_name} [{r.team_tag}]
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
                        {r.team_name} [{r.team_tag}]
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

              {/* Scheduled Time & YouTube URL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim uppercase mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    placeholder="e.g. Today, 8:00 PM IST"
                    value={addMatchData.scheduled_time}
                    onChange={(e) =>
                      setAddMatchData({ ...addMatchData, scheduled_time: e.target.value })
                    }
                    className="w-full border border-white/20 bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block text-dim uppercase mb-1">YouTube Live URL</label>
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
                  {submittingAdd ? 'Creating...' : 'Create Match'}
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

      {/* MODAL 3: SCORE & COMPLETE */}
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
              Record official scores and advance the winner in tournament standings.
            </p>

            <form onSubmit={handleScoreSubmit} className="mt-4 space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-white/10 bg-void/50 p-3">
                  <label className="block text-dim uppercase mb-1 truncate">
                    {scoreMatch.team_a?.name || 'Team A'} Score
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
                    {scoreMatch.team_b?.name || 'Team B'} Score
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
                  {scoreMatch.team_a?.id && (
                    <option value={scoreMatch.team_a.id}>
                      {scoreMatch.team_a.name || 'Team A'}
                    </option>
                  )}
                  {scoreMatch.team_b?.id && (
                    <option value={scoreMatch.team_b.id}>
                      {scoreMatch.team_b.name || 'Team B'}
                    </option>
                  )}
                </select>
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
          <div className="w-full max-w-lg border border-white/20 bg-graphite p-6 my-8 relative">
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
                  <label className="block text-dim uppercase mb-1">Server Region</label>
                  <input
                    type="text"
                    value={editForm.server_region}
                    onChange={(e) =>
                      setEditForm({ ...editForm, server_region: e.target.value })
                    }
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
                    {editMatch.team_a?.name || 'Team A'} Score
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
                    {editMatch.team_b?.name || 'Team B'} Score
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
