import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { Container, Hud, Badge, Crest, Panel, Brackets, SectionHead } from '../components/ui'
import { gameBy } from '../lib/data'
import DynamicImage from '../components/DynamicImage'
import { resolveMediaUrl } from '../services/apiClient'
import {
  getMatchById,
  getMatches,
  updateMatchStatus,
  type ApiMatch,
} from '../services/matches'
import { useAuthContext } from '../context/AuthContext'
import { BattleRoyaleResultsModal } from '../components/admin/BattleRoyaleResultsModal'

function normalizeStreamUrl(url?: string): string {
  if (!url) return ''
  const t = url.trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

function getYoutubeEmbedUrl(url?: string): string | null {
  if (!url) return null
  try {
    const trimmed = url.trim()
    if (trimmed.includes('/embed/')) return trimmed
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1`
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1`
    const liveMatch = trimmed.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/)
    if (liveMatch) return `https://www.youtube.com/embed/${liveMatch[1]}?autoplay=1`
    if (trimmed.includes('youtube.com')) {
      return trimmed.replace('watch?v=', 'embed/')
    }
    return null
  } catch {
    return null
  }
}

function Countdown({ targetIso }: { targetIso?: string }) {
  const [s, setS] = useState(2 * 86400 + 5 * 3600 + 42 * 60 + 17)

  useEffect(() => {
    if (targetIso) {
      const target = new Date(targetIso).getTime()
      const update = () => {
        const diff = Math.max(0, Math.floor((target - Date.now()) / 1000))
        setS(diff)
      }
      update()
      const i = setInterval(update, 1000)
      return () => clearInterval(i)
    } else {
      const i = setInterval(() => setS((x) => Math.max(0, x - 1)), 1000)
      return () => clearInterval(i)
    }
  }, [targetIso])

  const parts = [
    [Math.floor(s / 86400), 'Days'],
    [Math.floor((s % 86400) / 3600), 'Hrs'],
    [Math.floor((s % 3600) / 60), 'Min'],
    [s % 60, 'Sec'],
  ] as const

  return (
    <div className="flex justify-center gap-3 md:gap-6">
      {parts.map(([v, l]) => (
        <div key={l} className="w-20 border border-white/10 bg-void/60 py-4 text-center md:w-32">
          <p className="font-display text-5xl font-black tabular-nums md:text-7xl text-ink">
            {String(v).padStart(2, '0')}
          </p>
          <Hud>{l}</Hud>
        </div>
      ))}
    </div>
  )
}

function formatDisplayName(rawFormat?: string): string {
  if (!rawFormat) return 'Knockout'
  const lower = rawFormat.toLowerCase()
  if (lower.includes('battle royale')) return 'Battle Royale'
  if (lower.includes('round robin')) return 'Round Robin'
  return 'Knockout'
}

function seriesDisplayName(rawSeries?: string): string {
  if (!rawSeries) return 'Best of 1 (BO1)'
  const upper = rawSeries.toUpperCase()
  if (upper.includes('BO3') || upper.includes('BEST OF 3')) return 'Best of 3 (BO3)'
  return 'Best of 1 (BO1)'
}

