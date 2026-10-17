import { useEffect, useState, useCallback } from 'react'
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

export default function MatchDetail() {
  const { id = '' } = useParams()
  const { profile } = useAuthContext()

  const [loading, setLoading] = useState(true)
  const [match, setMatch] = useState<ApiMatch | null>(null)
  const [tournamentMatches, setTournamentMatches] = useState<ApiMatch[]>([])
  const [selectedRound, setSelectedRound] = useState<string>('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

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
  }, [loadData])

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

  // Normalizations
  const rawStatus = (match.status || 'SCHEDULED').toUpperCase()
  const isLive = rawStatus === 'LIVE' || rawStatus === 'IN_PROGRESS'
  const isDone = rawStatus === 'COMPLETED'

  const t = match.tournament || {}
  const g = gameBy(t.game_slug || match.game_slug || 'valorant')
  const streamUrl = match.youtube_live_url || match.live_link || t.live_stream_url

  const teamA = match.team_a_details || {
    id: match.team_a_id,
    name: match.team_a_name || match.team_a_placeholder || '',
    tag: 'TEAM',
    captain: { name: 'Captain', handle: match.team_a_name || 'Captain' },
    members: [],
  }

  const teamB = match.team_b_details || {
    id: match.team_b_id,
    name: match.team_b_name || match.team_b_placeholder || '',
    tag: 'TEAM',
    captain: { name: 'Captain', handle: match.team_b_name || 'Captain' },
    members: [],
  }

  const multiTeams = match.teams_details || match.teams || []
  const isBattleRoyale =
    (t.format || '').toLowerCase().includes('battle royale') ||
    (match.series_format || '').toLowerCase().includes('battle royale') ||
    (match.format || '').toLowerCase().includes('battle royale') ||
    (match.stage || '').toLowerCase().includes('battle royale') ||
    (match.match_type || '').toLowerCase().includes('battle_royale') ||
    multiTeams.length > 2

  const hasParticipants = Boolean(
    (teamA.name && !teamA.name.includes('(Team A)')) ||
    (teamB.name && !teamB.name.includes('(Team B)')) ||
    multiTeams.length > 0
  )

  const winnerId = match.winner_team_id
  const winnerName = isDone
    ? (winnerId === match.team_a_id ? teamA.name : winnerId === match.team_b_id ? teamB.name : null) ||
      (match.score_a !== undefined && match.score_b !== undefined && match.score_a > match.score_b ? teamA.name : teamB.name)
    : null

  // Distinct tournament rounds for interactive segmented navigation
  const progressionRounds = match.tournament_progression || []
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
  if (roundsList.length === 0) {
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

  return (
    <>
      {/* 1. HERO / TOURNAMENT HEADER */}
      <section className="relative overflow-hidden bg-void pt-28">
        <DynamicImage
          src={resolveMediaUrl(t.banner_url || (t as any).bannerUrl)}
          alt=""
          eager
          className="absolute inset-0 h-full w-full object-cover opacity-20 filter blur-xs"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 110%, ${g.accent}44, transparent 65%), linear-gradient(to bottom, #05060acc, #05060a)`,
          }}
        />
        <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-1/2 opacity-40" />

        <Container className="relative pb-10">
          {/* Header Breadcrumb: Clean compact hierarchy (Tournament Name / Round 1 / Match 01) */}
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

            {/* Optional Community Coordinator Link */}
            {t.community_link && (
              <a
                href={t.community_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded bg-emerald-500/20 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500 hover:text-white transition-all shadow-xs"
              >
                <span>💬</span>
                <span>Join {t.community_platform || 'WhatsApp'}</span>
              </a>
            )}
          </div>

          {/* 2. FORMAT-AWARE HERO */}
          {isBattleRoyale ? (
            /* Battle Royale Multi-Participant Presentation */
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 border border-cyan/40 bg-cyan/10 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-cyan mb-4">
                <span>Multi-Squad Battle Royale</span>
                <span>•</span>
                <span>{match.round_name || `Round ${match.round_number || 1}`}</span>
                <span>•</span>
                <span>Match {String(match.match_number || 1).padStart(2, '0')}</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase text-ink">
                {multiTeams.length > 0 ? `${multiTeams.length} Competing Squads` : 'Battle Royale Lobby'}
              </h1>

              {/* Status & Counts Strip */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 font-mono text-xs">
                <div className="border border-white/10 bg-surface/70 px-4 py-2">
                  <span className="text-dim block">TOTAL SQUADS</span>
                  <span className="font-display text-xl font-bold text-ink">{multiTeams.length}</span>
                </div>
                <div className="border border-white/10 bg-surface/70 px-4 py-2">
                  <span className="text-dim block">MATCH STATUS</span>
                  <span className={`font-display text-xl font-bold ${isLive ? 'text-live animate-pulse' : isDone ? 'text-ok' : 'text-cyan'}`}>
                    {rawStatus}
                  </span>
                </div>
                <div className="border border-white/10 bg-surface/70 px-4 py-2">
                  <span className="text-dim block">SERIES FORMAT</span>
                  <span className="font-display text-xl font-bold text-cyan">{match.series_format || match.format || 'Battle Royale'}</span>
                </div>
              </div>

              {/* Placements Standings if match completed, or Active Squads Grid */}
              {match.placements && match.placements.length > 0 ? (
                <div className="mt-8 max-w-4xl mx-auto overflow-hidden border border-white/10 bg-surface/40">
                  <div className="bg-void/80 px-4 py-2 text-left font-mono text-xs font-bold text-cyan uppercase border-b border-white/10">
                    Official Round Standings &amp; Points
                  </div>
                  <div className="divide-y divide-white/5 font-mono text-xs">
                    {match.placements.map((pl: any, idx: number) => (
                      <div key={pl.team_id || idx} className="grid grid-cols-[60px_1fr_80px_80px_90px] items-center p-3 text-left">
                        <span className={`font-bold ${idx === 0 ? 'text-amber-400 font-display text-base' : 'text-dim'}`}>
                          #{pl.placement || idx + 1}
                        </span>
                        <span className="font-bold text-ink uppercase truncate">{pl.team_name}</span>
                        <span className="text-dim">Kills: <strong className="text-ink">{pl.kills ?? 0}</strong></span>
                        <span className="text-dim">Place Pts: <strong className="text-ink">{pl.placement_points ?? 0}</strong></span>
                        <span className="text-right text-cyan font-bold">{pl.total_points ?? 0} PTS</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : multiTeams.length > 0 ? (
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
                  {multiTeams.map((sq: any, i: number) => (
                    <Panel key={sq.id || i} className="p-3 text-center border-white/10 bg-surface/60">
                      <p className="font-display text-sm font-black uppercase truncate text-ink">{sq.name || sq.team_name}</p>
                      <p className="font-mono text-[10px] text-cyan uppercase">TAG: [{sq.tag || 'SQ'}]</p>
                      <p className="font-mono text-[10px] text-dim truncate mt-1">@{sq.captain?.handle || sq.captain?.name || 'Captain'}</p>
                    </Panel>
                  ))}
                </div>
              ) : (
                <div className="mt-8 p-8 border border-dashed border-white/15 bg-void/40 max-w-lg mx-auto">
                  <p className="font-display text-xl font-bold uppercase text-dim">Participants TBD</p>
                  <p className="font-mono text-xs text-dim/70 mt-1">Squad assignments for this battle royale lobby are pending arbiter configuration.</p>
                </div>
              )}
            </div>
          ) : !hasParticipants ? (
            /* Genuine Head-to-Head with Participants TBD */
            <div className="mt-12 text-center py-8">
              <div className="inline-block border border-white/15 bg-void/60 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-dim mb-4">
                {match.round_name || `Round ${match.round_number || 1}`} · Match {String(match.match_number || 1).padStart(2, '0')}
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-black uppercase text-ink">
                Participants TBD
              </h1>
              <p className="mt-2 font-mono text-xs text-dim max-w-md mx-auto">
                Competing rosters for this fixture will be determined upon completion of preceding bracket matches.
              </p>
            </div>
          ) : (
            /* Genuine Head-to-Head Match with Known Participants */
            <div className="mt-12 grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-12">
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
                  <h1 className="font-display text-[clamp(1.5rem,4.5vw,4.25rem)] font-black uppercase leading-[0.88] text-ink break-words">
                    {teamA.name || 'TBD'}
                  </h1>
                  <p className="mt-1 font-mono text-xs text-dim uppercase">
                    TAG: [{teamA.tag || 'TEAM'}] • CAPTAIN: @{teamA.captain?.handle || teamA.captain?.name || 'TBD'}
                  </p>
                </div>
              </div>

              {/* Score / VS Center */}
              <div className="text-center px-4">
                {match.score_a !== undefined && match.score_b !== undefined ? (
                  <p className="font-display text-[clamp(3rem,8vw,7rem)] font-black leading-none tabular-nums text-ink">
                    {match.score_a}
                    <span className={isLive ? 'text-live animate-pulse' : 'text-dim'}>:</span>
                    {match.score_b}
                  </p>
                ) : (
                  <p className="font-display text-[clamp(3rem,8vw,7rem)] font-black leading-none text-dim/50">
                    VS
                  </p>
                )}
                <div className="mt-2 inline-flex items-center gap-2 border border-white/10 bg-void/80 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-cyan">
                  <span>{match.round_name || `Round ${match.round_number || 1}`}</span>
                  <span>•</span>
                  <span>{match.series_format || match.format || 'BO1'}</span>
                </div>
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
                  <h1 className="font-display text-[clamp(1.5rem,4.5vw,4.25rem)] font-black uppercase leading-[0.88] text-ink break-words">
                    {teamB.name || 'TBD'}
                  </h1>
                  <p className="mt-1 font-mono text-xs text-dim uppercase">
                    TAG: [{teamB.tag || 'TEAM'}] • CAPTAIN: @{teamB.captain?.handle || teamB.captain?.name || 'TBD'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. INFORMATION STRIP (Dynamic Schedule, Competition Format, Match Status with Admin Editor) */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px border border-white/10 bg-white/10 font-mono text-xs">
            {/* 1. Scheduled Date */}
            <div className="bg-void/90 p-4">
              <Hud>SCHEDULED DATE</Hud>
              <p className="mt-1 font-display text-lg font-extrabold uppercase text-ink">
                {match.scheduled_date || (match.scheduled_at ? new Date(match.scheduled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not Scheduled')}
              </p>
            </div>

            {/* 2. Scheduled Time */}
            <div className="bg-void/90 p-4">
              <Hud>SCHEDULED TIME</Hud>
              <p className="mt-1 font-display text-lg font-extrabold uppercase text-ink">
                {match.scheduled_time || (match.scheduled_at ? new Date(match.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Not Scheduled')}
              </p>
            </div>

            {/* 3. Competition Format */}
            <div className="bg-void/90 p-4">
              <Hud>COMPETITION FORMAT</Hud>
              <p className="mt-1 font-display text-lg font-extrabold uppercase text-cyan truncate">
                {t.format || match.format || 'Single Elimination'}
              </p>
            </div>

            {/* 4. Match Status (renamed from Match Telemetry, without red dot, with admin status selector) */}
            <div className="bg-void/90 p-4">
              <Hud>MATCH STATUS</Hud>
              <div className="mt-1 flex items-center justify-between gap-2">
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={rawStatus}
                      disabled={updatingStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="border border-cyan/40 bg-void px-2.5 py-1 font-mono text-xs font-bold text-cyan uppercase cursor-pointer hover:border-cyan focus:outline-none"
                    >
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="CHECK_IN_OPEN">CHECK-IN OPEN</option>
                      <option value="LIVE">LIVE ON AIR</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                    {updatingStatus && <span className="size-3 animate-spin border-2 border-cyan border-t-transparent inline-block" />}
                  </div>
                ) : (
                  <p className={`font-display text-lg font-extrabold uppercase ${isLive ? 'text-live' : isDone ? 'text-ok' : 'text-cyan'}`}>
                    {isLive ? 'LIVE ON AIR' : isDone ? 'RESULT CONFIRMED' : rawStatus === 'CHECK_IN_OPEN' ? 'CHECK-IN OPEN' : 'SCHEDULED'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. INTERACTIVE ROUND NAVIGATION & FIXTURES */}
      <Container className="py-8">
        <Panel className="p-6 border-white/10 bg-surface/60">
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
                <p className="text-sm text-dim">No matches have been created for this round yet.</p>
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
      </Container>

      {/* 5. BROADCAST STREAM OR COUNTDOWN */}
      <Container className="pb-12">
        {isLive ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="group relative aspect-video overflow-hidden border border-live/60 bg-black shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              {getYoutubeEmbedUrl(streamUrl) ? (
                <iframe
                  src={getYoutubeEmbedUrl(streamUrl)!}
                  title="Official Broadcast Stream"
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="relative h-full w-full flex flex-col items-center justify-center bg-black/90 p-8 text-center font-mono">
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
            <Panel className="p-5 font-mono text-xs">
              <Hud className="text-live">Broadcast Telemetry</Hud>
              <div className="mt-4 space-y-3">
                <div className="border-b border-white/5 pb-2">
                  <span className="text-dim">Match Status:</span>
                  <p className="font-bold text-live mt-0.5">LIVE ON AIR</p>
                </div>
                <div className="border-b border-white/5 pb-2">
                  <span className="text-dim">Current Score:</span>
                  <p className="font-display text-lg font-black text-ink mt-0.5">{match.score_a ?? 0} : {match.score_b ?? 0}</p>
                </div>
                <div>
                  <span className="text-dim">Match Format:</span>
                  <p className="text-cyan font-bold mt-0.5">{match.series_format || match.format || 'BO1'}</p>
                </div>
              </div>
            </Panel>
          </div>
        ) : isDone ? (
          <Panel className="overflow-hidden p-8 text-center md:p-14 border-ok/40 bg-ok/5">
            <Brackets color="border-ok/40" />
            <Hud className="text-ok">Official Match Result Verified</Hud>
            <div className="mt-4">
              <h2 className="font-display text-5xl font-black uppercase md:text-7xl text-ink">
                {winnerName || 'Winner Decided'}
              </h2>
              <p className="mt-2 font-display text-2xl font-black text-dim">
                Final Score: {match.score_a ?? 0} — {match.score_b ?? 0}
              </p>
            </div>
            {match.captain_notes && (
              <p className="mt-4 font-mono text-xs text-dim italic">
                Arbiter Notes: &quot;{match.captain_notes}&quot;
              </p>
            )}
          </Panel>
        ) : (
          <Panel className="p-8 text-center md:p-14 border-white/10">
            <Brackets color="border-cyan/50" />
            <Hud className="text-cyan">Match Countdown Timer</Hud>
            <div className="mt-6">
              <Countdown targetIso={match.scheduled_at} />
            </div>
          </Panel>
        )}
      </Container>

      {/* 6. VERIFIED TEAM ROSTERS (Section 32) */}
      <Container className="pb-24">
        <SectionHead kicker="Verified Squads" title="Team Rosters" size="md" className="mb-8" />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Team A Roster Card */}
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
                {teamA.members?.length || 1} Registered Contenders
              </span>
            </div>

            {/* Captain Bar */}
            <div className="border border-cyan/40 bg-cyan/10 p-3 mb-4 rounded font-mono text-xs">
              <span className="text-[10px] uppercase text-cyan block font-bold">TEAM LEADER / CAPTAIN:</span>
              <p className="font-display text-base font-black text-ink uppercase mt-0.5">
                {teamA.captain?.name || teamA.captain?.handle || 'Captain'}
              </p>
              <p className="text-[11px] text-dim">
                Handle: @{teamA.captain?.handle || teamA.captain?.name || 'TBD'}
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

          {/* Team B Roster Card */}
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
                {teamB.members?.length || 1} Registered Contenders
              </span>
            </div>

            {/* Captain Bar */}
            <div className="border border-cyan/40 bg-cyan/10 p-3 mb-4 rounded font-mono text-xs">
              <span className="text-[10px] uppercase text-cyan block font-bold">TEAM LEADER / CAPTAIN:</span>
              <p className="font-display text-base font-black text-ink uppercase mt-0.5">
                {teamB.captain?.name || teamB.captain?.handle || 'Captain'}
              </p>
              <p className="text-[11px] text-dim">
                Handle: @{teamB.captain?.handle || teamB.captain?.name || 'TBD'}
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
      </Container>
    </>
  )
}
