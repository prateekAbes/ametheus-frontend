import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Container, Hud, Badge, Dot, Cta, SectionHead, Modal, Panel } from '../components/ui'
import { useAuthContext } from '../context/AuthContext'
import {
  getMyOrganizedTournaments,
  createTournamentOrganizer,
  updateTournamentOrganizer,
  publishTournamentOrganizer,
  closeRegistrationOrganizer,
  generateBracketOrganizer,
  cancelTournamentOrganizer,
} from '../services/organizer'
import { getGames, Game } from '../services/games'
import {
  Tournament,
  normalizeTournament,
  getTournamentRegistrations,
} from '../services/tournaments'
import { getMatches, submitMatchResult, ApiMatch } from '../services/matches'
import { inr } from '../lib/data'

export default function Organizer() {
  const { profile, isOrganizer, isLoading: authLoading } = useAuthContext()

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [matches, setMatches] = useState<ApiMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  // Creation Wizard State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    game_id: '',
    is_solo: false,
    min_team_size: 5,
    max_team_size: 5,
    format: 'Single Elimination Bracket',
    tournament_type: 'Single Elimination',
    match_format: 'Best of 1',
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

  const loadData = async () => {
    setLoading(true)
    try {
      const [tList, gList, mList] = await Promise.all([
        getMyOrganizedTournaments().catch(() => []),
        getGames(true).catch(() => []),
        getMatches().catch(() => []),
      ])
      setTournaments(tList)
      setGames(gList)
      setMatches(mList)

      if (gList.length > 0 && !formData.game_id) {
        setFormData((prev) => ({
          ...prev,
          game_id: gList[0].slug || gList[0].id,
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
      format: isSolo ? '1v1 Solo Championship' : 'Single Elimination Bracket',
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
        tournament_type: formData.tournament_type,
        match_format: formData.match_format,
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
      setActionMsg('Single Elimination bracket generated! Tournament matches are LIVE.')
      setTimeout(() => setActionMsg(null), 4000)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to generate bracket')
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

          <div className="flex gap-3">
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

                    {(t.status === 'REGISTRATION_CLOSED' || t.status === 'REGISTRATION_OPEN') && (
                      <button
                        onClick={() => handleGenBracket(t.id)}
                        className="border border-cyan/50 bg-cyan/10 px-3 py-2 font-mono text-xs uppercase text-cyan hover:bg-cyan/20 transition-colors"
                      >
                        Generate Bracket
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>

      {/* Creation Modal */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl border border-white/20 bg-graphite p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto"
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
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="mt-1 w-full border border-white/15 bg-surface px-3 py-2 text-ink outline-none focus:border-cyan text-sm"
                  >
                    <option value="Single Elimination Bracket">Single Elimination Bracket</option>
                    <option value="Double Elimination Bracket">Double Elimination Bracket</option>
                    <option value="Battle Royale Points">Battle Royale Points</option>
                    <option value="Round Robin Groups">Round Robin Groups</option>
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
                    <option value="Best of 5">Best of 5 (BO5 Finals)</option>
                  </select>
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
      )}

      {/* Rosters Modal */}
      {viewingRostersTour && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm"
          onClick={() => setViewingRostersTour(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl border border-white/20 bg-graphite p-6 md:p-8 max-h-[85vh] overflow-y-auto"
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
      )}

      {/* Arbitration Score Modal */}
      {selectedMatch && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm"
          onClick={() => setSelectedMatch(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md border border-white/20 bg-graphite p-6 md:p-8"
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
      )}
    </div>
  )
}
