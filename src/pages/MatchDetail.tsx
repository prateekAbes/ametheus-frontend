import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Container, Hud, Badge, Crest, Avatar, Panel, Brackets, SectionHead, Cta } from '../components/ui'
import { matchBy, gameBy, tourBy, img, AVATARS, MATCHES, type Match as StaticMatch } from '../lib/data'
import { getMatchById, captainCheckIn, submitMatchResult, submitMatchDispute, mapApiMatchToUiMatch } from '../services/matches'
import { useAuthContext } from '../context/AuthContext'

const NAMES = [
  ['VYRUS', 'KAALI.X', 'ZER0DAY', 'NEONRANI', 'BHAIJAAN'],
  ['OMEN.IN', 'RAZORX', 'SPECTRE', 'MAVI', 'TORQUE'],
]
const ROLES = ['Captain · IGL', 'Entry', 'Support', 'Sniper', 'Flex']

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
  const [matchData, setMatchData] = useState<any>(null)
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

  useEffect(() => {
    let mounted = true
    setLoading(true)

    getMatchById(id)
      .then((data) => {
        if (!mounted) return
        if (data && data.id) {
          setMatchData(mapApiMatchToUiMatch(data))
        } else {
          setMatchData(matchBy(id))
        }
      })
      .catch(() => {
        if (mounted) {
          setMatchData(matchBy(id))
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [id])

  const m: StaticMatch & {
    tourName?: string
    liveLink?: string
    lobbyCode?: string
    lobbyPassword?: string
    serverRegion?: string
    checkInStatus?: { team_a?: boolean; team_b?: boolean }
  } = matchData || matchBy(id)

  const g = gameBy(m.game)
  const t = tourBy(m.tour)
  const live = m.status === 'live'
  const done = m.status === 'completed'
  const [sa, sb] = m.score ?? [0, 0]

  const maps =
    g.genre === 'Battle Royale'
      ? ['Bermuda', 'Purgatory', 'Kalahari']
      : g.slug === 'valorant'
      ? ['Ascent', 'Bind', 'Haven']
      : ['Firing Range', 'Standoff', 'Raid']

  const breakdown = maps.map((map, i) => {
    const played = done ? i < sa + sb : live ? i <= sa + sb : false
    const cur = live && i === sa + sb
    const aw = i < sa
    return {
      map,
      played,
      cur,
      a: !played ? '—' : cur ? 9 : aw ? 13 : 8 + i,
      b: !played ? '—' : cur ? 7 : aw ? 9 + i : 13,
    }
  })

  const h2h = MATCHES.filter((x) => x.id !== m.id && x.status === 'completed').slice(0, 3)
  const winner = done ? (sa > sb ? m.a : m.b) : null

  const handleCheckIn = async () => {
    setCheckInLoading(true)
    setCheckInMessage('')
    try {
      const res = await captainCheckIn(id)
      setCheckInMessage(res.message || 'Check-in confirmed!')
      // Refresh match state
      const updated = await getMatchById(id)
      if (updated) setMatchData(mapApiMatchToUiMatch(updated))
    } catch (err: any) {
      setCheckInMessage(err.message || 'Check-in failed. Are you a registered team member?')
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
      const updated = await getMatchById(id)
      if (updated) setMatchData(mapApiMatchToUiMatch(updated))
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
      alert('Dispute submitted. A tournament arbiter has been assigned to review.')
    } catch (err: any) {
      alert(err.message || 'Failed to submit dispute.')
    } finally {
      setSubmittingDispute(false)
    }
  }

  return (
    <>
      {/* BROADCAST HEADER */}
      <section className="relative overflow-hidden bg-void pt-28">
        <img
          src={img(g.photo, 2000)}
          alt=""
          className="kenburns absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 110%, ${g.accent}55, transparent 60%), linear-gradient(to bottom, #05060acc, #05060a)`,
          }}
        />
        <div className="grid-floor absolute -inset-x-1/2 bottom-0 h-1/2 opacity-50" />
        <Container className="relative pb-14">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="font-display text-sm font-black tracking-[0.2em]"
                style={{ color: g.accent }}
              >
                {g.short}
              </span>
              <Link
                to={`/tournaments/${t.id}`}
                className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink hover:text-cyan"
              >
                {m.tourName || t.name}
              </Link>
              <Hud>
                · {m.round} · Match {String(m.no).padStart(2, '0')}
              </Hud>
            </div>
            <Badge s={m.status} label={live ? 'Live · On Air' : undefined} />
          </div>

          <div className="mt-12 grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-12">
            <div
              className={`flex flex-col items-center gap-4 text-center md:flex-row-reverse md:text-right ${
                winner && winner !== m.a ? 'opacity-50' : ''
              }`}
            >
              <Crest name={m.a} size={110} color={g.accent} />
              <h1 className="reveal font-display text-[clamp(2rem,7vw,7rem)] font-black uppercase leading-[0.8]">
                {m.a}
              </h1>
            </div>
            <div className="text-center">
              {m.score ? (
                <p className="font-display text-[clamp(4rem,12vw,11rem)] font-black leading-none tabular-nums">
                  {sa}
                  <span className={live ? 'text-live' : 'text-dim'}>:</span>
                  {sb}
                </p>
              ) : (
                <p className="outline-text font-display text-[clamp(4rem,12vw,11rem)] font-black leading-none">
                  VS
                </p>
              )}
              <Hud className="block">{m.format}</Hud>
            </div>
            <div
              className={`flex flex-col items-center gap-4 text-center md:flex-row md:text-left ${
                winner && winner !== m.b ? 'opacity-50' : ''
              }`}
            >
              <Crest name={m.b} size={110} color={g.accent} />
              <h1 className="reveal font-display text-[clamp(2rem,7vw,7rem)] font-black uppercase leading-[0.8]">
                {m.b}
              </h1>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-px border border-white/10 bg-white/10 md:grid-cols-4">
            {[
              ['Date', m.date],
              ['Time', m.time],
              ['Format', m.format],
              ['Status', m.status],
            ].map(([k, v]) => (
              <div key={k} className="bg-void/80 p-4">
                <Hud>{k}</Hud>
                <p className="mt-1 font-display text-xl font-extrabold uppercase">{v}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* LOBBY & ACTIONS SECTION */}
      <Container className="pt-8 pb-10">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Lobby Info Card */}
          <Panel className="p-6">
            <Brackets color="border-cyan/40" />
            <Hud className="text-cyan">Match Room Lobbies</Hud>
            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-dim">Room ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">{m.lobbyCode || 'AMT-ROOM-01'}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(m.lobbyCode || 'AMT-ROOM-01')
                      setCopiedCode(true)
                      setTimeout(() => setCopiedCode(false), 1500)
                    }}
                    className="text-[10px] uppercase text-cyan hover:underline"
                  >
                    {copiedCode ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-dim">Password:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">{m.lobbyPassword || 'PASS-99'}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(m.lobbyPassword || 'PASS-99')
                      setCopiedPass(true)
                      setTimeout(() => setCopiedPass(false), 1500)
                    }}
                    className="text-[10px] uppercase text-cyan hover:underline"
                  >
                    {copiedPass ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dim">Server Region:</span>
                <span className="text-ink">{m.serverRegion || 'AWS Mumbai (ap-south-1)'}</span>
              </div>
            </div>
          </Panel>

          {/* Captain Check-in */}
          <Panel className="p-6">
            <Hud className="text-ink">Captain Check-in</Hud>
            <p className="mt-2 text-xs text-dim">
              Both team captains must check in prior to match start to signal lobby readiness.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                disabled={checkInLoading || done}
                onClick={handleCheckIn}
                className="w-full border border-cyan bg-cyan/10 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-cyan hover:bg-cyan hover:text-void transition-colors disabled:opacity-40"
              >
                {checkInLoading ? 'Checking in...' : '✓ Confirm Check-in'}
              </button>
            </div>
            {checkInMessage && (
              <p className="mt-2 font-mono text-[11px] text-cyan">{checkInMessage}</p>
            )}
          </Panel>

          {/* Results & Disputes */}
          <Panel className="p-6">
            <Hud className="text-ink">Match Actions</Hud>
            <p className="mt-2 text-xs text-dim">
              Report verified scores with screenshot proof, or initiate an arbiter dispute.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => setShowResultModal(true)}
                className="border border-white/20 bg-surface px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider hover:border-cyan hover:text-cyan transition-colors"
              >
                Submit Match Score
              </button>
              <button
                onClick={() => setShowDisputeModal(true)}
                className="border border-live/30 bg-live/5 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-live hover:bg-live/15 transition-colors"
              >
                File Dispute / Arbiter Review
              </button>
            </div>
          </Panel>
        </div>
      </Container>

      {/* STAGE & VIDEO STREAM */}
      <Container className="py-10">
        {live ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="group relative aspect-video overflow-hidden border border-live/40 bg-black">
              {getYoutubeEmbedUrl(m.liveLink) ? (
                <iframe
                  src={getYoutubeEmbedUrl(m.liveLink)!}
                  title="Live Stream"
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <img
                    src={img(g.photo, 1600)}
                    alt=""
                    className="h-full w-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
                  <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                    <Badge s="live" label="Live · Broadcast" />
                    <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 font-display text-lg font-black">
                      <span>{m.a.split(' ')[1] ?? m.a}</span>
                      <span style={{ color: g.accent }}>
                        {sa} : {sb}
                      </span>
                      <span>{m.b.split(' ')[1] ?? m.b}</span>
                    </div>
                  </div>
                  <button
                    aria-label="Play"
                    className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/40 text-3xl transition-transform group-hover:scale-110"
                  >
                    ▶
                  </button>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="h-1 bg-white/20">
                      <div className="h-full w-[64%] bg-live" />
                    </div>
                    <div className="mt-3 flex justify-between font-mono text-xs text-ink/80">
                      <span>❚❚ &nbsp; 🔊 &nbsp; LIVE</span>
                      <span>1080p60 · ⚙ · ⛶</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <Panel className="p-5">
              <Hud className="text-live">◉ Live feed</Hud>
              <ul className="mt-4 space-y-3 font-mono text-xs">
                {[
                  `${NAMES[0][1]} eliminated ${NAMES[1][2]}`,
                  `${m.a} secured first blood`,
                  `${NAMES[1][0]} clutched a 1v2`,
                  `${NAMES[0][3]} sniper tag · 240m`,
                  'Round point awarded to ' + m.a,
                ].map((x, i) => (
                  <li key={i} className="flex gap-3 border-b border-white/5 pb-3">
                    <span className="text-dim">{`0${i + 1}:4${i}`}</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        ) : done ? (
          <Panel className="overflow-hidden p-10 text-center md:p-16">
            <Brackets color="border-white/30" />
            <Hud className="text-ok">Final · Verified Result</Hud>
            <div className="mt-6 flex justify-center">
              <Crest name={winner!} size={96} color={g.accent} />
            </div>
            <p className="mt-6 font-display text-6xl font-black uppercase md:text-8xl">{winner}</p>
            <p className="mt-2 font-display text-2xl font-black text-dim">
              wins {Math.max(sa, sb)}–{Math.min(sa, sb)}
            </p>
          </Panel>
        ) : (
          <Panel className="p-10 text-center md:p-16">
            <Brackets color="border-cyan/50" />
            <Hud className="text-cyan">Lobby opens in</Hud>
            <div className="mt-8">
              <Countdown />
            </div>
            <div className="mt-10">
              <Cta small to={`/tournaments/${t.id}`}>
                Tournament Hub
              </Cta>
            </div>
          </Panel>
        )}
      </Container>

      {/* ROSTERS */}
      <Container className="pb-16">
        <SectionHead kicker="Line-ups" title="Rosters" size="md" className="mb-10" />
        <div className="grid gap-6 md:grid-cols-2">
          {[m.a, m.b].map((team, ti) => (
            <Panel key={team} className="p-6">
              <div className="mb-5 flex items-center gap-4 border-b border-white/10 pb-5">
                <Crest name={team} size={48} color={g.accent} />
                <p className="font-display text-3xl font-black uppercase">{team}</p>
              </div>
              <ul className="space-y-3">
                {NAMES[ti].map((p, i) => (
                  <li key={p} className="flex items-center gap-4">
                    <Avatar id={AVATARS[(i + ti * 2) % 5]} size={44} />
                    <div className="flex-1">
                      <p className="font-display text-xl font-black">{p}</p>
                      <Hud>{ROLES[i]}</Hud>
                    </div>
                    <span className="font-mono text-xs text-dim">
                      K/D {(1.8 - i * 0.2 + ti * 0.1).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      </Container>

      {/* BREAKDOWN + INFO */}
      <Container className="grid gap-10 pb-24 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionHead kicker="Map by map" title="Breakdown" size="md" className="mb-8" />
          <div className="divide-y divide-white/10 border-y border-white/10">
            {breakdown.map((r, i) => (
              <div
                key={r.map}
                className={`grid grid-cols-[auto_1fr_auto] items-center gap-5 py-5 ${
                  r.played ? '' : 'opacity-40'
                }`}
              >
                <Hud className="w-16">Map {i + 1}</Hud>
                <div className="flex items-center gap-3">
                  <span className="font-display text-2xl font-black uppercase">{r.map}</span>
                  {r.cur && <Badge s="live" />}
                </div>
                <span className="font-display text-3xl font-black tabular-nums">
                  {r.a}
                  <span className="mx-2 text-dim">:</span>
                  {r.b}
                </span>
              </div>
            ))}
          </div>
          <SectionHead kicker="Head to head" title="History" size="md" className="mb-8 mt-16" />
          <div className="space-y-2">
            {h2h.map((x) => (
              <Link
                key={x.id}
                to={`/matches/${x.id}`}
                className="flex items-center justify-between border border-white/10 p-4 hover:border-white/30"
              >
                <span className="font-display text-lg font-black uppercase">
                  {x.a} <span className="text-dim">vs</span> {x.b}
                </span>
                <span className="font-mono text-sm tabular-nums">
                  {x.score?.join(' : ')} · {x.date}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <Panel className="h-fit p-6">
          <Hud className="text-ink">Match Information</Hud>
          <dl className="mt-5 space-y-4">
            {[
              ['Tournament', m.tourName || t.name],
              ['Game', g.name],
              ['Round', m.round],
              ['Match No.', String(m.no)],
              ['Format', m.format],
              ['Region', m.serverRegion || t.region],
              ['Server', 'Mumbai · 18ms'],
              ['Result', done ? `${winner} won` : live ? 'In progress' : 'Pending'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-white/5 pb-3">
                <dt className="text-dim">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </Container>

      {/* RESULT MODAL */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-4">
          <Panel className="relative w-full max-w-md p-6">
            <Brackets color="border-cyan/50" />
            <h3 className="font-display text-2xl font-black uppercase">Submit Match Result</h3>
            <p className="mt-1 text-xs text-dim">Enter the final score verified by both teams.</p>
            <form onSubmit={handleResultSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dim">{m.a} Score</label>
                  <input
                    type="number"
                    min="0"
                    value={scoreA}
                    onChange={(e) => setScoreA(Number(e.target.value))}
                    className="mt-1 w-full border border-white/20 bg-void p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs text-dim">{m.b} Score</label>
                  <input
                    type="number"
                    min="0"
                    value={scoreB}
                    onChange={(e) => setScoreB(Number(e.target.value))}
                    className="mt-1 w-full border border-white/20 bg-void p-2 font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-dim">Screenshot Proof URL</label>
                <input
                  type="url"
                  placeholder="https://imgur.com/... or cloud image"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="mt-1 w-full border border-white/20 bg-void p-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="border border-white/10 px-4 py-2 text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResult}
                  className="border border-cyan bg-cyan px-4 py-2 font-mono text-xs font-bold uppercase text-void"
                >
                  {submittingResult ? 'Submitting...' : 'Submit Score'}
                </button>
              </div>
            </form>
          </Panel>
        </div>
      )}

      {/* DISPUTE MODAL */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-4">
          <Panel className="relative w-full max-w-md p-6">
            <Brackets color="border-live/50" />
            <h3 className="font-display text-2xl font-black uppercase text-live">File Match Dispute</h3>
            <p className="mt-1 text-xs text-dim">
              Explain the violation or scoring error. An arbiter will review the match logs.
            </p>
            <form onSubmit={handleDisputeSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-dim">Reason / Description</label>
                <textarea
                  required
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe what occurred (e.g., unauthorized player, cheating, disconnect)..."
                  className="mt-1 w-full border border-white/20 bg-void p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-dim">Evidence URL (Optional)</label>
                <input
                  type="url"
                  value={disputeEvidence}
                  onChange={(e) => setDisputeEvidence(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full border border-white/20 bg-void p-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="border border-white/10 px-4 py-2 text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="border border-live bg-live px-4 py-2 font-mono text-xs font-bold uppercase text-white"
                >
                  {submittingDispute ? 'Submitting...' : 'Confirm Dispute'}
                </button>
              </div>
            </form>
          </Panel>
        </div>
      )}
    </>
  )
}