export default function MatchDetail() {
  const { id = '' } = useParams()
  const { profile } = useAuthContext()

  const [loading, setLoading] = useState(true)
  const [match, setMatch] = useState<ApiMatch | null>(null)
  const [tournamentMatches, setTournamentMatches] = useState<ApiMatch[]>([])
  const [selectedRound, setSelectedRound] = useState<string>('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [brModalOpen, setBrModalOpen] = useState(false)

  const handleCopy = (value?: string, fieldName?: string) => {
    if (!value || !fieldName) return
    navigator.clipboard?.writeText(value)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const loadData = useCallback(() => {
    setLoading(true)
    getMatchById(id)
      .then((data: any) => {
        if (data && (data.id || data._id)) {
          setMatch(data)
          const currentRound = data.round_name || data.stage || `Round ${data.round_number || 1}`
          setSelectedRound((prev) => prev || currentRound)

          // Fetch tournament matches for round navigation
          const tid = data.tournament_id || data.tournament?.id
          if (tid) {
            getMatches({ tournament_id: tid })
              .then((tMatches) => {
                if (Array.isArray(tMatches)) {
                  setTournamentMatches(tMatches)
                }
              })
              .catch((err) => console.warn('Could not fetch tournament round matches:', err))
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load match detail:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    loadData()

    // 10-second polling and window focus refresh for live match updates and credentials
    const interval = setInterval(() => {
      loadData()
    }, 10000)

    const handleFocus = () => {
      loadData()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [loadData])

  // Normalizations — CHECK_IN_OPEN is treated the same as SCHEDULED (check-in system removed)
  const rawStatus = (match?.status || 'SCHEDULED').toUpperCase()
  const isLive = rawStatus === 'LIVE' || rawStatus === 'IN_PROGRESS'
  const isDone = rawStatus === 'COMPLETED' || rawStatus === 'FINALIZED'
  const isEnded = rawStatus === 'ENDED'
  const isResultsSaved = rawStatus === 'RESULTS_SAVED' || rawStatus === 'RESULTS_PENDING'
  // CHECK_IN_OPEN is a legacy status — treat it the same as SCHEDULED
  const isScheduled = !isLive && !isDone && !isEnded && !isResultsSaved

  const t = match?.tournament || {}
  const g = gameBy(t.game_slug || match?.game_slug || 'valorant')
  const streamUrl = match?.youtube_live_url || match?.live_link || t.live_stream_url

  const teamA = match?.team_a_details || {
    id: match?.team_a_id,
    name: match?.team_a_name || match?.team_a_placeholder || '',
    tag: 'TEAM',
    captain: { name: 'Captain', handle: match?.team_a_name || 'Captain' },
    members: [],
  }

  const teamB = match?.team_b_details || {
    id: match?.team_b_id,
    name: match?.team_b_name || match?.team_b_placeholder || '',
    tag: 'TEAM',
    captain: { name: 'Captain', handle: match?.team_b_name || 'Captain' },
    members: [],
  }

  const multiTeams: any[] = match?.teams_details || match?.teams || []
  const isBattleRoyale =
    (t.format || '').toLowerCase().includes('battle royale') ||
    (match?.series_format || '').toLowerCase().includes('battle royale') ||
    (match?.format || '').toLowerCase().includes('battle royale') ||
    (match?.stage || '').toLowerCase().includes('battle royale') ||
    (match?.match_type || '').toLowerCase().includes('battle_royale') ||
    multiTeams.length > 2

  const isSolo = Boolean(
    (match as any)?.is_solo ||
    (t as any)?.is_solo ||
    (match as any)?.isSolo ||
    (t as any)?.isSolo ||
    (match as any)?.registration_type === 'SOLO' ||
    (t as any)?.registration_type === 'SOLO' ||
    ((t as any)?.min_team_size === 1 && (t as any)?.max_team_size === 1) ||
    ((t as any)?.minTeamSize === 1 && (t as any)?.maxTeamSize === 1) ||
    (match?.game_slug && match.game_slug.toLowerCase().includes('solo')) ||
    (t?.format && t.format.toLowerCase().includes('solo')) ||
    (match?.format && match.format.toLowerCase().includes('solo'))
  )

  const hasParticipants = Boolean(
    (teamA.name && !teamA.name.includes('(Team A)')) ||
    (teamB.name && !teamB.name.includes('(Team B)')) ||
    multiTeams.length > 0
  )

  const winnerId = match?.winner_team_id
  const winnerName = isDone && match
    ? (winnerId === match.team_a_id ? teamA.name : winnerId === match.team_b_id ? teamB.name : null) ||
      (match.score_a !== undefined && match.score_b !== undefined && match.score_a > match.score_b ? teamA.name : teamB.name)
    : null

  // Credentials
  const roomId = (match as any)?.custom_room_id || match?.room_id
  const roomPassword = (match as any)?.custom_room_password || match?.room_password
  const instructions = match?.custom_instructions || (match as any)?.instructions
  const credentialsReleased = Boolean(match?.credentials_released || (match as any)?.is_creds_released || isLive || Boolean(roomId && isLive))

  // Distinct tournament rounds for interactive segmented navigation
  const progressionRounds = match?.tournament_progression || []
  const roundsList: string[] = []
  progressionRounds.forEach((r: any) => {
    if (r.round_name && !roundsList.includes(r.round_name)) {
      roundsList.push(r.round_name)
    }
  })
  tournamentMatches.forEach((tm) => {
    const rName = tm.round_name || tm.stage || `Round ${tm.round_number || 1}`
    if (rName && !roundsList.includes(rName)) {
      roundsList.push(rName)
    }
  })
  if (roundsList.length === 0 && match) {
    roundsList.push(match.round_name || match.stage || `Round ${match.round_number || 1}`)
  }

  const activeRound = selectedRound || roundsList[0]
  const roundMatches = tournamentMatches.filter((tm) => {
    const rName = tm.round_name || tm.stage || `Round ${tm.round_number || 1}`
    return rName === activeRound
  })

  // Admin status update handler
  const isAdmin = Boolean(profile?.role && ['SUPER_ADMIN', 'ADMIN', 'ORGANIZER'].includes(profile.role.toUpperCase()))
  const handleStatusChange = async (newStatus: string) => {
    if (!newStatus || newStatus === rawStatus) return
    setUpdatingStatus(true)
    try {
      await updateMatchStatus(id, newStatus)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update match status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-void pt-32 pb-24 text-center font-mono text-dim">
        <Container>
          <div className="inline-block size-8 animate-spin border-2 border-cyan border-t-transparent mb-4" />
          <p className="uppercase tracking-widest text-xs">Loading Match Cockpit...</p>
        </Container>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-void pt-32 pb-24 text-center font-mono">
        <Container>
          <h2 className="font-display text-4xl font-black uppercase text-warn">Match Not Found</h2>
          <p className="mt-3 text-xs text-dim">The specified match record does not exist or has been archived.</p>
          <div className="mt-8">
            <Link to="/matches" className="border border-white/20 bg-surface px-6 py-2.5 uppercase text-xs font-bold text-ink hover:border-cyan hover:text-cyan">
              ← Back to Live Matches
            </Link>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void pt-28 pb-24">
      {/* PROCEDURAL VISUAL BACKDROP */}
      <DynamicImage
        src={resolveMediaUrl(t.banner_url || (t as any).bannerUrl)}
        alt=""
        eager
        className="fixed inset-0 h-full w-full object-cover opacity-15 filter blur-xs pointer-events-none"
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 10%, ${g.accent}33, transparent 65%), linear-gradient(to bottom, #05060acc, #05060a)`,
        }}
      />
      <div className="grid-floor fixed -inset-x-1/2 bottom-0 h-1/2 opacity-30 pointer-events-none" />

      <Container className="relative space-y-10">
        {/* ========================================================================= */}
        {/* 1. MATCH HEADING (Breadcrumb: Tournament / Round / Match #) */}
        {/* 2. STATUS (Single elegant status badge) */}
        {/* 3. FORMAT (Knockout / Round Robin / Battle Royale · BO1 / BO3) */}
        {/* ========================================================================= */}
        <header className="border border-white/10 bg-graphite/70 p-6 md:p-8 backdrop-blur-md">
          {/* Breadcrumb Heading */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider">
              <Link
                to={`/tournaments/${t.id || match.tournament_id}`}
                className="font-bold text-ink hover:text-cyan transition-colors"
              >
                {t.title || t.name || 'Tournament Championship'}
              </Link>
              <span className="text-dim">/</span>
              <span className="text-cyan font-bold">
                {match.round_name || match.stage || `Round ${match.round_number || 1}`}
              </span>
              <span className="text-dim">/</span>
              <span className="text-dim font-bold">
                Match {String(match.match_number || 1).padStart(2, '0')}
              </span>
            </div>

            {/* Single Elegant Status Badge & Admin Control */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                s={
                  isLive ? 'live' :
                  isDone ? 'completed' :
                  isEnded ? 'ended' :
                  isResultsSaved ? 'results_saved' :
                  'upcoming'
                }
                label={
                  isLive ? 'Live on Air' :
                  isDone ? 'Final' :
                  isEnded ? 'Match Ended' :
                  isResultsSaved ? 'Results Saved' :
                  rawStatus === 'CANCELLED' ? 'Cancelled' :
                  'Scheduled'
                }
              />
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <select
                    value={rawStatus}
                    disabled={updatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="border border-cyan/40 bg-surface px-2.5 py-1 font-mono text-xs font-bold text-cyan uppercase cursor-pointer hover:border-cyan focus:outline-none"
                    title="Arbiter Status Override"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="LIVE">LIVE ON AIR</option>
                    <option value="ENDED">MATCH ENDED</option>
                    <option value="RESULTS_SAVED">RESULTS SAVED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="FINALIZED">FINALIZED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>

                  {/* Go Live button if Scheduled */}
                  {isScheduled && (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange('LIVE')}
                      className="border border-live/60 bg-live/20 px-3 py-1 font-mono text-xs font-bold text-live hover:bg-live/30 transition-colors uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Start match and go live"
                    >
                      <span className="size-2 rounded-full bg-live animate-ping" />
                      <span>Go Live</span>
                    </button>
                  )}

                  {/* End Match button if Live */}
                  {isLive && (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange('ENDED')}
                      className="border border-live/60 bg-live/20 px-3 py-1 font-mono text-xs font-bold text-live hover:bg-live/30 transition-colors uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Conclude gameplay and transition to Ended"
                    >
                      <span>⏹</span>
                      <span>End Match</span>
                    </button>
                  )}

                  {/* Result & Qualifier entry button (strictly gated: never visible on Scheduled or Live) */}
                  {isBattleRoyale && (isEnded || isResultsSaved || isDone) && (
                    <button
                      type="button"
                      onClick={() => setBrModalOpen(true)}
                      className="border border-amber-400/60 bg-amber-400/15 px-3 py-1 font-mono text-xs font-bold text-amber-300 hover:bg-amber-400/25 transition-colors uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🏆</span>
                      <span>{isDone ? 'View Qualifiers' : isResultsSaved ? 'Review Results' : 'Enter Results'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Format & Schedule Strip */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            <div className="border border-white/10 bg-surface/60 p-3">
              <Hud>COMPETITION FORMAT</Hud>
              <p className="mt-1 font-display text-base font-black text-cyan uppercase truncate">
                {formatDisplayName(t.format || match.format)}
              </p>
            </div>
            <div className="border border-white/10 bg-surface/60 p-3">
              <Hud>SERIES FORMAT</Hud>
              <p className="mt-1 font-display text-base font-black text-ink uppercase truncate">
                {isBattleRoyale ? 'Single Match Lobby' : seriesDisplayName(match.series_format || t.match_format)}
              </p>
            </div>
            <div className="border border-white/10 bg-surface/60 p-3">
              <Hud>SCHEDULED DATE</Hud>
              <p className="mt-1 font-display text-base font-black text-ink uppercase truncate">
                {match.scheduled_date || (match.scheduled_at ? new Date(match.scheduled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending Arbiter')}
              </p>
            </div>
            <div className="border border-white/10 bg-surface/60 p-3">
              <Hud>SCHEDULED TIME</Hud>
              <p className="mt-1 font-display text-base font-black text-ink uppercase truncate">
                {match.scheduled_time || (match.scheduled_at ? new Date(match.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Pending Arbiter')}
              </p>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 4. BROADCAST STREAM / COUNTDOWN TIMER */}
        {/* ========================================================================= */}
        <section aria-label="Broadcast or Countdown">
          {isLive ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="group relative aspect-video overflow-hidden border border-live/60 bg-black shadow-[0_0_35px_rgba(239,68,68,0.25)]">
                {getYoutubeEmbedUrl(streamUrl) ? (
                  <iframe
                    src={getYoutubeEmbedUrl(streamUrl)!}
                    title="Official Broadcast Stream"
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="relative h-full w-full flex flex-col items-center justify-center bg-black/95 p-8 text-center font-mono">
                    <div className="size-16 rounded-full bg-live/20 border border-live/50 flex items-center justify-center text-live text-2xl animate-pulse mb-4">
                      🔴
                    </div>
                    <h3 className="font-display text-2xl font-black uppercase text-ink">Official Broadcast Live</h3>
                    <p className="mt-2 text-xs text-dim max-w-md">
                      Stream link is configured for external broadcast portal.
                    </p>
                    {streamUrl && (
                      <a
                        href={normalizeStreamUrl(streamUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 border border-live bg-live/20 px-6 py-2.5 uppercase font-bold text-xs text-live hover:bg-live hover:text-white transition-all"
                      >
                        📺 Watch on Streaming Portal →
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Broadcast Telemetry Sidebar */}
              <Panel className="p-5 font-mono text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <Hud className="text-live">Broadcast Telemetry</Hud>
                    <span className="size-2 rounded-full bg-live animate-ping" />
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="border-b border-white/5 pb-2">
                      <span className="text-dim">Status:</span>
                      <p className="font-bold text-live mt-0.5">LIVE ON AIR</p>
                    </div>
                    {!isBattleRoyale && (
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-dim">Current Score:</span>
                        <p className="font-display text-2xl font-black text-ink mt-0.5 tabular-nums">
                          {match.score_a ?? 0} : {match.score_b ?? 0}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-dim">Format:</span>
                      <p className="text-cyan font-bold mt-0.5">{formatDisplayName(match.format)} · {match.series_format || 'BO1'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-white/10 pt-4">
                  <span className="text-[10px] text-dim uppercase block">Arbiter Dispatch:</span>
                  <p className="text-ink text-[11px] font-bold mt-1">Official Sanctioned Lobby</p>
                </div>
              </Panel>
            </div>
          ) : isDone ? (
            <Panel className="overflow-hidden p-8 text-center md:p-12 border-ok/40 bg-ok/5">
              <Brackets color="border-ok/40" />
              <Hud className="text-ok">Official Match Result Verified</Hud>
              <div className="mt-4">
                <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase text-ink">
                  {winnerName || 'Winner Certified'}
                </h2>
                {!isBattleRoyale && (
                  <p className="mt-2 font-display text-2xl font-black text-dim tabular-nums">
                    Final Score: {match.score_a ?? 0} — {match.score_b ?? 0}
                  </p>
                )}
              </div>
              {match.captain_notes && (
                <p className="mt-4 font-mono text-xs text-dim italic">
                  Arbiter Notes: &quot;{match.captain_notes}&quot;
                </p>
              )}
            </Panel>
          ) : isResultsSaved ? (
            <Panel className="overflow-hidden p-8 text-center md:p-12 border-cyan/40 bg-cyan/5">
              <Brackets color="border-cyan/40" />
              <Hud className="text-cyan">Draft Results Saved</Hud>
              <div className="mt-4">
                <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-ink">
                  Results Under Arbiter Review
                </h2>
                <p className="mt-2 font-mono text-xs text-dim max-w-xl mx-auto">
                  Preliminary statistics and placements have been saved. Awaiting final confirmation and certified rating submission.
                </p>
              </div>
            </Panel>
          ) : isEnded ? (
            <Panel className="overflow-hidden p-8 text-center md:p-12 border-amber-500/40 bg-amber-500/5">
              <Brackets color="border-amber-500/40" />
              <Hud className="text-amber-400">Gameplay Concluded</Hud>
              <div className="mt-4">
                <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-ink">
                  Match Ended
                </h2>
                <p className="mt-2 font-mono text-xs text-dim max-w-xl mx-auto">
                  Match gameplay has completed. Awaiting arbiter results entry and qualifier selection.
                </p>
              </div>
            </Panel>
          ) : (
            <Panel className="p-8 text-center md:p-12 border-white/10 bg-graphite/50 backdrop-blur-md">
              <Brackets color="border-cyan/50" />
              <Hud className="text-cyan">Scheduled Match Countdown</Hud>
              <div className="mt-6">
                <Countdown targetIso={match.scheduled_at} />
              </div>
            </Panel>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 4B. OFFICIAL ROOM CREDENTIALS CARD */}
        {/* ========================================================================= */}
        <section aria-label="Official Room Credentials" className="my-6">
          {credentialsReleased && roomId ? (
            <Panel className="p-6 md:p-8 border-cyan/40 bg-surface/90 relative overflow-hidden">
              <Brackets color="border-cyan/50" />
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="size-2 rounded-full bg-cyan animate-pulse" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan">
                    Official Room Credentials
                  </span>
                </div>
                <span className="border border-ok/40 bg-ok/10 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase text-ok tracking-wider">
                  ● Released &amp; Active
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Room ID Card */}
                <div className="border border-cyan/40 bg-void/60 p-5 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-dim block">
                      Room ID
                    </span>
                    <div className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold tracking-wide text-cyan select-all break-all">
                      {roomId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(roomId, 'room_id')}
                    className="mt-4 inline-flex items-center justify-center gap-1.5 border border-cyan/40 bg-cyan/10 px-3.5 py-1.5 font-mono text-xs font-bold uppercase text-cyan hover:bg-cyan hover:text-void transition-all cursor-pointer active:scale-95"
                  >
                    <span>{copiedField === 'room_id' ? '✓ Copied' : '📋 Copy Room ID'}</span>
                  </button>
                </div>

                {/* Room Password Card */}
                <div className="border border-amber-500/40 bg-void/60 p-5 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-dim block">
                      Room Password
                    </span>
                    <div className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold tracking-wide text-amber-400 select-all break-all">
                      {roomPassword || 'None'}
                    </div>
                  </div>
                  {roomPassword && roomPassword !== 'None' ? (
                    <button
                      type="button"
                      onClick={() => handleCopy(roomPassword, 'room_password')}
                      className="mt-4 inline-flex items-center justify-center gap-1.5 border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 font-mono text-xs font-bold uppercase text-amber-400 hover:bg-amber-400 hover:text-void transition-all cursor-pointer active:scale-95"
                    >
                      <span>{copiedField === 'room_password' ? '✓ Copied' : '📋 Copy Password'}</span>
                    </button>
                  ) : (
                    <span className="mt-4 font-mono text-[11px] text-dim block text-center">
                      No Password Required
                    </span>
                  )}
                </div>

                {/* Server Region Card */}
                <div className="border border-white/10 bg-void/60 p-5 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-dim block">
                      Server Region
                    </span>
                    <div className="mt-2 font-display text-lg sm:text-xl font-bold uppercase text-ink break-words">
                      {match?.server_region || (t as any)?.serverRegion || 'AWS Mumbai (ap-south-1)'}
                    </div>
                  </div>
                  <span className="mt-4 font-mono text-[11px] text-dim block">
                    Authoritative Game Server
                  </span>
                </div>

                {/* Status Notice Card */}
                <div className="border border-white/10 bg-void/60 p-5 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-dim block">
                      Access Status
                    </span>
                    <div className="mt-2 font-display text-lg sm:text-xl font-bold uppercase text-ok">
                      Verified Contender
                    </div>
                  </div>
                  <span className="mt-4 font-mono text-[11px] text-ok/80 block">
                    Launch Game &amp; Join Room
                  </span>
                </div>
              </div>

              {/* Host Instructions */}
              {instructions && (
                <div className="mt-4 border-t border-white/10 pt-4 font-mono text-xs">
                  <span className="font-bold text-cyan uppercase tracking-wider block mb-1">
                    Arbiter Instructions:
                  </span>
                  <p className="text-ink text-sm leading-relaxed">
                    {instructions}
                  </p>
                </div>
              )}
            </Panel>
          ) : (
            <Panel className="p-6 border-dashed border-white/20 bg-void/60">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-dim">
                  <span className="size-2 rounded-full bg-dim" />
                  <span>Official Room Credentials</span>
                </div>
                <span className="border border-white/15 bg-white/5 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase text-dim tracking-wider">
                  {isDone ? 'Match Concluded' : 'Awaiting Arbiter Release'}
                </span>
              </div>
              <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-display text-lg font-bold uppercase text-ink">
                    {isDone ? 'Room Credentials Expired' : 'Credentials Release Pending'}
                  </p>
                  <p className="mt-1 text-xs font-mono text-dim leading-relaxed">
                    {isDone
                      ? 'This match has been completed. Room credentials are no longer active.'
                      : 'Room ID and Room Password will be displayed here as soon as the arbiter releases them or the match goes LIVE.'}
                  </p>
                </div>
                <div className="shrink-0 border border-white/10 bg-surface/60 px-3 py-1.5 font-mono text-xs text-dim">
                  <span>⏱ {isDone ? 'Archived' : 'Auto-refreshes when live'}</span>
                </div>
              </div>
            </Panel>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 5. ACTUAL PARTICIPANTS (Format-aware: Solo BR vs Team BR vs H2H) */}
        {/* ========================================================================= */}
        <section aria-label="Actual Participants">
          <SectionHead
            kicker={isBattleRoyale ? (isSolo ? 'Solo Contenders' : 'Lobby Roster') : 'Contending Teams'}
            title={
              isBattleRoyale
                ? (isSolo ? `${multiTeams.length} Solo Contenders` : `${multiTeams.length} Competing Squads`)
                : 'Match Participants'
            }
            size="md"
            className="mb-6"
          />

          {isBattleRoyale ? (
            /* BATTLE ROYALE MULTI-PARTICIPANT PRESENTATION */
            <div>
              {/* Placements Standings if match completed */}
              {match.placements && match.placements.length > 0 ? (
                <div className="border border-white/10 bg-surface/50 overflow-hidden">
                  <div className="bg-void/90 px-4 py-3 text-left font-mono text-xs font-bold text-cyan uppercase border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span>Official Lobby Standings &amp; Points</span>
                      {match.qualifier_team_ids && match.qualifier_team_ids.length > 0 && (
                        <span className="px-2 py-0.5 text-[10px] bg-ok/20 border border-ok/50 text-ok uppercase font-bold">
                          {match.qualifier_team_ids.length} Advanced to Next Round
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-dim text-[11px] font-normal">{match.placements.length} Entrants Ranked</span>
                      {match.next_match_id && (
                        <Link
                          to={`/matches/${match.next_match_id}`}
                          className="px-2.5 py-1 border border-cyan bg-cyan/15 hover:bg-cyan hover:text-void text-cyan text-[11px] font-bold uppercase transition-colors"
                        >
                          Next Round Lobby →
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-white/5 font-mono text-xs">
                    {match.placements.map((pl: any, idx: number) => {
                      const isQual = Boolean(
                        pl.qualified ||
                        (match.qualifier_team_ids && match.qualifier_team_ids.includes(pl.team_id))
                      )
                      return (
                        <div key={pl.team_id || idx} className="grid grid-cols-[50px_1fr_auto_80px_80px_90px] items-center p-3 text-left hover:bg-white/[0.02] gap-2">
                          <span className={`font-bold ${idx === 0 ? 'text-amber-400 font-display text-base' : 'text-dim'}`}>
                            #{pl.placement || idx + 1}
                          </span>
                          <span className="font-bold text-ink uppercase truncate">
                            {pl.team_name || pl.player_name || `Contender ${idx + 1}`}
                          </span>
                          <div>
                            {isQual && (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase border border-ok/40 bg-ok/10 text-ok inline-flex items-center gap-1">
                                <span>✓</span>
                                <span>Qualified</span>
                              </span>
                            )}
                          </div>
                          <span className="text-dim">Kills: <strong className="text-ink">{pl.kills ?? 0}</strong></span>
                          <span className="text-dim">Place Pts: <strong className="text-ink">{pl.placement_points ?? 0}</strong></span>
                          <span className="text-right text-cyan font-bold tabular-nums">{pl.total_points ?? 0} PTS</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : multiTeams.length > 0 ? (
                /* Active Contenders Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {multiTeams.map((sq: any, i: number) => {
                    const name = sq.name || sq.team_name || sq.player_name || sq.username || `Contender ${i + 1}`
                    const handle = sq.captain?.handle || sq.captain?.name || sq.handle || sq.username || 'contender'
                    const tag = sq.tag || (isSolo ? 'SOLO' : 'SQ')
                    return (
                      <Panel key={sq.id || sq.team_id || i} className="p-3 text-center border-white/10 bg-surface/70 hover:border-cyan/50 transition-colors">
                        <p className="font-display text-sm font-black uppercase truncate text-ink">{name}</p>
                        <p className="font-mono text-[10px] text-cyan uppercase font-bold mt-0.5">[{tag}]</p>
                        <p className="font-mono text-[10px] text-dim truncate mt-1">@{handle}</p>
                      </Panel>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-white/15 bg-void/40 text-center">
                  <p className="font-display text-xl font-bold uppercase text-dim">Participants TBD</p>
                  <p className="font-mono text-xs text-dim/70 mt-1">
                    Contender assignments for this Battle Royale lobby are being compiled by the tournament arbiter.
                  </p>
                </div>
              )}
            </div>
          ) : !hasParticipants ? (
            /* Genuine Head-to-Head with Participants TBD */
            <div className="p-8 border border-dashed border-white/15 bg-void/40 text-center">
              <p className="font-display text-2xl font-bold uppercase text-dim">Participants TBD</p>
              <p className="mt-2 font-mono text-xs text-dim max-w-md mx-auto">
                Competing rosters for this fixture will be populated upon completion of preceding bracket matches.
              </p>
            </div>
          ) : (
            /* Genuine Head-to-Head Match with Known Participants */
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-12 border border-white/10 bg-graphite/40 p-6 md:p-8 backdrop-blur-md">
              {/* Team A */}
              <div
                className={`flex flex-col items-center gap-4 text-center md:flex-row-reverse md:text-right ${
                  winnerName && winnerName !== teamA.name ? 'opacity-40' : ''
                }`}
              >
                {teamA.logo_url ? (
                  <DynamicImage src={resolveMediaUrl(teamA.logo_url)} alt="" className="size-20 rounded-full border border-white/20 object-cover" />
                ) : (
                  <Crest name={teamA.name || 'Team A'} size={80} color={g.accent} />
                )}
                <div>
                  <h3 className="font-display text-[clamp(1.5rem,3.5vw,3rem)] font-black uppercase leading-[0.9] text-ink break-words">
                    {teamA.name || 'TBD'}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-dim uppercase">
                    TAG: [{teamA.tag || 'TEAM'}] • CAPTAIN: @{teamA.captain?.handle || teamA.captain?.name || 'TBD'}
                  </p>
                </div>
              </div>

              {/* Score / VS Center */}
              <div className="text-center px-4">
                {match.score_a !== undefined && match.score_b !== undefined ? (
                  <p className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-black leading-none tabular-nums text-ink">
                    {match.score_a}
                    <span className={isLive ? 'text-live animate-pulse' : 'text-dim'}>:</span>
                    {match.score_b}
                  </p>
                ) : (
                  <p className="font-display text-[clamp(2.5rem,6vw,5rem)] font-black leading-none text-dim/50">
                    VS
                  </p>
                )}
              </div>

              {/* Team B */}
              <div
                className={`flex flex-col items-center gap-4 text-center md:flex-row md:text-left ${
                  winnerName && winnerName !== teamB.name ? 'opacity-40' : ''
                }`}
              >
                {teamB.logo_url ? (
                  <DynamicImage src={resolveMediaUrl(teamB.logo_url)} alt="" className="size-20 rounded-full border border-white/20 object-cover" />
                ) : (
                  <Crest name={teamB.name || 'Team B'} size={80} color={g.accent} />
                )}
                <div>
                  <h3 className="font-display text-[clamp(1.5rem,3.5vw,3rem)] font-black uppercase leading-[0.9] text-ink break-words">
                    {teamB.name || 'TBD'}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-dim uppercase">
                    TAG: [{teamB.tag || 'TEAM'}] • CAPTAIN: @{teamB.captain?.handle || teamB.captain?.name || 'TBD'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 6. TEAM ROSTER COUNT / ROSTER LIST */}
        {/* ========================================================================= */}
        <section aria-label="Team Rosters">
          <SectionHead
            kicker="Authoritative Lineups"
            title={isSolo ? 'Contender Roster' : isBattleRoyale ? 'Squad Rosters' : 'Team Rosters'}
            size="md"
            className="mb-6"
          />

          {isBattleRoyale ? (
            isSolo ? (
              /* Solo BR Contender Roster */
              <Panel className="p-6 border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <h3 className="font-display text-xl font-black uppercase text-ink">Registered Solo Contenders</h3>
                  <span className="font-mono text-xs text-cyan font-bold">{multiTeams.length} Players Registered</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {multiTeams.map((mem: any, i: number) => {
                    const name = mem.name || mem.player_name || mem.username || `Player ${i + 1}`
                    const handle = mem.handle || mem.username || name
                    return (
                      <div key={mem.id || i} className="flex items-center justify-between border border-white/5 bg-surface/50 p-3 font-mono text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="size-2 rounded-full bg-cyan/70 shrink-0" />
                          <span className="font-bold text-ink truncate">{name}</span>
                        </div>
                        <span className="text-dim text-[11px] truncate shrink-0 ml-2">@{handle}</span>
                      </div>
                    )
                  })}
                </div>
              </Panel>
            ) : (
              /* Team BR Squad Rosters */
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {multiTeams.map((sq: any, i: number) => {
                  const name = sq.name || sq.team_name || `Squad ${i + 1}`
                  const tag = sq.tag || 'SQ'
                  const members = sq.members || (sq.captain ? [sq.captain] : [])
                  return (
                    <Panel key={sq.id || sq.team_id || i} className="p-5 border-white/10 bg-surface/60">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                        <div>
                          <h4 className="font-display text-lg font-black uppercase text-ink truncate">{name}</h4>
                          <span className="font-mono text-[10px] text-cyan font-bold">TAG: [{tag}]</span>
                        </div>
                        <span className="font-mono text-xs text-dim">{members.length} Members</span>
                      </div>
                      <div className="space-y-1.5 font-mono text-xs">
                        {members.map((mem: any, mIdx: number) => (
                          <div key={mem.id || mIdx} className="flex items-center justify-between py-1 border-b border-white/5 text-[11px]">
                            <span className="text-ink truncate">{mem.name || mem.handle || `Player ${mIdx + 1}`}</span>
                            <span className="text-dim text-[10px] uppercase">{mIdx === 0 ? 'Captain' : 'Player'}</span>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  )
                })}
              </div>
            )
          ) : isSolo ? (
            /* Head-to-Head 1v1 Solo Contenders */
            <div className="grid gap-6 md:grid-cols-2">
              <Panel className="p-6 border-white/10">
                <div className="flex items-center gap-4">
                  {teamA.logo_url ? (
                    <DynamicImage src={resolveMediaUrl(teamA.logo_url)} alt="" className="size-16 rounded-full border border-white/20 object-cover" />
                  ) : (
                    <Crest name={teamA.name || 'Contender A'} size={64} color={g.accent} />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[10px] text-cyan uppercase font-bold tracking-wider block">SOLO CONTENDER 1</span>
                    <h3 className="font-display text-2xl font-black uppercase text-ink truncate mt-0.5">
                      {teamA.captain?.name || teamA.captain?.handle || teamA.name || 'Player 1'}
                    </h3>
                    <p className="font-mono text-xs text-dim mt-1">
                      Handle: @{teamA.captain?.handle || teamA.captain?.name || teamA.name || 'TBD'}
                    </p>
                  </div>
                </div>
              </Panel>

              <Panel className="p-6 border-white/10">
                <div className="flex items-center gap-4">
                  {teamB.logo_url ? (
                    <DynamicImage src={resolveMediaUrl(teamB.logo_url)} alt="" className="size-16 rounded-full border border-white/20 object-cover" />
                  ) : (
                    <Crest name={teamB.name || 'Contender B'} size={64} color={g.accent} />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[10px] text-cyan uppercase font-bold tracking-wider block">SOLO CONTENDER 2</span>
                    <h3 className="font-display text-2xl font-black uppercase text-ink truncate mt-0.5">
                      {teamB.captain?.name || teamB.captain?.handle || teamB.name || 'Player 2'}
                    </h3>
                    <p className="font-mono text-xs text-dim mt-1">
                      Handle: @{teamB.captain?.handle || teamB.captain?.name || teamB.name || 'TBD'}
                    </p>
                  </div>
                </div>
              </Panel>
            </div>
          ) : (
            /* Head-to-Head Team Rosters */
            <div className="grid gap-6 md:grid-cols-2">
              {/* Team A Roster */}
              <Panel className="p-6 border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    {teamA.logo_url ? (
                      <DynamicImage src={resolveMediaUrl(teamA.logo_url)} alt="" className="size-12 rounded-full border border-white/20 object-cover" />
                    ) : (
                      <Crest name={teamA.name || 'Team A'} size={48} color={g.accent} />
                    )}
                    <div>
                      <h3 className="font-display text-2xl font-black uppercase text-ink">{teamA.name || 'Team A'}</h3>
                      <span className="font-mono text-xs text-cyan uppercase font-bold">TAG: [{teamA.tag || 'TEAM'}]</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-dim">
                    {`${teamA.members?.length || 1} Registered Contenders`}
                  </span>
                </div>

                {/* Captain Bar */}
                <div className="border border-cyan/40 bg-cyan/10 p-3 mb-4 rounded font-mono text-xs">
                  <span className="text-[10px] uppercase text-cyan block font-bold">
                    TEAM LEADER / CAPTAIN:
                  </span>
                  <p className="font-display text-base font-black text-ink uppercase mt-0.5">
                    {teamA.captain?.name || teamA.captain?.handle || teamA.name || 'Contender'}
                  </p>
                  <p className="text-[11px] text-dim">
                    Handle: @{teamA.captain?.handle || teamA.captain?.name || teamA.name || 'TBD'}
                  </p>
                </div>

                {/* Player List */}
                <div className="space-y-2">
                  {(teamA.members && teamA.members.length > 0 ? teamA.members : [teamA.captain]).map((mem: any, i: number) => (
                    <div key={mem.id || i} className="flex items-center justify-between border-b border-white/5 py-2 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-cyan/60" />
                        <span className="font-bold text-ink">{mem.name || mem.handle || `Player ${i + 1}`}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-dim">@{mem.handle || mem.name}</span>
                        <span className="border border-white/10 bg-surface px-2 py-0.5 text-[10px] text-dim uppercase">
                          {mem.role || (i === 0 ? 'CAPTAIN' : 'PLAYER')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Team B Roster */}
              <Panel className="p-6 border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    {teamB.logo_url ? (
                      <DynamicImage src={resolveMediaUrl(teamB.logo_url)} alt="" className="size-12 rounded-full border border-white/20 object-cover" />
                    ) : (
                      <Crest name={teamB.name || 'Team B'} size={48} color={g.accent} />
                    )}
                    <div>
                      <h3 className="font-display text-2xl font-black uppercase text-ink">{teamB.name || 'Team B'}</h3>
                      <span className="font-mono text-xs text-cyan uppercase font-bold">TAG: [{teamB.tag || 'TEAM'}]</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-dim">
                    {`${teamB.members?.length || 1} Registered Contenders`}
                  </span>
                </div>

                {/* Captain Bar */}
                <div className="border border-cyan/40 bg-cyan/10 p-3 mb-4 rounded font-mono text-xs">
                  <span className="text-[10px] uppercase text-cyan block font-bold">
                    TEAM LEADER / CAPTAIN:
                  </span>
                  <p className="font-display text-base font-black text-ink uppercase mt-0.5">
                    {teamB.captain?.name || teamB.captain?.handle || teamB.name || 'Contender'}
                  </p>
                  <p className="text-[11px] text-dim">
                    Handle: @{teamB.captain?.handle || teamB.captain?.name || teamB.name || 'TBD'}
                  </p>
                </div>

                {/* Player List */}
                <div className="space-y-2">
                  {(teamB.members && teamB.members.length > 0 ? teamB.members : [teamB.captain]).map((mem: any, i: number) => (
                    <div key={mem.id || i} className="flex items-center justify-between border-b border-white/5 py-2 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-cyan/60" />
                        <span className="font-bold text-ink">{mem.name || mem.handle || `Player ${i + 1}`}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-dim">@{mem.handle || mem.name}</span>
                        <span className="border border-white/10 bg-surface px-2 py-0.5 text-[10px] text-dim uppercase">
                          {mem.role || (i === 0 ? 'CAPTAIN' : 'PLAYER')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}
        </section>



        {/* ========================================================================= */}
        {/* INTERACTIVE ROUND NAVIGATION & FIXTURES */}
        {/* ========================================================================= */}
        <section aria-label="Tournament Rounds and Fixtures">
          <Panel className="p-6 md:p-8 border-white/10 bg-graphite/60 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <Hud className="text-cyan">Tournament Rounds &amp; Fixtures</Hud>
                <p className="text-xs text-dim mt-1 font-mono">
                  Explore match results and fixtures across each tournament stage.
                </p>
              </div>
              {match.advancement_label && (
                <div className="border border-cyan/40 bg-cyan/10 px-3 py-1 font-mono text-[11px] text-cyan font-bold uppercase self-start sm:self-auto">
                  Advancement: {match.advancement_label}
                </div>
              )}
            </div>

            {/* Horizontal Segmented Round Selector */}
            <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-xs">
              {roundsList.map((rName) => {
                const isSelected = rName === activeRound
                return (
                  <button
                    key={rName}
                    onClick={() => setSelectedRound(rName)}
                    className={`px-4 py-2 border rounded font-bold uppercase transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan bg-cyan/20 text-cyan shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'border-white/10 bg-void/60 text-dim hover:text-ink hover:border-white/20'
                    }`}
                  >
                    {rName}
                  </button>
                )
              })}
            </div>

            {/* Matches of Selected Round */}
            <div className="mt-6">
              {roundMatches.length === 0 ? (
                <div className="border border-dashed border-white/15 bg-void/50 p-8 text-center font-mono">
                  <p className="text-sm text-dim">No fixtures configured for this round yet.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {roundMatches.map((rm) => {
                    const isCurrentMatch = String(rm.id) === String(id)
                    const rmTeamA = rm.team_a?.name || rm.team_a_name || 'Participants TBD'
                    const rmTeamB = rm.team_b?.name || rm.team_b_name || 'Participants TBD'
                    const rmLive = (rm.status || '').toUpperCase() === 'LIVE' || (rm.status || '').toUpperCase() === 'IN_PROGRESS'
                    const rmDone = (rm.status || '').toUpperCase() === 'COMPLETED'

                    return (
                      <div
                        key={rm.id}
                        className={`p-4 border transition-colors flex flex-col justify-between ${
                          isCurrentMatch
                            ? 'border-cyan bg-cyan/10'
                            : 'border-white/10 bg-void/70 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2 mb-2 font-mono text-[11px]">
                            <span className="text-dim">Match #{rm.match_number || rm.order || 1}</span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase border ${
                              rmLive ? 'border-live text-live bg-live/10' :
                              rmDone ? 'border-ok text-ok bg-ok/10' :
                              'border-white/15 text-dim'
                            }`}>
                              {rmLive ? 'Live' : rmDone ? 'Completed' : 'Scheduled'}
                            </span>
                          </div>

                          {/* Fixture participants */}
                          <div className="font-display text-sm font-bold uppercase text-ink space-y-1">
                            <p className="truncate">{rmTeamA}</p>
                            <p className="text-[10px] font-mono text-dim">VS</p>
                            <p className="truncate">{rmTeamB}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between font-mono text-xs">
                          <span className="text-dim">
                            {rm.score_a !== undefined && rm.score_b !== undefined ? `${rm.score_a} : ${rm.score_b}` : (rm.scheduled_time || 'TBD')}
                          </span>
                          {isCurrentMatch ? (
                            <span className="text-cyan font-bold text-[11px]">[ Current ]</span>
                          ) : (
                            <Link
                              to={`/matches/${rm.id}`}
                              className="font-bold uppercase text-cyan hover:text-ink transition-colors"
                            >
                              Details →
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Panel>
        </section>
      </Container>

      {isBattleRoyale && (
        <BattleRoyaleResultsModal
          isOpen={brModalOpen}
          onClose={() => setBrModalOpen(false)}
          match={match}
          onSuccess={() => {
            setBrModalOpen(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}
