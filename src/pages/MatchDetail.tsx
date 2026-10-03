import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Container, Hud, Badge, Crest, Avatar, Panel, Brackets, SectionHead } from '../components/ui'
import { gameBy, img } from '../lib/data'
import {
  getMatchById,
  captainCheckIn,
  submitMatchResult,
  submitMatchDispute,
  type ApiMatch,
} from '../services/matches'
import { useAuthContext } from '../context/AuthContext'

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
          <p className="font-display text-5xl font-black tabular-nums md:text-7xl">
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
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkInMessage, setCheckInMessage] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)

  // Modals
  const [showResultModal, setShowResultModal] = useState(false)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [submittingResult, setSubmittingResult] = useState(false)

  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeEvidence, setDisputeEvidence] = useState('')
  const [submittingDispute, setSubmittingDispute] = useState(false)

  const loadData = () => {
    setLoading(true)
    getMatchById(id)
      .then((data: any) => {
        if (data && (data.id || data._id)) {
          setMatch(data)
          if (data.score_a !== undefined) setScoreA(data.score_a)
          if (data.score_b !== undefined) setScoreB(data.score_b)
        }
      })
      .catch((err) => {
        console.error('Failed to load match detail:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-void pt-32 pb-24 text-center font-mono text-dim">
        <Container>
          <div className="inline-block size-8 animate-spin border-2 border-cyan border-t-transparent mb-4" />
          <p className="uppercase tracking-widest text-xs">Loading Match Cockpit &amp; Roster Formation...</p>
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
  const isUpcoming = rawStatus === 'SCHEDULED' || rawStatus === 'CHECK_IN_OPEN'

  const t = match.tournament || {}
  const g = gameBy(t.game_slug || match.game_slug || 'valorant')
  const streamUrl = match.youtube_live_url || match.live_link || t.live_stream_url

  const teamA = match.team_a_details || {
    id: match.team_a_id,
    name: match.team_a_name || match.team_a_placeholder || 'Team A',
    tag: 'TEAM',
    captain: { name: 'Captain', handle: match.team_a_name || 'Captain' },
    members: [],
  }

  const teamB = match.team_b_details || {
    id: match.team_b_id,
    name: match.team_b_name || match.team_b_placeholder || 'Team B',
    tag: 'TEAM',
    captain: { name: 'Captain', handle: match.team_b_name || 'Captain' },
    members: [],
  }

  const multiTeams = match.teams_details || []
  const isBattleRoyale = (t.format || '').toLowerCase().includes('battle royale') || multiTeams.length > 2

  const winnerId = match.winner_team_id
  const winnerName = isDone
    ? (winnerId === match.team_a_id ? teamA.name : winnerId === match.team_b_id ? teamB.name : null) ||
      (match.score_a !== undefined && match.score_b !== undefined && match.score_a > match.score_b ? teamA.name : teamB.name)
    : null

  const progressionRounds = match.tournament_progression || []
  const prevMatches = match.previous_matches || []
  const nextMatch = match.next_match

  const handleCheckIn = async () => {
    setCheckInLoading(true)
    setCheckInMessage('')
    try {
      const res = await captainCheckIn(id)
      setCheckInMessage(res.message || 'Check-in verified successfully!')
      loadData()
    } catch (err: any) {
      setCheckInMessage(err.message || 'Check-in failed. Are you a registered team captain?')
    } finally {
      setCheckInLoading(false)
    }
  }

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingResult(true)
    try {
      await submitMatchResult(id, {
        score_a: scoreA,
        score_b: scoreB,
        evidence_url: evidenceUrl || undefined,
      })
      setShowResultModal(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to submit score.')
    } finally {
      setSubmittingResult(false)
    }
  }

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingDispute(true)
    try {
      await submitMatchDispute(id, {
        reason: disputeReason,
        evidence_url: disputeEvidence || undefined,
      })
      setShowDisputeModal(false)
      alert('Dispute submitted for tournament arbiter review.')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to submit dispute.')
    } finally {
      setSubmittingDispute(false)
    }
  }

  return (
    <>
      {/* 1. BROADCAST HERO / TOURNAMENT INFO (Section 30) */}
      <section className="relative overflow-hidden bg-void pt-28">
        {t.banner_url ? (
          <img
            src={t.banner_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-20 filter blur-xs"
          />
        ) : (
          <img
            src={img(g.photo, 2000)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 110%, ${g.accent}44, transparent 65%), linear-gradient(to bottom, #05060acc, #05060a)`,
          }}
        />
        <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-1/2 opacity-40" />

        <Container className="relative pb-12">
          {/* Tournament Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="font-display text-sm font-black tracking-[0.2em] uppercase"
                style={{ color: g.accent }}
              >
                {t.game_name || g.name}
              </span>
              <span className="text-dim">•</span>
              <Link
                to={`/tournaments/${t.id || match.tournament_id}`}
                className="font-mono text-xs uppercase tracking-[0.18em] text-ink hover:text-cyan font-bold transition-colors"
              >
                {t.title || 'Tournament Championship'}
              </Link>
              <span className="text-dim">•</span>
              <Hud className="text-dim">
                {match.round_name || match.stage || `Round ${match.round_number || 1}`} · Match {String(match.match_number || 1).padStart(2, '0')}
              </Hud>
              {match.format && (
                <span className="border border-white/10 bg-surface/60 px-2 py-0.5 font-mono text-[10px] text-cyan uppercase font-bold">
                  {match.series_format || match.format}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
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
              <Badge
                s={isLive ? 'live' : isDone ? 'completed' : 'upcoming'}
                label={isLive ? 'Live · On Air' : isDone ? 'Final Result' : 'Scheduled'}
              />
            </div>
          </div>

          {/* 2. MATCH FORMATION HEADLINE (1v1 or Battle Royale Grid) */}
          {!isBattleRoyale ? (
            <div className="mt-12 grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-12">
              {/* Team A */}
              <div
                className={`flex flex-col items-center gap-4 text-center md:flex-row-reverse md:text-right ${
                  winnerName && winnerName !== teamA.name ? 'opacity-40' : ''
                }`}
              >
                {teamA.logo_url ? (
                  <img src={teamA.logo_url} alt="" className="size-20 rounded-full border border-white/20 object-cover" />
                ) : (
                  <Crest name={teamA.name} size={90} color={g.accent} />
                )}
                <div>
                  <h1 className="font-display text-[clamp(1.75rem,5.5vw,5rem)] font-black uppercase leading-[0.85] text-ink">
                    {teamA.name}
                  </h1>
                  <p className="mt-1 font-mono text-xs text-dim uppercase">
                    TAG: [{teamA.tag || 'TEAM'}] • CAPTAIN: @{teamA.captain?.handle || teamA.captain?.name || 'TBD'}
                  </p>
                </div>
              </div>

              {/* Score / VS Center */}
              <div className="text-center px-4">
                {match.score_a !== undefined && match.score_b !== undefined ? (
                  <p className="font-display text-[clamp(3.5rem,10vw,8.5rem)] font-black leading-none tabular-nums text-ink">
                    {match.score_a}
                    <span className={isLive ? 'text-live animate-pulse' : 'text-dim'}>:</span>
                    {match.score_b}
                  </p>
                ) : (
                  <p className="font-display text-[clamp(3.5rem,10vw,8.5rem)] font-black leading-none text-dim/50">
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
                  <img src={teamB.logo_url} alt="" className="size-20 rounded-full border border-white/20 object-cover" />
                ) : (
                  <Crest name={teamB.name} size={90} color={g.accent} />
                )}
                <div>
                  <h1 className="font-display text-[clamp(1.75rem,5.5vw,5rem)] font-black uppercase leading-[0.85] text-ink">
                    {teamB.name}
                  </h1>
                  <p className="mt-1 font-mono text-xs text-dim uppercase">
                    TAG: [{teamB.tag || 'TEAM'}] • CAPTAIN: @{teamB.captain?.handle || teamB.captain?.name || 'TBD'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-10">
              <div className="text-center mb-6">
                <span className="font-mono text-xs uppercase tracking-widest text-cyan">
                  [ MULTI-TEAM BATTLE ROYALE LOBBY ]
                </span>
                <h1 className="font-display text-4xl font-black uppercase text-ink mt-1">
                  {multiTeams.length} Competing Squads
                </h1>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {multiTeams.map((sq, i) => (
                  <Panel key={sq.id || i} className="p-3 text-center border-white/10">
                    <p className="font-display text-sm font-black uppercase truncate text-ink">{sq.name}</p>
                    <p className="font-mono text-[10px] text-cyan uppercase">TAG: [{sq.tag}]</p>
                    <p className="font-mono text-[10px] text-dim truncate">@{sq.captain?.handle || 'Captain'}</p>
                  </Panel>
                ))}
              </div>
            </div>
          )}

          {/* Quick Match Specs Bar */}
          <div className="mt-10 grid grid-cols-2 gap-px border border-white/10 bg-white/10 md:grid-cols-4 font-mono text-xs">
            <div className="bg-void/90 p-4">
              <Hud>SCHEDULED DATE</Hud>
              <p className="mt-1 font-display text-lg font-extrabold uppercase text-ink">
                {match.scheduled_date || (match.scheduled_at ? new Date(match.scheduled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD')}
              </p>
            </div>
            <div className="bg-void/90 p-4">
              <Hud>SCHEDULED TIME</Hud>
              <p className="mt-1 font-display text-lg font-extrabold uppercase text-ink">
                {match.scheduled_time || 'TBD'}
              </p>
            </div>
            <div className="bg-void/90 p-4">
              <Hud>COMPETITION FORMAT</Hud>
              <p className="mt-1 font-display text-lg font-extrabold uppercase text-cyan">
                {t.format || match.format || 'Single Elimination'}
              </p>
            </div>
            <div className="bg-void/90 p-4">
              <Hud>MATCH TELEMETRY</Hud>
              <p className="mt-1 font-display text-lg font-extrabold uppercase text-live">
                {isLive ? '🔴 BROADCAST ON AIR' : isDone ? '🏆 RESULT CONFIRMED' : '⏳ UPCOMING'}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. MATCH JOURNEY / BRACKET VISUALIZATION (Section 31) */}
      <Container className="py-8">
        <Panel className="p-6 border-white/10 bg-surface/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <Hud className="text-cyan">Tournament Progression &amp; Match Journey</Hud>
              <p className="text-xs text-dim mt-1 font-mono">
                Visual advancement pathway from qualification to championship final.
              </p>
            </div>
            {match.advancement_label && (
              <div className="border border-cyan/40 bg-cyan/10 px-3 py-1 font-mono text-[11px] text-cyan font-bold uppercase">
                Advancement: {match.advancement_label}
              </div>
            )}
          </div>

          {/* Timeline of Rounds */}
          {progressionRounds.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-6 font-mono text-xs">
              {progressionRounds.map((rnd: any, idx: number) => (
                <div key={rnd.round_name || idx} className="flex items-center gap-3">
                  <div
                    className={`px-4 py-2 border rounded transition-all ${
                      rnd.is_current
                        ? 'border-cyan bg-cyan/20 text-cyan font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'border-white/10 bg-void/60 text-dim'
                    }`}
                  >
                    <span className="text-[10px] uppercase block tracking-wider">Round {rnd.round_number}</span>
                    <span className="font-display text-sm font-black uppercase text-ink">{rnd.round_name}</span>
                  </div>
                  {idx < progressionRounds.length - 1 && (
                    <span className="text-dim/60 font-bold">──►</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upstream & Downstream Match Nodes */}
          <div className="mt-8 grid gap-4 md:grid-cols-3 font-mono text-xs">
            {/* Feeder / Previous Match */}
            <div className="border border-white/10 bg-void/80 p-4">
              <Hud className="text-dim">← PREVIOUS ROUND FEEDER</Hud>
              {prevMatches.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {prevMatches.map((pm: any) => (
                    <div key={pm.id} className="text-[11px] border-b border-white/5 pb-1">
                      <span className="text-dim">{pm.round_name} M{pm.match_number}: </span>
                      <span className="text-ink font-bold">{pm.team_a_name} vs {pm.team_b_name}</span>
                      {pm.winner_team_id && <span className="text-ok ml-1">(Winner Advanced)</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-dim text-[11px]">Opening stage fixture (Direct Seeding).</p>
              )}
            </div>

            {/* Current Match */}
            <div className="border border-cyan/60 bg-cyan/10 p-4 shadow-sm">
              <Hud className="text-cyan">★ CURRENT FIXTURE ★</Hud>
              <p className="mt-2 font-display text-sm font-black text-ink uppercase">
                {teamA.name} <span className="text-dim">VS</span> {teamB.name}
              </p>
              <p className="text-[10px] text-cyan mt-1">
                STATUS: {match.status} • {match.scheduled_time || 'TBD'}
              </p>
            </div>

            {/* Downstream / Next Match */}
            <div className="border border-white/10 bg-void/80 p-4">
              <Hud className="text-dim">NEXT ROUND DESTINATION →</Hud>
              {nextMatch ? (
                <div className="mt-2 text-[11px]">
                  <p className="font-bold text-ink">{nextMatch.round_name} · Match {nextMatch.match_number}</p>
                  <p className="text-dim mt-0.5">Slot: {nextMatch.team_a_name} vs {nextMatch.team_b_name}</p>
                </div>
              ) : (
                <p className="mt-2 text-dim text-[11px]">
                  {match.advancement_label || 'Winner advances to subsequent tournament bracket tier.'}
                </p>
              )}
            </div>
          </div>
        </Panel>
      </Container>

      {/* 4. BROADCAST STREAM OR COUNTDOWN (Section 33) */}
      <Container className="pb-10">
        {isLive ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
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
                      href={streamUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 border border-live bg-live/20 px-6 py-2.5 uppercase font-bold text-xs text-live hover:bg-live hover:text-white transition-all"
                    >
                      📺 Watch on Streaming Portal →
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Live Telemetry Panel */}
            <Panel className="p-5 font-mono text-xs">
              <Hud className="text-live">◉ Telemetry Feed</Hud>
              <div className="mt-4 space-y-3">
                <div className="border-b border-white/5 pb-2">
                  <span className="text-dim">Match Status:</span>
                  <p className="font-bold text-live">🔴 LIVE ON AIR</p>
                </div>
                <div className="border-b border-white/5 pb-2">
                  <span className="text-dim">Score:</span>
                  <p className="font-display text-lg font-black text-ink">{match.score_a ?? 0} : {match.score_b ?? 0}</p>
                </div>
                <div className="border-b border-white/5 pb-2">
                  <span className="text-dim">Server Region:</span>
                  <p className="text-ink">{match.server_region || 'AWS Mumbai (ap-south-1)'}</p>
                </div>
                <div>
                  <span className="text-dim">Format:</span>
                  <p className="text-cyan font-bold">{match.series_format || match.format || 'BO1'}</p>
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
                Arbiter Notes: "{match.captain_notes}"
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

      {/* 5. PARTICIPANT LOBBY & ACTIONS SECTION */}
      <Container className="pb-12">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Lobby Info Card */}
          <Panel className="p-6">
            <Brackets color="border-cyan/40" />
            <Hud className="text-cyan">Match Room Credentials</Hud>
            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-dim">Room ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">{match.lobby_code || 'AMT-ROOM-01'}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(match.lobby_code || 'AMT-ROOM-01')
                      setCopiedCode(true)
                      setTimeout(() => setCopiedCode(false), 1500)
                    }}
                    className="text-[10px] uppercase text-cyan hover:underline cursor-pointer"
                  >
                    {copiedCode ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-dim">Password:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">{match.lobby_password || 'PASS-99'}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(match.lobby_password || 'PASS-99')
                      setCopiedPass(true)
                      setTimeout(() => setCopiedPass(false), 1500)
                    }}
                    className="text-[10px] uppercase text-cyan hover:underline cursor-pointer"
                  >
                    {copiedPass ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dim">Server Region:</span>
                <span className="text-ink">{match.server_region || 'AWS Mumbai (ap-south-1)'}</span>
              </div>
            </div>
          </Panel>

          {/* Captain Check-in */}
          <Panel className="p-6">
            <Hud className="text-ink">Captain Check-in</Hud>
            <p className="mt-2 text-xs text-dim">
              Both team captains must signal lobby presence prior to scheduled match commencement.
            </p>
            <div className="mt-4">
              <button
                disabled={checkInLoading || isDone}
                onClick={handleCheckIn}
                className="w-full border border-cyan bg-cyan/15 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-cyan hover:bg-cyan hover:text-void transition-colors disabled:opacity-40 cursor-pointer"
              >
                {checkInLoading ? 'Verifying check-in...' : '✓ Confirm Captain Check-in'}
              </button>
            </div>
            {checkInMessage && (
              <p className="mt-2 font-mono text-[11px] text-cyan">{checkInMessage}</p>
            )}
          </Panel>

          {/* Results & Disputes */}
          <Panel className="p-6">
            <Hud className="text-ink">Roster Match Operations</Hud>
            <p className="mt-2 text-xs text-dim">
              Submit verified scoreboard screenshots, or flag competitive rule disputes.
            </p>
            <div className="mt-4 flex flex-col gap-2 font-mono text-xs">
              <button
                onClick={() => setShowResultModal(true)}
                className="border border-white/20 bg-surface px-4 py-2.5 font-bold uppercase tracking-wider text-ink hover:border-cyan hover:text-cyan transition-colors cursor-pointer"
              >
                Submit Scorecard Proof
              </button>
              <button
                onClick={() => setShowDisputeModal(true)}
                className="border border-live/40 bg-live/10 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-live hover:bg-live/20 transition-colors cursor-pointer"
              >
                Open Arbiter Dispute
              </button>
            </div>
          </Panel>
        </div>
      </Container>

      {/* 6. VERIFIED TEAM ROSTER DETAILS (Section 32) */}
      <Container className="pb-24">
        <SectionHead kicker="Verified Squads" title="Team Rosters" size="md" className="mb-8" />
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Team A Roster Card */}
          <Panel className="p-6 border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                {teamA.logo_url ? (
                  <img src={teamA.logo_url} alt="" className="size-12 rounded-full border border-white/20 object-cover" />
                ) : (
                  <Crest name={teamA.name} size={48} color={g.accent} />
                )}
                <div>
                  <h3 className="font-display text-2xl font-black uppercase text-ink">{teamA.name}</h3>
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
                  <img src={teamB.logo_url} alt="" className="size-12 rounded-full border border-white/20 object-cover" />
                ) : (
                  <Crest name={teamB.name} size={48} color={g.accent} />
                )}
                <div>
                  <h3 className="font-display text-2xl font-black uppercase text-ink">{teamB.name}</h3>
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

      {/* RESULT MODAL */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-4 font-mono">
          <Panel className="relative w-full max-w-md p-6 border-cyan/40">
            <Brackets color="border-cyan/50" />
            <h3 className="font-display text-2xl font-black uppercase text-ink">Submit Match Score</h3>
            <p className="mt-1 text-xs text-dim">Report verified match scorecard for administrative audit.</p>
            <form onSubmit={handleResultSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-dim uppercase">{teamA.name} Score</label>
                  <input
                    type="number"
                    min="0"
                    value={scoreA}
                    onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full border border-white/20 bg-void p-2.5 font-display text-xl font-bold text-ink"
                  />
                </div>
                <div>
                  <label className="text-dim uppercase">{teamB.name} Score</label>
                  <input
                    type="number"
                    min="0"
                    value={scoreB}
                    onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full border border-white/20 bg-void p-2.5 font-display text-xl font-bold text-ink"
                  />
                </div>
              </div>
              <div>
                <label className="text-dim uppercase">Proof Screenshot / Evidence URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="mt-1 w-full border border-white/20 bg-void p-2.5 text-ink"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="border border-white/20 px-4 py-2 uppercase font-bold text-dim hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResult}
                  className="border border-cyan bg-cyan/20 px-6 py-2 uppercase font-bold text-cyan hover:bg-cyan hover:text-void transition-all cursor-pointer"
                >
                  {submittingResult ? 'Submitting...' : 'Submit Result'}
                </button>
              </div>
            </form>
          </Panel>
        </div>
      )}

      {/* DISPUTE MODAL */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-4 font-mono">
          <Panel className="relative w-full max-w-md p-6 border-live/40">
            <Brackets color="border-live/50" />
            <h3 className="font-display text-2xl font-black uppercase text-live">File Match Dispute</h3>
            <p className="mt-1 text-xs text-dim">Freeze match outcome for official arbiter investigation.</p>
            <form onSubmit={handleDisputeSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-dim uppercase">Dispute Description / Grounds</label>
                <textarea
                  rows={4}
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Detail rule infractions, no-shows, or server anomalies..."
                  className="mt-1 w-full border border-white/20 bg-void p-2.5 text-ink"
                />
              </div>
              <div>
                <label className="text-dim uppercase">Evidence Link (optional)</label>
                <input
                  type="url"
                  value={disputeEvidence}
                  onChange={(e) => setDisputeEvidence(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full border border-white/20 bg-void p-2.5 text-ink"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="border border-white/20 px-4 py-2 uppercase font-bold text-dim hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="border border-live bg-live/20 px-6 py-2 uppercase font-bold text-live hover:bg-live hover:text-white transition-all cursor-pointer"
                >
                  {submittingDispute ? 'Filing...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </Panel>
        </div>
      )}
    </>
  )
}
